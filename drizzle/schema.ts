import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
  role: mysqlEnum("role", ["student", "staff", "admin"]).default("student").notNull(),
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
  category: mysqlEnum("category", ["ielts", "spoken", "grammar", "study-abroad", "other"]).default("ielts").notNull(),
  /** Course level */
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all"]).default("all").notNull(),
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
  curriculum: json("curriculum").$type<{title: string; content: string}[]>(),
  /** Target audience description */
  targetAudience: text("targetAudience"),
  /** Instructor name */
  instructorName: varchar("instructorName", { length: 255 }),
  /** Instructor bio */
  instructorBio: text("instructorBio"),
  /** Instructor photo URL */
  instructorPhoto: text("instructorPhoto"),
  /** Course-specific FAQ as JSON — array of {question, answer} */
  courseFaq: json("courseFaq").$type<{question: string; answer: string}[]>(),
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
  category: mysqlEnum("storyCategory", ["ielts-score", "visa-success", "university-admission", "spoken-english", "other"]).default("ielts-score").notNull(),
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
  paymentAccountNumber: varchar("paymentAccountNumber", { length: 50 }).notNull(),
  /** Transaction ID from payment */
  transactionId: varchar("transactionId", { length: 100 }).notNull(),
  /** Payment amount in BDT */
  paymentAmount: varchar("paymentAmount", { length: 50 }).notNull(),
  /** Payment screenshot URL (S3) — optional proof */
  paymentScreenshotUrl: text("paymentScreenshotUrl"),
  /** Enrollment status */
  status: mysqlEnum("enrollmentStatus", ["pending", "verified", "rejected", "refunded"]).default("pending").notNull(),
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
  settingGroup: varchar("settingGroup", { length: 50 }).default("general").notNull(),
  /** Display label in Bengali */
  label: varchar("label", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
