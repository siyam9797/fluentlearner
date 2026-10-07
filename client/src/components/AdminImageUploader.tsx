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
  /** Preview on a dark background, for a white logo. */
  dark?: boolean;
  /** "contain" shows the whole image (logos); "cover" fills the box. */
  fit?: "cover" | "contain";
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
  dark = false,
  fit = "cover",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="relative flex min-h-[184px] items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[#d8d8d8] bg-transparent px-5 py-7">
      {value ? (
        <>
          {/* Click the image to replace it (media library, which can also upload). */}
          <button
            type="button"
            onClick={() =>
              onMediaSelect ? setPickerOpen(true) : inputRef.current?.click()
            }
            disabled={uploading}
            title={`Replace ${label}`}
            aria-label={`Replace ${label}`}
            className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-[var(--radius-card)] transition-opacity hover:opacity-80 disabled:opacity-50 ${dark ? "bg-[#1f1f1f]" : ""} ${fit === "contain" ? "p-6" : ""}`}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#c76f42]" />
            ) : (
              <img
                src={value}
                alt={`${label} preview`}
                className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
              />
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center bg-white text-red-600 shadow-sm hover:bg-red-50"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() =>
            onMediaSelect ? setPickerOpen(true) : inputRef.current?.click()
          }
          disabled={uploading}
          className="flex flex-col items-center text-center"
        >
          {uploading ? (
            <Loader2 className="mb-5 h-6 w-6 animate-spin text-[#c76f42]" />
          ) : (
            <CloudUpload className="mb-5 h-6 w-6 stroke-[1.4] text-[#c76f42]" />
          )}
          <span className="text-sm font-semibold text-[#30363d]">
            {uploading ? "Uploading image…" : "Choose from media or upload"}
          </span>
          <span className="mt-2 text-xs text-[#747d87]">
            JPG, PNG, WebP, GIF or SVG · {maxSizeLabel}
          </span>
          {recommendation && (
            <span className="mt-2 text-xs text-[#747d87]">
              Recommended size: {recommendation}
            </span>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      {pickerOpen && onMediaSelect && (
        <MediaPicker
          label={label}
          onSelect={url => {
            onMediaSelect(url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
