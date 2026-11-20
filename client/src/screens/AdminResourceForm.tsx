import { useEffect, useState, type FormEvent } from "react";
import { Check, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useLocation } from "@/lib/router";
import { trpc } from "@/lib/trpc";
import AdminSelect from "@/components/AdminSelect";
import { parseDriveLink } from "@shared/googleDrive";

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
  /** The file link the resource had when the form loaded (editing only). */
  const [savedFileUrl, setSavedFileUrl] = useState("");
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

  useEffect(() => {
    if (kind !== "resource" || !editId) return;
    const row = resources.find(item => item.resource.id === editId);
    if (!row) return;
    setSavedFileUrl(row.resource.fileUrl);
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

  const driveLink = parseDriveLink(resource.fileUrl);
  /** Resources from before Google Drive keep their uploaded file until a Drive link replaces it. */
  /** The portal can pass on a file, but not a folder or a form. */
  const unsupported =
    driveLink?.kind === "folder" || driveLink?.kind === "forms";
  const legacyFile =
    editing && !driveLink && resource.fileUrl === savedFileUrl;

  const saveResource = (event: FormEvent) => {
    event.preventDefault();
    if (!resource.title.trim()) {
      toast.error("Give the resource a title");
      return;
    }
    if (!driveLink && !legacyFile) {
      toast.error("Paste the file's Google Drive share link");
      return;
    }
    if (unsupported) {
      toast.error("Link a Drive file, not a folder or form");
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
            <label className="text-sm font-medium sm:col-span-2">
              Google Drive link
              <input
                required
                type="url"
                className={field}
                value={resource.fileUrl}
                onChange={event =>
                  setResource(current => ({
                    ...current,
                    fileUrl: event.target.value,
                  }))
                }
                placeholder="https://drive.google.com/file/d/…"
              />
              <span className="mt-2 flex items-center gap-2 text-xs font-normal leading-5 text-[var(--admin-body)]">
                {driveLink && unsupported ? (
                  <span className="text-[var(--admin-danger,#b91c1c)]">
                    A {driveLink.label} can’t be shared through the portal. Link
                    the file itself.
                  </span>
                ) : driveLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--admin-success)]" />
                    <span>
                      {driveLink.label}
                      {editId && resource.fileUrl === savedFileUrl && (
                        <>
                          {" · "}
                          <a
                            href={`/api/resources/${editId}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--admin-primary)] hover:underline"
                          >
                            Open as students get it
                          </a>
                        </>
                      )}
                    </span>
                  </>
                ) : legacyFile ? (
                  <>
                    <File className="h-3.5 w-3.5 shrink-0" />
                    Uploaded file{resource.fileName ? ` ${resource.fileName}` : ""}.
                    Paste a Google Drive link to replace it.
                  </>
                ) : resource.fileUrl.trim() ? (
                  <span className="text-[var(--admin-danger,#b91c1c)]">
                    This isn’t a Google Drive link.
                  </span>
                ) : (
                  "Students never see this link: the portal fetches the file and sends it to them. In Drive, set the file's General access to “Anyone with the link” so the portal can fetch it."
                )}
              </span>
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
