/**
 * AdminMockTestEditor — build a mock test: settings, sections (passages / parts / tasks) and questions.
 * Routes: /admin/ielts/new and /admin/ielts/:id
 */
import {
  Fragment,
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
  Eye,
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
  BUILDER_QUESTION_TYPES,
  CAMBRIDGE,
  CHOICE_SELECTION_COUNTS,
  DEFAULT_DURATION_MINUTES,
  FIXED_CHOICES,
  LISTENING_QUESTION_TYPES,
  LISTENING_TYPE_INSTRUCTIONS,
  MODULE_LABELS,
  MODULE_QUESTION_TYPES,
  PAPER_LAYOUT,
  QUESTION_TYPE_LABELS,
  READING_TYPE_INSTRUCTIONS,
  cambridgeTitle,
  choiceSelectionCount,
  isCompletionType,
  isAutoMarkedModule,
  optionIndex,
  optionKey,
  optionLetter,
  parseAnswerKey,
  type MockFormat,
  type MockModule,
  type MockQuestionType,
} from "@shared/mock";
import { MODULE_BLURB, MODULE_ICONS } from "./AdminMockTests";
import AdminSelect from "@/components/AdminSelect";
import AdminImageUploader from "@/components/AdminImageUploader";
import MediaPicker from "@/components/MediaPicker";
import ListeningLayoutBuilder from "@/components/ListeningLayoutBuilder";
import {
  isHtmlLayout,
  joinLayoutGroups,
  layoutBoxNumbers,
  legacyLayoutToHtml,
  type LayoutGroup,
} from "@/lib/listeningLayout";
import RichLayoutEditor from "@/components/RichLayoutEditor";
import InstructionInput from "@/components/InstructionInput";
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
  /** Speaking: the examiner asking the question. */
  audioUrl: string;
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
  /** Speaking: default timers for the part's new questions (not saved on the section). */
  prepSeconds?: number | null;
  responseSeconds?: number | null;
};

type Settings = {
  title: string;
  description: string;
  module: MockModule;
  variant: "academic" | "general";
  /** Time limit for timed exam attempts; practice attempts are untimed */
  durationMinutes: number | null;
  maxAttempts: number | null;
  isPublished: boolean;
  format: MockFormat;
  series: string | null;
  bookNumber: number | null;
  testNumber: number | null;
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
    audioUrl: "",
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

/**
 * Older Writing tests kept the task in the question prompt and optional plain-text context.
 * Both now live in the section's rich text, so fold them in when such a test is opened.
 */
function withWritingTask(
  module: MockModule,
  section: SectionDraft
): SectionDraft {
  if (module !== "writing") return section;
  const prompts = section.questions
    .map(question => question.prompt.trim())
    .filter(Boolean);
  if (!prompts.length) return section;
  const content = section.content.trim();
  return {
    ...section,
    content:
      prompts.map(prompt => legacyLayoutToHtml(prompt)).join("") +
      (isHtmlLayout(content) ? content : legacyLayoutToHtml(content)),
    questions: section.questions.map(question => ({ ...question, prompt: "" })),
  };
}

/** Index of Speaking Part 2, whose questions use the part's rich text as their cue card. */
const SPEAKING_CUE_CARD_PART = 1;

/**
 * A full Speaking part has rich-text content (all its questions, or the cue card) and its
 * individual questions, each with its own text, timers, examiner audio and recording.
 */
/** Opening a full Speaking test: new questions default to the first question's timers; older plain-text notes become rich text. */
function withSpeakingPart(
  module: MockModule,
  format: Settings["format"],
  section: SectionDraft
): SectionDraft {
  if (module !== "speaking" || format !== "full") return section;
  const first = section.questions[0];
  const content = section.content.trim();
  return {
    ...section,
    prepSeconds: first?.prepSeconds ?? null,
    responseSeconds: first?.responseSeconds ?? null,
    content:
      !content || isHtmlLayout(content) ? content : legacyLayoutToHtml(content),
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

function questionNumberLabel(
  sections: SectionDraft[],
  sectionIndex: number,
  questionIndex: number
) {
  const first = questionStartNumber(sections, sectionIndex, questionIndex);
  const question = sections[sectionIndex]?.questions[questionIndex];
  const span = Math.max(1, choiceSelectionCount(question?.type ?? "mcq"));
  return span > 1 ? `${first}–${first + span - 1}` : String(first);
}

const LABELING_TYPES: MockQuestionType[] = [
  "map_labeling",
  "plan_labeling",
  "visual_labeling",
  "diagram_labeling",
];

/** Labeling on an image with a letter grid. Visual labeling works like matching instead (worded options). */
const GRID_LABELING_TYPES: MockQuestionType[] = [
  "map_labeling",
  "plan_labeling",
  "diagram_labeling",
];
/**
 * The options are just letters: on the image for a map or plan, or paragraph letters for
 * Matching Information (a diagram's options have text).
 */
const LETTER_ONLY_TYPES: MockQuestionType[] = [
  "map_labeling",
  "plan_labeling",
  "matching_information",
];

/** Reading's matching types: items that share one option list, like Listening matching. */
const MATCHING_TYPES: MockQuestionType[] = [
  "matching",
  "matching_features",
  "matching_information",
  "matching_sentence_endings",
  "matching_headings",
];

/** What the option list and the items are called for each matching type. */
const MATCHING_WORDS: Partial<
  Record<
    MockQuestionType,
    { options: string; items: string; answer: string; placeholder: string }
  >
> = {
  matching_features: {
    options: "List of options",
    items: "Statements",
    answer: "option",
    placeholder: "Statement students match to an option",
  },
  matching_information: {
    options: "Paragraph letters",
    items: "Statements",
    answer: "paragraph",
    placeholder: "Information students find in a paragraph",
  },
  matching_sentence_endings: {
    options: "List of endings",
    items: "Sentence beginnings",
    answer: "ending",
    placeholder: "Beginning of the sentence",
  },
  matching_headings: {
    options: "List of headings",
    items: "Paragraphs",
    answer: "heading",
    placeholder: "e.g. Paragraph A",
  },
};

/** Listening types whose correct answer is set in step 2, next to the question itself. */
function answersInStepTwo(type: MockQuestionType) {
  return (
    MATCHING_TYPES.includes(type) ||
    LABELING_TYPES.includes(type) ||
    isCompletionType(type)
  );
}

/**
 * Question numbers run across parts, so a removed or resized question shifts the [[n]]
 * answer boxes after it. A removed question's own box goes with it.
 */
function renumberLayouts(before: SectionDraft[], after: SectionDraft[]) {
  const numbers = (sections: SectionDraft[]) => {
    const byKey = new Map<string, number>();
    sections.forEach((section, sectionIndex) =>
      section.questions.forEach((question, questionIndex) =>
        byKey.set(
          question.key,
          questionStartNumber(sections, sectionIndex, questionIndex)
        )
      )
    );
    return byKey;
  };
  const oldNumbers = numbers(before);
  const newNumbers = numbers(after);
  const moved = new Map<number, number>();
  const removed = new Set<number>();
  oldNumbers.forEach((number, key) => {
    const next = newNumbers.get(key);
    if (next !== undefined) moved.set(number, next);
    else removed.add(number);
  });
  const renumber = (text: string) =>
    text
      .replace(
        /(?:<span data-answer-box(?:="")?>)?\[\[(\d+)\]\](?:<\/span>)?/g,
        (match, number) => (removed.has(Number(number)) ? "" : match)
      )
      .replace(/\[\[(\d+)\]\]/g, (match, number) =>
        moved.has(Number(number)) ? `[[${moved.get(Number(number))}]]` : match
      );
  // Layouts hold completion boxes; a reading passage holds Matching Headings boxes.
  return after.map(section => ({
    ...section,
    questionLayout: section.questionLayout
      ? renumber(section.questionLayout)
      : section.questionLayout,
    content: section.content ? renumber(section.content) : section.content,
  }));
}

/**
 * Applies edited completion layouts to a section: every answer box is a question,
 * numbered in the order the boxes appear. A new box adds a question of its group's type,
 * a deleted box removes its question, and the numbers after it move up or down.
 */
function syncLayoutGroups(
  sections: SectionDraft[],
  sectionIndex: number,
  groups: LayoutGroup[],
  fallbackType: MockQuestionType
): SectionDraft[] {
  const section = sections[sectionIndex];
  const byNumber = new Map<number, QuestionDraft>();
  section.questions.forEach((question, questionIndex) => {
    if (isCompletionType(question.type))
      byNumber.set(
        questionStartNumber(sections, sectionIndex, questionIndex),
        question
      );
  });
  const placedBefore = new Set(
    layoutBoxNumbers(section.questionLayout ?? "").flatMap(number => {
      const question = byNumber.get(number);
      return question ? [question.key] : [];
    })
  );

  const used = new Set<string>();
  const members = groups.map(group => {
    const list: QuestionDraft[] = [];
    for (const number of layoutBoxNumbers(group.html)) {
      const existing = byNumber.get(number);
      if (existing && !used.has(existing.key)) {
        used.add(existing.key);
        list.push(existing);
        continue;
      }
      // A copied box or one restored by undo becomes a new question too.
      const previous = list.at(-1);
      const type =
        (group.type as MockQuestionType | null) ??
        previous?.type ??
        fallbackType;
      list.push(
        newQuestion(type, {
          prompt: `${QUESTION_TYPE_LABELS[type]} question`,
          // A flow chart's new box joins the previous box's option list (A–F).
          ...(type === "flow_chart_completion" &&
            previous?.type === type && { options: [...previous.options] }),
        })
      );
    }
    // The group's instruction sits on its first question.
    const instruction = group.instruction;
    return list.map((question, index) =>
      index === 0
        ? { ...question, instruction }
        : instruction.trim() && question.instruction === instruction
          ? { ...question, instruction: "" }
          : question
    );
  });

  // Each group keeps the places its questions had; new ones go after its last place.
  let questions = [...section.questions];
  members.forEach(list => {
    const keys = new Set(list.map(question => question.key));
    const slots = questions.flatMap((question, index) =>
      keys.has(question.key) ? [index] : []
    );
    if (!slots.length) {
      questions.push(...list);
      return;
    }
    slots.forEach((slot, index) => (questions[slot] = list[index]));
    questions.splice(slots.at(-1)! + 1, 0, ...list.slice(slots.length));
  });
  questions = questions.filter(
    question => used.has(question.key) || !placedBefore.has(question.key)
  );

  const after = renumberLayouts(
    sections,
    sections.map((item, index) =>
      index === sectionIndex ? { ...item, questions } : item
    )
  );
  const numberOf = new Map(
    questions.map((question, index) => [
      question.key,
      questionStartNumber(after, sectionIndex, index),
    ])
  );
  const questionLayout = joinLayoutGroups(
    groups.map((group, groupIndex) => {
      let box = 0;
      return {
        ...group,
        // Kept on the layout only until the group has a question to hold it.
        instruction: members[groupIndex].length ? "" : group.instruction,
        html: group.html.replace(
          /\[\[\d+\]\]/g,
          () => `[[${numberOf.get(members[groupIndex][box++].key)}]]`
        ),
      };
    })
  );
  return after.map((item, index) =>
    index === sectionIndex ? { ...item, questionLayout } : item
  );
}

/** Matching and labeling questions are edited as groups that share one option list. */
function isGroupedType(type: MockQuestionType) {
  return MATCHING_TYPES.includes(type) || LABELING_TYPES.includes(type);
}

const mapLetters = (count: number) =>
  Array.from({ length: count }, (_, index) => optionLetter(index));

/**
 * Start index → length of each run of grouped questions. A new run starts when the type
 * changes or at a question with its own instruction.
 */
function matchingGroups(questions: QuestionDraft[]) {
  const groups = new Map<number, number>();
  let start = -1;
  questions.forEach((question, index) => {
    if (!isGroupedType(question.type)) {
      start = -1;
      return;
    }
    if (
      start < 0 ||
      question.type !== questions[start].type ||
      question.instruction.trim()
    ) {
      start = index;
      groups.set(start, 0);
    }
    groups.set(start, (groups.get(start) ?? 0) + 1);
  });
  return groups;
}

function templateFor(module: MockModule): SectionDraft[] {
  switch (module) {
    case "reading":
      return [1, 2, 3].map(n =>
        newSection(`Passage ${n}`, [], {
          instructions: "Read the passage and answer the questions below.",
        })
      );
    case "listening":
      return [1, 2, 3, 4].map(n => newSection(`Part ${n}`, []));
    case "writing":
      return [
        newSection("Task 1", [newQuestion("writing", { minWords: 150 })], {
          instructions:
            "You should spend about 20 minutes on this task. Write at least 150 words.",
          content:
            "<p>Summarise the information by selecting and reporting the main features, and make comparisons where relevant.</p>",
        }),
        newSection("Task 2", [newQuestion("writing", { minWords: 250 })], {
          instructions:
            "You should spend about 40 minutes on this task. Write at least 250 words.",
        }),
      ];
    case "speaking":
      // Each part's content and questions are added in the editor; these are the default timers for its questions.
      return [
        newSection("Part 1 — Introduction", [], { responseSeconds: 30 }),
        newSection(
          "Part 2 — Long turn",
          [newQuestion("speaking", { prepSeconds: 60, responseSeconds: 120 })],
          {
            instructions:
              "You have one minute to prepare, then speak for up to two minutes.",
            prepSeconds: 60,
            responseSeconds: 120,
          }
        ),
        newSection("Part 3 — Discussion", [], { responseSeconds: 60 }),
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
      newSection("Task 1", [newQuestion("writing", { minWords: 150 })], {
        instructions:
          "You should spend about 20 minutes on this task. Write at least 150 words.",
        content: "<p>Answer Writing Task 1 from your book.</p>",
      }),
      newSection("Task 2", [newQuestion("writing", { minWords: 250 })], {
        instructions:
          "You should spend about 40 minutes on this task. Write at least 250 words.",
        content: "<p>Answer Writing Task 2 from your book.</p>",
      }),
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
  "w-full rounded-[var(--radius-control)] border border-[var(--admin-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--admin-heading)] outline-none transition-colors hover:border-[var(--admin-body)] focus:border-[var(--admin-primary)]";

function Field({
  label,
  hint,
  children,
  className,
  group = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  /**
   * Wraps a whole editor rather than one input. Renders a <div>: a <label> would forward
   * every click inside it to its first control, stealing focus from rich text and buttons.
   */
  group?: boolean;
}) {
  const Wrapper = group ? "div" : "label";
  return (
    <Wrapper className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </Wrapper>
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
  const [pickerOpen, setPickerOpen] = useState(false);
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

  if (accept === "image") {
    return (
      <Field group label={label} hint="PNG or JPG, max 10 MB.">
        <AdminImageUploader
          value={value}
          label={label}
          maxSizeLabel="Max 10 MB"
          uploading={upload.isPending}
          onChange={pick}
          onMediaSelect={onChange}
          onRemove={() => onChange("")}
        />
      </Field>
    );
  }

  return (
    <Field group label={label}>
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={upload.isPending}
                className="text-xs font-semibold text-[#c76f42] hover:underline"
              >
                Replace audio
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={upload.isPending}
                className="text-xs font-semibold text-gray-500 hover:underline"
              >
                Upload new
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={upload.isPending}
            className="flex flex-col items-center text-center"
          >
            {upload.isPending ? (
              <Loader2 className="mb-5 h-6 w-6 animate-spin text-[#c76f42]" />
            ) : (
              <CloudUpload className="mb-5 h-6 w-6 stroke-[1.4] text-[#c76f42]" />
            )}
            <span className="text-sm font-semibold text-[#30363d]">
              {upload.isPending
                ? "Uploading audio…"
                : "Choose from media or upload"}
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
        {pickerOpen && (
          <MediaPicker
            label={label}
            kind="audio"
            onSelect={url => {
              onChange(url);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
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
  part,
  typeOptions,
}: {
  number: number | string;
  question: QuestionDraft;
  module: MockModule;
  onChange: (q: QuestionDraft) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  /**
   * Listening builder split: "content" writes the question (step 2), "answers" marks it (step 3).
   * Either one fixes the type and order. Omit for the full editor.
   */
  part?: "content" | "answers";
  /** Types the dropdown offers; defaults to every type of the module. */
  typeOptions?: MockQuestionType[];
}) {
  const locked = part !== undefined;
  const editable = !locked || part === "content";
  const set = (patch: Partial<QuestionDraft>) =>
    onChange({ ...question, ...patch });
  const types = typeOptions ?? MODULE_QUESTION_TYPES[module];
  const fixed = FIXED_CHOICES[question.type];
  const autoMarked = AUTO_MARKED_TYPES.includes(question.type);
  const selectionCount = CHOICE_SELECTION_COUNTS[question.type] ?? 0;
  // In the listening builder these are answered while writing (step 2); step 3 only adds the explanation.
  const answeredInline = locked && answersInStepTwo(question.type);

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
          Q{number}
        </span>
        {types.length > 1 && editable ? (
          <AdminSelect
            value={question.type}
            onChange={e => {
              const type = e.target.value as MockQuestionType;
              set({
                type,
                answers: [],
                points: Math.max(1, choiceSelectionCount(type)),
                options: LETTER_ONLY_TYPES.includes(type)
                  ? mapLetters(9)
                  : choiceSelectionCount(type)
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
        {editable && (
          <div className="ml-auto flex items-center gap-1">
            {!locked && (
              <>
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
              </>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="rounded p-1.5 hover:bg-red-50"
              aria-label="Remove question"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}
      </div>

      {part === "answers" &&
        !isCompletionType(question.type) &&
        question.prompt && (
          <p className="mb-3 text-sm text-[var(--admin-heading)]">
            {question.prompt}
          </p>
        )}

      {(module === "listening" ||
        module === "speaking" ||
        part === "content") &&
        part !== "answers" && (
          <Field
            label="Instructions"
            hint="Shown before this question. For a group, keep this on the first question only."
            className="mb-3"
          >
            <InstructionInput
              value={question.instruction}
              onChange={instruction => set({ instruction })}
            />
          </Field>
        )}

      {part !== "answers" && (
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
              question.type === "writing" || question.type === "speaking"
                ? 4
                : 2
            }
            value={question.prompt}
            onChange={e => set({ prompt: e.target.value })}
          />
        </Field>
      )}

      {part === "answers" && answeredInline ? (
        <p className="text-sm text-[var(--admin-body)]">
          Answer:{" "}
          {question.answers.some(answer => answer.trim()) ? (
            <strong className="font-medium text-[var(--admin-heading)]">
              {isCompletionType(question.type) || !question.options.length
                ? question.answers.filter(answer => answer.trim()).join(" / ")
                : question.answers
                    .map(letter => {
                      const option =
                        question.options[optionIndex(question.type, letter)];
                      return option ? `${letter} · ${option}` : letter;
                    })
                    .join(", ")}
            </strong>
          ) : (
            <span className="text-red-600">not set — add it in step 2</span>
          )}
        </p>
      ) : (
        selectionCount > 0 && (
          <div className="mt-3 space-y-2">
            <span className="block text-sm font-medium text-gray-700">
              {part === "content" && !answeredInline
                ? "Options"
                : `${part === "answers" ? "Select" : "Options — select"} ${
                    selectionCount === 1
                      ? "the correct one"
                      : `${selectionCount} correct answers`
                  }`}
            </span>
            {question.options.map((option, i) => {
              const letter = optionLetter(i);
              return (
                <div key={i} className="flex items-center gap-2">
                  {(part !== "content" || answeredInline) && (
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
                          ? [...question.answers, letter].slice(
                              0,
                              selectionCount
                            )
                          : question.answers.filter(
                              answer => answer !== letter
                            );
                        set({ answers });
                      }}
                      aria-label={`Mark option ${letter} correct`}
                    />
                  )}
                  <span className="w-5 text-sm font-bold text-gray-500">
                    {letter}
                  </span>
                  {part === "answers" ? (
                    <span className="text-sm text-[var(--admin-heading)]">
                      {option || (
                        <span className="text-[var(--admin-placeholder)]">
                          (empty)
                        </span>
                      )}
                    </span>
                  ) : (
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
                  )}
                  {part !== "answers" && question.options.length > 2 && (
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
            {part !== "answers" && question.options.length < 10 && (
              <button
                type="button"
                className="text-sm font-medium text-red-600 hover:underline"
                onClick={() => set({ options: [...question.options, ""] })}
              >
                + Add option
              </button>
            )}
          </div>
        )
      )}

      {part !== "content" && fixed && (
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

      {!locked && isCompletionType(question.type) && (
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

      {part === "content" ? null : autoMarked ? (
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

/**
 * One editor for a run of matching questions: a shared option list (A, B, C…)
 * and one row per numbered item. Every item keeps its own copy of the options.
 */
function MatchingGroupEditor({
  firstNumber,
  questions,
  canAddItem,
  onChange,
  onRemove,
  media,
}: {
  firstNumber: number;
  questions: QuestionDraft[];
  canAddItem: boolean;
  onChange: (questions: QuestionDraft[]) => void;
  onRemove: () => void;
  /** Labeling groups: the map / plan / diagram upload. */
  media?: ReactNode;
}) {
  const [first] = questions;
  const labeling = GRID_LABELING_TYPES.includes(first.type);
  const lettersOnly = LETTER_ONLY_TYPES.includes(first.type);
  const words = MATCHING_WORDS[first.type];
  const key = (index: number) => optionKey(first.type, index);
  const diagram = first.type === "diagram_labeling";
  const options = first.options;
  // Reading diagrams: students write words from the passage, so there is no option list.
  const written = diagram && options.length === 0;
  const setOptions = (next: string[], resetAnswers = false) =>
    onChange(
      questions.map(question => ({
        ...question,
        options: next,
        answers: resetAnswers ? [] : question.answers,
      }))
    );
  const setItem = (index: number, patch: Partial<QuestionDraft>) =>
    onChange(
      questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question
      )
    );
  const lastNumber = firstNumber + questions.length - 1;

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
          Q{firstNumber}
          {lastNumber > firstNumber ? `–${lastNumber}` : ""}
        </span>
        <span className="text-sm text-gray-600">
          {QUESTION_TYPE_LABELS[first.type]}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded p-1.5 hover:bg-red-50"
          aria-label="Remove question group"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>

      <Field label="Instructions" className="mb-4">
        <InstructionInput
          value={first.instruction}
          onChange={instruction =>
            onChange([{ ...first, instruction }, ...questions.slice(1)])
          }
        />
      </Field>

      {written ? (
        <div className="space-y-5">
          {media}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">
              Correct answer for each number on the diagram
            </span>
            <span className="block text-xs text-[#747d87]">
              Students type a word from the passage. Separate alternative
              answers with “/”, e.g. cover / lid.
            </span>
            {questions.map((question, i) => (
              <div key={question.key} className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-sm font-bold text-gray-500">
                  Q{firstNumber + i}
                </span>
                <input
                  className={inputClass}
                  value={question.answers.join(" / ")}
                  placeholder="Accepted answer"
                  aria-label={`Accepted answers for question ${firstNumber + i}`}
                  onChange={e =>
                    setItem(i, {
                      answers: e.target.value
                        .split("/")
                        .map(answer => answer.trimStart()),
                    })
                  }
                />
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="rounded p-1.5 hover:bg-red-50"
                    aria-label={`Remove question ${firstNumber + i}`}
                    onClick={() =>
                      onChange(
                        questions
                          .filter((_, j) => j !== i)
                          .map((item, j) =>
                            j === 0
                              ? { ...item, instruction: first.instruction }
                              : item
                          )
                      )
                    }
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}
            {canAddItem && (
              <button
                type="button"
                className="text-sm font-medium text-red-600 hover:underline"
                onClick={() =>
                  onChange([
                    ...questions,
                    newQuestion(first.type, { options: [] }),
                  ])
                }
              >
                + Add another number
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            {labeling && media}
            {lettersOnly ? (
              <Field
                label={words?.options ?? "Letters on the image"}
                hint="Students choose from these letters for every item."
              >
                <AdminSelect
                  value={options.length}
                  onChange={e =>
                    setOptions(mapLetters(Number(e.target.value)), true)
                  }
                >
                  {Array.from({ length: 11 }, (_, index) => index + 2).map(
                    count => (
                      <option key={count} value={count}>
                        A–{optionLetter(count - 1)} ({count} letters)
                      </option>
                    )
                  )}
                </AdminSelect>
              </Field>
            ) : (
              <div className="space-y-2">
                <span className="block text-sm font-medium text-gray-700">
                  {words?.options ?? "Options"}
                </span>
                {options.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-sm font-bold text-gray-500">
                      {key(i)}
                    </span>
                    <input
                      className={inputClass}
                      value={option}
                      placeholder={`Option ${key(i)}`}
                      onChange={e =>
                        setOptions(
                          options.map((o, j) => (j === i ? e.target.value : o))
                        )
                      }
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        className="rounded p-1.5 hover:bg-red-50"
                        aria-label={`Remove option ${key(i)}`}
                        onClick={() =>
                          setOptions(
                            options.filter((_, j) => j !== i),
                            true
                          )
                        }
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 10 && (
                  <button
                    type="button"
                    className="text-sm font-medium text-red-600 hover:underline"
                    onClick={() => setOptions([...options, ""])}
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">
              {words
                ? `${words.items} · correct ${words.answer}`
                : `${
                    diagram
                      ? "Numbered parts"
                      : labeling
                        ? "Places to label"
                        : "Items to match"
                  } · correct ${labeling ? "letter" : "option"}`}
            </span>
            {questions.map((question, i) => (
              <div key={question.key} className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-sm font-bold text-gray-500">
                  {firstNumber + i}
                </span>
                <input
                  className={inputClass}
                  value={question.prompt}
                  placeholder={
                    words
                      ? words.placeholder
                      : diagram
                        ? "Label (optional — the number is on the diagram)"
                        : labeling
                          ? "e.g. Exhibition"
                          : "Item students match to an option"
                  }
                  onChange={e => setItem(i, { prompt: e.target.value })}
                />
                <AdminSelect
                  value={question.answers[0] ?? ""}
                  onChange={e =>
                    setItem(i, {
                      answers: e.target.value ? [e.target.value] : [],
                    })
                  }
                  className="w-[92px] shrink-0"
                  aria-label={`Correct option for item ${firstNumber + i}`}
                >
                  <option value="">Ans</option>
                  {options.map((_, j) => (
                    <option key={j} value={key(j)}>
                      {key(j)}
                    </option>
                  ))}
                </AdminSelect>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="rounded p-1.5 hover:bg-red-50"
                    aria-label={`Remove item ${firstNumber + i}`}
                    onClick={() =>
                      onChange(
                        questions
                          .filter((_, j) => j !== i)
                          .map((item, j) =>
                            j === 0
                              ? { ...item, instruction: first.instruction }
                              : item
                          )
                      )
                    }
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}
            {canAddItem && (
              <button
                type="button"
                className="text-sm font-medium text-red-600 hover:underline"
                onClick={() =>
                  onChange([
                    ...questions,
                    newQuestion(first.type, { options: [...options] }),
                  ])
                }
              >
                + Add item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Accepted answers for a written completion box, separated by “/”. */
function CompletionAnswerInput({
  number,
  answers,
  onChange,
}: {
  number: number;
  answers: string[];
  onChange: (answers: string[]) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-sm font-bold text-gray-500">
        Q{number}
      </span>
      <input
        className={inputClass}
        value={answers.join(" / ")}
        placeholder="Accepted answers, e.g. library / the library"
        onChange={e =>
          onChange(e.target.value.split("/").map(answer => answer.trimStart()))
        }
      />
    </label>
  );
}

/**
 * Start index → length of each run of flow-chart boxes. A run shares one option list;
 * an instruction starts a new run.
 */
function flowChartGroups(questions: QuestionDraft[]) {
  const groups = new Map<number, number>();
  let start = -1;
  questions.forEach((question, index) => {
    if (question.type !== "flow_chart_completion") {
      start = -1;
      return;
    }
    if (start < 0 || question.instruction.trim()) start = index;
    groups.set(start, (groups.get(start) ?? 0) + 1);
  });
  return groups;
}

/**
 * Optional A, B, C… box for a flow chart. With options, students drag a letter into
 * each box; without, they write words.
 */
function FlowChartOptionsEditor({
  firstNumber,
  lastNumber,
  options,
  onChange,
}: {
  firstNumber: number;
  lastNumber: number;
  options: string[];
  onChange: (options: string[], resetAnswers: boolean) => void;
}) {
  return (
    <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--admin-border)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#30363d]">
          Flow chart Q{firstNumber}
          {lastNumber > firstNumber ? `–${lastNumber}` : ""} · options box
        </span>
        {options.length === 0 ? (
          <button
            type="button"
            className="text-sm font-medium text-[var(--admin-primary)] hover:underline"
            onClick={() => onChange(["", ""], true)}
          >
            + Options box
          </button>
        ) : (
          <button
            type="button"
            className="text-sm font-medium text-[#747d87] hover:text-[#30363d]"
            onClick={() =>
              confirm(
                "Remove the options box? Students will write words instead."
              ) && onChange([], true)
            }
          >
            Remove options box
          </button>
        )}
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-[#747d87]">
          Students write words in each box. Add an options box when they choose
          letters from a list instead.
        </p>
      ) : (
        <>
          {options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-sm font-bold text-gray-500">
                {optionLetter(i)}
              </span>
              <input
                className={inputClass}
                value={option}
                placeholder={`Option ${optionLetter(i)}`}
                onChange={e =>
                  onChange(
                    options.map((o, j) => (j === i ? e.target.value : o)),
                    false
                  )
                }
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className="rounded p-1.5 hover:bg-red-50"
                  aria-label={`Remove option ${optionLetter(i)}`}
                  onClick={() =>
                    onChange(
                      options.filter((_, j) => j !== i),
                      true
                    )
                  }
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button
              type="button"
              className="text-sm font-medium text-red-600 hover:underline"
              onClick={() => onChange([...options, ""], false)}
            >
              + Add option
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Speaking's add flow, as in the Reading and Listening builders: instructions, then how many. */
function SpeakingQuestionAdder({
  hasQuestions,
  onAdd,
}: {
  hasQuestions: boolean;
  onAdd: (count: number, instruction: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [instruction, setInstruction] = useState("");

  if (!open)
    return (
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--admin-border)] px-5 py-8 text-sm font-medium text-[#30363d] transition-colors hover:border-[#c76f42] hover:text-[#c76f42]"
        onClick={() => {
          setInstruction("");
          setCount(1);
          setOpen(true);
        }}
      >
        <Plus className="h-4 w-4" />
        {hasQuestions ? "Add more questions" : "Add question"}
      </button>
    );

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4 sm:p-5">
      <div>
        <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#30363d]">
          Instructions for these questions
          <button
            type="button"
            className="text-xs font-medium text-[#747d87] hover:text-[#30363d]"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </span>
        <InstructionInput value={instruction} onChange={setInstruction} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
        <label>
          <span className="mb-1.5 block text-xs font-medium text-[#30363d]">
            How many?
          </span>
          <AdminSelect
            value={count}
            onChange={event => setCount(Number(event.target.value))}
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map(amount => (
              <option key={amount} value={amount}>
                {amount}
              </option>
            ))}
          </AdminSelect>
        </label>
        <button
          type="button"
          className="admin-button admin-button-secondary sm:justify-self-start"
          onClick={() => {
            onAdd(count, instruction);
            setOpen(false);
          }}
        >
          <Plus className="h-4 w-4" /> Add {count}{" "}
          {count === 1 ? "question" : "questions"}
        </button>
      </div>
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
          className="h-9 rounded-[var(--radius-control)] border border-[var(--admin-border)] bg-transparent px-3 text-sm outline-none transition-colors hover:border-[var(--admin-body)] focus:border-[var(--admin-primary)]"
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
  for (const [sectionIndex, section] of sections.entries()) {
    // Part 2's questions take their cue card from the part's rich text.
    const cueCardPart =
      settings.module === "speaking" &&
      settings.format === "full" &&
      sectionIndex === SPEAKING_CUE_CARD_PART;
    if (cueCardPart && !section.content.trim())
      return `${section.title} needs its cue card.`;
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
    if (
      settings.module === "listening" &&
      settings.format === "full" &&
      section.questions.reduce(
        (total, question) =>
          total + Math.max(1, choiceSelectionCount(question.type)),
        0
      ) < 10
    )
      return `${section.title} needs 10 questions before its answers can be added.`;
    if (
      settings.module === "speaking" &&
      settings.format === "full" &&
      !section.questions.length
    )
      return `${section.title} needs at least one question.`;
    if (
      settings.module === "writing" &&
      !section.content.trim() &&
      !section.questions.some(q => q.prompt.trim())
    )
      return `${section.title} needs its task.`;
    for (const q of section.questions) {
      n += 1;
      if (
        !q.prompt.trim() &&
        q.type !== "diagram_labeling" &&
        q.type !== "writing" &&
        !cueCardPart
      )
        return `Question ${n} has no prompt.`;
      const selectionCount = choiceSelectionCount(q.type);
      if (q.type === "diagram_labeling" && !q.options.length) {
        if (!q.answers.some(a => a.trim()))
          return `Add at least one accepted answer for question ${n}.`;
      } else if (selectionCount) {
        if (q.options.filter(o => o.trim()).length < 2)
          return `Question ${n} needs at least two options.`;
        if (q.answers.length !== selectionCount)
          return `Choose ${selectionCount} correct ${selectionCount === 1 ? "option" : "options"} for question ${n}.`;
      }
      if ((q.type === "tfng" || q.type === "ynng") && !q.answers[0])
        return `Choose the correct answer for question ${n}.`;
      if (
        q.type === "flow_chart_completion" &&
        q.options.length &&
        q.options.filter(o => o.trim()).length < 2
      )
        return `Question ${n}'s options box needs at least two options.`;
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
      durationMinutes:
        existing.durationMinutes ?? DEFAULT_DURATION_MINUTES[existing.module],
      maxAttempts: existing.maxAttempts,
      isPublished: existing.isPublished,
      format: existing.format,
      series: existing.series,
      bookNumber: existing.bookNumber,
      testNumber: existing.testNumber,
    });
    setSections(
      existing.sections.map(s =>
        withSpeakingPart(
          existing.module,
          existing.format ?? "full",
          withWritingTask(existing.module, {
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
              audioUrl: q.audioUrl ?? "",
            })),
          })
        )
      )
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
      durationMinutes: DEFAULT_DURATION_MINUTES[module],
      maxAttempts: null,
      isPublished: false,
      format: preset ? "answer_sheet" : "full",
      series: preset?.series ?? null,
      bookNumber: preset?.book ?? null,
      testNumber: preset?.test ?? null,
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
          <div className="flex items-center gap-2">
            {testId && (
              <a
                href={`/admin/ielts/preview/${testId}`}
                target="_blank"
                rel="noopener"
                title="Opens the last saved version as students see it"
                className="admin-button admin-button-secondary"
              >
                <Eye className="h-4 w-4" />
                Preview
              </a>
            )}
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
                    description: settings.description || null,
                  },
                  sections: sections.map((s, sectionIndex) => ({
                    id: s.id,
                    title:
                      settings.module === "listening"
                        ? `Part ${sectionIndex + 1}`
                        : settings.module === "reading"
                          ? `Passage ${sectionIndex + 1}`
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
                      options:
                        choiceSelectionCount(q.type) ||
                        (q.type === "flow_chart_completion" &&
                          q.options.some(o => o.trim()))
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
                      audioUrl:
                        q.type === "speaking" ? q.audioUrl || null : null,
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
          </div>
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
  const updateQuestions = (key: string, questions: QuestionDraft[]) =>
    setSections(prev =>
      renumberLayouts(
        prev,
        prev.map(s => (s.key === key ? { ...s, questions } : s))
      )
    );
  const moveItem = <T,>(list: T[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  };
  const defaultType = MODULE_QUESTION_TYPES[settings.module][0];
  // Full Listening and Reading tests are built with the question builder (types, layout, answer key).
  const usesBuilder =
    settings.format === "full" &&
    (settings.module === "listening" || settings.module === "reading");
  let running = 0;

  /** Questions for a full Listening part or Reading passage: types, grouped editors and the rich-text layout. */
  const questionBuilder = (section: SectionDraft, sIndex: number) => {
    const module = settings.module === "reading" ? "reading" : "listening";
    const builderTypes: readonly MockQuestionType[] =
      BUILDER_QUESTION_TYPES[module];
    const sectionTotal = (item: SectionDraft) =>
      item.questions.reduce(
        (total, question) =>
          total + Math.max(1, choiceSelectionCount(question.type)),
        0
      );
    // 10 questions per Listening part; a Reading test has 40 across its passages.
    const maxQuestions =
      module === "listening"
        ? 10
        : 40 -
          sections.reduce(
            (total, item, index) =>
              index === sIndex ? total : total + sectionTotal(item),
            0
          );
    const questionEditors = section.questions.map((question, questionIndex) => {
      const partTotal = section.questions.reduce(
        (total, item) => total + Math.max(1, choiceSelectionCount(item.type)),
        0
      );
      if (isGroupedType(question.type)) {
        const length = matchingGroups(section.questions).get(questionIndex);
        if (!length) return null;
        const replaceGroup = (next: QuestionDraft[]) =>
          updateQuestions(section.key, [
            ...section.questions.slice(0, questionIndex),
            ...next,
            ...section.questions.slice(questionIndex + length),
          ]);
        return (
          <MatchingGroupEditor
            key={question.key}
            firstNumber={questionStartNumber(sections, sIndex, questionIndex)}
            questions={section.questions.slice(
              questionIndex,
              questionIndex + length
            )}
            canAddItem={partTotal < maxQuestions}
            onChange={replaceGroup}
            onRemove={() =>
              confirm("Remove this question group?") && replaceGroup([])
            }
            media={
              <MediaInput
                label={
                  module === "reading"
                    ? "Diagram image"
                    : "Map / plan / diagram image"
                }
                accept="image"
                value={section.imageUrl}
                onChange={url =>
                  updateSection(section.key, {
                    imageUrl: url,
                  })
                }
              />
            }
          />
        );
      }
      return isCompletionType(question.type) ? null : (
        <QuestionEditor
          key={question.key}
          number={questionNumberLabel(sections, sIndex, questionIndex)}
          question={question}
          module={settings.module}
          part="content"
          typeOptions={builderTypes.filter(
            type =>
              !isCompletionType(type) &&
              Math.max(1, choiceSelectionCount(type)) <=
                Math.max(1, choiceSelectionCount(question.type)) +
                  maxQuestions -
                  section.questions.reduce(
                    (total, item) =>
                      total + Math.max(1, choiceSelectionCount(item.type)),
                    0
                  )
          )}
          onChange={q =>
            updateQuestions(
              section.key,
              section.questions.map(x => (x.key === q.key ? q : x))
            )
          }
          onRemove={() =>
            confirm(
              `Remove question ${questionNumberLabel(
                sections,
                sIndex,
                questionIndex
              )}?`
            ) &&
            updateQuestions(
              section.key,
              section.questions.filter(x => x.key !== question.key)
            )
          }
          onMove={() => {}}
        />
      );
    });
    const answerKey = section.questions.map((question, questionIndex) => {
      if (!isCompletionType(question.type)) return null;
      const number = questionStartNumber(sections, sIndex, questionIndex);
      if (question.type === "flow_chart_completion") {
        const length = flowChartGroups(section.questions).get(questionIndex);
        const group = length
          ? section.questions.slice(questionIndex, questionIndex + length)
          : [];
        return (
          <Fragment key={question.key}>
            {length && (
              <FlowChartOptionsEditor
                firstNumber={number}
                lastNumber={number + length - 1}
                options={question.options}
                onChange={(options, resetAnswers) =>
                  updateSection(section.key, {
                    questions: section.questions.map(x =>
                      group.includes(x)
                        ? {
                            ...x,
                            options,
                            answers: resetAnswers ? [] : x.answers,
                          }
                        : x
                    ),
                  })
                }
              />
            )}
            {question.options.length > 0 && (
              <label className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-sm font-bold text-gray-500">
                  Q{number}
                </span>
                <AdminSelect
                  value={question.answers[0] ?? ""}
                  onChange={e =>
                    updateSection(section.key, {
                      questions: section.questions.map(x =>
                        x.key === question.key
                          ? {
                              ...x,
                              answers: e.target.value ? [e.target.value] : [],
                            }
                          : x
                      ),
                    })
                  }
                  aria-label={`Correct option for question ${number}`}
                >
                  <option value="">Correct letter…</option>
                  {question.options.map((option, j) => (
                    <option key={j} value={optionLetter(j)}>
                      {optionLetter(j)}
                      {option.trim() ? `. ${option.trim()}` : ""}
                    </option>
                  ))}
                </AdminSelect>
              </label>
            )}
            {question.options.length === 0 && (
              <CompletionAnswerInput
                key={question.key}
                number={number}
                answers={question.answers}
                onChange={answers =>
                  updateSection(section.key, {
                    questions: section.questions.map(x =>
                      x.key === question.key ? { ...x, answers } : x
                    ),
                  })
                }
              />
            )}
          </Fragment>
        );
      }
      return (
        <CompletionAnswerInput
          key={question.key}
          number={number}
          answers={question.answers}
          onChange={answers =>
            updateSection(section.key, {
              questions: section.questions.map(x =>
                x.key === question.key ? { ...x, answers } : x
              ),
            })
          }
        />
      );
    });
    return (
      <ListeningLayoutBuilder
        types={builderTypes}
        typeInstructions={
          module === "reading"
            ? READING_TYPE_INSTRUCTIONS
            : LISTENING_TYPE_INSTRUCTIONS
        }
        maxQuestions={maxQuestions}
        sectionWord={module === "reading" ? "passage" : "part"}
        value={section.questionLayout}
        onChange={groups =>
          setSections(prev => {
            const index = prev.findIndex(item => item.key === section.key);
            return index < 0
              ? prev
              : syncLayoutGroups(
                  prev,
                  index,
                  groups,
                  builderTypes.find(isCompletionType) ?? "note_completion"
                );
          })
        }
        questions={section.questions.map((question, questionIndex) => ({
          key: question.key,
          type: question.type,
          number: questionStartNumber(sections, sIndex, questionIndex),
          instruction: question.instruction,
          editor: questionEditors[questionIndex],
          answerKey: answerKey[questionIndex],
        }))}
        existingQuestionCount={section.questions.reduce(
          (total, question) =>
            total + Math.max(1, choiceSelectionCount(question.type)),
          0
        )}
        onCreateQuestions={(type, count, instruction) =>
          // Later passages renumber, so their answer boxes move with them.
          updateQuestions(section.key, [
            ...section.questions,
            ...Array.from({ length: count }, (_, index) =>
              newQuestion(type, {
                // Reading diagrams take written answers, not letters.
                ...(module === "reading" &&
                  type === "diagram_labeling" && { options: [] }),
                ...(LETTER_ONLY_TYPES.includes(type) && {
                  // Paragraphs A–G is the usual Matching Information passage.
                  options: mapLetters(type === "matching_information" ? 7 : 9),
                }),
                instruction: index === 0 ? instruction : "",
              })
            ),
          ])
        }
        // Reading diagrams take their image inside the group, next to the answers.
        labelingMedia={
          module === "reading" ? undefined : (
            <MediaInput
              label="Map / plan / diagram image (optional)"
              accept="image"
              value={section.imageUrl}
              onChange={url => updateSection(section.key, { imageUrl: url })}
            />
          )
        }
      />
    );
  };

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
              label="Attempts allowed"
              hint={`Timed exam attempts per student (${settings.durationMinutes ?? DEFAULT_DURATION_MINUTES[settings.module]} min, audio can't be paused). Practice is untimed and always unlimited — students choose the mode.`}
            >
              <AdminSelect
                value={settings.maxAttempts ?? ""}
                onChange={e =>
                  setS({
                    maxAttempts: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Unlimited</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "attempt" : "attempts"}
                  </option>
                ))}
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
              settings.module === "reading" ? "border-b border-gray-200" : ""
            }`}
          >
            {/* Sections are fixed in every module: Listening and Speaking parts, Reading passages, Writing tasks. */}
            <h3 className="py-1 text-lg font-bold text-gray-900">
              {settings.module === "speaking"
                ? section.title
                : `${
                    settings.module === "listening"
                      ? "Part"
                      : settings.module === "writing"
                        ? "Task"
                        : "Passage"
                  } ${sIndex + 1}`}
            </h3>

            {(settings.module !== "listening" ||
              settings.format === "answer_sheet") && (
              <Field label="Instructions">
                <InstructionInput
                  value={section.instructions}
                  onChange={instructions =>
                    updateSection(section.key, { instructions })
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
                    group
                    label="2. Add questions"
                    hint="Write the question content visually. Choosing “Create new answer box” automatically creates its answer-key entry below."
                  >
                    {questionBuilder(section, sIndex)}
                  </Field>
                )}
              </>
            )}
            {settings.format === "full" && settings.module === "reading" && (
              <Field
                group
                label="Passage"
                hint="Use the image button to add a picture or diagram. For Matching Headings, add the questions first, then put each “+ Heading box” on its own line above its paragraph."
              >
                <RichLayoutEditor
                  value={section.content}
                  onChange={content => updateSection(section.key, { content })}
                  images
                  minHeightClass="min-h-[320px]"
                  // Matching Headings: a box above each paragraph, as in the real test.
                  insertLabel="+ Heading box"
                  questions={section.questions.flatMap(
                    (question, questionIndex) =>
                      question.type === "matching_headings"
                        ? [
                            {
                              number: questionStartNumber(
                                sections,
                                sIndex,
                                questionIndex
                              ),
                              label: question.prompt || "Heading",
                            },
                          ]
                        : []
                  )}
                />
              </Field>
            )}
            {settings.format === "full" && settings.module === "reading" && (
              <Field
                group
                label="Questions"
                hint="Choose a question type for each group. Completion types are written in the editor with “+ Answer box”."
              >
                {questionBuilder(section, sIndex)}
              </Field>
            )}
            {/* A writing task is its instructions plus the task itself; the answer is marked by AI. */}
            {settings.module === "writing" && (
              <Field
                group
                label="Task"
                hint="The task students answer. Use the image button for a Task 1 chart or diagram."
              >
                <RichLayoutEditor
                  value={section.content}
                  onChange={content => updateSection(section.key, { content })}
                  images
                  minHeightClass="min-h-[260px]"
                />
              </Field>
            )}
            {/* A Speaking part: its content as rich text, then each question added individually. */}
            {settings.module === "speaking" && settings.format === "full" && (
              <>
                <Field
                  group
                  label={
                    section.questions.some(q => q.prepSeconds)
                      ? "Cue card"
                      : "Questions"
                  }
                >
                  <RichLayoutEditor
                    value={section.content}
                    onChange={content =>
                      updateSection(section.key, { content })
                    }
                    minHeightClass="min-h-[180px]"
                  />
                </Field>
                <Field group label="Individual questions">
                  <div className="space-y-3">
                    {section.questions.map((question, qIndex) => {
                      const setQuestion = (patch: Partial<QuestionDraft>) =>
                        updateQuestions(
                          section.key,
                          section.questions.map(item =>
                            item.key === question.key
                              ? { ...item, ...patch }
                              : item
                          )
                        );
                      return (
                        <div
                          key={question.key}
                          className="space-y-3 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4"
                        >
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
                              Q{qIndex + 1}
                            </span>
                            <span className="flex-1" />
                            <button
                              type="button"
                              disabled={qIndex === 0}
                              onClick={() =>
                                updateQuestions(
                                  section.key,
                                  moveItem(section.questions, qIndex, -1)
                                )
                              }
                              className="rounded p-1.5 hover:bg-gray-200 disabled:opacity-30"
                              aria-label="Move question up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={qIndex === section.questions.length - 1}
                              onClick={() =>
                                updateQuestions(
                                  section.key,
                                  moveItem(section.questions, qIndex, 1)
                                )
                              }
                              className="rounded p-1.5 hover:bg-gray-200 disabled:opacity-30"
                              aria-label="Move question down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                (!question.prompt.trim() &&
                                  !question.audioUrl) ||
                                confirm(`Remove question ${qIndex + 1}?`)
                                  ? updateQuestions(
                                      section.key,
                                      section.questions.filter(
                                        item => item.key !== question.key
                                      )
                                    )
                                  : undefined
                              }
                              className="rounded p-1.5 hover:bg-red-50"
                              aria-label="Remove question"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                          {/* Part 2's cue card is the part's rich text above. */}
                          {sIndex !== SPEAKING_CUE_CARD_PART && (
                            <Field label="Question">
                              <textarea
                                className={inputClass}
                                rows={2}
                                value={question.prompt}
                                onChange={e =>
                                  setQuestion({ prompt: e.target.value })
                                }
                              />
                            </Field>
                          )}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field
                              label="Preparation (seconds)"
                              hint="Leave empty for none. Set it for a Part 2 cue card."
                            >
                              <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={question.prepSeconds ?? ""}
                                onChange={e =>
                                  setQuestion({
                                    prepSeconds: e.target.value
                                      ? Number(e.target.value)
                                      : null,
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
                                  setQuestion({
                                    responseSeconds: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  })
                                }
                              />
                            </Field>
                          </div>
                          <MediaInput
                            label="Examiner audio (optional)"
                            accept="audio"
                            value={question.audioUrl}
                            onChange={audioUrl => setQuestion({ audioUrl })}
                          />
                        </div>
                      );
                    })}
                    {/* Part 2 is a single cue card. */}
                    {!(
                      sIndex === SPEAKING_CUE_CARD_PART &&
                      section.questions.length
                    ) && (
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--admin-border)] px-5 py-8 text-sm font-medium text-[#30363d] transition-colors hover:border-[#c76f42] hover:text-[#c76f42]"
                        onClick={() =>
                          updateQuestions(section.key, [
                            ...section.questions,
                            // Same timers as the question above; the part's default for the first.
                            newQuestion("speaking", {
                              prepSeconds: section.questions.length
                                ? (section.questions.at(-1)?.prepSeconds ??
                                  null)
                                : (section.prepSeconds ?? null),
                              responseSeconds: section.questions.length
                                ? (section.questions.at(-1)?.responseSeconds ??
                                  null)
                                : (section.responseSeconds ?? null),
                            }),
                          ])
                        }
                      >
                        <Plus className="h-4 w-4" />
                        {section.questions.length
                          ? "Add another question"
                          : "Add question"}
                      </button>
                    )}
                  </div>
                </Field>
              </>
            )}
            {/* Reading and Writing images go inside the rich text; an older separate image stays removable. */}
            {settings.format === "full" &&
              !!section.imageUrl &&
              (settings.module === "writing" ||
                (settings.module === "reading" &&
                  !section.questions.some(question =>
                    LABELING_TYPES.includes(question.type)
                  ))) && (
                <MediaInput
                  label="Image (older tests only)"
                  accept="image"
                  value={section.imageUrl}
                  onChange={url =>
                    updateSection(section.key, { imageUrl: url })
                  }
                />
              )}
            <div
              className={`space-y-3 ${
                (settings.module === "listening" &&
                  settings.format === "full" &&
                  (!section.audioUrl ||
                    section.questions.reduce(
                      (total, question) =>
                        total +
                        Math.max(1, choiceSelectionCount(question.type)),
                      0
                    ) < 10)) ||
                (usesBuilder && !section.questions.length) ||
                settings.module === "writing" ||
                (settings.module === "speaking" && settings.format === "full")
                  ? "hidden"
                  : ""
              }`}
            >
              {usesBuilder && section.questions.length > 0 && (
                <div className="pb-1 pt-2">
                  <h4 className="text-sm font-semibold text-[#30363d]">
                    {settings.module === "listening" ? "3. " : ""}Add answers
                    and explanations
                  </h4>
                  <p className="mt-1 text-xs text-[#747d87]">
                    Set each accepted answer and optionally add an explanation
                    shown after submission in practice mode.
                  </p>
                </div>
              )}
              {/* Writing tasks and full Speaking parts edit their questions above. */}
              {(settings.module === "writing" ||
              (settings.module === "speaking" && settings.format === "full")
                ? []
                : section.questions
              ).map((question, qIndex) => {
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
                        updateQuestions(
                          section.key,
                          section.questions.filter(x => x.key !== question.key)
                        )
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
                    part={usesBuilder ? "answers" : undefined}
                    onChange={q =>
                      updateSection(section.key, {
                        questions: section.questions.map(x =>
                          x.key === q.key ? q : x
                        ),
                      })
                    }
                    onRemove={() =>
                      updateQuestions(
                        section.key,
                        section.questions.filter(x => x.key !== question.key)
                      )
                    }
                    onMove={dir =>
                      updateSection(section.key, {
                        questions: moveItem(section.questions, qIndex, dir),
                      })
                    }
                  />
                );
              })}
              {settings.module === "speaking" && (
                <SpeakingQuestionAdder
                  hasQuestions={section.questions.length > 0}
                  onAdd={(count, instruction) => {
                    const last =
                      section.questions[section.questions.length - 1];
                    updateQuestions(section.key, [
                      ...section.questions,
                      ...Array.from({ length: count }, (_, index) =>
                        newQuestion("speaking", {
                          instruction: index === 0 ? instruction : "",
                          prepSeconds: last?.prepSeconds ?? null,
                          responseSeconds: last?.responseSeconds ?? null,
                        })
                      ),
                    ]);
                  }}
                />
              )}
              {!usesBuilder && settings.module !== "speaking" && (
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
      </div>
    </div>
  );
}
