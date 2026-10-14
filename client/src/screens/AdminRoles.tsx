import type { CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  Crown,
  GraduationCap,
  Megaphone,
  Plus,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { Link } from "@/lib/router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  APP_ROLES,
  canManageUsers,
  ROLE_DEFINITIONS,
  type AppRole,
} from "@shared/roles";

const roleDetails = {
  super_admin: {
    icon: Crown,
    eyebrow: "Platform owner",
    color: "var(--admin-primary)",
  },
  admin: {
    icon: ShieldCheck,
    eyebrow: "Business management",
    color: "var(--admin-info)",
  },
  marketing: {
    icon: Megaphone,
    eyebrow: "Ad tracking",
    color: "var(--admin-warning)",
  },
  staff: {
    icon: UserCog,
    eyebrow: "Daily operations",
    color: "var(--admin-success)",
  },
  mentor: {
    icon: UsersRound,
    eyebrow: "Teaching & feedback",
    color: "var(--admin-primary)",
  },
  student: {
    icon: GraduationCap,
    eyebrow: "Learning access",
    color: "var(--admin-body)",
  },
} satisfies Record<
  AppRole,
  { icon: typeof Crown; eyebrow: string; color: string }
>;

function RoleCard({
  role,
  count,
  loading,
}: {
  role: AppRole;
  count: number;
  loading: boolean;
}) {
  const definition = ROLE_DEFINITIONS[role];
  const detail = roleDetails[role];
  const Icon = detail.icon;
  const accent = { "--role-accent": detail.color } as CSSProperties;

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 transition-transform duration-200 hover:-translate-y-0.5"
      style={accent}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-[var(--role-accent)]" />
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[color-mix(in_srgb,var(--role-accent)_12%,transparent)] text-[var(--role-accent)]">
          <Icon className="h-5 w-5 stroke-[1.8]" aria-hidden="true" />
        </span>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold leading-none text-[var(--admin-heading)]">
            {loading ? "—" : count}
          </p>
          <p className="mt-1 text-xs text-[var(--admin-body)]">
            {count === 1 ? "account" : "accounts"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--role-accent)]">
          {detail.eyebrow}
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold text-[var(--admin-heading)]">
          {definition.label}
        </h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--admin-body)]">
          {definition.description}
        </p>
      </div>

      <div className="mt-6 border-t border-[var(--admin-border)] pt-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-heading)]">
          What they can do
        </p>
        <ul className="grid gap-2.5 text-sm leading-5 text-[var(--admin-body)]">
          {definition.permissions.map(permission => (
            <li key={permission} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--role-accent)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>{permission}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function AdminRoles() {
  const { user, loading } = useAuth();
  const mayManageUsers = canManageUsers(user?.role);
  const { data: users = [], isLoading: usersLoading } =
    trpc.users.list.useQuery(undefined, { enabled: mayManageUsers });

  if (!loading && !mayManageUsers) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--admin-heading)]">
            Role access required
          </h1>
          <p className="mt-2 text-sm text-[var(--admin-body)]">
            Only Super Admin and Admin accounts can view role management.
          </p>
        </div>
      </div>
    );
  }

  const countFor = (role: AppRole) =>
    users.filter(account => account.role === role).length;
  const teamCount = users.filter(account => account.role !== "student").length;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Roles"
        action={
          <Link
            href="/admin/users/new"
            className="admin-button admin-button-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add a user
          </Link>
        }
      />

      <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--admin-heading)] p-6 text-[var(--admin-card)] sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-current opacity-10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-3 -top-8 h-48 w-48 rounded-full border border-current opacity-10"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
              Access overview
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-[30px]">
              A clear role for every person on the platform.
            </h2>
            <p className="mt-3 text-sm leading-6 opacity-75">
              Roles define what each account can access. Assign or change a
              person&apos;s role from the Users page.
            </p>
            <Link
              href="/admin/users"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 hover:opacity-75"
            >
              Manage users <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-5 border-t border-current/20 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            {[
              { value: APP_ROLES.length, label: "Roles" },
              { value: usersLoading ? "—" : users.length, label: "Accounts" },
              { value: usersLoading ? "—" : teamCount, label: "Team members" },
            ].map(stat => (
              <div key={stat.label} className="min-w-16">
                <p className="font-display text-2xl font-semibold leading-none sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-[11px] leading-4 opacity-70">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="leadership-roles">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-primary)]">
              Platform access
            </p>
            <h2
              id="leadership-roles"
              className="mt-1 font-display text-xl font-semibold text-[var(--admin-heading)]"
            >
              Administration
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--admin-body)]">
            Broad access for platform ownership and business management.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {(["super_admin", "admin"] as const).map(role => (
            <RoleCard
              key={role}
              role={role}
              count={countFor(role)}
              loading={usersLoading}
            />
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="focused-roles">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-primary)]">
              Focused access
            </p>
            <h2
              id="focused-roles"
              className="mt-1 font-display text-xl font-semibold text-[var(--admin-heading)]"
            >
              Team & learners
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--admin-body)]">
            Permissions shaped around each person&apos;s work.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {(["marketing", "staff", "mentor", "student"] as const).map(role => (
            <RoleCard
              key={role}
              role={role}
              count={countFor(role)}
              loading={usersLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
