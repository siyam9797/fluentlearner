"use client";

import { useMemo, useState } from "react";
import { ImageIcon, Loader2, Music2, Search, X } from "lucide-react";
import MediaDropzone from "./MediaDropzone";
import { trpc } from "@/lib/trpc";

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function MediaPicker({ label, kind = "image", onSelect, onClose }: { label: string; kind?: "image" | "audio"; onSelect: (url: string) => void; onClose: () => void }) {
  const noun = kind === "audio" ? "audio file" : "image";
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const { data: files, isLoading } = trpc.media.list.useQuery();
  const upload = trpc.media.upload.useMutation({
    onSuccess: async result => {
      await utils.media.list.invalidate();
      onSelect(result.url);
    },
  });
  const images = useMemo(() => (files || []).filter(file => file.kind === kind && file.name.toLowerCase().includes(search.toLowerCase())), [files, kind, search]);

  const uploadFile = async (file?: File) => {
    if (!file) return;
    upload.mutate({ base64: await toBase64(file), filename: file.name, contentType: file.type || "application/octet-stream" });
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={`Select ${label}`} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div><h2 className="font-display text-xl font-bold">Select {label.toLowerCase()}</h2><p className="mt-0.5 text-xs text-gray-500">Choose an existing {noun} or upload a new one.</p></div>
        <button type="button" onClick={onClose} className="rounded-md p-2 text-gray-500 hover:bg-gray-100" aria-label="Close media picker"><X className="h-5 w-5" /></button>
      </header>
      <div className="flex items-center gap-3 px-5 pt-4">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search media…" className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--admin-border)] bg-transparent pl-9 pr-3 text-sm outline-none transition-colors hover:border-[var(--admin-body)] focus:border-[var(--admin-primary)]" /></label>
      </div>
      <div className="px-5 pt-3">
        <MediaDropzone accept={`${kind}/*`} uploading={upload.isPending} onFile={uploadFile} noun={noun} hint={kind === "audio" ? "MP3, M4A, WAV or OGG · Max 60 MB" : "JPG, PNG, WebP, GIF or AVIF · Max 10 MB"} className="min-h-[150px]" />
      </div>
      {upload.error && <p className="mx-4 mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{upload.error.message}</p>}
      <div className="min-h-52 flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? <div className="grid h-48 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#c76f42]" /></div>
          : images.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{images.map(file => <button type="button" key={file.key} onClick={() => onSelect(file.url)} className="group overflow-hidden rounded-lg border border-gray-200 bg-[#f8f7ec] text-left hover:border-[#c76f42] focus:outline-none focus:ring-2 focus:ring-[#c76f42]/30">{kind === "audio" ? <span className="grid aspect-square w-full place-items-center"><Music2 className="h-8 w-8 stroke-[1.4] text-[#c76f42]" /></span> : <img src={file.url} alt={file.name} className="aspect-square w-full object-cover" />}<span className="block truncate px-2 py-2 text-xs text-gray-600">{file.name}</span></button>)}</div>
          : <div className="grid h-48 place-items-center text-center text-gray-500"><div>{kind === "audio" ? <Music2 className="mx-auto mb-3 h-8 w-8 stroke-1" /> : <ImageIcon className="mx-auto mb-3 h-8 w-8 stroke-1" />}<p className="text-sm">No matching {noun}s.</p></div></div>}
      </div>
    </div>
  </div>;
}
