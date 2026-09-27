import { useState, type ChangeEvent } from "react";
import {
  BookOpen,
  Download,
  File,
  FileUp,
  ListFilter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminFilterDrawer from "@/components/AdminFilterDrawer";
import { fileToBase64 } from "@/lib/fileToBase64";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import AdminSelect from "@/components/AdminSelect";

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

type VocabularyWordRow =
  RouterOutputs["learningResources"]["vocabularyList"][number];
type VocabularyFilters = {
  topics: string[];
  statuses: ("visible" | "hidden")[];
  types: string[];
};
const NO_FILTERS: VocabularyFilters = { topics: [], statuses: [], types: [] };

const filterCount = (filters: VocabularyFilters) =>
  filters.topics.length + filters.statuses.length + filters.types.length;

function filterWords(
  words: VocabularyWordRow[],
  query: string,
  filters: VocabularyFilters
) {
  const q = query.trim().toLowerCase();
  return words.filter(word => {
    if (
      q &&
      ![word.word, word.meaning, word.example, word.topic].some(text =>
        text.toLowerCase().includes(q)
      )
    )
      return false;
    if (filters.topics.length && !filters.topics.includes(word.topic))
      return false;
    if (filters.types.length && !filters.types.includes(word.partOfSpeech))
      return false;
    if (
      filters.statuses.length &&
      !filters.statuses.includes(word.isActive ? "visible" : "hidden")
    )
      return false;
    return true;
  });
}

/** Right-hand filter drawer, matching the one on Enrollments. */
function VocabularyFilterDrawer({
  words,
  filters,
  onChange,
  onClose,
}: {
  words: VocabularyWordRow[];
  filters: VocabularyFilters;
  onChange: (filters: VocabularyFilters) => void;
  onClose: () => void;
}) {
  const countBy = (pick: (word: VocabularyWordRow) => string) => {
    const counts = new Map<string, number>();
    for (const word of words)
      counts.set(pick(word), (counts.get(pick(word)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  };
  const groups: {
    key: keyof VocabularyFilters;
    title: string;
    options: [string, number, string?][];
  }[] = [
    {
      key: "statuses",
      title: "Status",
      options: [
        ["visible", words.filter(word => word.isActive).length, "Visible"],
        ["hidden", words.filter(word => !word.isActive).length, "Hidden"],
      ],
    },
    { key: "topics", title: "Topic", options: countBy(word => word.topic) },
    {
      key: "types",
      title: "Part of speech",
      options: countBy(word => word.partOfSpeech),
    },
  ];
  return (
    <AdminFilterDrawer
      title="Filter vocabulary"
      groups={groups.map(group => ({
        key: group.key,
        title: group.title,
        options: group.options.map(([value, count, label]) => ({
          value,
          count,
          label: label ?? value,
        })),
      }))}
      selection={filters}
      onChange={next =>
        onChange({ ...NO_FILTERS, ...next } as VocabularyFilters)
      }
      onClose={onClose}
    />
  );
}

function AdminVocabulary({
  query,
  filters,
}: {
  query: string;
  filters: VocabularyFilters;
}) {
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
  const visibleWords = filterWords(words, query, filters);
  const filtering = query.trim() !== "" || filterCount(filters) > 0;

  return (
    <div>
      {!isLoading && words.length > 0 && (
        <p className="mb-4 text-sm text-gray-500">
          {filtering
            ? `Showing ${visibleWords.length} of ${words.length} words`
            : `${words.length} words`}
        </p>
      )}
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
                className={`${field} mt-2`}
                value={form.word}
                onChange={e => setForm(v => ({ ...v, word: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium">
              Part of speech
              <input
                className={`${field} mt-2`}
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
                className={`${field} mt-2`}
                placeholder="Academic, Environment…"
                value={form.topic}
                onChange={e => setForm(v => ({ ...v, topic: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium">
              Order
              <input
                type="number"
                className={`${field} mt-2`}
                value={form.sortOrder}
                onChange={e =>
                  setForm(v => ({ ...v, sortOrder: Number(e.target.value) }))
                }
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Meaning
              <textarea
                className={`${field} mt-2 min-h-20`}
                value={form.meaning}
                onChange={e =>
                  setForm(v => ({ ...v, meaning: e.target.value }))
                }
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Example sentence
              <textarea
                className={`${field} mt-2 min-h-20`}
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
          <div className="mt-0 flex gap-3 pt-8">
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
      ) : words.length > 0 && visibleWords.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No words match your search or filters.
        </div>
      ) : words.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-14 text-center text-gray-500">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          No vocabulary words yet.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Word</th>
                <th className="px-4 py-3 font-medium">Meaning</th>
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleWords.map(word => (
                <tr
                  key={word.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {word.word}
                    <span className="ml-2 text-xs font-normal italic text-gray-400">
                      {word.partOfSpeech}
                    </span>
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-gray-600">
                    <span className="line-clamp-2">{word.meaning}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{word.topic}</td>
                  <td className="px-4 py-3 text-gray-600">{word.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`admin-status-label ${word.isActive ? "" : "inactive"}`}
                    >
                      {word.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AdminActionsMenu label={`Actions for ${word.word}`}>
                      <button type="button" onClick={() => edit(word)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          confirm(`Delete “${word.word}”?`) &&
                          remove.mutate({ id: word.id })
                        }
                      >
                        Delete
                      </button>
                    </AdminActionsMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  // Driven by the URL: the sidebar sub-menu links to /admin/resources and /admin/resources/vocabulary.
  const section = initialSection;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<VocabularyFilters>(NO_FILTERS);
  const { data: vocabularyWords = [] } =
    trpc.learningResources.vocabularyList.useQuery(undefined, {
      enabled: section === "vocabulary",
    });
  const activeFilters = filterCount(filters);
  const iconButton = "admin-icon-button";
  const filterButton = (
    <button
      type="button"
      onClick={() => setFilterOpen(true)}
      aria-label="Filter vocabulary"
      aria-expanded={filterOpen}
      className={iconButton}
    >
      <ListFilter className="h-4 w-4" />
      {activeFilters > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] text-white">
          {activeFilters}
        </span>
      )}
    </button>
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
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={section === "vocabulary" ? "Vocabulary" : "Resource files"}
        parent={{ label: "Resources", href: "/admin/resources" }}
        action={
          section === "vocabulary" ? (
            searchOpen ? undefined : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search vocabulary"
                  className={iconButton}
                >
                  <Search className="h-4 w-4" />
                </button>
                {filterButton}
                <button
                  onClick={() => navigate("/admin/resources/vocabulary/new")}
                  className="admin-primary-button"
                >
                  <Plus className="h-4 w-4" />
                  Add word
                </button>
              </div>
            )
          ) : !open ? (
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

      {section === "vocabulary" && searchOpen && (
        <div className="-mt-4 mb-8 flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") {
                  setSearchQuery("");
                  setSearchOpen(false);
                }
              }}
              placeholder="Search by word, meaning, example or topic"
              className="h-11 w-full rounded-lg border border-gray-300 pl-11 pr-4 outline-none focus:border-red-500"
            />
          </div>
          {filterButton}
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSearchOpen(false);
            }}
            aria-label="Close search"
            className={iconButton}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {filterOpen && (
        <VocabularyFilterDrawer
          words={vocabularyWords}
          filters={filters}
          onChange={setFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {section === "vocabulary" ? (
        <AdminVocabulary query={searchQuery} filters={filters} />
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
                    className={`${field} mt-2`}
                    value={form.title}
                    onChange={e =>
                      setForm(v => ({ ...v, title: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm font-medium">
                  Available to
                  <AdminSelect
                    value={form.batchId ?? ""}
                    onChange={e =>
                      setForm(v => ({
                        ...v,
                        batchId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="mt-2"
                  >
                    <option value="">All students</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </AdminSelect>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Description
                  <textarea
                    className={`${field} mt-2 min-h-24`}
                    value={form.description}
                    onChange={e =>
                      setForm(v => ({ ...v, description: e.target.value }))
                    }
                  />
                </label>
                <div className="sm:col-span-2 rounded-[var(--radius-card)] border border-dashed border-gray-300 p-5">
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
                    className={`${field} mt-2`}
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
              <div className="mt-0 flex gap-3 pt-8">
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
            <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-14 text-center text-gray-500">
              <File className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              No resources published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(row => (
                <div
                  key={row.resource.id}
                  className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-5"
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
