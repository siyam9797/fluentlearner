/**
 * Listening vocabulary collection (from "Listening 250 misspelled words").
 * Replaces every existing vocabulary word, in one transaction, so reruns always end with exactly this list.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import part1 from "./data/listening-vocabulary-1.mjs";
import part2 from "./data/listening-vocabulary-2.mjs";
import part3 from "./data/listening-vocabulary-3.mjs";
import part4 from "./data/listening-vocabulary-4.mjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

// Words repeat across the source's lists; the table requires unique words, so keep the first occurrence.
const seen = new Set();
const words = [...part1, ...part2, ...part3, ...part4].filter(([word]) => {
  const key = word.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const db = await mysql.createConnection(process.env.DATABASE_URL);
await db.execute(`CREATE TABLE IF NOT EXISTS vocabulary_words (
  id int AUTO_INCREMENT PRIMARY KEY, word varchar(120) NOT NULL UNIQUE,
  partOfSpeech varchar(50) NOT NULL, meaning text NOT NULL, example text NOT NULL,
  topic varchar(100) NOT NULL, isActive boolean NOT NULL DEFAULT true,
  sortOrder int NOT NULL DEFAULT 0, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`);

await db.beginTransaction();
try {
  const [removed] = await db.execute("DELETE FROM vocabulary_words");
  for (const [index, item] of words.entries()) {
    await db.execute(
      `INSERT INTO vocabulary_words (word,partOfSpeech,meaning,example,topic,isActive,sortOrder)
       VALUES (?,?,?,?,?,true,?)`,
      [...item, index]
    );
  }
  await db.commit();
  console.log(
    `Removed ${removed.affectedRows} old words. Vocabulary ready: ${words.length} words.`
  );
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
