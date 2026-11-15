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

export default function AdminProfilePage() {
  const { user } = useAuth();
  const originalEmail = user?.email || "admin@localhost.test";
  const emptyProfile: AdminProfile = {
    name: user?.name || "Administrator",
    email: originalEmail,
    phone: "",
    signature: user?.name || "Administrator",
    bio: "",
    avatar: "",
  };
  const [form, setForm] = useState<AdminProfile>(emptyProfile);
  const [saved, setSaved] = useState<AdminProfile>(emptyProfile);

  useEffect(() => {
    const profile = loadAdminProfile(
      originalEmail,
      user?.name || "Administrator"
    );
    setForm(profile);
    setSaved(profile);
  }, [originalEmail, user?.name]);

  const update = (field: keyof AdminProfile, value: string) =>
    setForm(current => ({ ...current, [field]: value }));

  // The photo is saved to the account (Users page, header, every device), not to this browser.
  const devLogin = user?.openId === "local:admin";
  const utils = trpc.useUtils();
  const myAvatar = trpc.auth.myAvatar.useQuery(undefined, {
    enabled: !!user && !devLogin,
  });
  const updateAvatar = trpc.auth.updateAvatar.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.auth.myAvatar.invalidate(),
        utils.users.list.invalidate(),
      ]);
    },
    onError: error => toast.error(error.message),
  });
  const avatarUrl = myAvatar.data?.avatarUrl ?? "";

  // Photos chosen before they were saved to the account live only in this browser: move one over once.
  const migrated = useRef(false);
  useEffect(() => {
    if (migrated.current || devLogin || !myAvatar.isSuccess) return;
    const local = loadAdminProfile(
      originalEmail,
      user?.name || "Administrator"
    );
    const match = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(local.avatar);
    if (!match) return;
    migrated.current = true;
    const forget = () =>
      saveAdminProfile({ ...local, avatar: "" }, originalEmail);
    if (myAvatar.data.avatarUrl) return forget();
    updateAvatar.mutate(
      {
        base64: match[2],
        filename: `avatar.${match[1].split("/")[1] || "jpg"}`,
        contentType: match[1],
      },
      { onSuccess: forget }
    );
  }, [devLogin, myAvatar.isSuccess, myAvatar.data, originalEmail, user?.name]);

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
  const save = () => {
    if (!form.name.trim() || !form.email.trim())
      return toast.error("Name and email are required.");
    try {
      // The photo is saved to the account, so never keep a copy in the browser.
      saveAdminProfile({ ...form, avatar: "" }, originalEmail);
      setSaved(form);
      toast.success("Profile saved.");
    } catch {
      toast.error("The profile could not be saved. Try using a smaller image.");
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
            onChange={e => update("name", e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-[#30363d]">
          Email
          <input
            className={`${fieldClass} mt-2`}
            type="email"
            value={form.email}
            onChange={e => update("email", e.target.value)}
          />
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
          className="admin-button admin-button-primary min-w-40"
        >
          Save changes
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
