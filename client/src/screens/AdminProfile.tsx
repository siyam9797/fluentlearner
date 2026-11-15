"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { fileToBase64 } from "@/lib/fileToBase64";
import {
  AdminProfile,
  loadAdminProfile,
  saveAdminProfile,
} from "@/hooks/useAdminProfile";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminImageUploader from "@/components/AdminImageUploader";

const fieldClass =
  "h-11 w-full border border-[#d9d9d9] bg-white px-3.5 text-sm text-[#30363d] outline-none transition-colors focus:border-[#c76f42]";

/**
 * Admin → Profile.
 * Name, email and photo belong to the account (the same values the Users page shows and edits).
 * Phone, signature and bio have no database columns, so they stay in this browser.
 */
export default function AdminProfilePage() {
  const { user } = useAuth();
  const devLogin = user?.openId === "local:admin";
  const utils = trpc.useUtils();
  const account = trpc.auth.myProfile.useQuery(undefined, { enabled: !!user });
  const accountEmail = account.data?.email || user?.email || "";
  const accountName = account.data?.name || user?.name || "";
  const canEditEmail = !!account.data?.canEditEmail;

  const emptyProfile: AdminProfile = {
    name: accountName,
    email: accountEmail,
    phone: "",
    signature: accountName,
    bio: "",
    avatar: "",
  };
  const [form, setForm] = useState<AdminProfile>(emptyProfile);
  const [saved, setSaved] = useState<AdminProfile>(emptyProfile);

  // Account values always win over anything an older version kept in this browser.
  useEffect(() => {
    if (!account.data) return;
    const local = loadAdminProfile(accountEmail, accountName);
    const profile = {
      ...local,
      name: accountName,
      email: accountEmail,
      avatar: "",
    };
    setForm(profile);
    setSaved(profile);
  }, [account.data, accountEmail, accountName]);

  const update = (field: keyof AdminProfile, value: string) =>
    setForm(current => ({ ...current, [field]: value }));

  const refreshAccount = () =>
    Promise.all([
      utils.auth.myProfile.invalidate(),
      utils.auth.me.invalidate(),
      utils.users.list.invalidate(),
    ]);

  const updateAvatar = trpc.auth.updateAvatar.useMutation({
    onSuccess: refreshAccount,
    onError: error => toast.error(error.message),
  });
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onError: error => toast.error(error.message),
  });
  const avatarUrl = account.data?.avatarUrl ?? "";

  // Photos chosen before they were saved to the account live only in this browser: move one over once.
  const migrated = useRef(false);
  useEffect(() => {
    if (migrated.current || devLogin || !account.isSuccess) return;
    const local = loadAdminProfile(accountEmail, accountName);
    const match = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(local.avatar);
    if (!match) return;
    migrated.current = true;
    const forget = () =>
      saveAdminProfile({ ...local, avatar: "" }, accountEmail);
    if (account.data.avatarUrl) return forget();
    updateAvatar.mutate(
      {
        base64: match[2],
        filename: `avatar.${match[1].split("/")[1] || "jpg"}`,
        contentType: match[1],
      },
      { onSuccess: forget }
    );
  }, [devLogin, account.isSuccess, account.data, accountEmail, accountName]);

  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (devLogin)
      return toast.error(
        "The development login has no account to save a photo to."
      );
    if (!file.type.startsWith("image/"))
      return toast.error("Please select an image file.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Profile images must be smaller than 5MB.");
    try {
      await updateAvatar.mutateAsync({
        base64: await fileToBase64(file),
        filename: file.name,
        contentType: file.type,
      });
      toast.success("Profile picture updated.");
    } catch {
      // onError already showed the message.
    }
  };
  const removeImage = () =>
    updateAvatar.mutate(
      { remove: true },
      { onSuccess: () => toast.success("Profile picture removed.") }
    );

  const save = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) return toast.error("Name and email are required.");
    const nameChanged = name !== accountName;
    const emailChanged = canEditEmail && email !== accountEmail.toLowerCase();
    if (
      emailChanged &&
      !confirm(
        `Change your sign-in email from ${accountEmail} to ${email}? You will sign in with the new email from now on.`
      )
    )
      return;
    try {
      if (!devLogin && (nameChanged || emailChanged)) {
        await updateProfile.mutateAsync({
          name: nameChanged ? name : undefined,
          email: emailChanged ? email : undefined,
        });
        await refreshAccount();
      }
      // Phone, signature and bio stay in this browser, filed under the (possibly new) email.
      const next = {
        ...form,
        name,
        email: emailChanged ? email : accountEmail,
        avatar: "",
      };
      saveAdminProfile(next, next.email);
      setForm(next);
      setSaved(next);
      toast.success("Profile saved.");
    } catch {
      // onError already showed the message.
    }
  };

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Profile"
        description="Manage your account details."
      />

      <section className="mb-7">
        <label className="mb-3 block text-sm font-medium text-[#30363d]">
          Profile picture
        </label>
        <div className="max-w-xl">
          <AdminImageUploader
            value={avatarUrl}
            label="Profile picture"
            recommendation="Square image, at least 512 × 512px"
            maxSizeLabel="Max 5 MB"
            uploading={updateAvatar.isPending}
            onChange={selectImage}
            onRemove={removeImage}
          />
        </div>
      </section>

      <section className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <label className="block text-sm font-medium text-[#30363d]">
          Name
          <input
            className={`${fieldClass} mt-2`}
            value={form.name}
            disabled={devLogin}
            onChange={e => update("name", e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-[#30363d]">
          Email
          <input
            className={`${fieldClass} mt-2 ${canEditEmail ? "" : "cursor-not-allowed opacity-60"}`}
            type="email"
            value={form.email}
            disabled={!canEditEmail}
            onChange={e => update("email", e.target.value)}
          />
          <span className="mt-2 block text-xs font-normal text-[#747d87]">
            {canEditEmail
              ? "Your sign-in email. Changing it also updates the Users page."
              : "Only the Super Admin can change sign-in emails."}
          </span>
        </label>
        <label className="block text-sm font-medium text-[#30363d] md:col-span-2">
          Phone
          <input
            className={`${fieldClass} mt-2`}
            type="tel"
            value={form.phone}
            onChange={e => update("phone", e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-[#30363d] md:col-span-2">
          Signature
          <input
            className={`${fieldClass} mt-2`}
            value={form.signature}
            onChange={e => update("signature", e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-[#30363d] md:col-span-2">
          Bio
          <textarea
            className="mt-2 min-h-36 w-full resize-y border border-[#d9d9d9] bg-white px-3.5 py-3 text-sm text-[#30363d] outline-none focus:border-[#c76f42]"
            value={form.bio}
            onChange={e => update("bio", e.target.value)}
          />
        </label>
      </section>

      <div className="mt-0 flex flex-wrap gap-3 pt-8">
        <button
          onClick={save}
          disabled={updateProfile.isPending}
          className="admin-button admin-button-primary min-w-40"
        >
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          onClick={() => setForm(saved)}
          disabled={JSON.stringify(form) === JSON.stringify(saved)}
          className="admin-button admin-button-secondary min-w-40"
        >
          Discard changes
        </button>
      </div>
    </div>
  );
}
