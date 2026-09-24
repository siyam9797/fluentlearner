import { trpc } from "@/lib/trpc";
import { Link } from "@/lib/router";
import {
  ArrowRight,
  Banknote,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  Plus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import AdminPageHeader from "@/components/AdminPageHeader";

const enrollmentStatus = {
  pending: { label: "Pending", className: "warning" },
  verified: { label: "Verified", className: "" },
  rejected: { label: "Rejected", className: "failed" },
  refunded: { label: "Refunded", className: "info" },
} as const;

const money = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });

export default function AdminDashboard() {
  const { data: stats } = trpc.enrollments.stats.useQuery();
  const { data: enrollments = [] } = trpc.enrollments.adminList.useQuery();
  const { data: courses = [] } = trpc.courses.adminList.useQuery();
  const { data: batches = [] } = trpc.batches.adminList.useQuery();
  const { data: paymentMethods = [] } =
    trpc.paymentSettings.adminList.useQuery();

  const total = stats?.total ?? 0;
  const verified = stats?.verified ?? 0;
  const pending = stats?.pending ?? 0;
  const activeCourses = courses.filter(course => course.isActive).length;
  const openBatches = batches.filter(batch => batch.isOpen).length;
  const activePaymentMethods = paymentMethods.filter(
    method => method.isActive
  ).length;
  const verifiedRevenue = enrollments
    .filter(enrollment => enrollment.status === "verified")
    .reduce(
      (sum, enrollment) =>
        sum + (Number.parseFloat(enrollment.paymentAmount) || 0),
      0
    );

  const metrics = [
    {
      label: "Total students",
      value: verified,
      note: `${pending} awaiting review`,
      icon: GraduationCap,
      color: "var(--admin-success)",
    },
    {
      label: "Verified revenue",
      value: `৳${money.format(verifiedRevenue)}`,
      note: "From verified enrollments",
      icon: Banknote,
      color: "var(--admin-primary)",
    },
    {
      label: "Active courses",
      value: activeCourses,
      note: `${courses.length} courses in total`,
      icon: BookOpen,
      color: "var(--admin-info)",
    },
    {
      label: "Open batches",
      value: openBatches,
      note: `${activePaymentMethods} active payment methods`,
      icon: Layers3,
      color: "var(--admin-warning)",
    },
  ];

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

  const recentEnrollments = [...enrollments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const courseName = (courseId: number) =>
    courses.find(course => course.id === courseId)?.name ||
    `Course #${courseId}`;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Overview"
        description="Manage courses, students, payments, and website content."
        action={
          <Link href="/admin/enrollments" className="admin-primary-button">
            Review enrollments
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="admin-card bg-[var(--admin-card)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--admin-placeholder)]">
                    {metric.label}
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--admin-heading)]">
                    {metric.value}
                  </p>
                </div>
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center"
                  style={{
                    background: `color-mix(in srgb, ${metric.color} 12%, transparent)`,
                    color: metric.color,
                  }}
                >
                  <Icon className="h-[18px] w-[18px] stroke-[1.7]" />
                </span>
              </div>
              <p className="mt-5 text-xs text-[var(--admin-placeholder)]">
                {metric.note}
              </p>
            </article>
          );
        })}
      </section>

      {pending > 0 && (
        <Link
          href="/admin/enrollments"
          className="mt-6 flex items-center justify-between gap-4 bg-[color-mix(in_srgb,var(--admin-warning)_12%,var(--admin-card))] px-5 py-4 text-sm"
        >
          <span className="flex items-center gap-3 font-medium text-[var(--admin-heading)]">
            <Clock3 className="h-5 w-5 text-[var(--admin-warning)]" />
            {pending} enrollment{pending === 1 ? "" : "s"} need verification
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold">
            Review now <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--admin-heading)]">
                Recent enrollments
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-placeholder)]">
                Latest applications requiring your attention.
              </p>
            </div>
            <Link
              href="/admin/enrollments"
              className="text-xs font-semibold text-[var(--admin-primary)]"
            >
              View all
            </Link>
          </div>
          <div className="bg-[var(--admin-card)]">
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
                    className="flex items-center gap-3 border-b border-[var(--admin-border)] px-5 py-4 last:border-0 hover:bg-black/[0.025]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center bg-[var(--admin-background)] text-sm font-semibold text-[var(--admin-heading)]">
                      {enrollment.studentName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--admin-heading)]">
                        {enrollment.studentName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--admin-placeholder)]">
                        {courseName(enrollment.courseId)} · ৳
                        {enrollment.paymentAmount}
                      </span>
                    </span>
                    <span className={`admin-status-label ${status.className}`}>
                      {status.label}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--admin-placeholder)]" />
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-12 text-center text-sm text-[var(--admin-placeholder)]">
                No enrollment applications yet.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-[var(--admin-heading)]">
              Enrollment status
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-placeholder)]">
              Application health at a glance.
            </p>
          </div>
          <div className="space-y-5 bg-[var(--admin-card)] p-5">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-4">
              <span className="inline-flex items-center gap-2 text-sm text-[var(--admin-body)]">
                <FileText className="h-4 w-4" /> All applications
              </span>
              <strong className="font-display text-2xl text-[var(--admin-heading)]">
                {total}
              </strong>
            </div>
            {statusItems.map(item => {
              const Icon = item.icon;
              const percentage = total
                ? Math.round((item.value / total) * 100)
                : 0;
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-[var(--admin-body)]">
                      <Icon
                        className="h-3.5 w-3.5"
                        style={{ color: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="font-semibold text-[var(--admin-heading)]">
                      {item.value} · {percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden bg-[var(--admin-background)]">
                    <div
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--admin-heading)]">
                Batch capacity
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-placeholder)]">
                Current student allocation across your batches.
              </p>
            </div>
            <Link
              href="/admin/batches"
              className="text-xs font-semibold text-[var(--admin-primary)]"
            >
              Manage batches
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {batches.slice(0, 4).map(batch => {
              const current = batch.currentCount ?? 0;
              const capacity = batch.maxCapacity || 1;
              const percentage = Math.min(
                100,
                Math.round((current / capacity) * 100)
              );
              return (
                <article key={batch.id} className="bg-[var(--admin-card)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[var(--admin-heading)]">
                        {batch.name}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--admin-placeholder)]">
                        {current} of {capacity} seats filled
                      </p>
                    </div>
                    <span
                      className={`admin-status-label ${batch.isOpen ? "" : "inactive"}`}
                    >
                      {batch.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden bg-[var(--admin-background)]">
                    <div
                      className="h-full bg-[var(--admin-primary)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-[11px] text-[var(--admin-placeholder)]">
                    {percentage}% occupied
                  </p>
                </article>
              );
            })}
            {!batches.length && (
              <div className="col-span-full bg-[var(--admin-card)] px-5 py-10 text-center text-sm text-[var(--admin-placeholder)]">
                No batches have been created yet.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-[var(--admin-heading)]">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-placeholder)]">
              Common management tasks.
            </p>
          </div>
          <div className="bg-[var(--admin-card)] p-3">
            {[
              {
                label: "Add a course",
                href: "/admin/courses/new",
                icon: Plus,
              },
              {
                label: "Create a batch",
                href: "/admin/batches/new",
                icon: Layers3,
              },
              {
                label: "Manage users",
                href: "/admin/users",
                icon: Users,
              },
              {
                label: "Add enrollment",
                href: "/enroll",
                icon: UserPlus,
              },
            ].map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--admin-heading)] hover:bg-[var(--admin-background)]"
                >
                  <Icon className="h-4 w-4 text-[var(--admin-primary)]" />
                  <span className="flex-1">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--admin-placeholder)]" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
