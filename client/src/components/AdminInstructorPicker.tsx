"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { fileToBase64 } from "@/lib/fileToBase64";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminImageUploader from "@/components/AdminImageUploader";
import {
  newInstructorId,
  useInstructors,
  type Instructor,
} from "@/hooks/useInstructors";

/** The instructor fields stored on a course (a copy of the chosen profile). */
export type CourseInstructor = {
  instructorName: string;
  instructorPhoto: string;
  instructorBio: string;
};

const NONE = "__none__";
const ADD = "__add__";
const CUSTOM = "__custom__";

export const toCourseInstructor = (
  instructor: Instructor | null
): CourseInstructor => ({
  instructorName: instructor?.name ?? "",
  instructorPhoto: instructor?.photo ?? "",
  instructorBio: instructor?.bio ?? "",
});

/**
 * Pick the course's instructor from the saved list, or add a new one to the list.
 * Editing a saved instructor updates the list and this course; other courses keep their copy until re-selected.
 */
export default function AdminInstructorPicker({
  value,
  onChange,
}: {
  value: CourseInstructor;
  onChange: (value: CourseInstructor) => void;
}) {
  const { instructors, save, saving } = useInstructors();
  const upload = trpc.upload.image.useMutation();
  const [draft, setDraft] = useState<Instructor | null>(null);
  const [uploading, setUploading] = useState(false);

  const selected = instructors.find(
    item =>
      item.name.trim().toLowerCase() ===
      value.instructorName.trim().toLowerCase()
  );
  const selectValue = !value.instructorName
    ? NONE
    : selected
      ? selected.id
      : CUSTOM;
  const isNew = draft ? !instructors.some(item => item.id === draft.id) : false;

  const pick = (id: string) => {
    if (id === ADD)
      return setDraft({ id: newInstructorId(), name: "", photo: "", bio: "" });
    setDraft(null);
    if (id === CUSTOM) return;
    onChange(
      toCourseInstructor(instructors.find(item => item.id === id) ?? null)
    );
  };

  const uploadPhoto = async (file: File) => {
    if (!draft) return;
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Images must be smaller than 5MB.");
    setUploading(true);
    try {
      const result = await upload.mutateAsync({
        base64: await fileToBase64(file),
        filename: file.name,
        contentType: file.type,
      });
      setDraft(current =>
        current ? { ...current, photo: result.url } : current
      );
    } catch {
      toast.error("Unable to upload the image.");
    } finally {
      setUploading(false);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return toast.error("Please enter the instructor's name.");
    if (
      instructors.some(
        item =>
          item.id !== draft.id &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    )
      return toast.error(`An instructor named “${name}” already exists.`);
    const next = { ...draft, name };
    try {
      await save(
        isNew
          ? [...instructors, next]
          : instructors.map(item => (item.id === next.id ? next : item))
      );
      onChange(toCourseInstructor(next));
      setDraft(null);
      toast.success(isNew ? "Instructor added." : "Instructor updated.");
    } catch {
      toast.error("Unable to save the instructor.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Instructor</Label>
        <div className="mt-2">
          <Select
            value={draft && isNew ? ADD : selectValue}
            onValueChange={pick}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No instructor</SelectItem>
              {instructors.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
              {selectValue === CUSTOM && (
                <SelectItem value={CUSTOM}>
                  {value.instructorName} (this course only)
                </SelectItem>
              )}
              <SelectSeparator />
              <SelectItem value={ADD}>+ Add new instructor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="mt-1.5 text-xs text-[#747d87]">
          Choose from your saved instructors. Their name, photo and bio fill in
          automatically.
        </p>
      </div>

      {draft ? (
        <div className="space-y-5 border-t border-[#e3e3e3] pt-6">
          <p className="text-sm font-medium text-[#30363d]">
            {isNew ? "New instructor" : `Edit ${draft.name || "instructor"}`}
          </p>
          <div>
            <Label>Name *</Label>
            <div className="mt-2">
              <Input
                autoFocus
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
          </div>
          <div>
            <Label>Photo</Label>
            <div className="mt-2">
              <AdminImageUploader
                value={draft.photo}
                label="Instructor photo"
                recommendation="Square image, at least 512 × 512px"
                uploading={uploading}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = "";
                }}
                onMediaSelect={url => setDraft({ ...draft, photo: url })}
                onRemove={() => setDraft({ ...draft, photo: "" })}
              />
            </div>
          </div>
          <div>
            <Label>Bio</Label>
            <div className="mt-2">
              <Textarea
                value={draft.bio}
                onChange={e => setDraft({ ...draft, bio: e.target.value })}
                placeholder="Experience, qualifications, achievements…"
                rows={5}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || uploading}
              className="admin-button admin-button-primary"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isNew ? "Add instructor" : "Save instructor"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="admin-button admin-button-secondary"
            >
              Cancel
            </button>
          </div>
          {!isNew && (
            <p className="text-xs text-[#747d87]">
              Changes are saved to the instructor list. Other courses using this
              instructor update the next time you select them there.
            </p>
          )}
        </div>
      ) : value.instructorName ? (
        <div className="flex gap-4 border-t border-[#e3e3e3] pt-6">
          {value.instructorPhoto ? (
            <img
              src={value.instructorPhoto}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--admin-card)] text-lg font-semibold text-[#30363d]">
              {value.instructorName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#30363d]">{value.instructorName}</p>
            {value.instructorBio && (
              <p className="mt-1 line-clamp-3 text-sm text-[#747d87]">
                {value.instructorBio}
              </p>
            )}
            <button
              type="button"
              onClick={() =>
                setDraft(
                  selected ?? {
                    id: newInstructorId(),
                    name: value.instructorName,
                    photo: value.instructorPhoto,
                    bio: value.instructorBio,
                  }
                )
              }
              className="mt-2 text-sm text-[#c76f42] hover:underline"
            >
              {selected ? "Edit instructor" : "Save to instructor list"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
