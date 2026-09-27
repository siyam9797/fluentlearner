import { useState } from "react";
import { Copy, Loader2, Plus, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "@/lib/router";
import {
  APP_ROLES,
  canManageUsers,
  ROLE_DEFINITIONS,
  type AppRole,
} from "@shared/roles";

const roleTone: Record<AppRole, string> = {
  super_admin: "info",
  admin: "warning",
  staff: "",
  mentor: "info",
  student: "inactive",
};

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, byte => chars[byte % chars.length]).join("");
}

export default function AdminUsers() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const mayManageUsers = canManageUsers(currentUser?.role);
  const { data: users = [], isLoading } = trpc.users.list.useQuery(undefined, {
    enabled: mayManageUsers,
  });
  const [view, setView] = useState<AdminListView>("table");
  const [shared, setShared] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const update = trpc.users.update.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
    onError: error => toast.error(error.message),
  });
  const reset = trpc.users.resetPassword.useMutation({
    onError: error => toast.error(error.message),
  });

  const copyDetails = async (email: string, password: string) => {
    await navigator.clipboard.writeText(
      `FluentLearner account\nLogin: ${window.location.origin}/admin\nEmail: ${email}\nPassword: ${password}`
    );
    toast.success("Login details copied");
  };

  const resetPassword = async (id: number, email: string) => {
    if (!confirm(`Set a new password for ${email}?`)) return;
    const password = randomPassword();
    await reset.mutateAsync({ id, password });
    setShared({ email, password });
    toast.success("Password reset");
  };

  const roleLabel = (account: (typeof users)[number]) => {
    const role = account.role as AppRole;
    return (
      <span className={`admin-status-label ${roleTone[role]}`}>
        {ROLE_DEFINITIONS[role].label}
      </span>
    );
  };

  if (!authLoading && !mayManageUsers) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--admin-heading)]">
            User management access required
          </h1>
          <p className="mt-2 text-sm text-[var(--admin-body)]">
            Only Super Admin and Admin accounts can manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Users"
        action={
          <div className="flex items-center gap-2">
            <AdminViewToggle view={view} onChange={setView} label="Users" />
            <Link href="/admin/users/new" className="admin-primary-button">
              <Plus className="h-4 w-4" /> New user
            </Link>
          </div>
        }
      />

      <div className="-mt-5 mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--admin-body)]">
        <span>{users.length} total users</span>
        {APP_ROLES.map(role => (
          <span key={role}>
            {ROLE_DEFINITIONS[role].label}:{" "}
            {users.filter(user => user.role === role).length}
          </span>
        ))}
      </div>

      {shared && (
        <div className="rounded-[var(--radius-card)] mb-6 flex flex-col gap-3 bg-[color-mix(in_srgb,var(--admin-success)_12%,var(--admin-card))] p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-[var(--admin-heading)]">
              Account credentials are ready
            </p>
            <p className="mt-1 break-all text-[var(--admin-body)]">
              {shared.email} ·{" "}
              <strong className="font-mono">{shared.password}</strong>
            </p>
          </div>
          <button
            className="admin-button admin-button-secondary"
            onClick={() => copyDetails(shared.email, shared.password)}
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
          <button
            className="admin-button admin-button-secondary"
            onClick={() => setShared(null)}
            aria-label="Dismiss credentials"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid min-h-64 place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--admin-primary)]" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center text-[var(--admin-body)]">
          <UserRound className="mx-auto mb-3 h-10 w-10" />
          No user accounts yet.
        </div>
      ) : view === "table" ? (
        <div className="admin-list-table-wrap">
          <table className="admin-list-table min-w-[820px]">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Last sign-in</th>
                <th>Created</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map(account => (
                <tr key={account.id}>
                  <td>
                    <p className="font-semibold text-[var(--admin-heading)]">
                      {account.name || "Unnamed user"}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--admin-body)]">
                      {account.email}
                    </p>
                  </td>
                  <td>{roleLabel(account)}</td>
                  <td>
                    {account.lastSignedIn
                      ? new Date(account.lastSignedIn).toLocaleDateString(
                          "en-GB"
                        )
                      : "Never"}
                  </td>
                  <td>
                    {new Date(account.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td>
                    <span
                      className={`admin-status-label ${account.isActive ? "" : "inactive"}`}
                    >
                      {account.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <AdminActionsMenu
                      label={`Actions for ${account.name || account.email}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin/users/${account.id}/edit`)
                        }
                      >
                        Edit user
                      </button>
                      <button
                        type="button"
                        disabled={account.id === currentUser?.id}
                        onClick={() =>
                          update.mutate({
                            id: account.id,
                            isActive: !account.isActive,
                          })
                        }
                      >
                        {account.isActive ? "Disable access" : "Enable access"}
                      </button>
                      <button
                        type="button"
                        disabled={reset.isPending}
                        onClick={() => resetPassword(account.id, account.email)}
                      >
                        Reset password
                      </button>
                    </AdminActionsMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-view-grid">
          {users.map(account => (
            <article
              key={account.id}
              className="admin-list-card min-h-[255px] p-6"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--admin-background)] font-semibold">
                  {(account.name || account.email).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-[var(--admin-heading)]">
                    {account.name || "Unnamed user"}
                  </h3>
                  <p className="truncate text-xs text-[var(--admin-body)]">
                    {account.email}
                  </p>
                </div>
                <AdminActionsMenu
                  label={`Actions for ${account.name || account.email}`}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/users/${account.id}/edit`)}
                  >
                    Edit user
                  </button>
                  <button
                    type="button"
                    disabled={account.id === currentUser?.id}
                    onClick={() =>
                      update.mutate({
                        id: account.id,
                        isActive: !account.isActive,
                      })
                    }
                  >
                    {account.isActive ? "Disable access" : "Enable access"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetPassword(account.id, account.email)}
                  >
                    Reset password
                  </button>
                </AdminActionsMenu>
              </div>
              <div className="mt-6">{roleLabel(account)}</div>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--admin-border)] pt-4 text-xs">
                <div>
                  <dt className="text-[var(--admin-body)]">Last sign-in</dt>
                  <dd className="mt-1 font-medium text-[var(--admin-heading)]">
                    {account.lastSignedIn
                      ? new Date(account.lastSignedIn).toLocaleDateString(
                          "en-GB"
                        )
                      : "Never"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--admin-body)]">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`admin-status-label ${account.isActive ? "" : "inactive"}`}
                    >
                      {account.isActive ? "Active" : "Disabled"}
                    </span>
                  </dd>
                </div>
              </dl>
              <span
                className={`admin-status-label ${roleTone[account.role as AppRole]} absolute bottom-5 right-5`}
              >
                {ROLE_DEFINITIONS[account.role as AppRole].label}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
