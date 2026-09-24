/**
 * tRPC routes for IELTS mock tests:
 *  - mockTests.*   admin: build tests, review attempts, grade Writing/Speaking
 *  - students.*    admin: manage student logins
 *  - student.*     signed-in students: take tests and see results
 */
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { MOCK_MODULES, MOCK_QUESTION_TYPES } from "./database/schema";
import { adminProcedure, router, studentProcedure } from "./_core/trpc";
import { hashPassword, verifyPassword } from "./_core/password";
import { createAppUser, getAppUserByEmail, getAppUserById } from "./db";
import { storagePut } from "./storage";
import * as mock from "./mockDb";
import { APP_ROLES, canManageUsers } from "@shared/roles";

const questionInput = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(MOCK_QUESTION_TYPES),
  prompt: z.string().trim().min(1, "Every question needs a prompt"),
  options: z.array(z.string()).nullish(),
  answers: z.array(z.string()).nullish(),
  explanation: z.string().nullish(),
  points: z.number().int().min(0).max(10).default(1),
  minWords: z.number().int().min(0).nullish(),
  prepSeconds: z.number().int().min(0).nullish(),
  responseSeconds: z.number().int().min(0).nullish(),
});

const sectionInput = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(1, "Every section needs a title"),
  instructions: z.string().nullish(),
  content: z.string().nullish(),
  imageUrl: z.string().nullish(),
  audioUrl: z.string().nullish(),
  questions: z.array(questionInput),
});

const testInput = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullish(),
  module: z.enum(MOCK_MODULES),
  variant: z.enum(["academic", "general"]).default("academic"),
  mode: z.enum(["exam", "practice"]).default("exam"),
  durationMinutes: z.number().int().min(1).max(300).nullish(),
  maxAttempts: z.number().int().min(1).max(100).nullish(),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  format: z.enum(["full", "answer_sheet"]).default("full"),
  series: z.string().trim().max(50).nullish(),
  bookNumber: z.number().int().min(1).max(99).nullish(),
  testNumber: z.number().int().min(1).max(20).nullish(),
});

const answerInput = z.object({
  questionId: z.number().int().positive(),
  response: z.string().max(20_000).nullish(),
  audioUrl: z.string().nullish(),
});

const bandValue = z.number().min(0).max(9).multipleOf(0.5);

const MB = 1024 * 1024;

function decodeUpload(base64: string, maxBytes: number) {
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > maxBytes) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: `File must be under ${Math.round(maxBytes / MB)}MB`,
    });
  }
  return buffer;
}

function extension(filename: string, fallback: string) {
  const ext = filename
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ext && ext.length <= 5 ? ext : fallback;
}

export const mockTestsRouter = router({
  list: adminProcedure.query(() => mock.listTestsWithStats()),

  get: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const test = await mock.getTestTree(input.id);
      if (!test)
        throw new TRPCError({ code: "NOT_FOUND", message: "Test not found" });
      return test;
    }),

  save: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive().nullable(),
        test: testInput,
        sections: z.array(sectionInput),
      })
    )
    .mutation(async ({ input }) => {
      const id = await mock.saveTestTree(input.id, input.test, input.sections);
      return { id };
    }),

  setPublished: adminProcedure
    .input(z.object({ id: z.number().int(), isPublished: z.boolean() }))
    .mutation(({ input }) =>
      mock.setTestPublished(input.id, input.isPublished)
    ),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(({ input }) => mock.deleteTest(input.id)),

  attempts: adminProcedure
    .input(
      z
        .object({
          testId: z.number().int().optional(),
          userId: z.number().int().optional(),
          status: z.enum(["in_progress", "submitted", "graded"]).optional(),
        })
        .default({})
    )
    .query(({ input }) => mock.listAttempts(input)),

  attempt: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .query(({ input }) => mock.getAttemptForAdmin(input.id)),

  grade: adminProcedure
    .input(
      z.object({
        attemptId: z.number().int(),
        criteria: z.record(z.string(), bandValue).nullish(),
        band: bandValue.nullish(),
        feedback: z.string().max(20_000).nullish(),
        answerFeedback: z
          .array(
            z.object({
              questionId: z.number().int(),
              feedback: z.string().max(20_000).nullable(),
            })
          )
          .optional(),
      })
    )
    .mutation(({ input }) => mock.gradeAttempt(input)),

  /** Admin: upload listening audio or a writing task image. */
  uploadMedia: adminProcedure
    .input(
      z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const isAudio = input.contentType.startsWith("audio/");
      if (!isAudio && !input.contentType.startsWith("image/")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload an audio or image file",
        });
      }
      const buffer = decodeUpload(input.base64, isAudio ? 60 * MB : 10 * MB);
      const folder = isAudio ? "mock-audio" : "images";
      return storagePut(
        `uploads/${folder}/${nanoid()}.${extension(input.filename, isAudio ? "mp3" : "jpg")}`,
        buffer,
        input.contentType
      );
    }),
});

export const studentsRouter = router({
  list: adminProcedure.query(() => mock.listStudents()),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        email: z.string().trim().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      if (await getAppUserByEmail(input.email)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }
      return createAppUser({
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: "student",
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().trim().min(1).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) =>
      mock.updateStudent(input.id, {
        name: input.name,
        isActive: input.isActive,
      })
    ),

  resetPassword: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) =>
      mock.updateStudent(input.id, {
        passwordHash: await hashPassword(input.password),
      })
    ),
});

function requireUserManager(role: string) {
  if (!canManageUsers(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only Super Admin and Admin can manage users",
    });
  }
}

export const usersRouter = router({
  list: adminProcedure.query(({ ctx }) => {
    requireUserManager(ctx.user.role);
    return mock.listUsers();
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        email: z.string().trim().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(APP_ROLES),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireUserManager(ctx.user.role);
      if (
        ctx.user.role !== "super_admin" &&
        ["super_admin", "admin"].includes(input.role)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Super Admin can create administrator accounts",
        });
      }
      if (await getAppUserByEmail(input.email)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }
      return createAppUser({
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().trim().min(1).optional(),
        role: z.enum(APP_ROLES).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireUserManager(ctx.user.role);
      const target = await getAppUserById(input.id);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (
        target.id === ctx.user.id &&
        (input.isActive === false || input.role)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot disable or change your own role",
        });
      }
      if (
        ctx.user.role !== "super_admin" &&
        (target.role === "super_admin" ||
          target.role === "admin" ||
          input.role === "super_admin" ||
          input.role === "admin")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Super Admin can manage administrator roles",
        });
      }
      return mock.updateUser(input.id, {
        name: input.name,
        role: input.role,
        isActive: input.isActive,
      });
    }),

  resetPassword: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireUserManager(ctx.user.role);
      const target = await getAppUserById(input.id);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (
        ctx.user.role !== "super_admin" &&
        (target.role === "super_admin" || target.role === "admin")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Super Admin can reset an administrator password",
        });
      }
      return mock.updateUser(input.id, {
        passwordHash: await hashPassword(input.password),
      });
    }),
});

const resourceInput = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().max(2_000).nullish(),
  batchId: z.number().int().positive().nullish(),
  fileUrl: z.string().trim().min(1),
  fileName: z.string().trim().max(255).nullish(),
  mimeType: z.string().trim().max(120).nullish(),
  fileSize: z.number().int().nonnegative().nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const vocabularyInput = z.object({
  word: z.string().trim().min(1).max(120),
  partOfSpeech: z.string().trim().min(1).max(50),
  meaning: z.string().trim().min(1).max(2_000),
  example: z.string().trim().min(1).max(2_000),
  topic: z.string().trim().min(1).max(100),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const learningResourcesRouter = router({
  list: adminProcedure.query(() => mock.listLearningResources()),
  create: adminProcedure
    .input(resourceInput)
    .mutation(({ input }) => mock.createLearningResource(input)),
  update: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: resourceInput.partial(),
      })
    )
    .mutation(({ input }) => mock.updateLearningResource(input.id, input.data)),
  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => mock.deleteLearningResource(input.id)),
  upload: adminProcedure
    .input(
      z.object({
        base64: z.string(),
        filename: z.string().min(1),
        contentType: z.string().default("application/octet-stream"),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = decodeUpload(input.base64, 25 * MB);
      const result = await storagePut(
        `uploads/resources/${nanoid()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
        buffer,
        input.contentType
      );
      return {
        ...result,
        fileName: input.filename,
        mimeType: input.contentType,
        fileSize: buffer.length,
      };
    }),
  vocabularyList: adminProcedure.query(() => mock.listVocabulary()),
  vocabularyCreate: adminProcedure
    .input(vocabularyInput)
    .mutation(({ input }) => mock.createVocabularyWord(input)),
  vocabularyUpdate: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: vocabularyInput.partial(),
      })
    )
    .mutation(({ input }) => mock.updateVocabularyWord(input.id, input.data)),
  vocabularyDelete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => mock.deleteVocabularyWord(input.id)),
});

export const studentRouter = router({
  profile: studentProcedure.query(async ({ ctx }) => {
    const user = await getAppUserById(ctx.user.id);
    if (!user)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student account not found",
      });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      targetBand: user.targetBand,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    };
  }),

  updateProfile: studentProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(255).optional(),
        targetBand: z
          .enum(["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"])
          .nullable()
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await mock.updateStudent(ctx.user.id, input);
      return { success: true } as const;
    }),

  uploadAvatar: studentProcedure
    .input(
      z.object({
        base64: z.string(),
        filename: z.string().min(1),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.contentType.startsWith("image/"))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose an image file",
        });
      const buffer = decodeUpload(input.base64, 5 * MB);
      const result = await storagePut(
        `uploads/student-avatars/${ctx.user.id}-${nanoid(8)}.${extension(input.filename, "jpg")}`,
        buffer,
        input.contentType
      );
      await mock.updateStudent(ctx.user.id, { avatarUrl: result.url });
      return result;
    }),

  changePassword: studentProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getAppUserById(ctx.user.id);
      if (
        !user ||
        !(await verifyPassword(input.currentPassword, user.passwordHash))
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }
      await mock.updateStudent(ctx.user.id, {
        passwordHash: await hashPassword(input.newPassword),
      });
      return { success: true } as const;
    }),

  tests: studentProcedure.query(({ ctx }) =>
    mock.listStudentTests(ctx.user.id)
  ),

  batch: studentProcedure.query(({ ctx }) => mock.getStudentBatch(ctx.user.id)),

  resources: studentProcedure.query(({ ctx }) =>
    mock.listStudentResources(ctx.user.id)
  ),

  vocabulary: studentProcedure.query(() => mock.listVocabulary(true)),

  attempts: studentProcedure.query(({ ctx }) =>
    mock.listAttempts({ userId: ctx.user.id })
  ),

  start: studentProcedure
    .input(z.object({ testId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const attempt = await mock.startAttempt(input.testId, ctx.user.id);
      return { attemptId: attempt.id };
    }),

  attempt: studentProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const attempt = await mock.getOwnedAttempt(input.id, ctx.user.id);
      const view = await mock.getAttemptView(attempt, { revealAnswers: false });
      // Practice tests reveal model answers and explanations once submitted.
      return view.test.mode === "practice"
        ? mock.getAttemptView(attempt, { revealAnswers: true })
        : view;
    }),

  save: studentProcedure
    .input(
      z.object({
        attemptId: z.number().int(),
        answers: z.array(answerInput).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attempt = await mock.getOwnedAttempt(input.attemptId, ctx.user.id);
      await mock.saveAnswers(attempt, input.answers);
      return { savedAt: new Date() };
    }),

  submit: studentProcedure
    .input(
      z.object({
        attemptId: z.number().int(),
        answers: z.array(answerInput).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attempt = await mock.getOwnedAttempt(input.attemptId, ctx.user.id);
      if (attempt.status === "in_progress") {
        try {
          await mock.saveAnswers(attempt, input.answers);
        } catch {
          // Time ran out: keep whatever was autosaved and close the attempt anyway.
        }
        await mock.finalizeAttempt(attempt.id);
      }
      return { attemptId: attempt.id };
    }),

  /** Upload one recorded speaking answer for an in-progress attempt. */
  uploadRecording: studentProcedure
    .input(
      z.object({
        attemptId: z.number().int(),
        questionId: z.number().int(),
        base64: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.contentType.startsWith("audio/"))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Recording must be audio",
        });
      const attempt = await mock.getOwnedAttempt(input.attemptId, ctx.user.id);
      const buffer = decodeUpload(input.base64, 15 * MB);
      const ext = input.contentType.includes("mp4")
        ? "m4a"
        : input.contentType.includes("ogg")
          ? "ogg"
          : "webm";
      const { url } = await storagePut(
        `uploads/speaking/${attempt.id}-${input.questionId}-${nanoid(8)}.${ext}`,
        buffer,
        input.contentType
      );
      await mock.saveAnswers(attempt, [
        { questionId: input.questionId, audioUrl: url },
      ]);
      return { url };
    }),
});
