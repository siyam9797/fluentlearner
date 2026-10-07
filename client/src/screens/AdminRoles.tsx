import {
  Check,
  Crown,
  GraduationCap,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  APP_ROLES,
  canManageUsers,
  ROLE_DEFINITIONS,
  type AppRole,
} from "@shared/roles";

const roleIcons = {
  super_admin: Crown,
  admin: ShieldCheck,
  staff: UserCog,
  mentor: UsersRound,
  student: GraduationCap,
} satisfies Record<AppRole, typeof Crown>;

export default function AdminRoles() {
  const { user, loading } = useAuth();
  const mayManageUsers = canManageUsers(user?.role);
  const { data: users = [] } = trpc.users.list.useQuery(undefined, {
    enabled: mayManageUsers,
  });

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

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader title="Roles" />
      <p className="-mt-5 mb-8 max-w-2xl text-sm leading-6 text-[var(--admin-body)]">
        These five roles define who uses the platform and the responsibilities
        assigned to each account type.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {APP_ROLES.map((role, index) => {
          const definition = ROLE_DEFINITIONS[role];
          const Icon = roleIcons[role];
          const count = users.filter(user => user.role === role).length;
          return (
            <article
              key={role}
              className={`rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6 ${index === 0 ? "md:col-span-2" : ""}`}
            >
              <div className="flex items-start gap-4">
                <span className="rounded-[var(--radius-control)] grid h-11 w-11 shrink-0 place-items-center bg-[color-mix(in_srgb,var(--admin-primary)_12%,transparent)] text-[var(--admin-primary)]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--admin-body)]">
                        Role {String(index + 1).padStart(2, "0")}
                      </p>
                      <h2 className="mt-1 font-display text-xl font-semibold text-[var(--admin-heading)]">
                        {definition.label}
                      </h2>
                    </div>
                    <span className="admin-status-label info">
                      {count} {count === 1 ? "user" : "users"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--admin-body)]">
                    {definition.description}
                  </p>
                  <ul className="mt-5 grid gap-2 text-sm text-[var(--admin-body)] sm:grid-cols-2">
                    {definition.permissions.map(permission => (
                      <li key={permission} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--admin-success)]" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
