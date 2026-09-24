/** Starter IELTS vocabulary collection. Safe to rerun; words are upserted. */
import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);
await db.execute(`CREATE TABLE IF NOT EXISTS vocabulary_words (
  id int AUTO_INCREMENT PRIMARY KEY, word varchar(120) NOT NULL UNIQUE,
  partOfSpeech varchar(50) NOT NULL, meaning text NOT NULL, example text NOT NULL,
  topic varchar(100) NOT NULL, isActive boolean NOT NULL DEFAULT true,
  sortOrder int NOT NULL DEFAULT 0, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`);

const words = [
  ["allocate","verb","to distribute something for a particular purpose","The council allocated more funding to public transport.","Academic"],
  ["coherent","adjective","logical, clear, and easy to understand","A coherent essay develops one central argument.","Writing"],
  ["consecutive","adjective","following continuously, one after another","Attendance increased for three consecutive years.","Academic"],
  ["deteriorate","verb","to become progressively worse","Air quality may deteriorate as traffic increases.","Environment"],
  ["disparity","noun","a significant difference or inequality","The report highlights a disparity between urban and rural schools.","Society"],
  ["diverse","adjective","including many different types or people","Large cities often have culturally diverse populations.","Society"],
  ["enhance","verb","to improve the quality or value of something","Green spaces can enhance residents' quality of life.","Academic"],
  ["feasible","adjective","possible and practical to achieve","Remote work is not feasible for every occupation.","Work"],
  ["fluctuate","verb","to rise and fall irregularly","Energy prices fluctuated throughout the period.","Writing"],
  ["fundamental","adjective","basic and extremely important","Trust is fundamental to a healthy community.","Academic"],
  ["implement","verb","to put a plan or policy into action","The government implemented stricter recycling rules.","Government"],
  ["incentive","noun","something that encourages a person to act","Tax reductions can provide an incentive to use clean energy.","Government"],
  ["inevitable","adjective","certain to happen and impossible to avoid","Some degree of technological change is inevitable.","Technology"],
  ["innovative","adjective","introducing effective new ideas or methods","The school adopted an innovative approach to language teaching.","Education"],
  ["mitigate","verb","to make a harmful situation less severe","Planting trees can help mitigate urban heat.","Environment"],
  ["predominant","adjective","present as the strongest or main element","Private cars remain the predominant form of transport.","Academic"],
  ["prevalent","adjective","common or widespread in a particular place","Digital payment is increasingly prevalent among young adults.","Technology"],
  ["profound","adjective","having a deep or powerful effect","Education can have a profound impact on social mobility.","Education"],
  ["reluctant","adjective","unwilling or hesitant to do something","Some employees are reluctant to adopt new software.","Work"],
  ["resilient","adjective","able to recover quickly from difficulty","Cities need resilient infrastructure to manage extreme weather.","Environment"],
  ["significant","adjective","important or large enough to be noticeable","The data shows a significant decline in unemployment.","Writing"],
  ["sustainable","adjective","able to continue without damaging the environment","Cycling is a sustainable mode of urban transport.","Environment"],
  ["undermine","verb","to weaken something gradually","Misinformation can undermine public confidence.","Society"],
  ["viable","adjective","capable of working successfully","Solar power is now a viable option for many households.","Technology"],
];

for (const [index, item] of words.entries()) {
  await db.execute(`INSERT INTO vocabulary_words (word,partOfSpeech,meaning,example,topic,isActive,sortOrder)
    VALUES (?,?,?,?,?,true,?) ON DUPLICATE KEY UPDATE partOfSpeech=VALUES(partOfSpeech),meaning=VALUES(meaning),example=VALUES(example),topic=VALUES(topic)`, [...item, index]);
}
await db.end();
console.log(`Vocabulary ready: ${words.length} starter words.`);
