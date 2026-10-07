/**
 * /student/attempts/:id — the exam screen while in progress, the result page afterwards.
 */
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  FileText,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import StudentShell from "@/components/student/StudentShell";
import Recorder from "@/components/student/Recorder";
import { DecorSquare, HvActionButton } from "@/components/home-v2/primitives";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import {
  isHtmlLayout,
  layoutBoxNumbers,
  splitLayoutGroups,
} from "@/lib/listeningLayout";
import { renderRichHtml } from "@/lib/richHtml";
import { ExamPreviewContext } from "@/lib/examPreview";
import { formatInstruction } from "@/components/InstructionInput";
import { canAccessStudentDashboard } from "@shared/roles";
import {
  CAMBRIDGE,
  CHOICE_SELECTION_COUNTS,
  FIXED_CHOICES,
  MODULE_LABELS,
  countWords,
  formatBand,
  isCompletionType,
  isAutoMarkedModule,
  optionIndex,
  optionKey,
  optionLetter,
} from "@shared/mock";

type View = RouterOutputs["student"]["attempt"];
type Question = View["test"]["sections"][number]["questions"][number];
type AnswerState = Record<
  number,
  { response?: string | null; audioUrl?: string | null }
>;

const AUTOSAVE_MS = 4000;

/** Turns a listening script into playable audio without requiring a hosted audio file. */
function ScriptedAudioPlayer({ text, exam }: { text: string; exam: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  const play = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find(voice => voice.lang.toLowerCase().startsWith("en-gb")) ??
      voices.find(voice => voice.lang.toLowerCase().startsWith("en")) ??
      null;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  return (
    <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] bg-ink text-white">
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <button
          type="button"
          onClick={playing ? stop : play}
          disabled={!supported}
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-red transition-colors hover:bg-brand-red-light disabled:opacity-50"
          aria-label={playing ? "Pause audio script" : "Play audio script"}
        >
          {playing ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          )}
        </button>
        <div className="min-w-[180px] flex-1">
          <p className="flex items-center gap-2 font-medium">
            <Volume2 className="h-4 w-4 text-brand-red-light" />
            Listening audio
          </p>
          <p className="mt-1 text-sm text-white/60">
            {playing
              ? "Playing audio script…"
              : supported
                ? "Press play when you are ready"
                : "Audio playback is not supported in this browser"}
          </p>
        </div>
        <HvActionButton
          onClick={play}
          disabled={!supported}
          variant="ghost"
          size="xs"
          className="rounded-full"
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Replay
        </HvActionButton>
        {!exam && (
          <HvActionButton
            onClick={() => setShowTranscript(value => !value)}
            variant="ghost"
            size="xs"
            className="rounded-full"
            icon={<FileText className="h-4 w-4" />}
          >
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </HvActionButton>
        )}
      </div>
      {showTranscript && !exam && (
        <div className="border-t border-white/10 bg-white/5 p-5 text-[16px] leading-relaxed text-white/80">
          {text}
        </div>
      )}
    </div>
  );
}

function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
}

function numbered(view: View) {
  const map = new Map<number, number>();
  let n = 0;
  for (const s of view.test.sections)
    for (const q of s.questions) {
      map.set(q.id, n + 1);
      n += Math.max(1, CHOICE_SELECTION_COUNTS[q.type] ?? 1);
    }
  return map;
}

function questionNumberLabel(question: Question, start: number) {
  const count = Math.max(1, CHOICE_SELECTION_COUNTS[question.type] ?? 1);
  return count > 1 ? `${start}–${start + count - 1}` : String(start);
}

/** A numbered box students drop (or tap) a lettered option into. */
function AnswerDropBox({
  number,
  value,
  label,
  active,
  onToggle,
  onDrop,
  onClear,
  id,
  className,
  placeholder = "Drop answer here",
}: {
  number: number;
  value: string;
  label: string;
  active: boolean;
  onToggle: () => void;
  onDrop: (letter: string) => void;
  onClear: () => void;
  id?: string;
  className?: string;
  placeholder?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <span
      id={id}
      role="button"
      tabIndex={0}
      aria-label={`Answer box ${number}${value ? `: ${value}` : ""}`}
      aria-pressed={active}
      onClick={onToggle}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      onDragOver={event => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={event => {
        event.preventDefault();
        setDragOver(false);
        const letter = event.dataTransfer.getData("text/plain");
        if (letter) onDrop(letter);
      }}
      className={cn(
        "inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-[4px] border border-dashed px-2 py-1.5 leading-normal transition-colors",
        active || dragOver
          ? "border-ink bg-ink/5"
          : "border-ink/35 hover:border-ink/60",
        className
      )}
    >
      <span className="flex h-9 min-w-9 items-center justify-center rounded-[3px] border-2 border-ink px-1 font-bold">
        {number}
      </span>
      {value ? (
        <span className="flex items-center gap-2 text-base">
          <strong>{value}.</strong> {label}
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              onClear();
            }}
            className="ml-1 rounded px-1 text-ink/50 hover:text-ink"
            aria-label={`Clear answer ${number}`}
          >
            ×
          </button>
        </span>
      ) : (
        <span className="pr-2 text-sm italic text-ink/55">
          {active ? "Now choose an option" : placeholder}
        </span>
      )}
    </span>
  );
}

/** The lettered options students drag into answer boxes. */
function OptionList({
  options,
  used,
  picking,
  onPick,
  className,
}: {
  options: { letter: string; label: string }[];
  used: Set<string | null | undefined>;
  picking: boolean;
  onPick: (letter: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map(option => (
        <button
          key={option.letter}
          type="button"
          draggable
          onDragStart={event => {
            event.dataTransfer.setData("text/plain", option.letter);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => onPick(option.letter)}
          className={cn(
            "flex cursor-grab items-start gap-3 rounded-[var(--radius-control)] border bg-white px-4 py-3 text-left transition-colors active:cursor-grabbing",
            picking
              ? "border-ink/40 hover:border-ink"
              : "border-ink/15 hover:border-ink/40",
            used.has(option.letter) && "opacity-60"
          )}
        >
          <span className="text-ink/60">{option.letter}.</span>
          <span className="font-semibold">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Matching questions shown as in the paper: items with drop boxes, and the option box beside them. */
function MatchingGroup({
  questions,
  numbers,
  answers,
  onChange,
  inPassage = false,
  selected,
}: {
  questions: Question[];
  numbers: Map<number, number>;
  answers: AnswerState;
  onChange: (questionId: number, value: string) => void;
  /** Matching Headings whose boxes sit in the passage: only the headings are listed here. */
  inPassage?: boolean;
  /** The box picked for tap-to-assign, when it is shared with the passage. */
  selected?: [number | null, Dispatch<SetStateAction<number | null>>];
}) {
  const [ownActive, setOwnActive] = useState<number | null>(null);
  const [active, setActive] = selected ?? [ownActive, setOwnActive];
  // Sentence endings: the beginnings first, then the endings in a full-width box below.
  const stacked = questions[0].type === "matching_sentence_endings";
  const options = (questions[0].options ?? []).map((label, index) => ({
    letter: optionKey(questions[0].type, index),
    label,
  }));
  const labelFor = (letter: string) =>
    options.find(option => option.letter === letter)?.label ?? "";
  const used = new Set(
    questions.map(question => answers[question.id]?.response).filter(Boolean)
  );
  const assign = (questionId: number, letter: string) => {
    onChange(questionId, letter);
    setActive(null);
  };

  if (inPassage) {
    const picking =
      active !== null && questions.some(question => question.id === active);
    return (
      <div>
        {questions[0].instruction && (
          <p className="mb-4 whitespace-pre-line font-medium text-ink/75">
            {formatInstruction(questions[0].instruction)}
          </p>
        )}
        <ul className="mb-6 flex flex-col gap-2 text-lg">
          {options.map(option => (
            <li key={option.letter}>
              {option.letter}. {option.label}
            </li>
          ))}
        </ul>
        <div className="rounded-[var(--radius-card)] border border-ink/10 bg-[var(--student-card)] p-4">
          <p className="mb-3 text-sm italic text-ink/70">
            Drag and drop the headings to the correct paragraphs in the passage.
          </p>
          <OptionList
            options={options}
            used={used}
            picking={picking}
            onPick={letter => {
              if (picking) assign(active!, letter);
            }}
            className="flex-col"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {questions[0].instruction && (
        <p className="mb-5 whitespace-pre-line font-medium text-ink/75">
          {formatInstruction(questions[0].instruction)}
        </p>
      )}
      <div
        className={cn(
          "grid items-start",
          stacked
            ? "gap-10"
            : "gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        )}
      >
        <ul className={cn("flex flex-col", stacked ? "gap-7" : "gap-4")}>
          {questions.map(question => {
            const number = numbers.get(question.id)!;
            const value = answers[question.id]?.response ?? "";
            return (
              <li
                key={question.id}
                id={`question-${question.id}`}
                className={cn(
                  "flex scroll-mt-40 flex-wrap items-center gap-y-2 text-lg",
                  stacked ? "gap-x-2" : "gap-x-4"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-ink/50">•</span>
                  {question.prompt}
                </span>
                <AnswerDropBox
                  number={number}
                  value={value}
                  label={labelFor(value)}
                  active={active === question.id}
                  onToggle={() =>
                    setActive(current =>
                      current === question.id ? null : question.id
                    )
                  }
                  onDrop={letter => assign(question.id, letter)}
                  onClear={() => onChange(question.id, "")}
                />
              </li>
            );
          })}
        </ul>

        <div className="rounded-[var(--radius-card)] border border-ink/10 bg-[var(--student-card)] p-4">
          <p className="mb-3 text-sm italic text-ink/70">
            {stacked
              ? "Drag and drop an option to fill in each blank."
              : "Drag an option into each box, or tap a box and then an option."}
          </p>
          <OptionList
            options={options}
            used={used}
            picking={active !== null}
            onPick={letter => {
              if (active !== null) assign(active, letter);
            }}
            className="flex-col"
          />
        </div>
      </div>
    </div>
  );
}

/** Items dragged onto a shared option list. Matching Information uses the letter grid instead. */
const MATCHING_TYPES: Question["type"][] = [
  "matching",
  "visual_labeling",
  "matching_sentence_endings",
  "matching_headings",
];

/** Reading matching answered in a statements × letters grid, as in the real test. */
const GRID_MATCHING_TYPES: Question["type"][] = [
  "matching_features",
  "matching_information",
];

/** Shown as an image beside a letter grid. Visual labeling uses the matching layout (worded options). */
const LABELING_TYPES: Question["type"][] = [
  "map_labeling",
  "plan_labeling",
  "diagram_labeling",
];

/** Map / plan / diagram labeling as in the paper: the image beside a grid of items × letters. */
function LabelingGroup({
  questions,
  imageUrl,
  numbers,
  answers,
  onChange,
}: {
  questions: Question[];
  imageUrl?: string | null;
  numbers: Map<number, number>;
  answers: AnswerState;
  onChange: (questionId: number, value: string) => void;
}) {
  const options = questions[0].options ?? [];
  const letters = options.map((_, index) => optionLetter(index));

  // Reading diagrams: the image, then a written answer for each numbered label.
  if (questions[0].type === "diagram_labeling" && !options.length) {
    return (
      <div>
        {questions[0].instruction && (
          <p className="mb-6 whitespace-pre-line font-medium text-ink/75">
            {formatInstruction(questions[0].instruction)}
          </p>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Diagram to label"
            className="mx-auto mb-8 block max-h-[720px] max-w-full rounded-[var(--radius-control)] bg-white"
          />
        )}
        <ul className="flex flex-col gap-4 text-lg">
          {questions.map(question => {
            const number = numbers.get(question.id)!;
            return (
              <li
                key={question.id}
                id={`question-${question.id}`}
                className="flex scroll-mt-40 flex-wrap items-center gap-2"
              >
                <span className="flex h-8 min-w-8 items-center justify-center rounded-[2px] border-[1.5px] border-ink bg-white px-1 text-base font-bold leading-none">
                  {number}
                </span>
                <input
                  value={answers[question.id]?.response ?? ""}
                  onChange={event => onChange(question.id, event.target.value)}
                  className="h-8 w-[165px] rounded-[2px] border border-ink/30 bg-white px-2 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                  aria-label={`Answer for question ${number}${question.prompt ? `: ${question.prompt}` : ""}`}
                  autoComplete="off"
                  spellCheck={false}
                />
                {question.prompt?.trim() && (
                  <span className="text-ink/70">{question.prompt}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  // Diagram labeling and Matching Features: the options have text, listed with the grid.
  const worded =
    questions[0].type === "matching_features"
      ? options.filter(option => option.trim())
      : options.filter(option => option.trim() && option.trim().length > 1);
  // Without an image, the worded list sits above a full-width grid (Matching Features).
  const listAbove = !imageUrl && worded.length > 0;
  const hasPrompts = questions.some(question => question.prompt?.trim());
  return (
    <div>
      {questions[0].instruction && (
        <p className="mb-5 whitespace-pre-line font-medium text-ink/75">
          {formatInstruction(questions[0].instruction)}
        </p>
      )}
      {listAbove && (
        <ul className="mb-8 flex flex-col gap-4 text-lg">
          {options.map((option, index) => (
            <li key={index}>
              {optionLetter(index)}. {option}
            </li>
          ))}
        </ul>
      )}
      <div
        className={cn(
          "grid items-start gap-8",
          imageUrl && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        )}
      >
        {imageUrl && (
          <div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Image to label"
                className="w-full rounded-[var(--radius-control)] bg-white"
              />
            )}
            {worded.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-lg">
                {options.map((option, index) => (
                  <li key={index}>
                    <span className="mr-2 text-ink/60">
                      {optionLetter(index)}.
                    </span>
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="overflow-x-auto">
          <table
            className={cn(
              "border-collapse bg-white text-lg",
              hasPrompts ? "w-full" : "w-auto"
            )}
          >
            <thead>
              <tr className="bg-ink/5">
                <th className="border border-ink/15 p-3" />
                {letters.map(letter => (
                  <th
                    key={letter}
                    className="w-14 border border-ink/15 p-3 text-center font-bold"
                  >
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map(question => {
                const number = numbers.get(question.id)!;
                const value = answers[question.id]?.response ?? "";
                return (
                  <tr
                    key={question.id}
                    id={`question-${question.id}`}
                    className="scroll-mt-40"
                  >
                    <th
                      scope="row"
                      className="border border-ink/15 px-4 py-3 text-left font-normal leading-10"
                    >
                      {/* The statement wraps under its number, as in the paper. */}
                      <span className="mr-2 inline-flex h-8 min-w-8 items-center justify-center rounded-[2px] border-[1.5px] border-ink bg-white px-1 align-middle text-base font-bold leading-none">
                        {number}
                      </span>
                      {question.prompt}
                    </th>
                    {letters.map(letter => (
                      <td
                        key={letter}
                        className="border border-ink/15 p-0 text-center"
                      >
                        <label className="flex h-12 cursor-pointer items-center justify-center hover:bg-ink/5">
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            checked={value === letter}
                            onChange={() => onChange(question.id, letter)}
                            className="h-5 w-5 cursor-pointer accent-ink"
                            aria-label={`Question ${number}: ${letter}`}
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Splits questions into single questions and runs of matching or labeling questions that share one option list. */
function groupMatching(questions: Question[]) {
  const groups: (
    | { kind: "single"; question: Question }
    | { kind: "matching"; questions: Question[] }
    | { kind: "labeling"; questions: Question[] }
  )[] = [];
  for (const question of questions) {
    const last = groups.at(-1);
    const kind = MATCHING_TYPES.includes(question.type)
      ? "matching"
      : LABELING_TYPES.includes(question.type) ||
          GRID_MATCHING_TYPES.includes(question.type)
        ? "labeling"
        : null;
    if (!kind) {
      groups.push({ kind: "single", question });
    } else if (
      last?.kind === kind &&
      last.questions[0].type === question.type &&
      !question.instruction?.trim() &&
      JSON.stringify(last.questions[0].options ?? []) ===
        JSON.stringify(question.options ?? [])
    ) {
      last.questions.push(question);
    } else {
      groups.push({ kind, questions: [question] });
    }
  }
  return groups;
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const selectionCount = CHOICE_SELECTION_COUNTS[question.type] ?? 0;
  const choices = selectionCount
    ? (question.options ?? []).map((o, i) => ({
        value: optionLetter(i),
        label: o,
      }))
    : FIXED_CHOICES[question.type]?.map(c => ({ value: c, label: c }));

  if (choices) {
    const selected = value ? value.split(",").filter(Boolean) : [];
    const multiple = selectionCount > 1;
    return (
      <div className="mt-3">
        {multiple && (
          <p className="mb-2 text-sm text-ink/60">
            Choose {selectionCount} answers · {selected.length} selected
          </p>
        )}
        <div
          className="flex flex-col gap-2"
          role={multiple ? "group" : "radiogroup"}
        >
          {choices.map(choice => {
            const checked = selected.includes(choice.value);
            return (
              <label
                key={choice.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border px-4 py-3 transition-colors",
                  checked
                    ? "border-ink bg-ink text-white"
                    : "border-ink/15 bg-white hover:border-ink/40",
                  multiple && !checked && selected.length >= selectionCount
                    ? "cursor-not-allowed opacity-55"
                    : ""
                )}
              >
                <input
                  type={multiple ? "checkbox" : "radio"}
                  className="sr-only"
                  name={`q-${question.id}`}
                  checked={checked}
                  disabled={
                    multiple && !checked && selected.length >= selectionCount
                  }
                  onChange={() => {
                    if (!multiple) return onChange(choice.value);
                    const next = checked
                      ? selected.filter(item => item !== choice.value)
                      : [...selected, choice.value];
                    onChange(next.sort().join(","));
                  }}
                />
                <span className="font-semibold">{choice.value}</span>
                <span>{choice.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "writing") {
    const words = countWords(value);
    return (
      <div className="mt-3">
        <textarea
          className="min-h-[380px] w-full rounded-[var(--radius-control)] border border-ink/20 bg-white p-4 text-base leading-relaxed outline-none focus:border-ink"
          value={value}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          aria-label="Your answer"
        />
        <p
          className={cn(
            "mt-2 text-sm",
            question.minWords && words < question.minWords
              ? "text-brand-red"
              : "text-ink/60"
          )}
        >
          {words} word{words === 1 ? "" : "s"}
          {question.minWords ? ` · minimum ${question.minWords}` : ""}
        </p>
      </div>
    );
  }

  return (
    <input
      className="mt-3 w-full max-w-[420px] rounded-[var(--radius-control)] border border-ink/20 bg-white px-4 py-3 outline-none focus:border-ink"
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
      spellCheck={false}
      aria-label="Your answer"
    />
  );
}

function ListeningQuestionLayout({
  layout,
  questions,
  numbers,
  answers,
  onChange,
}: {
  layout: string;
  questions: Question[];
  numbers: Map<number, number>;
  answers: AnswerState;
  onChange: (questionId: number, value: string) => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const byNumber = new Map(
    questions.map(question => [numbers.get(question.id), question])
  );
  const inLayout = (question: Question) =>
    layout.includes(`[[${numbers.get(question.id)}]]`);
  // Completion boxes with an option list (e.g. a flow chart with A–F) take a dragged letter.
  const optionsFor = (question: Question) =>
    (question.options ?? []).map((label, index) => ({
      letter: optionLetter(index),
      label,
    }));
  const optionGroups = Array.from(
    questions
      .filter(
        question =>
          isCompletionType(question.type) &&
          question.options?.length &&
          inLayout(question)
      )
      .reduce((groups, question) => {
        const key = JSON.stringify(question.options);
        groups.set(key, [...(groups.get(key) ?? []), question]);
        return groups;
      }, new Map<string, Question[]>())
      .values()
  );
  const assign = (questionId: number, letter: string) => {
    onChange(questionId, letter);
    setActive(null);
  };
  const layoutInstructions = questions.filter(question => {
    const number = numbers.get(question.id);
    return (
      question.instruction &&
      number !== undefined &&
      layout.includes(`[[${number}]]`)
    );
  });

  const inline = (text: string) =>
    text
      .split(/(\[\[\d+\]\]|\*\*[^*]+\*\*|<br\s*\/?\s*>)/gi)
      .map((part, index) => {
        if (/^<br\s*\/?\s*>$/i.test(part)) return <br key={index} />;
        const bold = /^\*\*([^*]+)\*\*$/.exec(part);
        if (bold) return <strong key={index}>{bold[1]}</strong>;
        const match = /^\[\[(\d+)\]\]$/.exec(part);
        if (!match) return <span key={index}>{part}</span>;
        const number = Number(match[1]);
        const question = byNumber.get(number);
        if (!question || !isCompletionType(question.type)) {
          return <span key={index}>{part}</span>;
        }
        if (question.options?.length) {
          const value = answers[question.id]?.response ?? "";
          return (
            <AnswerDropBox
              key={index}
              id={`question-${question.id}`}
              number={number}
              value={value}
              label={
                optionsFor(question).find(option => option.letter === value)
                  ?.label ?? ""
              }
              active={active === question.id}
              onToggle={() =>
                setActive(current =>
                  current === question.id ? null : question.id
                )
              }
              onDrop={letter => assign(question.id, letter)}
              onClear={() => onChange(question.id, "")}
              className="my-1 scroll-mt-40 bg-white align-middle"
            />
          );
        }
        return (
          <span
            key={index}
            id={`question-${question.id}`}
            className="mx-1 inline-flex scroll-mt-40 items-center gap-2 align-middle"
          >
            <span className="flex h-8 min-w-8 items-center justify-center rounded-[2px] border-[1.5px] border-ink bg-white px-1 text-base font-bold leading-none">
              {number}
            </span>
            <input
              value={answers[question.id]?.response ?? ""}
              onChange={event => onChange(question.id, event.target.value)}
              className="h-8 w-[165px] rounded-[2px] border border-ink/30 bg-white px-2 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              aria-label={`Answer for question ${number}`}
              autoComplete="off"
              spellCheck={false}
            />
          </span>
        );
      });

  // Rich-text layouts: each [[n]] becomes a live answer input.
  const richLayout = isHtmlLayout(layout)
    ? renderRichHtml(layout, inline)
    : null;

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--student-card)] text-[17px] leading-8">
      {/* One line per instruction line; blank lines close up instead of adding a gap. */}
      {layoutInstructions.map(question => (
        <div
          key={`instruction-${question.id}`}
          className="space-y-1 px-5 pt-4 leading-7"
        >
          {question
            .instruction!.split(/\r?\n/)
            .filter(line => line.trim())
            .map((line, index) => (
              <p key={index}>{formatInstruction(line)}</p>
            ))}
        </div>
      ))}
      {richLayout && <div className="rich-layout px-5 py-4">{richLayout}</div>}
      {!isHtmlLayout(layout) &&
        layout.split(/\r?\n/).map((line, index) => {
          if (!line.trim()) return <div key={index} className="h-4" />;
          if (line.startsWith("## ")) {
            return (
              <h3 key={index} className="px-5 pb-2 pt-5 text-lg font-bold">
                {inline(line.slice(3))}
              </h3>
            );
          }
          if (line.includes("|")) {
            const cells = line
              .split("|")
              .map(cell => cell.trim())
              .filter(
                (cell, cellIndex, all) =>
                  cell || (cellIndex > 0 && cellIndex < all.length - 1)
              );
            return (
              <div
                key={index}
                className="grid overflow-x-auto border-t border-ink/10"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(cells.length, 1)}, minmax(180px, 1fr))`,
                }}
              >
                {cells.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={cn(
                      "min-w-0 px-5 py-3",
                      cellIndex < cells.length - 1 && "border-r border-ink/10"
                    )}
                  >
                    {inline(cell)}
                  </div>
                ))}
              </div>
            );
          }
          return (
            <p key={index} className="px-5 py-1">
              {inline(line)}
            </p>
          );
        })}
      {optionGroups.map(group => (
        <div
          key={group[0].id}
          className="border-t border-ink/10 bg-ink/[0.03] px-5 py-4"
        >
          <p className="mb-3 text-sm italic leading-normal text-ink/70">
            Drag an option into each box, or tap a box and then an option.
          </p>
          <OptionList
            options={optionsFor(group[0])}
            used={
              new Set(group.map(question => answers[question.id]?.response))
            }
            picking={
              active !== null && group.some(question => question.id === active)
            }
            onPick={letter => {
              if (
                active !== null &&
                group.some(question => question.id === active)
              )
                assign(active, letter);
            }}
            className="leading-normal"
          />
        </div>
      ))}
    </div>
  );
}

/** A reading passage (or writing context): rich text from the editor, or older plain text. */
function SectionContent({
  content,
  className,
  renderText,
}: {
  content: string;
  className?: string;
  /** Turns text runs into nodes, e.g. [[n]] into heading drop boxes. */
  renderText?: (text: string) => ReactNode;
}) {
  return isHtmlLayout(content) ? (
    <div
      className={cn(
        "rich-layout rich-passage text-[17px] leading-[1.75]",
        className
      )}
    >
      {renderRichHtml(content, renderText)}
    </div>
  ) : (
    <div
      className={cn(
        "whitespace-pre-line text-[17px] leading-[1.75]",
        className
      )}
    >
      {content}
    </div>
  );
}

/** "Open Cambridge IELTS 18, Test 2" banner for answer-sheet tests. */
function BookBanner({ test }: { test: View["test"] }) {
  if (test.format !== "answer_sheet") return null;
  const book =
    test.series === CAMBRIDGE.key && test.bookNumber
      ? `${CAMBRIDGE.label} ${test.bookNumber}${test.testNumber ? `, Test ${test.testNumber}` : ""}`
      : "your book";
  const tip =
    test.module === "listening"
      ? "Play the recording for each part (from the book's audio, or the player below if your mentor added one) and type your answers."
      : test.module === "reading"
        ? "Read the passages and questions in the book and type your answers here, numbered as in the book."
        : test.module === "writing"
          ? "Write your answers to the book's tasks below."
          : "Record your answers to the book's speaking questions below.";
  return (
    <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-control)] border-l-4 border-brand-red bg-white p-4">
      <p>
        <strong>
          Open {book} — {MODULE_LABELS[test.module]}.
        </strong>{" "}
        {tip}
      </p>
    </div>
  );
}

/** Answer-sheet row: just the question number and an answer box (or TF/YN choices). */
function SheetRow({
  number,
  question,
  value,
  onChange,
}: {
  number: number;
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const choices = FIXED_CHOICES[question.type];
  return (
    <div
      id={`question-${question.id}`}
      className="flex scroll-mt-40 items-center gap-3"
    >
      <label
        htmlFor={`sheet-${question.id}`}
        className="flex h-9 w-10 flex-none items-center justify-center rounded-[4px] bg-ink text-sm font-semibold text-white"
      >
        {number}
      </label>
      {choices ? (
        <div
          className="flex flex-1 flex-wrap gap-1"
          role="radiogroup"
          aria-label={`Question ${number}`}
        >
          {choices.map(choice => (
            <button
              key={choice}
              id={choice === choices[0] ? `sheet-${question.id}` : undefined}
              type="button"
              role="radio"
              aria-checked={value === choice}
              onClick={() => onChange(choice)}
              className={cn(
                "rounded-[7px] border px-3 py-1.5 text-sm",
                value === choice
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 bg-white hover:border-ink/50"
              )}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <input
          id={`sheet-${question.id}`}
          className="min-w-0 flex-1 rounded-[4px] border border-ink/20 bg-white px-3 py-2 outline-none focus:border-ink"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      )}
    </div>
  );
}

type SaveState = "saved" | "dirty" | "saving" | "error";

/** Top bar of the computer-delivered style screens: test, time left, autosave. */
function ExamHeader({
  view,
  remaining,
  lowTime,
  saveState,
}: {
  view: View;
  remaining: number | null;
  lowTime: boolean;
  saveState: SaveState;
}) {
  const { test } = view;
  const preview = useContext(ExamPreviewContext);
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink/15 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.14em] text-ink/60">
          {MODULE_LABELS[test.module]} ·{" "}
          {preview
            ? "Preview"
            : view.attempt.mode === "exam"
              ? "Exam"
              : "Practice"}
        </p>
        <h1 className="truncate text-base">{test.title}</h1>
      </div>
      {remaining !== null && (
        <span
          className={cn(
            "flex items-center gap-2 font-semibold",
            lowTime && "text-brand-red"
          )}
          role="timer"
          aria-label={`Time remaining ${clock(remaining)}`}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {remaining >= 60_000
            ? `${Math.ceil(remaining / 60_000)} minutes left`
            : `${clock(remaining)} left`}
        </span>
      )}
      {preview ? (
        <span className="flex items-center gap-4 text-sm text-ink/60">
          Preview — answers aren&apos;t saved
          <Link
            href={`/admin/ielts/${test.id}`}
            className="font-medium text-ink underline"
          >
            Exit preview
          </Link>
        </span>
      ) : (
        <span className="text-sm text-ink/60" role="status" aria-live="polite">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "dirty"
              ? "Unsaved changes"
              : saveState === "error"
                ? "Offline — will retry"
                : "All answers saved"}
        </span>
      )}
    </header>
  );
}

/**
 * One Speaking question's answer. With examiner audio, the question is played first and recording
 * starts when it ends, as in the real test; without it, the recorder shows straight away.
 */
function SpeakingAnswer({
  attemptId,
  question,
  recordedUrl,
  autoStart,
  onUploaded,
}: {
  attemptId: number;
  question: Question;
  recordedUrl: string | null;
  /** Moved on by itself: play the question (or start recording) without a click. */
  autoStart: boolean;
  onUploaded: (url: string, transcript: string | null) => void;
}) {
  const examiner = question.audioUrl || null;
  // Asked once the examiner audio has played (or there is none, or it's already answered).
  const [asked, setAsked] = useState(!examiner || !!recordedUrl);
  const [recordNow, setRecordNow] = useState(autoStart);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const play = () => {
    const element = audio.current;
    if (!element) return;
    element.currentTime = 0;
    element.play().then(
      () => setPlaying(true),
      // Autoplay blocked: the Play button stays available.
      () => setPlaying(false)
    );
  };
  useEffect(() => {
    if (examiner && !asked && autoStart) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {examiner && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] bg-[#f1f2ec] p-4">
          <audio
            ref={audio}
            src={examiner}
            preload="auto"
            onEnded={() => {
              setPlaying(false);
              if (asked) return;
              setAsked(true);
              setRecordNow(true);
            }}
          />
          <Volume2 className="h-5 w-5 flex-none" aria-hidden="true" />
          <span className="flex-1" role="status">
            {playing
              ? "The examiner is asking the question…"
              : asked
                ? "Examiner's question"
                : "Listen to the examiner's question. Recording starts when it ends."}
          </span>
          <button
            type="button"
            onClick={play}
            disabled={playing}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {asked ? "Replay" : "Play question"}
          </button>
          {!asked && !playing && (
            <button
              type="button"
              onClick={() => setAsked(true)}
              className="text-sm text-ink/60 underline"
            >
              Answer without listening
            </button>
          )}
        </div>
      )}
      {asked && (
        <Recorder
          attemptId={attemptId}
          questionId={question.id}
          prepSeconds={question.prepSeconds}
          responseSeconds={question.responseSeconds}
          audioUrl={recordedUrl}
          autoStart={recordNow}
          onUploaded={onUploaded}
        />
      )}
    </>
  );
}

/**
 * Speaking, one question at a time as in the real test: the part's instructions in a bar,
 * the question (Part 2 as a cue card with its preparation and speaking timers), the recorder,
 * then on to the next question once the answer is saved.
 */
function SpeakingExam({
  view,
  answers,
  onRecorded,
  remaining,
  lowTime,
  saveState,
  submitting,
  onSubmit,
}: {
  view: View;
  answers: AnswerState;
  onRecorded: (
    questionId: number,
    url: string,
    transcript: string | null
  ) => void;
  remaining: number | null;
  lowTime: boolean;
  saveState: SaveState;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { test, attempt } = view;
  const steps = test.sections.flatMap((section, sectionIndex) =>
    section.questions.map(question => ({ section, sectionIndex, question }))
  );
  const [index, setIndex] = useState(0);
  // True after moving on by itself, so the next question starts recording straight away.
  const [autoStart, setAutoStart] = useState(false);
  const advance = useRef<number | null>(null);
  const cancelAdvance = () => {
    if (advance.current) window.clearTimeout(advance.current);
    advance.current = null;
  };
  useEffect(() => cancelAdvance, []);

  const goTo = (next: number) => {
    cancelAdvance();
    setAutoStart(false);
    setIndex(Math.max(0, Math.min(steps.length - 1, next)));
  };

  if (!steps.length)
    return (
      <div className="grid min-h-dvh place-items-center text-ink/60">
        This test has no questions yet.
      </div>
    );

  const { section, sectionIndex, question } = steps[index];
  const isLast = index === steps.length - 1;
  const recorded = !!answers[question.id]?.audioUrl;
  const cueCard = !!question.prepSeconds;
  const partDone = (partIndex: number) =>
    test.sections[partIndex].questions.filter(q => !!answers[q.id]?.audioUrl)
      .length;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ExamHeader
        view={view}
        remaining={remaining}
        lowTime={lowTime}
        saveState={saveState}
      />

      {/* Part instructions */}
      <div className="border-b border-ink/15 bg-[#f1f2ec] px-4 py-3">
        <p className="font-bold">Part {sectionIndex + 1}</p>
        {section.instructions && (
          <p className="mt-0.5 whitespace-pre-line text-ink/80">
            {formatInstruction(section.instructions)}
          </p>
        )}
      </div>

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10">
        {index === 0 && <BookBanner test={test} />}
        {/* The part's content as written in the editor. A question without its own text
            (Part 2) uses it as the cue card. */}
        {section.content?.trim() &&
          (question.prompt?.trim() ? (
            <SectionContent
              content={section.content}
              className="mt-4 rounded-[var(--radius-card)] bg-[#f7f7f3] p-6"
            />
          ) : (
            <div className="mt-4 rounded-[4px] border-2 border-ink/80 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">
                Cue card
              </p>
              <SectionContent content={section.content} className="mt-3" />
            </div>
          ))}
        <p className="mt-6 text-sm text-ink/60">
          Question {index + 1} of {steps.length}
        </p>
        {question.instruction && (
          <p className="mt-3 whitespace-pre-line font-medium text-ink/75">
            {formatInstruction(question.instruction)}
          </p>
        )}
        {question.prompt?.trim() &&
          (cueCard ? (
            <div className="mt-4 rounded-[4px] border-2 border-ink/80 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">
                Cue card
              </p>
              <p className="mt-3 whitespace-pre-line text-lg leading-relaxed">
                {question.prompt}
              </p>
            </div>
          ) : (
            <p className="mt-4 whitespace-pre-line text-2xl leading-snug">
              {question.prompt}
            </p>
          ))}

        <SpeakingAnswer
          key={question.id}
          attemptId={attempt.id}
          question={question}
          recordedUrl={answers[question.id]?.audioUrl ?? null}
          autoStart={autoStart}
          onUploaded={(url, transcript) => {
            onRecorded(question.id, url, transcript);
            if (isLast) return;
            cancelAdvance();
            advance.current = window.setTimeout(() => {
              advance.current = null;
              setAutoStart(true);
              setIndex(current => current + 1);
            }, 2000);
          }}
        />

        {recorded &&
          (isLast ? (
            <div className="mt-8 rounded-[var(--radius-control)] bg-[#f1f2ec] p-5">
              <p className="font-semibold">
                That is the end of the speaking test.
              </p>
              <p className="mt-1 text-ink/70">
                Check your answers if you like, then submit.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-3 text-ink/70">
              <span role="status">
                {advance.current
                  ? "Answer saved. Next question coming up…"
                  : "Answer saved."}
              </span>
              <button
                type="button"
                onClick={() => {
                  cancelAdvance();
                  setAutoStart(true);
                  setIndex(index + 1);
                }}
                className="font-semibold text-ink underline"
              >
                Next question now
              </button>
            </div>
          ))}
      </main>

      {/* Parts */}
      <nav
        aria-label="Parts"
        className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-ink/15 bg-[#f1f2ec] px-4 py-2"
      >
        {test.sections.map((s, partIndex) => (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              goTo(steps.findIndex(step => step.sectionIndex === partIndex))
            }
            disabled={!s.questions.length}
            aria-current={partIndex === sectionIndex ? "step" : undefined}
            className={cn(
              "rounded-[4px] border px-4 py-2 text-sm disabled:opacity-40",
              partIndex === sectionIndex
                ? "border-ink bg-white font-bold"
                : "border-transparent hover:bg-white/70"
            )}
          >
            Part {partIndex + 1}
            <span className="ml-2 font-normal text-ink/60">
              {partDone(partIndex)} of {s.questions.length}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-ink text-white disabled:opacity-30"
            aria-label="Previous question"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => goTo(index + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-ink text-white disabled:opacity-30"
            aria-label="Next question"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex h-10 items-center gap-2 rounded-[4px] bg-brand-red px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </nav>
    </div>
  );
}

/**
 * Writing, laid out like the computer-delivered test: the part's instructions in a bar,
 * the task on the left and the answer on the right (with a draggable divider), and the
 * parts along the bottom.
 */
function WritingExam({
  view,
  sectionIndex,
  setSectionIndex,
  answers,
  setResponse,
  remaining,
  lowTime,
  saveState,
  submitting,
  onSubmit,
}: {
  view: View;
  sectionIndex: number;
  setSectionIndex: (index: number) => void;
  answers: AnswerState;
  setResponse: (questionId: number, response: string) => void;
  remaining: number | null;
  lowTime: boolean;
  saveState: SaveState;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { test } = view;
  const section = test.sections[sectionIndex];
  const question = section.questions.find(q => q.type === "writing");
  const value = question ? (answers[question.id]?.response ?? "") : "";
  const words = countWords(value);
  // Width of the task pane, in percent of the split.
  const [split, setSplit] = useState(50);
  const splitRef = useRef<HTMLDivElement>(null);

  const startDrag = (event: ReactPointerEvent) => {
    event.preventDefault();
    const move = (e: PointerEvent) => {
      const box = splitRef.current?.getBoundingClientRect();
      if (!box) return;
      const percent = ((e.clientX - box.left) / box.width) * 100;
      setSplit(Math.min(75, Math.max(25, percent)));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const partWords = (index: number) =>
    test.sections[index].questions
      .filter(q => q.type === "writing")
      .reduce(
        (total, q) => total + countWords(answers[q.id]?.response ?? ""),
        0
      );

  return (
    <div className="flex min-h-dvh flex-col bg-white lg:h-dvh">
      <ExamHeader
        view={view}
        remaining={remaining}
        lowTime={lowTime}
        saveState={saveState}
      />

      {/* Part instructions */}
      <div className="border-b border-ink/15 bg-[#f1f2ec] px-4 py-3">
        <p className="font-bold">Part {sectionIndex + 1}</p>
        {section.instructions && (
          <p className="mt-0.5 whitespace-pre-line text-ink/80">
            {formatInstruction(section.instructions)}
          </p>
        )}
      </div>

      {/* Task | answer */}
      <div
        ref={splitRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
        style={{ ["--task-width" as string]: `${split}%` }}
      >
        <section
          aria-label="Task"
          className="min-h-0 overflow-y-auto px-6 py-6 lg:w-[var(--task-width)] lg:flex-none lg:px-8"
        >
          {sectionIndex === 0 && test.format === "answer_sheet" && (
            <div className="mb-6 [&>div]:mt-0">
              <BookBanner test={test} />
            </div>
          )}
          {section.content && <SectionContent content={section.content} />}
          {question?.prompt?.trim() && (
            <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.75]">
              {question.prompt}
            </p>
          )}
          {section.imageUrl && (
            <img
              src={section.imageUrl}
              alt="Task visual"
              className="mt-6 w-full rounded"
            />
          )}
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize task and answer"
          onPointerDown={startDrag}
          className="hidden w-2 flex-none cursor-col-resize items-center justify-center border-x border-ink/15 bg-[#f1f2ec] lg:flex"
        >
          <span className="h-8 w-0.5 rounded bg-ink/30" />
        </div>

        <section
          aria-label="Your answer"
          className="flex min-h-[420px] flex-1 flex-col px-6 py-6 lg:min-h-0 lg:px-8"
        >
          {question ? (
            <>
              <textarea
                key={question.id}
                className="min-h-0 w-full flex-1 resize-none rounded-[4px] border border-ink/30 bg-white p-4 text-base leading-relaxed outline-none focus:border-ink"
                value={value}
                onChange={e => setResponse(question.id, e.target.value)}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                autoComplete="off"
                aria-label={`Answer for part ${sectionIndex + 1}`}
              />
              <p
                className={cn(
                  "mt-2 text-right text-sm",
                  question.minWords && words < question.minWords
                    ? "text-brand-red"
                    : "text-ink/60"
                )}
              >
                Word count: {words}
              </p>
            </>
          ) : null}
        </section>
      </div>

      {/* Parts */}
      <nav
        aria-label="Parts"
        className="flex flex-wrap items-center gap-2 border-t border-ink/15 bg-[#f1f2ec] px-4 py-2"
      >
        {test.sections.map((s, index) => {
          const written = partWords(index);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionIndex(index)}
              aria-current={index === sectionIndex ? "step" : undefined}
              className={cn(
                "rounded-[4px] border px-4 py-2 text-sm",
                index === sectionIndex
                  ? "border-ink bg-white font-bold"
                  : "border-transparent hover:bg-white/70"
              )}
            >
              Part {index + 1}
              <span className="ml-2 font-normal text-ink/60">
                {written ? `${written} words` : "Not started"}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={sectionIndex === 0}
            onClick={() => setSectionIndex(sectionIndex - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-ink text-white disabled:opacity-30"
            aria-label="Previous part"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={sectionIndex === test.sections.length - 1}
            onClick={() => setSectionIndex(sectionIndex + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-ink text-white disabled:opacity-30"
            aria-label="Next part"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex h-10 items-center gap-2 rounded-[4px] bg-brand-red px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </nav>
    </div>
  );
}

function ExamRunner({ view }: { view: View }) {
  const utils = trpc.useUtils();
  const preview = useContext(ExamPreviewContext);
  const [, navigate] = useLocation();
  const { attempt, test } = view;
  const numbers = useMemo(() => numbered(view), [view]);
  const [answers, setAnswers] = useState<AnswerState>(() =>
    Object.fromEntries(
      view.answers.map(a => [
        a.questionId,
        { response: a.response, audioUrl: a.audioUrl },
      ])
    )
  );
  const [sectionIndex, setSectionIndex] = useState(0);
  // The answer box picked for tap-to-assign; shared by the passage and the question list.
  const [activeBox, setActiveBox] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<
    "saved" | "dirty" | "saving" | "error"
  >("saved");
  const dirty = useRef(new Set<number>());
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submitted = useRef(false);

  const skew = useMemo(
    () => new Date(view.serverNow).getTime() - Date.now(),
    [view.serverNow]
  );
  const deadline = attempt.deadlineAt
    ? new Date(attempt.deadlineAt).getTime()
    : null;
  const [remaining, setRemaining] = useState(() =>
    deadline ? deadline - (Date.now() + skew) : null
  );

  // mutateAsync is stable across renders; the mutation objects are not (the timer re-renders every second).
  const { mutateAsync: saveAnswers } = trpc.student.save.useMutation();
  const { mutateAsync: submitAnswers, isPending: submitting } =
    trpc.student.submit.useMutation();

  const flush = useCallback(async () => {
    if (preview) return dirty.current.clear();
    if (!dirty.current.size || submitted.current) return;
    const ids = [...dirty.current];
    dirty.current.clear();
    setSaveState("saving");
    try {
      await saveAnswers({
        attemptId: attempt.id,
        answers: ids.map(questionId => ({
          questionId,
          response: answersRef.current[questionId]?.response ?? null,
        })),
      });
      setSaveState(dirty.current.size ? "dirty" : "saved");
    } catch {
      ids.forEach(id => dirty.current.add(id));
      setSaveState("error");
    }
  }, [attempt.id, preview, saveAnswers]);

  const submit = useCallback(
    async (auto = false) => {
      if (submitted.current) return;
      submitted.current = true;
      if (preview) {
        toast.info(
          auto
            ? "Time is up — this is where the answers would be submitted."
            : "Preview finished — nothing was submitted."
        );
        navigate(`/admin/ielts/${test.id}`);
        return;
      }
      try {
        await submitAnswers({
          attemptId: attempt.id,
          answers: Object.entries(answersRef.current)
            .filter(([, a]) => a.response !== undefined)
            .map(([questionId, a]) => ({
              questionId: Number(questionId),
              response: a.response ?? null,
            })),
        });
        if (auto) toast.info("Time is up — your answers were submitted.");
        await utils.student.attempt.invalidate({ id: attempt.id });
        utils.student.tests.invalidate();
        utils.student.attempts.invalidate();
        window.scrollTo({ top: 0 });
      } catch (err) {
        submitted.current = false;
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not submit — check your connection and try again."
        );
      }
    },
    [attempt.id, navigate, preview, submitAnswers, test.id, utils]
  );

  // Timer
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const left = deadline - (Date.now() + skew);
      setRemaining(left);
      if (left <= 0) submit(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline, skew, submit]);

  // Autosave
  useEffect(() => {
    const id = window.setInterval(flush, AUTOSAVE_MS);
    const onHide = () => document.visibilityState === "hidden" && flush();
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current.size && !submitted.current) e.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flush]);

  const setResponse = (questionId: number, response: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], response },
    }));
    dirty.current.add(questionId);
    setSaveState("dirty");
  };

  const allQuestions = test.sections.flatMap(s => s.questions);
  const isAnswered = (q: Question) =>
    q.type === "speaking"
      ? !!answers[q.id]?.audioUrl
      : !!answers[q.id]?.response?.trim();
  const unanswered = allQuestions.filter(q => !isAnswered(q)).length;
  const section = test.sections[sectionIndex];
  const lowTime = remaining !== null && remaining < 5 * 60_000;
  const layoutQuestionNumbers = new Set(
    Array.from(section.questionLayout?.matchAll(/\[\[(\d+)\]\]/g) ?? []).map(
      match => Number(match[1])
    )
  );
  const displayedQuestions = section.questions.filter(
    question =>
      !isCompletionType(question.type) ||
      !layoutQuestionNumbers.has(numbers.get(question.id) ?? -1)
  );

  const confirmSubmit = () => {
    const msg = unanswered
      ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`
      : "Submit your answers? You can't change them afterwards.";
    if (confirm(msg)) submit();
  };

  const jumpTo = (q: Question) => {
    const index = test.sections.findIndex(s =>
      s.questions.some(x => x.id === q.id)
    );
    setSectionIndex(index);
    requestAnimationFrame(() =>
      document
        .getElementById(`question-${q.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  if (test.module === "speaking" && test.format === "full")
    return (
      <SpeakingExam
        view={view}
        answers={answers}
        onRecorded={(questionId, url, transcript) =>
          setAnswers(prev => ({
            ...prev,
            // Keep the transcript in state too, or the next autosave would clear it.
            [questionId]: {
              ...prev[questionId],
              audioUrl: url,
              response: transcript ?? prev[questionId]?.response ?? "",
            },
          }))
        }
        remaining={remaining}
        lowTime={lowTime}
        saveState={saveState}
        submitting={submitting}
        onSubmit={confirmSubmit}
      />
    );

  if (test.module === "writing")
    return (
      <WritingExam
        view={view}
        sectionIndex={sectionIndex}
        setSectionIndex={setSectionIndex}
        answers={answers}
        setResponse={setResponse}
        remaining={remaining}
        lowTime={lowTime}
        saveState={saveState}
        submitting={submitting}
        onSubmit={confirmSubmit}
      />
    );

  const sheet =
    test.format === "answer_sheet" && isAutoMarkedModule(test.module);
  // Matching Headings boxes written into the passage ([[n]] above each paragraph).
  const headingByNumber = new Map(
    section.questions
      .filter(question => question.type === "matching_headings")
      .map(question => [numbers.get(question.id), question])
  );
  const passageNumbers = new Set(
    Array.from(section.content?.matchAll(/\[\[(\d+)\]\]/g) ?? [])
      .map(match => Number(match[1]))
      .filter(number => headingByNumber.has(number))
  );
  const passageText = (text: string): ReactNode =>
    text.split(/(\[\[\d+\]\])/).map((part, index) => {
      const match = /^\[\[(\d+)\]\]$/.exec(part);
      const question = match && headingByNumber.get(Number(match[1]));
      if (!question) return part;
      const value = answers[question.id]?.response ?? "";
      return (
        <AnswerDropBox
          key={index}
          id={`question-${question.id}`}
          number={Number(match[1])}
          value={value}
          label={question.options?.[optionIndex(question.type, value)] ?? ""}
          active={activeBox === question.id}
          onToggle={() =>
            setActiveBox(current =>
              current === question.id ? null : question.id
            )
          }
          onDrop={key => {
            setResponse(question.id, key);
            setActiveBox(null);
          }}
          onClear={() => setResponse(question.id, "")}
          placeholder="Drop heading here"
          className="flex w-full scroll-mt-40"
        />
      );
    });
  // Each completion layout sits in question order: before the first group numbered
  // after its first box.
  const sectionNumbers = new Set(
    section.questions.map(question => numbers.get(question.id))
  );
  const layouts = splitLayoutGroups(section.questionLayout).flatMap(
    (layout, index) => {
      const start = Math.min(
        ...layoutBoxNumbers(layout.html).filter(number =>
          sectionNumbers.has(number)
        )
      );
      return Number.isFinite(start)
        ? [{ kind: "layout" as const, key: `layout-${index}`, layout, start }]
        : [];
    }
  );
  const questionGroups = groupMatching(displayedQuestions);
  const firstNumber = (group: (typeof questionGroups)[number]) =>
    numbers.get(
      (group.kind === "single" ? group.question : group.questions[0]).id
    ) ?? 0;
  const groups: ((typeof questionGroups)[number] | (typeof layouts)[number])[] =
    [
      ...questionGroups.map(group => ({ group, order: firstNumber(group) })),
      ...layouts.map(layout => ({ group: layout, order: layout.start - 0.5 })),
    ]
      .sort((a, b) => a.order - b.order)
      .map(item => item.group);
  const questionsBlock = sheet ? (
    <div className="grid gap-x-10 gap-y-3 md:grid-cols-2">
      {displayedQuestions.map(q => (
        <SheetRow
          key={q.id}
          number={numbers.get(q.id)!}
          question={q}
          value={answers[q.id]?.response ?? ""}
          onChange={v => setResponse(q.id, v)}
        />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-8">
      {groups.map(group => {
        if (group.kind === "layout")
          return (
            <div key={group.key} className="max-w-[1100px]">
              <ListeningQuestionLayout
                layout={group.layout.html}
                questions={section.questions}
                numbers={numbers}
                answers={answers}
                onChange={setResponse}
              />
            </div>
          );
        if (group.kind === "labeling")
          return (
            <LabelingGroup
              key={group.questions[0].id}
              questions={group.questions}
              imageUrl={
                group.questions[0].type === "matching_information"
                  ? null
                  : section.imageUrl
              }
              numbers={numbers}
              answers={answers}
              onChange={setResponse}
            />
          );
        if (group.kind === "matching")
          return (
            <MatchingGroup
              key={group.questions[0].id}
              questions={group.questions}
              numbers={numbers}
              answers={answers}
              onChange={setResponse}
              inPassage={group.questions.some(question =>
                passageNumbers.has(numbers.get(question.id) ?? -1)
              )}
              selected={[activeBox, setActiveBox]}
            />
          );
        const q = group.question;
        return (
          <div
            key={q.id}
            id={`question-${q.id}`}
            className="max-w-[860px] scroll-mt-40"
          >
            {q.instruction && (
              <p className="mb-3 whitespace-pre-line font-medium text-ink/75">
                {formatInstruction(q.instruction)}
              </p>
            )}
            {/* A Writing task's text is in the section; its answer box has no number. */}
            {(q.type !== "writing" || !!q.prompt?.trim()) && (
              <div className="flex items-start gap-3">
                <span className="flex h-8 min-w-8 flex-none items-center justify-center rounded-[4px] bg-ink px-2 text-sm font-semibold text-white">
                  {questionNumberLabel(q, numbers.get(q.id)!)}
                </span>
                <p className="whitespace-pre-line pt-1 text-lg">{q.prompt}</p>
              </div>
            )}
            <div
              className={
                q.type === "writing" && !q.prompt?.trim() ? undefined : "pl-11"
              }
            >
              {q.type === "speaking" ? (
                <Recorder
                  attemptId={attempt.id}
                  questionId={q.id}
                  prepSeconds={q.prepSeconds}
                  responseSeconds={q.responseSeconds}
                  audioUrl={answers[q.id]?.audioUrl ?? null}
                  onUploaded={(url, transcript) =>
                    setAnswers(prev => ({
                      ...prev,
                      // Keep the transcript in state too, or the next autosave would clear it.
                      [q.id]: {
                        ...prev[q.id],
                        audioUrl: url,
                        response: transcript ?? prev[q.id]?.response ?? "",
                      },
                    }))
                  }
                />
              ) : (
                <QuestionInput
                  question={q}
                  value={answers[q.id]?.response ?? ""}
                  onChange={v => setResponse(q.id, v)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const sideBySide = test.module === "reading" && !!section.content;
  const scriptedListening =
    test.module === "listening" && !section.audioUrl && !!section.content;

  return (
    <div className="pb-40">
      {/* Exam bar */}
      <div className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.14em] text-ink/60">
              {MODULE_LABELS[test.module]} ·{" "}
              {attempt.mode === "exam" ? "Exam" : "Practice"}
            </p>
            <h1 className="truncate text-lg">{test.title}</h1>
          </div>
          <span
            className="text-sm text-ink/60"
            role="status"
            aria-live="polite"
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "dirty"
                ? "Unsaved changes"
                : saveState === "error"
                  ? "Offline — will retry"
                  : "All answers saved"}
          </span>
          {remaining !== null && (
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 font-mono text-lg font-semibold",
                lowTime ? "bg-brand-red text-white" : "bg-ink text-white"
              )}
              role="timer"
              aria-label={`Time remaining ${clock(remaining)}`}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              {clock(remaining)}
            </span>
          )}
          <button
            type="button"
            onClick={confirmSubmit}
            disabled={submitting}
            className="hv-btn hv-btn-red py-3"
          >
            <span className="hv-btn-label">
              <span>{submitting ? "Submitting…" : "Submit"}</span>
              <span aria-hidden="true">Submit</span>
            </span>
          </button>
        </div>
        {test.sections.length > 1 && (
          <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-4 pb-3">
            {test.sections.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSectionIndex(i)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium",
                  i === sectionIndex
                    ? "bg-ink text-white"
                    : "bg-sand hover:bg-[#dedbd0]"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pt-8">
        {sectionIndex === 0 && <BookBanner test={test} />}
        <h2
          className={cn(
            "text-[28px]",
            sectionIndex === 0 && test.format === "answer_sheet" && "mt-8"
          )}
        >
          {section.title}
        </h2>
        {section.instructions && (
          <p className="mt-2 whitespace-pre-line text-ink/70">
            {formatInstruction(section.instructions)}
          </p>
        )}
        {section.audioUrl && (
          <div className="mt-5 rounded-[var(--radius-control)] bg-sand p-4">
            <audio
              controls
              preload="auto"
              src={section.audioUrl}
              className="w-full"
              controlsList="nodownload noplaybackrate"
            />
            {attempt.mode === "exam" && (
              <p className="mt-2 text-sm text-ink/60">
                In the real test you hear the recording once — try not to replay
                it.
              </p>
            )}
          </div>
        )}
        {scriptedListening && (
          <ScriptedAudioPlayer
            text={section.content!}
            exam={attempt.mode === "exam"}
          />
        )}
        {sideBySide ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="lg:sticky lg:top-40 lg:max-h-[calc(100vh-200px)] lg:self-start lg:overflow-y-auto rounded-[var(--radius-card)] bg-[var(--student-card)] p-6 lg:p-8">
              {/* A Reading diagram is shown with its labeling questions instead. */}
              {section.imageUrl &&
                !displayedQuestions.some(q =>
                  LABELING_TYPES.includes(q.type)
                ) && (
                  <img
                    src={section.imageUrl}
                    alt="Task visual"
                    className="mb-6 w-full rounded"
                  />
                )}
              {section.content && test.module !== "listening" && (
                <SectionContent
                  content={section.content}
                  renderText={passageText}
                />
              )}
            </div>
            {questionsBlock}
          </div>
        ) : (
          <div
            className={cn(
              "mt-6",
              test.module === "listening" && test.format === "full"
                ? "max-w-[1400px]"
                : "max-w-[860px]"
            )}
          >
            {section.content && test.module !== "listening" && (
              <SectionContent
                content={section.content}
                renderText={passageText}
                className="mb-8 rounded-[var(--radius-card)] bg-[var(--student-card)] p-6"
              />
            )}
            {section.imageUrl &&
              !displayedQuestions.some(q =>
                LABELING_TYPES.includes(q.type)
              ) && (
                <img
                  src={section.imageUrl}
                  alt=""
                  className="mb-8 max-h-[420px] rounded"
                />
              )}
            {questionsBlock}
          </div>
        )}

        <div className="mt-12 flex justify-between gap-3">
          <button
            type="button"
            disabled={sectionIndex === 0}
            onClick={() => {
              setSectionIndex(i => i - 1);
              window.scrollTo({ top: 0 });
            }}
            className="rounded-full border border-ink/20 px-5 py-2.5 disabled:opacity-30"
          >
            ← Previous
          </button>
          {sectionIndex < test.sections.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                setSectionIndex(i => i + 1);
                window.scrollTo({ top: 0 });
              }}
              className="rounded-full bg-ink px-5 py-2.5 text-white"
            >
              Next →
            </button>
          ) : (
            <HvActionButton
              onClick={confirmSubmit}
              variant="red"
              size="sm"
              className="rounded-full"
            >
              Finish & submit
            </HvActionButton>
          )}
        </div>
      </div>

      {/* Question navigator */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-cream/95 backdrop-blur"
        aria-label="Questions"
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 overflow-x-auto px-4 py-3">
          <span className="whitespace-nowrap text-sm text-ink/60">
            {allQuestions.length - unanswered}/{allQuestions.length} answered
          </span>
          {allQuestions.map(q => (
            <button
              key={q.id}
              type="button"
              onClick={() => jumpTo(q)}
              aria-label={`Question ${questionNumberLabel(q, numbers.get(q.id)!)}${isAnswered(q) ? ", answered" : ""}`}
              className={cn(
                "h-8 min-w-8 flex-none rounded-[7px] px-2 text-sm font-medium",
                isAnswered(q)
                  ? "bg-ink text-white"
                  : "border border-ink/25 bg-white"
              )}
            >
              {questionNumberLabel(q, numbers.get(q.id)!)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function AttemptResult({ view }: { view: View }) {
  const { attempt, test } = view;
  const numbers = numbered(view);
  const answerFor = (id: number) => view.answers.find(a => a.questionId === id);
  const awaiting = attempt.status === "submitted";
  const revealed = attempt.mode === "practice";
  const ai = attempt.aiEvaluation;
  const aiMarking =
    awaiting && ai?.status === "pending" && attempt.mode === "practice";
  const aiGraded = !awaiting && ai?.applied === true;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12 lg:py-16">
      <Link href="/student" className="text-sm text-ink/60 hover:text-ink">
        ← Back to tests
      </Link>
      <p className="mt-6 flex items-center gap-2 text-lg">
        <DecorSquare />
        {MODULE_LABELS[test.module]} result
      </p>
      <h1 className="mt-2 text-[36px] sm:text-[44px]">{test.title}</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-[240px_1fr]">
        <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-brand-red p-6 text-white">
          <p className="text-sm text-white/80">
            {awaiting
              ? "Status"
              : test.module === "reading" || test.module === "listening"
                ? "Estimated band"
                : "Band"}
          </p>
          <p className="mt-4 text-[64px] font-semibold leading-none">
            {awaiting ? "…" : formatBand(attempt.band)}
          </p>
          {attempt.maxScore ? (
            <p className="mt-3 text-white/85">
              {attempt.rawScore} of {attempt.maxScore} correct
            </p>
          ) : null}
        </div>
        <div className="rounded-[var(--radius-card)] bg-sand p-6">
          {aiMarking ? (
            <div role="status">
              <h2 className="flex items-center gap-3 text-2xl">
                <span
                  className="h-5 w-5 flex-none animate-spin rounded-full border-2 border-ink border-t-transparent"
                  aria-hidden="true"
                />
                AI is marking your answers…
              </h2>
              <p className="mt-2 text-ink/70">
                This usually takes under a minute. Your band, criterion scores
                and feedback will appear here automatically.
              </p>
            </div>
          ) : awaiting ? (
            <>
              <h2 className="text-2xl">Submitted — awaiting marking</h2>
              <p className="mt-2 text-ink/70">
                Your mentor will mark this{" "}
                {MODULE_LABELS[test.module].toLowerCase()} test against the
                IELTS criteria. Your band and feedback will appear here.
              </p>
            </>
          ) : (
            <>
              {attempt.criteria && Object.keys(attempt.criteria).length > 0 && (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(attempt.criteria).map(([name, band]) => (
                    <div key={name} className="border-b border-ink/10 pb-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-ink/70">{name}</dt>
                        <dd className="text-xl font-semibold">
                          {formatBand(band)}
                        </dd>
                      </div>
                      {aiGraded && ai?.comments?.[name] && (
                        <p className="mt-1 text-sm text-ink/60">
                          {ai.comments[name]}
                        </p>
                      )}
                    </div>
                  ))}
                </dl>
              )}
              {attempt.feedback ? (
                <div className={attempt.criteria ? "mt-5" : ""}>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink/60">
                    {aiGraded ? "AI feedback" : "Mentor feedback"}
                    {aiGraded && (
                      <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium text-white">
                        Marked by AI · your mentor may review it
                      </span>
                    )}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-lg">
                    {attempt.feedback}
                  </p>
                </div>
              ) : !attempt.criteria ? (
                <p className="text-ink/70">
                  {test.module === "reading" || test.module === "listening"
                    ? "Bands are estimated from the standard IELTS conversion table, scaled to 40 questions."
                    : "Marked."}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <h2 className="mt-14 text-[28px]">Your answers</h2>
      {!revealed &&
        (test.module === "reading" || test.module === "listening") && (
          <p className="mt-2 text-ink/60">
            Correct answers are kept private in exam mode so the test can be
            reused.
          </p>
        )}
      <div className="mt-6 flex flex-col gap-4">
        {test.sections.map(section => (
          <section
            key={section.id}
            className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8 lg:p-6"
          >
            <h3 className="mb-4 text-xl">{section.title}</h3>
            <div className="flex flex-col gap-5">
              {section.questions.map(q => {
                const a = answerFor(q.id);
                const objective = q.type !== "writing" && q.type !== "speaking";
                return (
                  <div
                    key={q.id}
                    className="border-t border-ink/10 pt-4 first:border-0 first:pt-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 min-w-7 flex-none items-center justify-center rounded-[4px] bg-ink px-2 text-xs font-semibold text-white">
                        {questionNumberLabel(q, numbers.get(q.id)!)}
                      </span>
                      <div className="min-w-0 flex-1">
                        {!(test.format === "answer_sheet" && objective) && (
                          <p className="whitespace-pre-line">{q.prompt}</p>
                        )}
                        {objective && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 font-medium",
                                a?.isCorrect
                                  ? "text-green-700"
                                  : "text-brand-red"
                              )}
                            >
                              {a?.isCorrect ? (
                                <Check className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <X className="h-4 w-4" aria-hidden="true" />
                              )}
                              {a?.response
                                ? q.options?.length
                                  ? a.response
                                      .split(",")
                                      .map(
                                        value =>
                                          `${value}. ${q.options?.[optionIndex(q.type, value)] ?? ""}`
                                      )
                                      .join("; ")
                                  : a.response
                                : "No answer"}
                            </span>
                            {q.answers && !a?.isCorrect && (
                              <span className="text-ink/60">
                                Correct:{" "}
                                {q.type === "mcq" ||
                                (isCompletionType(q.type) && q.options?.length)
                                  ? q.answers
                                      .map(
                                        l =>
                                          `${l}. ${q.options?.[optionIndex(q.type, l)] ?? ""}`
                                      )
                                      .join(", ")
                                  : q.answers.join(" / ")}
                              </span>
                            )}
                          </div>
                        )}
                        {objective && q.explanation && (
                          <p className="mt-2 rounded bg-sand px-3 py-2 text-sm">
                            {q.explanation}
                          </p>
                        )}
                        {q.type === "writing" && (
                          <>
                            <p className="mt-3 text-sm text-ink/60">
                              {countWords(a?.response)} words
                            </p>
                            <div className="mt-1 whitespace-pre-wrap rounded-[var(--radius-control)] bg-white p-4">
                              {a?.response || (
                                <em className="text-ink/40">No answer</em>
                              )}
                            </div>
                          </>
                        )}
                        {q.type === "speaking" &&
                          (a?.audioUrl ? (
                            <audio
                              controls
                              src={a.audioUrl}
                              className="mt-3 w-full"
                            />
                          ) : (
                            <p className="mt-2 text-sm text-ink/50">
                              No recording
                            </p>
                          ))}
                        {!objective && q.explanation && (
                          <div className="mt-3 rounded-[var(--radius-control)] bg-sand px-4 py-3">
                            <p className="text-sm font-medium text-ink/60">
                              {q.type === "writing"
                                ? "Model answer & tips"
                                : "Sample answer & tips"}
                            </p>
                            <p className="mt-1 whitespace-pre-line">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                        {a?.feedback && (
                          <div className="mt-3 border-l-2 border-brand-red pl-4">
                            <p className="text-sm font-medium text-ink/60">
                              Mentor feedback
                            </p>
                            <p className="whitespace-pre-line">{a.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AttemptPage({ id }: { id: number }) {
  const { data, isLoading, error } = trpc.student.attempt.useQuery(
    { id },
    {
      refetchOnWindowFocus: false,
      retry: false,
      // Poll while AI marking is running, then stop.
      refetchInterval: query => {
        const attempt = query.state.data?.attempt;
        return attempt?.status === "submitted" &&
          attempt.aiEvaluation?.status === "pending"
          ? 4000
          : false;
      },
    }
  );
  if (isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
      >
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-24 text-center">
        <h1 className="text-[32px]">Attempt not found</h1>
        <Link href="/student" className="mt-4 inline-block underline">
          Back to tests
        </Link>
      </div>
    );
  }
  return data.attempt.status === "in_progress" ? (
    <ExamRunner key={data.attempt.id} view={data} />
  ) : (
    <AttemptResult view={data} />
  );
}

export default function StudentAttempt() {
  const [pathname] = useLocation();
  const id = Number(pathname.split("/")[3]);
  const valid = Number.isFinite(id) && id > 0;
  const { user } = useAuth();
  // Same query as AttemptPage (deduplicated); used only to hide the site header during the exam.
  const { data } = trpc.student.attempt.useQuery(
    { id },
    {
      enabled: valid && canAccessStudentDashboard(user?.role),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
  return (
    <StudentShell bare={data?.attempt.status === "in_progress"}>
      {valid ? <AttemptPage id={id} /> : null}
    </StudentShell>
  );
}

/** /admin/ielts/preview/:id — the exam screen as students see it, for staff. Nothing is saved. */
export function StudentAttemptPreview() {
  const [pathname] = useLocation();
  const id = Number(pathname.split("/")[4]);
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.mockTests.preview.useQuery(
    { id },
    {
      enabled: Number.isFinite(id) && id > 0 && !!user,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
  return (
    <StudentShell bare staffPreview>
      {data ? (
        <ExamPreviewContext.Provider value>
          <ExamRunner view={data} />
        </ExamPreviewContext.Provider>
      ) : isLoading ? (
        <div
          className="flex min-h-[60vh] items-center justify-center"
          role="status"
        >
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      ) : (
        <div className="mx-auto max-w-[520px] px-4 py-24 text-center">
          <h1 className="text-[32px]">Test not found</h1>
          {error && <p className="mt-3 text-ink/70">{error.message}</p>}
          <Link href="/admin/ielts" className="mt-4 inline-block underline">
            Back to IELTS tests
          </Link>
        </div>
      )}
    </StudentShell>
  );
}
