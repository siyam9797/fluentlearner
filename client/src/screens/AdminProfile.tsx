"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please select an image file.");
    if (file.size > 2 * 1024 * 1024)
      return toast.error("Profile images must be smaller than 2MB.");
    const reader = new FileReader();
    reader.onload = () => update("avatar", String(reader.result));
    reader.onerror = () => toast.error("The image could not be read.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };
  const save = () => {
    if (!form.name.trim() || !form.email.trim())
      return toast.error("Name and email are required.");
    try {
      saveAdminProfile(form, originalEmail);
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
            value={form.avatar}
            label="Profile picture"
            recommendation="Square image, at least 512 × 512px"
            maxSizeLabel="Max 2 MB"
            onChange={selectImage}
            onRemove={() => update("avatar", "")}
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
