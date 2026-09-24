/**
 * Seed script for demo courses and success stories
 * Run with: npm run seed:courses
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Demo Courses based on international IELTS platform research
const demoCourses = [
  {
    name: "IELTS Complete Preparation Course",
    nameEn: "IELTS Complete Preparation Course",
    shortDescription: "Listening, Reading, Writing, Speaking — complete preparation for all four modules, aligned with British Council and IDP standards.",
    description: "Designed for both IELTS Academic and General Training, with personal attention across every module, 40+ hours of live classes, 15+ mock tests, individual writing feedback, speaking practice, and official Cambridge materials.",
    duration: "2 months",
    price: "৳8,500",
    originalPrice: "৳12,000",
    badge: "Most Popular",
    badgeColor: "bg-red-500",
    category: "ielts",
    level: "all",
    features: JSON.stringify(["40+ hours of live classes", "15+ full mock tests", "1-on-1 Speaking Practice", "Writing task feedback", "Cambridge Official Materials", "Lifetime resource access"]),
    learningOutcomes: JSON.stringify(["Achieve IELTS Band 6.5–7.5", "Confidence in every module", "Master exam strategies", "Time-management skills"]),
    schedule: "5 days a week, 7–9 PM",
    maxStudents: 25,
    enrolledCount: 18,
    enrollMessage: "I would like to enroll in the IELTS Complete Preparation Course. Please share the details.",
    sortOrder: 1,
    isActive: true,
    isFeatured: true,
  },
  {
    name: "Spoken English Mastery",
    nameEn: "Spoken English Mastery Program",
    shortDescription: "Speak English confidently with practical, real-life conversation training.",
    description: "Designed for learners who hesitate to speak English. The course uses communicative teaching with daily conversation practice, pronunciation training, vocabulary building, public speaking, and real-life role-play.",
    duration: "1 month",
    price: "৳5,000",
    originalPrice: "৳7,500",
    badge: "Trending",
    badgeColor: "bg-green-500",
    category: "spoken",
    level: "beginner",
    features: JSON.stringify(["Daily Conversation Practice", "Pronunciation Training", "Vocabulary Building", "Public Speaking Skills", "Real-life Role-play", "Certificate of Completion"]),
    learningOutcomes: JSON.stringify(["Speak English confidently", "Accurate pronunciation", "Everyday conversation skills", "Interview preparation"]),
    schedule: "6 days a week, 10–11:30 AM",
    maxStudents: 20,
    enrolledCount: 15,
    enrollMessage: "I would like to enroll in Spoken English Mastery. Please share the details.",
    sortOrder: 2,
    isActive: true,
    isFeatured: true,
  },
  {
    name: "IELTS VIP Batch",
    nameEn: "IELTS VIP Intensive Batch",
    shortDescription: "Personal attention in a small batch of up to 10 students.",
    description: "Our premium IELTS program limits each batch to 10 students for maximum personal attention. It includes unlimited mock tests, daily writing feedback, weekly one-to-one speaking sessions, and a personalized study plan.",
    duration: "3 months",
    price: "৳15,000",
    originalPrice: "৳20,000",
    badge: "Premium",
    badgeColor: "bg-purple-500",
    category: "ielts",
    level: "intermediate",
    features: JSON.stringify(["Maximum 10 students per batch", "Unlimited Mock Tests", "Daily Writing Feedback", "Weekly 1-on-1 Speaking", "Personalized Study Plan", "Score Guarantee"]),
    learningOutcomes: JSON.stringify(["Achieve Band 7.0+", "Advanced skills in every module", "Exam confidence", "Time management mastery"]),
    schedule: "5 days a week, 4–6:30 PM",
    maxStudents: 10,
    enrolledCount: 7,
    enrollMessage: "I would like to enroll in the IELTS VIP Batch. Please share the details.",
    sortOrder: 3,
    isActive: true,
    isFeatured: true,
  },
  {
    name: "Basic Grammar & Foundation",
    nameEn: "Basic Grammar & English Foundation",
    shortDescription: "Build a strong English grammar foundation before IELTS or Spoken English.",
    description: "A practical foundation for beginners and learners who need stronger grammar. It covers parts of speech, tense, voice, narration, and sentence structure before progressing to IELTS or Spoken English.",
    duration: "1.5 months",
    price: "৳3,500",
    originalPrice: "৳5,000",
    badge: "Foundation",
    badgeColor: "bg-blue-500",
    category: "grammar",
    level: "beginner",
    features: JSON.stringify(["Parts of Speech fundamentals", "Tense, Voice, Narration", "Daily Practice Sheets", "Weekly Assessment", "Clear explanations", "IELTS-ready Foundation"]),
    learningOutcomes: JSON.stringify(["Strong grammar foundation", "Accurate sentence construction", "Ready for an IELTS course", "Greater confidence"]),
    schedule: "4 days a week, 6–7:30 PM",
    maxStudents: 30,
    enrolledCount: 22,
    enrollMessage: "I would like to enroll in Basic Grammar & Foundation. Please share the details.",
    sortOrder: 4,
    isActive: true,
    isFeatured: false,
  },
  {
    name: "IELTS Writing Masterclass",
    nameEn: "IELTS Writing Task 1 & 2 Masterclass",
    shortDescription: "Specialized preparation for Band 7+ in Writing Tasks 1 and 2, with individual feedback.",
    description: "A focused course for improving IELTS Writing. Learn strategies for Academic and General Task 1 and Task 2 essays, with detailed feedback on every submission.",
    duration: "6 weeks",
    price: "৳6,000",
    originalPrice: "৳8,500",
    badge: "Specialized",
    badgeColor: "bg-orange-500",
    category: "ielts",
    level: "intermediate",
    features: JSON.stringify(["Task 1 and Task 2 strategies", "20+ practice essays", "Feedback on every submission", "Band descriptor analysis", "Model Answer Analysis", "Vocabulary Enhancement"]),
    learningOutcomes: JSON.stringify(["Achieve Writing Band 7+", "Task Achievement mastery", "Coherence & Cohesion", "Improve lexical resource"]),
    schedule: "3 days a week, 8–9:30 PM",
    maxStudents: 15,
    enrolledCount: 11,
    enrollMessage: "I would like to enroll in the IELTS Writing Masterclass. Please share the details.",
    sortOrder: 5,
    isActive: true,
    isFeatured: false,
  },
  {
    name: "Study Abroad Guidance",
    nameEn: "Complete Study Abroad Guidance Package",
    shortDescription: "Complete guidance for university selection, SOPs, applications, scholarships, and visas.",
    description: "Complete support after IELTS, including university selection, statement-of-purpose writing, applications, scholarships, visa guidance, and pre-departure orientation.",
    duration: "Ongoing Support",
    price: "৳10,000",
    originalPrice: "৳15,000",
    badge: "New",
    badgeColor: "bg-teal-500",
    category: "study-abroad",
    level: "all",
    features: JSON.stringify(["University Selection Guide", "SOP & LOR Writing Help", "Application Process Support", "Scholarship Guidance", "Visa Application Help", "Pre-departure Orientation"]),
    learningOutcomes: JSON.stringify(["Choose the right university", "Build a strong application", "Visa application success", "Prepare to study abroad"]),
    schedule: "Flexible personal schedule",
    maxStudents: null,
    enrolledCount: 45,
    enrollMessage: "I would like study-abroad guidance. Please share the details.",
    sortOrder: 6,
    isActive: true,
    isFeatured: false,
  },
];

console.log('Seeding demo courses...');
for (const course of demoCourses) {
  try {
    await connection.execute(
      `INSERT INTO courses (name, nameEn, shortDescription, description, duration, price, originalPrice, badge, badgeColor, category, level, features, learningOutcomes, schedule, maxStudents, enrolledCount, enrollMessage, sortOrder, isActive, isFeatured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course.name,
        course.nameEn,
        course.shortDescription,
        course.description,
        course.duration,
        course.price,
        course.originalPrice,
        course.badge,
        course.badgeColor,
        course.category,
        course.level,
        course.features,
        course.learningOutcomes,
        course.schedule,
        course.maxStudents,
        course.enrolledCount,
        course.enrollMessage,
        course.sortOrder,
        course.isActive,
        course.isFeatured,
      ]
    );
    console.log(`  ✓ Created course: ${course.name}`);
  } catch (err) {
    console.error(`  ✗ Failed to create course: ${course.name}`, err.message);
  }
}

console.log('\nDone! Seeded', demoCourses.length, 'courses.');
await connection.end();
process.exit(0);
