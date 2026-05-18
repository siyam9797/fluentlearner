/**
 * Seed script for demo courses and success stories
 * Run with: node seed-courses.mjs
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
    name: "IELTS সম্পূর্ণ প্রস্তুতি কোর্স",
    nameEn: "IELTS Complete Preparation Course",
    shortDescription: "Listening, Reading, Writing, Speaking — চারটি মডিউলের সম্পূর্ণ প্রস্তুতি। British Council ও IDP স্ট্যান্ডার্ড অনুসরণ।",
    description: "এই কোর্সটি IELTS Academic ও General Training উভয় পরীক্ষার জন্য ডিজাইন করা হয়েছে। আমাদের অভিজ্ঞ মেন্টররা প্রতিটি মডিউলে ব্যক্তিগত মনোযোগ দেন। কোর্সে রয়েছে: ৪০+ ঘণ্টা লাইভ ক্লাস, ১৫+ মক টেস্ট, ব্যক্তিগত Writing ফিডব্যাক, Speaking Practice সেশন, এবং Cambridge Official Materials।",
    duration: "2 মাস",
    price: "৳8,500",
    originalPrice: "৳12,000",
    badge: "Most Popular",
    badgeColor: "bg-red-500",
    category: "ielts",
    level: "all",
    features: JSON.stringify(["৪০+ ঘণ্টা লাইভ ক্লাস", "১৫+ Full Mock Test", "1-on-1 Speaking Practice", "Writing Task ফিডব্যাক", "Cambridge Official Materials", "লাইফটাইম রিসোর্স এক্সেস"]),
    learningOutcomes: JSON.stringify(["IELTS Band 6.5-7.5 অর্জন", "সব মডিউলে দক্ষতা", "পরীক্ষার কৌশল আয়ত্ত", "সময় ব্যবস্থাপনা দক্ষতা"]),
    schedule: "সপ্তাহে ৫ দিন, সন্ধ্যা ৭-৯ টা",
    maxStudents: 25,
    enrolledCount: 18,
    enrollMessage: "আমি IELTS সম্পূর্ণ প্রস্তুতি কোর্সে ভর্তি হতে চাই। বিস্তারিত জানতে চাই।",
    sortOrder: 1,
    isActive: true,
    isFeatured: true,
  },
  {
    name: "Spoken English Mastery",
    nameEn: "Spoken English Mastery Program",
    shortDescription: "আত্মবিশ্বাসের সাথে ইংরেজিতে কথা বলুন। ৩০ দিনে দৃশ্যমান পরিবর্তন। Real-life conversation practice।",
    description: "এই কোর্সটি বিশেষভাবে তাদের জন্য যারা ইংরেজিতে কথা বলতে ভয় পান বা দ্বিধাবোধ করেন। আমরা Communicative Language Teaching (CLT) পদ্ধতি ব্যবহার করি। কোর্সে রয়েছে: Daily Conversation Practice, Pronunciation Training, Vocabulary Building, Public Speaking Skills, এবং Real-life Situation Role-play।",
    duration: "1 মাস",
    price: "৳5,000",
    originalPrice: "৳7,500",
    badge: "Trending",
    badgeColor: "bg-green-500",
    category: "spoken",
    level: "beginner",
    features: JSON.stringify(["Daily Conversation Practice", "Pronunciation Training", "Vocabulary Building", "Public Speaking Skills", "Real-life Role-play", "Certificate of Completion"]),
    learningOutcomes: JSON.stringify(["আত্মবিশ্বাসী ইংরেজি বলা", "সঠিক উচ্চারণ", "দৈনন্দিন কথোপকথন দক্ষতা", "Interview প্রস্তুতি"]),
    schedule: "সপ্তাহে ৬ দিন, সকাল ১০-১১:৩০",
    maxStudents: 20,
    enrolledCount: 15,
    enrollMessage: "আমি Spoken English Mastery কোর্সে ভর্তি হতে চাই। বিস্তারিত জানতে চাই।",
    sortOrder: 2,
    isActive: true,
    isFeatured: true,
  },
  {
    name: "IELTS VIP Batch",
    nameEn: "IELTS VIP Intensive Batch",
    shortDescription: "সর্বোচ্চ ১০ জনের ব্যাচে ব্যক্তিগত মনোযোগ। গ্যারান্টিড স্কোর ইমপ্রুভমেন্ট।",
    description: "VIP Batch হলো আমাদের সবচেয়ে প্রিমিয়াম কোর্স। মাত্র ১০ জন শিক্ষার্থীর ব্যাচে প্রতিটি শিক্ষার্থী পায় সর্বোচ্চ ব্যক্তিগত মনোযোগ। এই কোর্সে রয়েছে: Unlimited Mock Tests, Daily Writing Feedback, Weekly 1-on-1 Speaking Sessions, Personalized Study Plan, এবং Score Guarantee।",
    duration: "3 মাস",
    price: "৳15,000",
    originalPrice: "৳20,000",
    badge: "Premium",
    badgeColor: "bg-purple-500",
    category: "ielts",
    level: "intermediate",
    features: JSON.stringify(["Max ১০ জন/ব্যাচ", "Unlimited Mock Tests", "Daily Writing Feedback", "Weekly 1-on-1 Speaking", "Personalized Study Plan", "Score Guarantee"]),
    learningOutcomes: JSON.stringify(["Band 7.0+ অর্জন", "প্রতিটি মডিউলে expert-level", "পরীক্ষার মানসিক প্রস্তুতি", "Time management mastery"]),
    schedule: "সপ্তাহে ৫ দিন, বিকাল ৪-৬:৩০",
    maxStudents: 10,
    enrolledCount: 7,
    enrollMessage: "আমি IELTS VIP Batch-এ ভর্তি হতে চাই। বিস্তারিত জানতে চাই।",
    sortOrder: 3,
    isActive: true,
    isFeatured: true,
  },
  {
    name: "Basic Grammar & Foundation",
    nameEn: "Basic Grammar & English Foundation",
    shortDescription: "ইংরেজি গ্রামারের ভিত্তি মজবুত করুন। IELTS বা Spoken English-এর আগে এই কোর্স আপনার জন্য।",
    description: "যারা ইংরেজিতে একদম নতুন বা গ্রামারে দুর্বল, তাদের জন্য এই কোর্স। Parts of Speech, Tense, Voice, Narration, Sentence Structure — সবকিছু সহজ বাংলায় শেখানো হয়। কোর্স শেষে আপনি IELTS বা Spoken English কোর্সে যোগ দেওয়ার জন্য প্রস্তুত হবেন।",
    duration: "1.5 মাস",
    price: "৳3,500",
    originalPrice: "৳5,000",
    badge: "Foundation",
    badgeColor: "bg-blue-500",
    category: "grammar",
    level: "beginner",
    features: JSON.stringify(["Parts of Speech থেকে শুরু", "Tense, Voice, Narration", "Daily Practice Sheets", "Weekly Assessment", "বাংলায় ব্যাখ্যা", "IELTS-ready Foundation"]),
    learningOutcomes: JSON.stringify(["গ্রামারের ভিত্তি মজবুত", "সঠিক বাক্য গঠন", "IELTS কোর্সের জন্য প্রস্তুত", "আত্মবিশ্বাস বৃদ্ধি"]),
    schedule: "সপ্তাহে ৪ দিন, সন্ধ্যা ৬-৭:৩০",
    maxStudents: 30,
    enrolledCount: 22,
    enrollMessage: "আমি Basic Grammar & Foundation কোর্সে ভর্তি হতে চাই। বিস্তারিত জানতে চাই।",
    sortOrder: 4,
    isActive: true,
    isFeatured: false,
  },
  {
    name: "IELTS Writing Masterclass",
    nameEn: "IELTS Writing Task 1 & 2 Masterclass",
    shortDescription: "Writing Task 1 ও Task 2-তে Band 7+ পেতে বিশেষায়িত কোর্স। প্রতিটি লেখায় ব্যক্তিগত ফিডব্যাক।",
    description: "IELTS Writing-এ অনেকেই কম স্কোর পান। এই কোর্সটি বিশেষভাবে Writing দক্ষতা বাড়ানোর জন্য ডিজাইন করা। Task 1 (Academic: Graph/Chart, General: Letter) এবং Task 2 (Essay) উভয়ের জন্য কৌশল শেখানো হয়। প্রতিটি submission-এ বিস্তারিত ফিডব্যাক দেওয়া হয়।",
    duration: "6 সপ্তাহ",
    price: "৳6,000",
    originalPrice: "৳8,500",
    badge: "Specialized",
    badgeColor: "bg-orange-500",
    category: "ielts",
    level: "intermediate",
    features: JSON.stringify(["Task 1 & Task 2 কৌশল", "২০+ Practice Essays", "প্রতিটি লেখায় ফিডব্যাক", "Band Descriptor বিশ্লেষণ", "Model Answer Analysis", "Vocabulary Enhancement"]),
    learningOutcomes: JSON.stringify(["Writing Band 7+ অর্জন", "Task Achievement mastery", "Coherence & Cohesion", "Lexical Resource উন্নয়ন"]),
    schedule: "সপ্তাহে ৩ দিন, রাত ৮-৯:৩০",
    maxStudents: 15,
    enrolledCount: 11,
    enrollMessage: "আমি IELTS Writing Masterclass-এ ভর্তি হতে চাই। বিস্তারিত জানতে চাই।",
    sortOrder: 5,
    isActive: true,
    isFeatured: false,
  },
  {
    name: "Study Abroad Guidance",
    nameEn: "Complete Study Abroad Guidance Package",
    shortDescription: "IELTS স্কোরের পর কী করবেন? University selection, SOP, Visa application — সম্পূর্ণ গাইডেন্স।",
    description: "IELTS স্কোর পাওয়ার পর বিদেশে পড়তে যাওয়ার পুরো প্রক্রিয়ায় আমরা সাহায্য করি। University selection, Statement of Purpose (SOP) writing, Application process, Scholarship guidance, Visa application, এবং Pre-departure orientation — সবকিছু এক জায়গায়।",
    duration: "Ongoing Support",
    price: "৳10,000",
    originalPrice: "৳15,000",
    badge: "New",
    badgeColor: "bg-teal-500",
    category: "study-abroad",
    level: "all",
    features: JSON.stringify(["University Selection Guide", "SOP & LOR Writing Help", "Application Process Support", "Scholarship Guidance", "Visa Application Help", "Pre-departure Orientation"]),
    learningOutcomes: JSON.stringify(["সঠিক University নির্বাচন", "শক্তিশালী Application", "Visa সাফল্য", "বিদেশে পড়ার স্বপ্ন পূরণ"]),
    schedule: "ব্যক্তিগত সময়সূচি অনুযায়ী",
    maxStudents: null,
    enrolledCount: 45,
    enrollMessage: "আমি Study Abroad Guidance নিতে চাই। বিস্তারিত জানতে চাই।",
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
