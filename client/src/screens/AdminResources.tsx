import { useState, type ChangeEvent } from "react";
import {
  BookOpen,
  Download,
  File,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { fileToBase64 } from "@/lib/fileToBase64";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { useLocation } from "@/lib/router";

type Row = RouterOutputs["learningResources"]["list"][number];
type Form = {
  title: string;
  description: string;
  batchId: number | null;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
  isActive: boolean;
  sortOrder: number;
};

const empty: Form = {
  title: "",
  description: "",
  batchId: null,
  fileUrl: "",
  fileName: "",
  mimeType: "",
  fileSize: null,
  isActive: true,
  sortOrder: 0,
};
const field =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-primary)]";

function sizeLabel(bytes: number | null | undefined) {
  if (!bytes) return "External link";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type WordForm = {
  word: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  topic: string;
  isActive: boolean;
  sortOrder: number;
};
const emptyWord: WordForm = {
  word: "",
  partOfSpeech: "",
  meaning: "",
  example: "",
  topic: "Academic",
  isActive: true,
  sortOrder: 0,
};

function AdminVocabulary() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: words = [], isLoading } =
    trpc.learningResources.vocabularyList.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<WordForm>(emptyWord);
  const done = () => {
    toast.success(editing ? "Vocabulary updated" : "Vocabulary added");
    setOpen(false);
    setEditing(null);
    setForm(emptyWord);
    utils.learningResources.vocabularyList.invalidate();
  };
  const create = trpc.learningResources.vocabularyCreate.useMutation({
    onSuccess: done,
    onError: error => toast.error(error.message),
  });
  const update = trpc.learningResources.vocabularyUpdate.useMutation({
    onSuccess: done,
    onError: error => toast.error(error.message),
  });
  const remove = trpc.learningResources.vocabularyDelete.useMutation({
    onSuccess: () => {
      toast.success("Vocabulary deleted");
      utils.learningResources.vocabularyList.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const edit = (word: (typeof words)[number]) => {
    navigate(`/admin/resources/vocabulary/${word.id}/edit`);
  };
  const save = () => {
    if (
      !form.word ||
      !form.partOfSpeech ||
      !form.meaning ||
      !form.example ||
      !form.topic
    )
      return toast.error("Complete every vocabulary field");
    if (editing) update.mutate({ id: editing, data: form });
    else create.mutate(form);
  };
  const pending = create.isPending || update.isPending;

  return (
    <div>
      <div className="mb-5 flex justify-end">
        {!open && (
          <button
            onClick={() => navigate("/admin/resources/vocabulary/new")}
            className="admin-primary-button"
          >
            <Plus className="h-4 w-4" />
            Add word
          </button>
        )}
      </div>
      {open && (
        <div className="mb-8 border-b border-[var(--admin-border)] pb-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? "Edit vocabulary" : "New vocabulary word"}
            </h2>
            <button onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Word
              <input
                className={`${field} mt-1`}
                value={form.word}
                onChange={e => setForm(v => ({ ...v, word: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium">
              Part of speech
              <input
                className={`${field} mt-1`}
                placeholder="noun, verb, adjective…"
                value={form.partOfSpeech}
                onChange={e =>
                  setForm(v => ({ ...v, partOfSpeech: e.target.value }))
                }
              />
            </label>
            <label className="text-sm font-medium">
              Topic
              <input
                className={`${field} mt-1`}
                placeholder="Academic, Environment…"
                value={form.topic}
                onChange={e => setForm(v => ({ ...v, topic: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium">
              Order
              <input
                type="number"
                className={`${field} mt-1`}
                value={form.sortOrder}
                onChange={e =>
                  setForm(v => ({ ...v, sortOrder: Number(e.target.value) }))
                }
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Meaning
              <textarea
                className={`${field} mt-1 min-h-20`}
                value={form.meaning}
                onChange={e =>
                  setForm(v => ({ ...v, meaning: e.target.value }))
                }
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Example sentence
              <textarea
                className={`${field} mt-1 min-h-20`}
                value={form.example}
                onChange={e =>
                  setForm(v => ({ ...v, example: e.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e =>
                  setForm(v => ({ ...v, isActive: e.target.checked }))
                }
              />
              Visible to students
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={save}
              disabled={pending}
              className="admin-primary-button"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add word"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="admin-button admin-button-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : words.length === 0 ? (
        <div className="rounded-xl bg-white p-14 text-center text-gray-500">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          No vocabulary words yet.
        </div>
      ) : (
        <div className="space-y-3">
          {words.map(word => (
            <div
              key={word.id}
              className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-5"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--admin-card)] font-serif text-lg font-bold">
                Aa
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">
                  {word.word}{" "}
                  <span className="ml-1 text-xs font-normal italic text-gray-400">
                    {word.partOfSpeech}
                  </span>
                </h3>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {word.meaning}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {word.topic} · {word.isActive ? "Visible" : "Hidden"}
                </p>
              </div>
              <button
                onClick={() => edit(word)}
                className="p-2 text-gray-500 hover:text-black"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  confirm(`Delete “${word.word}”?`) &&
                  remove.mutate({ id: word.id })
                }
                className="p-2 text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminResources({
  initialSection = "files",
}: {
  initialSection?: "files" | "vocabulary";
}) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: rows = [], isLoading } = trpc.learningResources.list.useQuery();
  const { data: batches = [] } = trpc.batches.adminList.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [section, setSection] = useState<"files" | "vocabulary">(
    initialSection
  );
  const upload = trpc.learningResources.upload.useMutation();
  const create = trpc.learningResources.create.useMutation({
    onSuccess: done,
    onError: error => toast.error(error.message),
  });
  const update = trpc.learningResources.update.useMutation({
    onSuccess: done,
    onError: error => toast.error(error.message),
  });
  const remove = trpc.learningResources.delete.useMutation({
    onSuccess: () => {
      toast.success("Resource deleted");
      utils.learningResources.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  function done() {
    toast.success(editing ? "Resource updated" : "Resource published");
    setOpen(false);
    setEditing(null);
    setForm(empty);
    utils.learningResources.list.invalidate();
  }

  const edit = (row: Row) => {
    navigate(`/admin/resources/${row.resource.id}/edit`);
  };

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024)
      return toast.error("File must be 25MB or smaller");
    try {
      const result = await upload.mutateAsync({
        base64: await fileToBase64(file),
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      setForm(value => ({
        ...value,
        fileUrl: result.url,
        fileName: result.fileName,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        title: value.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      toast.success("File uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const save = () => {
    if (!form.title.trim() || !form.fileUrl.trim())
      return toast.error("Add a title and upload a file or enter a URL");
    const data = {
      ...form,
      description: form.description || null,
      fileName: form.fileName || null,
      mimeType: form.mimeType || null,
    };
    if (editing) update.mutate({ id: editing, data });
    else create.mutate(data);
  };

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Resources"
        description="Manage student files, links, and IELTS vocabulary."
        action={
          section === "files" && !open ? (
            <button
              onClick={() => navigate("/admin/resources/new")}
              className="admin-primary-button"
            >
              <Plus className="h-4 w-4" />
              Add resource
            </button>
          ) : undefined
        }
      />
      <div className="mb-7 inline-flex rounded-md bg-white p-1">
        <button
          onClick={() => {
            setSection("files");
            navigate("/admin/resources");
          }}
          className={`rounded px-5 py-2.5 text-sm font-medium ${section === "files" ? "bg-[var(--admin-heading)] text-white" : "text-gray-500"}`}
        >
          Resource files
        </button>
        <button
          onClick={() => {
            setSection("vocabulary");
            navigate("/admin/resources/vocabulary");
          }}
          className={`rounded px-5 py-2.5 text-sm font-medium ${section === "vocabulary" ? "bg-[var(--admin-heading)] text-white" : "text-gray-500"}`}
        >
          Vocabulary
        </button>
      </div>

      {section === "vocabulary" ? (
        <AdminVocabulary />
      ) : (
        <>
          {open && (
            <div className="mb-8 border-b border-[var(--admin-border)] pb-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editing ? "Edit resource" : "New resource"}
                </h2>
                <button onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Title
                  <input
                    className={`${field} mt-1`}
                    value={form.title}
                    onChange={e =>
                      setForm(v => ({ ...v, title: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm font-medium">
                  Available to
                  <select
                    className={`${field} mt-1`}
                    value={form.batchId ?? ""}
                    onChange={e =>
                      setForm(v => ({
                        ...v,
                        batchId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  >
                    <option value="">All students</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Description
                  <textarea
                    className={`${field} mt-1 min-h-24`}
                    value={form.description}
                    onChange={e =>
                      setForm(v => ({ ...v, description: e.target.value }))
                    }
                  />
                </label>
                <div className="sm:col-span-2 rounded-lg border border-dashed border-gray-300 p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="admin-button admin-button-secondary">
                      <FileUp className="h-4 w-4" />
                      {upload.isPending ? "Uploading…" : "Upload file"}
                      <input
                        type="file"
                        className="sr-only"
                        disabled={upload.isPending}
                        onChange={uploadFile}
                      />
                    </label>
                    <span className="text-sm text-gray-500">
                      PDF, document, slides, spreadsheet, ZIP, image, audio, or
                      video · maximum 25MB
                    </span>
                  </div>
                  {form.fileName && (
                    <p className="mt-3 flex items-center gap-2 text-sm">
                      <File className="h-4 w-4" />
                      {form.fileName} · {sizeLabel(form.fileSize)}
                    </p>
                  )}
                </div>
                <label className="text-sm font-medium sm:col-span-2">
                  Or external URL
                  <input
                    type="url"
                    className={`${field} mt-1`}
                    placeholder="https://…"
                    value={form.fileUrl}
                    onChange={e =>
                      setForm(v => ({
                        ...v,
                        fileUrl: e.target.value,
                        fileName: "",
                        mimeType: "",
                        fileSize: null,
                      }))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e =>
                      setForm(v => ({ ...v, isActive: e.target.checked }))
                    }
                  />
                  Visible to students
                </label>
                <label className="flex items-center gap-3 text-sm">
                  Order
                  <input
                    type="number"
                    className="w-24 rounded-md border px-3 py-2"
                    value={form.sortOrder}
                    onChange={e =>
                      setForm(v => ({
                        ...v,
                        sortOrder: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={save}
                  disabled={
                    create.isPending || update.isPending || upload.isPending
                  }
                  className="admin-primary-button"
                >
                  {create.isPending || update.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {editing ? "Save changes" : "Publish resource"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="admin-button admin-button-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl bg-white p-14 text-center text-gray-500">
              <File className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              No resources published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(row => (
                <div
                  key={row.resource.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-5"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--admin-card)]">
                    <File className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">
                      {row.resource.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {row.batch?.name || "All students"} ·{" "}
                      {sizeLabel(row.resource.fileSize)} ·{" "}
                      {row.resource.isActive ? "Visible" : "Hidden"}
                    </p>
                  </div>
                  <a
                    href={row.resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-button admin-button-secondary"
                  >
                    <Download className="h-4 w-4" />
                    Open
                  </a>
                  <button
                    onClick={() => edit(row)}
                    className="p-2 text-gray-500 hover:text-black"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      confirm(`Delete “${row.resource.title}”?`) &&
                      remove.mutate({ id: row.resource.id })
                    }
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
