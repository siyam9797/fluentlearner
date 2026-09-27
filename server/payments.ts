/**
 * Online course payments (bKash). An enrollment row is created as "pending" when checkout starts,
 * becomes "verified" with the real bKash transaction once paid, and is removed if the payment is cancelled or fails.
 *
 * While a payment is in progress, transactionId holds `bkash:<paymentID>`; adminNotes always records the paymentID.
 *
 * Every paid enrollment gets a student account (the dashboard finds enrollments by email):
 * - no account for the email → one is created inactive at checkout and activated once paid ("new");
 * - an inactive account nobody has signed in to (e.g. an abandoned checkout) → reused ("reused");
 * For "new"/"reused" a password is generated when the payment is confirmed and shown once on the confirmation screen;
 * the student can change it in Dashboard → Settings.
 * - an account that is active or has been used → linked as-is, password untouched ("existing").
 * Only "new"/"reused" accounts are signed in automatically — otherwise paying with someone else's email would log you in as them.
 * adminNotes carries `[account:<kind>:<userId>]` so the callback knows which case applies.
 */
import { and, eq, like } from "drizzle-orm";
import { getDb } from "./db";
import { appUsers, enrollments, courses } from "./database/schema";
import { notifyOwner } from "./_core/notification";
import { randomBytes, randomInt } from "node:crypto";
import { hashPassword } from "./_core/password";
import {
  createBkashPayment,
  executeBkashPayment,
  queryBkashPayment,
  BkashError,
  type BkashPayment,
} from "./bkash";

const pendingTxn = (paymentID: string) => `bkash:${paymentID}`;

/** bKash payment IDs are plain tokens; anything else is rejected before it reaches a query. */
export const isValidPaymentId = (
  value: string | null | undefined
): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{6,100}$/.test(value);

/** Public site origin for bKash callbacks and redirects (PUBLIC_SITE_URL wins, e.g. behind a proxy). */
export function requestOrigin(req: Request) {
  const configured = process.env.PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const url = new URL(req.url);
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const proto =
    req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
const paymentNote = (paymentID: string) => `bKash payment ${paymentID}`;

/** Cookie that carries the generated password from the bKash callback to the confirmation screen. */
export const NEW_PASSWORD_COOKIE = "fl_enroll_pw";

/** Easy-to-read password like "k7qm-9xpt" (no 0/o/1/l/i look-alikes). */
function generatePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const pick = () => alphabet[randomInt(alphabet.length)];
  return `${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}

type AccountKind = "new" | "reused" | "existing";
const accountTag = (kind: AccountKind, userId: number) =>
  `[account:${kind}:${userId}]`;
function readAccountTag(notes: string | null) {
  const match = /\[account:(new|reused|existing):(\d+)\]/.exec(notes ?? "");
  return match
    ? { kind: match[1] as AccountKind, userId: Number(match[2]) }
    : null;
}

/** "৳8,500" → "8500". Returns null when the course has no usable price. */
function coursePriceAmount(price: string | null | undefined): string | null {
  const digits = (price ?? "").replace(/,/g, "").match(/\d+(\.\d{1,2})?/);
  if (!digits) return null;
  const amount = Number(digits[0]);
  return amount > 0 ? String(amount) : null;
}

async function db() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database;
}

export async function startBkashEnrollment(input: {
  courseId: number;
  studentName: string;
  studentMobile: string;
  studentEmail: string;
  callbackURL: string;
}) {
  const database = await db();
  const [course] = await database
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .limit(1);
  if (!course || !course.isActive)
    throw new Error("This course is not open for enrollment.");
  const amount = coursePriceAmount(course.price);
  if (!amount)
    throw new Error(
      "This course has no online price yet. Please contact us to enroll."
    );

  const email = input.studentEmail.trim().toLowerCase();
  const [existing] = await database
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);
  let account: string;
  if (existing && (existing.isActive || existing.lastSignedIn)) {
    account = accountTag("existing", existing.id);
  } else if (existing) {
    await database
      .update(appUsers)
      .set({ name: input.studentName })
      .where(eq(appUsers.id, existing.id));
    account = accountTag("reused", existing.id);
  } else {
    const created = await database.insert(appUsers).values({
      name: input.studentName,
      email,
      // Placeholder nobody knows; the real password is generated once the payment is confirmed.
      passwordHash: await hashPassword(randomBytes(24).toString("hex")),
      role: "student",
      isActive: false,
    });
    account = accountTag("new", created[0].insertId);
  }

  const inserted = await database.insert(enrollments).values({
    studentName: input.studentName,
    studentMobile: input.studentMobile,
    studentEmail: email,
    courseId: course.id,
    paymentMethod: "bKash (online)",
    paymentAccountNumber: input.studentMobile,
    transactionId: `bkash:starting:${Date.now()}`,
    paymentAmount: amount,
    status: "pending",
    adminNotes: `Online bKash payment started but not completed. ${account}`,
  });
  const enrollmentId = inserted[0].insertId;

  try {
    const payment = await createBkashPayment({
      amount,
      invoice: `FL-${enrollmentId}`,
      payerReference: input.studentMobile,
      callbackURL: input.callbackURL,
    });
    await database
      .update(enrollments)
      .set({
        transactionId: pendingTxn(payment.paymentID),
        adminNotes: `Online payment started but not completed (${paymentNote(payment.paymentID)}). ${account}`,
      })
      .where(eq(enrollments.id, enrollmentId));
    return { bkashURL: payment.bkashURL };
  } catch (error) {
    await database.delete(enrollments).where(eq(enrollments.id, enrollmentId));
    await removeUnusedAccount(account);
    throw error instanceof BkashError
      ? new Error(`bKash: ${error.message}`)
      : error;
  }
}

/** Deletes an account this checkout created, if it was never activated. */
async function removeUnusedAccount(notes: string | null) {
  const tag = readAccountTag(notes);
  if (tag?.kind !== "new") return;
  const database = await db();
  await database
    .delete(appUsers)
    .where(and(eq(appUsers.id, tag.userId), eq(appUsers.isActive, false)));
}

/** Handles the customer's return from bKash. Safe to call twice for the same payment. */
export async function completeBkashPayment(paymentID: string, status: string) {
  const database = await db();
  const [row] = await database
    .select()
    .from(enrollments)
    .where(like(enrollments.adminNotes, `%${paymentNote(paymentID)}%`))
    .limit(1);
  if (!row) return { ok: false as const, reason: "not-found", courseId: null };
  if (row.status === "verified")
    return {
      ok: true as const,
      enrollmentId: row.id,
      loginUserId: null,
      password: null,
    };

  if (status !== "success") {
    await database
      .delete(enrollments)
      .where(
        and(eq(enrollments.id, row.id), eq(enrollments.status, "pending"))
      );
    await removeUnusedAccount(row.adminNotes);
    return {
      ok: false as const,
      reason: status === "cancel" ? "cancel" : "failure",
      courseId: row.courseId,
    };
  }

  let payment: BkashPayment | null = null;
  try {
    payment = await executeBkashPayment(paymentID);
  } catch {
    payment = null;
  }
  // Execute can fail even though money moved (e.g. a timeout); ask bKash for the final state.
  if (payment?.transactionStatus !== "Completed") {
    try {
      payment = await queryBkashPayment(paymentID);
    } catch {
      payment = null;
    }
  }
  if (payment?.transactionStatus !== "Completed" || !payment.trxID) {
    await database
      .delete(enrollments)
      .where(
        and(eq(enrollments.id, row.id), eq(enrollments.status, "pending"))
      );
    await removeUnusedAccount(row.adminNotes);
    return { ok: false as const, reason: "failure", courseId: row.courseId };
  }

  const tag = readAccountTag(row.adminNotes);
  await database
    .update(enrollments)
    .set({
      status: "verified",
      verifiedAt: new Date(),
      transactionId: payment.trxID,
      paymentAccountNumber: payment.customerMsisdn || row.paymentAccountNumber,
      paymentAmount: payment.amount || row.paymentAmount,
      adminNotes:
        `Paid online with bKash — confirmed automatically (${paymentNote(paymentID)}).${
          tag?.kind === "existing"
            ? " Linked to the student's existing account."
            : tag
              ? " Student account created."
              : ""
        } ${tag ? accountTag(tag.kind, tag.userId) : ""}`.trim(),
    })
    .where(eq(enrollments.id, row.id));

  // Paid: switch on the account this checkout created and give it a password the student will see once.
  const loginUserId = tag && tag.kind !== "existing" ? tag.userId : null;
  const password = loginUserId ? generatePassword() : null;
  if (loginUserId && password)
    await database
      .update(appUsers)
      .set({ isActive: true, passwordHash: await hashPassword(password) })
      .where(eq(appUsers.id, loginUserId));

  try {
    await notifyOwner({
      title: `✅ Paid enrollment — ${row.studentName}`,
      content: `Name: ${row.studentName}\nMobile: ${row.studentMobile}\nPaid ৳${payment.amount ?? row.paymentAmount} with bKash\nTrxID: ${payment.trxID}\n\nConfirmed automatically.`,
    });
  } catch (error) {
    console.warn("[Payments] Failed to notify owner:", error);
  }
  return { ok: true as const, enrollmentId: row.id, loginUserId, password };
}

/** What the confirmation screen shows; only for completed payments. */
export async function bkashPaymentSummary(paymentID: string) {
  const database = await db();
  const [row] = await database
    .select({
      status: enrollments.status,
      studentName: enrollments.studentName,
      studentEmail: enrollments.studentEmail,
      adminNotes: enrollments.adminNotes,
      transactionId: enrollments.transactionId,
      paymentAmount: enrollments.paymentAmount,
      courseName: courses.name,
      courseNameEn: courses.nameEn,
    })
    .from(enrollments)
    .leftJoin(courses, eq(courses.id, enrollments.courseId))
    .where(like(enrollments.adminNotes, `%${paymentNote(paymentID)}%`))
    .limit(1);
  if (!row || row.status !== "verified") return null;
  return {
    studentName: row.studentName,
    course: row.courseNameEn || row.courseName || "",
    amount: row.paymentAmount,
    trxID: row.transactionId,
    email: row.studentEmail ?? "",
    /** "created" when this payment made the account, "existing" when it was added to one the student already had. */
    account:
      readAccountTag(row.adminNotes)?.kind === "existing"
        ? ("existing" as const)
        : ("created" as const),
  };
}
