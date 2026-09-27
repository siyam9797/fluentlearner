import { useState, type FormEvent } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "@/lib/router";
import {
  APP_ROLES,
  canManageUsers,
  ROLE_DEFINITIONS,
  type AppRole,
} from "@shared/roles";
import AdminSelect from "@/components/AdminSelect";

const inputClass =
  "mt-2 h-11 w-full border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]";

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, byte => chars[byte % chars.length]).join("");
}

export default function AdminUserCreate() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const mayManageUsers = canManageUsers(user?.role);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: AppRole;
  }>({ name: "", email: "", password: randomPassword(), role: "student" });
  const [created, setCreated] = useState<{
    email: string;
    password: string;
    role: AppRole;
  } | null>(null);

  const assignableRoles = APP_ROLES.filter(
    role =>
      user?.role === "super_admin" ||
      (role !== "super_admin" && role !== "admin")
  );
  const create = trpc.users.create.useMutation({
    onSuccess: () => {
      setCreated({
        email: form.email,
        password: form.password,
        role: form.role,
      });
      utils.users.list.invalidate();
      toast.success("User account created");
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(form);
  };

  const copyCredentials = async () => {
    if (!created) return;
    const path = created.role === "student" ? "/student" : "/admin";
    await navigator.clipboard.writeText(
      `FluentLearner account\nLogin: ${window.location.origin}${path}\nEmail: ${created.email}\nPassword: ${created.password}`
    );
    toast.success("Login details copied");
  };

  const createAnother = () => {
    setCreated(null);
    setForm({
      name: "",
      email: "",
      password: randomPassword(),
      role: "student",
    });
  };

  if (!loading && !mayManageUsers) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--admin-heading)]">
            User management access required
          </h1>
          <p className="mt-2 text-sm text-[var(--admin-body)]">
            Only Super Admin and Admin accounts can create users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="New user"
        parent={{ label: "Users", href: "/admin/users" }}
      />

      {created ? (
        <section className="rounded-[var(--radius-card)] max-w-2xl bg-[var(--admin-card)] p-6 sm:p-8">
          <span className="grid h-11 w-11 place-items-center bg-[color-mix(in_srgb,var(--admin-success)_14%,transparent)] text-[var(--admin-success)]">
            <Check className="h-5 w-5" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--admin-heading)]">
            User created successfully
          </h2>
          <p className="mt-2 text-sm text-[var(--admin-body)]">
            Copy these credentials now and share them securely. The password is
            only shown on this screen.
          </p>
          <dl className="mt-6 divide-y divide-[var(--admin-border)] border-y border-[var(--admin-border)] text-sm">
            <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-[var(--admin-body)]">Email</dt>
              <dd className="font-medium text-[var(--admin-heading)]">
                {created.email}
              </dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-[var(--admin-body)]">Password</dt>
              <dd className="font-mono font-semibold text-[var(--admin-heading)]">
                {created.password}
              </dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-[var(--admin-body)]">Role</dt>
              <dd className="font-medium text-[var(--admin-heading)]">
                {ROLE_DEFINITIONS[created.role].label}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyCredentials}
              className="admin-button admin-button-primary"
            >
              <Copy className="h-4 w-4" /> Copy credentials
            </button>
            <button
              type="button"
              onClick={createAnother}
              className="admin-button admin-button-secondary"
            >
              Create another
            </button>
            <Link
              href="/admin/users"
              className="admin-button admin-button-secondary"
            >
              Back to users
            </Link>
          </div>
        </section>
      ) : (
        <form onSubmit={submit} className="max-w-3xl">
          <div className="mb-7">
            <h2 className="font-display text-xl font-semibold text-[var(--admin-heading)]">
              Account information
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-body)]">
              Enter the user details and assign their platform role.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-[var(--admin-heading)]">
              Full name
              <input
                required
                value={form.name}
                onChange={event =>
                  setForm(current => ({ ...current, name: event.target.value }))
                }
                className={inputClass}
                placeholder="Enter full name"
              />
            </label>
            <label className="text-sm font-medium text-[var(--admin-heading)]">
              Email address
              <input
                required
                type="email"
                value={form.email}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="name@example.com"
              />
            </label>
            <label className="text-sm font-medium text-[var(--admin-heading)]">
              Role
              <AdminSelect
                value={form.role}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    role: event.target.value as AppRole,
                  }))
                }
              >
                {assignableRoles.map(role => (
                  <option key={role} value={role}>
                    {ROLE_DEFINITIONS[role].label}
                  </option>
                ))}
              </AdminSelect>
              <span className="mt-2 block text-xs font-normal leading-5 text-[var(--admin-body)]">
                {ROLE_DEFINITIONS[form.role].description}
              </span>
            </label>
            <label className="text-sm font-medium text-[var(--admin-heading)]">
              Temporary password
              <span className="mt-2 flex gap-2">
                <input
                  required
                  minLength={8}
                  value={form.password}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="h-11 min-w-0 flex-1 border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 font-mono text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <button
                  type="button"
                  className="admin-button admin-button-secondary shrink-0"
                  onClick={() =>
                    setForm(current => ({
                      ...current,
                      password: randomPassword(),
                    }))
                  }
                  aria-label="Generate password"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
              </span>
            </label>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--admin-border)] pt-6">
            <button
              className="admin-button admin-button-primary"
              disabled={create.isPending}
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Create user
            </button>
            <Link
              href="/admin/users"
              className="admin-button admin-button-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
