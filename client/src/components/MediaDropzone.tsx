"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/** The media uploader: a dashed drop area that also opens the file browser when clicked. */
export default function MediaDropzone({
  accept,
  uploading,
  onFile,
  noun = "image",
  hint,
  className,
}: {
  accept: string;
  uploading: boolean;
  onFile: (file: File) => void;
  /** What is uploaded, e.g. "image" or "audio file". */
  noun?: string;
  hint: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed px-6 text-center transition-colors",
          dragging
            ? "border-[#c76f42] bg-[#c76f42]/5"
            : "border-[#d5d7d9] bg-transparent hover:border-[#c76f42]",
          className
        )}
      >
        {uploading ? (
          <Loader2 className="mb-5 h-7 w-7 animate-spin text-[#c76f42]" />
        ) : (
          <Upload className="mb-5 h-7 w-7 stroke-[1.5] text-[#c76f42]" />
        )}
        <strong className="text-[16px] font-semibold text-[#252a30] sm:text-[17px]">
          {uploading
            ? `Uploading ${noun}…`
            : `Drop ${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun} here or browse`}
        </strong>
        <span className="mt-2 text-sm text-[#69737e] sm:text-[15px]">
          {hint}
        </span>
      </button>
    </>
  );
}
