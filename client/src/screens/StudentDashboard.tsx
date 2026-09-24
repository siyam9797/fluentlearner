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
import { DecorSquare, ArrowButton } from "@/components/home-v2/primitives";
import { fileToBase64 } from "@/lib/fileToBase64";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { CAMBRIDGE, MODULE_LABELS, formatBand, type MockModule } from "@shared/mock";

const MODULE_ICONS: Record<MockModule, typeof BookOpenText> = {
  reading: BookOpenText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};
const MODULE_ORDER: MockModule[] = ["listening", "reading", "writing", "speaking"];
const STATUS_TEXT = { in_progress: "In progress", submitted: "Awaiting marking", graded: "Marked" } as const;
const STUDENT_PAGE_CLASS = "mx-auto w-full max-w-[1230px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14";

type StudentTest = RouterOutputs["student"]["tests"][number];

/** Start, resume or review a test — shared by the module cards and the Cambridge grid. */
function useTestActions() {
  const [, navigate] = useLocation();
  const start = trpc.student.start.useMutation({
    onSuccess: ({ attemptId }) => navigate(`/student/attempts/${attemptId}`),
    onError: err => toast.error(err.message),
  });
  const actionFor = (test: StudentTest) => {
    const canStart = test.attemptsLeft === null || test.attemptsLeft > 0;
    if (test.inProgressAttemptId) return { label: "Resume", run: () => navigate(`/student/attempts/${test.inProgressAttemptId}`) };
    if (!canStart) return null;
    return {
      label: test.attemptsUsed ? "Try again" : "Start test",
      run: () => {
        if (test.mode === "exam" && test.durationMinutes &&
          !confirm(`The ${test.durationMinutes}-minute timer starts now and keeps running if you leave. Ready?`)) return;
        start.mutate({ testId: test.id });
      },
    };
  };
  return { actionFor, starting: start.isPending };
}

function CambridgeLibrary({ tests, actions }: { tests: StudentTest[]; actions: ReturnType<typeof useTestActions> }) {
  const [, navigate] = useLocation();
  const { actionFor, starting } = actions;
  const books = [...new Set(tests.map(t => t.bookNumber!).filter(Boolean))].sort((a, b) => b - a);
  const [book, setBook] = useState(books[0]);
  const current = books.includes(book) ? book : books[0];
  const testNumbers = [...new Set(tests.filter(t => t.bookNumber === current).map(t => t.testNumber!))].sort((a, b) => a - b);
  const order: MockModule[] = ["listening", "reading", "writing", "speaking"];

  return (
    <section className="mt-14">
      <h2 className="text-[26px]">{CAMBRIDGE.label} library</h2>
      <p className="mt-2 text-ink/70">Have your Cambridge book ready — you'll read the questions (and play the audio) from the book and enter your answers here.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Choose a book">
        {books.map(n => (
          <button
            key={n}
            type="button"
            aria-pressed={n === current}
            onClick={() => setBook(n)}
            className={cn("rounded-full border px-4 py-2 text-sm font-medium", n === current ? "border-ink bg-ink text-white" : "border-ink/20 hover:border-ink")}
          >
            Book {n}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {testNumbers.map(testNumber => (
          <div key={testNumber} className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8">
            <h3 className="text-xl">Cambridge {current} · Test {testNumber}</h3>
            <ul className="mt-4 flex flex-col divide-y divide-ink/10">
              {order.map(module => {
                const test = tests.find(t => t.bookNumber === current && t.testNumber === testNumber && t.module === module);
                if (!test) return null;
                const Icon = MODULE_ICONS[module];
                const action = actionFor(test);
                return (
                  <li key={module} className="flex items-center gap-3 py-3">
                    <Icon className="h-5 w-5 flex-none text-brand-red" aria-hidden="true" />
                    <span className="flex-1 font-medium">{MODULE_LABELS[module]}</span>
                    {test.bestBand !== null && <span className="text-sm text-ink/70">Band <strong className="text-ink">{formatBand(test.bestBand)}</strong></span>}
                    {test.lastAttempt && !test.inProgressAttemptId && (
                      <button type="button" className="text-sm underline" onClick={() => navigate(`/student/attempts/${test.lastAttempt!.id}`)}>Result</button>
                    )}
                    {action && (
                      <button type="button" disabled={starting} onClick={action.run} className="rounded-full bg-ink px-4 py-1.5 text-sm text-white transition-colors hover:bg-brand-red">
                        {action.label === "Start test" ? "Start" : action.label}
                      </button>
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

function TestsHome({ initialMode }: { initialMode?: "practice" | "exam" }) {
  const { user } = useAuth();
  const { data: profile } = trpc.student.profile.useQuery();
  const [libraryMode, setLibraryMode] = useState<"practice" | "exam">(initialMode ?? "practice");
  const { data: allTests = [], isLoading } = trpc.student.tests.useQuery();
  const { data: attempts = [] } = trpc.student.attempts.useQuery();
  const actions = useTestActions();
  const { actionFor, starting } = actions;
  const cambridge = allTests.filter(t => t.series === CAMBRIDGE.key && t.bookNumber && t.testNumber);
  const tests = allTests.filter(t => !cambridge.includes(t));
  const libraryTests = tests.filter(test => test.mode === libraryMode);

  const completed = attempts.filter(({ attempt }) => attempt.status !== "in_progress");
  const gradedBands = completed.map(({ attempt }) => Number(attempt.band)).filter(Number.isFinite);
  const bestBand = gradedBands.length ? Math.max(...gradedBands) : null;
  const averageBand = gradedBands.length ? gradedBands.reduce((sum, band) => sum + band, 0) / gradedBands.length : null;
  const continueTest = allTests.find(test => test.inProgressAttemptId);
  const suggestedTest = continueTest ?? allTests.find(test => !test.attemptsUsed && (test.attemptsLeft === null || test.attemptsLeft > 0));
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Student";

  useEffect(() => {
    if (initialMode) setLibraryMode(initialMode);
  }, [initialMode]);

  const bestByModule = MODULE_ORDER.map(module => {
    const bands = allTests.filter(t => t.module === module && t.bestBand !== null).map(t => t.bestBand!);
    return { module, best: bands.length ? Math.max(...bands) : null };
  });

  return (
    <div className={STUDENT_PAGE_CLASS}>
      {!initialMode && <>
      <section className="relative overflow-hidden rounded-[12px] bg-ink px-6 py-8 text-white sm:px-9 sm:py-10 lg:px-12 lg:py-12">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 top-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-medium text-white/65"><Sparkles className="h-4 w-4 text-brand-red-light" />Student dashboard</p>
          <h1 className="mt-4 text-[36px] text-white sm:text-[48px]">Welcome back, {firstName}.</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            {continueTest ? "You have a test in progress. Pick up exactly where you left off." : "Build exam confidence one focused practice session at a time."}
          </p>
          {suggestedTest && (() => {
            const action = actionFor(suggestedTest);
            return action ? (
              <button type="button" onClick={action.run} disabled={starting} className="mt-7 inline-flex items-center gap-3 rounded-[5px] bg-brand-red px-5 py-3.5 font-medium text-white transition-colors hover:bg-brand-red-light">
                {continueTest ? <Play className="h-4 w-4 fill-current" /> : <ArrowRight className="h-4 w-4" />}
                {continueTest ? "Resume test" : "Start your first test"}
              </button>
            ) : null;
          })()}
        </div>
      </section>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/55"><CheckCircle2 className="h-4 w-4 text-brand-red" />Tests completed</dt>
          <dd className="mt-3 text-[32px] font-semibold leading-none">{completed.length}</dd>
        </div>
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/55"><Award className="h-4 w-4 text-brand-red" />Best band</dt>
          <dd className="mt-3 text-[32px] font-semibold leading-none">{formatBand(bestBand)}</dd>
        </div>
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/55"><Sparkles className="h-4 w-4 text-brand-red" />Average band</dt>
          <dd className="mt-3 text-[32px] font-semibold leading-none">{formatBand(averageBand)}</dd>
        </div>
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8">
          <dt className="flex items-center gap-2 text-sm text-ink/55"><Target className="h-4 w-4 text-brand-red" />Target band</dt>
          <dd className="mt-3 text-[32px] font-semibold leading-none">{profile?.targetBand ? formatBand(profile.targetBand) : <Link href="/student/profile" className="text-base font-medium text-brand-red underline underline-offset-4">Set target</Link>}</dd>
        </div>
      </dl>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm text-ink/55"><DecorSquare />Skill snapshot</p>
              <h2 className="text-[28px]">Your best by module</h2>
            </div>
            <Link href="/student/results" className="hidden items-center gap-1 text-sm font-medium underline-offset-4 hover:underline sm:flex">View all results <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            {bestByModule.map(({ module, best }) => {
              const Icon = MODULE_ICONS[module];
              const value = best ?? 0;
              return (
                <div key={module} className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8">
                  <dt className="flex items-center justify-between gap-2 text-sm text-ink/60"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-brand-red" />{MODULE_LABELS[module]}</span><strong className="text-xl text-ink">{formatBand(best)}</strong></dt>
                  <dd className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10"><span className="block h-full rounded-full bg-brand-red transition-[width]" style={{ width: `${Math.min(100, value / 9 * 100)}%` }} /></dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section>
          <p className="mb-2 text-sm text-ink/55">Latest activity</p>
          <h2 className="text-[28px]">Recent results</h2>
          {completed.length ? (
            <ul className="mt-5 overflow-hidden rounded-[8px] bg-white ring-1 ring-ink/8">
              {completed.slice(0, 3).map(({ attempt, test }, index) => (
                <li key={attempt.id} className={index ? "border-t border-ink/10" : ""}>
                  <Link href={`/student/attempts/${attempt.id}`} className="group flex items-center gap-4 p-4 transition-colors hover:bg-sand/60">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{formatBand(attempt.band)}</span>
                    <span className="min-w-0 flex-1"><strong className="block truncate font-medium">{test.title}</strong><span className="mt-0.5 block text-xs text-ink/55">{MODULE_LABELS[test.module]} · {new Date(attempt.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></span>
                    <ArrowRight className="h-4 w-4 text-ink/35 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-[8px] border border-dashed border-ink/20 p-6 text-sm text-ink/60">Your latest marked tests will appear here.</div>
          )}
        </section>
      </div>
      </>}

      <div id="practice-library" className={cn(initialMode ? "" : "mt-16 border-t border-ink/15 pt-10")}>
        <p className="mb-3 flex items-center gap-2 text-lg"><DecorSquare />{libraryMode === "practice" ? "Practice library" : "Exam preparation"}</p>
        <h1 className="text-[32px] sm:text-[40px]">{initialMode ? (libraryMode === "practice" ? "Practice modules" : "Mock tests") : "Choose your next test"}</h1>
        <p className="mt-2 max-w-2xl text-ink/65">{libraryMode === "practice" ? "Improve one skill at a time without exam pressure." : "Complete timed papers under realistic exam conditions."}</p>
        {!initialMode && <div className="mt-6 inline-flex rounded-[6px] bg-sand p-1" role="tablist" aria-label="Test type">
          {(["practice", "exam"] as const).map(mode => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={libraryMode === mode}
              onClick={() => setLibraryMode(mode)}
              className={cn("rounded-[4px] px-5 py-2.5 text-sm font-medium transition-colors", libraryMode === mode ? "bg-ink text-white shadow-sm" : "text-ink/65 hover:text-ink")}
            >
              {mode === "practice" ? "Practice modules" : "Mock tests"}
            </button>
          ))}
        </div>}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-ink/60">Loading tests…</div>
      ) : allTests.length === 0 ? (
        <div className="mt-12 rounded-[5px] border border-dashed border-ink/20 p-12 text-center">
          <h2 className="text-2xl">No tests available yet</h2>
          <p className="mt-2 text-ink/60">Your mentor will publish mock tests here. Check back soon.</p>
        </div>
      ) : (
        <>
        {libraryMode === "exam" && cambridge.length > 0 && <CambridgeLibrary tests={cambridge} actions={actions} />}
        {MODULE_ORDER.filter(module => libraryTests.some(t => t.module === module)).map(module => {
          const Icon = MODULE_ICONS[module];
          return (
            <section key={module} className="mt-14">
              <h2 className="mb-5 flex items-center gap-3 text-[26px]"><Icon className="h-6 w-6 text-brand-red" aria-hidden="true" />{MODULE_LABELS[module]}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {libraryTests.filter(t => t.module === module).map(test => {
                  const action = actionFor(test);
                  return (
                    <div key={test.id} className="flex flex-col justify-between gap-6 rounded-[8px] bg-white p-6 ring-1 ring-ink/8">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className={cn("rounded-full px-3 py-1 font-medium", test.mode === "exam" ? "bg-ink text-white" : "bg-cream")}>
                            {test.mode === "exam" ? "Timed exam" : "Practice"}
                          </span>
                          {test.durationMinutes && test.mode === "exam" && (
                            <span className="inline-flex items-center gap-1 text-ink/70"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{test.durationMinutes} min</span>
                          )}
                          <span className="text-ink/70">{test.questionCount} question{test.questionCount === 1 ? "" : "s"}</span>
                        </div>
                        <h3 className="mt-4 text-[24px]">{test.title}</h3>
                        {test.description && <p className="mt-2 text-ink/70">{test.description}</p>}
                      </div>
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="text-sm text-ink/70">
                          {test.bestBand !== null && <p>Best band <strong className="text-lg text-ink">{formatBand(test.bestBand)}</strong></p>}
                          {test.lastAttempt && !test.inProgressAttemptId && (
                            <Link href={`/student/attempts/${test.lastAttempt.id}`} className="underline">
                              Last attempt: {STATUS_TEXT[test.lastAttempt.status]}
                            </Link>
                          )}
                          {test.attemptsLeft !== null && <p>{test.attemptsLeft} attempt{test.attemptsLeft === 1 ? "" : "s"} left</p>}
                        </div>
                        {action ? (
                          <button type="button" className="hv-btn hv-btn-dark" disabled={starting} onClick={action.run}>
                            <span className="hv-btn-label"><span>{action.label}</span><span aria-hidden="true">{action.label}</span></span>
                          </button>
                        ) : (
                          <span className="text-sm text-ink/60">No attempts left</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {!isLoading && libraryTests.length === 0 && !(libraryMode === "exam" && cambridge.length) && (
          <div className="mt-8 rounded-[8px] border border-dashed border-ink/20 p-10 text-center text-ink/60">
            No {libraryMode === "practice" ? "practice modules" : "mock tests"} are published yet.
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
    return <div className="flex min-h-[60vh] items-center justify-center"><span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" /></div>;
  }

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg"><DecorSquare />Learning details</p>
      <h1 className="text-[36px] sm:text-[44px]">My batch</h1>
      <p className="mt-3 max-w-2xl text-ink/60">Your course and batch information is maintained by the academy administration.</p>

      {!data ? (
        <div className="mt-10 rounded-[10px] border border-dashed border-ink/20 bg-white p-10 text-center sm:p-14">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand"><CalendarDays className="h-6 w-6 text-brand-red" /></span>
          <h2 className="mt-5 text-2xl">No batch assigned yet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink/60">Ask the administrator to verify an enrollment with your account email and assign a batch. It will appear here automatically.</p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-[12px] bg-white ring-1 ring-ink/8">
          <div className="relative overflow-hidden bg-ink px-6 py-8 text-white sm:px-9">
            <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <p className="text-sm font-medium text-white/55">Current batch</p>
            <div className="relative mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="text-[30px] text-white sm:text-[36px]">{data.batch?.name || "Batch assignment pending"}</h2>
                <p className="mt-2 text-white/60">{data.course?.nameEn || data.course?.name || "Course details pending"}</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/25">Verified enrollment</span>
            </div>
          </div>

          <dl className="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6"><dt className="flex items-center gap-2 text-sm text-ink/50"><Building2 className="h-4 w-4 text-brand-red" />Course</dt><dd className="mt-2 font-medium">{data.course?.nameEn || data.course?.name || "Not specified"}</dd></div>
            <div className="bg-white p-6"><dt className="flex items-center gap-2 text-sm text-ink/50"><CalendarDays className="h-4 w-4 text-brand-red" />Start date</dt><dd className="mt-2 font-medium">{data.batch?.startDate ? new Date(data.batch.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "To be announced"}</dd></div>
            <div className="bg-white p-6"><dt className="flex items-center gap-2 text-sm text-ink/50"><Clock className="h-4 w-4 text-brand-red" />Schedule</dt><dd className="mt-2 font-medium">{data.course?.schedule || "To be announced"}</dd></div>
            <div className="bg-white p-6"><dt className="flex items-center gap-2 text-sm text-ink/50"><UserRound className="h-4 w-4 text-brand-red" />Instructor</dt><dd className="mt-2 font-medium">{data.course?.instructorName || "To be announced"}</dd></div>
            <div className="bg-white p-6"><dt className="flex items-center gap-2 text-sm text-ink/50"><BookOpenText className="h-4 w-4 text-brand-red" />Duration</dt><dd className="mt-2 font-medium">{data.course?.duration || "Not specified"}</dd></div>
            <div className="bg-white p-6"><dt className="flex items-center gap-2 text-sm text-ink/50"><Users className="h-4 w-4 text-brand-red" />Batch capacity</dt><dd className="mt-2 font-medium">{data.batch ? `${data.batch.currentCount ?? 0} / ${data.batch.maxCapacity ?? 30} students` : "Not available"}</dd></div>
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 bg-sand/50 px-6 py-5 sm:px-9">
            <div><p className="text-xs uppercase tracking-[0.12em] text-ink/45">Student ID</p><p className="mt-1 font-mono font-semibold">{data.enrollment.studentId || "Pending"}</p></div>
            <p className="text-sm text-ink/55">Batch updates made by Admin appear here automatically.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const VOCABULARY = [
  { word: "allocate", type: "verb", meaning: "to distribute something for a particular purpose", example: "The council allocated more funding to public transport.", topic: "Academic" },
  { word: "coherent", type: "adjective", meaning: "logical, clear, and easy to understand", example: "A coherent essay develops one central argument.", topic: "Writing" },
  { word: "consecutive", type: "adjective", meaning: "following continuously, one after another", example: "Attendance increased for three consecutive years.", topic: "Academic" },
  { word: "deteriorate", type: "verb", meaning: "to become progressively worse", example: "Air quality may deteriorate as traffic increases.", topic: "Environment" },
  { word: "disparity", type: "noun", meaning: "a significant difference or inequality", example: "The report highlights a disparity between urban and rural schools.", topic: "Society" },
  { word: "diverse", type: "adjective", meaning: "including many different types or people", example: "Large cities often have culturally diverse populations.", topic: "Society" },
  { word: "enhance", type: "verb", meaning: "to improve the quality or value of something", example: "Green spaces can enhance residents' quality of life.", topic: "Academic" },
  { word: "feasible", type: "adjective", meaning: "possible and practical to achieve", example: "Remote work is not feasible for every occupation.", topic: "Work" },
  { word: "fluctuate", type: "verb", meaning: "to rise and fall irregularly", example: "Energy prices fluctuated throughout the period.", topic: "Writing" },
  { word: "fundamental", type: "adjective", meaning: "basic and extremely important", example: "Trust is fundamental to a healthy community.", topic: "Academic" },
  { word: "implement", type: "verb", meaning: "to put a plan or policy into action", example: "The government implemented stricter recycling rules.", topic: "Government" },
  { word: "incentive", type: "noun", meaning: "something that encourages a person to act", example: "Tax reductions can provide an incentive to use clean energy.", topic: "Government" },
  { word: "inevitable", type: "adjective", meaning: "certain to happen and impossible to avoid", example: "Some degree of technological change is inevitable.", topic: "Technology" },
  { word: "innovative", type: "adjective", meaning: "introducing effective new ideas or methods", example: "The school adopted an innovative approach to language teaching.", topic: "Education" },
  { word: "mitigate", type: "verb", meaning: "to make a harmful situation less severe", example: "Planting trees can help mitigate urban heat.", topic: "Environment" },
  { word: "predominant", type: "adjective", meaning: "present as the strongest or main element", example: "Private cars remain the predominant form of transport.", topic: "Academic" },
  { word: "prevalent", type: "adjective", meaning: "common or widespread in a particular place", example: "Digital payment is increasingly prevalent among young adults.", topic: "Technology" },
  { word: "profound", type: "adjective", meaning: "having a deep or powerful effect", example: "Education can have a profound impact on social mobility.", topic: "Education" },
  { word: "reluctant", type: "adjective", meaning: "unwilling or hesitant to do something", example: "Some employees are reluctant to adopt new software.", topic: "Work" },
  { word: "resilient", type: "adjective", meaning: "able to recover quickly from difficulty", example: "Cities need resilient infrastructure to manage extreme weather.", topic: "Environment" },
  { word: "significant", type: "adjective", meaning: "important or large enough to be noticeable", example: "The data shows a significant decline in unemployment.", topic: "Writing" },
  { word: "sustainable", type: "adjective", meaning: "able to continue without damaging the environment", example: "Cycling is a sustainable mode of urban transport.", topic: "Environment" },
  { word: "undermine", type: "verb", meaning: "to weaken something gradually", example: "Misinformation can undermine public confidence.", topic: "Society" },
  { word: "viable", type: "adjective", meaning: "capable of working successfully", example: "Solar power is now a viable option for many households.", topic: "Technology" },
] as const;

function ResourcesPage() {
  const { data: rows = [], isLoading } = trpc.student.resources.useQuery();
  const { data: vocabularyRows = [], isLoading: vocabularyLoading } = trpc.student.vocabulary.useQuery();
  const [view, setView] = useState<"files" | "vocabulary">("files");
  const [wordSearch, setWordSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [learned, setLearned] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { setLearned(new Set(JSON.parse(localStorage.getItem("fluentlearner-learned-words") || "[]"))); } catch { setLearned(new Set()); }
  }, []);

  const toggleLearned = (word: string) => {
    setLearned(current => {
      const next = new Set(current);
      if (next.has(word)) next.delete(word); else next.add(word);
      localStorage.setItem("fluentlearner-learned-words", JSON.stringify([...next]));
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

  const vocabulary = vocabularyLoading ? VOCABULARY : vocabularyRows.map(item => ({ word: item.word, type: item.partOfSpeech, meaning: item.meaning, example: item.example, topic: item.topic }));
  const topics = ["All", ...new Set(vocabulary.map(item => item.topic))];
  const visibleWords = vocabulary.filter(item =>
    (topic === "All" || item.topic === topic) &&
    (!wordSearch.trim() || `${item.word} ${item.meaning} ${item.example}`.toLowerCase().includes(wordSearch.trim().toLowerCase())),
  );

  const iconFor = (mime: string | null) => {
    if (mime?.startsWith("audio/")) return FileAudio;
    if (mime?.startsWith("video/")) return Video;
    if (mime?.startsWith("image/")) return FileImage;
    if (mime?.includes("zip") || mime?.includes("compressed")) return FileArchive;
    return FileText;
  };

  const sizeLabel = (bytes: number | null) => {
    if (!bytes) return "External resource";
    return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg"><DecorSquare />Learning library</p>
      <h1 className="text-[36px] sm:text-[44px]">Resources</h1>
      <p className="mt-3 max-w-2xl text-ink/60">Files, recordings, links, and study materials shared by your mentor.</p>

      <div className="mt-7 inline-flex rounded-[6px] bg-sand p-1">
        <button type="button" onClick={() => setView("files")} className={cn("rounded-[4px] px-5 py-2.5 text-sm font-medium", view === "files" ? "bg-ink text-white" : "text-ink/60")}>Resource files</button>
        <button type="button" onClick={() => setView("vocabulary")} className={cn("rounded-[4px] px-5 py-2.5 text-sm font-medium", view === "vocabulary" ? "bg-ink text-white" : "text-ink/60")}>Vocabulary collection</button>
      </div>

      {view === "vocabulary" ? (
        <section className="mt-8">
          <div className="rounded-[10px] bg-ink p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div><p className="text-sm text-white/55">Your progress</p><p className="mt-2 text-[30px] font-medium">{learned.size} <span className="text-base font-normal text-white/45">of {vocabulary.length} words learned</span></p></div>
              <div className="w-full max-w-sm"><div className="h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-brand-red" style={{ width: `${vocabulary.length ? learned.size / vocabulary.length * 100 : 0}%` }} /></div></div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" /><input value={wordSearch} onChange={event => setWordSearch(event.target.value)} placeholder="Search words, meanings, or examples…" className="w-full rounded-[7px] border border-ink/15 bg-white py-3 pl-11 pr-4 outline-none focus:border-ink" /></label>
            <select value={topic} onChange={event => setTopic(event.target.value)} className="rounded-[7px] border border-ink/15 bg-white px-4 py-3 outline-none focus:border-ink">{topics.map(value => <option key={value}>{value}</option>)}</select>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {visibleWords.map(item => {
              const isLearned = learned.has(item.word);
              return <article key={item.word} className={cn("rounded-[10px] bg-white p-5 ring-1 transition-colors", isLearned ? "ring-emerald-500/30" : "ring-ink/8")}>
                <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="text-[24px]">{item.word}</h2><button type="button" onClick={() => speak(item.word)} className="rounded-full p-2 text-ink/40 hover:bg-sand hover:text-brand-red" aria-label={`Pronounce ${item.word}`}><Volume2 className="h-4 w-4" /></button></div><p className="text-xs italic text-brand-red">{item.type} · {item.topic}</p></div><button type="button" onClick={() => toggleLearned(item.word)} className={cn("flex h-9 w-9 items-center justify-center rounded-full border", isLearned ? "border-emerald-600 bg-emerald-600 text-white" : "border-ink/15 text-ink/30 hover:border-emerald-600 hover:text-emerald-600")} aria-label={isLearned ? `Mark ${item.word} as not learned` : `Mark ${item.word} as learned`}><CheckCircle2 className="h-4 w-4" /></button></div>
                <p className="mt-4 leading-relaxed text-ink/70">{item.meaning}</p>
                <p className="mt-3 border-l-2 border-brand-red/40 pl-3 text-sm italic leading-relaxed text-ink/50">“{item.example}”</p>
              </article>;
            })}
          </div>
          {!visibleWords.length && <div className="mt-8 rounded-[8px] border border-dashed border-ink/20 p-10 text-center text-ink/50">No vocabulary matches your search.</div>}
        </section>
      ) : isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" /></div>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-[10px] border border-dashed border-ink/20 bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink/25" />
          <h2 className="mt-4 text-2xl">No resources yet</h2>
          <p className="mt-2 text-ink/55">Files shared globally or with your batch will appear here.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {rows.map(({ resource, batch }) => {
            const Icon = iconFor(resource.mimeType);
            const external = !resource.fileSize;
            return (
              <article key={resource.id} className="group flex flex-col rounded-[10px] bg-white p-6 ring-1 ring-ink/8 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-sand"><Icon className="h-5 w-5 text-brand-red" /></span>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/60">{batch?.name || "All students"}</span>
                </div>
                <h2 className="mt-5 text-xl">{resource.title}</h2>
                {resource.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/60">{resource.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                  <span className="min-w-0 truncate text-xs text-ink/45">{resource.fileName || sizeLabel(resource.fileSize)}</span>
                  <a href={resource.fileUrl} target="_blank" rel="noreferrer" download={external ? undefined : resource.fileName || true} className="inline-flex flex-none items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red">
                    {external ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}{external ? "Open" : "Download"}
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

const TYPING_PASSAGES = [
  "Many students assume that progress depends on studying for long periods without a break. In reality, shorter sessions can be more effective when they are focused and repeated regularly. A clear goal helps the learner decide what to practise, while a brief review at the end of each session makes improvement easier to measure. Consistency is often more valuable than intensity.",
  "Public libraries have changed considerably over the last two decades. Although books remain central to their purpose, many libraries now provide digital resources, quiet workspaces, community events and practical training. These services are especially valuable for people who do not have reliable internet access or a suitable place to study at home.",
  "Cities around the world are investing in safer routes for walking and cycling. Supporters argue that active travel can reduce congestion, improve air quality and support public health. However, successful schemes require more than painted lanes. They also need secure parking, clear junctions and convenient connections with buses and trains.",
  "Learning a language involves more than memorising individual words. Skilled speakers recognise common phrases, notice how ideas are connected and adjust their language for different situations. Regular exposure is essential, but learners also need opportunities to produce the language, receive useful feedback and try again without fear of making mistakes.",
];

function TypingPracticePage() {
  const [passageIndex, setPassageIndex] = useState(0);
  const [duration, setDuration] = useState(60);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passage = TYPING_PASSAGES[passageIndex];
  const running = startedAt !== null && !finished;

  const correctChars = typed.split("").reduce((count, character, index) => count + (character === passage[index] ? 1 : 0), 0);
  const minutes = Math.max(elapsed, 1) / 60;
  const wpm = Math.max(0, Math.round((correctChars / 5) / minutes));
  const accuracy = typed.length ? Math.round((correctChars / typed.length) * 100) : 100;
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
    setTyped(""); setElapsed(0); setFinished(false); setStartedAt(Date.now());
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const reset = () => {
    setTyped(""); setElapsed(0); setFinished(false); setStartedAt(null);
  };

  const nextPassage = () => {
    reset();
    setPassageIndex(index => (index + 1) % TYPING_PASSAGES.length);
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
      <p className="mb-3 flex items-center gap-2 text-lg"><DecorSquare />Skill builder</p>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><h1 className="text-[36px] sm:text-[44px]">Typing practice</h1><p className="mt-3 max-w-2xl text-ink/60">Build the speed and accuracy you need for computer-delivered IELTS.</p></div>
        <div className="flex rounded-[6px] bg-sand p-1" aria-label="Session duration">
          {[30, 60, 120].map(seconds => <button key={seconds} type="button" disabled={running} onClick={() => { reset(); setDuration(seconds); }} className={cn("rounded-[4px] px-4 py-2 text-sm font-medium disabled:opacity-50", duration === seconds ? "bg-ink text-white" : "text-ink/60")}>{seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}</button>)}
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8"><dt className="flex items-center gap-2 text-sm text-ink/50"><Gauge className="h-4 w-4 text-brand-red" />Speed</dt><dd className="mt-2 text-[30px] font-semibold">{wpm} <span className="text-sm font-normal text-ink/45">WPM</span></dd></div>
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8"><dt className="flex items-center gap-2 text-sm text-ink/50"><Target className="h-4 w-4 text-brand-red" />Accuracy</dt><dd className="mt-2 text-[30px] font-semibold">{accuracy}<span className="text-sm font-normal text-ink/45">%</span></dd></div>
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8"><dt className="flex items-center gap-2 text-sm text-ink/50"><Timer className="h-4 w-4 text-brand-red" />Time left</dt><dd className="mt-2 text-[30px] font-semibold">{timeLeft}<span className="text-sm font-normal text-ink/45">s</span></dd></div>
        <div className="rounded-[8px] bg-white p-5 ring-1 ring-ink/8"><dt className="flex items-center gap-2 text-sm text-ink/50"><Award className="h-4 w-4 text-brand-red" />Personal best</dt><dd className="mt-2 text-[30px] font-semibold">{best} <span className="text-sm font-normal text-ink/45">WPM</span></dd></div>
      </dl>

      <section className="mt-6 overflow-hidden rounded-[10px] bg-white ring-1 ring-ink/8">
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-medium"><Keyboard className="h-4 w-4 text-brand-red" />Passage {passageIndex + 1} of {TYPING_PASSAGES.length}</span>
          <button type="button" disabled={running} onClick={nextPassage} className="text-sm text-ink/55 underline-offset-4 hover:underline disabled:opacity-40">Change passage</button>
        </div>
        <div className="p-6 sm:p-8">
          <div className="select-none font-mono text-[18px] leading-[1.9] tracking-[0.01em]" aria-label="Text to type">
            {passage.split("").map((character, index) => (
              <span key={index} className={cn(
                index < typed.length && typed[index] === character && "text-emerald-700",
                index < typed.length && typed[index] !== character && "rounded-sm bg-red-100 text-red-700",
                index === typed.length && running && "border-b-2 border-brand-red bg-brand-red/5",
                index > typed.length && "text-ink/38",
              )}>{character}</span>
            ))}
          </div>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sand"><span className="block h-full rounded-full bg-brand-red transition-[width]" style={{ width: `${progress}%` }} /></div>
          <label className="mt-6 block text-sm font-medium text-ink/60">Type here
            <textarea ref={inputRef} value={typed} disabled={!running} onChange={event => type(event.target.value)} onPaste={event => event.preventDefault()} spellCheck={false} autoCorrect="off" autoCapitalize="off" className="mt-2 min-h-32 w-full resize-none rounded-[7px] border border-ink/15 bg-cream p-4 font-mono text-base leading-relaxed outline-none focus:border-ink disabled:opacity-60" placeholder={finished ? "Session complete" : running ? "Start typing the passage above…" : "Press Start to begin"} />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            {!running && !finished && <button type="button" onClick={start} className="hv-btn hv-btn-red py-3"><span className="hv-btn-label"><span>Start typing</span><span aria-hidden="true">Start typing</span></span></button>}
            {(running || finished) && <button type="button" onClick={start} className="inline-flex items-center gap-2 rounded-[5px] bg-ink px-5 py-3 text-white hover:bg-brand-red"><RotateCcw className="h-4 w-4" />Try again</button>}
            {finished && <button type="button" onClick={nextPassage} className="rounded-[5px] border border-ink/20 px-5 py-3 hover:border-ink">Next passage</button>}
          </div>
        </div>
      </section>

      {finished && <div className="mt-5 rounded-[8px] bg-white p-5 ring-1 ring-ink/8"><p className="font-medium">Session complete — {wpm} WPM at {accuracy}% accuracy.</p><p className="mt-1 text-sm text-ink/60">Aim for steady accuracy first; speed improves naturally with consistent practice.</p></div>}
    </div>
  );
}

function StudentProfilePage() {
  const { data: profile, isLoading } = trpc.student.profile.useQuery();
  const { data: assignment } = trpc.student.batch.useQuery();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [targetBand, setTargetBand] = useState<string>("");

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    setTargetBand(profile?.targetBand || "");
  }, [profile?.name, profile?.targetBand]);

  const updateProfile = trpc.student.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated");
      await Promise.all([utils.student.profile.invalidate(), utils.auth.me.invalidate()]);
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
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be 5MB or smaller");
    uploadAvatar.mutate({ base64: await fileToBase64(file), filename: file.name, contentType: file.type });
  };

  if (isLoading || !profile) return <div className="flex min-h-[60vh] items-center justify-center"><span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" /></div>;

  const initials = (profile.name || profile.email).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const inputClass = "mt-2 w-full rounded-[7px] border border-ink/15 bg-white px-4 py-3 outline-none transition-colors focus:border-ink";

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg"><DecorSquare />Account settings</p>
      <h1 className="text-[36px] sm:text-[44px]">My profile</h1>

      <section className="mt-9 overflow-hidden rounded-[12px] bg-ink text-white">
        <div className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:p-9">
          <label className="group relative h-20 w-20 flex-none cursor-pointer overflow-hidden rounded-full bg-brand-red" title="Change profile photo">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-semibold">{initials}</span>}
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-center text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100">{uploadAvatar.isPending ? "Uploading…" : "Change photo"}</span>
            <input type="file" accept="image/*" className="sr-only" disabled={uploadAvatar.isPending} onChange={event => changePhoto(event.target.files?.[0])} />
          </label>
          <div className="min-w-0"><h2 className="truncate text-[30px] text-white">{profile.name || "Student"}</h2><p className="mt-1 flex items-center gap-2 text-white/55"><Mail className="h-4 w-4" />{profile.email}</p></div>
          <div className="sm:ml-auto sm:text-right"><p className="text-xs uppercase tracking-[0.14em] text-white/35">Student ID</p><p className="mt-1 font-mono font-medium">{assignment?.enrollment.studentId || "Pending"}</p></div>
        </div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-3">
          <div className="bg-white/5 p-5"><p className="text-xs text-white/40">Member since</p><p className="mt-1 text-sm">{new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p></div>
          <div className="bg-white/5 p-5"><p className="text-xs text-white/40">Current batch</p><p className="mt-1 truncate text-sm">{assignment?.batch?.name || "Not assigned"}</p></div>
          <div className="bg-white/5 p-5"><p className="text-xs text-white/40">Course</p><p className="mt-1 truncate text-sm">{assignment?.course?.nameEn || assignment?.course?.name || "Not assigned"}</p></div>
        </div>
      </section>

      <div className="mt-6 max-w-2xl">
        <form onSubmit={event => { event.preventDefault(); updateProfile.mutate({ name, targetBand: targetBand ? targetBand as "5.0" | "5.5" | "6.0" | "6.5" | "7.0" | "7.5" | "8.0" | "8.5" | "9.0" : null }); }} className="rounded-[10px] bg-white p-6 ring-1 ring-ink/8 sm:p-7">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand"><UserRound className="h-4 w-4 text-brand-red" /></span><div><h2 className="text-xl">Personal details</h2><p className="text-sm text-ink/45">Update how your name appears.</p></div></div>
          <label className="mt-6 block text-sm font-medium">Full name<input value={name} onChange={event => setName(event.target.value)} minLength={2} required className={inputClass} /></label>
          <label className="mt-4 block text-sm font-medium">Email address<input value={profile.email} readOnly className={`${inputClass} bg-sand/50 text-ink/55`} /></label>
          <p className="mt-2 text-xs text-ink/40">Contact an administrator to change your login email.</p>
          <label className="mt-4 block text-sm font-medium">Target IELTS band<select value={targetBand} onChange={event => setTargetBand(event.target.value)} className={inputClass}><option value="">Not set</option>{["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map(band => <option key={band} value={band}>Band {band}</option>)}</select></label>
          <button type="submit" disabled={updateProfile.isPending || (name.trim() === (profile.name || "") && targetBand === (profile.targetBand || ""))} className="mt-6 rounded-[5px] bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-red disabled:opacity-40">{updateProfile.isPending ? "Saving…" : "Save changes"}</button>
        </form>
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
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    },
    onError: error => toast.error(error.message),
  });
  const inputClass = "mt-2 w-full rounded-[7px] border border-ink/15 bg-white px-4 py-3 outline-none transition-colors focus:border-ink";

  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg"><DecorSquare />Account preferences</p>
      <h1 className="text-[36px] sm:text-[44px]">Settings</h1>
      <p className="mt-3 max-w-2xl text-ink/60">Manage your account security and sign-in password.</p>

      <form
        onSubmit={event => {
          event.preventDefault();
          if (newPassword !== confirmPassword) return toast.error("New passwords do not match");
          changePassword.mutate({ currentPassword, newPassword });
        }}
        className="mt-9 max-w-2xl rounded-[10px] bg-white p-6 ring-1 ring-ink/8 sm:p-8"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand"><LockKeyhole className="h-5 w-5 text-brand-red" /></span>
          <div><h2 className="text-2xl">Change password</h2><p className="mt-1 text-sm text-ink/45">Verify your current password before choosing a new one.</p></div>
        </div>
        <label className="mt-7 block text-sm font-medium">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required className={inputClass} /></label>
        <label className="mt-5 block text-sm font-medium">New password<input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} required className={inputClass} /></label>
        <label className="mt-5 block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required className={inputClass} /></label>
        <div className="mt-5 flex items-start gap-3 rounded-[7px] bg-sand/70 p-4 text-sm text-ink/60"><ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-700" /><p>Use at least eight characters. A strong password combines words, numbers, and symbols and is not reused on another website.</p></div>
        <button type="submit" disabled={changePassword.isPending || !currentPassword || newPassword.length < 8 || !confirmPassword} className="mt-6 rounded-[5px] bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-red disabled:opacity-40">{changePassword.isPending ? "Changing password…" : "Update password"}</button>
      </form>
    </div>
  );
}

function ResultsHistory() {
  const { data: rows = [], isLoading } = trpc.student.attempts.useQuery();
  return (
    <div className={STUDENT_PAGE_CLASS}>
      <p className="mb-3 flex items-center gap-2 text-lg"><DecorSquare />History</p>
      <h1 className="text-[36px] sm:text-[44px]">My results</h1>
      {isLoading ? (
        <div className="py-20 text-center text-ink/60">Loading…</div>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-lg text-ink/60">You haven't taken any tests yet. <Link href="/student" className="underline">Start one now</Link>.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-3">
          {rows.map(({ attempt, test }) => (
            <li key={attempt.id}>
              <Link href={`/student/attempts/${attempt.id}`} className="group flex items-center gap-6 rounded-[8px] bg-white p-5 ring-1 ring-ink/8 transition-colors hover:bg-sand/50">
                <div className="w-20 flex-none text-center">
                  <div className="text-[32px] font-semibold leading-none">{formatBand(attempt.band)}</div>
                  <div className="mt-1 text-xs text-ink/60">band</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl">{test.title}</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {MODULE_LABELS[test.module]} · {STATUS_TEXT[attempt.status]}
                    {attempt.maxScore ? ` · ${attempt.rawScore}/${attempt.maxScore} correct` : ""}
                    {" · "}{new Date(attempt.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
  if (pathname === "/student/practice") content = <TestsHome initialMode="practice" />;
  else if (pathname === "/student/mocks") content = <TestsHome initialMode="exam" />;
  else if (pathname === "/student/results") content = <ResultsHistory />;
  else if (pathname === "/student/batch") content = <BatchPage />;
  else if (pathname === "/student/resources") content = <ResourcesPage />;
  else if (pathname === "/student/typing") content = <TypingPracticePage />;
  else if (pathname === "/student/profile") content = <StudentProfilePage />;
  else if (pathname === "/student/settings") content = <StudentSettingsPage />;
  return <StudentShell>{content}</StudentShell>;
}
