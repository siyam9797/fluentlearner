"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  ExternalLink,
  File,
  FileAudio,
  Film,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import MediaDropzone from "@/components/MediaDropzone";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminFilterDrawer, {
  AdminFilterButton,
  passesFilter,
  type FilterGroup,
  type FilterSelection,
} from "@/components/AdminFilterDrawer";
import { trpc } from "@/lib/trpc";

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const MB = 1024 * 1024;

/** Upload types the server accepts, by extension (browsers leave file.type empty for some). */
const TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  csv: "text/csv",
};
const ACCEPT = Object.keys(TYPES_BY_EXTENSION)
  .map(extension => `.${extension}`)
  .join(",");
const SERVER_TYPES = new Set([
  ...Object.values(TYPES_BY_EXTENSION),
  "audio/x-wav",
  "audio/x-m4a",
  "audio/webm",
]);

/** Same size limits as the server's media upload. */
const UPLOAD_LIMITS = {
  image: { bytes: 10 * MB, label: "Images" },
  video: { bytes: 64 * MB, label: "Videos" },
  audio: { bytes: 60 * MB, label: "Audio files" },
  document: { bytes: 25 * MB, label: "Documents" },
};

function contentTypeOf(file: File) {
  if (SERVER_TYPES.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPES_BY_EXTENSION[extension] ?? null;
}

function kindOf(contentType: string): keyof typeof UPLOAD_LIMITS {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "document";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMedia() {
  const utils = trpc.useUtils();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { data: files, isLoading } = trpc.media.list.useQuery();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterSelection>({
    kind: [],
    usage: [],
  });
  const allFiles = files ?? [];
  const usageOf = (file: (typeof allFiles)[number]) =>
    file.inUse ? "used" : "unused";
  const visibleFiles = allFiles.filter(
    file =>
      passesFilter(filters, "kind", file.kind) &&
      passesFilter(filters, "usage", usageOf(file))
  );
  const filterGroups: FilterGroup[] = [
    {
      key: "kind",
      title: "Type",
      options: [
        ["image", "Images"],
        ["video", "Videos"],
        ["audio", "Audio"],
        ["document", "Documents"],
      ].map(([value, label]) => ({
        value,
        label,
        count: allFiles.filter(file => file.kind === value).length,
      })),
    },
    {
      key: "usage",
      title: "Usage",
      options: [
        ["used", "In use"],
        ["unused", "Not in use"],
      ].map(([value, label]) => ({
        value,
        label,
        count: allFiles.filter(file => usageOf(file) === value).length,
      })),
    },
  ];
  const upload = trpc.media.upload.useMutation({
    onSuccess: async () => {
      await utils.media.list.invalidate();
      toast.success("File uploaded");
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.media.delete.useMutation({
    onSuccess: async () => {
      await utils.media.list.invalidate();
      toast.success("File deleted");
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !(event.target as HTMLElement).closest("[data-media-menu]")
      )
        setOpenMenu(null);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, []);

  const uploadFile = async (file?: File) => {
    if (!file) return;
    const contentType = contentTypeOf(file);
    if (!contentType) return toast.error("This file type isn't supported.");
    const kind = kindOf(contentType);
    if (file.size > UPLOAD_LIMITS[kind].bytes)
      return toast.error(
        `${UPLOAD_LIMITS[kind].label} must be ${UPLOAD_LIMITS[kind].bytes / MB} MB or smaller.`
      );
    await upload.mutateAsync({
      base64: await toBase64(file),
      filename: file.name,
      contentType,
    });
  };

  const copyPath = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setOpenMenu(null);
    toast.success("Media path copied");
  };

  const deleteFile = (file: NonNullable<typeof files>[number]) => {
    setOpenMenu(null);
    if (file.inUse) return toast.error("This file is currently in use.");
    if (confirm(`Delete “${file.name}”? This cannot be undone.`))
      remove.mutate({ key: file.key });
  };

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Media"
        action={
          <AdminFilterButton
            label="Filter media"
            selection={filters}
            onClick={() => setFilterOpen(true)}
          />
        }
      />
      {filterOpen && (
        <AdminFilterDrawer
          title="Filter media"
          groups={filterGroups}
          selection={filters}
          onChange={setFilters}
          onClose={() => setFilterOpen(false)}
          resultCount={visibleFiles.length}
        />
      )}

      <MediaDropzone
        accept={ACCEPT}
        uploading={upload.isPending}
        onFile={uploadFile}
        noun="file"
        hint="Images up to 10 MB · audio up to 60 MB · video up to 64 MB · PDF, Word, PowerPoint, Excel, TXT or CSV up to 25 MB"
        className="mb-8 min-h-[230px] sm:mb-10 sm:min-h-[280px]"
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#c76f42]" />
        </div>
      ) : allFiles.length > 0 && visibleFiles.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#69737e]">
          No files match these filters.
        </div>
      ) : visibleFiles.length ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
          {visibleFiles.map(file => (
            <article key={file.key}>
              <div className="relative grid aspect-square place-items-center overflow-visible bg-[#f1f1f1]">
                <div className="absolute inset-0 overflow-hidden">
                  {file.kind === "image" ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-full w-full object-contain"
                    />
                  ) : file.kind === "video" ? (
                    <video
                      src={file.url}
                      className="h-full w-full object-cover"
                      preload="metadata"
                    />
                  ) : file.kind === "audio" ? (
                    <FileAudio className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 stroke-1 text-gray-500" />
                  ) : (
                    <File className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 stroke-1 text-gray-500" />
                  )}
                </div>
                {file.inUse && (
                  <span className="admin-status-label info absolute left-3 top-3">
                    In use
                  </span>
                )}
                <div className="absolute right-3 top-3 z-10" data-media-menu>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu(current =>
                        current === file.key ? null : file.key
                      )
                    }
                    className="rounded-[var(--radius-control)] grid h-11 w-11 place-items-center bg-white text-[#252a30] shadow-sm hover:bg-[#fafafa]"
                    aria-label={`Actions for ${file.name}`}
                    aria-expanded={openMenu === file.key}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {openMenu === file.key && (
                    <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-40 rounded-[var(--radius-card)] border border-[var(--admin-border)] bg-[var(--admin-background)] p-1.5 text-left shadow-[0_16px_40px_rgba(20,25,30,0.14)]">
                      <button
                        type="button"
                        onClick={() => copyPath(file.url)}
                        className="flex h-9 w-full items-center gap-2 px-2.5 text-xs text-[#30363d] hover:bg-[#f5f5f5]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy path
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpenMenu(null)}
                        className="flex h-9 w-full items-center gap-2 px-2.5 text-xs text-[#30363d] hover:bg-[#f5f5f5]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open file
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteFile(file)}
                        disabled={file.inUse || remove.isPending}
                        title={
                          file.inUse
                            ? "This file is referenced elsewhere"
                            : undefined
                        }
                        className="flex h-9 w-full items-center gap-2 px-2.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-3">
                <p
                  className="truncate text-sm font-semibold text-[#252a30]"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-[#69737e]">
                  {formatSize(file.size)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-52 place-items-center text-center text-[#69737e]">
          <div>
            <Film className="mx-auto mb-3 h-8 w-8 stroke-1" />
            <p className="text-sm">No uploaded files yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
