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
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Admin";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (!email || !password) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
}

if (password.length < 8) {
  throw new Error("ADMIN_PASSWORD must be at least 8 characters");
}

const connection = await mysql.createConnection(databaseUrl);
const passwordHash = await hashPassword(password);

await connection.execute(
  `INSERT INTO app_users (name, email, passwordHash, role, isActive, lastSignedIn)
   VALUES (?, ?, ?, 'admin', true, NOW())
   ON DUPLICATE KEY UPDATE
     name = VALUES(name),
     passwordHash = VALUES(passwordHash),
     role = 'admin',
     isActive = true`,
  [name, email, passwordHash]
);

await connection.end();

console.log(`Admin user is ready: ${email}`);
