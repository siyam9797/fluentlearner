/**
 * /student/attempts/:id — the exam screen while in progress, the result page afterwards.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { DecorSquare } from "@/components/home-v2/primitives";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import {
  CAMBRIDGE,
  FIXED_CHOICES,
  MODULE_LABELS,
  countWords,
  formatBand,
  isAutoMarkedModule,
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
    <div className="mt-5 overflow-hidden rounded-[8px] bg-ink text-white">
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
        <button
          type="button"
          onClick={play}
          disabled={!supported}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/50 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" /> Replay
        </button>
        {!exam && (
          <button
            type="button"
            onClick={() => setShowTranscript(value => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/50"
          >
            <FileText className="h-4 w-4" /> {showTranscript ? "Hide" : "Show"}{" "}
            transcript
          </button>
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
    for (const q of s.questions) map.set(q.id, ++n);
  return map;
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
  const choices =
    question.type === "mcq"
      ? (question.options ?? []).map((o, i) => ({
          value: optionLetter(i),
          label: o,
        }))
      : FIXED_CHOICES[question.type]?.map(c => ({ value: c, label: c }));

  if (choices) {
    return (
      <div className="mt-3 flex flex-col gap-2" role="radiogroup">
        {choices.map(choice => (
          <label
            key={choice.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-[5px] border px-4 py-3 transition-colors",
              value === choice.value
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white hover:border-ink/40"
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={`q-${question.id}`}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
            />
            {question.type === "mcq" && (
              <span className="font-semibold">{choice.value}</span>
            )}
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "writing") {
    const words = countWords(value);
    return (
      <div className="mt-3">
        <textarea
          className="min-h-[380px] w-full rounded-[5px] border border-ink/20 bg-white p-4 text-base leading-relaxed outline-none focus:border-ink"
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
      className="mt-3 w-full max-w-[420px] rounded-[5px] border border-ink/20 bg-white px-4 py-3 outline-none focus:border-ink"
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
      spellCheck={false}
      aria-label="Your answer"
    />
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
    <div className="mt-6 flex items-start gap-3 rounded-[5px] border-l-4 border-brand-red bg-white p-4">
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
                "rounded-[4px] border px-3 py-1.5 text-sm",
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

function ExamRunner({ view }: { view: View }) {
  const utils = trpc.useUtils();
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
  }, [attempt.id, saveAnswers]);

  const submit = useCallback(
    async (auto = false) => {
      if (submitted.current) return;
      submitted.current = true;
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
    [attempt.id, submitAnswers, utils]
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

  const sheet =
    test.format === "answer_sheet" && isAutoMarkedModule(test.module);
  const questionsBlock = sheet ? (
    <div className="grid gap-x-10 gap-y-3 md:grid-cols-2">
      {section.questions.map(q => (
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
      {section.questions.map(q => (
        <div key={q.id} id={`question-${q.id}`} className="scroll-mt-40">
          <div className="flex items-start gap-3">
            <span className="flex h-8 min-w-8 flex-none items-center justify-center rounded-[4px] bg-ink px-2 text-sm font-semibold text-white">
              {numbers.get(q.id)}
            </span>
            <p className="whitespace-pre-line pt-1 text-lg">{q.prompt}</p>
          </div>
          <div className="pl-11">
            {q.type === "speaking" ? (
              <Recorder
                attemptId={attempt.id}
                questionId={q.id}
                prepSeconds={q.prepSeconds}
                responseSeconds={q.responseSeconds}
                audioUrl={answers[q.id]?.audioUrl ?? null}
                onUploaded={url =>
                  setAnswers(prev => ({
                    ...prev,
                    [q.id]: { ...prev[q.id], audioUrl: url },
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
      ))}
    </div>
  );

  const sideBySide =
    (test.module === "reading" && !!section.content) ||
    (test.module === "writing" && (!!section.imageUrl || !!section.content));
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
              {test.mode === "exam" ? "Exam" : "Practice"}
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
            {section.instructions}
          </p>
        )}
        {section.audioUrl && (
          <div className="mt-5 rounded-[5px] bg-sand p-4">
            <audio
              controls
              preload="auto"
              src={section.audioUrl}
              className="w-full"
              controlsList="nodownload noplaybackrate"
            />
            {test.mode === "exam" && (
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
            exam={test.mode === "exam"}
          />
        )}

        {sideBySide ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="lg:sticky lg:top-40 lg:max-h-[calc(100vh-200px)] lg:self-start lg:overflow-y-auto rounded-[5px] bg-white p-6 lg:p-8">
              {section.imageUrl && (
                <img
                  src={section.imageUrl}
                  alt="Task visual"
                  className="mb-6 w-full rounded"
                />
              )}
              {section.content && test.module !== "listening" && (
                <div className="whitespace-pre-line text-[17px] leading-[1.75]">
                  {section.content}
                </div>
              )}
            </div>
            {questionsBlock}
          </div>
        ) : (
          <div className="mt-6 max-w-[860px]">
            {section.content && test.module !== "listening" && (
              <div className="mb-8 whitespace-pre-line rounded-[5px] bg-white p-6 text-[17px] leading-[1.75]">
                {section.content}
              </div>
            )}
            {section.imageUrl && (
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
            <button
              type="button"
              onClick={confirmSubmit}
              className="rounded-full bg-brand-red px-5 py-2.5 text-white"
            >
              Finish & submit
            </button>
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
              aria-label={`Question ${numbers.get(q.id)}${isAnswered(q) ? ", answered" : ""}`}
              className={cn(
                "h-8 min-w-8 flex-none rounded-[4px] px-2 text-sm font-medium",
                isAnswered(q)
                  ? "bg-ink text-white"
                  : "border border-ink/25 bg-white"
              )}
            >
              {numbers.get(q.id)}
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
  const revealed = test.mode === "practice";

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
        <div className="flex flex-col justify-between rounded-[5px] bg-brand-red p-6 text-white">
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
        <div className="rounded-[5px] bg-sand p-6">
          {awaiting ? (
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
                    <div
                      key={name}
                      className="flex items-baseline justify-between gap-3 border-b border-ink/10 pb-2"
                    >
                      <dt className="text-ink/70">{name}</dt>
                      <dd className="text-xl font-semibold">
                        {formatBand(band)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {attempt.feedback ? (
                <div className={attempt.criteria ? "mt-5" : ""}>
                  <p className="text-sm font-medium text-ink/60">
                    Mentor feedback
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
            className="rounded-[5px] border border-ink/15 p-5 lg:p-6"
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
                        {numbers.get(q.id)}
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
                                ? q.type === "mcq"
                                  ? `${a.response}. ${q.options?.[a.response.charCodeAt(0) - 65] ?? ""}`
                                  : a.response
                                : "No answer"}
                            </span>
                            {q.answers && !a?.isCorrect && (
                              <span className="text-ink/60">
                                Correct:{" "}
                                {q.type === "mcq"
                                  ? q.answers
                                      .map(
                                        l =>
                                          `${l}. ${q.options?.[l.charCodeAt(0) - 65] ?? ""}`
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
                            <div className="mt-1 whitespace-pre-wrap rounded-[5px] bg-white p-4">
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
    { refetchOnWindowFocus: false, retry: false }
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
      enabled: valid && user?.role === "student",
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
