"use client";

/**
 * Right-hand panel listing students' attempts for one module (or one test).
 * Opened from the module pages; each attempt opens the grading screen at /admin/ielts/attempts/:id.
 */
import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "@/lib/router";
import { formatBand, type MockModule } from "@shared/mock";

type StatusFilter = "submitted" | "graded" | "all";

const STATUS = {
  in_progress: { label: "In progress", className: "inactive" },
  submitted: { label: "To grade", className: "warning" },
  graded: { label: "Graded", className: "" },
} as const;

function when(value: Date | string | null | undefined) {
  if (!value) return "Not submitted";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAttemptsDrawer({
  module,
  test,
  initialStatus,
  onClose,
}: {
  module: MockModule;
  /** Only this test's attempts; otherwise the whole module. */
  test?: { id: number; title: string };
  initialStatus?: StatusFilter;
  onClose: () => void;
}) {
  const { data: rows = [], isLoading } = trpc.mockTests.attempts.useQuery({
    testId: test?.id,
  });
  const inScope = rows.filter(row => row.test.module === module);
  const toGrade = inScope.filter(row => row.attempt.status === "submitted");
  const [status, setStatus] = useState<StatusFilter>(initialStatus ?? "all");
  const shown = inScope.filter(
    row => status === "all" || row.attempt.status === status
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const chips: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: inScope.length },
    { key: "submitted", label: "To grade", count: toGrade.length },
    {
      key: "graded",
      label: "Graded",
      count: inScope.filter(row => row.attempt.status === "graded").length,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Student attempts"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default rounded-none! bg-black/25"
      />
      <aside className="admin-filter-panel absolute inset-y-3 right-3 flex w-[calc(100%-1.5rem)] max-w-[440px] flex-col overflow-hidden">
        <header className="border-b border-[var(--admin-border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[var(--admin-heading)]">
                Student attempts
              </h2>
              <p className="mt-0.5 truncate text-sm text-[var(--admin-body)]">
                {test ? test.title : "All tests in this module"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="admin-icon-button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map(chip => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatus(chip.key)}
                className={`admin-button admin-filter-button px-3! ${status === chip.key ? "admin-button-primary" : "admin-button-secondary"}`}
              >
                {chip.label}
                <span className="text-xs opacity-70">{chip.count}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : shown.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-[var(--admin-body)]">
              <ClipboardCheck className="mx-auto mb-3 h-10 w-10 opacity-40" />
              {status === "submitted"
                ? "Nothing waiting to be graded."
                : "No attempts yet."}
            </div>
          ) : (
            shown.map(({ attempt, test: attemptTest, student }) => {
              const badge = STATUS[attempt.status];
              return (
                <Link
                  key={attempt.id}
                  href={`/admin/ielts/attempts/${attempt.id}`}
                  className="flex items-center gap-3 border-b border-[var(--admin-border)] px-6 py-3.5 transition-colors last:border-0 hover:bg-black/[0.025]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--admin-card)] text-sm font-semibold text-[var(--admin-heading)]">
                    {(student?.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--admin-heading)]">
                      {student?.name ?? "Deleted student"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--admin-body)]">
                      {test ? "" : `${attemptTest.title} · `}
                      {when(attempt.submittedAt)}
                    </span>
                  </span>
                  {attempt.band && (
                    <span className="font-display text-lg font-semibold text-[var(--admin-heading)]">
                      {formatBand(attempt.band)}
                    </span>
                  )}
                  <span className={`admin-status-label ${badge.className}`}>
                    {badge.label}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
