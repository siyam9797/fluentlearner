/**
 * AdminMockTestEditor — build a mock test: settings, sections (passages / parts / tasks) and questions.
 * Routes: /admin/mock-tests/new and /admin/mock-tests/:id
 */
import {
  useEffect,
  useMemo,
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
  DEFAULT_DURATION_MINUTES,
  FIXED_CHOICES,
  MODULE_LABELS,
  MODULE_QUESTION_TYPES,
  PAPER_LAYOUT,
  QUESTION_TYPE_LABELS,
  cambridgeTitle,
  isAutoMarkedModule,
  optionLetter,
  parseAnswerKey,
  type MockFormat,
  type MockModule,
  type MockQuestionType,
} from "@shared/mock";
import { MODULE_ICONS } from "./AdminMockTests";

type QuestionDraft = {
  key: string;
  id?: number;
  type: MockQuestionType;
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
};

const MODULE_BLURB: Record<MockModule, string> = {
  reading: "Passages with auto-marked questions and band conversion.",
  listening: "Audio parts with auto-marked questions and band conversion.",
  writing:
    "Task 1 and Task 2 with word counts. You mark against the four criteria.",
  speaking: "Parts 1–3 recorded in the browser. You listen and mark.",
};

function newQuestion(
  type: MockQuestionType,
  extra: Partial<QuestionDraft> = {}
): QuestionDraft {
  return {
    key: nanoid(),
    type,
    prompt: "",
    options: type === "mcq" ? ["", "", "", ""] : [],
    answers: [],
    explanation: "",
    points: 1,
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
    imageUrl: "",
    audioUrl: "",
    questions,
    ...extra,
  };
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
      return [1, 2, 3, 4].map(n =>
        newSection(`Part ${n}`, [newQuestion("short_answer")], {
          instructions:
            "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        })
      );
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

  return (
    <Field
      label={label}
      hint={
        accept === "audio"
          ? "Upload an MP3/M4A (max 60 MB) or paste a link."
          : "PNG or JPG, max 10 MB."
      }
    >
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={value}
          placeholder="https://… or upload"
          onChange={e => onChange(e.target.value)}
        />
        <label className="admin-button admin-button-secondary shrink-0 cursor-pointer">
          {upload.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CloudUpload className="h-4 w-4" />
          )}
          Upload
          <input
            type="file"
            accept={`${accept}/*`}
            className="hidden"
            onChange={pick}
            disabled={upload.isPending}
          />
        </label>
      </div>
      {value &&
        (accept === "audio" ? (
          <audio controls src={value} className="mt-2 w-full" />
        ) : (
          <img
            src={value}
            alt=""
            className="mt-2 max-h-48 rounded border border-gray-200"
          />
        ))}
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
  number: number;
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

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
          Q{number}
        </span>
        {types.length > 1 ? (
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
            value={question.type}
            onChange={e => {
              const type = e.target.value as MockQuestionType;
              set({
                type,
                answers: [],
                options:
                  type === "mcq"
                    ? question.options.length
                      ? question.options
                      : ["", "", "", ""]
                    : [],
              });
            }}
            aria-label="Question type"
          >
            {types.map(t => (
              <option key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
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

      {question.type === "mcq" && (
        <div className="mt-3 space-y-2">
          <span className="block text-sm font-medium text-gray-700">
            Options — select the correct one
          </span>
          {question.options.map((option, i) => {
            const letter = optionLetter(i);
            return (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${question.key}`}
                  checked={question.answers[0] === letter}
                  onChange={() => set({ answers: [letter] })}
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
          <select
            className={inputClass}
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
          </select>
        </Field>
      )}

      {question.type === "short_answer" && (
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

      {autoMarked && (
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
      )}
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
      <select
        className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
        value={question.type}
        aria-label={`Answer type for question ${number}`}
        onChange={e =>
          onChange({
            ...question,
            type: e.target.value as MockQuestionType,
            answers: [],
          })
        }
      >
        <option value="short_answer">Word / number / letter</option>
        <option value="tfng">True / False / NG</option>
        <option value="ynng">Yes / No / NG</option>
      </select>
      {FIXED_CHOICES[question.type] ? (
        <select
          className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
          value={question.answers[0] ?? ""}
          aria-label={`Answer for question ${number}`}
          onChange={e =>
            onChange({
              ...question,
              answers: e.target.value ? [e.target.value] : [],
            })
          }
        >
          <option value="">Select…</option>
          {FIXED_CHOICES[question.type]!.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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

function ImportPanel({
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
    if (!section.title.trim()) return "Every section needs a title.";
    for (const q of section.questions) {
      n += 1;
      if (!q.prompt.trim()) return `Question ${n} has no prompt.`;
      if (q.type === "mcq") {
        if (q.options.filter(o => o.trim()).length < 2)
          return `Question ${n} needs at least two options.`;
        if (!q.answers[0])
          return `Choose the correct option for question ${n}.`;
      }
      if ((q.type === "tfng" || q.type === "ynng") && !q.answers[0])
        return `Choose the correct answer for question ${n}.`;
      if (q.type === "short_answer" && !q.answers.some(a => a.trim()))
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
    });
    setSections(
      existing.sections.map(s => ({
        key: nanoid(),
        id: s.id,
        title: s.title,
        instructions: s.instructions ?? "",
        content: s.content ?? "",
        imageUrl: s.imageUrl ?? "",
        audioUrl: s.audioUrl ?? "",
        questions: s.questions.map(q => ({
          key: nanoid(),
          id: q.id,
          type: q.type,
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
      if (!testId) navigate(`/admin/mock-tests/${id}`);
    },
    onError: err => toast.error(err.message),
  });

  const questionCount = useMemo(
    () => sections.reduce((n, s) => n + s.questions.length, 0),
    [sections]
  );

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
    });
    setSections(preset ? answerSheetTemplate(module) : templateFor(module));
    setImporting(!!preset && isAutoMarkedModule(module));
  };

  // Opened from the Cambridge library grid: /admin/mock-tests/new?series=cambridge&book=18&test=2&module=listening
  const search = new URLSearchParams(useSearch());
  const [importing, setImporting] = useState(false);
  useEffect(() => {
    if (testId || settings) return;
    const module = search.get("module") as MockModule | null;
    const book = Number(search.get("book"));
    const test = Number(search.get("test"));
    if (
      module &&
      module in MODULE_LABELS &&
      search.get("series") === CAMBRIDGE.key &&
      book &&
      test
    ) {
      chooseModule(module, { series: CAMBRIDGE.key, book, test });
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
      title={testId ? "Edit Mock Test" : "New Mock Test"}
      parent={{ label: "Mock Tests", href: "/admin/mock-tests" }}
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
                sections: sections.map(s => ({
                  id: s.id,
                  title: s.title.trim(),
                  instructions: s.instructions || null,
                  content: s.content || null,
                  imageUrl: s.imageUrl || null,
                  audioUrl: s.audioUrl || null,
                  questions: s.questions.map(q => ({
                    id: q.id,
                    type: q.type,
                    // Answer-sheet questions are numbered like the book: 1…40 across all parts.
                    prompt: sheet ? `Question ${++seq}` : q.prompt.trim(),
                    options:
                      q.type === "mcq" ? q.options.map(o => o.trim()) : null,
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
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:border-gray-400"
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
        <div className="space-y-4 border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              {MODULE_LABELS[settings.module]} test settings
            </h3>
            <span className="text-sm text-gray-500">
              {questionCount} question{questionCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
              label="Content"
              hint={
                settings.format === "answer_sheet"
                  ? "Students use their own book (and its audio). Only your answer key is stored here."
                  : "Passages, audio and questions are shown on the site."
              }
            >
              <select
                className={inputClass}
                value={settings.format}
                onChange={e => {
                  const format = e.target.value as MockFormat;
                  if (
                    format === "answer_sheet" &&
                    !confirm(
                      "Switch to an answer sheet? This replaces the current sections with a blank answer sheet."
                    )
                  )
                    return;
                  setS({ format });
                  if (format === "answer_sheet")
                    setSections(answerSheetTemplate(settings.module));
                }}
              >
                <option value="full">Full test on the site</option>
                <option value="answer_sheet">
                  Answer sheet only (students use their book)
                </option>
              </select>
            </Field>
            <Field
              label="Book series"
              hint="Groups the test in the Cambridge library."
            >
              <select
                className={inputClass}
                value={settings.series ?? ""}
                onChange={e => setS({ series: e.target.value || null })}
              >
                <option value="">None — our own test</option>
                <option value={CAMBRIDGE.key}>{CAMBRIDGE.label}</option>
              </select>
            </Field>
            {settings.series === CAMBRIDGE.key && (
              <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                <Field label="Book">
                  <select
                    className={inputClass}
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
                  </select>
                </Field>
                <Field label="Test">
                  <select
                    className={inputClass}
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
                  </select>
                </Field>
              </div>
            )}
            {settings.module === "reading" && (
              <Field
                label="Reading type"
                hint="Decides which band conversion table is used."
              >
                <select
                  className={inputClass}
                  value={settings.variant}
                  onChange={e =>
                    setS({ variant: e.target.value as Settings["variant"] })
                  }
                >
                  <option value="academic">Academic</option>
                  <option value="general">General Training</option>
                </select>
              </Field>
            )}
            <Field
              label="Mode"
              hint={
                settings.mode === "exam"
                  ? "Timed, auto-submits, answers stay hidden."
                  : "No timer, answers and explanations shown after submitting."
              }
            >
              <select
                className={inputClass}
                value={settings.mode}
                onChange={e => {
                  const mode = e.target.value as Settings["mode"];
                  setS({
                    mode,
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
              </select>
            </Field>
            {settings.mode === "exam" && (
              <Field label="Time limit (minutes)">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={settings.durationMinutes ?? ""}
                  onChange={e =>
                    setS({
                      durationMinutes: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </Field>
            )}
            <Field label="Attempts allowed" hint="Leave empty for unlimited.">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={settings.maxAttempts ?? ""}
                onChange={e =>
                  setS({
                    maxAttempts: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={settings.isPublished}
                onChange={e => setS({ isPublished: e.target.checked })}
              />
              <span>Published — visible to students</span>
            </label>
          </div>
        </div>

        {importing ? (
          <ImportPanel
            module={settings.module}
            format={settings.format}
            onClose={() => setImporting(false)}
            onImport={(imported, title) => {
              if (
                sections.some(s => s.questions.some(q => q.id)) &&
                !confirm("Replace all existing sections and questions?")
              )
                return;
              setSections(imported);
              if (title?.trim()) setS({ title: title.trim() });
              setImporting(false);
              toast.success("Imported — review below, then Save test");
            }}
          />
        ) : (
          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={() => setImporting(true)}
          >
            <FileInput className="h-4 w-4" />
            {settings.format === "answer_sheet" &&
            isAutoMarkedModule(settings.module)
              ? "Paste answer key"
              : "Import test"}
          </button>
        )}

        {/* Sections */}
        {sections.map((section, sIndex) => (
          <div
            key={section.key}
            className="space-y-4 border-b border-gray-200 pb-8"
          >
            <div className="flex flex-wrap items-center gap-2">
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
                onClick={() => setSections(prev => moveItem(prev, sIndex, -1))}
                className="rounded p-1.5 hover:bg-gray-100"
                aria-label="Move section up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSections(prev => moveItem(prev, sIndex, 1))}
                className="rounded p-1.5 hover:bg-gray-100"
                aria-label="Move section down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  confirm(`Remove "${section.title}" and its questions?`) &&
                  setSections(prev => prev.filter(s => s.key !== section.key))
                }
                className="rounded p-1.5 hover:bg-red-50"
                aria-label="Remove section"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>

            <Field label="Instructions">
              <textarea
                className={inputClass}
                rows={2}
                value={section.instructions}
                onChange={e =>
                  updateSection(section.key, { instructions: e.target.value })
                }
              />
            </Field>

            {settings.module === "listening" && (
              <MediaInput
                label={
                  settings.format === "answer_sheet"
                    ? "Audio for this part (optional — students can use the book's audio)"
                    : "Audio for this part"
                }
                accept="audio"
                value={section.audioUrl}
                onChange={url => updateSection(section.key, { audioUrl: url })}
              />
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

            <div className="space-y-3">
              {section.questions.map((question, qIndex) => {
                running += 1;
                if (
                  settings.format === "answer_sheet" &&
                  isAutoMarkedModule(settings.module)
                ) {
                  const number = running;
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
                    number={running}
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
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={() => {
                  const last = section.questions[section.questions.length - 1];
                  const type = last?.type ?? defaultType;
                  updateSection(section.key, {
                    questions: [
                      ...section.questions,
                      newQuestion(type, {
                        prompt:
                          settings.format === "answer_sheet" &&
                          isAutoMarkedModule(settings.module)
                            ? `Question ${questionCount + 1}`
                            : "",
                        minWords: last?.minWords ?? null,
                        prepSeconds: last?.prepSeconds ?? null,
                        responseSeconds: last?.responseSeconds ?? null,
                      }),
                    ],
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                Add question
              </button>
            </div>
          </div>
        ))}

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
      </div>
    </div>
  );
}
