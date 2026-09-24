/**
 * Seed at least five demo records for every data-driven dashboard section.
 * Safe to rerun: records are matched by stable names or transaction IDs.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const connection = await mysql.createConnection(databaseUrl);

async function ensure(table, matchColumn, matchValue, values) {
  const [existing] = await connection.execute(
    `SELECT id FROM \`${table}\` WHERE \`${matchColumn}\` = ? LIMIT 1`,
    [matchValue],
  );
  if (existing.length) return existing[0].id;

  const columns = Object.keys(values);
  const placeholders = columns.map(() => "?").join(", ");
  const [result] = await connection.execute(
    `INSERT INTO \`${table}\` (${columns.map(column => `\`${column}\``).join(", ")}) VALUES (${placeholders})`,
    columns.map(column => values[column]),
  );
  return result.insertId;
}

const courseSeeds = [
  ["Demo IELTS Complete", "demo-ielts-complete", "ielts", "all", "8 weeks", "৳8,500"],
  ["Demo Spoken English", "demo-spoken-english", "spoken", "beginner", "6 weeks", "৳5,000"],
  ["Demo IELTS Writing", "demo-ielts-writing", "ielts", "intermediate", "5 weeks", "৳6,000"],
  ["Demo Grammar Foundation", "demo-grammar-foundation", "grammar", "beginner", "4 weeks", "৳3,500"],
  ["Demo Study Abroad", "demo-study-abroad", "study-abroad", "all", "Flexible", "৳10,000"],
];

const courseIds = [];
for (const [name, slug, category, level, duration, price] of courseSeeds) {
  courseIds.push(await ensure("courses", "slug", slug, {
    name, nameEn: name, slug, category, level, duration, price,
    shortDescription: `Sample content for ${name}.`,
    description: `This is a local demonstration course used to preview and test dashboard features.`,
    features: JSON.stringify(["Live classes", "Practice materials", "Instructor feedback"]),
    learningOutcomes: JSON.stringify(["Build confidence", "Improve accuracy", "Track progress"]),
    schedule: "Sunday–Thursday, 7:00 PM",
    maxStudents: 30,
    enrolledCount: 5,
    sortOrder: courseIds.length + 20,
    isActive: true,
    isFeatured: courseIds.length < 2,
  }));
}

const paymentSeeds = [
  ["Demo bKash", "01700000001", "Merchant"],
  ["Demo Nagad", "01700000002", "Personal"],
  ["Demo Rocket", "01700000003", "Personal"],
  ["Demo Bank Transfer", "DEMO-AC-0004", "Current"],
  ["Demo Cash Office", "OFFICE-0005", "Cash"],
];

for (const [methodName, accountNumber, accountType] of paymentSeeds) {
  await ensure("payment_settings", "methodName", methodName, {
    methodName, accountNumber, accountType,
    accountHolder: "FluentLearner Demo",
    instructions: "Demo payment method for local dashboard testing. Do not send real money.",
    sortOrder: paymentSeeds.findIndex(item => item[0] === methodName) + 20,
    isActive: true,
  });
}

const batchIds = [];
for (let index = 0; index < 5; index += 1) {
  const name = `Demo Batch ${index + 1}`;
  batchIds.push(await ensure("batches", "name", name, {
    name,
    courseId: courseIds[index],
    startDate: `2026-${String(index + 1).padStart(2, "0")}-15T00:00:00.000Z`,
    maxCapacity: 20 + (index * 5),
    currentCount: 4 + (index * 2),
    isOpen: index !== 4,
    isActive: true,
  }));
}

const enrollmentSeeds = [
  ["Ayesha Rahman", "pending", "DEMO-TXN-001", null],
  ["Farhan Ahmed", "verified", "DEMO-TXN-002", "FL-2601-0002"],
  ["Nusrat Jahan", "rejected", "DEMO-TXN-003", null],
  ["Tanvir Hasan", "pending", "DEMO-TXN-004", null],
  ["Maliha Karim", "verified", "DEMO-TXN-005", "FL-2601-0005"],
];

for (let index = 0; index < enrollmentSeeds.length; index += 1) {
  const [studentName, status, transactionId, studentId] = enrollmentSeeds[index];
  await ensure("enrollments", "transactionId", transactionId, {
    studentName,
    studentMobile: `0171000000${index + 1}`,
    studentEmail: `demo.student${index + 1}@example.com`,
    courseId: courseIds[index],
    batchId: status === "verified" ? batchIds[index] : null,
    paymentMethod: paymentSeeds[index][0],
    paymentAccountNumber: `0172000000${index + 1}`,
    transactionId,
    paymentAmount: String(3500 + (index * 1000)),
    enrollmentStatus: status,
    studentId,
    adminNotes: "Local demo enrollment.",
    rejectionReason: status === "rejected" ? "Demo payment could not be verified." : null,
    verifiedAt: status === "verified" ? new Date() : null,
  });
}

const storySeeds = [
  ["Demo Student One", "/success-1.jpg", "7.5", "ielts-score"],
  ["Demo Student Two", "/success-2.jpg", "8.0", "ielts-score"],
  ["Demo Student Three", "/success-3.jpg", null, "visa-success"],
  ["Demo Student Four", "/success-4.jpg", null, "university-admission"],
  ["Demo Student Five", "/success-5.jpg", "7.0", "ielts-score"],
];

for (let index = 0; index < storySeeds.length; index += 1) {
  const [studentName, imageUrl, bandScore, category] = storySeeds[index];
  await ensure("success_stories", "studentName", studentName, {
    studentName, imageUrl, bandScore, storyCategory: category,
    courseName: courseSeeds[index][0],
    testimonial: "Demo success story for previewing the dashboard and public gallery.",
    achievementDate: `2026-${String(index + 1).padStart(2, "0")}-10`,
    sortOrder: index + 20,
    isActive: true,
    isFeatured: index < 3,
  });
}

await connection.end();
console.log("Demo data ready: 5 courses, 5 payments, 5 batches, 5 enrollments, and 5 success stories.");
