import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, File, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { fileToBase64 } from "@/lib/fileToBase64";
import { useLocation } from "@/lib/router";
import { trpc } from "@/lib/trpc";
import AdminSelect from "@/components/AdminSelect";

type ResourceForm = {
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

type VocabularyForm = {
  word: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  topic: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyResource: ResourceForm = {
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

const emptyVocabulary: VocabularyForm = {
  word: "",
  partOfSpeech: "",
  meaning: "",
  example: "",
  topic: "Academic",
  isActive: true,
  sortOrder: 0,
};

const field =
  "mt-2 w-full border border-[var(--admin-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-primary)]";

export default function AdminResourceForm({
  kind,
  editId,
}: {
  kind: "resource" | "vocabulary";
  editId?: number;
}) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const editing = Boolean(editId);
  const [resource, setResource] = useState<ResourceForm>(emptyResource);
  const [vocabulary, setVocabulary] = useState<VocabularyForm>(emptyVocabulary);
  const { data: batches = [] } = trpc.batches.adminList.useQuery();
  const { data: resources = [] } = trpc.learningResources.list.useQuery(
    undefined,
    { enabled: kind === "resource" && editing }
  );
  const { data: words = [] } = trpc.learningResources.vocabularyList.useQuery(
    undefined,
    {
      enabled: kind === "vocabulary" && editing,
    }
  );
  const upload = trpc.learningResources.upload.useMutation();

  useEffect(() => {
    if (kind !== "resource" || !editId) return;
    const row = resources.find(item => item.resource.id === editId);
    if (!row) return;
    setResource({
      title: row.resource.title,
      description: row.resource.description ?? "",
      batchId: row.resource.batchId,
      fileUrl: row.resource.fileUrl,
      fileName: row.resource.fileName ?? "",
      mimeType: row.resource.mimeType ?? "",
      fileSize: row.resource.fileSize,
      isActive: row.resource.isActive,
      sortOrder: row.resource.sortOrder,
    });
  }, [editId, kind, resources]);

  useEffect(() => {
    if (kind !== "vocabulary" || !editId) return;
    const word = words.find(item => item.id === editId);
    if (!word) return;
    setVocabulary({
      word: word.word,
      partOfSpeech: word.partOfSpeech,
      meaning: word.meaning,
      example: word.example,
      topic: word.topic,
      isActive: word.isActive,
      sortOrder: word.sortOrder,
    });
  }, [editId, kind, words]);

  const resourceCreate = trpc.learningResources.create.useMutation({
    onSuccess: () => finish("Resource published", "/admin/resources"),
    onError: error => toast.error(error.message),
  });
  const resourceUpdate = trpc.learningResources.update.useMutation({
    onSuccess: () => finish("Resource updated", "/admin/resources"),
    onError: error => toast.error(error.message),
  });
  const vocabularyCreate = trpc.learningResources.vocabularyCreate.useMutation({
    onSuccess: () => finish("Vocabulary added", "/admin/resources/vocabulary"),
    onError: error => toast.error(error.message),
  });
  const vocabularyUpdate = trpc.learningResources.vocabularyUpdate.useMutation({
    onSuccess: () =>
      finish("Vocabulary updated", "/admin/resources/vocabulary"),
    onError: error => toast.error(error.message),
  });

  function finish(message: string, path: string) {
    toast.success(message);
    utils.learningResources.list.invalidate();
    utils.learningResources.vocabularyList.invalidate();
    navigate(path);
  }

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.size > 25 * 1024 * 1024) {
      toast.error("File must be 25MB or smaller");
      return;
    }
    try {
      const result = await upload.mutateAsync({
        base64: await fileToBase64(selected),
        filename: selected.name,
        contentType: selected.type || "application/octet-stream",
      });
      setResource(current => ({
        ...current,
        fileUrl: result.url,
        fileName: result.fileName,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        title: current.title || selected.name.replace(/\.[^.]+$/, ""),
      }));
      toast.success("File uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const saveResource = (event: FormEvent) => {
    event.preventDefault();
    if (!resource.title.trim() || !resource.fileUrl.trim()) {
      toast.error("Add a title and upload a file or enter a URL");
      return;
    }
    const data = {
      ...resource,
      description: resource.description || null,
      fileName: resource.fileName || null,
      mimeType: resource.mimeType || null,
    };
    if (editId) resourceUpdate.mutate({ id: editId, data });
    else resourceCreate.mutate(data);
  };

  const saveVocabulary = (event: FormEvent) => {
    event.preventDefault();
    if (
      !vocabulary.word.trim() ||
      !vocabulary.partOfSpeech.trim() ||
      !vocabulary.meaning.trim() ||
      !vocabulary.example.trim() ||
      !vocabulary.topic.trim()
    ) {
      toast.error("Complete every vocabulary field");
      return;
    }
    if (editId) vocabularyUpdate.mutate({ id: editId, data: vocabulary });
    else vocabularyCreate.mutate(vocabulary);
  };

  const isVocabulary = kind === "vocabulary";
  const backPath = isVocabulary
    ? "/admin/resources/vocabulary"
    : "/admin/resources";
  const pending =
    resourceCreate.isPending ||
    resourceUpdate.isPending ||
    vocabularyCreate.isPending ||
    vocabularyUpdate.isPending;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={`${editing ? "Edit" : "New"} ${isVocabulary ? "Vocabulary" : "Resource"}`}
        parent={{
          label: isVocabulary ? "Vocabulary" : "Resource files",
          href: backPath,
        }}
      />

      {isVocabulary ? (
        <form onSubmit={saveVocabulary} className="max-w-3xl">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Word
              <input
                required
                className={field}
                value={vocabulary.word}
                onChange={event =>
                  setVocabulary(current => ({
                    ...current,
                    word: event.target.value,
                  }))
                }
              />
            </label>
            <label className="text-sm font-medium">
              Part of speech
              <input
                required
                className={field}
                value={vocabulary.partOfSpeech}
                onChange={event =>
                  setVocabulary(current => ({
                    ...current,
                    partOfSpeech: event.target.value,
                  }))
                }
                placeholder="noun, verb, adjective…"
              />
            </label>
            <label className="text-sm font-medium">
              Topic
              <input
                required
                className={field}
                value={vocabulary.topic}
                onChange={event =>
                  setVocabulary(current => ({
                    ...current,
                    topic: event.target.value,
                  }))
                }
              />
            </label>
            <label className="text-sm font-medium">
              Display order
              <input
                type="number"
                className={field}
                value={vocabulary.sortOrder}
                onChange={event =>
                  setVocabulary(current => ({
                    ...current,
                    sortOrder: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Meaning
              <textarea
                required
                className={`${field} min-h-24`}
                value={vocabulary.meaning}
                onChange={event =>
                  setVocabulary(current => ({
                    ...current,
                    meaning: event.target.value,
                  }))
                }
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Example sentence
              <textarea
                required
                className={`${field} min-h-24`}
                value={vocabulary.example}
                onChange={event =>
                  setVocabulary(current => ({
                    ...current,
                    example: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={vocabulary.isActive}
                onChange={event =>
                  setVocabulary(current => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Visible to students
            </label>
          </div>
          <FormActions
            pending={pending}
            editing={editing}
            backPath={backPath}
          />
        </form>
      ) : (
        <form onSubmit={saveResource} className="max-w-3xl">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Title
              <input
                required
                className={field}
                value={resource.title}
                onChange={event =>
                  setResource(current => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label className="text-sm font-medium">
              Available to
              <AdminSelect
                value={resource.batchId ?? ""}
                onChange={event =>
                  setResource(current => ({
                    ...current,
                    batchId: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
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
                className={`${field} min-h-24`}
                value={resource.description}
                onChange={event =>
                  setResource(current => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <div className="border-y border-dashed border-[var(--admin-border)] py-5 sm:col-span-2">
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
                <span className="text-sm text-[var(--admin-body)]">
                  Maximum file size: 25MB
                </span>
              </div>
              {resource.fileName && (
                <p className="mt-3 flex items-center gap-2 text-sm">
                  <File className="h-4 w-4" /> {resource.fileName}
                </p>
              )}
            </div>
            <label className="text-sm font-medium sm:col-span-2">
              Or external URL
              <input
                type="url"
                className={field}
                value={resource.fileUrl}
                onChange={event =>
                  setResource(current => ({
                    ...current,
                    fileUrl: event.target.value,
                    fileName: "",
                    mimeType: "",
                    fileSize: null,
                  }))
                }
                placeholder="https://…"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={resource.isActive}
                onChange={event =>
                  setResource(current => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Visible to students
            </label>
            <label className="flex items-center gap-3 text-sm">
              Display order
              <input
                type="number"
                className="h-10 w-24 border border-[var(--admin-border)] px-3"
                value={resource.sortOrder}
                onChange={event =>
                  setResource(current => ({
                    ...current,
                    sortOrder: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>
          <FormActions
            pending={pending}
            editing={editing}
            backPath={backPath}
          />
        </form>
      )}
    </div>
  );
}

function FormActions({
  pending,
  editing,
  backPath,
}: {
  pending: boolean;
  editing: boolean;
  backPath: string;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="mt-8 flex gap-3 border-t border-[var(--admin-border)] pt-6">
      <button
        type="submit"
        disabled={pending}
        className="admin-button admin-button-primary"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {editing ? "Save changes" : "Create"}
      </button>
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="admin-button admin-button-secondary"
      >
        Cancel
      </button>
    </div>
  );
}
