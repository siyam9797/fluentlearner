import {
  BKASH_BASE_URLS,
  BKASH_SECRET_KEYS,
  BKASH_SETTINGS,
  BkashError,
  bkashSource,
  checkBkashCredentials,
  isBkashConfigured,
  savedBkashSettings,
} from "./bkash";
import { canManageUsers } from "@shared/roles";
import {
  SSLCOMMERZ_BASE_URLS,
  SSLCOMMERZ_SECRET_KEYS,
  SSLCOMMERZ_SETTINGS,
  SslcommerzError,
  checkSslcommerzCredentials,
  isSslcommerzConfigured,
  savedSslcommerzSettings,
  sslcommerzSource,
} from "./sslcommerz";
import {
  NEW_PASSWORD_COOKIE,
  onlinePaymentSummary,
  isValidPaymentId,
  requestOrigin,
  startBkashEnrollment,
  startSslcommerzEnrollment,
} from "./payments";
import { COOKIE_NAME } from "@shared/const";
import { verifyPassword } from "./_core/password";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  adminProcedure,
  superAdminProcedure,
  router,
} from "./_core/trpc";
import Anthropic from "@anthropic-ai/sdk";
import { AI_API_KEY_SETTING, checkAiApiKey, savedAiApiKey } from "./aiGrading";
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
  upsertSiteSetting,
  getAppUserByEmail,
  updateAppUserLastSignedIn,
} from "./db";
import { storagePut, storagePutNamed } from "./storage";
import { sessionService } from "./_core/session";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import {
  learningResourcesRouter,
  mockTestsRouter,
  studentRouter,
  studentsRouter,
  usersRouter,
} from "./mockRouters";
import { deleteMediaFile, listMediaFiles } from "./media";

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
  category: z
    .enum(["ielts", "spoken", "grammar", "study-abroad", "other"])
    .default("ielts"),
  level: z.enum(["beginner", "intermediate", "advanced", "all"]).default("all"),
  features: z.array(z.string()).optional().nullable(),
  learningOutcomes: z.array(z.string()).optional().nullable(),
  schedule: z.string().optional().nullable(),
  maxStudents: z.number().optional().nullable(),
  enrolledCount: z.number().optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  curriculum: z
    .array(z.object({ title: z.string(), content: z.string() }))
    .optional()
    .nullable(),
  targetAudience: z.string().optional().nullable(),
  instructorName: z.string().optional().nullable(),
  instructorBio: z.string().optional().nullable(),
  instructorPhoto: z.string().optional().nullable(),
  courseFaq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional()
    .nullable(),
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
  category: z
    .enum([
      "ielts-score",
      "visa-success",
      "university-admission",
      "spoken-english",
      "other",
    ])
    .default("ielts-score"),
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
  studentName: z.string().min(1, "Enter your name"),
  studentMobile: z.string().min(11, "Enter a valid mobile number"),
  studentEmail: z.string().optional().nullable(),
  courseId: z.number(),
  batchId: z.number().optional().nullable(),
  paymentMethod: z.string().min(1, "Select a payment method"),
  paymentAccountNumber: z.string().min(1, "Enter the sender number"),
  transactionId: z.string().min(1, "Enter the transaction ID"),
  paymentAmount: z.string().min(1, "Enter the payment amount"),
  paymentScreenshotUrl: z.string().optional().nullable(),
});

/** Settings that hold keys or payment credentials: never sent to the browser, never saved by siteSettings.update. */
const SECRET_SETTING_KEYS = new Set([
  AI_API_KEY_SETTING,
  ...BKASH_SECRET_KEYS,
  ...SSLCOMMERZ_SECRET_KEYS,
]);

/** What the v2 enroll page collects before sending the student to a payment gateway. */
const checkoutInput = z.object({
  courseId: z.number(),
  studentName: z.string().trim().min(1, "Enter your name"),
  studentMobile: z
    .string()
    .transform(value => value.replace(/[\s-]/g, ""))
    .pipe(
      z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid 11-digit mobile number")
    ),
  studentEmail: z.string().trim().email("Enter a valid email address"),
});

function requirePaymentManager(role: string) {
  if (!canManageUsers(role))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only an Admin or the Super Admin can change online payment",
    });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const localEmail = (
          process.env.LOCAL_ADMIN_EMAIL || "admin@localhost.test"
        ).toLowerCase();
        const localPassword = process.env.LOCAL_ADMIN_PASSWORD || "admin12345";
        if (
          process.env.NODE_ENV !== "production" &&
          input.email.toLowerCase() === localEmail &&
          input.password === localPassword
        ) {
          const maxAge = 1000 * 60 * 60 * 24;
          const name = process.env.LOCAL_ADMIN_NAME || "Local Administrator";
          const sessionToken =
            await sessionService.createLocalAdminSessionToken(
              localEmail,
              name,
              maxAge
            );
          ctx.setCookie(COOKIE_NAME, sessionToken, maxAge);
          const now = new Date();
          return {
            id: 0,
            openId: "local:admin",
            email: localEmail,
            name,
            loginMethod: "local",
            role: "super_admin" as const,
            createdAt: now,
            updatedAt: now,
            lastSignedIn: now,
          };
        }

        const invalidCredentials = new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });

        const appUser = await getAppUserByEmail(input.email);
        if (!appUser || !appUser.isActive) {
          throw invalidCredentials;
        }

        const passwordMatches = await verifyPassword(
          input.password,
          appUser.passwordHash
        );
        if (!passwordMatches) {
          throw invalidCredentials;
        }

        const signedInAt = new Date();
        await updateAppUserLastSignedIn(appUser.id, signedInAt);

        const maxAge = 1000 * 60 * 60 * 24 * 365;
        const sessionToken = await sessionService.createAppSessionToken(
          appUser.id,
          maxAge
        );
        ctx.setCookie(COOKIE_NAME, sessionToken, maxAge);

        return appUserToAuthUser({ ...appUser, lastSignedIn: signedInAt });
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.clearCookie(COOKIE_NAME);
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
  /** Online payments (bKash Tokenized Checkout) for the v2 enroll page. */
  payments: router({
    available: publicProcedure.query(async () => ({
      bkash: await isBkashConfigured(),
      /** Nagad, Rocket and cards through SSLCommerz. */
      sslcommerz: await isSslcommerzConfigured(),
    })),

    bkashStart: publicProcedure
      .input(checkoutInput)
      .mutation(async ({ input, ctx }) => {
        if (!(await isBkashConfigured()))
          throw new Error(
            "Online payment isn't available right now. Please contact us to enroll."
          );
        return startBkashEnrollment({
          courseId: input.courseId,
          studentName: input.studentName,
          studentMobile: input.studentMobile,
          studentEmail: input.studentEmail,
          callbackURL: `${requestOrigin(ctx.req)}/api/payments/bkash/callback`,
        });
      }),

    /** Nagad, Rocket or card through SSLCommerz's checkout page. */
    sslcommerzStart: publicProcedure
      .input(checkoutInput)
      .mutation(async ({ input, ctx }) => {
        if (!(await isSslcommerzConfigured()))
          throw new Error(
            "Online payment isn't available right now. Please contact us to enroll."
          );
        return startSslcommerzEnrollment({
          ...input,
          callbackBase: `${requestOrigin(ctx.req)}/api/payments/sslcommerz/callback`,
        });
      }),

    bkashResult: publicProcedure
      .input(z.object({ paymentID: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!isValidPaymentId(input.paymentID)) return null;
        const summary = await onlinePaymentSummary(input.paymentID);
        if (!summary) return null;
        // The generated password is only shown to the student who was just signed in to that account.
        const cookie = ctx.req.headers.get("cookie") ?? "";
        const match = new RegExp(
          `(?:^|;\\s*)${NEW_PASSWORD_COOKIE}=([^;]+)`
        ).exec(cookie);
        const signedInAsStudent =
          ctx.user?.email?.toLowerCase() === summary.email.toLowerCase();
        return {
          ...summary,
          password:
            summary.account === "created" && signedInAsStudent && match
              ? decodeURIComponent(match[1])
              : null,
        };
      }),
  }),

  enrollments: router({
    /** Public: submit a new enrollment */
    submit: publicProcedure
      .input(enrollmentInput)
      .mutation(async ({ input }) => {
        // Check for duplicate transaction ID
        const exists = await checkTransactionIdExists(input.transactionId);
        if (exists) {
          throw new Error(
            "This transaction ID has already been used. Please enter a valid transaction ID."
          );
        }
        const result = await createEnrollment(input);
        // Notify admin about new enrollment
        try {
          await notifyOwner({
            title: `🎓 New Enrollment Application — ${input.studentName}`,
            content: `Name: ${input.studentName}\nMobile: ${input.studentMobile}\nPayment: ${input.paymentMethod} — ${input.paymentAmount}\nTrxID: ${input.transactionId}\n\nReview and verify it in the admin panel.`,
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
      .input(
        z.object({
          id: z.number(),
          batchId: z.number().optional().nullable(),
          adminNotes: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const enrollment = await getEnrollmentById(input.id);
        if (!enrollment) throw new Error("Enrollment not found");
        if (enrollment.status !== "pending")
          throw new Error("Only pending enrollments can be verified");

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
      .input(
        z.object({
          id: z.number(),
          rejectionReason: z.string().min(1, "Enter a rejection reason"),
        })
      )
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
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            studentName: z.string().optional(),
            studentMobile: z.string().optional(),
            studentEmail: z.string().optional().nullable(),
            batchId: z.number().optional().nullable(),
            studentId: z.string().optional().nullable(),
            adminNotes: z.string().optional().nullable(),
            status: z
              .enum(["pending", "verified", "rejected", "refunded"])
              .optional(),
          }),
        })
      )
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
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const { url, key } = await storagePutNamed(
          "images",
          input.filename,
          buffer,
          "jpg"
        );
        return { url, key };
      }),

    /** Public: upload payment screenshot (limited to 2MB) */
    paymentScreenshot: publicProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        // Limit to 2MB
        if (buffer.length > 2 * 1024 * 1024) {
          throw new Error("File size cannot exceed 2MB");
        }
        const ext = input.filename.split(".").pop() || "jpg";
        const key = `uploads/payment-screenshots/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  media: router({
    list: adminProcedure.query(() => listMediaFiles()),
    upload: adminProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string().min(1),
          contentType: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const allowedTypes = new Set([
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/avif",
          "video/mp4",
          "video/webm",
          "video/quicktime",
          "audio/mpeg",
          "audio/wav",
          "audio/x-wav",
          "audio/mp4",
          "audio/x-m4a",
          "audio/aac",
          "audio/ogg",
          "audio/webm",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "text/csv",
        ]);
        if (!allowedTypes.has(input.contentType))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This file type is not supported.",
          });
        const categories = input.contentType.startsWith("image/")
          ? { folder: "images", limit: 10 * 1024 * 1024 }
          : input.contentType.startsWith("video/")
            ? { folder: "videos", limit: 64 * 1024 * 1024 }
            : input.contentType.startsWith("audio/")
              ? { folder: "audio", limit: 60 * 1024 * 1024 }
              : { folder: "documents", limit: 25 * 1024 * 1024 };
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.length > categories.limit)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "This file is larger than the allowed limit.",
          });
        return storagePutNamed(categories.folder, input.filename, buffer);
      }),
    delete: adminProcedure
      .input(z.object({ key: z.string().min(1) }))
      .mutation(async ({ input }) => {
        try {
          await deleteMediaFile(input.key);
          return { success: true } as const;
        } catch (error) {
          throw new TRPCError({
            code:
              error instanceof Error && error.message.includes("in use")
                ? "CONFLICT"
                : "BAD_REQUEST",
            message:
              error instanceof Error ? error.message : "Could not delete file",
          });
        }
      }),
  }),

  // ============================================
  // SITE SETTINGS — Admin-editable website content
  // ============================================
  siteSettings: router({
    /** Public: get all site settings (for frontend rendering) */
    getAll: publicProcedure.query(async () => {
      const settings = (await getAllSiteSettings()).filter(
        s => !SECRET_SETTING_KEYS.has(s.settingKey)
      );
      // Convert array to key-value map for easy frontend consumption
      const map: Record<string, string | null> = {};
      for (const s of settings) {
        map[s.settingKey] = s.settingValue;
      }
      return map;
    }),

    /** Public: get all site settings with metadata (for admin UI) */
    getAllWithMeta: adminProcedure.query(async () => {
      return (await getAllSiteSettings()).filter(
        s => !SECRET_SETTING_KEYS.has(s.settingKey)
      );
    }),

    /** Admin: bulk update site settings */
    update: adminProcedure
      .input(
        z.array(
          z.object({
            key: z.string().min(1),
            value: z.string().nullable(),
            type: z.string().optional(),
            group: z.string().optional(),
            label: z.string().optional(),
          })
        )
      )
      .mutation(async ({ input }) => {
        // Keys and payment credentials are saved only through aiSettings / paymentGateway.
        await bulkUpsertSiteSettings(
          input.filter(s => !SECRET_SETTING_KEYS.has(s.key))
        );
        return { success: true };
      }),
  }),

  // ============================================
  // ONLINE PAYMENT — bKash checkout credentials for the v2 enroll page (Admin, Super Admin)
  // ============================================
  paymentGateway: router({
    /** Mode, on/off and where the credentials come from; never the secrets themselves. */
    status: adminProcedure.query(async ({ ctx }) => {
      requirePaymentManager(ctx.user.role);
      const saved = await savedBkashSettings();
      return {
        source: await bkashSource(),
        active: await isBkashConfigured(),
        enabled: saved?.enabled ?? true,
        mode: saved?.mode ?? "sandbox",
        username: saved?.username ?? "",
        appKeyHint: saved?.appKey ? `…${saved.appKey.slice(-4)}` : null,
        hasPassword: !!saved?.password,
        hasAppSecret: !!saved?.appSecret,
      };
    }),

    /** SSLCommerz (Nagad, Rocket, cards): mode, on/off and source; never the store password. */
    sslcommerzStatus: adminProcedure.query(async ({ ctx }) => {
      requirePaymentManager(ctx.user.role);
      const saved = await savedSslcommerzSettings();
      return {
        source: await sslcommerzSource(),
        active: await isSslcommerzConfigured(),
        enabled: saved?.enabled ?? true,
        mode: saved?.mode ?? "sandbox",
        storeId: saved?.storeId ?? "",
        hasStorePassword: !!saved?.storePassword,
      };
    }),

    /** Checks the store with SSLCommerz, then saves it. A blank password keeps the saved one. */
    sslcommerzSave: adminProcedure
      .input(
        z.object({
          enabled: z.boolean(),
          mode: z.enum(["sandbox", "live"]),
          storeId: z.string().trim().min(1, "Enter the SSLCommerz store ID"),
          storePassword: z.string().trim().max(300),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requirePaymentManager(ctx.user.role);
        const saved = await savedSslcommerzSettings();
        const storePassword = input.storePassword || saved?.storePassword || "";
        if (!storePassword)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Enter the store password.",
          });
        if (input.enabled) {
          try {
            await checkSslcommerzCredentials({
              baseUrl: SSLCOMMERZ_BASE_URLS[input.mode],
              storeId: input.storeId,
              storePassword,
            });
          } catch (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                error instanceof SslcommerzError
                  ? `SSLCommerz rejected this store: ${error.message}`
                  : "Could not reach SSLCommerz to check this store. Try again.",
            });
          }
        }
        const save = (key: string, value: string, label: string) =>
          upsertSiteSetting(key, value, "secret", "payment", label);
        await save(
          SSLCOMMERZ_SETTINGS.enabled,
          String(input.enabled),
          "SSLCommerz enabled"
        );
        await save(SSLCOMMERZ_SETTINGS.mode, input.mode, "SSLCommerz mode");
        await save(
          SSLCOMMERZ_SETTINGS.storeId,
          input.storeId,
          "SSLCommerz store ID"
        );
        await save(
          SSLCOMMERZ_SETTINGS.storePassword,
          storePassword,
          "SSLCommerz store password"
        );
        return { success: true };
      }),

    /** Checks the credentials with bKash, then saves them. Blank secrets keep the saved ones. */
    save: adminProcedure
      .input(
        z.object({
          enabled: z.boolean(),
          mode: z.enum(["sandbox", "live"]),
          username: z.string().trim().min(1, "Enter the bKash username"),
          password: z.string().trim().max(300),
          appKey: z.string().trim().max(300),
          appSecret: z.string().trim().max(300),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requirePaymentManager(ctx.user.role);
        const saved = await savedBkashSettings();
        const credentials = {
          baseUrl: BKASH_BASE_URLS[input.mode],
          username: input.username,
          password: input.password || saved?.password || "",
          appKey: input.appKey || saved?.appKey || "",
          appSecret: input.appSecret || saved?.appSecret || "",
        };
        if (
          !credentials.password ||
          !credentials.appKey ||
          !credentials.appSecret
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Enter the password, app key and app secret.",
          });
        if (input.enabled) {
          try {
            await checkBkashCredentials(credentials);
          } catch (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                error instanceof BkashError
                  ? `bKash rejected these credentials: ${error.message}`
                  : "Could not reach bKash to check these credentials. Try again.",
            });
          }
        }
        const save = (key: string, value: string, label: string) =>
          upsertSiteSetting(key, value, "secret", "payment", label);
        await save(
          BKASH_SETTINGS.enabled,
          String(input.enabled),
          "bKash enabled"
        );
        await save(BKASH_SETTINGS.mode, input.mode, "bKash mode");
        await save(
          BKASH_SETTINGS.username,
          credentials.username,
          "bKash username"
        );
        await save(
          BKASH_SETTINGS.password,
          credentials.password,
          "bKash password"
        );
        await save(BKASH_SETTINGS.appKey, credentials.appKey, "bKash app key");
        await save(
          BKASH_SETTINGS.appSecret,
          credentials.appSecret,
          "bKash app secret"
        );
        return { success: true };
      }),
  }),

  // ============================================
  // AI SETTINGS — Anthropic API key for AI marking (Super Admin)
  // ============================================
  aiSettings: router({
    /** Where the key comes from and its last characters; never the key itself. */
    status: superAdminProcedure.query(async () => {
      const saved = await savedAiApiKey();
      const env = process.env.ANTHROPIC_API_KEY?.trim() || null;
      const key = saved ?? env;
      return {
        source: saved
          ? ("settings" as const)
          : env
            ? ("environment" as const)
            : null,
        hint: key ? `…${key.slice(-4)}` : null,
      };
    }),

    /** Checks the key with Anthropic, then saves it. */
    saveKey: superAdminProcedure
      .input(z.object({ apiKey: z.string().trim().min(20).max(300) }))
      .mutation(async ({ input }) => {
        try {
          await checkAiApiKey(input.apiKey);
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Anthropic.AuthenticationError
                ? "Anthropic rejected this API key. Check it and try again."
                : error instanceof Anthropic.APIError
                  ? `Could not check the key with Anthropic (${error.status ?? "network error"}).`
                  : "Could not check the key with Anthropic.",
          });
        }
        await upsertSiteSetting(
          AI_API_KEY_SETTING,
          input.apiKey,
          "secret",
          "ai",
          "Anthropic API key"
        );
        return { success: true };
      }),

    /** Removes the saved key (the environment key, if any, is used again). */
    clearKey: superAdminProcedure.mutation(async () => {
      await upsertSiteSetting(AI_API_KEY_SETTING, null, "secret", "ai");
      return { success: true };
    }),
  }),

  // ============================================
  // IELTS MOCK TESTS — Admin builder + student exam area
  // ============================================
  mockTests: mockTestsRouter,
  students: studentsRouter,
  users: usersRouter,
  learningResources: learningResourcesRouter,
  student: studentRouter,
});

export type AppRouter = typeof appRouter;
