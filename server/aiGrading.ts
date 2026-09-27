/**
 * AI marking for IELTS Writing and Speaking attempts, using Claude.
 *
 * - Practice tests: the AI result becomes the attempt's grade straight away (unless a mentor already graded it).
 * - Timed exams: the result is stored as a suggestion (mock_attempts.aiEvaluation) for the mentor to apply or edit.
 * - Speaking is marked from the transcript captured by the browser while the student spoke (mock_answers.response);
 *   Claude cannot hear the audio, so Pronunciation is a provisional estimate.
 *
 * Needs ANTHROPIC_API_KEY. Without it, attempts simply wait for a mentor as before.
 */
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import {
  mockAnswers,
  mockAttempts,
  mockQuestions,
  mockSections,
  mockTests,
  type AiEvaluation,
} from "./database/schema";
import { GRADING_CRITERIA, overallFromCriteria } from "@shared/mock";

const MODEL = "claude-opus-5";

export function isAiGradingConfigured() {
  return Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
  );
}

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

async function db() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database;
}

const SYSTEM_PROMPT = `You are an experienced, certified IELTS examiner marking a student's practice work for FluentLearner, an IELTS coaching school in Bangladesh.

Mark strictly against the official public IELTS band descriptors, the way a real examiner would. Do not inflate bands to be encouraging: an accurate band helps the student far more than a flattering one. Use whole or half bands only (e.g. 5.5, 6.0, 6.5).

Your feedback is read by the student. Write in clear, simple English suitable for a learner at their level. Be specific: quote short phrases from their answer to show what worked and what to fix, and finish with two or three concrete actions that would raise their band. Keep the overall feedback under about 250 words.`;

const WRITING_RULES = `Writing rules:
- Give one band for each of the four criteria across the whole paper. If the paper has both Task 1 and Task 2, weight Task 2 twice as heavily as Task 1, as in the real test.
- Answers below the minimum word count lose marks for Task Achievement / Response. An empty or off-topic answer scores very low on every criterion.
- For Task 1 (Academic), check that the key features and an overview are reported accurately against the chart or diagram provided. For a General Training letter, check that every bullet point is covered with the right tone.
- For each answer, give per-answer feedback (task-specific comments) keyed by its question_id.`;

const SPEAKING_RULES = `Speaking rules:
- You are given automatic speech-to-text transcripts of the student's recorded answers, not the audio. The transcripts come from browser speech recognition, so ignore punctuation, capitalisation and occasional mis-heard words; never penalise spelling.
- Judge Fluency & Coherence from how well ideas are developed and linked, and from hesitation markers or very short answers visible in the transcript.
- You cannot hear the student, so Pronunciation must be a cautious estimate: base it on how intelligible the transcript suggests they were (e.g. many garbled or nonsensical words may indicate unclear speech), keep it close to the other bands unless there is strong evidence, and say in its comment that the mentor should confirm it by listening.
- If a transcript is missing or empty, treat that answer as not answered.
- For each answer, give per-answer feedback keyed by its question_id.`;

function evaluationSchema(criteria: readonly string[]) {
  return z.object({
    criteria: z
      .array(
        z.object({
          criterion: z.enum(criteria as [string, ...string[]]),
          band: z.number().describe("Band from 0 to 9 in steps of 0.5"),
          comment: z
            .string()
            .describe("One or two sentences explaining this band"),
        })
      )
      .describe("Exactly one entry for each criterion"),
    overall_feedback: z
      .string()
      .describe("Feedback for the student, ending with 2-3 concrete actions"),
    answers: z.array(
      z.object({ question_id: z.number().int(), feedback: z.string() })
    ),
  });
}

const toBand = (value: number) =>
  Math.min(9, Math.max(0, Math.round(value * 2) / 2));
const countWords = (text: string | null | undefined) =>
  (text ?? "").trim().split(/\s+/).filter(Boolean).length;

/** Task images: SVG is sent as its source text (Claude reads the data from it); raster images as image blocks. */
async function imageBlocks(
  url: string,
  label: string
): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
  try {
    let data: Buffer;
    if (/^https?:\/\//.test(url)) {
      const response = await fetch(url);
      if (!response.ok) return [];
      data = Buffer.from(await response.arrayBuffer());
    } else {
      const uploads = ENV.publicUploadUrl.replace(/\/$/, "");
      const file = url.startsWith(`${uploads}/`)
        ? path.resolve(ENV.uploadDir, url.slice(uploads.length + 1))
        : path.resolve("client/public", url.replace(/^\/+/, ""));
      data = await fs.readFile(file);
    }
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    if (ext === "svg")
      return [
        {
          type: "text",
          text: `${label} (chart provided as SVG source):\n${data.toString("utf8")}`,
        },
      ];
    const mediaType = (
      {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
      } as const
    )[ext ?? ""];
    if (!mediaType) return [];
    return [
      { type: "text", text: `${label}:` },
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: data.toString("base64"),
        },
      },
    ];
  } catch (error) {
    console.warn("[AI grading] Could not load task image", url, error);
    return [];
  }
}

async function loadAttemptForAi(attemptId: number) {
  const database = await db();
  const [attempt] = await database
    .select()
    .from(mockAttempts)
    .where(eq(mockAttempts.id, attemptId))
    .limit(1);
  if (!attempt) return null;
  const [test] = await database
    .select()
    .from(mockTests)
    .where(eq(mockTests.id, attempt.testId))
    .limit(1);
  if (!test) return null;
  const sections = await database
    .select()
    .from(mockSections)
    .where(eq(mockSections.testId, test.id))
    .orderBy(asc(mockSections.sortOrder));
  const questions = await database
    .select()
    .from(mockQuestions)
    .where(eq(mockQuestions.testId, test.id))
    .orderBy(asc(mockQuestions.sortOrder));
  const answers = await database
    .select()
    .from(mockAnswers)
    .where(eq(mockAnswers.attemptId, attempt.id));
  return { attempt, test, sections, questions, answers };
}

async function buildContent(
  data: NonNullable<Awaited<ReturnType<typeof loadAttemptForAi>>>
) {
  const { test, sections, questions, answers } = data;
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    {
      type: "text",
      text: `IELTS ${test.module === "writing" ? "Writing" : "Speaking"} ${test.module === "writing" ? `(${test.variant === "general" ? "General Training" : "Academic"})` : ""} — "${test.title}".\nMark the student's answers below.`,
    },
  ];
  for (const section of sections) {
    content.push({
      type: "text",
      text: [`\n## ${section.title}`, section.instructions, section.content]
        .filter(Boolean)
        .join("\n"),
    });
    if (section.imageUrl)
      content.push(
        ...(await imageBlocks(section.imageUrl, `${section.title} visual`))
      );
    for (const question of questions.filter(q => q.sectionId === section.id)) {
      const answer =
        answers.find(a => a.questionId === question.id)?.response?.trim() ?? "";
      const words = countWords(answer);
      content.push({
        type: "text",
        text:
          test.module === "writing"
            ? `\n### question_id ${question.id}\nTask: ${question.prompt}\nMinimum words: ${question.minWords ?? "none"} · Student wrote: ${words} words\n<student_answer>\n${answer || "(no answer)"}\n</student_answer>`
            : `\n### question_id ${question.id}\nQuestion: ${question.prompt}\nSpeaking time allowed: ${question.responseSeconds ?? "?"}s\n<transcript>\n${answer || "(no transcript)"}\n</transcript>`,
      });
    }
  }
  return content;
}

async function callClaude(
  module: "writing" | "speaking",
  content: Anthropic.Beta.BetaContentBlockParam[]
) {
  const criteria = GRADING_CRITERIA[module];
  const response = await anthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    // If Claude Opus 5 declines, the API retries the same request on a suitable fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${SYSTEM_PROMPT}\n\n${module === "writing" ? WRITING_RULES : SPEAKING_RULES}`,
    messages: [{ role: "user", content }],
    output_config: { format: betaZodOutputFormat(evaluationSchema(criteria)) },
  });
  if (response.stop_reason === "refusal")
    throw new Error("The AI declined to mark this attempt.");
  if (response.stop_reason === "max_tokens")
    throw new Error("The AI response was cut off.");
  const result = response.parsed_output;
  if (!result) throw new Error("The AI returned an unreadable result.");

  const bands: Record<string, number> = {};
  const comments: Record<string, string> = {};
  for (const item of result.criteria) {
    bands[item.criterion] = toBand(item.band);
    comments[item.criterion] = item.comment;
  }
  const missing = criteria.filter(name => bands[name] === undefined);
  if (missing.length)
    throw new Error(`The AI did not mark: ${missing.join(", ")}`);
  return { bands, comments, result, model: response.model };
}

async function saveEvaluation(attemptId: number, evaluation: AiEvaluation) {
  const database = await db();
  await database
    .update(mockAttempts)
    .set({ aiEvaluation: evaluation })
    .where(eq(mockAttempts.id, attemptId));
}

/**
 * Mark one submitted Writing/Speaking attempt. Safe to call again (e.g. from the admin "Re-run" button).
 * Practice attempts that no mentor has graded yet receive the AI grade; everything else only stores the suggestion.
 */
export async function runAiEvaluation(attemptId: number) {
  const data = await loadAttemptForAi(attemptId);
  if (!data) return null;
  const { attempt, test, questions } = data;
  if (test.module !== "writing" && test.module !== "speaking") return null;
  if (attempt.status === "in_progress") return null;

  const startedAt = new Date().toISOString();
  await saveEvaluation(attempt.id, { status: "pending", createdAt: startedAt });
  try {
    const { bands, comments, result, model } = await callClaude(
      test.module,
      await buildContent(data)
    );
    const questionIds = new Set(questions.map(q => q.id));
    const answerFeedback = result.answers
      .filter(item => questionIds.has(item.question_id) && item.feedback.trim())
      .map(item => ({
        questionId: item.question_id,
        feedback: item.feedback.trim(),
      }));
    const band = overallFromCriteria(bands);
    const evaluation: AiEvaluation = {
      status: "done",
      criteria: bands,
      comments,
      band: band ?? undefined,
      feedback: result.overall_feedback.trim(),
      answerFeedback,
      model,
      createdAt: startedAt,
    };

    const database = await db();
    const [current] = await database
      .select()
      .from(mockAttempts)
      .where(eq(mockAttempts.id, attempt.id))
      .limit(1);
    const applyNow =
      attempt.mode === "practice" && current?.status === "submitted";
    if (applyNow) {
      await database.transaction(async tx => {
        for (const item of answerFeedback) {
          await tx
            .insert(mockAnswers)
            .values({
              attemptId: attempt.id,
              questionId: item.questionId,
              feedback: item.feedback,
            })
            .onDuplicateKeyUpdate({ set: { feedback: item.feedback } });
        }
        await tx
          .update(mockAttempts)
          .set({
            status: "graded",
            criteria: bands,
            band: band === null ? null : band.toFixed(1),
            feedback: evaluation.feedback,
            gradedAt: new Date(),
            aiEvaluation: { ...evaluation, applied: true },
          })
          .where(
            and(
              eq(mockAttempts.id, attempt.id),
              eq(mockAttempts.status, "submitted")
            )
          );
      });
    } else {
      await saveEvaluation(attempt.id, evaluation);
    }
    return evaluation;
  } catch (error) {
    const message =
      error instanceof Anthropic.APIError
        ? `AI service error (${error.status ?? "network"})`
        : error instanceof Error
          ? error.message
          : "AI marking failed";
    console.error(`[AI grading] Attempt ${attempt.id} failed:`, error);
    await saveEvaluation(attempt.id, {
      status: "failed",
      error: message,
      createdAt: startedAt,
    });
    return null;
  }
}

/** Start marking in the background so submitting stays fast; the result page polls for it. */
export function queueAiEvaluation(attemptId: number) {
  if (!isAiGradingConfigured()) return;
  void runAiEvaluation(attemptId).catch(error =>
    console.error("[AI grading] Unexpected error:", error)
  );
}
