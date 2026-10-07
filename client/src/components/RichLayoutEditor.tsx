"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  EditorContent,
  Node,
  mergeAttributes,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold,
  Columns3,
  Heading2,
  Heading3,
  IndentDecrease,
  ImageIcon,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  PanelTop,
  Rows3,
  Table2,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminSelect from "@/components/AdminSelect";
import MediaPicker from "@/components/MediaPicker";
import {
  isHtmlLayout,
  layoutBoxNumbers,
  legacyLayoutToHtml,
} from "@/lib/listeningLayout";

type QuestionOption = { number: number; label: string };

/** Inline, uneditable answer box. Stored as <span data-answer-box>[[n]]</span>. */
const AnswerBox = Node.create({
  name: "answerBox",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return { number: { default: 1 } };
  },
  parseHTML() {
    return [
      {
        tag: "span[data-answer-box]",
        getAttrs: element => {
          const match = /\d+/.exec(element.textContent ?? "");
          return match ? { number: Number(match[0]) } : false;
        },
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-answer-box": "" }),
      `[[${node.attrs.number}]]`,
    ];
  },
  renderText({ node }) {
    return `[[${node.attrs.number}]]`;
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.className = "rich-answer-box";
      dom.contentEditable = "false";
      dom.textContent = String(node.attrs.number);
      return { dom };
    };
  },
});

/** A block image, e.g. a diagram inside a reading passage. */
const Image = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
});

const toHtml = (value: string) =>
  !value || isHtmlLayout(value) ? value : legacyLayoutToHtml(value);

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-[calc(var(--radius-control)-2px)] text-[var(--admin-heading)] transition-colors hover:bg-[var(--admin-card)] disabled:opacity-30",
        active && "bg-[var(--admin-card)] text-[var(--admin-primary)]"
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  questions,
  canCreate,
  onCreate,
  images,
  insertLabel,
}: {
  editor: Editor;
  questions: QuestionOption[];
  canCreate: boolean;
  onCreate?: () => number;
  images?: boolean;
  insertLabel: string;
}) {
  const [pickingImage, setPickingImage] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
      canIndent: current.can().sinkListItem("listItem"),
      table: current.isActive("table"),
      header: current.isActive("tableHeader"),
    }),
  });
  const chain = () => editor.chain().focus();
  const insertBox = (number: number) =>
    chain().insertContent({ type: "answerBox", attrs: { number } }).run();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--admin-border)] p-1.5">
      <ToolButton
        label="Bold"
        active={state.bold}
        onClick={() => chain().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Italic"
        active={state.italic}
        onClick={() => chain().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Underline"
        active={state.underline}
        onClick={() => chain().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-[var(--admin-border)]" />
      <ToolButton
        label="Heading"
        active={state.h2}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Subheading"
        active={state.h3}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Bulleted list"
        active={state.bullet}
        onClick={() => chain().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={state.ordered}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      {(state.bullet || state.ordered) && (
        <>
          <ToolButton
            label="Indent (Tab)"
            disabled={!state.canIndent}
            onClick={() => chain().sinkListItem("listItem").run()}
          >
            <IndentIncrease className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="Outdent (Shift+Tab)"
            onClick={() => chain().liftListItem("listItem").run()}
          >
            <IndentDecrease className="h-4 w-4" />
          </ToolButton>
        </>
      )}
      <span className="mx-1 h-5 w-px bg-[var(--admin-border)]" />
      <ToolButton
        label="Insert table"
        disabled={state.table}
        onClick={() =>
          chain().insertTable({ rows: 3, cols: 2, withHeaderRow: false }).run()
        }
      >
        <Table2 className="h-4 w-4" />
      </ToolButton>
      {state.table && (
        <>
          <ToolButton
            label="Header row"
            active={state.header}
            onClick={() => chain().toggleHeaderRow().run()}
          >
            <PanelTop className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="Add row below"
            onClick={() => chain().addRowAfter().run()}
          >
            <Rows3 className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="Add column right"
            onClick={() => chain().addColumnAfter().run()}
          >
            <Columns3 className="h-4 w-4" />
          </ToolButton>
          <AdminSelect
            value=""
            size="sm"
            className="w-auto min-w-[130px]"
            aria-label="Remove from table"
            onChange={event => {
              if (event.target.value === "row") chain().deleteRow().run();
              if (event.target.value === "column") chain().deleteColumn().run();
              if (event.target.value === "table") chain().deleteTable().run();
            }}
          >
            <option value="">Remove…</option>
            <option value="row">This row</option>
            <option value="column">This column</option>
            <option value="table">Whole table</option>
          </AdminSelect>
        </>
      )}
      {images && (
        <>
          <ToolButton
            label="Insert image"
            onClick={() => setPickingImage(true)}
          >
            <ImageIcon className="h-4 w-4" />
          </ToolButton>
          {pickingImage && (
            <MediaPicker
              label="Image"
              onSelect={src => {
                setPickingImage(false);
                chain().insertContent({ type: "image", attrs: { src } }).run();
              }}
              onClose={() => setPickingImage(false)}
            />
          )}
        </>
      )}
      {(onCreate || questions.length > 0) && (
        <div className="ml-auto">
          <AdminSelect
            value=""
            size="sm"
            className="w-auto min-w-[170px]"
            aria-label="Insert answer box"
            onChange={event => {
              if (event.target.value === "new" && onCreate)
                insertBox(onCreate());
              else if (event.target.value)
                insertBox(Number(event.target.value));
            }}
          >
            <option value="">{insertLabel}</option>
            {canCreate && onCreate && (
              <option value="new">New answer box</option>
            )}
            {questions.map(question => (
              <option key={question.number} value={question.number}>
                Q{question.number} · {question.label}
              </option>
            ))}
          </AdminSelect>
        </div>
      )}
    </div>
  );
}

export default function RichLayoutEditor({
  value,
  onChange,
  questions = [],
  canCreate = false,
  onCreate,
  images = false,
  minHeightClass = "min-h-[220px]",
  insertLabel = "+ Answer box",
}: {
  value: string;
  onChange: (value: string) => void;
  questions?: QuestionOption[];
  canCreate?: boolean;
  /** Creates a question for a new answer box. Without it, only `questions` can be inserted. */
  onCreate?: () => number;
  /** Label of the insert menu, e.g. "+ Heading box" in a passage. */
  insertLabel?: string;
  /** Adds an image button (upload or media library). */
  images?: boolean;
  /** Minimum height of the writing area. */
  minHeightClass?: string;
}) {
  // The last HTML this editor emitted, so outside edits (e.g. renumbering) can be told apart.
  const emitted = useRef(value);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        link: false,
      }),
      TableKit.configure({ table: { resizable: false } }),
      AnswerBox,
      Image,
    ],
    content: toHtml(value),
    editorProps: {
      attributes: {
        class: cn("rich-layout px-4 py-3 outline-none", minHeightClass),
      },
    },
    onUpdate: ({ editor: current }) => {
      // An image alone still counts as content.
      const html =
        current.isEmpty && !current.getHTML().includes("<img")
          ? ""
          : current.getHTML();
      emitted.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor || value === emitted.current) return;
    const previous = emitted.current;
    emitted.current = value;
    // Only box numbers changed (renumbering): update the boxes in place, so the cursor
    // stays put and undo still steps through the admin's own edits.
    const withoutNumbers = (html: string) =>
      html.replace(/\[\[\d+\]\]/g, "[[]]");
    if (
      isHtmlLayout(value) &&
      withoutNumbers(previous) === withoutNumbers(value)
    ) {
      const numbers = layoutBoxNumbers(value);
      const { tr } = editor.state;
      let index = 0;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== "answerBox") return;
        const number = numbers[index++];
        if (number !== undefined && node.attrs.number !== number)
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, number });
      });
      if (tr.docChanged) {
        tr.setMeta("addToHistory", false);
        editor.view.dispatch(tr);
      }
      return;
    }
    editor.commands.setContent(toHtml(value), { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--admin-border)] focus-within:border-[var(--admin-primary)]">
      {editor && (
        <Toolbar
          editor={editor}
          questions={questions}
          canCreate={canCreate}
          onCreate={onCreate}
          images={images}
          insertLabel={insertLabel}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
