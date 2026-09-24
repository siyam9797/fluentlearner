/**
 * Data access and marking for IELTS mock tests.
 */
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  appUsers,
  batches,
  courses,
  enrollments,
  learningResources,
  mockAnswers,
  mockAttempts,
  mockQuestions,
  mockSections,
  mockTests,
  vocabularyWords,
  type InsertLearningResource,
  type InsertVocabularyWord,
  type MockAttempt,
  type MockQuestion,
  type MockTest,
} from "./database/schema";
import { getDb } from "./db";
import {
  AUTO_MARKED_TYPES,
  bandFromRawScore,
  isAnswerCorrect,
  isAutoMarkedModule,
  overallFromCriteria,
  type MockModule,
  type MockQuestionType,
} from "@shared/mock";

/** Seconds of network slack allowed after a timed attempt's deadline. */
const DEADLINE_GRACE_MS = 30_000;

async function db() {
  const database = await getDb();
  if (!database)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  return database;
}

// ============================================
// Test structure
// ============================================

export type QuestionInput = {
  id?: number;
  type: MockQuestionType;
  prompt: string;
  options?: string[] | null;
  answers?: string[] | null;
  explanation?: string | null;
  points?: number;
  minWords?: number | null;
  prepSeconds?: number | null;
  responseSeconds?: number | null;
};

export type SectionInput = {
  id?: number;
  title: string;
  instructions?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  questions: QuestionInput[];
};

export type TestInput = {
  title: string;
  description?: string | null;
  module: MockModule;
  variant: "academic" | "general";
  mode: "exam" | "practice";
  durationMinutes?: number | null;
  maxAttempts?: number | null;
  isPublished: boolean;
  sortOrder?: number;
  format?: "full" | "answer_sheet";
  series?: string | null;
  bookNumber?: number | null;
  testNumber?: number | null;
};

export async function listTestsWithStats() {
  const database = await db();
  const tests = await database
    .select()
    .from(mockTests)
    .orderBy(asc(mockTests.sortOrder), desc(mockTests.createdAt));
  const questionCounts = await database
    .select({ testId: mockQuestions.testId, n: sql<number>`count(*)` })
    .from(mockQuestions)
    .groupBy(mockQuestions.testId);
  const attemptCounts = await database
    .select({
      testId: mockAttempts.testId,
      total: sql<number>`count(*)`,
      awaiting: sql<number>`sum(case when ${mockAttempts.status} = 'submitted' then 1 else 0 end)`,
    })
    .from(mockAttempts)
    .groupBy(mockAttempts.testId);
  return tests.map(test => ({
    ...test,
    questionCount: Number(
      questionCounts.find(q => q.testId === test.id)?.n ?? 0
    ),
    attemptCount: Number(
      attemptCounts.find(a => a.testId === test.id)?.total ?? 0
    ),
    awaitingGrading: Number(
      attemptCounts.find(a => a.testId === test.id)?.awaiting ?? 0
    ),
  }));
}

export async function getTestTree(testId: number) {
  const database = await db();
  const [test] = await database
    .select()
    .from(mockTests)
    .where(eq(mockTests.id, testId))
    .limit(1);
  if (!test) return null;
  const sections = await database
    .select()
    .from(mockSections)
    .where(eq(mockSections.testId, testId))
    .orderBy(asc(mockSections.sortOrder), asc(mockSections.id));
  const questions = await database
    .select()
    .from(mockQuestions)
    .where(eq(mockQuestions.testId, testId))
    .orderBy(asc(mockQuestions.sortOrder), asc(mockQuestions.id));
  return {
    ...test,
    sections: sections.map(section => ({
      ...section,
      questions: questions.filter(q => q.sectionId === section.id),
    })),
  };
}

/**
 * Create or update a test with all its sections and questions.
 * Existing rows keep their IDs so earlier student answers stay linked.
 */
export async function saveTestTree(
  testId: number | null,
  test: TestInput,
  sections: SectionInput[]
) {
  const database = await db();
  return database.transaction(async tx => {
    let id = testId;
    const testValues = {
      title: test.title,
      description: test.description ?? null,
      module: test.module,
      variant: test.variant,
      mode: test.mode,
      durationMinutes: test.durationMinutes ?? null,
      maxAttempts: test.maxAttempts ?? null,
      isPublished: test.isPublished,
      sortOrder: test.sortOrder ?? 0,
      format: test.format ?? "full",
      series: test.series || null,
      bookNumber: test.series ? (test.bookNumber ?? null) : null,
      testNumber: test.series ? (test.testNumber ?? null) : null,
    };
    if (id) {
      await tx.update(mockTests).set(testValues).where(eq(mockTests.id, id));
    } else {
      const [result] = await tx.insert(mockTests).values(testValues);
      id = result.insertId;
    }

    const existingSections = await tx
      .select({ id: mockSections.id })
      .from(mockSections)
      .where(eq(mockSections.testId, id));
    const existingQuestions = await tx
      .select({ id: mockQuestions.id })
      .from(mockQuestions)
      .where(eq(mockQuestions.testId, id));
    const keptSectionIds = new Set<number>();
    const keptQuestionIds = new Set<number>();

    for (const [sectionIndex, section] of sections.entries()) {
      const sectionValues = {
        testId: id,
        title: section.title,
        instructions: section.instructions ?? null,
        content: section.content ?? null,
        imageUrl: section.imageUrl ?? null,
        audioUrl: section.audioUrl ?? null,
        sortOrder: sectionIndex,
      };
      let sectionId =
        section.id && existingSections.some(s => s.id === section.id)
          ? section.id
          : null;
      if (sectionId) {
        await tx
          .update(mockSections)
          .set(sectionValues)
          .where(eq(mockSections.id, sectionId));
      } else {
        const [result] = await tx.insert(mockSections).values(sectionValues);
        sectionId = result.insertId;
      }
      keptSectionIds.add(sectionId);

      for (const [questionIndex, question] of section.questions.entries()) {
        const questionValues = {
          testId: id,
          sectionId,
          type: question.type,
          prompt: question.prompt,
          options: question.options ?? null,
          answers: question.answers ?? null,
          explanation: question.explanation ?? null,
          points: question.points ?? 1,
          minWords: question.minWords ?? null,
          prepSeconds: question.prepSeconds ?? null,
          responseSeconds: question.responseSeconds ?? null,
          sortOrder: questionIndex,
        };
        let questionId =
          question.id && existingQuestions.some(q => q.id === question.id)
            ? question.id
            : null;
        if (questionId) {
          await tx
            .update(mockQuestions)
            .set(questionValues)
            .where(eq(mockQuestions.id, questionId));
        } else {
          const [result] = await tx
            .insert(mockQuestions)
            .values(questionValues);
          questionId = result.insertId;
        }
        keptQuestionIds.add(questionId);
      }
    }

    const removedQuestions = existingQuestions
      .map(q => q.id)
      .filter(qid => !keptQuestionIds.has(qid));
    if (removedQuestions.length) {
      await tx
        .delete(mockAnswers)
        .where(inArray(mockAnswers.questionId, removedQuestions));
      await tx
        .delete(mockQuestions)
        .where(inArray(mockQuestions.id, removedQuestions));
    }
    const removedSections = existingSections
      .map(s => s.id)
      .filter(sid => !keptSectionIds.has(sid));
    if (removedSections.length)
      await tx
        .delete(mockSections)
        .where(inArray(mockSections.id, removedSections));

    return id;
  });
}

export async function deleteTest(testId: number) {
  const database = await db();
  await database.transaction(async tx => {
    const attempts = await tx
      .select({ id: mockAttempts.id })
      .from(mockAttempts)
      .where(eq(mockAttempts.testId, testId));
    if (attempts.length)
      await tx.delete(mockAnswers).where(
        inArray(
          mockAnswers.attemptId,
          attempts.map(a => a.id)
        )
      );
    await tx.delete(mockAttempts).where(eq(mockAttempts.testId, testId));
    await tx.delete(mockQuestions).where(eq(mockQuestions.testId, testId));
    await tx.delete(mockSections).where(eq(mockSections.testId, testId));
    await tx.delete(mockTests).where(eq(mockTests.id, testId));
  });
}

export async function setTestPublished(testId: number, isPublished: boolean) {
  const database = await db();
  await database
    .update(mockTests)
    .set({ isPublished })
    .where(eq(mockTests.id, testId));
}

// ============================================
// Attempts
// ============================================

function isExpired(attempt: MockAttempt, now = Date.now()) {
  return (
    attempt.status === "in_progress" &&
    !!attempt.deadlineAt &&
    now > attempt.deadlineAt.getTime() + DEADLINE_GRACE_MS
  );
}

/** Mark objective answers, compute the band, and close the attempt. */
export async function finalizeAttempt(attemptId: number) {
  const database = await db();
  const [attempt] = await database
    .select()
    .from(mockAttempts)
    .where(eq(mockAttempts.id, attemptId))
    .limit(1);
  if (!attempt || attempt.status !== "in_progress") return attempt;
  const [test] = await database
    .select()
    .from(mockTests)
    .where(eq(mockTests.id, attempt.testId))
    .limit(1);
  const questions = await database
    .select()
    .from(mockQuestions)
    .where(eq(mockQuestions.testId, attempt.testId));
  const answers = await database
    .select()
    .from(mockAnswers)
    .where(eq(mockAnswers.attemptId, attemptId));

  let raw = 0;
  let max = 0;
  for (const question of questions) {
    if (!AUTO_MARKED_TYPES.includes(question.type)) continue;
    max += question.points;
    const answer = answers.find(a => a.questionId === question.id);
    const correct = isAnswerCorrect(
      question.type,
      question.answers,
      answer?.response
    );
    if (correct) raw += question.points;
    if (answer) {
      await database
        .update(mockAnswers)
        .set({ isCorrect: correct })
        .where(eq(mockAnswers.id, answer.id));
    } else {
      await database
        .insert(mockAnswers)
        .values({
          attemptId,
          questionId: question.id,
          response: null,
          isCorrect: false,
        });
    }
  }

  const autoMarked = test && isAutoMarkedModule(test.module);
  const now = new Date();
  await database
    .update(mockAttempts)
    .set({
      status: autoMarked ? "graded" : "submitted",
      submittedAt: now,
      rawScore: autoMarked ? raw : null,
      maxScore: autoMarked ? max : null,
      band:
        autoMarked && test
          ? bandFromRawScore(test.module, test.variant, raw, max).toFixed(1)
          : null,
      gradedAt: autoMarked ? now : null,
    })
    .where(eq(mockAttempts.id, attemptId));

  const [updated] = await database
    .select()
    .from(mockAttempts)
    .where(eq(mockAttempts.id, attemptId))
    .limit(1);
  return updated;
}

/** Fetch an attempt, closing it first if its time ran out while the student was away. */
async function loadAttempt(attemptId: number) {
  const database = await db();
  const [attempt] = await database
    .select()
    .from(mockAttempts)
    .where(eq(mockAttempts.id, attemptId))
    .limit(1);
  if (!attempt) return null;
  return isExpired(attempt) ? finalizeAttempt(attempt.id) : attempt;
}

export async function getOwnedAttempt(attemptId: number, userId: number) {
  const attempt = await loadAttempt(attemptId);
  if (!attempt || attempt.userId !== userId)
    throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
  return attempt;
}

export async function startAttempt(testId: number, userId: number) {
  const database = await db();
  const [test] = await database
    .select()
    .from(mockTests)
    .where(and(eq(mockTests.id, testId), eq(mockTests.isPublished, true)))
    .limit(1);
  if (!test)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "This test is not available",
    });

  const attempts = await database
    .select()
    .from(mockAttempts)
    .where(
      and(eq(mockAttempts.testId, testId), eq(mockAttempts.userId, userId))
    )
    .orderBy(desc(mockAttempts.startedAt));

  for (const attempt of attempts.filter(a => a.status === "in_progress")) {
    const current = await loadAttempt(attempt.id);
    if (current?.status === "in_progress") return current; // resume
  }

  if (test.maxAttempts && attempts.length >= test.maxAttempts) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You have used all attempts for this test",
    });
  }

  const now = new Date();
  const timed = test.mode === "exam" && test.durationMinutes;
  const [result] = await database.insert(mockAttempts).values({
    testId,
    userId,
    startedAt: now,
    deadlineAt: timed
      ? new Date(now.getTime() + test.durationMinutes! * 60_000)
      : null,
  });
  const [created] = await database
    .select()
    .from(mockAttempts)
    .where(eq(mockAttempts.id, result.insertId))
    .limit(1);
  return created;
}

export async function saveAnswers(
  attempt: MockAttempt,
  answers: {
    questionId: number;
    response?: string | null;
    audioUrl?: string | null;
  }[]
) {
  if (attempt.status !== "in_progress")
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This attempt has already been submitted",
    });
  if (isExpired(attempt))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Time is up for this attempt",
    });
  const database = await db();
  const validIds = new Set(
    (
      await database
        .select({ id: mockQuestions.id })
        .from(mockQuestions)
        .where(eq(mockQuestions.testId, attempt.testId))
    ).map(q => q.id)
  );
  for (const answer of answers) {
    if (!validIds.has(answer.questionId)) continue;
    const values: { response?: string | null; audioUrl?: string | null } = {};
    if (answer.response !== undefined) values.response = answer.response;
    if (answer.audioUrl !== undefined) values.audioUrl = answer.audioUrl;
    await database
      .insert(mockAnswers)
      .values({
        attemptId: attempt.id,
        questionId: answer.questionId,
        ...values,
      })
      .onDuplicateKeyUpdate({
        set: Object.keys(values).length ? values : { response: sql`response` },
      });
  }
}

/** Test content for the exam screen or result page. Correct answers are only included when allowed. */
export async function getAttemptView(
  attempt: MockAttempt,
  options: { revealAnswers: boolean }
) {
  const tree = await getTestTree(attempt.testId);
  if (!tree)
    throw new TRPCError({ code: "NOT_FOUND", message: "Test not found" });
  const database = await db();
  const answers = await database
    .select()
    .from(mockAnswers)
    .where(eq(mockAnswers.attemptId, attempt.id));
  const finished = attempt.status !== "in_progress";
  const reveal = options.revealAnswers && finished;

  const stripQuestion = (q: MockQuestion) => ({
    ...q,
    answers: reveal ? q.answers : null,
    explanation: reveal ? q.explanation : null,
  });

  return {
    attempt,
    serverNow: new Date(),
    test: {
      ...tree,
      sections: tree.sections.map(section => ({
        ...section,
        questions: section.questions.map(stripQuestion),
      })),
    },
    answers: answers.map(a => ({
      questionId: a.questionId,
      response: a.response,
      audioUrl: a.audioUrl,
      isCorrect: finished ? a.isCorrect : null,
      feedback: finished ? a.feedback : null,
    })),
  };
}

export async function listStudentTests(userId: number) {
  const database = await db();
  const tests = await database
    .select()
    .from(mockTests)
    .where(eq(mockTests.isPublished, true))
    .orderBy(asc(mockTests.sortOrder), desc(mockTests.createdAt));
  const attempts = await database
    .select()
    .from(mockAttempts)
    .where(eq(mockAttempts.userId, userId))
    .orderBy(desc(mockAttempts.startedAt));
  const counts = await database
    .select({ testId: mockQuestions.testId, n: sql<number>`count(*)` })
    .from(mockQuestions)
    .groupBy(mockQuestions.testId);

  return tests.map(test => {
    const mine = attempts.filter(a => a.testId === test.id);
    const inProgress = mine.find(
      a => a.status === "in_progress" && !isExpired(a)
    );
    const bands = mine.map(a => Number(a.band)).filter(Number.isFinite);
    return {
      ...test,
      questionCount: Number(counts.find(c => c.testId === test.id)?.n ?? 0),
      attemptsUsed: mine.length,
      attemptsLeft: test.maxAttempts
        ? Math.max(0, test.maxAttempts - mine.length)
        : null,
      bestBand: bands.length ? Math.max(...bands) : null,
      inProgressAttemptId: inProgress?.id ?? null,
      lastAttempt: mine[0] ?? null,
    };
  });
}

/** Student-facing course and batch details, linked to a verified enrollment by email. */
export async function getStudentBatch(userId: number) {
  const database = await db();
  const [user] = await database
    .select({ email: appUsers.email })
    .from(appUsers)
    .where(eq(appUsers.id, userId))
    .limit(1);
  if (!user?.email) return null;

  const [record] = await database
    .select({
      enrollment: {
        id: enrollments.id,
        studentId: enrollments.studentId,
        status: enrollments.status,
        verifiedAt: enrollments.verifiedAt,
      },
      batch: {
        id: batches.id,
        name: batches.name,
        startDate: batches.startDate,
        maxCapacity: batches.maxCapacity,
        currentCount: batches.currentCount,
        isOpen: batches.isOpen,
        isActive: batches.isActive,
      },
      course: {
        id: courses.id,
        name: courses.name,
        nameEn: courses.nameEn,
        duration: courses.duration,
        schedule: courses.schedule,
        instructorName: courses.instructorName,
        imageUrl: courses.imageUrl,
      },
    })
    .from(enrollments)
    .leftJoin(batches, eq(batches.id, enrollments.batchId))
    .leftJoin(courses, eq(courses.id, enrollments.courseId))
    .where(
      and(
        eq(enrollments.studentEmail, user.email),
        eq(enrollments.status, "verified")
      )
    )
    .orderBy(desc(enrollments.verifiedAt), desc(enrollments.createdAt))
    .limit(1);

  return record ?? null;
}

export async function listLearningResources() {
  const database = await db();
  return database
    .select({
      resource: learningResources,
      batch: { id: batches.id, name: batches.name },
    })
    .from(learningResources)
    .leftJoin(batches, eq(batches.id, learningResources.batchId))
    .orderBy(
      asc(learningResources.sortOrder),
      desc(learningResources.createdAt)
    );
}

export async function listStudentResources(userId: number) {
  const database = await db();
  const assignment = await getStudentBatch(userId);
  const visibility = assignment?.batch?.id
    ? or(
        isNull(learningResources.batchId),
        eq(learningResources.batchId, assignment.batch.id)
      )
    : isNull(learningResources.batchId);
  return database
    .select({
      resource: learningResources,
      batch: { id: batches.id, name: batches.name },
    })
    .from(learningResources)
    .leftJoin(batches, eq(batches.id, learningResources.batchId))
    .where(and(eq(learningResources.isActive, true), visibility))
    .orderBy(
      asc(learningResources.sortOrder),
      desc(learningResources.createdAt)
    );
}

export async function createLearningResource(data: InsertLearningResource) {
  const database = await db();
  const [result] = await database.insert(learningResources).values(data);
  return { id: result.insertId };
}

export async function updateLearningResource(
  id: number,
  data: Partial<InsertLearningResource>
) {
  const database = await db();
  await database
    .update(learningResources)
    .set(data)
    .where(eq(learningResources.id, id));
  return { success: true } as const;
}

export async function deleteLearningResource(id: number) {
  const database = await db();
  await database.delete(learningResources).where(eq(learningResources.id, id));
  return { success: true } as const;
}

export async function listVocabulary(activeOnly = false) {
  const database = await db();
  return database
    .select()
    .from(vocabularyWords)
    .where(activeOnly ? eq(vocabularyWords.isActive, true) : undefined)
    .orderBy(asc(vocabularyWords.sortOrder), asc(vocabularyWords.word));
}

export async function createVocabularyWord(data: InsertVocabularyWord) {
  const database = await db();
  const [result] = await database.insert(vocabularyWords).values(data);
  return { id: result.insertId };
}

export async function updateVocabularyWord(
  id: number,
  data: Partial<InsertVocabularyWord>
) {
  const database = await db();
  await database
    .update(vocabularyWords)
    .set(data)
    .where(eq(vocabularyWords.id, id));
  return { success: true } as const;
}

export async function deleteVocabularyWord(id: number) {
  const database = await db();
  await database.delete(vocabularyWords).where(eq(vocabularyWords.id, id));
  return { success: true } as const;
}

export async function listAttempts(filter: {
  userId?: number;
  testId?: number;
  status?: MockAttempt["status"];
}) {
  const database = await db();
  const conditions = [];
  if (filter.userId) conditions.push(eq(mockAttempts.userId, filter.userId));
  if (filter.testId) conditions.push(eq(mockAttempts.testId, filter.testId));
  if (filter.status) conditions.push(eq(mockAttempts.status, filter.status));
  return database
    .select({
      attempt: mockAttempts,
      test: {
        id: mockTests.id,
        title: mockTests.title,
        module: mockTests.module,
        mode: mockTests.mode,
      },
      student: { id: appUsers.id, name: appUsers.name, email: appUsers.email },
    })
    .from(mockAttempts)
    .innerJoin(mockTests, eq(mockTests.id, mockAttempts.testId))
    .leftJoin(appUsers, eq(appUsers.id, mockAttempts.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(mockAttempts.startedAt))
    .limit(500);
}

export async function getAttemptForAdmin(attemptId: number) {
  const attempt = await loadAttempt(attemptId);
  if (!attempt)
    throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
  const view = await getAttemptView(attempt, { revealAnswers: true });
  const database = await db();
  const [student] = await database
    .select({ id: appUsers.id, name: appUsers.name, email: appUsers.email })
    .from(appUsers)
    .where(eq(appUsers.id, attempt.userId))
    .limit(1);
  return { ...view, student: student ?? null };
}

export async function gradeAttempt(input: {
  attemptId: number;
  criteria?: Record<string, number> | null;
  band?: number | null;
  feedback?: string | null;
  answerFeedback?: { questionId: number; feedback: string | null }[];
}) {
  const attempt = await loadAttempt(input.attemptId);
  if (!attempt)
    throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
  if (attempt.status === "in_progress")
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The student has not submitted yet",
    });

  const database = await db();
  for (const item of input.answerFeedback ?? []) {
    await database
      .insert(mockAnswers)
      .values({
        attemptId: attempt.id,
        questionId: item.questionId,
        feedback: item.feedback,
      })
      .onDuplicateKeyUpdate({ set: { feedback: item.feedback } });
  }

  const band =
    input.criteria && Object.keys(input.criteria).length
      ? overallFromCriteria(input.criteria)
      : (input.band ?? (attempt.band ? Number(attempt.band) : null));

  await database
    .update(mockAttempts)
    .set({
      status: "graded",
      criteria: input.criteria ?? attempt.criteria,
      band: band === null ? null : band.toFixed(1),
      feedback: input.feedback ?? attempt.feedback,
      gradedAt: new Date(),
    })
    .where(eq(mockAttempts.id, attempt.id));
}

export type TestTree = NonNullable<Awaited<ReturnType<typeof getTestTree>>>;
export type { MockTest };

// ============================================
// User accounts and student-specific account data
// ============================================

export async function listUsers() {
  const database = await db();
  const users = await database
    .select({
      id: appUsers.id,
      name: appUsers.name,
      email: appUsers.email,
      role: appUsers.role,
      avatarUrl: appUsers.avatarUrl,
      isActive: appUsers.isActive,
      createdAt: appUsers.createdAt,
      lastSignedIn: appUsers.lastSignedIn,
    })
    .from(appUsers)
    .orderBy(desc(appUsers.createdAt));
  const stats = await database
    .select({
      userId: mockAttempts.userId,
      attempts: sql<number>`count(*)`,
      best: sql<string | null>`max(cast(${mockAttempts.band} as decimal(3,1)))`,
    })
    .from(mockAttempts)
    .groupBy(mockAttempts.userId);
  return users.map(user => {
    const result = stats.find(row => row.userId === user.id);
    return {
      ...user,
      attempts: Number(result?.attempts ?? 0),
      bestBand: result?.best ? Number(result.best) : null,
    };
  });
}

export async function updateUser(
  id: number,
  values: {
    name?: string | null;
    email?: string;
    role?: "super_admin" | "admin" | "staff" | "mentor" | "student";
    isActive?: boolean;
    passwordHash?: string;
  }
) {
  const database = await db();
  const [user] = await database
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.id, id))
    .limit(1);
  if (!user)
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  await database.update(appUsers).set(values).where(eq(appUsers.id, id));
}

export async function listStudents() {
  const database = await db();
  const students = await database
    .select({
      id: appUsers.id,
      name: appUsers.name,
      email: appUsers.email,
      isActive: appUsers.isActive,
      createdAt: appUsers.createdAt,
      lastSignedIn: appUsers.lastSignedIn,
    })
    .from(appUsers)
    .where(eq(appUsers.role, "student"))
    .orderBy(desc(appUsers.createdAt));
  const stats = await database
    .select({
      userId: mockAttempts.userId,
      attempts: sql<number>`count(*)`,
      best: sql<string | null>`max(cast(${mockAttempts.band} as decimal(3,1)))`,
    })
    .from(mockAttempts)
    .groupBy(mockAttempts.userId);
  return students.map(student => {
    const s = stats.find(row => row.userId === student.id);
    return {
      ...student,
      attempts: Number(s?.attempts ?? 0),
      bestBand: s?.best ? Number(s.best) : null,
    };
  });
}

export async function updateStudent(
  id: number,
  values: {
    name?: string | null;
    email?: string;
    isActive?: boolean;
    passwordHash?: string;
    avatarUrl?: string | null;
    targetBand?: string | null;
  }
) {
  const database = await db();
  const [student] = await database
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(and(eq(appUsers.id, id), eq(appUsers.role, "student")))
    .limit(1);
  if (!student)
    throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
  await database.update(appUsers).set(values).where(eq(appUsers.id, id));
}
