/**
 * AdminMockResults — the grading screen for one student attempt.
 * Route: /admin/ielts/attempts/:attemptId (attempts are listed from each module page).
 * /admin/ielts/attempts without an id forwards to /admin/ielts.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, RotateCcw, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import {
  BAND_OPTIONS,
  GRADING_CRITERIA,
  MODULE_LABELS,
  countWords,
  formatBand,
  optionLetter,
  overallFromCriteria,
} from "@shared/mock";
import AdminSelect from "@/components/AdminSelect";

const STATUS_LABEL = {
  in_progress: "In progress",
  submitted: "Awaiting grading",
  graded: "Graded",
} as const;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The old results list now lives in each module page's "Student attempts" panel. */
function ResultsRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/admin/ielts");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function GradeAttempt({ attemptId }: { attemptId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.mockTests.attempt.useQuery(
    { id: attemptId },
    // Poll while AI marking is running so the suggestion appears on its own.
    {
      refetchInterval: query =>
        query.state.data?.attempt.aiEvaluation?.status === "pending"
          ? 4000
          : false,
    }
  );
  const { data: aiConfig } = trpc.mockTests.aiAvailable.useQuery();
  const aiEvaluate = trpc.mockTests.aiEvaluate.useMutation({
    onSuccess: () => {
      toast.success("AI suggestion ready");
      utils.mockTests.attempt.invalidate({ id: attemptId });
      utils.mockTests.attempts.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const [criteria, setCriteria] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState<Record<number, string>>(
    {}
  );

  useEffect(() => {
    if (!data) return;
    setCriteria(data.attempt.criteria ?? {});
    setFeedback(data.attempt.feedback ?? "");
    setAnswerFeedback(
      Object.fromEntries(
        data.answers.map(a => [a.questionId, a.feedback ?? ""])
      )
    );
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
  const criteriaNames =
    module === "writing" || module === "speaking"
      ? GRADING_CRITERIA[module]
      : [];
  const overall = useMemo(() => {
    const complete = criteriaNames.every(
      name => typeof criteria[name] === "number"
    );
    return complete
      ? overallFromCriteria(
          Object.fromEntries(criteriaNames.map(n => [n, criteria[n]]))
        )
      : null;
  }, [criteria, criteriaNames]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  const { attempt, test, answers, student } = data;
  const answerFor = (id: number) => answers.find(a => a.questionId === id);
  const manual = criteriaNames.length > 0;
  let n = 0;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={`${student?.name || "Student"} — ${test.title}`}
        parent={{
          label: MODULE_LABELS[test.module],
          href: `/admin/ielts/${test.module}`,
        }}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Status", STATUS_LABEL[attempt.status]],
          ["Submitted", formatDate(attempt.submittedAt)],
          [
            "Score",
            attempt.maxScore
              ? `${attempt.rawScore} / ${attempt.maxScore}`
              : "—",
          ],
          ["Band", formatBand(attempt.band)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4"
          >
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {attempt.status === "in_progress" && (
        <p className="mb-6 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4 text-sm text-gray-600">
          The student is still working on this attempt. You can grade it once
          it's submitted.
        </p>
      )}

      <div className="space-y-5">
        {test.sections.map(section => (
          <div
            key={section.id}
            className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6"
          >
            <h3 className="mb-4 font-bold text-gray-900">{section.title}</h3>
            {section.imageUrl && (
              <img
                src={section.imageUrl}
                alt=""
                className="mb-4 max-h-64 rounded border border-gray-200"
              />
            )}
            <div className="space-y-4">
              {section.questions.map(q => {
                n += 1;
                const answer = answerFor(q.id);
                return (
                  <div
                    key={q.id}
                    className="border-t border-gray-100 pt-4 first:border-0 first:pt-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
                        Q{n}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-line text-gray-900">
                          {q.prompt}
                        </p>

                        {q.type === "writing" && (
                          <div className="mt-3">
                            <div className="mb-1 text-xs text-gray-500">
                              {countWords(answer?.response)} words
                              {q.minWords ? ` · minimum ${q.minWords}` : ""}
                            </div>
                            <div className="whitespace-pre-wrap rounded-[var(--radius-control)] bg-[var(--admin-background)] p-4 text-gray-800">
                              {answer?.response || (
                                <em className="text-gray-400">No answer</em>
                              )}
                            </div>
                          </div>
                        )}

                        {q.type === "speaking" && (
                          <div className="mt-3">
                            {answer?.audioUrl ? (
                              <audio
                                controls
                                src={answer.audioUrl}
                                className="w-full"
                              />
                            ) : (
                              <em className="text-sm text-gray-400">
                                No recording
                              </em>
                            )}
                            <p className="mt-2 text-xs font-medium uppercase text-gray-400">
                              Transcript (browser speech-to-text, used by AI
                              marking)
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                              {answer?.response || (
                                <em className="text-gray-400">
                                  No transcript — the student's browser didn't
                                  support it.
                                </em>
                              )}
                            </p>
                          </div>
                        )}

                        {!manual && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 font-medium",
                                answer?.isCorrect
                                  ? "text-green-700"
                                  : "text-red-600"
                              )}
                            >
                              {answer?.isCorrect ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              {answer?.response
                                ? q.type === "mcq"
                                  ? `${answer.response}`
                                  : `“${answer.response}”`
                                : "No answer"}
                            </span>
                            <span className="text-gray-500">
                              Correct:{" "}
                              {q.type === "mcq" && q.options
                                ? (q.answers ?? [])
                                    .map(
                                      l =>
                                        `${l}. ${q.options![l.charCodeAt(0) - 65] ?? ""}`
                                    )
                                    .join(", ")
                                : (q.answers ?? []).join(" / ")}
                            </span>
                          </div>
                        )}
                        {q.type === "mcq" && q.options && !manual && (
                          <ol className="mt-1 text-xs text-gray-500">
                            {q.options.map((o, i) => (
                              <li key={i}>
                                {optionLetter(i)}. {o}
                              </li>
                            ))}
                          </ol>
                        )}

                        {manual && attempt.status !== "in_progress" && (
                          <label className="mt-3 block">
                            <span className="mb-1 block text-xs font-medium text-gray-600">
                              Feedback on this{" "}
                              {q.type === "writing" ? "task" : "answer"}
                            </span>
                            <textarea
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              value={answerFeedback[q.id] ?? ""}
                              onChange={e =>
                                setAnswerFeedback(prev => ({
                                  ...prev,
                                  [q.id]: e.target.value,
                                }))
                              }
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

        {attempt.status !== "in_progress" &&
          manual &&
          (() => {
            const ai = attempt.aiEvaluation;
            const running = aiEvaluate.isPending || ai?.status === "pending";
            const applyToForm = () => {
              if (!ai?.criteria) return;
              setCriteria(ai.criteria);
              setFeedback(ai.feedback ?? "");
              setAnswerFeedback(prev => ({
                ...prev,
                ...Object.fromEntries(
                  (ai.answerFeedback ?? []).map(item => [
                    item.questionId,
                    item.feedback,
                  ])
                ),
              }));
              toast.success(
                "AI suggestion copied into the form — review it, then save."
              );
            };
            return (
              <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    AI suggestion
                  </h3>
                  {aiConfig?.available && (
                    <button
                      type="button"
                      className="admin-button admin-button-secondary h-9 px-3 text-sm"
                      disabled={running}
                      onClick={() => aiEvaluate.mutate({ attemptId })}
                    >
                      {running ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {ai?.status === "done" || ai?.status === "failed"
                        ? "Re-run AI marking"
                        : "Run AI marking"}
                    </button>
                  )}
                </div>
                {!aiConfig?.available ? (
                  <p className="text-sm text-gray-600">
                    AI marking is off. Add <code>ANTHROPIC_API_KEY</code> to the
                    server environment to turn it on.
                  </p>
                ) : running ? (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is marking this attempt… this usually takes under a
                    minute.
                  </p>
                ) : ai?.status === "failed" ? (
                  <p className="text-sm text-red-600">
                    AI marking failed: {ai.error}. Mark it yourself or re-run.
                  </p>
                ) : ai?.status === "done" && ai.criteria ? (
                  <>
                    {ai.applied && (
                      <p className="mb-3 text-sm text-gray-600">
                        This practice attempt was graded automatically with the
                        AI result — the student can see it. Saving below
                        replaces it with your grade.
                      </p>
                    )}
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(ai.criteria).map(([name, band]) => (
                        <div
                          key={name}
                          className="border-b border-violet-100 pb-2"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-sm text-gray-700">{name}</dt>
                            <dd className="font-semibold text-gray-900">
                              {formatBand(band)}
                            </dd>
                          </div>
                          {ai.comments?.[name] && (
                            <p className="mt-1 text-xs text-gray-500">
                              {ai.comments[name]}
                            </p>
                          )}
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-sm text-gray-600">
                      Suggested overall band:{" "}
                      <strong className="text-gray-900">
                        {formatBand(ai.band ?? null)}
                      </strong>
                    </p>
                    {ai.feedback && (
                      <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                        {ai.feedback}
                      </p>
                    )}
                    <button
                      type="button"
                      className="admin-primary-button mt-4"
                      onClick={applyToForm}
                    >
                      <Check className="h-4 w-4" />
                      Apply to form
                    </button>
                    {module === "speaking" && (
                      <p className="mt-2 text-xs text-gray-500">
                        The AI reads transcripts only — listen to the recordings
                        to confirm Pronunciation.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    No AI suggestion yet for this attempt.
                  </p>
                )}
              </div>
            );
          })()}

        {attempt.status !== "in_progress" && (
          <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6">
            <h3 className="mb-4 font-bold text-gray-900">
              {manual ? "Band scores" : "Overall feedback"}
            </h3>
            {manual && (
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                {criteriaNames.map(name => (
                  <label key={name} className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">
                      {name}
                    </span>
                    <AdminSelect
                      value={criteria[name] ?? ""}
                      onChange={e =>
                        setCriteria(prev => {
                          const next = { ...prev };
                          if (e.target.value === "") delete next[name];
                          else next[name] = Number(e.target.value);
                          return next;
                        })
                      }
                      className="w-full"
                    >
                      <option value="">Select band…</option>
                      {BAND_OPTIONS.slice()
                        .reverse()
                        .map(b => (
                          <option key={b} value={b}>
                            {b.toFixed(1)}
                          </option>
                        ))}
                    </AdminSelect>
                  </label>
                ))}
                <div className="rounded-[var(--radius-control)] bg-[var(--admin-background)] p-4 sm:col-span-2">
                  <span className="text-sm text-gray-600">
                    Overall band (average, IELTS rounding):{" "}
                  </span>
                  <strong className="text-lg text-gray-900">
                    {overall === null ? "—" : overall.toFixed(1)}
                  </strong>
                </div>
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Message to the student
              </span>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </label>
            <button
              className="admin-primary-button mt-4"
              disabled={grade.isPending || (manual && overall === null)}
              onClick={() =>
                grade.mutate({
                  attemptId,
                  criteria: manual
                    ? Object.fromEntries(
                        criteriaNames.map(name => [name, criteria[name]])
                      )
                    : undefined,
                  feedback: feedback || null,
                  answerFeedback: manual
                    ? Object.entries(answerFeedback).map(
                        ([questionId, text]) => ({
                          questionId: Number(questionId),
                          feedback: text || null,
                        })
                      )
                    : undefined,
                })
              }
            >
              {grade.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {manual
                ? attempt.status === "graded"
                  ? "Update grade"
                  : "Save grade"
                : "Save feedback"}
            </button>
            {manual && overall === null && (
              <p className="mt-2 text-xs text-gray-500">
                Select a band for all four criteria to save.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMockResults() {
  const [pathname] = useLocation();
  // /admin/ielts/attempts/:id
  const id = Number(pathname.split("/")[4]);
  return Number.isFinite(id) && id > 0 ? (
    <GradeAttempt key={id} attemptId={id} />
  ) : (
    <ResultsRedirect />
  );
}
