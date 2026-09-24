"use client";

import { ChangeEvent, useRef, useState } from "react";
import { CloudUpload, Loader2, Trash2 } from "lucide-react";
import MediaPicker from "./MediaPicker";

type Props = {
  value?: string;
  label: string;
  recommendation?: string;
  maxSizeLabel?: string;
  uploading?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onMediaSelect?: (url: string) => void;
};

export default function AdminImageUploader({
  value,
  label,
  recommendation,
  maxSizeLabel = "Max 5 MB",
  uploading = false,
  onChange,
  onRemove,
  onMediaSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  return <div className="relative flex min-h-[184px] items-center justify-center rounded-lg border border-dashed border-[#d8d8d8] bg-transparent px-5 py-7">
    {value ? <div className="flex w-full flex-col items-center gap-4">
      <img src={value} alt={`${label} preview`} className="max-h-32 max-w-[80%] object-contain" />
      <button type="button" onClick={onRemove} className="absolute right-3 top-3 grid h-8 w-8 place-items-center bg-white text-red-600 shadow-sm hover:bg-red-50" aria-label={`Remove ${label}`}><Trash2 className="h-4 w-4" /></button>
      <div className="flex gap-3"><button type="button" onClick={() => onMediaSelect ? setPickerOpen(true) : inputRef.current?.click()} disabled={uploading} className="text-xs font-semibold text-[#c76f42] hover:underline">Replace image</button><button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-xs font-semibold text-gray-500 hover:underline">Upload new</button></div>
    </div> : <button type="button" onClick={() => onMediaSelect ? setPickerOpen(true) : inputRef.current?.click()} disabled={uploading} className="flex flex-col items-center text-center">
      {uploading ? <Loader2 className="mb-5 h-6 w-6 animate-spin text-[#c76f42]" /> : <CloudUpload className="mb-5 h-6 w-6 stroke-[1.4] text-[#c76f42]" />}
      <span className="text-sm font-semibold text-[#30363d]">{uploading ? "Uploading image…" : "Choose from media or upload"}</span>
      <span className="mt-2 text-xs text-[#747d87]">JPG, PNG, WebP, GIF or SVG · {maxSizeLabel}</span>
      {recommendation && <span className="mt-2 text-xs text-[#747d87]">Recommended size: {recommendation}</span>}
    </button>}
    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    {pickerOpen && onMediaSelect && <MediaPicker label={label} onSelect={url => { onMediaSelect(url); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />}
  </div>;
}
