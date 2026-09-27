"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Code2,
  Heading3,
  Pilcrow,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminSelect from "@/components/AdminSelect";
import {
  LISTENING_QUESTION_TYPES,
  LISTENING_TYPE_INSTRUCTIONS,
  QUESTION_TYPE_LABELS,
  choiceSelectionCount,
  isCompletionType,
  type MockQuestionType,
} from "@shared/mock";

type QuestionOption = { number: number; label: string };
type TextBlock =
  { type: "heading"; text: string } | { type: "text"; text: string };
type TableBlock = { type: "table"; rows: string[][] };
type LayoutBlock = TextBlock | TableBlock;

type Props = {
  value: string;
  onChange: (value: string) => void;
  questions: QuestionOption[];
  existingQuestionCount: number;
  onCreateQuestions: (
    type: MockQuestionType,
    count: number,
    instruction: string
  ) => number[];
  labelingMedia?: ReactNode;
};

const LABELING_TYPES: MockQuestionType[] = [
  "map_labeling",
  "plan_labeling",
  "visual_labeling",
  "diagram_labeling",
];

const decodeCell = (value: string) =>
  value.replace(/^\*\*(.*)\*\*$/, "$1").replace(/<br\s*\/?\s*>/gi, "\n");

function parseLayout(value: string): LayoutBlock[] {
  const lines = value.split(/\r?\n/);
  const blocks: LayoutBlock[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", text: line.slice(3) });
      index += 1;
      continue;
    }
    if (line.includes("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|")) {
        const pieces = lines[index].split("|");
        if (!pieces[0].trim()) pieces.shift();
        if (!pieces.at(-1)?.trim()) pieces.pop();
        rows.push(pieces.map(piece => decodeCell(piece.trim())));
        index += 1;
      }
      blocks.push({ type: "table", rows });
      continue;
    }
    blocks.push({ type: "text", text: line });
    index += 1;
  }
  return blocks;
}

function serializeLayout(blocks: LayoutBlock[]) {
  return blocks
    .map(block => {
      if (block.type === "heading") return `## ${block.text}`;
      if (block.type === "text") return block.text;
      return block.rows
        .map((row, rowIndex) => {
          const cells = row.map(cell => {
            const encoded = cell.replace(/\n/g, "<br>");
            return rowIndex === 0 && encoded ? `**${encoded}**` : encoded;
          });
          return `| ${cells.join(" | ")} |`;
        })
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function AnswerInsert({
  questions,
  onInsert,
  onCreate,
  canCreate = true,
}: {
  questions: QuestionOption[];
  onInsert: (number: number) => void;
  onCreate: () => number;
  canCreate?: boolean;
}) {
  return (
    <AdminSelect
      value=""
      onChange={event => {
        if (event.target.value === "new") onInsert(onCreate());
        else if (event.target.value) onInsert(Number(event.target.value));
      }}
      size="sm"
      className="w-auto min-w-[150px]"
      aria-label="Insert answer box"
    >
      <option value="">+ Answer</option>
      {canCreate && <option value="new">Create new answer box</option>}
      {questions.map(question => (
        <option key={question.number} value={question.number}>
          Q{question.number} · {question.label}
        </option>
      ))}
    </AdminSelect>
  );
}

export default function ListeningLayoutBuilder({
  value,
  onChange,
  questions,
  existingQuestionCount,
  onCreateQuestions,
  labelingMedia,
}: Props) {
  const [raw, setRaw] = useState(false);
  const [selectedType, setSelectedType] = useState<MockQuestionType | "">(
    value ? "form_completion" : ""
  );
  const [count, setCount] = useState(1);
  const [instruction, setInstruction] = useState("");
  const [editorReady, setEditorReady] = useState(Boolean(value));
  const blocks = parseLayout(value);
  const questionSpan = selectedType
    ? Math.max(1, choiceSelectionCount(selectedType))
    : 1;
  const remainingQuestions = Math.max(0, 10 - existingQuestionCount);
  const maxGroups = Math.floor(remainingQuestions / questionSpan);
  const allowedCount = Math.min(count, maxGroups);

  const commit = (next: LayoutBlock[]) => onChange(serializeLayout(next));
  const updateBlock = (index: number, block: LayoutBlock) =>
    commit(blocks.map((current, i) => (i === index ? block : current)));
  const removeBlock = (index: number) =>
    commit(blocks.filter((_, i) => i !== index));
  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  if (raw && selectedType && isCompletionType(selectedType)) {
    return (
      <div>
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={() => setRaw(false)}
          >
            <Table2 className="h-4 w-4" /> Visual builder
          </button>
        </div>
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={12}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[#30363d]">
          Question type
        </span>
        <AdminSelect
          value={selectedType}
          onChange={event => {
            const nextType = event.target.value as MockQuestionType | "";
            setSelectedType(nextType);
            setRaw(false);
            setCount(1);
            setEditorReady(false);
            setInstruction(
              nextType ? (LISTENING_TYPE_INSTRUCTIONS[nextType] ?? "") : ""
            );
          }}
        >
          <option value="">Select a question type…</option>
          {LISTENING_QUESTION_TYPES.map(type => (
            <option key={type} value={type}>
              {QUESTION_TYPE_LABELS[type]}
            </option>
          ))}
        </AdminSelect>
      </label>

      {selectedType && (
        <div className="space-y-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#30363d]">
              Instructions for this group
            </span>
            <textarea
              value={instruction}
              onChange={event => setInstruction(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[#c76f42]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
            <label>
              <span className="mb-1.5 block text-xs font-medium text-[#30363d]">
                How many? · {remainingQuestions} of 10 remaining
              </span>
              <AdminSelect
                value={allowedCount}
                onChange={event => setCount(Number(event.target.value))}
                disabled={!maxGroups}
              >
                {!maxGroups && <option value={0}>Part is full</option>}
                {Array.from({ length: maxGroups }, (_, index) => index + 1).map(
                  amount => (
                    <option key={amount} value={amount}>
                      {amount}
                    </option>
                  )
                )}
              </AdminSelect>
            </label>
            <button
              type="button"
              className="admin-button admin-button-secondary sm:justify-self-start"
              disabled={!allowedCount}
              onClick={() => {
                onCreateQuestions(selectedType, allowedCount, instruction);
                setEditorReady(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add {allowedCount}{" "}
              {allowedCount === 1 ? "question" : "questions"}
            </button>
          </div>
        </div>
      )}

      {selectedType && LABELING_TYPES.includes(selectedType) && labelingMedia}

      {!selectedType && (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--admin-border)] px-5 py-8 text-center text-sm text-[#747d87]">
          Select a question type to open its editor.
        </div>
      )}

      {editorReady && selectedType && !isCompletionType(selectedType) && (
        <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-5">
          <p className="text-sm font-semibold text-[#30363d]">
            {QUESTION_TYPE_LABELS[selectedType]}
          </p>
          <p className="mt-1 text-xs text-[#747d87]">
            After adding, each prompt, choice, correct answer and practice
            explanation editor is shown below.
          </p>
        </div>
      )}

      {editorReady && selectedType && isCompletionType(selectedType) && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#747d87]">
              Build the student layout from content blocks. The first table row
              is styled as its header.
            </p>
            <button
              type="button"
              onClick={() => setRaw(true)}
              className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#6c7580] hover:text-[#c76f42]"
            >
              <Code2 className="h-3.5 w-3.5" /> Raw layout
            </button>
          </div>

          {blocks.map((block, blockIndex) => (
            <div
              key={`${block.type}-${blockIndex}`}
              className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-3"
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#747d87]">
                {block.type === "heading" ? (
                  <Heading3 className="h-4 w-4" />
                ) : block.type === "table" ? (
                  <Table2 className="h-4 w-4" />
                ) : (
                  <Pilcrow className="h-4 w-4" />
                )}
                {block.type}
                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(blockIndex, -1)}
                    disabled={blockIndex === 0}
                    className="rounded p-1 hover:bg-black/5 disabled:opacity-25"
                    aria-label="Move block up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(blockIndex, 1)}
                    disabled={blockIndex === blocks.length - 1}
                    className="rounded p-1 hover:bg-black/5 disabled:opacity-25"
                    aria-label="Move block down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(blockIndex)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                    aria-label="Remove block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>

              {block.type === "table" ? (
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-px overflow-hidden rounded-lg bg-[var(--admin-border)]"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(block.rows[0]?.length ?? 1, 1)}, minmax(180px, 1fr))`,
                    }}
                  >
                    {block.rows.flatMap((row, rowIndex) =>
                      row.map((cell, cellIndex) => (
                        <div
                          key={`${rowIndex}-${cellIndex}`}
                          className={cn(
                            "min-w-0 bg-white p-2",
                            rowIndex === 0 && "bg-[#f5f3ec]"
                          )}
                        >
                          <textarea
                            value={cell}
                            rows={rowIndex === 0 ? 1 : 2}
                            onChange={event => {
                              const rows = block.rows.map(current => [
                                ...current,
                              ]);
                              rows[rowIndex][cellIndex] = event.target.value;
                              updateBlock(blockIndex, { type: "table", rows });
                            }}
                            className="w-full resize-y bg-transparent text-sm outline-none"
                            placeholder={
                              rowIndex === 0 ? "Column heading" : "Cell content"
                            }
                          />
                          {rowIndex > 0 && questions.length > 0 && (
                            <AnswerInsert
                              questions={questions}
                              canCreate={remainingQuestions >= questionSpan}
                              onCreate={() =>
                                onCreateQuestions(selectedType, 1, "")[0]
                              }
                              onInsert={number => {
                                const rows = block.rows.map(current => [
                                  ...current,
                                ]);
                                rows[rowIndex][cellIndex] =
                                  `${cell}${cell ? " " : ""}[[${number}]]`;
                                updateBlock(blockIndex, {
                                  type: "table",
                                  rows,
                                });
                              }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      onClick={() => {
                        const columns = block.rows[0]?.length ?? 1;
                        updateBlock(blockIndex, {
                          type: "table",
                          rows: [
                            ...block.rows,
                            Array.from({ length: columns }, () => ""),
                          ],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" /> Row
                    </button>
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      onClick={() =>
                        updateBlock(blockIndex, {
                          type: "table",
                          rows: block.rows.map(row => [...row, ""]),
                        })
                      }
                    >
                      <Plus className="h-4 w-4" /> Column
                    </button>
                    {block.rows.length > 1 && (
                      <button
                        type="button"
                        className="admin-button admin-button-secondary text-red-600"
                        onClick={() =>
                          updateBlock(blockIndex, {
                            type: "table",
                            rows: block.rows.slice(0, -1),
                          })
                        }
                      >
                        Remove row
                      </button>
                    )}
                    {(block.rows[0]?.length ?? 0) > 1 && (
                      <button
                        type="button"
                        className="admin-button admin-button-secondary text-red-600"
                        onClick={() =>
                          updateBlock(blockIndex, {
                            type: "table",
                            rows: block.rows.map(row => row.slice(0, -1)),
                          })
                        }
                      >
                        Remove column
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  {block.type === "heading" ? (
                    <input
                      value={block.text}
                      onChange={event =>
                        updateBlock(blockIndex, {
                          ...block,
                          text: event.target.value,
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none"
                      placeholder="Section heading"
                    />
                  ) : (
                    <input
                      value={block.text}
                      onChange={event =>
                        updateBlock(blockIndex, {
                          ...block,
                          text: event.target.value,
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      placeholder="Write text…"
                    />
                  )}
                  {block.type === "text" && questions.length > 0 && (
                    <AnswerInsert
                      questions={questions}
                      canCreate={remainingQuestions >= questionSpan}
                      onCreate={() => onCreateQuestions(selectedType, 1, "")[0]}
                      onInsert={number =>
                        updateBlock(blockIndex, {
                          ...block,
                          text: `${block.text}${block.text ? " " : ""}[[${number}]]`,
                        })
                      }
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {!blocks.length && (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--admin-border)] px-5 py-8 text-center text-sm text-[#747d87]">
              Add a heading, paragraph, or table to start the question layout.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() => commit([...blocks, { type: "heading", text: "" }])}
            >
              <Heading3 className="h-4 w-4" /> Heading
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() =>
                commit([...blocks, { type: "text", text: "Write text here" }])
              }
            >
              <Pilcrow className="h-4 w-4" /> Text
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() =>
                commit([
                  ...blocks,
                  {
                    type: "table",
                    rows: [
                      ["", "", ""],
                      ["", "", ""],
                    ],
                  },
                ])
              }
            >
              <Table2 className="h-4 w-4" /> Table
            </button>
          </div>
        </>
      )}
    </div>
  );
}
