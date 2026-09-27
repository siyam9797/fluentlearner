"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  ExternalLink,
  File,
  FileAudio,
  Film,
  Loader2,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMedia() {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { data: files, isLoading } = trpc.media.list.useQuery();
  const upload = trpc.media.upload.useMutation({
    onSuccess: async () => {
      await utils.media.list.invalidate();
      toast.success("Image uploaded");
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
    if (!file.type.startsWith("image/"))
      return toast.error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Images must be 5 MB or smaller.");
    await upload.mutateAsync({
      base64: await toBase64(file),
      filename: file.name,
      contentType: file.type,
    });
    if (inputRef.current) inputRef.current.value = "";
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
      <AdminPageHeader title="Media" />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        hidden
        onChange={event => uploadFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        onDragOver={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          uploadFile(event.dataTransfer.files?.[0]);
        }}
        className={`mb-8 flex min-h-[230px] w-full flex-col items-center justify-center border border-dashed px-6 text-center transition-colors sm:mb-10 sm:min-h-[280px] ${dragging ? "border-[#c76f42] bg-[#c76f42]/5" : "border-[#d5d7d9] bg-transparent hover:border-[#c76f42]"}`}
      >
        {upload.isPending ? (
          <Loader2 className="mb-7 h-7 w-7 animate-spin text-[#c76f42]" />
        ) : (
          <Upload className="mb-7 h-7 w-7 stroke-[1.5] text-[#c76f42]" />
        )}
        <strong className="text-[16px] font-semibold text-[#252a30] sm:text-[17px]">
          {upload.isPending
            ? "Uploading image…"
            : "Drop an image here or browse"}
        </strong>
        <span className="mt-2 text-sm text-[#69737e] sm:text-[15px]">
          JPG, PNG, WebP, GIF or AVIF · Max 5 MB
        </span>
      </button>

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#c76f42]" />
        </div>
      ) : files?.length ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
          {files.map(file => (
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
                  <span className="absolute left-3 top-3 bg-[#1976d2] px-2.5 py-1.5 text-xs font-medium text-white sm:text-sm">
                    In Use
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
                    className="grid h-11 w-11 place-items-center bg-white text-[#252a30] shadow-sm hover:bg-[#fafafa]"
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
