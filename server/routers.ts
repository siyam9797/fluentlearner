import {
  BKASH_BASE_URLS,
  BKASH_SETTINGS,
  BkashError,
  bkashSource,
  checkBkashCredentials,
  isBkashConfigured,
  isBkashEnabled,
  savedBkashSettings,
} from "./bkash";
import { canManageUsers } from "@shared/roles";
import {
  SSLCOMMERZ_BASE_URLS,
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
import { hashPassword, verifyPassword } from "./_core/password";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  contentManagerProcedure,
  enrollmentManagerProcedure,
  marketingProcedure,
  superAdminProcedure,
  router,
} from "./_core/trpc";
import Anthropic from "@anthropic-ai/sdk";
import { AI_API_KEY_SETTING, checkAiApiKey, savedAiApiKey } from "./aiGrading";
import {
  getPublicSiteSettings,
  SECRET_SETTING_KEYS,
} from "./publicSiteSettings";
import { getMetaSettings, META_SETTING_KEYS } from "./metaSettings";
import { TRPCError } from "@trpc/server";
import {
  assertWithinLimit,
  clientIp,
  consume,
  recordHit,
  resetLimit,
} from "./_core/rateLimit";
import { z } from "zod";
import {
  appUserToAuthUser,
  getActiveCourses,
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
  getActiveBatches,
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getAllEnrollments,
  getEnrollmentsByStatus,
  getEnrollmentById,
  updateEnrollment,
  getEnrollmentStats,
  generateStudentId,
  getAllSiteSettings,
  bulkUpsertSiteSettings,
  upsertSiteSetting,
  getAppUserByEmail,
  getAppUserById,
  updateAppUserLastSignedIn,
  updateAppUserPassword,
  updateAppUserAvatar,
} from "./db";
import { storagePut, storagePutNamed } from "./storage";
import { sessionService } from "./_core/session";
import { nanoid } from "nanoid";
import {
  learningResourcesRouter,
  mockTestsRouter,
  mockTestSetsRouter,
  studentRouter,
  studentsRouter,
  usersRouter,
} from "./mockRouters";
import * as mock from "./mockDb";
import { deleteMediaFile, listMediaFiles } from "./media";

/** Window for counting failed sign-ins and password checks. */
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

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
  isOpen: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

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

        // Slow down password guessing: 10 failures per email, 30 per address, per 15 minutes.
        const tooMany = "Too many sign-in attempts.";
        const emailKey = `login:email:${input.email.toLowerCase()}`;
        // Without a known address (no proxy header) everyone would share one bucket, so only the email limit applies.
        const ip = clientIp(ctx.req);
        const ipKey = ip === "unknown" ? null : `login:ip:${ip}`;
        assertWithinLimit(emailKey, 10, tooMany);
        if (ipKey) assertWithinLimit(ipKey, 30, tooMany);
        const failed = () => {
          recordHit(emailKey, LOGIN_WINDOW_MS);
          if (ipKey) recordHit(ipKey, LOGIN_WINDOW_MS);
          return invalidCredentials;
        };

        const found = await getAppUserByEmail(input.email);
        const appUser = found;
        if (!appUser || !appUser.isActive) {
          throw failed();
        }

        const passwordMatches = await verifyPassword(
          input.password,
          appUser.passwordHash
        );
        if (!passwordMatches) {
          throw failed();
        }
        resetLimit(emailKey);

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
    /**
     * The signed-in account's own name, email and photo, read from the account so the
     * Profile page and the Users page always agree. The dev login has no account row.
     */
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.openId.startsWith("app:"))
        return {
          name: ctx.user.name,
          email: ctx.user.email ?? "",
          avatarUrl: null,
          canEditEmail: false,
        };
      const account = await getAppUserById(ctx.user.id);
      if (!account)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      return {
        name: account.name,
        email: account.email,
        avatarUrl: account.avatarUrl ?? null,
        canEditEmail: account.role === "super_admin",
      };
    }),

    /** Change one's own name (any role) or email (the Super Admin only). */
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1, "Enter your name").max(255).optional(),
          email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Enter a valid email address")
            .max(320)
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.openId.startsWith("app:"))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "The development login is set in .env and has no account to update",
          });
        const account = await getAppUserById(ctx.user.id);
        if (!account)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found",
          });
        if (input.email !== undefined && input.email !== account.email) {
          if (account.role !== "super_admin")
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Only the Super Admin can change their own email. Ask the Super Admin to change it for you.",
            });
          await mock.changeUserEmail(account.id, input.email);
        }
        if (input.name !== undefined && input.name !== account.name)
          await mock.updateUser(account.id, { name: input.name });
        return { success: true } as const;
      }),

    /** Upload (or, with remove: true, clear) the signed-in account's profile photo. */
    updateAvatar: protectedProcedure
      .input(
        z.union([
          z.object({ remove: z.literal(true) }),
          z.object({
            base64: z.string().min(1),
            filename: z.string().min(1).max(255),
            contentType: z.string(),
          }),
        ])
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.openId.startsWith("app:"))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "The development login has no account to save a photo to. Sign in with a real account.",
          });
        if ("remove" in input) {
          await updateAppUserAvatar(ctx.user.id, null);
          return { avatarUrl: null };
        }
        if (!input.contentType.startsWith("image/"))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose an image file",
          });
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.length > 5 * 1024 * 1024)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Profile photos must be under 5MB",
          });
        const ext =
          input.filename
            .split(".")
            .pop()
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 5) || "jpg";
        const { url } = await storagePut(
          `uploads/avatars/${ctx.user.id}-${nanoid(8)}.${ext}`,
          buffer,
          input.contentType
        );
        await updateAppUserAvatar(ctx.user.id, url);
        return { avatarUrl: url };
      }),

    /** Any signed-in account changes its own password, after confirming the current one. */
    changePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string().min(1, "Enter your current password"),
          newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(200, "Password is too long"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // The development login lives in .env, not in app_users.
        if (!ctx.user.openId.startsWith("app:"))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "This development login is set in .env (LOCAL_ADMIN_PASSWORD) and can't be changed here",
          });
        const passwordKey = `password:${ctx.user.id}`;
        assertWithinLimit(passwordKey, 10, "Too many attempts.");
        const account = await getAppUserById(ctx.user.id);
        if (
          !account ||
          !(await verifyPassword(input.currentPassword, account.passwordHash))
        ) {
          recordHit(passwordKey, LOGIN_WINDOW_MS);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Current password is incorrect",
          });
        }
        if (input.currentPassword === input.newPassword)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose a password different from your current one",
          });
        await updateAppUserPassword(
          account.id,
          await hashPassword(input.newPassword)
        );
        // The new password ends other sessions; keep this one signed in.
        const keepSignedIn = 1000 * 60 * 60 * 24 * 365;
        ctx.setCookie(
          COOKIE_NAME,
          await sessionService.createAppSessionToken(ctx.user.id, keepSignedIn),
          keepSignedIn
        );
        return { success: true } as const;
      }),
  }),

  // ============================================
  // COURSES — Public + Admin
  // ============================================
  courses: router({
    list: publicProcedure.query(async () => getActiveCourses()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getCourseById(input.id)),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => getCourseBySlug(input.slug)),
    adminList: adminProcedure.query(async () => getAllCourses()),
    create: contentManagerProcedure
      .input(courseInput)
      .mutation(async ({ input }) => createCourse(input)),
    update: contentManagerProcedure
      .input(z.object({ id: z.number(), data: courseInput.partial() }))
      .mutation(async ({ input }) => {
        await updateCourse(input.id, input.data);
        return { success: true };
      }),
    delete: contentManagerProcedure
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
    adminList: adminProcedure.query(async () => getAllSuccessStories()),
    create: contentManagerProcedure
      .input(successStoryInput)
      .mutation(async ({ input }) => createSuccessStory(input)),
    update: contentManagerProcedure
      .input(z.object({ id: z.number(), data: successStoryInput.partial() }))
      .mutation(async ({ input }) => {
        await updateSuccessStory(input.id, input.data);
        return { success: true };
      }),
    delete: contentManagerProcedure
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
    create: contentManagerProcedure
      .input(batchInput)
      .mutation(async ({ input }) => createBatch(input)),
    /** Admin: update batch */
    update: contentManagerProcedure
      .input(z.object({ id: z.number(), data: batchInput.partial() }))
      .mutation(async ({ input }) => {
        await updateBatch(input.id, input.data);
        return { success: true };
      }),
    /** Admin: delete batch */
    delete: contentManagerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBatch(input.id);
        return { success: true };
      }),
  }),
  // ============================================
  // ENROLLMENTS — Admin (manage)
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
        // Each checkout creates an account and a pending payment: 20 per address per hour.
        const checkoutIp = clientIp(ctx.req);
        if (checkoutIp !== "unknown")
          consume(
            `checkout:${checkoutIp}`,
            20,
            60 * 60 * 1000,
            "Too many payment attempts."
          );
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
        // Each checkout creates an account and a pending payment: 20 per address per hour.
        const checkoutIp = clientIp(ctx.req);
        if (checkoutIp !== "unknown")
          consume(
            `checkout:${checkoutIp}`,
            20,
            60 * 60 * 1000,
            "Too many payment attempts."
          );
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
    /** Admin: get all enrollments */
    adminList: enrollmentManagerProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        if (input?.status) {
          return getEnrollmentsByStatus(input.status);
        }
        return getAllEnrollments();
      }),

    /** Admin: get enrollment stats */
    stats: enrollmentManagerProcedure.query(async () => getEnrollmentStats()),

    /** Admin: get single enrollment */
    getById: enrollmentManagerProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getEnrollmentById(input.id)),

    /** Admin: verify an enrollment — assigns student ID */
    verify: enrollmentManagerProcedure
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
    reject: enrollmentManagerProcedure
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
    update: enrollmentManagerProcedure
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
  // FILE UPLOAD — Admin
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
    delete: contentManagerProcedure
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
    getAll: publicProcedure.query(() => getPublicSiteSettings()),

    /** Public: get all site settings with metadata (for admin UI) */
    getAllWithMeta: adminProcedure.query(async () => {
      return (await getAllSiteSettings()).filter(
        s => !SECRET_SETTING_KEYS.has(s.settingKey)
      );
    }),

    /** Admin: bulk update site settings */
    update: contentManagerProcedure
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

  // Meta Pixel and Conversions API. The access token is never returned to the browser.
  metaSettings: router({
    status: marketingProcedure.query(async () => {
      const settings = await getMetaSettings();
      return {
        enabled: settings.enabled,
        datasetId: settings.datasetId,
        capiEnabled: settings.capiEnabled,
        hasAccessToken: !!settings.accessToken,
        tokenSource: settings.tokenSource,
        tokenHint: settings.accessToken
          ? `…${settings.accessToken.slice(-4)}`
          : null,
        testEventCode: settings.testEventCode,
      };
    }),
    save: marketingProcedure
      .input(
        z.object({
          enabled: z.boolean(),
          datasetId: z
            .string()
            .trim()
            .regex(/^\d{5,30}$/, "Enter a valid Dataset ID"),
          capiEnabled: z.boolean(),
          accessToken: z.string().trim().max(1000),
          clearAccessToken: z.boolean(),
          testEventCode: z.string().trim().max(100),
        })
      )
      .mutation(async ({ input }) => {
        const save = (key: string, value: string, label: string) =>
          upsertSiteSetting(key, value, "secret", "marketing", label);
        await save(
          META_SETTING_KEYS.enabled,
          String(input.enabled),
          "Meta Pixel enabled"
        );
        await save(
          META_SETTING_KEYS.datasetId,
          input.datasetId,
          "Meta Dataset ID"
        );
        await save(
          META_SETTING_KEYS.capiEnabled,
          String(input.capiEnabled),
          "Meta Conversions API enabled"
        );
        await save(
          META_SETTING_KEYS.testEventCode,
          input.testEventCode,
          "Meta test event code"
        );
        if (input.clearAccessToken)
          await save(
            META_SETTING_KEYS.accessToken,
            "",
            "Meta Conversions API access token"
          );
        else if (input.accessToken)
          await save(
            META_SETTING_KEYS.accessToken,
            input.accessToken,
            "Meta Conversions API access token"
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
        enabled: await isBkashEnabled(),
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

    /** The "Accept bKash payments" switch; saved on its own so it works without re-entering credentials. */
    setEnabled: adminProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        requirePaymentManager(ctx.user.role);
        await upsertSiteSetting(
          BKASH_SETTINGS.enabled,
          String(input.enabled),
          "secret",
          "payment",
          "bKash enabled"
        );
        return { success: true };
      }),

    /** Checks the credentials with bKash, then saves them. Blank secrets keep the saved ones. */
    save: adminProcedure
      .input(
        z.object({
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
        if (await isBkashEnabled()) {
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
  mockTestSets: mockTestSetsRouter,
  students: studentsRouter,
  users: usersRouter,
  learningResources: learningResourcesRouter,
  student: studentRouter,
});

export type AppRouter = typeof appRouter;
