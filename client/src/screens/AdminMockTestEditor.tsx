/**
 * AdminMockTestEditor — build a mock test: settings, sections (passages / parts / tasks) and questions.
 * Routes: /admin/ielts/new and /admin/ielts/:id
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  CloudUpload,
  FileInput,
  Loader2,
  Music2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "@/lib/router";
import { fileToBase64 } from "@/lib/fileToBase64";
import {
  AUTO_MARKED_TYPES,
  CAMBRIDGE,
  CHOICE_SELECTION_COUNTS,
  DEFAULT_DURATION_MINUTES,
  FIXED_CHOICES,
  LISTENING_QUESTION_TYPES,
  MODULE_LABELS,
  MODULE_QUESTION_TYPES,
  PAPER_LAYOUT,
  PRACTICE_TYPES,
  QUESTION_TYPE_LABELS,
  cambridgeTitle,
  choiceSelectionCount,
  isCompletionType,
  isAutoMarkedModule,
  optionLetter,
  parseAnswerKey,
  type MockFormat,
  type MockModule,
  type MockQuestionType,
} from "@shared/mock";
import { MODULE_BLURB, MODULE_ICONS } from "./AdminMockTests";
import AdminSelect from "@/components/AdminSelect";
import AdminImageUploader from "@/components/AdminImageUploader";
import ListeningLayoutBuilder from "@/components/ListeningLayoutBuilder";
import { Switch } from "@/components/ui/switch";

type QuestionDraft = {
  key: string;
  id?: number;
  type: MockQuestionType;
  instruction: string;
  prompt: string;
  options: string[];
  answers: string[];
  explanation: string;
  points: number;
  minWords: number | null;
  prepSeconds: number | null;
  responseSeconds: number | null;
};

type SectionDraft = {
  key: string;
  id?: number;
  title: string;
  instructions: string;
  content: string;
  questionLayout: string;
  imageUrl: string;
  audioUrl: string;
  questions: QuestionDraft[];
};

type Settings = {
  title: string;
  description: string;
  module: MockModule;
  variant: "academic" | "general";
  mode: "exam" | "practice";
  durationMinutes: number | null;
  maxAttempts: number | null;
  isPublished: boolean;
  format: MockFormat;
  series: string | null;
  bookNumber: number | null;
  testNumber: number | null;
  /** PRACTICE_TYPES key when this practice test drills one question type */
  practiceType: string | null;
};

function newQuestion(
  type: MockQuestionType,
  extra: Partial<QuestionDraft> = {}
): QuestionDraft {
  return {
    key: nanoid(),
    type,
    instruction: "",
    prompt: "",
    options: choiceSelectionCount(type) ? ["", "", "", ""] : [],
    answers: [],
    explanation: "",
    points: Math.max(1, choiceSelectionCount(type)),
    minWords: null,
    prepSeconds: null,
    responseSeconds: null,
    ...extra,
  };
}

function newSection(
  title: string,
  questions: QuestionDraft[] = [],
  extra: Partial<SectionDraft> = {}
): SectionDraft {
  return {
    key: nanoid(),
    title,
    instructions: "",
    content: "",
    questionLayout: "",
    imageUrl: "",
    audioUrl: "",
    questions,
    ...extra,
  };
}

function questionStartNumber(
  sections: SectionDraft[],
  sectionIndex: number,
  questionIndex: number
) {
  const before = sections
    .slice(0, sectionIndex)
    .flatMap(section => section.questions)
    .concat(sections[sectionIndex]?.questions.slice(0, questionIndex) ?? []);
  return (
    before.reduce(
      (total, question) =>
        total + Math.max(1, choiceSelectionCount(question.type)),
      0
    ) + 1
  );
}

function templateFor(module: MockModule): SectionDraft[] {
  switch (module) {
    case "reading":
      return [1, 2, 3].map(n =>
        newSection(`Passage ${n}`, [newQuestion("tfng")], {
          instructions: "Read the passage and answer the questions below.",
        })
      );
    case "listening":
      return [1, 2, 3, 4].map(n => newSection(`Part ${n}`, []));
    case "writing":
      return [
        newSection(
          "Task 1",
          [
            newQuestion("writing", {
              minWords: 150,
              prompt:
                "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
            }),
          ],
          {
            instructions:
              "You should spend about 20 minutes on this task. Write at least 150 words.",
          }
        ),
        newSection("Task 2", [newQuestion("writing", { minWords: 250 })], {
          instructions:
            "You should spend about 40 minutes on this task. Write at least 250 words.",
        }),
      ];
    case "speaking":
      return [
        newSection("Part 1 — Introduction", [
          newQuestion("speaking", { responseSeconds: 30 }),
        ]),
        newSection(
          "Part 2 — Long turn",
          [newQuestion("speaking", { prepSeconds: 60, responseSeconds: 120 })],
          {
            instructions:
              "You have one minute to prepare, then speak for up to two minutes.",
          }
        ),
        newSection("Part 3 — Discussion", [
          newQuestion("speaking", { responseSeconds: 60 }),
        ]),
      ];
  }
}

/** Sections for a test where students work from their own book and only the answers live on the site. */
function answerSheetTemplate(module: MockModule): SectionDraft[] {
  if (module === "listening" || module === "reading") {
    return PAPER_LAYOUT[module].map(part =>
      newSection(
        part.title,
        Array.from({ length: part.to - part.from + 1 }, (_, i) =>
          newQuestion("short_answer", { prompt: `Question ${part.from + i}` })
        )
      )
    );
  }
  if (module === "writing") {
    return [
      newSection(
        "Task 1",
        [
          newQuestion("writing", {
            minWords: 150,
            prompt: "Answer Writing Task 1 from your book.",
          }),
        ],
        {
          instructions:
            "You should spend about 20 minutes on this task. Write at least 150 words.",
        }
      ),
      newSection(
        "Task 2",
        [
          newQuestion("writing", {
            minWords: 250,
            prompt: "Answer Writing Task 2 from your book.",
          }),
        ],
        {
          instructions:
            "You should spend about 40 minutes on this task. Write at least 250 words.",
        }
      ),
    ];
  }
  return [
    newSection("Part 1", [
      newQuestion("speaking", {
        prompt:
          "Answer the Part 1 questions from your book, one after another.",
        responseSeconds: 240,
      }),
    ]),
    newSection("Part 2", [
      newQuestion("speaking", {
        prompt: "Use the Part 2 cue card in your book.",
        prepSeconds: 60,
        responseSeconds: 120,
      }),
    ]),
    newSection("Part 3", [
      newQuestion("speaking", {
        prompt: "Answer the Part 3 discussion questions from your book.",
        responseSeconds: 300,
      }),
    ]),
  ];
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200";

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function MediaInput({
  label,
  accept,
  value,
  onChange,
}: {
  label: string;
  accept: "audio" | "image";
  value: string;
  onChange: (url: string) => void;
}) {
  const upload = trpc.mockTests.uploadMedia.useMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { url } = await upload.mutateAsync({
        base64: await fileToBase64(file),
        filename: file.name,
        contentType:
          file.type || (accept === "audio" ? "audio/mpeg" : "image/jpeg"),
      });
      onChange(url);
      toast.success(`${accept === "audio" ? "Audio" : "Image"} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const directUrl = (
    <div className="mt-3">
      <span className="mb-1.5 block text-xs font-medium text-gray-600">
        Or use a direct URL
      </span>
      <input
        className={inputClass}
        value={value}
        placeholder="https://…"
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );

  if (accept === "image") {
    return (
      <Field label={label} hint="PNG or JPG, max 10 MB.">
        <AdminImageUploader
          value={value}
          label={label}
          maxSizeLabel="Max 10 MB"
          uploading={upload.isPending}
          onChange={pick}
          onMediaSelect={onChange}
          onRemove={() => onChange("")}
        />
        {directUrl}
      </Field>
    );
  }

  return (
    <Field label={label}>
      <div className="relative flex min-h-[184px] items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[#d8d8d8] bg-transparent px-5 py-7">
        {value ? (
          <div className="flex w-full flex-col items-center gap-4">
            <Music2 className="h-8 w-8 stroke-[1.4] text-[#c76f42]" />
            <audio controls src={value} className="w-full max-w-xl" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center bg-white text-red-600 shadow-sm hover:bg-red-50"
              aria-label={`Remove ${label}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="text-xs font-semibold text-[#c76f42] hover:underline"
            >
              Replace audio
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="flex flex-col items-center text-center"
          >
            {upload.isPending ? (
              <Loader2 className="mb-5 h-6 w-6 animate-spin text-[#c76f42]" />
            ) : (
              <CloudUpload className="mb-5 h-6 w-6 stroke-[1.4] text-[#c76f42]" />
            )}
            <span className="text-sm font-semibold text-[#30363d]">
              {upload.isPending ? "Uploading audio…" : "Upload audio"}
            </span>
            <span className="mt-2 text-xs text-[#747d87]">
              MP3, M4A, WAV or OGG · Max 60 MB
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={pick}
          disabled={upload.isPending}
        />
      </div>
    </Field>
  );
}

function QuestionEditor({
  number,
  question,
  module,
  onChange,
  onRemove,
  onMove,
}: {
  number: number | string;
  question: QuestionDraft;
  module: MockModule;
  onChange: (q: QuestionDraft) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const set = (patch: Partial<QuestionDraft>) =>
    onChange({ ...question, ...patch });
  const types = MODULE_QUESTION_TYPES[module];
  const fixed = FIXED_CHOICES[question.type];
  const autoMarked = AUTO_MARKED_TYPES.includes(question.type);
  const selectionCount = CHOICE_SELECTION_COUNTS[question.type] ?? 0;

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
          Q{number}
        </span>
        {types.length > 1 ? (
          <AdminSelect
            value={question.type}
            onChange={e => {
              const type = e.target.value as MockQuestionType;
              set({
                type,
                answers: [],
                points: Math.max(1, choiceSelectionCount(type)),
                options: choiceSelectionCount(type)
                  ? question.options.length
                    ? question.options
                    : ["", "", "", ""]
                  : [],
              });
            }}
            aria-label="Question type"
            size="sm"
            className="w-auto min-w-[150px]"
          >
            {types.map(t => (
              <option key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </option>
            ))}
          </AdminSelect>
        ) : (
          <span className="text-sm text-gray-600">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            className="rounded p-1.5 hover:bg-gray-200"
            aria-label="Move question up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            className="rounded p-1.5 hover:bg-gray-200"
            aria-label="Move question down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1.5 hover:bg-red-50"
            aria-label="Remove question"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>

      {module === "listening" && (
        <Field
          label="Instructions"
          hint="Shown before this question. For a group, keep this on the first question only."
          className="mb-3"
        >
          <textarea
            className={inputClass}
            rows={2}
            value={question.instruction}
            onChange={e => set({ instruction: e.target.value })}
          />
        </Field>
      )}

      <Field
        label={
          question.type === "writing"
            ? "Task prompt"
            : question.type === "speaking"
              ? "Question / cue card"
              : "Question"
        }
      >
        <textarea
          className={inputClass}
          rows={
            question.type === "writing" || question.type === "speaking" ? 4 : 2
          }
          value={question.prompt}
          onChange={e => set({ prompt: e.target.value })}
        />
      </Field>

      {selectionCount > 0 && (
        <div className="mt-3 space-y-2">
          <span className="block text-sm font-medium text-gray-700">
            Options — select{" "}
            {selectionCount === 1
              ? "the correct one"
              : `${selectionCount} correct answers`}
          </span>
          {question.options.map((option, i) => {
            const letter = optionLetter(i);
            return (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={selectionCount === 1 ? "radio" : "checkbox"}
                  name={`correct-${question.key}`}
                  checked={question.answers.includes(letter)}
                  onChange={event => {
                    if (selectionCount === 1) {
                      set({ answers: [letter] });
                      return;
                    }
                    const answers = event.target.checked
                      ? [...question.answers, letter].slice(0, selectionCount)
                      : question.answers.filter(answer => answer !== letter);
                    set({ answers });
                  }}
                  aria-label={`Mark option ${letter} correct`}
                />
                <span className="w-5 text-sm font-bold text-gray-500">
                  {letter}
                </span>
                <input
                  className={inputClass}
                  value={option}
                  placeholder={`Option ${letter}`}
                  onChange={e =>
                    set({
                      options: question.options.map((o, j) =>
                        j === i ? e.target.value : o
                      ),
                    })
                  }
                />
                {question.options.length > 2 && (
                  <button
                    type="button"
                    className="rounded p-1.5 hover:bg-red-50"
                    aria-label={`Remove option ${letter}`}
                    onClick={() =>
                      set({
                        options: question.options.filter((_, j) => j !== i),
                        answers: [],
                      })
                    }
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
            );
          })}
          {question.options.length < 10 && (
            <button
              type="button"
              className="text-sm font-medium text-red-600 hover:underline"
              onClick={() => set({ options: [...question.options, ""] })}
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {fixed && (
        <Field label="Correct answer" className="mt-3">
          <AdminSelect
            value={question.answers[0] ?? ""}
            onChange={e =>
              set({ answers: e.target.value ? [e.target.value] : [] })
            }
          >
            <option value="">Select…</option>
            {fixed.map(choice => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </AdminSelect>
        </Field>
      )}

      {isCompletionType(question.type) && (
        <Field
          label="Accepted answers"
          hint="One per line. Matching ignores capitals and surrounding punctuation."
          className="mt-3"
        >
          <textarea
            className={inputClass}
            rows={2}
            value={question.answers.join("\n")}
            onChange={e => set({ answers: e.target.value.split("\n") })}
          />
        </Field>
      )}

      {question.type === "writing" && (
        <Field label="Minimum words" className="mt-3 max-w-[200px]">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={question.minWords ?? ""}
            onChange={e =>
              set({ minWords: e.target.value ? Number(e.target.value) : null })
            }
          />
        </Field>
      )}

      {question.type === "speaking" && (
        <div className="mt-3 grid max-w-[420px] grid-cols-2 gap-3">
          <Field label="Preparation (seconds)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={question.prepSeconds ?? ""}
              onChange={e =>
                set({
                  prepSeconds: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Field>
          <Field label="Answer time (seconds)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={question.responseSeconds ?? ""}
              onChange={e =>
                set({
                  responseSeconds: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            />
          </Field>
        </div>
      )}

      {autoMarked ? (
        <Field
          label="Explanation (shown after submitting in practice mode)"
          className="mt-3"
        >
          <textarea
            className={inputClass}
            rows={2}
            value={question.explanation}
            onChange={e => set({ explanation: e.target.value })}
          />
        </Field>
      ) : (
        <Field
          label={
            question.type === "writing"
              ? "Model answer / tips"
              : "Sample answer / tips"
          }
          hint="Shown to students after they submit a practice test. Not shown in timed exams."
          className="mt-3"
        >
          <textarea
            className={inputClass}
            rows={question.type === "writing" ? 8 : 5}
            value={question.explanation}
            placeholder={
              question.type === "writing"
                ? "Paste a band 8–9 model answer, or tips on structure and key language…"
                : "Write a sample answer or tips on what a strong response includes…"
            }
            onChange={e => set({ explanation: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}

function AddQuestionControl({
  module,
  defaultType,
  lastQuestion,
  existingCount,
  onAdd,
}: {
  module: MockModule;
  defaultType: MockQuestionType;
  lastQuestion?: QuestionDraft;
  existingCount: number;
  onAdd: (type: MockQuestionType, count: number) => void;
}) {
  const [type, setType] = useState<MockQuestionType>(
    lastQuestion?.type ?? defaultType
  );
  const remaining = Math.max(0, 10 - existingCount);
  const maxCount = Math.floor(
    remaining / Math.max(1, choiceSelectionCount(type))
  );
  const [count, setCount] = useState(Math.max(1, maxCount));
  const allowedCount = Math.min(count, maxCount);

  if (module !== "listening") {
    return (
      <button
        type="button"
        className="admin-button admin-button-secondary"
        onClick={() => onAdd(lastQuestion?.type ?? defaultType, 1)}
      >
        <Plus className="h-4 w-4" />
        Add question
      </button>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--admin-border)] p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-[#30363d]">
          Add answer entries in bulk (optional)
        </p>
        <p className="mt-0.5 text-xs text-[#747d87]">
          Use this for simple choice questions or when you already know how many
          answers the part needs. A standard part contains 10 questions.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-medium text-gray-600">
            Question type
          </span>
          <AdminSelect
            value={type}
            onChange={event => {
              const nextType = event.target.value as MockQuestionType;
              const span = Math.max(1, choiceSelectionCount(nextType));
              setType(nextType);
              setCount(Math.max(1, Math.floor(remaining / span)));
            }}
          >
            {LISTENING_QUESTION_TYPES.map(questionType => (
              <option key={questionType} value={questionType}>
                {QUESTION_TYPE_LABELS[questionType]}
              </option>
            ))}
          </AdminSelect>
        </label>
        <label className="sm:w-32">
          <span className="mb-1.5 block text-xs font-medium text-gray-600">
            {choiceSelectionCount(type) > 1 ? "How many groups" : "How many"}
          </span>
          <AdminSelect
            value={String(allowedCount)}
            onChange={event => setCount(Number(event.target.value))}
            disabled={!maxCount}
          >
            {!maxCount && <option value="0">Part is full</option>}
            {Array.from({ length: maxCount }, (_, index) => index + 1).map(
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
          className="admin-button admin-button-secondary shrink-0"
          disabled={!allowedCount}
          onClick={() => onAdd(type, allowedCount)}
        >
          <Plus className="h-4 w-4" />
          Add {allowedCount === 1 ? "question" : `${allowedCount} questions`}
        </button>
      </div>
    </div>
  );
}

/** One line of an answer-sheet key: number, answer type, accepted answers. */
function AnswerKeyRow({
  number,
  question,
  onChange,
  onRemove,
}: {
  number: number;
  question: QuestionDraft;
  onChange: (q: QuestionDraft) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[48px_150px_1fr_32px] items-center gap-2">
      <span className="text-sm font-bold text-gray-700">{number}</span>
      <AdminSelect
        value={question.type}
        aria-label={`Answer type for question ${number}`}
        onChange={e =>
          onChange({
            ...question,
            type: e.target.value as MockQuestionType,
            answers: [],
          })
        }
        size="sm"
        className="w-auto min-w-[150px]"
      >
        <option value="short_answer">Word / number / letter</option>
        <option value="tfng">True / False / NG</option>
        <option value="ynng">Yes / No / NG</option>
      </AdminSelect>
      {FIXED_CHOICES[question.type] ? (
        <AdminSelect
          value={question.answers[0] ?? ""}
          aria-label={`Answer for question ${number}`}
          onChange={e =>
            onChange({
              ...question,
              answers: e.target.value ? [e.target.value] : [],
            })
          }
          size="sm"
          className="w-auto min-w-[150px]"
        >
          <option value="">Select…</option>
          {FIXED_CHOICES[question.type]!.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </AdminSelect>
      ) : (
        <input
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={question.answers.join(" / ")}
          placeholder="e.g. library / the library"
          aria-label={`Accepted answers for question ${number}`}
          onChange={e =>
            onChange({
              ...question,
              answers: e.target.value.split("/").map(a => a.trimStart()),
            })
          }
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1.5 hover:bg-red-50"
        aria-label={`Remove question ${number}`}
      >
        <X className="h-4 w-4 text-red-500" />
      </button>
    </div>
  );
}

const JSON_EXAMPLE = `{
  "title": "Optional new title",
  "sections": [
    {
      "title": "Passage 1",
      "instructions": "Read the passage…",
      "content": "Passage text…",
      "questions": [
        { "type": "tfng", "prompt": "Statement…", "answers": ["TRUE"] },
        { "type": "mcq", "prompt": "Question…", "options": ["…", "…", "…", "…"], "answers": ["B"] },
        { "type": "short_answer", "prompt": "Question…", "answers": ["library", "the library"] }
      ]
    }
  ]
}`;

type ImportedSection = {
  title?: string;
  instructions?: string;
  content?: string;
  imageUrl?: string;
  audioUrl?: string;
  questions?: Partial<QuestionDraft>[];
};

export function ImportPanel({
  module,
  format,
  onImport,
  onClose,
}: {
  module: MockModule;
  format: MockFormat;
  onImport: (sections: SectionDraft[], title?: string) => void;
  onClose: () => void;
}) {
  const keyMode = format === "answer_sheet" && isAutoMarkedModule(module);
  const [kind, setKind] = useState<"key" | "json">(keyMode ? "key" : "json");
  const [text, setText] = useState("");
  const keyPreview = useMemo(
    () =>
      kind === "key" && text.trim() && isAutoMarkedModule(module)
        ? parseAnswerKey(text, module as "listening" | "reading")
        : null,
    [kind, text, module]
  );
  const allowed = MODULE_QUESTION_TYPES[module];

  const apply = () => {
    if (kind === "key") {
      if (!keyPreview?.count)
        return toast.error(
          "No answers found — use one line per question, like “1 library”."
        );
      onImport(
        keyPreview.sections.map(section =>
          newSection(
            section.title,
            section.items.map(item =>
              newQuestion(item.type, {
                prompt: `Question ${item.number}`,
                answers: item.answers,
              })
            )
          )
        )
      );
      return;
    }
    let data: { title?: string; sections?: ImportedSection[] };
    try {
      data = JSON.parse(text);
    } catch (err) {
      return toast.error(
        `That isn't valid JSON: ${err instanceof Error ? err.message : ""}`
      );
    }
    if (!Array.isArray(data.sections) || !data.sections.length)
      return toast.error("The JSON needs a “sections” list.");
    const problems: string[] = [];
    const sections = data.sections.map((section, sIndex) =>
      newSection(
        section.title?.trim() || `Section ${sIndex + 1}`,
        (section.questions ?? []).map((q, qIndex) => {
          const type = (q.type ?? allowed[0]) as MockQuestionType;
          if (!allowed.includes(type))
            problems.push(
              `Section ${sIndex + 1}, question ${qIndex + 1}: “${type}” isn't allowed in ${MODULE_LABELS[module]}`
            );
          return newQuestion(type, {
            instruction: q.instruction ?? "",
            prompt: q.prompt ?? "",
            options: Array.isArray(q.options)
              ? q.options.map(String)
              : type === "mcq"
                ? ["", "", "", ""]
                : [],
            answers: Array.isArray(q.answers) ? q.answers.map(String) : [],
            explanation: q.explanation ?? "",
            points: typeof q.points === "number" ? q.points : 1,
            minWords: q.minWords ?? null,
            prepSeconds: q.prepSeconds ?? null,
            responseSeconds: q.responseSeconds ?? null,
          });
        }),
        {
          instructions: section.instructions ?? "",
          content: section.content ?? "",
          imageUrl: section.imageUrl ?? "",
          audioUrl: section.audioUrl ?? "",
        }
      )
    );
    if (problems.length) return toast.error(problems[0]);
    onImport(sections, data.title);
  };

  return (
    <div className="space-y-4 border-y border-dashed border-gray-300 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold text-gray-900">Import</h3>
        {isAutoMarkedModule(module) && (
          <div className="ml-2 flex gap-1">
            <button
              type="button"
              onClick={() => setKind("key")}
              className={`admin-button admin-filter-button ${kind === "key" ? "admin-button-primary" : "admin-button-secondary"}`}
            >
              Answer key
            </button>
            <button
              type="button"
              onClick={() => setKind("json")}
              className={`admin-button admin-filter-button ${kind === "json" ? "admin-button-primary" : "admin-button-secondary"}`}
            >
              Full test (JSON)
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded p-1.5 hover:bg-gray-100"
          aria-label="Close import"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-gray-600">
        {kind === "key"
          ? "One answer per line, as printed in the book's key. Use “/” for alternatives and brackets for optional words — “(the) museum” accepts both. TRUE/FALSE/NOT GIVEN and YES/NO/NOT GIVEN are detected automatically. Add lines like “Part 2” to set sections yourself."
          : "Paste a test you have the rights to use. This replaces all sections and questions below; nothing is saved until you press Save test."}
      </p>
      <textarea
        className={`${inputClass} font-mono text-sm`}
        rows={12}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={
          kind === "key"
            ? "1 library\n2 22 / twenty-two\n3 B\n4 (the) museum\n…"
            : JSON_EXAMPLE
        }
        spellCheck={false}
      />
      {keyPreview && (
        <div className="text-sm">
          <p className="text-gray-700">
            Found <strong>{keyPreview.count}</strong> answer
            {keyPreview.count === 1 ? "" : "s"} in {keyPreview.sections.length}{" "}
            section{keyPreview.sections.length === 1 ? "" : "s"}
            {keyPreview.sections.length
              ? `: ${keyPreview.sections.map(s => `${s.title} (${s.items.length})`).join(", ")}`
              : ""}
            .
          </p>
          {keyPreview.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-red-600">
              {keyPreview.errors.slice(0, 6).map(e => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button
        type="button"
        className="admin-button admin-button-primary"
        onClick={apply}
      >
        <FileInput className="h-4 w-4" />
        Replace questions
      </button>
    </div>
  );
}

function validate(settings: Settings, sections: SectionDraft[]) {
  if (!settings.title.trim()) return "Give the test a title.";
  if (settings.series && (!settings.bookNumber || !settings.testNumber))
    return "Choose the book and test number.";
  if (!sections.length) return "Add at least one section.";
  let n = 0;
  for (const section of sections) {
    if (settings.module !== "listening" && !section.title.trim())
      return "Every section needs a title.";
    if (
      settings.module === "listening" &&
      section.questions.reduce(
        (total, question) =>
          total + Math.max(1, choiceSelectionCount(question.type)),
        0
      ) > 10
    )
      return `${section.title} cannot contain more than 10 questions.`;
    for (const q of section.questions) {
      n += 1;
      if (!q.prompt.trim()) return `Question ${n} has no prompt.`;
      const selectionCount = choiceSelectionCount(q.type);
      if (selectionCount) {
        if (q.options.filter(o => o.trim()).length < 2)
          return `Question ${n} needs at least two options.`;
        if (q.answers.length !== selectionCount)
          return `Choose ${selectionCount} correct ${selectionCount === 1 ? "option" : "options"} for question ${n}.`;
      }
      if ((q.type === "tfng" || q.type === "ynng") && !q.answers[0])
        return `Choose the correct answer for question ${n}.`;
      if (isCompletionType(q.type) && !q.answers.some(a => a.trim()))
        return `Add at least one accepted answer for question ${n}.`;
    }
  }
  if (!n) return "Add at least one question.";
  return null;
}

export default function AdminMockTestEditor() {
  const [pathname, navigate] = useLocation();
  const idParam = pathname.split("/")[3];
  const testId = idParam && idParam !== "new" ? Number(idParam) : null;
  const utils = trpc.useUtils();

  const { data: existing, isLoading } = trpc.mockTests.get.useQuery(
    { id: testId ?? 0 },
    { enabled: !!testId }
  );
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sections, setSections] = useState<SectionDraft[]>([]);

  useEffect(() => {
    if (!existing) return;
    setSettings({
      title: existing.title,
      description: existing.description ?? "",
      module: existing.module,
      variant: existing.variant,
      mode: existing.mode,
      durationMinutes: existing.durationMinutes,
      maxAttempts: existing.maxAttempts,
      isPublished: existing.isPublished,
      format: existing.format,
      series: existing.series,
      bookNumber: existing.bookNumber,
      testNumber: existing.testNumber,
      practiceType: existing.practiceType ?? null,
    });
    setSections(
      existing.sections.map(s => ({
        key: nanoid(),
        id: s.id,
        title: s.title,
        instructions: s.instructions ?? "",
        content: s.content ?? "",
        questionLayout: s.questionLayout ?? "",
        imageUrl: s.imageUrl ?? "",
        audioUrl: s.audioUrl ?? "",
        questions: s.questions.map(q => ({
          key: nanoid(),
          id: q.id,
          type: q.type,
          instruction: q.instruction ?? "",
          prompt: q.prompt,
          options: q.options ?? [],
          answers: q.answers ?? [],
          explanation: q.explanation ?? "",
          points: q.points,
          minWords: q.minWords,
          prepSeconds: q.prepSeconds,
          responseSeconds: q.responseSeconds,
        })),
      }))
    );
  }, [existing]);

  const save = trpc.mockTests.save.useMutation({
    onSuccess: ({ id }) => {
      toast.success("Test saved");
      utils.mockTests.list.invalidate();
      utils.mockTests.get.invalidate({ id });
      if (!testId) navigate(`/admin/ielts/${id}`);
    },
    onError: err => toast.error(err.message),
  });

  const chooseModule = (
    module: MockModule,
    preset?: { series: string; book: number; test: number }
  ) => {
    setSettings({
      title: preset
        ? cambridgeTitle(preset.book, preset.test, module)
        : `${MODULE_LABELS[module]} Mock Test`,
      description: "",
      module,
      variant: "academic",
      mode: "exam",
      durationMinutes: DEFAULT_DURATION_MINUTES[module],
      maxAttempts: preset ? null : 1,
      isPublished: false,
      format: preset ? "answer_sheet" : "full",
      series: preset?.series ?? null,
      bookNumber: preset?.book ?? null,
      testNumber: preset?.test ?? null,
      practiceType: null,
    });
    setSections(preset ? answerSheetTemplate(module) : templateFor(module));
  };

  // Opened from the Cambridge library grid (/admin/ielts/new?series=cambridge&book=18&test=2&module=listening)
  // or a module page (?module=listening): skip the module picker.
  const search = new URLSearchParams(useSearch());
  useEffect(() => {
    if (testId || settings) return;
    const module = search.get("module") as MockModule | null;
    const book = Number(search.get("book"));
    const test = Number(search.get("test"));
    if (!module || !(module in MODULE_LABELS)) return;
    if (search.get("series") === CAMBRIDGE.key && book && test) {
      chooseModule(module, { series: CAMBRIDGE.key, book, test });
    } else {
      // Opened from a module page: /admin/ielts/new?module=writing
      chooseModule(module);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (testId && (isLoading || (!settings && existing))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }
  if (testId && !isLoading && !existing) {
    return (
      <div className="p-12 text-center text-gray-600">Test not found.</div>
    );
  }

  const header = (
    <AdminPageHeader
      title={
        testId
          ? "Edit test"
          : settings
            ? `New ${MODULE_LABELS[settings.module]} test`
            : "New test"
      }
      parent={
        settings
          ? {
              label: MODULE_LABELS[settings.module],
              href: `/admin/ielts/${settings.module}`,
            }
          : undefined
      }
      action={
        settings ? (
          <button
            className="admin-primary-button"
            disabled={save.isPending}
            onClick={() => {
              const problem = validate(settings, sections);
              if (problem) return toast.error(problem);
              let seq = 0;
              const sheet =
                settings.format === "answer_sheet" &&
                isAutoMarkedModule(settings.module);
              save.mutate({
                id: testId,
                test: {
                  ...settings,
                  durationMinutes:
                    settings.mode === "exam" ? settings.durationMinutes : null,
                  description: settings.description || null,
                },
                sections: sections.map((s, sectionIndex) => ({
                  id: s.id,
                  title:
                    settings.module === "listening"
                      ? `Part ${sectionIndex + 1}`
                      : s.title.trim(),
                  instructions: s.instructions || null,
                  content: s.content || null,
                  questionLayout: s.questionLayout || null,
                  imageUrl: s.imageUrl || null,
                  audioUrl: s.audioUrl || null,
                  questions: s.questions.map(q => ({
                    id: q.id,
                    type: q.type,
                    instruction: q.instruction || null,
                    // Answer-sheet questions are numbered like the book: 1…40 across all parts.
                    prompt: sheet ? `Question ${++seq}` : q.prompt.trim(),
                    options: choiceSelectionCount(q.type)
                      ? q.options.map(o => o.trim())
                      : null,
                    answers: AUTO_MARKED_TYPES.includes(q.type)
                      ? q.answers.map(a => a.trim()).filter(Boolean)
                      : null,
                    explanation: q.explanation || null,
                    points: q.points,
                    minWords: q.minWords,
                    prepSeconds: q.prepSeconds,
                    responseSeconds: q.responseSeconds,
                  })),
                })),
              });
            }}
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save test
          </button>
        ) : undefined
      }
    />
  );

  // Step 1 for new tests: pick the module
  if (!settings) {
    return (
      <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
        {header}
        <p className="mb-5 text-gray-600">Which module is this test for?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(MODULE_LABELS) as MockModule[]).map(module => {
            const Icon = MODULE_ICONS[module];
            return (
              <button
                key={module}
                type="button"
                onClick={() => chooseModule(module)}
                className="flex items-start gap-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-5 text-left transition-transform hover:-translate-y-0.5"
              >
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gray-100">
                  <Icon className="h-6 w-6 text-gray-700" />
                </span>
                <span>
                  <span className="block font-bold text-gray-900">
                    {MODULE_LABELS[module]}
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    {MODULE_BLURB[module]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const setS = (patch: Partial<Settings>) =>
    setSettings(prev => (prev ? { ...prev, ...patch } : prev));
  const updateSection = (key: string, patch: Partial<SectionDraft>) =>
    setSections(prev =>
      prev.map(s => (s.key === key ? { ...s, ...patch } : s))
    );
  const moveItem = <T,>(list: T[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  };
  const defaultType = MODULE_QUESTION_TYPES[settings.module][0];
  let running = 0;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      {header}

      <div className="space-y-6">
        {/* Settings */}
        <div className="space-y-4 pb-8">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <input
                className={inputClass}
                value={settings.title}
                onChange={e => setS({ title: e.target.value })}
              />
            </Field>
            <Field
              label="Description for students (optional)"
              className="sm:col-span-2"
            >
              <textarea
                className={inputClass}
                rows={2}
                value={settings.description}
                onChange={e => setS({ description: e.target.value })}
              />
            </Field>
            <Field
              label="Book series"
              hint="Groups the test in the Cambridge library."
            >
              <AdminSelect
                value={settings.series ?? ""}
                onChange={e => setS({ series: e.target.value || null })}
              >
                <option value="">None — our own test</option>
                <option value={CAMBRIDGE.key}>{CAMBRIDGE.label}</option>
              </AdminSelect>
            </Field>
            <Field
              label="Mode"
              hint={
                settings.mode === "exam"
                  ? "Timed, auto-submits, answers stay hidden."
                  : "No timer, answers and explanations shown after submitting."
              }
            >
              <AdminSelect
                value={settings.mode}
                onChange={e => {
                  const mode = e.target.value as Settings["mode"];
                  setS({
                    mode,
                    practiceType:
                      mode === "practice" ? settings.practiceType : null,
                    maxAttempts:
                      mode === "practice" ? null : (settings.maxAttempts ?? 1),
                    durationMinutes:
                      settings.durationMinutes ??
                      DEFAULT_DURATION_MINUTES[settings.module],
                  });
                }}
              >
                <option value="exam">Timed exam</option>
                <option value="practice">Practice</option>
              </AdminSelect>
            </Field>
            {settings.series === CAMBRIDGE.key && (
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <Field label="Book">
                  <AdminSelect
                    value={settings.bookNumber ?? ""}
                    onChange={e =>
                      setS({
                        bookNumber: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  >
                    <option value="">Select…</option>
                    {Array.from(
                      { length: CAMBRIDGE.books },
                      (_, i) => CAMBRIDGE.books - i
                    ).map(n => (
                      <option key={n} value={n}>
                        {CAMBRIDGE.label} {n}
                      </option>
                    ))}
                  </AdminSelect>
                </Field>
                <Field label="Test">
                  <AdminSelect
                    value={settings.testNumber ?? ""}
                    onChange={e =>
                      setS({
                        testNumber: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  >
                    <option value="">Select…</option>
                    {Array.from(
                      { length: CAMBRIDGE.testsPerBook },
                      (_, i) => i + 1
                    ).map(n => (
                      <option key={n} value={n}>
                        Test {n}
                      </option>
                    ))}
                  </AdminSelect>
                </Field>
              </div>
            )}
            {settings.module === "reading" && (
              <Field
                label="Reading type"
                hint="Decides which band conversion table is used."
                className="sm:col-span-2"
              >
                <AdminSelect
                  value={settings.variant}
                  onChange={e =>
                    setS({ variant: e.target.value as Settings["variant"] })
                  }
                >
                  <option value="academic">Academic</option>
                  <option value="general">General Training</option>
                </AdminSelect>
              </Field>
            )}
            {settings.mode === "practice" && (
              <Field
                label="Question type"
                hint="Lists this set under Practice → by question type for students. Leave as a full test to show it with the other practice tests."
                className="sm:col-span-2"
              >
                <AdminSelect
                  value={settings.practiceType ?? ""}
                  onChange={e => setS({ practiceType: e.target.value || null })}
                >
                  <option value="">Full practice test (all types)</option>
                  {PRACTICE_TYPES[settings.module].map(type => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </AdminSelect>
              </Field>
            )}
            <label
              htmlFor="mock-test-published"
              className="flex min-h-14 items-center justify-between gap-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] px-4 py-3 text-sm sm:col-span-2"
            >
              <span>Published — visible to students</span>
              <Switch
                id="mock-test-published"
                checked={settings.isPublished}
                onCheckedChange={checked => setS({ isPublished: checked })}
              />
            </label>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, sIndex) => (
          <div
            key={section.key}
            className={`space-y-4 pb-8 ${
              settings.module === "listening" ? "" : "border-b border-gray-200"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {settings.module === "listening" ? (
                <h3 className="min-w-0 flex-1 py-1 text-lg font-bold text-gray-900">
                  Part {sIndex + 1}
                </h3>
              ) : (
                <>
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 text-lg font-bold text-gray-900 hover:border-gray-200 focus:border-red-500 focus:outline-none"
                    value={section.title}
                    onChange={e =>
                      updateSection(section.key, { title: e.target.value })
                    }
                    aria-label="Section title"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSections(prev => moveItem(prev, sIndex, -1))
                    }
                    className="rounded p-1.5 hover:bg-gray-100"
                    aria-label="Move section up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSections(prev => moveItem(prev, sIndex, 1))
                    }
                    className="rounded p-1.5 hover:bg-gray-100"
                    aria-label="Move section down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      confirm(`Remove "${section.title}" and its questions?`) &&
                      setSections(prev =>
                        prev.filter(s => s.key !== section.key)
                      )
                    }
                    className="rounded p-1.5 hover:bg-red-50"
                    aria-label="Remove section"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </>
              )}
            </div>

            {(settings.module !== "listening" ||
              settings.format === "answer_sheet") && (
              <Field label="Instructions">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={section.instructions}
                  onChange={e =>
                    updateSection(section.key, {
                      instructions: e.target.value,
                    })
                  }
                />
              </Field>
            )}

            {settings.module === "listening" && (
              <>
                <MediaInput
                  label={
                    settings.format === "answer_sheet"
                      ? "Audio for this part (optional — students can use the book's audio)"
                      : "1. Upload audio"
                  }
                  accept="audio"
                  value={section.audioUrl}
                  onChange={url =>
                    updateSection(section.key, { audioUrl: url })
                  }
                />
                {settings.format === "full" && section.audioUrl && (
                  <Field
                    label="2. Build the questions"
                    hint="Write the question content visually. Choosing “Create new answer box” automatically creates its answer-key entry below."
                  >
                    <ListeningLayoutBuilder
                      value={section.questionLayout}
                      onChange={questionLayout =>
                        updateSection(section.key, {
                          questionLayout,
                        })
                      }
                      questions={section.questions.flatMap(
                        (question, questionIndex) =>
                          isCompletionType(question.type)
                            ? [
                                {
                                  number: questionStartNumber(
                                    sections,
                                    sIndex,
                                    questionIndex
                                  ),
                                  label:
                                    question.prompt ||
                                    QUESTION_TYPE_LABELS[question.type],
                                },
                              ]
                            : []
                      )}
                      existingQuestionCount={section.questions.reduce(
                        (total, question) =>
                          total +
                          Math.max(1, choiceSelectionCount(question.type)),
                        0
                      )}
                      onCreateQuestions={(type, count, instruction) => {
                        const firstNumber = questionStartNumber(
                          sections,
                          sIndex,
                          section.questions.length
                        );
                        const numberSpan = Math.max(
                          1,
                          choiceSelectionCount(type)
                        );
                        updateSection(section.key, {
                          questions: [
                            ...section.questions,
                            ...Array.from({ length: count }, (_, index) =>
                              newQuestion(type, {
                                instruction: index === 0 ? instruction : "",
                                prompt: `${QUESTION_TYPE_LABELS[type]} question`,
                              })
                            ),
                          ],
                        });
                        return Array.from(
                          { length: count },
                          (_, index) => firstNumber + index * numberSpan
                        );
                      }}
                      labelingMedia={
                        <MediaInput
                          label="Map / plan / diagram image (optional)"
                          accept="image"
                          value={section.imageUrl}
                          onChange={url =>
                            updateSection(section.key, { imageUrl: url })
                          }
                        />
                      }
                    />
                  </Field>
                )}
              </>
            )}
            {settings.format === "full" &&
              (settings.module === "reading" ||
                settings.module === "writing" ||
                settings.module === "speaking") && (
                <Field
                  label={
                    settings.module === "reading"
                      ? "Passage text"
                      : settings.module === "writing"
                        ? "Extra context (optional)"
                        : "Topic notes (optional)"
                  }
                >
                  <textarea
                    className={inputClass}
                    rows={settings.module === "reading" ? 12 : 3}
                    value={section.content}
                    onChange={e =>
                      updateSection(section.key, { content: e.target.value })
                    }
                  />
                </Field>
              )}
            {settings.format === "full" &&
              (settings.module === "writing" ||
                settings.module === "reading") && (
                <MediaInput
                  label={
                    settings.module === "writing"
                      ? "Chart / diagram image (Task 1)"
                      : "Image (optional)"
                  }
                  accept="image"
                  value={section.imageUrl}
                  onChange={url =>
                    updateSection(section.key, { imageUrl: url })
                  }
                />
              )}
            <div
              className={`space-y-3 ${
                settings.module === "listening" &&
                settings.format === "full" &&
                !section.audioUrl
                  ? "hidden"
                  : ""
              }`}
            >
              {settings.module === "listening" &&
                settings.format === "full" &&
                section.questions.length > 0 && (
                  <div className="pb-1 pt-2">
                    <h4 className="text-sm font-semibold text-[#30363d]">
                      3. Add answers and explanations
                    </h4>
                    <p className="mt-1 text-xs text-[#747d87]">
                      Set each accepted answer and optionally add an explanation
                      shown after submission in practice mode.
                    </p>
                  </div>
                )}
              {section.questions.map((question, qIndex) => {
                const firstNumber = running + 1;
                const numberSpan = Math.max(
                  1,
                  choiceSelectionCount(question.type)
                );
                running += numberSpan;
                const numberLabel =
                  numberSpan > 1
                    ? `${firstNumber}–${running}`
                    : String(firstNumber);
                if (
                  settings.format === "answer_sheet" &&
                  isAutoMarkedModule(settings.module)
                ) {
                  const number = firstNumber;
                  return (
                    <AnswerKeyRow
                      key={question.key}
                      number={number}
                      question={question}
                      onChange={q =>
                        updateSection(section.key, {
                          questions: section.questions.map(x =>
                            x.key === q.key
                              ? { ...q, prompt: `Question ${number}` }
                              : x
                          ),
                        })
                      }
                      onRemove={() =>
                        updateSection(section.key, {
                          questions: section.questions.filter(
                            x => x.key !== question.key
                          ),
                        })
                      }
                    />
                  );
                }
                return (
                  <QuestionEditor
                    key={question.key}
                    number={numberLabel}
                    question={question}
                    module={settings.module}
                    onChange={q =>
                      updateSection(section.key, {
                        questions: section.questions.map(x =>
                          x.key === q.key ? q : x
                        ),
                      })
                    }
                    onRemove={() =>
                      updateSection(section.key, {
                        questions: section.questions.filter(
                          x => x.key !== question.key
                        ),
                      })
                    }
                    onMove={dir =>
                      updateSection(section.key, {
                        questions: moveItem(section.questions, qIndex, dir),
                      })
                    }
                  />
                );
              })}
              {(settings.module !== "listening" ||
                settings.format === "answer_sheet") && (
                <AddQuestionControl
                  module={settings.module}
                  defaultType={defaultType}
                  lastQuestion={section.questions[section.questions.length - 1]}
                  existingCount={section.questions.reduce(
                    (total, question) =>
                      total + Math.max(1, choiceSelectionCount(question.type)),
                    0
                  )}
                  onAdd={(type, count) => {
                    const last =
                      section.questions[section.questions.length - 1];
                    const firstQuestionNumber =
                      sections
                        .slice(0, sIndex)
                        .reduce(
                          (total, item) => total + item.questions.length,
                          0
                        ) + section.questions.length;
                    updateSection(section.key, {
                      questions: [
                        ...section.questions,
                        ...Array.from({ length: count }, (_, index) =>
                          newQuestion(type, {
                            prompt:
                              settings.format === "answer_sheet" &&
                              isAutoMarkedModule(settings.module)
                                ? `Question ${firstQuestionNumber + index + 1}`
                                : "",
                            minWords: last?.minWords ?? null,
                            prepSeconds: last?.prepSeconds ?? null,
                            responseSeconds: last?.responseSeconds ?? null,
                          })
                        ),
                      ],
                    });
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {settings.module !== "listening" && (
          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={() =>
              setSections(prev => [
                ...prev,
                newSection(`Section ${prev.length + 1}`, [
                  newQuestion(defaultType),
                ]),
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add section
          </button>
        )}
      </div>
    </div>
  );
}
