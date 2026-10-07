"use client";

/**
 * /admin/instructors — the instructor list that courses pick their instructor from.
 * Add, edit and delete profiles here; each course keeps its own copy until its instructor is re-selected.
 */
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Check, Loader2, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminImageUploader from "@/components/AdminImageUploader";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import { fileToBase64 } from "@/lib/fileToBase64";
import {
  newInstructorId,
  useInstructors,
  type Instructor,
} from "@/hooks/useInstructors";

const field =
  "mt-2 w-full border border-[var(--admin-border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--admin-primary)]";

const BASE = "/admin/instructors";

export default function AdminInstructors({
  createMode = false,
  editId,
}: {
  createMode?: boolean;
  editId?: string;
}) {
  const [, navigate] = useLocation();
  const { instructors, isLoading, save, saving } = useInstructors();
  const { data: courses = [] } = trpc.courses.adminList.useQuery();
  const upload = trpc.upload.image.useMutation();
  const [view, setView] = useState<AdminListView>("table");
  const [form, setForm] = useState<Instructor | null>(
    createMode ? { id: newInstructorId(), name: "", photo: "", bio: "" } : null
  );

  const editing = editId
    ? (instructors.find(item => item.id === editId) ?? null)
    : null;
  useEffect(() => {
    if (editing && !form) setForm(editing);
  }, [editing, form]);

  // Courses copy the instructor's name, so match on it.
  const coursesOf = useMemo(() => {
    const byName = new Map<string, string[]>();
    for (const course of courses) {
      const name = course.instructorName?.trim();
      if (!name) continue;
      byName.set(name, [
        ...(byName.get(name) ?? []),
        course.nameEn || course.name,
      ]);
    }
    return (instructor: Instructor) => byName.get(instructor.name.trim()) ?? [];
  }, [courses]);

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !form) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please choose an image file.");
    try {
      const { url } = await upload.mutateAsync({
        base64: await fileToBase64(file),
        filename: file.name,
        contentType: file.type,
      });
      setForm(current => (current ? { ...current, photo: url } : current));
    } catch {
      toast.error("The photo could not be uploaded.");
    }
  };

  const submit = async () => {
    if (!form) return;
    const next = { ...form, name: form.name.trim(), bio: form.bio.trim() };
    if (!next.name) return toast.error("Enter the instructor's name.");
    if (
      instructors.some(
        item =>
          item.id !== next.id &&
          item.name.toLowerCase() === next.name.toLowerCase()
      )
    )
      return toast.error("An instructor with this name already exists.");
    try {
      await save(
        instructors.some(item => item.id === next.id)
          ? instructors.map(item => (item.id === next.id ? next : item))
          : [...instructors, next]
      );
      toast.success(editId ? "Instructor updated" : "Instructor added");
      navigate(BASE);
    } catch {
      toast.error("The instructor could not be saved.");
    }
  };

  const remove = async (instructor: Instructor) => {
    const used = coursesOf(instructor).length;
    if (
      !confirm(
        used
          ? `Delete ${instructor.name}? ${used} course${used === 1 ? "" : "s"} keep their copy of this instructor.`
          : `Delete ${instructor.name}?`
      )
    )
      return;
    try {
      await save(instructors.filter(item => item.id !== instructor.id));
      toast.success("Instructor deleted");
    } catch {
      toast.error("The instructor could not be deleted.");
    }
  };

  const formOpen = createMode || !!editId;
  const photo = (instructor: Instructor, size: string) =>
    instructor.photo ? (
      <img
        src={instructor.photo}
        alt=""
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    ) : (
      <span
        className={`${size} grid shrink-0 place-items-center rounded-full bg-[var(--admin-card)] text-[var(--admin-body)]`}
      >
        <UserRound className="h-1/2 w-1/2 stroke-[1.5]" />
      </span>
    );
  const actions = (instructor: Instructor) => (
    <AdminActionsMenu label={`Actions for ${instructor.name}`}>
      <button
        type="button"
        onClick={() => navigate(`${BASE}/${instructor.id}/edit`)}
      >
        Edit
      </button>
      <button
        type="button"
        className="danger"
        disabled={saving}
        onClick={() => remove(instructor)}
      >
        Delete
      </button>
    </AdminActionsMenu>
  );

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={
          editId
            ? "Edit instructor"
            : createMode
              ? "New instructor"
              : "Instructors"
        }
        description="The teachers courses can pick as their instructor."
        parent={formOpen ? { label: "Instructors", href: BASE } : undefined}
        action={
          formOpen ? undefined : (
            <div className="flex items-center gap-2">
              <AdminViewToggle
                view={view}
                onChange={setView}
                label="Instructors"
              />
              <button
                onClick={() => navigate(`${BASE}/new`)}
                className="admin-primary-button"
              >
                <Plus className="h-4 w-4" />
                New instructor
              </button>
            </div>
          )
        }
      />

      {formOpen ? (
        isLoading || !form ? (
          <div className="grid min-h-[40vh] place-items-center text-sm text-[var(--admin-body)]">
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-[var(--admin-primary)]" />
            ) : (
              "Instructor not found."
            )}
          </div>
        ) : (
          <div className="max-w-3xl space-y-6">
            <div>
              <p className="mb-2.5 text-sm font-medium text-[var(--admin-heading)]">
                Photo
              </p>
              <div className="max-w-[320px]">
                <AdminImageUploader
                  value={form.photo}
                  label="Instructor photo"
                  recommendation="400 × 400px"
                  uploading={upload.isPending}
                  onChange={pickPhoto}
                  onMediaSelect={url =>
                    setForm(current =>
                      current ? { ...current, photo: url } : current
                    )
                  }
                  onRemove={() =>
                    setForm(current =>
                      current ? { ...current, photo: "" } : current
                    )
                  }
                />
              </div>
            </div>
            <label className="block text-sm font-medium text-[var(--admin-heading)]">
              Name
              <input
                value={form.name}
                onChange={event =>
                  setForm({ ...form, name: event.target.value })
                }
                className={`${field} h-11`}
                placeholder="e.g. Ayesha Rahman"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--admin-heading)]">
              Bio
              <textarea
                value={form.bio}
                onChange={event =>
                  setForm({ ...form, bio: event.target.value })
                }
                rows={5}
                className={`${field} py-2.5`}
                placeholder="Experience, band score, teaching style…"
              />
            </label>
            {editId && coursesOf(form).length > 0 && (
              <p className="text-xs text-[var(--admin-body)]">
                Courses keep their own copy of the instructor. To show these
                changes on a course, open it and pick this instructor again.
              </p>
            )}
            <div className="flex gap-3 border-t border-[var(--admin-border)] pt-6">
              <button
                type="button"
                onClick={submit}
                disabled={saving || upload.isPending}
                className="admin-button admin-button-primary"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editId ? "Save changes" : "Add instructor"}
              </button>
              <button
                type="button"
                onClick={() => navigate(BASE)}
                className="admin-button admin-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      ) : isLoading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--admin-primary)]" />
        </div>
      ) : instructors.length === 0 ? (
        <div className="py-16 text-center text-[var(--admin-body)]">
          No instructors yet. Add one to pick it on a course.
        </div>
      ) : view === "table" ? (
        <div className="admin-list-table-wrap">
          <table className="admin-list-table min-w-[720px]">
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Bio</th>
                <th>Courses</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {instructors.map(instructor => {
                const taught = coursesOf(instructor);
                return (
                  <tr key={instructor.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {photo(instructor, "h-10 w-10")}
                        <span className="font-semibold text-[var(--admin-heading)]">
                          {instructor.name}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[360px]">
                      <p className="line-clamp-2 text-[var(--admin-body)]">
                        {instructor.bio || "—"}
                      </p>
                    </td>
                    <td>
                      {taught.length ? (
                        <span title={taught.join(", ")}>
                          {taught.length} course
                          {taught.length === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="text-[var(--admin-body)]">None</span>
                      )}
                    </td>
                    <td>{actions(instructor)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-view-grid">
          {instructors.map(instructor => {
            const taught = coursesOf(instructor);
            return (
              <article
                key={instructor.id}
                className="admin-list-card min-h-[220px] p-6"
              >
                <div className="flex items-start gap-3">
                  {photo(instructor, "h-14 w-14")}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-[var(--admin-heading)]">
                      {instructor.name}
                    </h3>
                    <p className="text-xs text-[var(--admin-body)]">
                      {taught.length
                        ? `${taught.length} course${taught.length === 1 ? "" : "s"}`
                        : "No courses yet"}
                    </p>
                  </div>
                  {actions(instructor)}
                </div>
                {instructor.bio && (
                  <p className="mt-4 line-clamp-4 text-sm text-[var(--admin-body)]">
                    {instructor.bio}
                  </p>
                )}
                {taught.length > 0 && (
                  <p className="mt-3 text-xs text-[var(--admin-body)]">
                    {taught.join(" · ")}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
