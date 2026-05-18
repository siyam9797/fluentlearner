import { eq, desc, asc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, appUsers, courses, successStories, batches, paymentSettings, enrollments, siteSettings, type AppUser, type InsertAppUser, type User, type InsertCourse, type InsertSuccessStory, type InsertBatch, type InsertPaymentSetting, type InsertEnrollment, type InsertSiteSetting } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// ADMIN EMAILS — these emails get admin role automatically on login
// ============================================
const ADMIN_EMAILS = [
  'jarifurrahim@gmail.com',
  'aditow.zahid@gmail.com',
  'rashik@jarifurrahim.one',
];

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// ============================================
// USER QUERIES
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || isAdminEmail(user.email)) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// APP USER QUERIES — email/password auth
// ============================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function appUserToAuthUser(appUser: AppUser): User {
  return {
    id: appUser.id,
    openId: `app:${appUser.id}`,
    name: appUser.name,
    email: appUser.email,
    loginMethod: "email-password",
    role: appUser.role === "admin" ? "admin" : "user",
    createdAt: appUser.createdAt,
    updatedAt: appUser.updatedAt,
    lastSignedIn: appUser.lastSignedIn ?? appUser.createdAt,
  };
}

export async function getAppUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get app user: database not available");
    return undefined;
  }

  const result = await db.select().from(appUsers).where(eq(appUsers.email, normalizeEmail(email))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get app user: database not available");
    return undefined;
  }

  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppUser(data: InsertAppUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(appUsers).values({
    ...data,
    email: normalizeEmail(data.email),
  });
  return { id: result[0].insertId };
}

export async function updateAppUserLastSignedIn(id: number, lastSignedIn = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(appUsers).set({ lastSignedIn }).where(eq(appUsers.id, id));
}

// ============================================
// COURSE QUERIES
// ============================================

export async function getActiveCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses)
    .where(eq(courses.isActive, true))
    .orderBy(asc(courses.sortOrder), desc(courses.createdAt));
}

export async function getFeaturedCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses)
    .where(and(eq(courses.isActive, true), eq(courses.isFeatured, true)))
    .orderBy(asc(courses.sortOrder));
}

export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).orderBy(asc(courses.sortOrder), desc(courses.createdAt));
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.isActive, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCourse(data: InsertCourse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(courses).values(data);
  return { id: result[0].insertId };
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(courses).where(eq(courses.id, id));
}

// ============================================
// SUCCESS STORY QUERIES
// ============================================

export async function getActiveSuccessStories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(successStories)
    .where(eq(successStories.isActive, true))
    .orderBy(asc(successStories.sortOrder), desc(successStories.createdAt));
}

export async function getFeaturedSuccessStories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(successStories)
    .where(and(eq(successStories.isActive, true), eq(successStories.isFeatured, true)))
    .orderBy(asc(successStories.sortOrder));
}

export async function getAllSuccessStories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(successStories).orderBy(asc(successStories.sortOrder), desc(successStories.createdAt));
}

export async function getSuccessStoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(successStories).where(eq(successStories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSuccessStory(data: InsertSuccessStory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(successStories).values(data);
  return { id: result[0].insertId };
}

export async function updateSuccessStory(id: number, data: Partial<InsertSuccessStory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(successStories).set(data).where(eq(successStories.id, id));
}

export async function deleteSuccessStory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(successStories).where(eq(successStories.id, id));
}

export async function getSuccessStoriesCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(successStories).where(eq(successStories.isActive, true));
  return result[0]?.count ?? 0;
}

// ============================================
// BATCH QUERIES
// ============================================

export async function getActiveBatches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batches)
    .where(and(eq(batches.isActive, true), eq(batches.isOpen, true)))
    .orderBy(desc(batches.createdAt));
}

export async function getAllBatches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batches).orderBy(desc(batches.createdAt));
}

export async function getBatchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(batches).where(eq(batches.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBatch(data: InsertBatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(batches).values(data);
  return { id: result[0].insertId };
}

export async function updateBatch(id: number, data: Partial<InsertBatch>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(batches).set(data).where(eq(batches.id, id));
}

export async function deleteBatch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(batches).where(eq(batches.id, id));
}

// ============================================
// PAYMENT SETTINGS QUERIES
// ============================================

export async function getActivePaymentSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentSettings)
    .where(eq(paymentSettings.isActive, true))
    .orderBy(asc(paymentSettings.sortOrder));
}

export async function getAllPaymentSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentSettings).orderBy(asc(paymentSettings.sortOrder));
}

export async function createPaymentSetting(data: InsertPaymentSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(paymentSettings).values(data);
  return { id: result[0].insertId };
}

export async function updatePaymentSetting(id: number, data: Partial<InsertPaymentSetting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(paymentSettings).set(data).where(eq(paymentSettings.id, id));
}

export async function deletePaymentSetting(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(paymentSettings).where(eq(paymentSettings.id, id));
}

// ============================================
// ENROLLMENT QUERIES
// ============================================

export async function getAllEnrollments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(enrollments).orderBy(desc(enrollments.createdAt));
}

export async function getEnrollmentsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(enrollments)
    .where(eq(enrollments.status, status as any))
    .orderBy(desc(enrollments.createdAt));
}

export async function getEnrollmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEnrollment(data: InsertEnrollment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(enrollments).values(data);
  return { id: result[0].insertId };
}

export async function updateEnrollment(id: number, data: Partial<InsertEnrollment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(enrollments).set(data).where(eq(enrollments.id, id));
}

export async function checkTransactionIdExists(transactionId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.transactionId, transactionId));
  return (result[0]?.count ?? 0) > 0;
}

export async function getEnrollmentStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, verified: 0, rejected: 0 };
  const total = await db.select({ count: sql<number>`count(*)` }).from(enrollments);
  const pending = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.status, "pending"));
  const verified = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.status, "verified"));
  const rejected = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.status, "rejected"));
  return {
    total: total[0]?.count ?? 0,
    pending: pending[0]?.count ?? 0,
    verified: verified[0]?.count ?? 0,
    rejected: rejected[0]?.count ?? 0,
  };
}

// ============================================
// SITE SETTINGS QUERIES
// ============================================

export async function getAllSiteSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).orderBy(asc(siteSettings.settingGroup), asc(siteSettings.settingKey));
}

export async function getSiteSettingsByGroup(group: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings)
    .where(eq(siteSettings.settingGroup, group))
    .orderBy(asc(siteSettings.settingKey));
}

export async function getSiteSettingByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings)
    .where(eq(siteSettings.settingKey, key))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSiteSetting(key: string, value: string | null, type?: string, group?: string, label?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSiteSettingByKey(key);
  if (existing) {
    await db.update(siteSettings)
      .set({ settingValue: value })
      .where(eq(siteSettings.settingKey, key));
  } else {
    await db.insert(siteSettings).values({
      settingKey: key,
      settingValue: value,
      settingType: type || "text",
      settingGroup: group || "general",
      label: label || key,
    });
  }
}

export async function bulkUpsertSiteSettings(settings: { key: string; value: string | null; type?: string; group?: string; label?: string }[]) {
  for (const s of settings) {
    await upsertSiteSetting(s.key, s.value, s.type, s.group, s.label);
  }
}

export async function generateStudentId(courseId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Format: FL-YYMM-XXXX (e.g., FL-2603-0042)
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `FL-${yy}${mm}`;
  // Count existing enrollments with this prefix
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(sql`${enrollments.studentId} LIKE ${prefix + '%'}`);
  const nextNum = (result[0]?.count ?? 0) + 1;
  return `${prefix}-${String(nextNum).padStart(4, "0")}`;
}
