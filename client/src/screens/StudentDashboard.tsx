/**
 * Student area home (/student) and results history (/student/results).
 */
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  Building2,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock,
  Headphones,
  Download,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  Gauge,
  Keyboard,
  LockKeyhole,
  Mail,
  Mic,
  PenLine,
  Play,
  Sparkles,
  RotateCcw,
  Search,
  Target,
  Timer,
  UserRound,
  Users,
  Video,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import StudentShell from "@/components/student/StudentShell";
import {
  TYPING_PASSAGES,
  TYPING_TOPICS,
} from "@/components/student/typingPassages";
import {
  ArrowButton,
  DecorSquare,
  HV_FIELD,
  HvActionButton,
  HvButton,
  HvSelect,
} from "@/components/home-v2/primitives";
import { fileToBase64 } from "@/lib/fileToBase64";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import {
  CAMBRIDGE,
  MODULE_LABELS,
  PRACTICE_TYPES,
  formatBand,
  type MockModule,
} from "@shared/mock";

const MODULE_ICONS: Record<MockModule, typeof BookOpenText> = {
  reading: BookOpenText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};
const MODULE_ORDER: MockModule[] = [
  "listening",
  "reading",
  "writing",
  "speaking",
];
const STATUS_TEXT = {
  in_progress: "In progress",
  submitted: "Awaiting marking",
  graded: "Marked",
} as const;
const STUDENT_PAGE_CLASS =
  "mx-auto w-full max-w-[1230px] px-5 py-10 sm:px-8 lg:px-8 lg:py-14";

type ServerStudentTest = RouterOutputs["student"]["tests"][number];
type TestMode = "exam" | "practice";
/** A test as seen from one section: its mode, and the student's progress in that mode. */
type StudentTest = Omit<ServerStudentTest, "mode" | "modes"> &
  ServerStudentTest["modes"][TestMode] & { mode: TestMode };

type DrillSet = {
  test: StudentTest;
  drill: ServerStudentTest["drills"][string];
};

/** Every test can be taken as practice or as a timed exam; each mode tracks its own attempts. */
function inMode(test: ServerStudentTest, mode: TestMode): StudentTest {
  const { modes, ...rest } = test;
  return { ...rest, ...modes[mode], mode };
}

/** Start, resume or review a test — shared by the module cards and the Cambridge grid. */
function useTestActions() {
  const [, navigate] = useLocation();
  const start = trpc.student.start.useMutation({
    onSuccess: ({ attemptId }) => navigate(`/student/attempts/${attemptId}`),
    onError: err => toast.error(err.message),
  });
  const actionFor = (test: StudentTest) => {
    const canStart = test.attemptsLeft === null || test.attemptsLeft > 0;
    if (test.inProgressAttemptId)
      return {
        label: "Resume",
        run: () => navigate(`/student/attempts/${test.inProgressAttemptId}`),
      };
    if (!canStart) return null;
    return {
      label: test.attemptsUsed ? "Try again" : "Start test",
      run: () => {
        if (
          test.mode === "exam" &&
          test.durationMinutes &&
          !confirm(
            `The ${test.durationMinutes}-minute timer starts now and keeps running if you leave. Ready?`
          )
        )
          return;
        start.mutate({ testId: test.id, mode: test.mode });
      },
    };
  };
  return { actionFor, starting: start.isPending };
}

function CambridgeLibrary({
  tests,
  actions,
}: {
  tests: StudentTest[];
  actions: ReturnType<typeof useTestActions>;
}) {
  const [, navigate] = useLocation();
  const { actionFor, starting } = actions;
  const books = [
    ...new Set(tests.map(t => t.bookNumber!).filter(Boolean)),
  ].sort((a, b) => b - a);
  const [book, setBook] = useState(books[0]);
  const current = books.includes(book) ? book : books[0];
  const testNumbers = [
    ...new Set(
      tests.filter(t => t.bookNumber === current).map(t => t.testNumber!)
    ),
  ].sort((a, b) => a - b);
  const order: MockModule[] = ["listening", "reading", "writing", "speaking"];

  return (
    <section className="mt-14">
      <h2 className="text-[26px]">{CAMBRIDGE.label} library</h2>
      <p className="mt-2 text-ink/70">
        Have your Cambridge book ready — you'll read the questions (and play the
        audio) from the book and enter your answers here.
      </p>
      <div
        className="mt-5 flex flex-wrap gap-2"
        role="group"
        aria-label="Choose a book"
      >
        {books.map(n => (
          <button
            key={n}
            type="button"
            aria-pressed={n === current}
            onClick={() => setBook(n)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium",
              n === current
                ? "border-ink bg-ink text-white"
                : "border-ink/20 hover:border-ink"
            )}
          >
            Book {n}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {testNumbers.map(testNumber => (
          <div
            key={testNumber}
            className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8"
          >
            <h3 className="text-xl">
              Cambridge {current} · Test {testNumber}
            </h3>
            <ul className="mt-4 flex flex-col divide-y divide-ink/10">
              {order.map(module => {
                const test = tests.find(
                  t =>
                    t.bookNumber === current &&
                    t.testNumber === testNumber &&
                    t.module === module
                );
                if (!test) return null;
                const Icon = MODULE_ICONS[module];
                const action = actionFor(test);
                return (
                  <li key={module} className="flex items-center gap-3 py-3">
                    <Icon
                      className="h-5 w-5 flex-none text-brand-red"
                      aria-hidden="true"
                    />
                    <span className="flex-1 font-medium">
                      {MODULE_LABELS[module]}
                    </span>
                    {test.bestBand !== null && (
                      <span className="text-sm text-ink/70">
                        Band{" "}
                        <strong className="text-ink">
                          {formatBand(test.bestBand)}
                        </strong>
                      </span>
                    )}
                    {test.lastAttempt && !test.inProgressAttemptId && (
                      <button
                        type="button"
                        className="text-sm underline"
                        onClick={() =>
                          navigate(`/student/attempts/${test.lastAttempt!.id}`)
                        }
                      >
                        Result
                      </button>
                    )}
                    {action && (
                      <HvActionButton
                        disabled={starting}
                        onClick={action.run}
                        size="xs"
                        className="rounded-full"
                      >
                        {action.label === "Start test" ? "Start" : action.label}
                      </HvActionButton>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Practice one official IELTS question type at a time. Each published test that has questions of
 * that type (from their builder question type, or their part for Writing/Speaking) offers a drill
 * of just those questions.
 */
function QuestionTypePractice({ tests }: { tests: StudentTest[] }) {
  const [, navigate] = useLocation();
  const start = trpc.student.start.useMutation({
    onSuccess: ({ attemptId }) => navigate(`/student/attempts/${attemptId}`),
    onError: err => toast.error(err.message),
  });
  const starting = start.isPending;
  const [module, setModule] = useState<MockModule>("reading");
  const [openType, setOpenType] = useState<string | null>(null);
  const types = PRACTICE_TYPES[module];
  const setsFor = (key: string) =>
    tests.flatMap(test => {
      const drill = test.drills[key];
      return drill ? [{ test, drill }] : [];
    });
  const actionFor = (key: string, { test, drill }: DrillSet) =>
    drill.inProgressAttemptId
      ? {
          label: "Resume",
          run: () => navigate(`/student/attempts/${drill.inProgressAttemptId}`),
        }
      : {
          label: drill.attemptsUsed ? "Try again" : "Start",
          run: () =>
            start.mutate({
              testId: test.id,
              mode: "practice",
              practiceType: key,
            }),
        };
  const openSets = openType ? setsFor(openType) : [];
  const openInfo = types.find(type => type.key === openType);

  return (
    <section className="mt-10">
      <h2 className="text-[26px]">Practice by question type</h2>
      <p className="mt-1 max-w-2xl text-ink/65">
        Pick a module, then drill one IELTS question type at a time. Answers and
        explanations appear after you submit.
      </p>

      <div
        className="mt-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Module"
      >
        {MODULE_ORDER.map(item => {
          const Icon = MODULE_ICONS[item];
          const count = tests.filter(
            test => test.module === item && Object.keys(test.drills).length > 0
          ).length;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={module === item}
              onClick={() => {
                setModule(item);
                setOpenType(null);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                module === item
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 hover:border-ink/40"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {MODULE_LABELS[item]}
              <span
                className={module === item ? "text-white/60" : "text-ink/40"}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {types.map(type => {
          const sets = setsFor(type.key);
          const done = sets.filter(set => set.drill.attemptsUsed > 0).length;
          const active = openType === type.key;
          return (
            <button
              key={type.key}
              type="button"
              onClick={() => setOpenType(active ? null : type.key)}
              disabled={!sets.length}
              aria-expanded={active}
              className={cn(
                "flex flex-col items-start rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 text-left ring-1 transition-colors",
                active ? "ring-2 ring-ink" : "ring-ink/8 hover:ring-ink/30",
                !sets.length && "cursor-default opacity-60 hover:ring-ink/8"
              )}
            >
              <span className="font-medium">{type.label}</span>
              <span className="mt-1 text-sm text-ink/60">
                {type.description}
              </span>
              <span className="mt-4 text-xs font-medium text-ink/50">
                {sets.length
                  ? `${sets.length} test${sets.length === 1 ? "" : "s"} · ${done} done`
                  : "Coming soon"}
              </span>
              {sets.length > 0 && (
                <span className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink/10">
                  <span
                    className="block h-full rounded-full bg-brand-red"
                    style={{ width: `${(done / sets.length) * 100}%` }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openInfo && openSets.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--student-card)] ring-1 ring-ink/8">
          <p className="border-b border-ink/10 px-5 py-4 font-medium">
            {openInfo.label} — practise from these tests
          </p>
          <ul>
            {openSets.map((set, index) => {
              const { test, drill } = set;
              const action = actionFor(openInfo.key, set);
              const last = drill.lastAttempt;
              return (
                <li
                  key={test.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-4 px-5 py-4",
                    index > 0 && "border-t border-ink/10"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{test.title}</p>
                    <p className="mt-0.5 text-sm text-ink/60">
                      {drill.questionCount} question
                      {drill.questionCount === 1 ? "" : "s"}
                      {last?.maxScore ? (
                        <>
                          {" "}
                          · Last score{" "}
                          <strong className="text-ink">
                            {last.rawScore}/{last.maxScore}
                          </strong>
                        </>
                      ) : null}
                      {last && !drill.inProgressAttemptId && (
                        <>
                          {" "}
                          ·{" "}
                          <Link
                            href={`/student/attempts/${last.id}`}
                            className="underline"
                          >
                            Review last attempt
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="hv-btn hv-btn-dark"
                    disabled={starting}
                    onClick={action.run}
                  >
                    <span className="hv-btn-label">
                      <span>{action.label}</span>
                      <span aria-hidden="true">{action.label}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Whole-module practice papers (untimed), laid out like the question-type section above it. */
function FullPracticeTests({
  tests,
  actions,
}: {
  tests: StudentTest[];
  actions: ReturnType<typeof useTestActions>;
}) {
  const { actionFor, starting } = actions;
  const modules = MODULE_ORDER.filter(item =>
    tests.some(test => test.module === item)
  );
  const [module, setModule] = useState<MockModule | null>(null);
  const current = module && modules.includes(module) ? module : modules[0];
  const visible = tests.filter(test => test.module === current);
  if (!modules.length) return null;

  return (
    <section className="mt-14 border-t border-ink/10 pt-10">
      <h2 className="text-[26px]">Full practice tests</h2>
      <p className="mt-1 max-w-2xl text-ink/65">
        Work through a complete module paper at your own pace — no timer, with
        answers shown after you submit.
      </p>

      <div
        className="mt-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Module"
      >
        {modules.map(item => {
          const Icon = MODULE_ICONS[item];
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={current === item}
              onClick={() => setModule(item)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                current === item
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 hover:border-ink/40"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {MODULE_LABELS[item]}
              <span
                className={current === item ? "text-white/60" : "text-ink/40"}
              >
                {tests.filter(test => test.module === item).length}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-6 rounded-[var(--radius-card)] bg-[var(--student-card)] ring-1 ring-ink/8">
        {visible.map((test, index) => {
          const action = actionFor(test);
          return (
            <li
              key={test.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-4 px-5 py-4",
                index > 0 && "border-t border-ink/10"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{test.title}</p>
                {test.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink/60">
                    {test.description}
                  </p>
                )}
                <p className="mt-1 text-sm text-ink/60">
                  {test.questionCount} question
                  {test.questionCount === 1 ? "" : "s"}
                  {test.bestBand !== null && (
                    <>
                      {" "}
                      · Best band{" "}
                      <strong className="text-ink">
                        {formatBand(test.bestBand)}
                      </strong>
                    </>
                  )}
                  {test.lastAttempt && !test.inProgressAttemptId && (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href={`/student/attempts/${test.lastAttempt.id}`}
                        className="underline"
                      >
                        Review last attempt
                      </Link>
                    </>
                  )}
                </p>
              </div>
              {action ? (
                <button
                  type="button"
                  className="hv-btn hv-btn-dark"
                  disabled={starting}
                  onClick={action.run}
                >
                  <span className="hv-btn-label">
                    <span>{action.label}</span>
                    <span aria-hidden="true">{action.label}</span>
                  </span>
                </button>
              ) : (
                <span className="text-sm text-ink/60">No attempts left</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TestsHome({ initialMode }: { initialMode?: "practice" | "exam" }) {
  const { user } = useAuth();
  const { data: profile } = trpc.student.profile.useQuery();
  const [libraryMode, setLibraryMode] = useState<"practice" | "exam">(
    initialMode ?? "practice"
  );
  const { data: serverTests = [], isLoading } = trpc.student.tests.useQuery();
  const allTests = serverTests.map(test => inMode(test, libraryMode));
  const { data: attempts = [] } = trpc.student.attempts.useQuery();
  const actions = useTestActions();
  const { actionFor, starting } = actions;
  const cambridge = allTests.filter(
    t => t.series === CAMBRIDGE.key && t.bookNumber && t.testNumber
  );
  const tests = allTests.filter(t => !cambridge.includes(t));
  // Practice shows every full test; Mock tests offers the same tests as timed exams.
  const libraryTests = tests;

  const completed = attempts.filter(
    ({ attempt }) => attempt.status !== "in_progress"
  );
  const gradedBands = completed
    .map(({ attempt }) => Number(attempt.band))
    .filter(Number.isFinite);
  const bestBand = gradedBands.length ? Math.max(...gradedBands) : null;
  const averageBand = gradedBands.length
    ? gradedBands.reduce((sum, band) => sum + band, 0) / gradedBands.length
    : null;
  // Resume whichever attempt is open, whatever mode it was started in.
  const openTest = serverTests.find(test => test.inProgressAttemptId);
  const continueTest = openTest
    ? inMode(
        openTest,
        openTest.modes.exam.inProgressAttemptId ? "exam" : "practice"
      )
    : undefined;
  const suggestedTest =
    continueTest ??
    allTests.find(
      test =>
        !test.attemptsUsed &&
        (test.attemptsLeft === null || test.attemptsLeft > 0)
    );
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Student";

  useEffect(() => {
    if (initialMode) setLibraryMode(initialMode);
  }, [initialMode]);

  const bestByModule = MODULE_ORDER.map(module => {
    const bands = allTests
      .filter(t => t.module === module && t.bestBand !== null)
      .map(t => t.bestBand!);
    return { module, best: bands.length ? Math.max(...bands) : null };
  });

  return (
    <div className={STUDENT_PAGE_CLASS}>
      {!initialMode && (
        <>
          <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-ink px-6 py-8 text-white sm:px-9 sm:py-10 lg:px-12 lg:py-12">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 top-10 h-44 w-44 rounded-full border border-white/10" />
            <div className="relative max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-medium text-white/65">
                <Sparkles className="h-4 w-4 text-brand-red-light" />
                Student dashboard
              </p>
              <h1 className="mt-4 text-[36px] text-white sm:text-[48px]">
                Welcome back, {firstName}.
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                {continueTest
                  ? "You have a test in progress. Pick up exactly where you left off."
                  : "Build exam confidence one focused practice session at a time."}
              </p>
              {suggestedTest &&
                (() => {
                  const action = actionFor(suggestedTest);
                  return action ? (
                    <HvActionButton
                      onClick={action.run}
                      disabled={starting}
                      variant="red"
                      className="mt-7"
                      icon={
                        continueTest ? (
                          <Play className="h-4 w-4 fill-current" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )
                      }
                    >
                      {continueTest ? "Resume test" : "Start your first test"}
                    </HvActionButton>
                  ) : null;
                })()}
            </div>
          </section>

          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
              <dt className="flex items-center gap-2 text-sm text-ink/55">
                <CheckCircle2 className="h-4 w-4 text-brand-red" />
                Tests completed
              </dt>
              <dd className="mt-3 text-[32px] font-semibold leading-none">
                {completed.length}
              </dd>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
              <dt className="flex items-center gap-2 text-sm text-ink/55">
                <Award className="h-4 w-4 text-brand-red" />
                Best band
              </dt>
              <dd className="mt-3 text-[32px] font-semibold leading-none">
                {formatBand(bestBand)}
              </dd>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
              <dt className="flex items-center gap-2 text-sm text-ink/55">
                <Sparkles className="h-4 w-4 text-brand-red" />
                Average band
              </dt>
              <dd className="mt-3 text-[32px] font-semibold leading-none">
                {formatBand(averageBand)}
              </dd>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
              <dt className="flex items-center gap-2 text-sm text-ink/55">
                <Target className="h-4 w-4 text-brand-red" />
                Target band
              </dt>
              <dd className="mt-3 text-[32px] font-semibold leading-none">
                {profile?.targetBand ? (
                  formatBand(profile.targetBand)
                ) : (
                  <Link
                    href="/student/profile"
                    className="text-base font-medium text-brand-red underline underline-offset-4"
                  >
                    Set target
                  </Link>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm text-ink/55">
                    <DecorSquare />
                    Skill snapshot
                  </p>
                  <h2 className="text-[28px]">Your best by module</h2>
                </div>
                <Link
                  href="/student/results"
                  className="hidden items-center gap-1 text-sm font-medium underline-offset-4 hover:underline sm:flex"
                >
                  View all results <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {bestByModule.map(({ module, best }) => {
                  const Icon = MODULE_ICONS[module];
                  const value = best ?? 0;
                  return (
                    <div
                      key={module}
                      className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8"
                    >
                      <dt className="flex items-center justify-between gap-2 text-sm text-ink/60">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-brand-red" />
                          {MODULE_LABELS[module]}
                        </span>
                        <strong className="text-xl text-ink">
                          {formatBand(best)}
                        </strong>
                      </dt>
                      <dd className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <span
                          className="block h-full rounded-full bg-brand-red transition-[width]"
                          style={{
                            width: `${Math.min(100, (value / 9) * 100)}%`,
                          }}
                        />
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>

            <section>
              <p className="mb-2 text-sm text-ink/55">Latest activity</p>
              <h2 className="text-[28px]">Recent results</h2>
              {completed.length ? (
                <ul className="mt-5 overflow-hidden rounded-[var(--radius-card)] bg-[var(--student-card)] ring-1 ring-ink/8">
                  {completed.slice(0, 3).map(({ attempt, test }, index) => (
                    <li
                      key={attempt.id}
                      className={index ? "border-t border-ink/10" : ""}
                    >
                      <Link
                        href={`/student/attempts/${attempt.id}`}
                        className="group flex items-center gap-4 p-4 transition-colors hover:bg-sand/60"
                      >
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                          {formatBand(attempt.band)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate font-medium">
                            {test.title}
                          </strong>
                          <span className="mt-0.5 block text-xs text-ink/55">
                            {MODULE_LABELS[test.module]} ·{" "}
                            {new Date(attempt.startedAt).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-ink/35 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-[var(--radius-card)] border border-dashed border-ink/20 bg-white/60 p-6 text-sm text-ink/60">
                  Your latest marked tests will appear here.
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <div
        id="practice-library"
        className={cn(initialMode ? "" : "mt-16 border-t border-ink/15 pt-10")}
      >
        <p className="mb-3 flex items-center gap-2 text-lg">
          <DecorSquare />
          {libraryMode === "practice" ? "Practice library" : "Exam preparation"}
        </p>
        <h1 className="text-[32px] sm:text-[40px]">
          {initialMode
            ? libraryMode === "practice"
              ? "Practice modules"
              : "Mock tests"
            : "Choose your next test"}
        </h1>
        <p className="mt-2 max-w-2xl text-ink/65">
          {libraryMode === "practice"
            ? "Improve one skill at a time without exam pressure."
            : "Complete timed papers under realistic exam conditions."}
        </p>
        {!initialMode && (
          <div
            className="mt-6 inline-flex rounded-[var(--radius-control)] bg-sand p-1"
            role="tablist"
            aria-label="Test type"
          >
            {(["practice", "exam"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={libraryMode === mode}
                onClick={() => setLibraryMode(mode)}
                className={cn(
                  "rounded-[7px] px-5 py-2.5 text-sm font-medium transition-colors",
                  libraryMode === mode
                    ? "bg-ink text-white shadow-sm"
                    : "text-ink/65 hover:text-ink"
                )}
              >
                {mode === "practice" ? "Practice modules" : "Mock tests"}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-ink/60">Loading tests…</div>
      ) : allTests.length === 0 ? (
        <div className="mt-12 rounded-[var(--radius-card)] border border-dashed border-ink/20 bg-white/60 p-12 text-center">
          <h2 className="text-2xl">No tests available yet</h2>
          <p className="mt-2 text-ink/60">
            Your mentor will publish mock tests here. Check back soon.
          </p>
        </div>
      ) : (
        <>
          {libraryMode === "exam" && cambridge.length > 0 && (
            <CambridgeLibrary tests={cambridge} actions={actions} />
          )}
          {libraryMode === "practice" && (
            <QuestionTypePractice tests={allTests} />
          )}
          {libraryMode === "practice" && (
            <FullPracticeTests tests={libraryTests} actions={actions} />
          )}
          {libraryMode === "exam" &&
            MODULE_ORDER.filter(module =>
              libraryTests.some(t => t.module === module)
            ).map(module => {
              const Icon = MODULE_ICONS[module];
              return (
                <section key={module} className="mt-14">
                  <h2 className="mb-5 flex items-center gap-3 text-[26px]">
                    <Icon
                      className="h-6 w-6 text-brand-red"
                      aria-hidden="true"
                    />
                    {MODULE_LABELS[module]}
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {libraryTests
                      .filter(t => t.module === module)
                      .map(test => {
                        const action = actionFor(test);
                        return (
                          <div
                            key={test.id}
                            className="flex flex-col justify-between gap-6 rounded-[var(--radius-card)] bg-[var(--student-card)] p-6 ring-1 ring-ink/8"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span
                                  className={cn(
                                    "rounded-full px-3 py-1 font-medium",
                                    test.mode === "exam"
                                      ? "bg-ink text-white"
                                      : "bg-cream"
                                  )}
                                >
                                  {test.mode === "exam"
                                    ? "Timed exam"
                                    : "Practice"}
                                </span>
                                {test.durationMinutes &&
                                  test.mode === "exam" && (
                                    <span className="inline-flex items-center gap-1 text-ink/70">
                                      <Clock
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                      />
                                      {test.durationMinutes} min
                                    </span>
                                  )}
                                <span className="text-ink/70">
                                  {test.questionCount} question
                                  {test.questionCount === 1 ? "" : "s"}
                                </span>
                              </div>
                              <h3 className="mt-4 text-[24px]">{test.title}</h3>
                              {test.description && (
                                <p className="mt-2 text-ink/70">
                                  {test.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-end justify-between gap-4">
                              <div className="text-sm text-ink/70">
                                {test.bestBand !== null && (
                                  <p>
                                    Best band{" "}
                                    <strong className="text-lg text-ink">
                                      {formatBand(test.bestBand)}
                                    </strong>
                                  </p>
                                )}
                                {test.lastAttempt &&
                                  !test.inProgressAttemptId && (
                                    <Link
                                      href={`/student/attempts/${test.lastAttempt.id}`}
                                      className="underline"
                                    >
                                      Last attempt:{" "}
                                      {STATUS_TEXT[test.lastAttempt.status]}
                                    </Link>
                                  )}
                                {test.attemptsLeft !== null && (
                                  <p>
                                    {test.attemptsLeft} attempt
                                    {test.attemptsLeft === 1 ? "" : "s"} left
                                  </p>
                                )}
                              </div>
                              {action ? (
                                <button
                                  type="button"
                                  className="hv-btn hv-btn-dark"
                                  disabled={starting}
                                  onClick={action.run}
                                >
                                  <span className="hv-btn-label">
                                    <span>{action.label}</span>
                                    <span aria-hidden="true">
                                      {action.label}
                                    </span>
                                  </span>
                                </button>
                              ) : (
                                <span className="text-sm text-ink/60">
                                  No attempts left
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              );
            })}
          {!isLoading &&
            libraryTests.length === 0 &&
            !(libraryMode === "exam" && cambridge.length) &&
            !(libraryMode === "practice" && allTests.length) && (
              <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-ink/20 bg-white/60 p-10 text-center text-ink/60">
                No{" "}
                {libraryMode === "practice" ? "practice modules" : "mock tests"}{" "}
                are published yet.
              </div>
            )}
        </>
      )}
    </div>
  );
}

function BatchPage() {
  const { data, isLoading } = trpc.student.batch.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg">
        <DecorSquare />
        Learning details
      </p>
      <h1 className="text-[36px] sm:text-[44px]">My batch</h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        Your course and batch information is maintained by the academy
        administration.
      </p>

      {!data ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-ink/20 bg-white/60 p-10 text-center sm:p-14">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand">
            <CalendarDays className="h-6 w-6 text-brand-red" />
          </span>
          <h2 className="mt-5 text-2xl">No batch assigned yet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink/60">
            Ask the administrator to verify an enrollment with your account
            email and assign a batch. It will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-[var(--radius-card)] bg-[var(--student-card)] ring-1 ring-ink/8">
          <div className="relative overflow-hidden bg-ink px-6 py-8 text-white sm:px-9">
            <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <p className="text-sm font-medium text-white/55">Current batch</p>
            <div className="relative mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="text-[30px] text-white sm:text-[36px]">
                  {data.batch?.name || "Batch assignment pending"}
                </h2>
                <p className="mt-2 text-white/60">
                  {data.course?.nameEn ||
                    data.course?.name ||
                    "Course details pending"}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/25">
                Verified enrollment
              </span>
            </div>
          </div>

          <dl className="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-[var(--student-card)] p-6">
              <dt className="flex items-center gap-2 text-sm text-ink/50">
                <Building2 className="h-4 w-4 text-brand-red" />
                Course
              </dt>
              <dd className="mt-2 font-medium">
                {data.course?.nameEn || data.course?.name || "Not specified"}
              </dd>
            </div>
            <div className="bg-[var(--student-card)] p-6">
              <dt className="flex items-center gap-2 text-sm text-ink/50">
                <CalendarDays className="h-4 w-4 text-brand-red" />
                Start date
              </dt>
              <dd className="mt-2 font-medium">
                {data.batch?.startDate
                  ? new Date(data.batch.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "To be announced"}
              </dd>
            </div>
            <div className="bg-[var(--student-card)] p-6">
              <dt className="flex items-center gap-2 text-sm text-ink/50">
                <Clock className="h-4 w-4 text-brand-red" />
                Schedule
              </dt>
              <dd className="mt-2 font-medium">
                {data.course?.schedule || "To be announced"}
              </dd>
            </div>
            <div className="bg-[var(--student-card)] p-6">
              <dt className="flex items-center gap-2 text-sm text-ink/50">
                <UserRound className="h-4 w-4 text-brand-red" />
                Instructor
              </dt>
              <dd className="mt-2 font-medium">
                {data.course?.instructorName || "To be announced"}
              </dd>
            </div>
            <div className="bg-[var(--student-card)] p-6">
              <dt className="flex items-center gap-2 text-sm text-ink/50">
                <BookOpenText className="h-4 w-4 text-brand-red" />
                Duration
              </dt>
              <dd className="mt-2 font-medium">
                {data.course?.duration || "Not specified"}
              </dd>
            </div>
            <div className="bg-[var(--student-card)] p-6">
              <dt className="flex items-center gap-2 text-sm text-ink/50">
                <Users className="h-4 w-4 text-brand-red" />
                Batch capacity
              </dt>
              <dd className="mt-2 font-medium">
                {data.batch
                  ? `${data.batch.currentCount ?? 0} / ${data.batch.maxCapacity ?? 30} students`
                  : "Not available"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 bg-sand/50 px-6 py-5 sm:px-9">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-ink/45">
                Student ID
              </p>
              <p className="mt-1 font-mono font-semibold">
                {data.enrollment.studentId || "Pending"}
              </p>
            </div>
            <p className="text-sm text-ink/55">
              Batch updates made by Admin appear here automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourcesPage() {
  const { data: rows = [], isLoading } = trpc.student.resources.useQuery();
  const { data: vocabularyRows = [], isLoading: vocabularyLoading } =
    trpc.student.vocabulary.useQuery();
  const [view, setView] = useState<"files" | "vocabulary">("files");
  const [wordSearch, setWordSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [learned, setLearned] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      setLearned(
        new Set(
          JSON.parse(
            localStorage.getItem("fluentlearner-learned-words") || "[]"
          )
        )
      );
    } catch {
      setLearned(new Set());
    }
  }, []);

  const toggleLearned = (word: string) => {
    setLearned(current => {
      const next = new Set(current);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      localStorage.setItem(
        "fluentlearner-learned-words",
        JSON.stringify([...next])
      );
      return next;
    });
  };

  const speak = (word: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = "en-GB";
    window.speechSynthesis.speak(speech);
  };

  const vocabulary = vocabularyRows.map(item => ({
    word: item.word,
    type: item.partOfSpeech,
    meaning: item.meaning,
    example: item.example,
    topic: item.topic,
  }));
  const topics = ["All", ...new Set(vocabulary.map(item => item.topic))];
  const visibleWords = vocabulary.filter(
    item =>
      (topic === "All" || item.topic === topic) &&
      (!wordSearch.trim() ||
        `${item.word} ${item.meaning} ${item.example}`
          .toLowerCase()
          .includes(wordSearch.trim().toLowerCase()))
  );

  const iconFor = (mime: string | null) => {
    if (mime?.startsWith("audio/")) return FileAudio;
    if (mime?.startsWith("video/")) return Video;
    if (mime?.startsWith("image/")) return FileImage;
    if (mime?.includes("zip") || mime?.includes("compressed"))
      return FileArchive;
    return FileText;
  };

  const sizeLabel = (bytes: number | null) => {
    if (!bytes) return "External resource";
    return bytes < 1024 * 1024
      ? `${Math.ceil(bytes / 1024)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg">
        <DecorSquare />
        Learning library
      </p>
      <h1 className="text-[36px] sm:text-[44px]">Resources</h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        Files, recordings, links, and study materials shared by your mentor.
      </p>

      <div className="mt-7 inline-flex rounded-[var(--radius-control)] bg-sand p-1">
        <button
          type="button"
          onClick={() => setView("files")}
          className={cn(
            "rounded-[7px] px-5 py-2.5 text-sm font-medium",
            view === "files" ? "bg-ink text-white" : "text-ink/60"
          )}
        >
          Resource files
        </button>
        <button
          type="button"
          onClick={() => setView("vocabulary")}
          className={cn(
            "rounded-[7px] px-5 py-2.5 text-sm font-medium",
            view === "vocabulary" ? "bg-ink text-white" : "text-ink/60"
          )}
        >
          Vocabulary collection
        </button>
      </div>

      {view === "vocabulary" ? (
        <section className="mt-8">
          <div className="rounded-[var(--radius-card)] bg-ink p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm text-white/55">Your progress</p>
                <p className="mt-2 text-[30px] font-medium">
                  {learned.size}{" "}
                  <span className="text-base font-normal text-white/45">
                    of {vocabulary.length} words learned
                  </span>
                </p>
              </div>
              <div className="w-full max-w-sm">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-brand-red"
                    style={{
                      width: `${vocabulary.length ? (learned.size / vocabulary.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                value={wordSearch}
                onChange={event => setWordSearch(event.target.value)}
                placeholder="Search words, meanings, or examples…"
                className={cn(HV_FIELD, "pl-11")}
              />
            </label>
            <HvSelect
              label="Filter by topic"
              value={topic}
              onChange={setTopic}
              allowEmpty={false}
              placeholder="All topics"
              options={topics.map(value => ({
                value,
                label: value === "All" ? "All topics" : value,
              }))}
              className="sm:w-60"
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {visibleWords.map(item => {
              const isLearned = learned.has(item.word);
              return (
                <article
                  key={item.word}
                  className={cn(
                    "rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 transition-colors",
                    isLearned ? "ring-emerald-500/30" : "ring-ink/8"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[24px]">{item.word}</h2>
                        <button
                          type="button"
                          onClick={() => speak(item.word)}
                          className="rounded-full p-2 text-ink/40 hover:bg-sand hover:text-brand-red"
                          aria-label={`Pronounce ${item.word}`}
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs italic text-brand-red">
                        {item.type} · {item.topic}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLearned(item.word)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border",
                        isLearned
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-ink/15 text-ink/30 hover:border-emerald-600 hover:text-emerald-600"
                      )}
                      aria-label={
                        isLearned
                          ? `Mark ${item.word} as not learned`
                          : `Mark ${item.word} as learned`
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-4 leading-relaxed text-ink/70">
                    {item.meaning}
                  </p>
                  <p className="mt-3 border-l-2 border-brand-red/40 pl-3 text-sm italic leading-relaxed text-ink/50">
                    “{item.example}”
                  </p>
                </article>
              );
            })}
          </div>
          {!vocabularyLoading && !visibleWords.length && (
            <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-ink/20 bg-white/60 p-10 text-center text-ink/50">
              No vocabulary matches your search.
            </div>
          )}
        </section>
      ) : isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-ink/20 bg-white/60 p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink/25" />
          <h2 className="mt-4 text-2xl">No resources yet</h2>
          <p className="mt-2 text-ink/55">
            Files shared globally or with your batch will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {rows.map(({ resource, batch }) => {
            const Icon = iconFor(resource.mimeType);
            const external = !resource.fileSize;
            return (
              <article
                key={resource.id}
                className="group flex flex-col rounded-[var(--radius-card)] bg-[var(--student-card)] p-6 ring-1 ring-ink/8 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-sand">
                    <Icon className="h-5 w-5 text-brand-red" />
                  </span>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/60">
                    {batch?.name || "All students"}
                  </span>
                </div>
                <h2 className="mt-5 text-xl">{resource.title}</h2>
                {resource.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/60">
                    {resource.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                  <span className="min-w-0 truncate text-xs text-ink/45">
                    {resource.fileName || sizeLabel(resource.fileSize)}
                  </span>
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={external ? undefined : resource.fileName || true}
                    className="hv-btn hv-btn-dark hv-btn-xs flex-none rounded-full"
                  >
                    <span className="hv-btn-label">
                      {[false, true].map(copy => (
                        <span
                          key={String(copy)}
                          aria-hidden={copy || undefined}
                        >
                          {external ? (
                            <ExternalLink className="h-4 w-4" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {external ? "Open" : "Download"}
                        </span>
                      ))}
                    </span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TypingPracticePage() {
  const [passageIndex, setPassageIndex] = useState(0);
  const [duration, setDuration] = useState(60);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passage = TYPING_PASSAGES[passageIndex].text;
  const running = startedAt !== null && !finished;

  const correctChars = typed
    .split("")
    .reduce(
      (count, character, index) =>
        count + (character === passage[index] ? 1 : 0),
      0
    );
  const minutes = Math.max(elapsed, 1) / 60;
  const wpm = Math.max(0, Math.round(correctChars / 5 / minutes));
  const accuracy = typed.length
    ? Math.round((correctChars / typed.length) * 100)
    : 100;
  const timeLeft = Math.max(0, Math.ceil(duration - elapsed));
  const progress = Math.min(100, (typed.length / passage.length) * 100);

  useEffect(() => {
    setBest(Number(localStorage.getItem("fluentlearner-typing-best") || 0));
  }, []);

  useEffect(() => {
    if (!running || !startedAt) return;
    const interval = window.setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      setElapsed(Math.min(duration, seconds));
      if (seconds >= duration) setFinished(true);
    }, 100);
    return () => window.clearInterval(interval);
  }, [duration, running, startedAt]);

  useEffect(() => {
    if (!finished || wpm <= best) return;
    setBest(wpm);
    localStorage.setItem("fluentlearner-typing-best", String(wpm));
  }, [best, finished, wpm]);

  const start = () => {
    setTyped("");
    setElapsed(0);
    setFinished(false);
    setStartedAt(Date.now());
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const reset = () => {
    setTyped("");
    setElapsed(0);
    setFinished(false);
    setStartedAt(null);
  };

  const nextPassage = () => {
    reset();
    setPassageIndex(index => (index + 1) % TYPING_PASSAGES.length);
  };

  const randomPassage = () => {
    reset();
    setPassageIndex(index => {
      const next = Math.floor(Math.random() * (TYPING_PASSAGES.length - 1));
      return next >= index ? next + 1 : next; // never the same passage twice in a row
    });
  };

  const type = (value: string) => {
    if (!running) return;
    const next = value.slice(0, passage.length);
    setTyped(next);
    if (next.length === passage.length) {
      setElapsed((Date.now() - (startedAt ?? Date.now())) / 1000);
      setFinished(true);
    }
  };

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg">
        <DecorSquare />
        Skill builder
      </p>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[36px] sm:text-[44px]">Typing practice</h1>
          <p className="mt-3 max-w-2xl text-ink/60">
            Build the speed and accuracy you need for computer-delivered IELTS.
          </p>
        </div>
        <div
          className="flex rounded-[var(--radius-control)] bg-sand p-1"
          aria-label="Session duration"
        >
          {[30, 60, 120].map(seconds => (
            <button
              key={seconds}
              type="button"
              disabled={running}
              onClick={() => {
                reset();
                setDuration(seconds);
              }}
              className={cn(
                "rounded-[7px] px-4 py-2 text-sm font-medium disabled:opacity-50",
                duration === seconds ? "bg-ink text-white" : "text-ink/60"
              )}
            >
              {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
            </button>
          ))}
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/50">
            <Gauge className="h-4 w-4 text-brand-red" />
            Speed
          </dt>
          <dd className="mt-2 text-[30px] font-semibold">
            {wpm} <span className="text-sm font-normal text-ink/45">WPM</span>
          </dd>
        </div>
        <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/50">
            <Target className="h-4 w-4 text-brand-red" />
            Accuracy
          </dt>
          <dd className="mt-2 text-[30px] font-semibold">
            {accuracy}
            <span className="text-sm font-normal text-ink/45">%</span>
          </dd>
        </div>
        <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/50">
            <Timer className="h-4 w-4 text-brand-red" />
            Time left
          </dt>
          <dd className="mt-2 text-[30px] font-semibold">
            {timeLeft}
            <span className="text-sm font-normal text-ink/45">s</span>
          </dd>
        </div>
        <div className="rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/50">
            <Award className="h-4 w-4 text-brand-red" />
            Personal best
          </dt>
          <dd className="mt-2 text-[30px] font-semibold">
            {best} <span className="text-sm font-normal text-ink/45">WPM</span>
          </dd>
        </div>
      </dl>

      <section className="mt-6 overflow-hidden rounded-[var(--radius-card)] bg-[var(--student-card)] ring-1 ring-ink/8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 px-6 py-4">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <Keyboard className="h-4 w-4 flex-none text-brand-red" />
            <span className="truncate">
              {TYPING_PASSAGES[passageIndex].title}
            </span>
            <span className="flex-none rounded-full bg-sand px-2.5 py-0.5 text-xs font-normal text-ink/60">
              {TYPING_PASSAGES[passageIndex].topic}
            </span>
          </span>
          <div className="flex items-center gap-3">
            <HvSelect
              label="Choose a passage"
              value={String(passageIndex)}
              onChange={value => {
                reset();
                setPassageIndex(Number(value));
              }}
              disabled={running}
              allowEmpty={false}
              size="sm"
              placeholder="Choose a passage"
              options={TYPING_TOPICS.flatMap(topic =>
                TYPING_PASSAGES.flatMap((item, index) =>
                  item.topic === topic
                    ? [
                        {
                          value: String(index),
                          label: item.title,
                          group: topic,
                        },
                      ]
                    : []
                )
              )}
              className="w-56"
            />
            <button
              type="button"
              disabled={running}
              onClick={randomPassage}
              className="text-sm text-ink/55 underline-offset-4 hover:underline disabled:opacity-40"
            >
              Random
            </button>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div
            className="select-none font-mono text-[18px] leading-[1.9] tracking-[0.01em]"
            aria-label="Text to type"
          >
            {passage.split("").map((character, index) => (
              <span
                key={index}
                className={cn(
                  index < typed.length &&
                    typed[index] === character &&
                    "text-emerald-700",
                  index < typed.length &&
                    typed[index] !== character &&
                    "rounded-sm bg-red-100 text-red-700",
                  index === typed.length &&
                    running &&
                    "border-b-2 border-brand-red bg-brand-red/5",
                  index > typed.length && "text-ink/38"
                )}
              >
                {character}
              </span>
            ))}
          </div>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sand">
            <span
              className="block h-full rounded-full bg-brand-red transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <label className="mt-6 block text-sm font-medium text-ink/60">
            Type here
            <textarea
              ref={inputRef}
              value={typed}
              disabled={!running}
              onChange={event => type(event.target.value)}
              onPaste={event => event.preventDefault()}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              className={cn(
                HV_FIELD,
                "mt-2 block min-h-32 resize-none font-mono leading-relaxed"
              )}
              placeholder={
                finished
                  ? "Session complete"
                  : running
                    ? "Start typing the passage above…"
                    : "Press Start to begin"
              }
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            {!running && !finished && (
              <button
                type="button"
                onClick={start}
                className="hv-btn hv-btn-red py-3"
              >
                <span className="hv-btn-label">
                  <span>Start typing</span>
                  <span aria-hidden="true">Start typing</span>
                </span>
              </button>
            )}
            {(running || finished) && (
              <HvActionButton
                onClick={start}
                size="sm"
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Try again
              </HvActionButton>
            )}
            {finished && (
              <HvActionButton onClick={nextPassage} variant="outline" size="sm">
                Next passage
              </HvActionButton>
            )}
          </div>
        </div>
      </section>

      {finished && (
        <div className="mt-5 rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8">
          <p className="font-medium">
            Session complete — {wpm} WPM at {accuracy}% accuracy.
          </p>
          <p className="mt-1 text-sm text-ink/60">
            Aim for steady accuracy first; speed improves naturally with
            consistent practice.
          </p>
        </div>
      )}
    </div>
  );
}

const BANDS = [
  "5.0",
  "5.5",
  "6.0",
  "6.5",
  "7.0",
  "7.5",
  "8.0",
  "8.5",
  "9.0",
] as const;
type Band = (typeof BANDS)[number];

const ENROLLMENT_STATUS: Record<string, { label: string; className: string }> =
  {
    verified: {
      label: "Confirmed",
      className: "bg-[#2E7D32]/10 text-[#2E7D32]",
    },
    pending: {
      label: "Awaiting verification",
      className: "bg-[#ED6C02]/10 text-[#B25000]",
    },
    rejected: {
      label: "Rejected",
      className: "bg-brand-red/10 text-brand-red",
    },
    refunded: { label: "Refunded", className: "bg-ink/10 text-ink/70" },
  };

function StudentProfilePage() {
  const { data: profile, isLoading } = trpc.student.profile.useQuery();
  const { data: assignment } = trpc.student.batch.useQuery();
  const { data: enrollments = [] } = trpc.student.enrollments.useQuery();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [targetBand, setTargetBand] = useState<string>("");

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    setMobile(profile?.mobile || "");
    setTargetBand(profile?.targetBand || "");
  }, [profile?.name, profile?.mobile, profile?.targetBand]);

  const updateProfile = trpc.student.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated");
      await Promise.all([
        utils.student.profile.invalidate(),
        utils.student.enrollments.invalidate(),
        utils.auth.me.invalidate(),
      ]);
    },
    onError: error => toast.error(error.message),
  });
  const uploadAvatar = trpc.student.uploadAvatar.useMutation({
    onSuccess: async () => {
      toast.success("Profile photo updated");
      await utils.student.profile.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const changePhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be 5MB or smaller");
    uploadAvatar.mutate({
      base64: await fileToBase64(file),
      filename: file.name,
      contentType: file.type,
    });
  };

  if (isLoading || !profile)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );

  const initials = (profile.name || profile.email)
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
  const inputClass = cn(HV_FIELD, "mt-2 block font-normal");
  const canEditMobile = enrollments.length > 0;
  const dirty =
    name.trim() !== (profile.name || "") ||
    targetBand !== (profile.targetBand || "") ||
    (canEditMobile && mobile.replace(/[\s-]/g, "") !== (profile.mobile || ""));
  const formatDate = (value: string | Date | null) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const save = () => {
    const nextMobile = mobile.replace(/[\s-]/g, "");
    updateProfile.mutate({
      name,
      targetBand: targetBand ? (targetBand as Band) : null,
      ...(canEditMobile && nextMobile !== (profile.mobile || "")
        ? { mobile: nextMobile }
        : {}),
    });
  };

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg">
        <DecorSquare />
        Account
      </p>
      <h1 className="text-[36px] sm:text-[44px]">My profile</h1>

      {/* Identity */}
      <section className="mt-9 flex flex-col gap-6 border-b border-ink/10 pb-8 sm:flex-row sm:items-center">
        <label
          className="group relative h-20 w-20 flex-none cursor-pointer overflow-hidden rounded-full bg-brand-red text-white"
          title="Change profile photo"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-center text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
            {uploadAvatar.isPending ? "Uploading…" : "Change photo"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadAvatar.isPending}
            onChange={event => changePhoto(event.target.files?.[0])}
          />
        </label>
        <div className="min-w-0">
          <h2 className="truncate text-[28px]">{profile.name || "Student"}</h2>
          <p className="mt-1 flex items-center gap-2 text-ink/60">
            <Mail className="h-4 w-4" />
            {profile.email}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-10 gap-y-4 sm:ml-auto sm:grid-cols-4 sm:text-right">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-ink/45">
              Student ID
            </dt>
            <dd className="mt-1 font-mono font-medium">
              {assignment?.enrollment.studentId || "Pending"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-ink/45">
              Course
            </dt>
            <dd className="mt-1 max-w-[180px] truncate">
              {assignment?.course?.nameEn || assignment?.course?.name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-ink/45">
              Batch
            </dt>
            <dd className="mt-1 max-w-[160px] truncate">
              {assignment?.batch?.name || "Not assigned"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-ink/45">
              Member since
            </dt>
            <dd className="mt-1">
              {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        {/* Personal details */}
        <form
          onSubmit={event => {
            event.preventDefault();
            save();
          }}
        >
          <h2 className="flex items-center gap-2 text-xl">
            <UserRound className="h-5 w-5 text-brand-red" />
            Personal details
          </h2>
          <p className="mt-1 text-sm text-ink/55">
            How your name and contact details appear to your mentor.
          </p>
          <label className="mt-6 block text-sm font-medium">
            Full name
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              minLength={2}
              required
              className={inputClass}
            />
          </label>
          <label className="mt-5 block text-sm font-medium">
            Mobile / WhatsApp
            <input
              value={mobile}
              onChange={event => setMobile(event.target.value)}
              disabled={!canEditMobile}
              placeholder={
                canEditMobile ? "01XXXXXXXXX" : "Added when you enroll"
              }
              type="tel"
              autoComplete="tel"
              className={cn(
                inputClass,
                !canEditMobile && "bg-sand/50 text-ink/55 opacity-100"
              )}
            />
          </label>
          <p className="mt-1.5 text-xs text-ink/45">
            {canEditMobile
              ? "We use this number to contact you about classes."
              : "Your number is saved when you enroll in a course."}
          </p>
          <label className="mt-5 block text-sm font-medium">
            Email address
            <input
              value={profile.email}
              readOnly
              className={cn(
                inputClass,
                "bg-sand/50 text-ink/55 hover:border-ink/20 focus:bg-sand/50"
              )}
            />
          </label>
          <p className="mt-1.5 text-xs text-ink/45">
            This is your login. Contact us to change it.
          </p>
          <div className="mt-5 text-sm font-medium">
            Target IELTS band
            <HvSelect
              label="Target IELTS band"
              value={targetBand}
              onChange={setTargetBand}
              placeholder="Not set"
              options={BANDS.map(band => ({
                value: band,
                label: `Band ${band}`,
              }))}
              className="mt-2 font-normal"
            />
          </div>
          <HvActionButton
            type="submit"
            disabled={updateProfile.isPending || !dirty}
            size="sm"
            className="mt-8"
          >
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </HvActionButton>
        </form>

        <div className="flex flex-col gap-12">
          {/* Enrollments & payments */}
          <section>
            <h2 className="flex items-center gap-2 text-xl">
              <BookOpenText className="h-5 w-5 text-brand-red" />
              My enrollments
            </h2>
            <p className="mt-1 text-sm text-ink/55">
              Your courses and payments.
            </p>
            {enrollments.length === 0 ? (
              <p className="mt-6 border-y border-ink/10 py-6 text-ink/60">
                You haven't enrolled in a course yet.{" "}
                <Link
                  href="/v2/courses"
                  className="font-medium text-brand-red hover:underline"
                >
                  Browse courses
                </Link>
              </p>
            ) : (
              <ul className="mt-6 border-t border-ink/10">
                {enrollments.map(item => {
                  const status =
                    ENROLLMENT_STATUS[item.status] ?? ENROLLMENT_STATUS.pending;
                  return (
                    <li key={item.id} className="border-b border-ink/10 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {item.courseNameEn || item.courseName || "Course"}
                          </p>
                          <p className="mt-0.5 text-sm text-ink/55">
                            Enrolled {formatDate(item.createdAt)}
                            {item.batchName ? ` · ${item.batchName}` : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-ink/45">Paid</dt>
                          <dd className="mt-0.5 font-medium">
                            {Number.isFinite(Number(item.paymentAmount))
                              ? `৳${Number(item.paymentAmount).toLocaleString("en-US")}`
                              : item.paymentAmount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink/45">Method</dt>
                          <dd className="mt-0.5">{item.paymentMethod}</dd>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <dt className="text-ink/45">Transaction ID</dt>
                          <dd className="mt-0.5 font-mono [overflow-wrap:anywhere]">
                            {item.transactionId}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Password */}
          <section>
            <h2 className="flex items-center gap-2 text-xl">
              <LockKeyhole className="h-5 w-5 text-brand-red" />
              Password
            </h2>
            <p className="mt-1 text-sm text-ink/55">
              If you enrolled online, we created a password for you. Change it
              to one you'll remember.
            </p>
            <HvButton
              href="/student/settings"
              variant="outline"
              size="sm"
              className="mt-5"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Change password
            </HvButton>
          </section>
        </div>
      </div>
    </div>
  );
}

function StudentSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changePassword = trpc.student.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: error => toast.error(error.message),
  });
  const inputClass = cn(HV_FIELD, "mt-2 block font-normal");

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg">
        <DecorSquare />
        Account preferences
      </p>
      <h1 className="text-[36px] sm:text-[44px]">Settings</h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        Manage your account security and sign-in password.
      </p>

      <form
        onSubmit={event => {
          event.preventDefault();
          if (newPassword !== confirmPassword)
            return toast.error("New passwords do not match");
          changePassword.mutate({ currentPassword, newPassword });
        }}
        className="mt-9 max-w-2xl rounded-[var(--radius-card)] bg-[var(--student-card)] p-6 ring-1 ring-ink/8 sm:p-8"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand">
            <LockKeyhole className="h-5 w-5 text-brand-red" />
          </span>
          <div>
            <h2 className="text-2xl">Change password</h2>
            <p className="mt-1 text-sm text-ink/45">
              Verify your current password before choosing a new one.
            </p>
          </div>
        </div>
        <label className="mt-7 block text-sm font-medium">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="mt-5 block text-sm font-medium">
          New password
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="mt-5 block text-sm font-medium">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            required
            className={inputClass}
          />
        </label>
        <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-control)] bg-sand/70 p-4 text-sm text-ink/60">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-700" />
          <p>
            Use at least eight characters. A strong password combines words,
            numbers, and symbols and is not reused on another website.
          </p>
        </div>
        <button
          type="submit"
          disabled={
            changePassword.isPending ||
            !currentPassword ||
            newPassword.length < 8 ||
            !confirmPassword
          }
          className="hv-btn hv-btn-dark hv-btn-sm mt-6"
        >
          <span className="hv-btn-label">
            <span>
              {changePassword.isPending
                ? "Changing password…"
                : "Update password"}
            </span>
            <span aria-hidden="true">
              {changePassword.isPending
                ? "Changing password…"
                : "Update password"}
            </span>
          </span>
        </button>
      </form>
    </div>
  );
}

function ResultsHistory() {
  const { data: rows = [], isLoading } = trpc.student.attempts.useQuery();
  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg">
        <DecorSquare />
        History
      </p>
      <h1 className="text-[36px] sm:text-[44px]">My results</h1>
      {isLoading ? (
        <div className="py-20 text-center text-ink/60">Loading…</div>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-lg text-ink/60">
          You haven't taken any tests yet.{" "}
          <Link href="/student" className="underline">
            Start one now
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-3">
          {rows.map(({ attempt, test }) => (
            <li key={attempt.id}>
              <Link
                href={`/student/attempts/${attempt.id}`}
                className="group flex items-center gap-6 rounded-[var(--radius-card)] bg-[var(--student-card)] p-5 ring-1 ring-ink/8 transition-colors hover:bg-sand/50"
              >
                <div className="w-20 flex-none text-center">
                  <div className="text-[32px] font-semibold leading-none">
                    {formatBand(attempt.band)}
                  </div>
                  <div className="mt-1 text-xs text-ink/60">band</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl">{test.title}</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {MODULE_LABELS[test.module]} · {STATUS_TEXT[attempt.status]}
                    {attempt.maxScore
                      ? ` · ${attempt.rawScore}/${attempt.maxScore} correct`
                      : ""}
                    {" · "}
                    {new Date(attempt.startedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ArrowButton />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const [pathname] = useLocation();
  let content = <TestsHome />;
  if (pathname === "/student/practice")
    content = <TestsHome initialMode="practice" />;
  else if (pathname === "/student/mocks")
    content = <TestsHome initialMode="exam" />;
  else if (pathname === "/student/results") content = <ResultsHistory />;
  else if (pathname === "/student/batch") content = <BatchPage />;
  else if (pathname === "/student/resources") content = <ResourcesPage />;
  else if (pathname === "/student/typing") content = <TypingPracticePage />;
  else if (pathname === "/student/profile") content = <StudentProfilePage />;
  else if (pathname === "/student/settings") content = <StudentSettingsPage />;
  return <StudentShell>{content}</StudentShell>;
}
