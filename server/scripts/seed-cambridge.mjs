/**
 * Build the complete Cambridge IELTS admin catalog as unpublished templates:
 * books 1–21 × tests 1–4 × Listening, Reading, Writing and Speaking.
 *
 * The templates contain structure and answer fields only. Licensed questions,
 * recordings and answer keys must be supplied by the administrator before a
 * template is published to students.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);
const modules = ["listening", "reading", "writing", "speaking"];

function title(book, test, module) {
  return `Cambridge IELTS ${book} · Test ${test} · ${module[0].toUpperCase()}${module.slice(1)}`;
}

function testValues(book, test, module) {
  const duration = { listening: 30, reading: 60, writing: 60, speaking: 15 }[module];
  return [
    title(book, test, module),
    `Use your licensed Cambridge IELTS ${book}, Test ${test} materials with this ${module} answer sheet.`,
    module,
    duration,
    book * 100 + test * 10 + modules.indexOf(module),
    book,
    test,
  ];
}

function sectionSpecs(module) {
  if (module === "listening") return [
    ["Part 1", "Play Part 1 from your licensed Cambridge audio and enter answers 1–10.", 1, 10],
    ["Part 2", "Play Part 2 from your licensed Cambridge audio and enter answers 11–20.", 11, 20],
    ["Part 3", "Play Part 3 from your licensed Cambridge audio and enter answers 21–30.", 21, 30],
    ["Part 4", "Play Part 4 from your licensed Cambridge audio and enter answers 31–40.", 31, 40],
  ];
  if (module === "reading") return [
    ["Passage 1", "Read Passage 1 in your Cambridge book and enter answers 1–13.", 1, 13],
    ["Passage 2", "Read Passage 2 in your Cambridge book and enter answers 14–26.", 14, 26],
    ["Passage 3", "Read Passage 3 in your Cambridge book and enter answers 27–40.", 27, 40],
  ];
  if (module === "writing") return [
    ["Writing Task 1", "Complete Task 1 from your Cambridge book. Write at least 150 words.", 1, 1],
    ["Writing Task 2", "Complete Task 2 from your Cambridge book. Write at least 250 words.", 2, 2],
  ];
  return [
    ["Speaking Part 1", "Answer the Part 1 questions from your Cambridge materials.", 1, 1],
    ["Speaking Part 2", "Use the cue card from your Cambridge materials.", 2, 2],
    ["Speaking Part 3", "Answer the Part 3 discussion questions from your Cambridge materials.", 3, 3],
  ];
}

async function insertRows(sqlPrefix, rows, chunkSize = 500) {
  if (!rows.length) return;
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const placeholders = chunk.map(row => `(${row.map(() => "?").join(",")})`).join(",");
    await db.execute(`${sqlPrefix} ${placeholders}`, chunk.flat());
  }
}

await db.beginTransaction();
try {
  const [existingRows] = await db.execute(
    "SELECT id, bookNumber, testNumber, module FROM mock_tests WHERE series = 'cambridge'",
  );
  const existing = new Set(existingRows.map(row => `${row.bookNumber}-${row.testNumber}-${row.module}`));
  const newTests = [];
  for (let book = 1; book <= 21; book += 1) {
    for (let test = 1; test <= 4; test += 1) {
      for (const module of modules) {
        if (!existing.has(`${book}-${test}-${module}`)) newTests.push(testValues(book, test, module));
      }
    }
  }
  await insertRows(
    "INSERT INTO mock_tests (title,description,module,durationMinutes,sortOrder,bookNumber,testNumber,variant,mode,maxAttempts,isPublished,format,series) VALUES",
    newTests.map(row => [...row.slice(0, 4), row[4], row[5], row[6], "academic", "exam", 3, false, "answer_sheet", "cambridge"]),
    250,
  );

  const [catalog] = await db.execute(
    "SELECT id, bookNumber, testNumber, module FROM mock_tests WHERE series = 'cambridge' ORDER BY id",
  );
  const testIds = catalog.map(row => row.id);
  const [sectionCounts] = testIds.length
    ? await db.query(`SELECT testId, COUNT(*) count FROM mock_sections WHERE testId IN (${testIds.map(() => "?").join(",")}) GROUP BY testId`, testIds)
    : [[]];
  const populatedTests = new Set(sectionCounts.map(row => Number(row.testId)));
  const sectionRows = [];
  for (const test of catalog) {
    if (populatedTests.has(test.id)) continue;
    for (const [index, spec] of sectionSpecs(test.module).entries()) {
      sectionRows.push([test.id, spec[0], spec[1], null, null, null, index]);
    }
  }
  await insertRows(
    "INSERT INTO mock_sections (testId,title,instructions,content,imageUrl,audioUrl,sortOrder) VALUES",
    sectionRows,
  );

  const [sections] = await db.query(
    `SELECT s.id, s.testId, s.title, t.bookNumber, t.testNumber, t.module
     FROM mock_sections s INNER JOIN mock_tests t ON t.id=s.testId
     WHERE t.series='cambridge' ORDER BY s.testId, s.sortOrder`,
  );
  const sectionIds = sections.map(row => row.id);
  const [questionCounts] = sectionIds.length
    ? await db.query(`SELECT sectionId, COUNT(*) count FROM mock_questions WHERE sectionId IN (${sectionIds.map(() => "?").join(",")}) GROUP BY sectionId`, sectionIds)
    : [[]];
  const populatedSections = new Set(questionCounts.map(row => Number(row.sectionId)));
  const questionRows = [];

  for (const section of sections) {
    if (populatedSections.has(section.id)) continue;
    const spec = sectionSpecs(section.module).find(item => item[0] === section.title);
    if (!spec) continue;
    for (let number = spec[2]; number <= spec[3]; number += 1) {
      const isWriting = section.module === "writing";
      const isSpeaking = section.module === "speaking";
      const type = isWriting ? "writing" : isSpeaking ? "speaking" : "short_answer";
      const prompt = isWriting
        ? `Complete ${section.title} from Cambridge IELTS ${section.bookNumber}, Test ${section.testNumber}.`
        : isSpeaking
          ? `Record your response to ${section.title} from Cambridge IELTS ${section.bookNumber}, Test ${section.testNumber}.`
          : `Question ${number}`;
      const minWords = isWriting ? (number === 1 ? 150 : 250) : null;
      const prep = isSpeaking ? (number === 2 ? 60 : 10) : null;
      const response = isSpeaking ? (number === 2 ? 120 : 60) : null;
      questionRows.push([section.testId, section.id, type, prompt, null, null, null, 1, minWords, prep, response, number]);
    }
  }
  await insertRows(
    "INSERT INTO mock_questions (testId,sectionId,type,prompt,options,answers,explanation,points,minWords,prepSeconds,responseSeconds,sortOrder) VALUES",
    questionRows,
    750,
  );

  await db.commit();
  console.log(`Cambridge catalog ready: ${catalog.length}/336 modules, ${newTests.length} newly added as drafts.`);
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
