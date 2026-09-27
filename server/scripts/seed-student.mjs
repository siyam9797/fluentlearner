import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const databaseUrl = process.env.DATABASE_URL;
const allowLocalDefaults = process.argv.includes("--local");
const email = (
  process.env.STUDENT_EMAIL ||
  (allowLocalDefaults ? "student@localhost.test" : "")
)
  .trim()
  .toLowerCase();
const password =
  process.env.STUDENT_PASSWORD || (allowLocalDefaults ? "student12345" : "");
const name =
  process.env.STUDENT_NAME ||
  (allowLocalDefaults ? "Local Student" : "Student");
const targetBand = process.env.STUDENT_TARGET_BAND || "7.0";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (!email || !password) {
  throw new Error("STUDENT_EMAIL and STUDENT_PASSWORD are required");
}

if (password.length < 8) {
  throw new Error("STUDENT_PASSWORD must be at least 8 characters");
}

const connection = await mysql.createConnection(databaseUrl);
const passwordHash = await hashPassword(password);

await connection.execute(
  `INSERT INTO app_users (name, email, passwordHash, targetBand, role, isActive, lastSignedIn)
   VALUES (?, ?, ?, ?, 'student', true, NOW())
   ON DUPLICATE KEY UPDATE
     name = VALUES(name),
     passwordHash = VALUES(passwordHash),
     targetBand = VALUES(targetBand),
     role = 'student',
     isActive = true`,
  [name, email, passwordHash, targetBand]
);

await connection.end();

console.log(`student user is ready: ${email}`);
