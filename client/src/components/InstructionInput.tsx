"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Node as PmNode } from "@tiptap/pm/model";
import { Bold } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Instructions are stored as plain text with **bold** runs, e.g.
 * "Write **NO MORE THAN TWO WORDS**". The admin edits them as rich text.
 */

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** "**bold** text\nnext line" → editor HTML, one paragraph per line. */
function toHtml(text: string) {
  return text
    .split(/\r?\n/)
    .map(
      line =>
        `<p>${escapeHtml(line).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</p>`
    )
    .join("");
}

/** Editor document → plain text with **bold** runs. */
function toText(doc: PmNode) {
  const lines: string[] = [];
  doc.forEach(paragraph => {
    let line = "";
    paragraph.forEach(node => {
      if (node.type.name === "hardBreak") {
        line += "\n";
        return;
      }
      const text = node.text ?? "";
      const bold = node.marks.some(mark => mark.type.name === "bold");
      if (!bold || !text.trim()) {
        line += text;
        return;
      }
      // Keep surrounding spaces outside the markers, so "**word **" never happens.
      const [, before, inner, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)!;
      line += `${before}**${inner}**${after}`;
    });
    lines.push(line);
  });
  return lines.join("\n").replace(/\n+$/, "");
}

function BoldButton({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => current.isActive("bold"),
  });
  return (
    <button
      type="button"
      // Keep the editor's selection when the button is pressed.
      onMouseDown={event => event.preventDefault()}
      onClick={() => editor.chain().focus().toggleBold().run()}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-[#30363d] transition-colors hover:bg-black/5",
        active && "bg-black/5 text-[var(--admin-primary)]"
      )}
      aria-label="Bold (Ctrl+B)"
      aria-pressed={active}
      title="Bold (Ctrl+B)"
    >
      <Bold className="h-4 w-4" />
    </button>
  );
}

export default function InstructionInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  // The last text this editor emitted, so outside changes can be told apart.
  const emitted = useRef(value);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        dropcursor: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        link: false,
        listItem: false,
        listKeymap: false,
        orderedList: false,
        strike: false,
        underline: false,
        trailingNode: false,
      }),
    ],
    content: toHtml(value),
    editorProps: {
      attributes: {
        class:
          "min-h-[64px] px-3 py-2.5 text-sm leading-6 text-[var(--admin-heading)] outline-none [&_p]:min-h-6 [&_strong]:font-bold",
      },
    },
    onUpdate: ({ editor: current }) => {
      const text = toText(current.state.doc);
      emitted.current = text;
      onChange(text);
    },
  });

  useEffect(() => {
    if (!editor || value === emitted.current) return;
    emitted.current = value;
    editor.commands.setContent(toHtml(value), { emitUpdate: false });
  }, [editor, value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-control)] border border-[var(--admin-border)] transition-colors focus-within:border-[var(--admin-primary)] hover:border-[var(--admin-body)]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-1.5 py-1">
        {editor && <BoldButton editor={editor} />}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

/** Renders instruction text, turning **bold** runs into <strong>. */
export function formatInstruction(
  text: string | null | undefined
): ReactNode[] {
  return (text ?? "").split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={index} className="font-bold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}
