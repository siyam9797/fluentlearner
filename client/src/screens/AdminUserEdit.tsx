import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "@/lib/router";
import { trpc } from "@/lib/trpc";
import {
  APP_ROLES,
  canManageUsers,
  ROLE_DEFINITIONS,
  type AppRole,
} from "@shared/roles";
import AdminSelect from "@/components/AdminSelect";

const field =
  "mt-2 h-11 w-full border border-[var(--admin-border)] bg-white px-3 text-sm outline-none focus:border-[var(--admin-primary)]";

export default function AdminUserEdit({ id }: { id: number }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const mayManage = canManageUsers(user?.role);
  const { data: users = [], isLoading } = trpc.users.list.useQuery(undefined, {
    enabled: mayManage,
  });
  const account = users.find(item => item.id === id);
  const [form, setForm] = useState<{
    name: string;
    role: AppRole;
    isActive: boolean;
  }>({ name: "", role: "student", isActive: true });

  useEffect(() => {
    if (!account) return;
    setForm({
      name: account.name || "",
      role: account.role as AppRole,
      isActive: account.isActive,
    });
  }, [account]);

  const update = trpc.users.update.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
      toast.success("User updated");
      navigate("/admin/users");
    },
    onError: error => toast.error(error.message),
  });

  const assignableRoles = APP_ROLES.filter(
    role =>
      user?.role === "super_admin" ||
      (role !== "super_admin" && role !== "admin")
  );
  const roleLocked =
    account?.id === user?.id ||
    (user?.role !== "super_admin" &&
      (account?.role === "super_admin" || account?.role === "admin"));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!account) return;
    update.mutate({
      id,
      name: form.name,
      role: roleLocked ? undefined : form.role,
      isActive: account.id === user?.id ? undefined : form.isActive,
    });
  };

  if (!loading && !mayManage) {
    return (
      <div className="grid min-h-[70vh] place-items-center text-center">
        User management access required.
      </div>
    );
  }

  if (isLoading || !account) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        {isLoading ? (
          <Loader2 className="h-7 w-7 animate-spin text-[var(--admin-primary)]" />
        ) : (
          <span className="text-sm text-[var(--admin-body)]">
            User not found.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Edit user"
        parent={{ label: "Users", href: "/admin/users" }}
      />
      <form onSubmit={submit} className="max-w-3xl">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Full name
            <input
              required
              value={form.name}
              onChange={event =>
                setForm(current => ({ ...current, name: event.target.value }))
              }
              className={field}
            />
          </label>
          <label className="text-sm font-medium">
            Email address
            <input
              value={account.email}
              disabled
              className={`${field} opacity-60`}
            />
          </label>
          <label className="text-sm font-medium">
            Role
            <AdminSelect
              value={form.role}
              disabled={roleLocked}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  role: event.target.value as AppRole,
                }))
              }
            >
              {(roleLocked ? APP_ROLES : assignableRoles).map(role => (
                <option key={role} value={role}>
                  {ROLE_DEFINITIONS[role].label}
                </option>
              ))}
            </AdminSelect>
            <span className="mt-2 block text-xs font-normal text-[var(--admin-body)]">
              {ROLE_DEFINITIONS[form.role].description}
            </span>
          </label>
          <label className="flex items-center gap-3 self-start pt-8 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={account.id === user?.id}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Account access enabled
          </label>
        </div>
        <div className="mt-8 flex gap-3 border-t border-[var(--admin-border)] pt-6">
          <button
            className="admin-button admin-button-primary"
            disabled={update.isPending}
          >
            {update.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save changes
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="admin-button admin-button-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
