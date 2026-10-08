import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

export const USER_ROLES = [
  "super_admin",
  "admin",
  "staff",
  "mentor",
  "student",
] as const;

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", USER_ROLES).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * App-owned users for email/password authentication.
 * This runs beside the legacy OAuth users table during migration.
 */
export const appUsers = mysqlTable("app_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  avatarUrl: text("avatarUrl"),
  targetBand: varchar("targetBand", { length: 8 }),
  role: mysqlEnum("role", USER_ROLES).default("student").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;

/**
 * Courses table — admin-managed courses
 * Admin can CRUD all fields from the dashboard
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  /** Course name in Bengali */
  name: varchar("name", { length: 255 }).notNull(),
  /** Course name in English (optional) */
  nameEn: varchar("nameEn", { length: 255 }),
  /** Short description / tagline */
  shortDescription: text("shortDescription"),
  /** Full description (supports markdown) */
  description: text("description"),
  /** Course thumbnail/cover image URL (S3) */
  imageUrl: text("imageUrl"),
  /** Course duration text e.g. "2 মাস" */
  duration: varchar("duration", { length: 100 }),
  /** Original price (before discount) e.g. "৳12,000" */
  originalPrice: varchar("originalPrice", { length: 50 }),
  /** Current/discounted price e.g. "৳8,500" */
  price: varchar("price", { length: 50 }),
  /** Badge text e.g. "Most Popular", "New", "Trending" */
  badge: varchar("badge", { length: 50 }),
  /** Badge color class for styling */
  badgeColor: varchar("badgeColor", { length: 50 }),
  /** Course type/category */
  category: mysqlEnum("category", [
    "ielts",
    "spoken",
    "grammar",
    "study-abroad",
    "other",
  ])
    .default("ielts")
    .notNull(),
  /** Course level */
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all"])
    .default("all")
    .notNull(),
  /** Key features as JSON array of strings */
  features: json("features").$type<string[]>(),
  /** What students will learn — JSON array */
  learningOutcomes: json("learningOutcomes").$type<string[]>(),
  /** Course schedule/timing info */
  schedule: text("schedule"),
  /** Maximum batch size */
  maxStudents: int("maxStudents"),
  /** Current enrolled count */
  enrolledCount: int("enrolledCount").default(0),
  /** Rich text full description (HTML/Bengali) */
  fullDescription: text("fullDescription"),
  /** Curriculum/Syllabus as JSON — array of {title, content} modules */
  curriculum: json("curriculum").$type<{ title: string; content: string }[]>(),
  /** Target audience description */
  targetAudience: text("targetAudience"),
  /** Instructor name */
  instructorName: varchar("instructorName", { length: 255 }),
  /** Instructor bio */
  instructorBio: text("instructorBio"),
  /** Instructor photo URL */
  instructorPhoto: text("instructorPhoto"),
  /** Course-specific FAQ as JSON — array of {question, answer} */
  courseFaq: json("courseFaq").$type<{ question: string; answer: string }[]>(),
  /** Introduction video URL (YouTube embed) */
  videoUrl: text("videoUrl"),
  /** URL-friendly slug for course detail page */
  slug: varchar("slug", { length: 255 }),
  /** WhatsApp enrollment message template */
  enrollMessage: text("enrollMessage"),
  /** Display order (lower = first) */
  sortOrder: int("sortOrder").default(0),
  /** Whether course is visible on public page */
  isActive: boolean("isActive").default(true),
  /** Whether course is featured on home page */
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Success Stories table — admin-managed achievement gallery
 * Admin uploads images and manages student achievements
 */
export const successStories = mysqlTable("success_stories", {
  id: int("id").autoincrement().primaryKey(),
  /** Student name */
  studentName: varchar("studentName", { length: 255 }).notNull(),
  /** Achievement image URL (S3) — the main visual */
  imageUrl: text("imageUrl").notNull(),
  /** Thumbnail URL (S3) — smaller version for grid */
  thumbnailUrl: text("thumbnailUrl"),
  /** IELTS band score achieved (e.g. 7.5) */
  bandScore: varchar("bandScore", { length: 10 }),
  /** Course taken */
  courseName: varchar("courseName", { length: 255 }),
  /** Student testimonial/quote */
  testimonial: text("testimonial"),
  /** Category of achievement */
  category: mysqlEnum("storyCategory", [
    "ielts-score",
    "visa-success",
    "university-admission",
    "spoken-english",
    "other",
  ])
    .default("ielts-score")
    .notNull(),
  /** Date of achievement */
  achievementDate: varchar("achievementDate", { length: 50 }),
  /** Display order */
  sortOrder: int("sortOrder").default(0),
  /** Whether visible on public page */
  isActive: boolean("isActive").default(true),
  /** Whether featured/pinned */
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessStory = typeof successStories.$inferSelect;
export type InsertSuccessStory = typeof successStories.$inferInsert;

/**
 * Batches table — admin-managed course batches
 * Each batch has a name, start date, capacity, and linked course
 */
export const batches = mysqlTable("batches", {
  id: int("id").autoincrement().primaryKey(),
  /** Batch name e.g. "মার্চ ২০২৬ ব্যাচ" */
  name: varchar("name", { length: 255 }).notNull(),
  /** Linked course ID (optional — can be general batch) */
  courseId: int("courseId"),
  /** Batch start date */
  startDate: varchar("startDate", { length: 50 }),
  /** Maximum capacity */
  maxCapacity: int("maxCapacity").default(30),
  /** Current enrolled count */
  currentCount: int("currentCount").default(0),
  /** Whether batch is accepting enrollments */
  isOpen: boolean("isOpen").default(true),
  /** Whether batch is visible */
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = typeof batches.$inferInsert;

/**
 * Payment Settings table — admin-configurable payment methods
 * Admin can add/edit bKash, Nagad, Rocket numbers and instructions
 */
export const paymentSettings = mysqlTable("payment_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** Payment method name e.g. "bKash", "Nagad", "Rocket", "Bank Transfer" */
  methodName: varchar("methodName", { length: 100 }).notNull(),
  /** Account type: Personal / Agent / Merchant */
  accountType: varchar("accountType", { length: 50 }),
  /** Account number e.g. "01729879855" */
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  /** Account holder name */
  accountHolder: varchar("accountHolder", { length: 255 }),
  /** Payment instructions (markdown supported) */
  instructions: text("instructions"),
  /** Icon/logo URL */
  iconUrl: text("iconUrl"),
  /** QR code image URL (S3) */
  qrCodeUrl: text("qrCodeUrl"),
  /** Display order */
  sortOrder: int("sortOrder").default(0),
  /** Whether this method is active */
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentSetting = typeof paymentSettings.$inferSelect;
export type InsertPaymentSetting = typeof paymentSettings.$inferInsert;

/**
 * Enrollments table — student enrollment submissions
 * Students submit enrollment form → admin verifies → assigns batch + student ID
 */
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  /** Student's full name */
  studentName: varchar("studentName", { length: 255 }).notNull(),
  /** Student's mobile/WhatsApp number */
  studentMobile: varchar("studentMobile", { length: 20 }).notNull(),
  /** Student's email (optional) */
  studentEmail: varchar("studentEmail", { length: 320 }),
  /** Selected course ID */
  courseId: int("courseId").notNull(),
  /** Selected batch ID (optional — admin can assign later) */
  batchId: int("batchId"),
  /** Payment method used e.g. "bKash", "Nagad" */
  paymentMethod: varchar("paymentMethod", { length: 100 }).notNull(),
  /** Payment account number (sender's number) */
  paymentAccountNumber: varchar("paymentAccountNumber", {
    length: 50,
  }).notNull(),
  /** Transaction ID from payment */
  transactionId: varchar("transactionId", { length: 100 }).notNull(),
  /** Payment amount in BDT */
  paymentAmount: varchar("paymentAmount", { length: 50 }).notNull(),
  /** Payment screenshot URL (S3) — optional proof */
  paymentScreenshotUrl: text("paymentScreenshotUrl"),
  /** Enrollment status */
  status: mysqlEnum("enrollmentStatus", [
    "pending",
    "verified",
    "rejected",
    "refunded",
  ])
    .default("pending")
    .notNull(),
  /** Admin-assigned student ID / roll number */
  studentId: varchar("studentId", { length: 50 }),
  /** Admin notes */
  adminNotes: text("adminNotes"),
  /** Rejection reason (if rejected) */
  rejectionReason: text("rejectionReason"),
  /** Verified at timestamp */
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

/** Files and links published globally or to one admin-managed batch. */
export const learningResources = mysqlTable(
  "learning_resources",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    batchId: int("batchId"),
    fileUrl: text("fileUrl").notNull(),
    fileName: varchar("fileName", { length: 255 }),
    mimeType: varchar("mimeType", { length: 120 }),
    fileSize: int("fileSize"),
    isActive: boolean("isActive").default(true).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("learning_resources_batch_idx").on(table.batchId)]
);

export type LearningResource = typeof learningResources.$inferSelect;
export type InsertLearningResource = typeof learningResources.$inferInsert;

/** IELTS vocabulary entries managed by Admin and studied in Student Resources. */
export const vocabularyWords = mysqlTable("vocabulary_words", {
  id: int("id").autoincrement().primaryKey(),
  word: varchar("word", { length: 120 }).notNull().unique(),
  partOfSpeech: varchar("partOfSpeech", { length: 50 }).notNull(),
  meaning: text("meaning").notNull(),
  example: text("example").notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type InsertVocabularyWord = typeof vocabularyWords.$inferInsert;

/**
 * Site Settings table — admin-editable website content
 * Key-value store for hero, about, contact, footer, social links etc.
 */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique setting key e.g. 'hero_title', 'about_description', 'contact_phone' */
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  /** Setting value (text/longtext) */
  settingValue: text("settingValue"),
  /** Setting type for UI rendering: text, textarea, image, url */
  settingType: varchar("settingType", { length: 20 }).default("text").notNull(),
  /** Group/section for admin UI organization */
  settingGroup: varchar("settingGroup", { length: 50 })
    .default("general")
    .notNull(),
  /** Display label in Bengali */
  label: varchar("label", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// ============================================
// IELTS MOCK TESTS
// ============================================

export const MOCK_MODULES = [
  "reading",
  "listening",
  "writing",
  "speaking",
] as const;
export const MOCK_QUESTION_TYPES = [
  "mcq",
  "tfng",
  "ynng",
  "short_answer",
  "writing",
  "speaking",
  "one_choice",
  "two_choices",
  "three_choices",
  "four_choices",
  "five_choices",
  "matching",
  "matching_features",
  "matching_information",
  "matching_sentence_endings",
  "matching_headings",
  "map_labeling",
  "plan_labeling",
  "visual_labeling",
  "diagram_labeling",
  "form_completion",
  "note_completion",
  "table_completion",
  "flow_chart_completion",
  "summary_completion",
  "sentence_completion",
  "short_answers",
] as const;

/** One mock test covers one IELTS module. */
export const mockTests = mysqlTable(
  "mock_tests",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    module: mysqlEnum("module", MOCK_MODULES).notNull(),
    /** Reading band conversion differs between Academic and General Training */
    variant: mysqlEnum("variant", ["academic", "general"])
      .default("academic")
      .notNull(),
    /** Unused: students choose exam or practice per attempt (mock_attempts.mode). Kept so no migration is needed. */
    mode: mysqlEnum("mode", ["exam", "practice"]).default("exam").notNull(),
    /** Time limit in minutes for timed exam attempts; null falls back to DEFAULT_DURATION_MINUTES */
    durationMinutes: int("durationMinutes"),
    /** null = unlimited */
    maxAttempts: int("maxAttempts"),
    isPublished: boolean("isPublished").default(false).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    /**
     * full = passages/audio/prompts stored on the site;
     * answer_sheet = students use their own book, the site only stores the answer key.
     */
    format: mysqlEnum("format", ["full", "answer_sheet"])
      .default("full")
      .notNull(),
    /** Book series, e.g. "cambridge" for Cambridge IELTS 1–21 */
    series: varchar("series", { length: 50 }),
    bookNumber: int("bookNumber"),
    testNumber: int("testNumber"),
    /** Unused: question types now come from each question (see practiceTypeOfQuestion). Kept so no migration is needed. */
    practiceType: varchar("practiceType", { length: 60 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("mock_tests_series_idx").on(
      table.series,
      table.bookNumber,
      table.testNumber
    ),
    index("mock_tests_practice_type_idx").on(table.practiceType),
  ]
);

/** A reading passage, listening part, writing task or speaking part. */
export const mockSections = mysqlTable(
  "mock_sections",
  {
    id: int("id").autoincrement().primaryKey(),
    testId: int("testId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    instructions: text("instructions"),
    /** Reading passage text or writing/speaking context */
    content: text("content"),
    /** Optional Listening layout using [[question number]] placeholders. */
    questionLayout: text("questionLayout"),
    imageUrl: text("imageUrl"),
    audioUrl: text("audioUrl"),
    sortOrder: int("sortOrder").default(0).notNull(),
  },
  table => [index("mock_sections_test_idx").on(table.testId)]
);

export const mockQuestions = mysqlTable(
  "mock_questions",
  {
    id: int("id").autoincrement().primaryKey(),
    testId: int("testId").notNull(),
    sectionId: int("sectionId").notNull(),
    type: mysqlEnum("type", MOCK_QUESTION_TYPES).notNull(),
    /** Instructions shown immediately before this question/group. */
    instruction: text("instruction"),
    prompt: text("prompt").notNull(),
    /** Choices for mcq */
    options: json("options").$type<string[]>(),
    /** Accepted answers for auto-marked types (any match is correct) */
    answers: json("answers").$type<string[]>(),
    explanation: text("explanation"),
    points: int("points").default(1).notNull(),
    /** Writing tasks */
    minWords: int("minWords"),
    /** Speaking prompts */
    prepSeconds: int("prepSeconds"),
    responseSeconds: int("responseSeconds"),
    /** Speaking: the examiner asking the question, played before the student answers. */
    audioUrl: text("audioUrl"),
    sortOrder: int("sortOrder").default(0).notNull(),
  },
  table => [index("mock_questions_test_idx").on(table.testId)]
);

/** Stored AI evaluation of a Writing/Speaking attempt. */
export type AiEvaluation = {
  status: "pending" | "done" | "failed";
  /** Criterion name → band (multiples of 0.5) */
  criteria?: Record<string, number>;
  /** Short reason per criterion */
  comments?: Record<string, string>;
  band?: number;
  feedback?: string;
  answerFeedback?: { questionId: number; feedback: string }[];
  /** True once the AI result was written into the attempt's grade (practice tests) */
  applied?: boolean;
  model?: string;
  error?: string;
  createdAt: string;
};

export const mockAttempts = mysqlTable(
  "mock_attempts",
  {
    id: int("id").autoincrement().primaryKey(),
    testId: int("testId").notNull(),
    /** app_users.id of the student */
    userId: int("userId").notNull(),
    status: mysqlEnum("status", ["in_progress", "submitted", "graded"])
      .default("in_progress")
      .notNull(),
    /** Chosen by the student when starting: "exam" is timed and mentor-marked, "practice" is untimed with answers and AI marking shown straight away */
    mode: mysqlEnum("mode", ["exam", "practice"]).default("exam").notNull(),
    /** PRACTICE_TYPES key when the student drills one question type: only those questions are shown and marked */
    practiceType: varchar("practiceType", { length: 60 }),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    /** Hard deadline for timed attempts */
    deadlineAt: timestamp("deadlineAt"),
    submittedAt: timestamp("submittedAt"),
    rawScore: int("rawScore"),
    maxScore: int("maxScore"),
    band: varchar("band", { length: 8 }),
    /** Writing/Speaking criterion bands, e.g. { "Task Response": 6.5, ... } */
    criteria: json("criteria").$type<Record<string, number>>(),
    feedback: text("feedback"),
    gradedAt: timestamp("gradedAt"),
    /** AI marking of Writing/Speaking (see server/aiGrading.ts); applied as the grade for practice, a suggestion for exams */
    aiEvaluation: json("aiEvaluation").$type<AiEvaluation>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("mock_attempts_user_idx").on(table.userId),
    index("mock_attempts_test_idx").on(table.testId),
  ]
);

export const mockAnswers = mysqlTable(
  "mock_answers",
  {
    id: int("id").autoincrement().primaryKey(),
    attemptId: int("attemptId").notNull(),
    questionId: int("questionId").notNull(),
    response: text("response"),
    /** Recorded speaking answer */
    audioUrl: text("audioUrl"),
    isCorrect: boolean("isCorrect"),
    feedback: text("feedback"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("mock_answers_attempt_question_uq").on(
      table.attemptId,
      table.questionId
    ),
  ]
);

export type MockTest = typeof mockTests.$inferSelect;
export type MockSection = typeof mockSections.$inferSelect;
export type MockQuestion = typeof mockQuestions.$inferSelect;
export type MockAttempt = typeof mockAttempts.$inferSelect;
export type MockAnswer = typeof mockAnswers.$inferSelect;
