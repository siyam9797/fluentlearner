/**
 * Copy the public content of the live site into the local database.
 *
 *   npm run sync:live            # from https://fluentlearner.com
 *   LIVE_URL=https://… npm run sync:live
 *
 * Replaces courses, success stories, batches and payment methods (keeping live IDs),
 * and overwrites site settings with the live values. Images referenced under the live
 * /uploads/ path are downloaded into UPLOAD_DIR and re-pointed at the local copy.
 * Enrollments, users and admin accounts are never touched (they aren't public).
 * A JSON backup of every affected table is written to .local-backups/ first.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const LIVE_URL = (process.env.LIVE_URL ?? "https://fluentlearner.com").replace(/\/+$/, "");
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "client/public/uploads";
const PUBLIC_UPLOAD_URL = process.env.PUBLIC_UPLOAD_URL ?? "/uploads";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

async function fetchProcedure(name) {
  const res = await fetch(`${LIVE_URL}/api/trpc/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return (await res.json()).result.data.json;
}

// ---- 1. Fetch live data -----------------------------------------------------
console.log(`Fetching public data from ${LIVE_URL} …`);
const live = {
  courses: await fetchProcedure("courses.list"),
  success_stories: await fetchProcedure("successStories.list"),
  batches: await fetchProcedure("batches.active"),
  payment_settings: await fetchProcedure("paymentSettings.active"),
};
const liveSettings = await fetchProcedure("siteSettings.getAll");

// ---- 2. Mirror uploaded images ---------------------------------------------
const uploadPrefix = `${LIVE_URL}/uploads/`;
const imageMap = new Map();
const collect = value => {
  if (typeof value === "string" && value.startsWith(uploadPrefix)) imageMap.set(value, null);
};
for (const rows of Object.values(live)) for (const row of rows) Object.values(row).forEach(collect);
Object.values(liveSettings).forEach(collect);

for (const url of imageMap.keys()) {
  const rel = decodeURIComponent(url.slice(uploadPrefix.length));
  const target = path.join(UPLOAD_DIR, rel);
  try {
    await fs.access(target);
  } catch {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! could not download ${url} (HTTP ${res.status}) — keeping the live URL`);
      imageMap.set(url, url);
      continue;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, Buffer.from(await res.arrayBuffer()));
  }
  imageMap.set(url, `${PUBLIC_UPLOAD_URL}/${rel}`);
}
console.log(`Images: ${imageMap.size} mirrored into ${UPLOAD_DIR}`);
const localise = value => (typeof value === "string" && imageMap.has(value) ? imageMap.get(value) : value);

// ---- 3. Write to the local database ----------------------------------------
const connection = await mysql.createConnection(databaseUrl);

const backupDir = path.join(".local-backups", new Date().toISOString().replace(/[:.]/g, "-"));
await fs.mkdir(backupDir, { recursive: true });
for (const table of [...Object.keys(live), "site_settings"]) {
  const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
  await fs.writeFile(path.join(backupDir, `${table}.json`), JSON.stringify(rows, null, 2));
}
console.log(`Backup of current local data: ${backupDir}`);

// API field → column name, where they differ.
const FIELD_FOR_COLUMN = { success_stories: { storyCategory: "category" } };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function toColumnValue(value, column) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "object") return JSON.stringify(value);
  if ((column === "createdAt" || column === "updatedAt") && ISO_DATE.test(value)) return new Date(value);
  return localise(value);
}

await connection.beginTransaction();
try {
  for (const [table, rows] of Object.entries(live)) {
    const [columnInfo] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
    const columns = columnInfo.map(c => c.Field);
    await connection.query(`DELETE FROM \`${table}\``);
    for (const row of rows) {
      const values = {};
      for (const column of columns) {
        const field = FIELD_FOR_COLUMN[table]?.[column] ?? column;
        const value = toColumnValue(row[field], column);
        if (value !== undefined) values[column] = value;
      }
      const keys = Object.keys(values);
      await connection.query(
        `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
        keys.map(k => values[k]),
      );
    }
    console.log(`${table}: ${rows.length} rows`);
  }

  let settingsUpdated = 0;
  for (const [key, value] of Object.entries(liveSettings)) {
    const [result] = await connection.query("UPDATE site_settings SET settingValue = ? WHERE settingKey = ?", [
      localise(value),
      key,
    ]);
    settingsUpdated += result.affectedRows;
  }
  console.log(`site_settings: ${settingsUpdated} keys updated`);

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
console.log("Done.");
