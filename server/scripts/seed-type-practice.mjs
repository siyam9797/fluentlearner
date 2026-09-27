/**
 * Starter sets for Student → Practice → "by question type":
 * one Reading set per question type, one Writing set per task type and one set per Speaking part.
 * Listening sets need real audio, so they are added by admins in the Mock Tests editor.
 *
 * Safe to rerun: sets are matched by practiceType + title, and existing sets are left untouched
 * (so students' attempts are never broken).
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import reading from "./data/type-practice-reading.mjs";
import { SPEAKING, WRITING } from "./data/type-practice-writing-speaking.mjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);

const [columns] = await db.execute(
  "SHOW COLUMNS FROM mock_tests LIKE 'practiceType'"
);
if (!columns.length) {
  throw new Error(
    "mock_tests.practiceType is missing — apply server/database/0013_practice_type.sql first."
  );
}

const sets = [
  ...reading.map(set => ({ ...set, module: "reading" })),
  ...WRITING.map(set => ({ ...set, module: "writing" })),
  ...SPEAKING.map(set => ({ ...set, module: "speaking" })),
];

let added = 0;
await db.beginTransaction();
try {
  for (const [index, set] of sets.entries()) {
    const [existing] = await db.execute(
      "SELECT id FROM mock_tests WHERE practiceType = ? AND title = ? LIMIT 1",
      [set.practiceType, set.title]
    );
    if (existing.length) continue;

    const [test] = await db.execute(
      `INSERT INTO mock_tests (title, description, module, variant, mode, durationMinutes, maxAttempts, isPublished, sortOrder, format, practiceType)
       VALUES (?, ?, ?, ?, 'practice', NULL, NULL, true, ?, 'full', ?)`,
      [
        set.title,
        set.description,
        set.module,
        set.practiceType === "writing_t1_letter" ? "general" : "academic",
        100 + index,
        set.practiceType,
      ]
    );
    const [section] = await db.execute(
      "INSERT INTO mock_sections (testId, title, instructions, content, imageUrl, sortOrder) VALUES (?, ?, ?, ?, ?, 0)",
      [
        test.insertId,
        set.section.title,
        set.section.instructions ?? null,
        set.section.content ?? null,
        set.section.imageUrl ?? null,
      ]
    );
    for (const [order, question] of set.questions.entries()) {
      const [
        type,
        prompt,
        options,
        answers,
        explanation,
        minWords,
        prepSeconds,
        responseSeconds,
      ] = question;
      await db.execute(
        `INSERT INTO mock_questions (testId, sectionId, type, prompt, options, answers, explanation, points, minWords, prepSeconds, responseSeconds, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        [
          test.insertId,
          section.insertId,
          type,
          prompt,
          options ? JSON.stringify(options) : null,
          answers ? JSON.stringify(answers) : null,
          explanation ?? null,
          minWords ?? null,
          prepSeconds ?? null,
          responseSeconds ?? null,
          order,
        ]
      );
    }
    added += 1;
  }
  await db.commit();
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
console.log(
  `Question-type practice: ${added} new set(s) added, ${sets.length - added} already present.`
);
