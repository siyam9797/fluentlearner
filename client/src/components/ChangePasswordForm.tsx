"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const fieldClass =
  "mt-2 h-11 w-full border border-[#d9d9d9] bg-white px-3.5 text-sm text-[#30363d] outline-none transition-colors focus:border-[#c76f42]";

/** Admin → Settings → Security: the signed-in account changes its own password. */
export default function ChangePasswordForm({
  devLogin,
}: {
  devLogin: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword)
      return toast.error("New passwords do not match.");
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-[#30363d]">
        Change password
      </h2>
      <p className="mb-8 mt-1 text-sm text-[#747d87]">
        Confirm your current password, then choose a new one of at least 8
        characters.
      </p>

      {devLogin ? (
        <p className="max-w-xl border border-[#d9d9d9] bg-[#fafafa] px-4 py-3 text-sm text-[#30363d]">
          You are signed in with the development login. Its password is set by{" "}
          <code>LOCAL_ADMIN_PASSWORD</code> in <code>.env</code>.
        </p>
      ) : (
        <form onSubmit={submit} className="grid max-w-xl gap-y-5">
          <label className="block text-xs font-medium text-[#30363d]">
            Current password
            <input
              type="password"
              autoComplete="current-password"
              required
              className={fieldClass}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-[#30363d]">
            New password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={fieldClass}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-[#30363d]">
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={fieldClass}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </label>
          <div className="pt-3">
            <button
              type="submit"
              disabled={
                changePassword.isPending ||
                !currentPassword ||
                newPassword.length < 8 ||
                !confirmPassword
              }
              className="admin-button admin-button-primary min-w-42"
            >
              {changePassword.isPending ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
