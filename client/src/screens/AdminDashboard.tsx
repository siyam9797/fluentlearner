import type { ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "@/lib/router";
import {
  ArrowRight,
  Banknote,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers3,
  LayoutTemplate,
  PenLine,
  Plus,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import AdminPageHeader from "@/components/AdminPageHeader";
import {
  MonthlyBars,
  Sparkline,
  lastMonths,
  monthKey,
} from "@/components/AdminCharts";
import { MODULE_ICONS } from "./AdminMockTests";
import { MODULE_LABELS, type MockModule } from "@shared/mock";

const enrollmentStatus = {
  pending: { label: "Pending", className: "warning" },
  verified: { label: "Verified", className: "" },
  rejected: { label: "Rejected", className: "failed" },
  refunded: { label: "Refunded", className: "info" },
} as const;

const attemptStatus = {
  in_progress: { label: "In progress", className: "inactive" },
  submitted: { label: "To grade", className: "warning" },
  graded: { label: "Graded", className: "" },
} as const;

const MODULES: MockModule[] = ["reading", "listening", "writing", "speaking"];
const money = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
/** ৳12k style, for chart captions. */
const compactMoney = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const DAY = 24 * 60 * 60 * 1000;

/** "Today", "Yesterday", "3 days ago", then a short date. */
function relativeDay(value: Date | string) {
  const date = new Date(value);
  const days = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) /
      DAY
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** A titled section whose panel stretches to match its neighbour in the same row. */
function Section({
  title,
  description,
  link,
  children,
  panelClassName = "",
}: {
  title: string;
  description: string;
  link?: { label: string; href: string };
  children: ReactNode;
  panelClassName?: string;
}) {
  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-4 flex min-h-12 items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--admin-heading)]">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--admin-body)]">
            {description}
          </p>
        </div>
        {link && (
          <Link
            href={link.href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--admin-primary)] hover:underline"
          >
            {link.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div
        className={`flex-1 overflow-hidden rounded-[var(--radius-card)] bg-[var(--admin-card)] ${panelClassName}`}
      >
        {children}
      </div>
    </section>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-background)]">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function IconTile({
  icon: Icon,
  color,
  size = "md",
}: {
  icon: LucideIcon;
  color: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[var(--radius-control)] ${size === "sm" ? "h-8 w-8" : "h-10 w-10"}`}
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        color,
      }}
    >
      <Icon
        className={`${size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"} stroke-[1.7]`}
      />
    </span>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-full min-h-40 place-items-center px-5 py-10 text-center text-sm text-[var(--admin-body)]">
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats } = trpc.enrollments.stats.useQuery();
  const { data: enrollments = [] } = trpc.enrollments.adminList.useQuery();
  const { data: courses = [] } = trpc.courses.adminList.useQuery();
  const { data: batches = [] } = trpc.batches.adminList.useQuery();
  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: tests = [] } = trpc.mockTests.list.useQuery();
  const { data: attempts = [] } = trpc.mockTests.attempts.useQuery({});

  const now = Date.now();
  const months = lastMonths(6);
  const thisMonth = months.at(-1)!.key;
  /** Count (or sum) rows per month over the last six months. */
  const perMonth = <T,>(
    rows: T[],
    dateOf: (row: T) => Date | string | null | undefined,
    amount: (row: T) => number = () => 1
  ) =>
    months.map(month =>
      rows.reduce((sum, row) => {
        const date = dateOf(row);
        return date && monthKey(date) === month.key ? sum + amount(row) : sum;
      }, 0)
    );

  const total = stats?.total ?? 0;
  const verified = stats?.verified ?? 0;
  const pending = stats?.pending ?? 0;
  const activeCourses = courses.filter(course => course.isActive).length;
  const openBatches = batches.filter(batch => batch.isOpen).length;
  const amountOf = (enrollment: (typeof enrollments)[number]) =>
    Number.parseFloat(enrollment.paymentAmount) || 0;
  const verifiedEnrollments = enrollments.filter(e => e.status === "verified");
  const totalRevenue = verifiedEnrollments.reduce(
    (sum, e) => sum + amountOf(e),
    0
  );
  const revenueByMonth = perMonth(
    verifiedEnrollments,
    e => e.createdAt,
    amountOf
  );
  const activeStudents = students.filter(student => student.isActive).length;
  const studentsByMonth = perMonth(students, s => s.createdAt);
  const finished = attempts.filter(a => a.attempt.status !== "in_progress");
  const attemptsByMonth = perMonth(finished, a => a.attempt.submittedAt);
  const weekAttempts = finished.filter(
    a =>
      a.attempt.submittedAt &&
      new Date(a.attempt.submittedAt).getTime() >= now - 7 * DAY
  ).length;
  const toGrade = tests.reduce((sum, test) => sum + test.awaitingGrading, 0);
  const gradingModule = MODULES.reduce((best, module) => {
    const waiting = (m: MockModule) =>
      tests
        .filter(test => test.module === m)
        .reduce((sum, test) => sum + test.awaitingGrading, 0);
    return waiting(module) > waiting(best) ? module : best;
  }, MODULES[0]);
  const publishedTests = tests.filter(test => test.isPublished).length;
  const enrollmentsVerifiedByMonth = perMonth(
    verifiedEnrollments,
    e => e.createdAt
  );
  const enrollmentsOtherByMonth = perMonth(
    enrollments.filter(e => e.status !== "verified"),
    e => e.createdAt
  );
  const newThisMonth = (rows: { createdAt: Date | string }[]) =>
    rows.filter(row => monthKey(row.createdAt) === thisMonth).length;

  const metrics = [
    {
      label: "Students",
      value: String(activeStudents),
      note: `${newThisMonth(students)} new this month`,
      icon: GraduationCap,
      color: "var(--admin-success)",
      href: "/admin/users",
      trend: studentsByMonth,
    },
    {
      label: "Revenue",
      value: `৳${money.format(totalRevenue)}`,
      note: `৳${money.format(revenueByMonth.at(-1) ?? 0)} this month`,
      icon: Banknote,
      color: "var(--admin-primary)",
      href: "/admin/enrollments",
      trend: revenueByMonth,
    },
    {
      label: "Mock attempts",
      value: String(finished.length),
      note: `${weekAttempts} in the last 7 days`,
      icon: ClipboardCheck,
      color: "var(--admin-info)",
      href: "/admin/ielts/listening",
      trend: attemptsByMonth,
    },
    {
      label: "Active courses",
      value: String(activeCourses),
      note: `${openBatches} open batch${openBatches === 1 ? "" : "es"}`,
      icon: BookOpen,
      color: "var(--admin-warning)",
      href: "/admin/courses",
      trend: null,
    },
  ];

  const attention = [
    pending > 0 && {
      label: `${pending} enrollment${pending === 1 ? "" : "s"} to verify`,
      href: "/admin/enrollments",
      icon: Clock3,
      color: "var(--admin-warning)",
    },
    toGrade > 0 && {
      label: `${toGrade} mock answer${toGrade === 1 ? "" : "s"} to grade`,
      // Open the module with the most answers waiting, on its "To grade" attempts panel.
      href: `/admin/ielts/${gradingModule}?attempts=submitted`,
      icon: PenLine,
      color: "var(--admin-info)",
    },
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: LucideIcon;
    color: string;
  }[];

  const statusItems = [
    {
      label: "Pending",
      value: pending,
      icon: Clock3,
      color: "var(--admin-warning)",
    },
    {
      label: "Verified",
      value: verified,
      icon: CheckCircle2,
      color: "var(--admin-success)",
    },
    {
      label: "Rejected",
      value: stats?.rejected ?? 0,
      icon: XCircle,
      color: "var(--admin-failed)",
    },
  ];

  const moduleStats = MODULES.map(module => {
    const rows = finished.filter(a => a.test.module === module);
    const bands = rows
      .map(a => Number(a.attempt.band))
      .filter(band => Number.isFinite(band) && band > 0);
    return {
      module,
      count: rows.length,
      average: bands.length
        ? (bands.reduce((sum, band) => sum + band, 0) / bands.length).toFixed(1)
        : null,
    };
  });
  const moduleMax = Math.max(...moduleStats.map(item => item.count), 1);

  const recentEnrollments = [...enrollments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);
  const recentAttempts = attempts.slice(0, 5);

  const courseName = (courseId: number) =>
    courses.find(course => course.id === courseId)?.name ||
    `Course #${courseId}`;

  const quickActions = [
    { label: "New test", href: "/admin/ielts/new", icon: Plus },
    { label: "Add a course", href: "/admin/courses/new", icon: BookOpen },
    { label: "Create a batch", href: "/admin/batches/new", icon: Layers3 },
    { label: "Add a student", href: "/admin/users/new", icon: UserPlus },
    { label: "Edit website", href: "/admin/website", icon: LayoutTemplate },
  ];

  const rowClass =
    "flex items-center gap-3 border-b border-[var(--admin-border)] px-5 py-3.5 transition-colors last:border-0 hover:bg-black/[0.025]";
  const avatarClass =
    "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--admin-background)] text-sm font-semibold text-[var(--admin-heading)]";
  const row = "grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]";

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Overview"
        description={new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        action={
          <a
            href="/home-2"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-button admin-button-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            View website
          </a>
        }
      />

      <div className="space-y-10">
        <div className="space-y-4">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(metric => (
              <Link
                key={metric.label}
                href={metric.href}
                className="flex flex-col rounded-[var(--radius-card)] bg-[var(--admin-card)] p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <IconTile icon={metric.icon} color={metric.color} size="sm" />
                  <p className="text-sm font-medium text-[var(--admin-body)]">
                    {metric.label}
                  </p>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <p className="min-w-0 truncate font-display text-[28px] font-semibold leading-none tracking-tight text-[var(--admin-heading)]">
                    {metric.value}
                  </p>
                  {metric.trend && (
                    <Sparkline values={metric.trend} color={metric.color} />
                  )}
                </div>
                <p className="mt-4 border-t border-[var(--admin-border)] pt-3 text-xs text-[var(--admin-body)]">
                  {metric.note}
                </p>
              </Link>
            ))}
          </section>

          {attention.length ? (
            <section className="grid gap-4 sm:grid-cols-2">
              {attention.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-[var(--radius-card)] px-5 py-4 text-sm transition-[filter] hover:brightness-[0.98]"
                  style={{
                    background: `color-mix(in srgb, ${item.color} 12%, var(--admin-card))`,
                  }}
                >
                  <item.icon
                    className="h-5 w-5 shrink-0"
                    style={{ color: item.color }}
                  />
                  <span className="flex-1 font-medium text-[var(--admin-heading)]">
                    {item.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-heading)]">
                    Review <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </section>
          ) : (
            <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[color-mix(in_srgb,var(--admin-success)_10%,var(--admin-card))] px-5 py-4 text-sm font-medium text-[var(--admin-heading)]">
              <CheckCircle2 className="h-5 w-5 text-[var(--admin-success)]" />
              All caught up — no enrollments to verify or answers to grade.
            </div>
          )}
        </div>

        <div className={row}>
          <Section
            title="Enrollments by month"
            description="Applications over the last six months, with verified revenue."
            link={{ label: "View all", href: "/admin/enrollments" }}
            panelClassName="p-5"
          >
            <MonthlyBars
              months={months}
              series={[
                {
                  label: "Verified",
                  color: "var(--admin-primary)",
                  values: enrollmentsVerifiedByMonth,
                },
                {
                  label: "Pending or rejected",
                  color:
                    "color-mix(in srgb, var(--admin-body) 30%, transparent)",
                  values: enrollmentsOtherByMonth,
                },
              ]}
              caption={index =>
                revenueByMonth[index]
                  ? `৳${compactMoney.format(revenueByMonth[index])}`
                  : "—"
              }
            />
          </Section>

          <Section
            title="Enrollment status"
            description="Application health at a glance."
            panelClassName="flex flex-col justify-between gap-5 p-5"
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-4">
              <span className="inline-flex items-center gap-2 text-sm text-[var(--admin-body)]">
                <FileText className="h-4 w-4" /> All applications
              </span>
              <strong className="font-display text-2xl text-[var(--admin-heading)]">
                {total}
              </strong>
            </div>
            {statusItems.map(item => {
              const percentage = total
                ? Math.round((item.value / total) * 100)
                : 0;
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-[var(--admin-body)]">
                      <item.icon
                        className="h-3.5 w-3.5"
                        style={{ color: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="font-semibold text-[var(--admin-heading)]">
                      {item.value} · {percentage}%
                    </span>
                  </div>
                  <Bar value={percentage} color={item.color} />
                </div>
              );
            })}
          </Section>
        </div>

        <div className={row}>
          <Section
            title="Recent enrollments"
            description="The latest applications and payments."
            link={{ label: "View all", href: "/admin/enrollments" }}
          >
            {recentEnrollments.length ? (
              recentEnrollments.map(enrollment => {
                const status =
                  enrollmentStatus[
                    enrollment.status as keyof typeof enrollmentStatus
                  ] || enrollmentStatus.pending;
                return (
                  <Link
                    key={enrollment.id}
                    href={`/admin/enrollments/${enrollment.id}`}
                    className={rowClass}
                  >
                    <span className={avatarClass}>
                      {enrollment.studentName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--admin-heading)]">
                        {enrollment.studentName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--admin-body)]">
                        {courseName(enrollment.courseId)} · ৳
                        {enrollment.paymentAmount} ·{" "}
                        {relativeDay(enrollment.createdAt)}
                      </span>
                    </span>
                    <span className={`admin-status-label ${status.className}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })
            ) : (
              <EmptyRow>No enrollment applications yet.</EmptyRow>
            )}
          </Section>

          <Section
            title="Quick actions"
            description="Common management tasks."
            panelClassName="p-2"
          >
            {quickActions.map(action => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-3 text-sm font-medium text-[var(--admin-heading)] transition-colors hover:bg-[var(--admin-background)]"
              >
                <IconTile
                  icon={action.icon}
                  color="var(--admin-primary)"
                  size="sm"
                />
                <span className="flex-1">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-[var(--admin-body)]" />
              </Link>
            ))}
          </Section>
        </div>

        <div className={row}>
          <Section
            title="Recent mock attempts"
            description={`${publishedTests} published test${publishedTests === 1 ? "" : "s"} available to students.`}
            link={{ label: "IELTS modules", href: "/admin/ielts/listening" }}
          >
            {recentAttempts.length ? (
              recentAttempts.map(({ attempt, test, student }) => {
                const Icon = MODULE_ICONS[test.module];
                const status = attemptStatus[attempt.status];
                return (
                  <Link
                    key={attempt.id}
                    href={`/admin/ielts/attempts/${attempt.id}`}
                    className={rowClass}
                  >
                    <span className={avatarClass}>
                      <Icon className="h-4 w-4 text-[var(--admin-body)]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--admin-heading)]">
                        {student?.name ?? "Deleted student"}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--admin-body)]">
                        {test.title} ·{" "}
                        {relativeDay(attempt.submittedAt ?? attempt.startedAt)}
                      </span>
                    </span>
                    {attempt.band && (
                      <span className="font-display text-lg font-semibold text-[var(--admin-heading)]">
                        {attempt.band}
                      </span>
                    )}
                    <span className={`admin-status-label ${status.className}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })
            ) : (
              <EmptyRow>No students have taken a mock test yet.</EmptyRow>
            )}
          </Section>

          <Section
            title="Attempts by module"
            description="Completed attempts and average band."
            panelClassName="flex flex-col justify-between gap-5 p-5"
          >
            {moduleStats.map(item => {
              const Icon = MODULE_ICONS[item.module];
              return (
                <div key={item.module}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-[var(--admin-body)]">
                      <Icon className="h-3.5 w-3.5 text-[var(--admin-primary)]" />
                      {MODULE_LABELS[item.module]}
                    </span>
                    <span className="font-semibold text-[var(--admin-heading)]">
                      {item.count}
                      {item.average && (
                        <span className="font-normal text-[var(--admin-body)]">
                          {" "}
                          · band {item.average}
                        </span>
                      )}
                    </span>
                  </div>
                  <Bar
                    value={(item.count / moduleMax) * 100}
                    color="var(--admin-primary)"
                  />
                </div>
              );
            })}
          </Section>
        </div>

        <section>
          <div className="mb-4 flex min-h-12 items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[var(--admin-heading)]">
                Batch capacity
              </h2>
              <p className="mt-0.5 text-sm text-[var(--admin-body)]">
                Current student allocation across your batches.
              </p>
            </div>
            <Link
              href="/admin/batches"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--admin-primary)] hover:underline"
            >
              Manage batches <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {batches.slice(0, 4).map(batch => {
              const current = batch.currentCount ?? 0;
              const capacity = batch.maxCapacity || 1;
              const percentage = Math.min(
                100,
                Math.round((current / capacity) * 100)
              );
              return (
                <article
                  key={batch.id}
                  className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate text-sm font-semibold text-[var(--admin-heading)]">
                      {batch.name}
                    </h3>
                    <span
                      className={`admin-status-label ${batch.isOpen ? "" : "inactive"}`}
                    >
                      {batch.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="mb-4 mt-1 text-xs text-[var(--admin-body)]">
                    {current} of {capacity} seats filled
                  </p>
                  <Bar
                    value={percentage}
                    color={
                      percentage >= 90
                        ? "var(--admin-failed)"
                        : "var(--admin-primary)"
                    }
                  />
                  <p className="mt-2 text-right text-[11px] text-[var(--admin-body)]">
                    {percentage}% occupied
                  </p>
                </article>
              );
            })}
            {!batches.length && (
              <div className="col-span-full rounded-[var(--radius-card)] bg-[var(--admin-card)] px-5 py-10 text-center text-sm text-[var(--admin-body)]">
                No batches have been created yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
