/**
 * AdminMockResults — student attempts across all mock tests, and the grading screen.
 * Routes: /admin/mock-results (list, ?test=ID to filter) and /admin/mock-results/:attemptId
 */
import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useSearch } from "@/lib/router";
import { cn } from "@/lib/utils";
import {
  BAND_OPTIONS, GRADING_CRITERIA, MODULE_LABELS, countWords, formatBand, optionLetter, overallFromCriteria,
} from "@shared/mock";

const STATUS_LABEL = { in_progress: "In progress", submitted: "Awaiting grading", graded: "Graded" } as const;
const STATUS_CLASS = {
  in_progress: "bg-blue-50 text-blue-700",
  submitted: "bg-amber-50 text-amber-600",
  graded: "bg-green-50 text-green-700",
} as const;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ResultsList() {
  const [, navigate] = useLocation();
  const search = new URLSearchParams(useSearch());
  const testFilter = search.get("test") ? Number(search.get("test")) : undefined;
  const [status, setStatus] = useState<"all" | "submitted" | "graded" | "in_progress">("all");
  const { data: rows = [], isLoading } = trpc.mockTests.attempts.useQuery({
    testId: testFilter,
    status: status === "all" ? undefined : status,
  });
  const { data: tests = [] } = trpc.mockTests.list.useQuery();

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader title="Mock Test Results" parent={{ label: "Mock Tests", href: "/admin/mock-tests" }} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["all", "submitted", "graded", "in_progress"] as const).map(key => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={cn("admin-button admin-filter-button", status === key ? "admin-button-primary" : "admin-button-secondary")}
          >
            {key === "all" ? "All" : STATUS_LABEL[key]}
          </button>
        ))}
        <select
          className="ml-auto rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={testFilter ?? ""}
          onChange={e => navigate(e.target.value ? `/admin/mock-results?test=${e.target.value}` : "/admin/mock-results")}
          aria-label="Filter by test"
        >
          <option value="">All tests</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center">
          <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No attempts yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Band</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ attempt, test, student }) => (
                <tr key={attempt.id} className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50" onClick={() => navigate(`/admin/mock-results/${attempt.id}`)}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/mock-results/${attempt.id}`} className="font-medium text-gray-900 hover:underline" onClick={e => e.stopPropagation()}>
                      {student?.name || "Deleted student"}
                    </Link>
                    <div className="text-xs text-gray-500">{student?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{test.title}</div>
                    <div className="text-xs text-gray-500">{MODULE_LABELS[test.module]} · {test.mode === "exam" ? "Exam" : "Practice"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(attempt.submittedAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{attempt.maxScore ? `${attempt.rawScore}/${attempt.maxScore}` : "—"}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatBand(attempt.band)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_CLASS[attempt.status])}>{STATUS_LABEL[attempt.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GradeAttempt({ attemptId }: { attemptId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.mockTests.attempt.useQuery({ id: attemptId });
  const [criteria, setCriteria] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!data) return;
    setCriteria(data.attempt.criteria ?? {});
    setFeedback(data.attempt.feedback ?? "");
    setAnswerFeedback(Object.fromEntries(data.answers.map(a => [a.questionId, a.feedback ?? ""])));
  }, [data]);

  const grade = trpc.mockTests.grade.useMutation({
    onSuccess: () => {
      toast.success("Grade saved — the student can see it now");
      utils.mockTests.attempt.invalidate({ id: attemptId });
      utils.mockTests.attempts.invalidate();
      utils.mockTests.list.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const module = data?.test.module;
  const criteriaNames = module === "writing" || module === "speaking" ? GRADING_CRITERIA[module] : [];
  const overall = useMemo(() => {
    const complete = criteriaNames.every(name => typeof criteria[name] === "number");
    return complete ? overallFromCriteria(Object.fromEntries(criteriaNames.map(n => [n, criteria[n]]))) : null;
  }, [criteria, criteriaNames]);

  if (isLoading || !data) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;
  }

  const { attempt, test, answers, student } = data;
  const answerFor = (id: number) => answers.find(a => a.questionId === id);
  const manual = criteriaNames.length > 0;
  let n = 0;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader title={`${student?.name || "Student"} — ${test.title}`} parent={{ label: "Results", href: "/admin/mock-results" }} />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Status", STATUS_LABEL[attempt.status]],
          ["Submitted", formatDate(attempt.submittedAt)],
          ["Score", attempt.maxScore ? `${attempt.rawScore} / ${attempt.maxScore}` : "—"],
          ["Band", formatBand(attempt.band)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {attempt.status === "in_progress" && (
        <p className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">The student is still working on this attempt. You can grade it once it's submitted.</p>
      )}

      <div className="space-y-5">
        {test.sections.map(section => (
          <div key={section.id} className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-bold text-gray-900">{section.title}</h3>
            {section.imageUrl && <img src={section.imageUrl} alt="" className="mb-4 max-h-64 rounded border border-gray-200" />}
            <div className="space-y-4">
              {section.questions.map(q => {
                n += 1;
                const answer = answerFor(q.id);
                return (
                  <div key={q.id} className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">Q{n}</span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-line text-gray-900">{q.prompt}</p>

                        {q.type === "writing" && (
                          <div className="mt-3">
                            <div className="mb-1 text-xs text-gray-500">
                              {countWords(answer?.response)} words{q.minWords ? ` · minimum ${q.minWords}` : ""}
                            </div>
                            <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-gray-800">{answer?.response || <em className="text-gray-400">No answer</em>}</div>
                          </div>
                        )}

                        {q.type === "speaking" && (
                          <div className="mt-3">
                            {answer?.audioUrl ? <audio controls src={answer.audioUrl} className="w-full" /> : <em className="text-sm text-gray-400">No recording</em>}
                          </div>
                        )}

                        {!manual && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className={cn("inline-flex items-center gap-1 font-medium", answer?.isCorrect ? "text-green-700" : "text-red-600")}>
                              {answer?.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                              {answer?.response ? (q.type === "mcq" ? `${answer.response}` : `“${answer.response}”`) : "No answer"}
                            </span>
                            <span className="text-gray-500">
                              Correct: {q.type === "mcq" && q.options
                                ? (q.answers ?? []).map(l => `${l}. ${q.options![l.charCodeAt(0) - 65] ?? ""}`).join(", ")
                                : (q.answers ?? []).join(" / ")}
                            </span>
                          </div>
                        )}
                        {q.type === "mcq" && q.options && !manual && (
                          <ol className="mt-1 text-xs text-gray-500">
                            {q.options.map((o, i) => <li key={i}>{optionLetter(i)}. {o}</li>)}
                          </ol>
                        )}

                        {manual && attempt.status !== "in_progress" && (
                          <label className="mt-3 block">
                            <span className="mb-1 block text-xs font-medium text-gray-600">Feedback on this {q.type === "writing" ? "task" : "answer"}</span>
                            <textarea
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              value={answerFeedback[q.id] ?? ""}
                              onChange={e => setAnswerFeedback(prev => ({ ...prev, [q.id]: e.target.value }))}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {attempt.status !== "in_progress" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-bold text-gray-900">{manual ? "Band scores" : "Overall feedback"}</h3>
            {manual && (
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                {criteriaNames.map(name => (
                  <label key={name} className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">{name}</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      value={criteria[name] ?? ""}
                      onChange={e => setCriteria(prev => {
                        const next = { ...prev };
                        if (e.target.value === "") delete next[name];
                        else next[name] = Number(e.target.value);
                        return next;
                      })}
                    >
                      <option value="">Select band…</option>
                      {BAND_OPTIONS.slice().reverse().map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                    </select>
                  </label>
                ))}
                <div className="rounded-lg bg-gray-50 p-4 sm:col-span-2">
                  <span className="text-sm text-gray-600">Overall band (average, IELTS rounding): </span>
                  <strong className="text-lg text-gray-900">{overall === null ? "—" : overall.toFixed(1)}</strong>
                </div>
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Message to the student</span>
              <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2" value={feedback} onChange={e => setFeedback(e.target.value)} />
            </label>
            <button
              className="admin-primary-button mt-4"
              disabled={grade.isPending || (manual && overall === null)}
              onClick={() => grade.mutate({
                attemptId,
                criteria: manual ? Object.fromEntries(criteriaNames.map(name => [name, criteria[name]])) : undefined,
                feedback: feedback || null,
                answerFeedback: manual
                  ? Object.entries(answerFeedback).map(([questionId, text]) => ({ questionId: Number(questionId), feedback: text || null }))
                  : undefined,
              })}
            >
              {grade.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {manual ? (attempt.status === "graded" ? "Update grade" : "Save grade") : "Save feedback"}
            </button>
            {manual && overall === null && <p className="mt-2 text-xs text-gray-500">Select a band for all four criteria to save.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMockResults() {
  const [pathname] = useLocation();
  const id = Number(pathname.split("/")[3]);
  return Number.isFinite(id) && id > 0 ? <GradeAttempt key={id} attemptId={id} /> : <ResultsList />;
}
