import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { verifyPassword } from "./_core/password";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  appUserToAuthUser,
  getActiveCourses,
  getFeaturedCourses,
  getAllCourses,
  getCourseById,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  getActiveSuccessStories,
  getFeaturedSuccessStories,
  getAllSuccessStories,
  getSuccessStoryById,
  createSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
  getSuccessStoriesCount,
  getActiveBatches,
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getActivePaymentSettings,
  getAllPaymentSettings,
  createPaymentSetting,
  updatePaymentSetting,
  deletePaymentSetting,
  getAllEnrollments,
  getEnrollmentsByStatus,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  checkTransactionIdExists,
  getEnrollmentStats,
  generateStudentId,
  getAllSiteSettings,
  bulkUpsertSiteSettings,
  getAppUserByEmail,
  updateAppUserLastSignedIn,
} from "./db";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";

// ============================================
// Zod schemas for validation
// ============================================

const courseInput = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  originalPrice: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  badgeColor: z.string().optional().nullable(),
  category: z.enum(["ielts", "spoken", "grammar", "study-abroad", "other"]).default("ielts"),
  level: z.enum(["beginner", "intermediate", "advanced", "all"]).default("all"),
  features: z.array(z.string()).optional().nullable(),
  learningOutcomes: z.array(z.string()).optional().nullable(),
  schedule: z.string().optional().nullable(),
  maxStudents: z.number().optional().nullable(),
  enrolledCount: z.number().optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  curriculum: z.array(z.object({ title: z.string(), content: z.string() })).optional().nullable(),
  targetAudience: z.string().optional().nullable(),
  instructorName: z.string().optional().nullable(),
  instructorBio: z.string().optional().nullable(),
  instructorPhoto: z.string().optional().nullable(),
  courseFaq: z.array(z.object({ question: z.string(), answer: z.string() })).optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  enrollMessage: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

const successStoryInput = z.object({
  studentName: z.string().min(1),
  imageUrl: z.string().min(1),
  thumbnailUrl: z.string().optional().nullable(),
  bandScore: z.string().optional().nullable(),
  courseName: z.string().optional().nullable(),
  testimonial: z.string().optional().nullable(),
  category: z.enum(["ielts-score", "visa-success", "university-admission", "spoken-english", "other"]).default("ielts-score"),
  achievementDate: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

const batchInput = z.object({
  name: z.string().min(1),
  courseId: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  maxCapacity: z.number().default(30),
  currentCount: z.number().default(0),
  isOpen: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

const paymentSettingInput = z.object({
  methodName: z.string().min(1),
  accountType: z.string().optional().nullable(),
  accountNumber: z.string().min(1),
  accountHolder: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  qrCodeUrl: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const enrollmentInput = z.object({
  studentName: z.string().min(1, "আপনার নাম লিখুন"),
  studentMobile: z.string().min(11, "সঠিক মোবাইল নম্বর দিন"),
  studentEmail: z.string().optional().nullable(),
  courseId: z.number(),
  batchId: z.number().optional().nullable(),
  paymentMethod: z.string().min(1, "পেমেন্ট পদ্ধতি নির্বাচন করুন"),
  paymentAccountNumber: z.string().min(1, "প্রেরকের নম্বর দিন"),
  transactionId: z.string().min(1, "ট্রানজেকশন আইডি দিন"),
  paymentAmount: z.string().min(1, "পেমেন্টের পরিমাণ দিন"),
  paymentScreenshotUrl: z.string().optional().nullable(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const invalidCredentials = new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });

        const appUser = await getAppUserByEmail(input.email);
        if (!appUser || !appUser.isActive) {
          throw invalidCredentials;
        }

        const passwordMatches = await verifyPassword(input.password, appUser.passwordHash);
        if (!passwordMatches) {
          throw invalidCredentials;
        }

        const signedInAt = new Date();
        await updateAppUserLastSignedIn(appUser.id, signedInAt);

        const sessionToken = await sdk.createAppSessionToken(appUser.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 365 });

        return appUserToAuthUser({ ...appUser, lastSignedIn: signedInAt });
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================
  // COURSES — Public + Admin
  // ============================================
  courses: router({
    list: publicProcedure.query(async () => getActiveCourses()),
    featured: publicProcedure.query(async () => getFeaturedCourses()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getCourseById(input.id)),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => getCourseBySlug(input.slug)),
    adminList: adminProcedure.query(async () => getAllCourses()),
    create: adminProcedure
      .input(courseInput)
      .mutation(async ({ input }) => createCourse(input)),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: courseInput.partial() }))
      .mutation(async ({ input }) => {
        await updateCourse(input.id, input.data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCourse(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // SUCCESS STORIES — Public + Admin
  // ============================================
  successStories: router({
    list: publicProcedure.query(async () => getActiveSuccessStories()),
    featured: publicProcedure.query(async () => getFeaturedSuccessStories()),
    count: publicProcedure.query(async () => getSuccessStoriesCount()),
    adminList: adminProcedure.query(async () => getAllSuccessStories()),
    create: adminProcedure
      .input(successStoryInput)
      .mutation(async ({ input }) => createSuccessStory(input)),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: successStoryInput.partial() }))
      .mutation(async ({ input }) => {
        await updateSuccessStory(input.id, input.data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSuccessStory(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // BATCHES — Public + Admin
  // ============================================
  batches: router({
    /** Public: get active open batches */
    active: publicProcedure.query(async () => getActiveBatches()),
    /** Admin: get all batches */
    adminList: adminProcedure.query(async () => getAllBatches()),
    /** Admin: get single batch */
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getBatchById(input.id)),
    /** Admin: create batch */
    create: adminProcedure
      .input(batchInput)
      .mutation(async ({ input }) => createBatch(input)),
    /** Admin: update batch */
    update: adminProcedure
      .input(z.object({ id: z.number(), data: batchInput.partial() }))
      .mutation(async ({ input }) => {
        await updateBatch(input.id, input.data);
        return { success: true };
      }),
    /** Admin: delete batch */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBatch(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // PAYMENT SETTINGS — Public (read) + Admin (CRUD)
  // ============================================
  paymentSettings: router({
    /** Public: get active payment methods for enrollment form */
    active: publicProcedure.query(async () => getActivePaymentSettings()),
    /** Admin: get all payment settings */
    adminList: adminProcedure.query(async () => getAllPaymentSettings()),
    /** Admin: create payment method */
    create: adminProcedure
      .input(paymentSettingInput)
      .mutation(async ({ input }) => createPaymentSetting(input)),
    /** Admin: update payment method */
    update: adminProcedure
      .input(z.object({ id: z.number(), data: paymentSettingInput.partial() }))
      .mutation(async ({ input }) => {
        await updatePaymentSetting(input.id, input.data);
        return { success: true };
      }),
    /** Admin: delete payment method */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePaymentSetting(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // ENROLLMENTS — Public (submit) + Admin (manage)
  // ============================================
  enrollments: router({
    /** Public: submit a new enrollment */
    submit: publicProcedure
      .input(enrollmentInput)
      .mutation(async ({ input }) => {
        // Check for duplicate transaction ID
        const exists = await checkTransactionIdExists(input.transactionId);
        if (exists) {
          throw new Error("এই ট্রানজেকশন আইডি আগেই ব্যবহৃত হয়েছে। অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি দিন।");
        }
        const result = await createEnrollment(input);
        // Notify admin about new enrollment
        try {
          await notifyOwner({
            title: `🎓 নতুন ভর্তি আবেদন — ${input.studentName}`,
            content: `নাম: ${input.studentName}\nমোবাইল: ${input.studentMobile}\nপেমেন্ট: ${input.paymentMethod} — ${input.paymentAmount}\nTrxID: ${input.transactionId}\n\nAdmin panel-এ গিয়ে verify করুন।`,
          });
        } catch (e) {
          console.warn("[Enrollment] Failed to notify owner:", e);
        }
        return { id: result.id, success: true };
      }),

    /** Admin: get all enrollments */
    adminList: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        if (input?.status) {
          return getEnrollmentsByStatus(input.status);
        }
        return getAllEnrollments();
      }),

    /** Admin: get enrollment stats */
    stats: adminProcedure.query(async () => getEnrollmentStats()),

    /** Admin: get single enrollment */
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getEnrollmentById(input.id)),

    /** Admin: verify an enrollment — assigns student ID */
    verify: adminProcedure
      .input(z.object({
        id: z.number(),
        batchId: z.number().optional().nullable(),
        adminNotes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const enrollment = await getEnrollmentById(input.id);
        if (!enrollment) throw new Error("Enrollment not found");
        if (enrollment.status !== "pending") throw new Error("Only pending enrollments can be verified");
        
        const studentId = await generateStudentId(enrollment.courseId);
        await updateEnrollment(input.id, {
          status: "verified",
          studentId,
          batchId: input.batchId ?? undefined,
          adminNotes: input.adminNotes ?? undefined,
          verifiedAt: new Date(),
        });
        return { success: true, studentId };
      }),

    /** Admin: reject an enrollment */
    reject: adminProcedure
      .input(z.object({
        id: z.number(),
        rejectionReason: z.string().min(1, "প্রত্যাখ্যানের কারণ লিখুন"),
      }))
      .mutation(async ({ input }) => {
        const enrollment = await getEnrollmentById(input.id);
        if (!enrollment) throw new Error("Enrollment not found");
        
        await updateEnrollment(input.id, {
          status: "rejected",
          rejectionReason: input.rejectionReason,
        });
        return { success: true };
      }),

    /** Admin: update enrollment details */
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          studentName: z.string().optional(),
          studentMobile: z.string().optional(),
          studentEmail: z.string().optional().nullable(),
          batchId: z.number().optional().nullable(),
          studentId: z.string().optional().nullable(),
          adminNotes: z.string().optional().nullable(),
          status: z.enum(["pending", "verified", "rejected", "refunded"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await updateEnrollment(input.id, input.data);
        return { success: true };
      }),
  }),

  // ============================================
  // FILE UPLOAD — Admin + Public (for payment screenshots)
  // ============================================
  upload: router({
    /** Admin: upload an image file to S3 */
    image: adminProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "jpg";
        const key = `uploads/images/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),

    /** Public: upload payment screenshot (limited to 2MB) */
    paymentScreenshot: publicProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        // Limit to 2MB
        if (buffer.length > 2 * 1024 * 1024) {
          throw new Error("ফাইল সাইজ ২MB-এর বেশি হতে পারবে না");
        }
        const ext = input.filename.split(".").pop() || "jpg";
        const key = `uploads/payment-screenshots/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  // ============================================
  // SITE SETTINGS — Admin-editable website content
  // ============================================
  siteSettings: router({
    /** Public: get all site settings (for frontend rendering) */
    getAll: publicProcedure.query(async () => {
      const settings = await getAllSiteSettings();
      // Convert array to key-value map for easy frontend consumption
      const map: Record<string, string | null> = {};
      for (const s of settings) {
        map[s.settingKey] = s.settingValue;
      }
      return map;
    }),

    /** Public: get all site settings with metadata (for admin UI) */
    getAllWithMeta: adminProcedure.query(async () => {
      return getAllSiteSettings();
    }),

    /** Admin: bulk update site settings */
    update: adminProcedure
      .input(z.array(z.object({
        key: z.string().min(1),
        value: z.string().nullable(),
        type: z.string().optional(),
        group: z.string().optional(),
        label: z.string().optional(),
      })))
      .mutation(async ({ input }) => {
        await bulkUpsertSiteSettings(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
