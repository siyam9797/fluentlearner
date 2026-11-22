/**
 * Seed demo upcoming batches for the home page "Upcoming batches" section.
 * Start dates are relative to today, so rerunning moves them forward again.
 * Safe to rerun: batches are matched by name and updated in place.
 * Run with: npm run seed:batches
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const connection = await mysql.createConnection(databaseUrl);

// [batch name, course names to link (first match wins), days from today, capacity]
// Seats taken come from verified enrollments in the batch, so none are seeded here.
const batchSeeds = [
  [
    "IELTS VIP — December Evening Batch",
    ["IELTS VIP (Online Private Batch)", "IELTS VIP Batch"],
    9,
    12,
  ],
  [
    "Basic to IELTS — December Batch",
    ["Basic to IELTS (Online Private Batch)", "Basic Grammar & Foundation"],
    18,
    20,
  ],
  [
    "IELTS Speaking Premium — Weekend Batch",
    ["IELTS Speaking Premium (Online Private Batch)", "Spoken English Mastery"],
    30,
    10,
  ],
];

async function courseIdFor(names) {
  for (const name of names) {
    const [rows] = await connection.execute(
      "SELECT id FROM `courses` WHERE `name` = ? LIMIT 1",
      [name]
    );
    if (rows.length) return rows[0].id;
  }
  return null;
}

function startDateIn(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

for (const [name, courseNames, days, maxCapacity] of batchSeeds) {
  const values = {
    courseId: await courseIdFor(courseNames),
    startDate: startDateIn(days),
    maxCapacity,
    isOpen: true,
    isActive: true,
  };
  const [existing] = await connection.execute(
    "SELECT id FROM `batches` WHERE `name` = ? LIMIT 1",
    [name]
  );
  const columns = Object.keys(values);
  if (existing.length) {
    await connection.execute(
      `UPDATE \`batches\` SET ${columns.map(column => `\`${column}\` = ?`).join(", ")} WHERE id = ?`,
      [...columns.map(column => values[column]), existing[0].id]
    );
  } else {
    await connection.execute(
      `INSERT INTO \`batches\` (\`name\`, ${columns.map(column => `\`${column}\``).join(", ")}) VALUES (?, ${columns.map(() => "?").join(", ")})`,
      [name, ...columns.map(column => values[column])]
    );
  }
  console.log(
    `${existing.length ? "Updated" : "Added"}: ${name} — starts ${values.startDate.slice(0, 10)}${values.courseId ? "" : " (no matching course)"}`
  );
}

await connection.end();
