/**
 * v2 Enroll page — /v2/enroll
 * Choose course → your details → pay with bKash (hosted checkout). bKash returns to
 * /api/payments/bkash/callback, which confirms the payment and redirects back here with ?payment=…
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  KeyRound,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { trpc } from "@/lib/trpc";
import { useSearch } from "@/lib/router";
import { cn } from "@/lib/utils";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import { DecorSquare, HvButton, Reveal } from "@/components/home-v2/primitives";
import { CATEGORY_LABELS } from "@/components/home-v2/data";
import { V2 } from "@/components/home-v2/routes";
import { useV2Content } from "@/components/home-v2/useV2Content";

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-ink/20 bg-white/60 px-4 py-3.5 text-base outline-none transition-colors placeholder:text-ink/40 focus:border-ink focus:bg-white";
/** Details typed before leaving for bKash, restored if the payment is cancelled. */
const DRAFT_KEY = "fluentlearner:v2-enroll";

type Step = 1 | 2 | 3;
type Details = {
  studentName: string;
  studentMobile: string;
  studentEmail: string;
};
const EMPTY: Details = { studentName: "", studentMobile: "", studentEmail: "" };

function readDraft(): Details {
  try {
    return {
      ...EMPTY,
      ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}"),
    };
  } catch {
    return EMPTY;
  }
}
function writeDraft(details: Details | null) {
  try {
    if (details) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(details));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage can be unavailable (private mode); the form still works.
  }
}

/** "৳8,500" → 8500, or null when there's no usable price. */
function priceAmount(price: string | null | undefined) {
  const match = (price ?? "").replace(/,/g, "").match(/\d+(\.\d{1,2})?/);
  const amount = match ? Number(match[0]) : 0;
  return amount > 0 ? amount : null;
}
const taka = (amount: number | string) =>
  `৳${Number(amount).toLocaleString("en-US")}`;

/** A v2-styled button for actions (HvButton is for links). */
function ActionButton({
  children,
  onClick,
  variant = "dark",
  disabled,
  className,
  type = "button",
}: {
  children: string;
  onClick?: () => void;
  variant?: "dark" | "outline" | "red";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "hv-btn",
        `hv-btn-${variant}`,
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
    >
      <span className="hv-btn-label">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </button>
  );
}

function FieldRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      {children}
      {error && (
        <span className="text-sm font-normal text-brand-red">{error}</span>
      )}
    </label>
  );
}

export default function V2Enroll() {
  const c = useV2Content();
  const { t } = c;
  const params = new URLSearchParams(useSearch());
  const presetId = Number(params.get("courseId")) || null;
  const paymentResult = params.get("payment"); // success | cancel | failure (set by the bKash callback)
  const paymentID = params.get("paymentID");

  const { data: courses = [], isLoading: coursesLoading } =
    trpc.courses.list.useQuery();
  const { data: available } = trpc.payments.available.useQuery();
  const summary = trpc.payments.bkashResult.useQuery(
    { paymentID: paymentID ?? "" },
    { enabled: paymentResult === "success" && Boolean(paymentID), retry: false }
  );
  const start = trpc.payments.bkashStart.useMutation();

  const returnedFromBkash =
    paymentResult === "cancel" || paymentResult === "failure";
  const [step, setStep] = useState<Step>(
    returnedFromBkash && presetId ? 3 : presetId ? 2 : 1
  );
  const [courseId, setCourseId] = useState<number | null>(presetId);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof Details | "pay", string>>
  >({});
  const [redirecting, setRedirecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const course = useMemo(
    () => courses.find(item => item.id === courseId) ?? null,
    [courses, courseId]
  );
  const courseTitle = course ? course.nameEn || course.name : "";
  const amount = priceAmount(course?.price);
  const bkashReady = available?.bkash ?? false;

  // Coming back from a cancelled/failed payment: restore what the student typed.
  useEffect(() => {
    if (returnedFromBkash) setDetails(readDraft());
  }, [returnedFromBkash]);

  // Paid: the draft is no longer needed.
  useEffect(() => {
    if (summary.data) writeDraft(null);
  }, [summary.data]);

  // A preset course that doesn't exist sends the visitor back to choosing one.
  useEffect(() => {
    if (
      !coursesLoading &&
      presetId &&
      !courses.some(item => item.id === presetId)
    ) {
      setCourseId(null);
      setStep(1);
    }
  }, [coursesLoading, courses, presetId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const update = (key: keyof Details) => (e: { target: { value: string } }) => {
    setDetails(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validateDetails = () => {
    const next: typeof errors = {};
    if (!details.studentName.trim())
      next.studentName = "Please enter your name.";
    const mobile = details.studentMobile.replace(/[\s-]/g, "");
    if (!mobile) next.studentMobile = "Please enter your mobile number.";
    else if (!/^01[3-9]\d{8}$/.test(mobile))
      next.studentMobile = "Enter a valid 11-digit number, e.g. 01712345678.";
    if (!details.studentEmail.trim())
      next.studentEmail = "Please enter your email — it's your login.";
    else if (!/^\S+@\S+\.\S+$/.test(details.studentEmail.trim()))
      next.studentEmail = "Enter a valid email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const pay = async () => {
    if (!course || !validateDetails()) {
      if (course) setStep(2);
      return;
    }
    setErrors({});
    writeDraft(details);
    try {
      const { bkashURL } = await start.mutateAsync({
        courseId: course.id,
        studentName: details.studentName.trim(),
        studentMobile: details.studentMobile,
        studentEmail: details.studentEmail.trim(),
      });
      setRedirecting(true);
      window.location.assign(bkashURL);
    } catch (error) {
      setErrors({
        pay:
          error instanceof Error
            ? error.message
            : "Could not start the payment. Please try again.",
      });
    }
  };

  const steps = [
    t("v2_enroll_step_course"),
    t("v2_enroll_step_details"),
    t("v2_enroll_step_payment"),
  ];
  const header = (
    <HvPageHeader
      crumbs={[{ label: "Enroll" }]}
      title={t("v2_enroll_header_title")}
      description={t("v2_enroll_header_description")}
    />
  );

  // ── Confirmation after a successful bKash payment ──
  if (paymentResult === "success") {
    return (
      <HvLayout>
        <SEOHead
          title={t("v2_enroll_seo_title")}
          description={t("v2_enroll_seo_description")}
          path="/enroll"
        />
        {header}
        <section className="pb-20 pt-12 lg:pb-32 lg:pt-16">
          <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
            {summary.isLoading ? (
              <div className="flex justify-center py-16" role="status">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="sr-only">Confirming your payment</span>
              </div>
            ) : summary.data ? (
              <Reveal className="mx-auto flex max-w-[640px] flex-col items-center text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-red text-white">
                  <Check
                    className="h-10 w-10"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </span>
                <h2 className="mt-8 text-[32px] lg:text-[44px]">
                  {t("v2_enroll_success_title")}
                </h2>
                <p className="mt-4 text-lg text-ink/75">
                  {t("v2_enroll_success_text")}
                </p>
                <p className="mt-6 w-full rounded-[var(--radius-card)] bg-brand-red/10 px-5 py-4 text-left">
                  {summary.data.account === "created" ? (
                    <>
                      <strong className="font-semibold">
                        Your student account is ready and you're logged in.
                      </strong>{" "}
                      Save your login details below — you can change the
                      password anytime in{" "}
                      <strong className="font-semibold">
                        Dashboard → Settings
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold">
                        This course has been added to your existing account
                      </strong>{" "}
                      ({summary.data.email}). Log in with your usual password to
                      see it.
                    </>
                  )}
                </p>
                {summary.data.account === "created" && (
                  <div className="mt-6 w-full rounded-[var(--radius-card)] border-2 border-ink p-5 text-left">
                    <p className="flex items-center gap-2 font-medium">
                      <KeyRound className="h-4 w-4" aria-hidden="true" /> Your
                      login details
                    </p>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm text-ink/60">Email</dt>
                        <dd className="mt-1 font-medium [overflow-wrap:anywhere]">
                          {summary.data.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-ink/60">Password</dt>
                        {summary.data.password ? (
                          <dd className="mt-1 flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xl font-semibold tracking-wide">
                              {summary.data.password}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(
                                  `Email: ${summary.data!.email}\nPassword: ${summary.data!.password}`
                                );
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-sm transition-colors hover:border-ink"
                            >
                              {copied ? (
                                <Check
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Copy
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              {copied ? "Copied" : "Copy"}
                            </button>
                          </dd>
                        ) : (
                          <dd className="mt-1 text-sm text-ink/70">
                            Hidden for your security. You're logged in on this
                            device — set a new password in Dashboard → Settings.
                          </dd>
                        )}
                      </div>
                    </dl>
                  </div>
                )}
                <dl className="mt-6 grid w-full gap-px overflow-hidden rounded-[var(--radius-card)] bg-ink/15 text-left sm:grid-cols-2">
                  {[
                    ["Course", summary.data.course],
                    ["Paid", `${taka(summary.data.amount)} with bKash`],
                    ["bKash transaction ID", summary.data.trxID],
                    ["Login email", summary.data.email],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-sand p-5">
                      <dt className="text-sm text-ink/60">{label}</dt>
                      <dd className="mt-1 font-medium [overflow-wrap:anywhere]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  <HvButton href="/student" variant="dark">
                    {summary.data.account === "created"
                      ? "Go to my dashboard"
                      : "Log in to my dashboard"}
                  </HvButton>
                  <HvButton
                    href={c.whatsapp("v2_enroll_success_message")}
                    variant="outline"
                    external
                  >
                    {t("v2_enroll_success_button")}
                  </HvButton>
                </div>
              </Reveal>
            ) : (
              <div className="mx-auto max-w-[640px] text-center">
                <h2 className="text-[28px] lg:text-[32px]">
                  We couldn't confirm this payment
                </h2>
                <p className="mt-4 text-lg text-ink/75">
                  If money left your bKash account, message us with your bKash
                  transaction ID and we'll sort it out right away.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <HvButton
                    href={c.whatsapp("v2_enroll_help_message")}
                    variant="dark"
                    external
                  >
                    Message us on WhatsApp
                  </HvButton>
                  <HvButton href={V2.enroll()} variant="outline">
                    Start again
                  </HvButton>
                </div>
              </div>
            )}
          </div>
        </section>
      </HvLayout>
    );
  }

  return (
    <HvLayout>
      <SEOHead
        title={t("v2_enroll_seo_title")}
        description={t("v2_enroll_seo_description")}
        path="/enroll"
      />
      {header}

      <section className="pb-20 pt-12 lg:pb-32 lg:pt-16">
        <div className="mx-auto grid max-w-[1262px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="min-w-0">
            {/* Stepper */}
            <ol
              className="mb-10 grid grid-cols-3 gap-3 border-b border-ink/15 pb-6"
              aria-label="Enrollment steps"
            >
              {steps.map((label, i) => {
                const number = (i + 1) as Step;
                const done = step > number;
                const current = step === number;
                return (
                  <li
                    key={label}
                    aria-current={current ? "step" : undefined}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold transition-colors",
                        done
                          ? "bg-ink text-white"
                          : current
                            ? "bg-brand-red text-white"
                            : "bg-sand text-ink/50"
                      )}
                    >
                      {done ? (
                        <Check
                          className="h-4 w-4"
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                      ) : (
                        String(number).padStart(2, "0")
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium sm:text-base",
                        !current && !done && "text-ink/50"
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>

            {returnedFromBkash && step > 1 && (
              <p
                className={cn(
                  "mb-6 rounded-[var(--radius-card)] px-5 py-4",
                  paymentResult === "failure"
                    ? "bg-brand-red/10 text-brand-red"
                    : "bg-sand"
                )}
                role={paymentResult === "failure" ? "alert" : "status"}
              >
                {paymentResult === "failure"
                  ? t("v2_enroll_failed")
                  : t("v2_enroll_cancelled")}
              </p>
            )}

            {/* Step 1 — course */}
            {step === 1 && (
              <div>
                {coursesLoading ? (
                  <div className="flex justify-center py-16" role="status">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : courses.length === 0 ? (
                  <p className="rounded-[var(--radius-card)] bg-sand p-8 text-center text-ink/70">
                    No courses are open for enrollment right now.
                  </p>
                ) : (
                  <div
                    className="flex flex-col gap-3"
                    role="radiogroup"
                    aria-label="Courses"
                  >
                    {courses.map(item => {
                      const selected = item.id === courseId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setCourseId(item.id)}
                          className={cn(
                            "rounded-[var(--radius-card)] border-2 p-5 text-left transition-colors lg:p-6",
                            selected
                              ? "border-ink bg-white"
                              : "border-transparent bg-sand hover:border-ink/20"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 text-sm text-ink/60">
                                <DecorSquare />
                                {CATEGORY_LABELS[item.category] ?? "Course"}
                                {item.badge && (
                                  <span className="rounded-full bg-brand-red px-2.5 py-0.5 text-xs font-medium text-white">
                                    {item.badge}
                                  </span>
                                )}
                              </p>
                              <h3 className="mt-2 text-[22px] lg:text-2xl">
                                {item.nameEn || item.name}
                              </h3>
                              {item.shortDescription && (
                                <p className="mt-1 text-ink/70">
                                  {item.shortDescription}
                                </p>
                              )}
                              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/60">
                                {item.duration && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                    {item.duration}
                                  </span>
                                )}
                                {item.maxStudents && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Users
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                    Up to {item.maxStudents} students
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-none flex-col items-end gap-3">
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full border-2",
                                  selected
                                    ? "border-ink bg-ink text-white"
                                    : "border-ink/30"
                                )}
                              >
                                {selected && (
                                  <Check
                                    className="h-3.5 w-3.5"
                                    strokeWidth={3}
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                              <span className="text-right">
                                <span className="block text-xl font-semibold">
                                  {item.price || "Contact us"}
                                </span>
                                {item.originalPrice && (
                                  <span className="block text-sm text-ink/50 line-through">
                                    {item.originalPrice}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          {selected &&
                            (item.learningOutcomes?.length ?? 0) > 0 && (
                              <ul className="mt-5 grid gap-2 border-t border-ink/10 pt-5 sm:grid-cols-2">
                                {item
                                  .learningOutcomes!.slice(0, 6)
                                  .map(outcome => (
                                    <li
                                      key={outcome}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      <CheckCircle2
                                        className="mt-0.5 h-4 w-4 flex-none text-brand-red"
                                        aria-hidden="true"
                                      />
                                      {outcome}
                                    </li>
                                  ))}
                              </ul>
                            )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-8 flex justify-end">
                  <ActionButton onClick={() => setStep(2)} disabled={!course}>
                    Continue
                  </ActionButton>
                </div>
              </div>
            )}

            {/* Step 2 — details */}
            {step === 2 && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (validateDetails()) setStep(3);
                }}
                noValidate
              >
                <p className="mb-2 flex items-center gap-2 text-lg">
                  <DecorSquare />
                  About you
                </p>
                <p className="mb-6 text-ink/70">
                  {t("v2_enroll_details_note")}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow label="Full name *" error={errors.studentName}>
                    <input
                      value={details.studentName}
                      onChange={update("studentName")}
                      className={fieldClass}
                      placeholder="e.g. Mohammad Ali"
                      autoComplete="name"
                      autoFocus
                    />
                  </FieldRow>
                  <FieldRow
                    label="Mobile number *"
                    error={errors.studentMobile}
                  >
                    <input
                      value={details.studentMobile}
                      onChange={update("studentMobile")}
                      className={fieldClass}
                      placeholder="01XXXXXXXXX"
                      type="tel"
                      autoComplete="tel"
                    />
                  </FieldRow>
                </div>

                <p className="mb-2 mt-10 flex items-center gap-2 text-lg">
                  <DecorSquare />
                  Your student account
                </p>
                <p className="mb-6 text-ink/70">
                  After payment we create your student account and show you a
                  password — you can change it anytime in your dashboard
                  settings. Already have an account? Enter the same email and
                  we'll add the course to it.
                </p>
                <FieldRow label="Email *" error={errors.studentEmail}>
                  <input
                    value={details.studentEmail}
                    onChange={update("studentEmail")}
                    className={fieldClass}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                  />
                </FieldRow>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 text-ink/70 transition-colors hover:text-ink"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Change
                    course
                  </button>
                  <ActionButton type="submit">Continue to payment</ActionButton>
                </div>
              </form>
            )}

            {/* Step 3 — pay */}
            {step === 3 && (
              <div>
                <dl className="grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-ink/15 sm:grid-cols-2">
                  {[
                    ["Course", courseTitle],
                    ["Amount", amount ? taka(amount) : "—"],
                    ["Name", details.studentName],
                    ["Login email", details.studentEmail],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-sand p-5">
                      <dt className="text-sm text-ink/60">{label}</dt>
                      <dd className="mt-1 font-medium [overflow-wrap:anywhere]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-3 text-sm text-ink/60 underline underline-offset-4 hover:text-ink"
                >
                  Edit details
                </button>

                {!amount || !bkashReady ? (
                  <div className="mt-8 rounded-[var(--radius-card)] bg-sand p-6">
                    <p className="font-medium">
                      Online payment isn't available for this course right now.
                    </p>
                    <p className="mt-1 text-ink/70">
                      Message us on WhatsApp and we'll help you enroll.
                    </p>
                    <HvButton
                      href={c.whatsapp("v2_enroll_help_message")}
                      variant="dark"
                      external
                      className="mt-5"
                    >
                      Enroll on WhatsApp
                    </HvButton>
                  </div>
                ) : (
                  <div className="mt-8">
                    <p className="flex items-start gap-3 text-ink/75">
                      <ShieldCheck
                        className="mt-0.5 h-5 w-5 flex-none text-brand-red"
                        aria-hidden="true"
                      />
                      {t("v2_enroll_payment_note")}
                    </p>
                    {errors.pay && (
                      <p
                        className="mt-6 rounded-[var(--radius-card)] bg-brand-red/10 px-5 py-4 text-brand-red"
                        role="alert"
                      >
                        {errors.pay}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={pay}
                      disabled={start.isPending || redirecting}
                      className="mt-6 flex w-full items-center justify-center gap-3 rounded-[var(--radius-control)] bg-[#E2136E] px-6 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
                    >
                      {start.isPending || redirecting ? (
                        <>
                          <Loader2
                            className="h-5 w-5 animate-spin"
                            aria-hidden="true"
                          />
                          Opening bKash…
                        </>
                      ) : (
                        `${t("v2_enroll_pay_button")} · ${taka(amount)}`
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 text-ink/70 transition-colors hover:text-ink"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[var(--radius-card)] bg-ink p-6 text-cream lg:p-8">
              <p className="text-sm text-ash">Your enrollment</p>
              {course ? (
                <>
                  <h2 className="mt-2 text-2xl text-cream">{courseTitle}</h2>
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
                    <span className="text-[40px] font-semibold leading-none">
                      {course.price || "Contact us"}
                    </span>
                    {course.originalPrice && (
                      <span className="text-ash line-through">
                        {course.originalPrice}
                      </span>
                    )}
                  </div>
                  <dl className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-5 text-sm">
                    {course.duration && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-ash">Duration</dt>
                        <dd>{course.duration}</dd>
                      </div>
                    )}
                    {course.schedule && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-ash">Schedule</dt>
                        <dd className="text-right">{course.schedule}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="text-ash">Payment</dt>
                      <dd>bKash</dd>
                    </div>
                  </dl>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="mt-5 text-sm text-ash underline underline-offset-4 transition-colors hover:text-cream"
                    >
                      Change course
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-2 text-lg text-cream/80">
                  Choose a course to see the price and details here.
                </p>
              )}
            </div>
            <div className="rounded-[var(--radius-card)] bg-sand p-6">
              <p className="font-medium">{t("v2_enroll_help_title")}</p>
              <p className="mt-1 text-ink/70">{t("v2_enroll_help_text")}</p>
              <a
                href={c.whatsapp("v2_enroll_help_message")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-medium text-brand-red hover:underline"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {c.contactPhone}
              </a>
            </div>
          </aside>
        </div>
      </section>
    </HvLayout>
  );
}
