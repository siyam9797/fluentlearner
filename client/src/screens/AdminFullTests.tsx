/**
 * AdminFullTests — full IELTS tests (e.g. "Cambridge IELTS 18 · Test 1"), in Academic and General
 * Training tabs (?type=general). Tests are added on their own page (AdminFullTestForm).
 * Create the test first; it comes with an empty Listening, Reading, Writing and Speaking module,
 * and each module's questions are then added in the test editor (/admin/ielts/:id).
 */
import { useState } from "react";
import { Copy, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "@/lib/router";
import {
  BOOK_SERIES,
  bookSeries,
  bookTitle,
  MODULE_LABELS,
  type MockModule,
} from "@shared/mock";
import { MODULE_ICONS } from "./AdminMockTests";

type Variant = "academic" | "general";
/** Academic and General Training use the standard admin tags, in two different tones. */
const VARIANTS: Record<Variant, { label: string; tone: string }> = {
  academic: { label: "Academic", tone: "info" },
  general: { label: "General Training", tone: "warning" },
};

const inputClass =
  "mt-2 h-11 w-full rounded-[var(--radius-control)] border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]";

/** The module a "Copy from another test" dialog is filling. */
type CopyTarget = {
  testId: number;
  module: MockModule;
  setTitle: string;
  variant: Variant;
  questionCount: number;
};

/**
 * Picks another test's module of the same kind (a full test's or a standalone one) and copies
 * its sections and questions into the target, replacing what the target had.
 */
function CopyModuleDialog({
  target,
  onClose,
  onCopied,
}: {
  target: CopyTarget;
  onClose: () => void;
  onCopied: () => void;
}) {
  const { data: tests = [], isLoading } = trpc.mockTests.list.useQuery();
  const { data: sets = [] } = trpc.mockTestSets.list.useQuery();
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState<number | null>(null);
  const copy = trpc.mockTests.copyFrom.useMutation({
    onSuccess: ({ questions }) => {
      toast.success(
        `Copied ${questions} question${questions === 1 ? "" : "s"} into ${target.setTitle} · ${MODULE_LABELS[target.module]}`
      );
      onCopied();
    },
    onError: error => toast.error(error.message),
  });

  const label = (test: (typeof tests)[number]) =>
    test.setId
      ? (sets.find(set => set.id === test.setId)?.title ?? test.title)
      : test.title;
  const needle = query.trim().toLowerCase();
  const sources = tests.filter(
    test =>
      test.id !== target.testId &&
      test.module === target.module &&
      test.questionCount > 0 &&
      (!needle || label(test).toLowerCase().includes(needle))
  );
  const moduleName = MODULE_LABELS[target.module];

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Copy {moduleName} from another test</DialogTitle>
        <DialogDescription>
          Into{" "}
          <span className="font-medium text-[var(--admin-heading)]">
            {target.setTitle}
          </span>
          . Passages, audio, images, questions and answers are copied.
        </DialogDescription>

        <label className="relative mt-2 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-body)]" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tests"
            aria-label="Search tests"
            className={`${inputClass} mt-0 pl-9`}
          />
        </label>

        <div
          role="radiogroup"
          aria-label={`${moduleName} modules to copy from`}
          className="max-h-[50vh] space-y-2 overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--admin-primary)]" />
            </div>
          ) : sources.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--admin-body)]">
              {needle
                ? "No tests match this search."
                : `No other ${moduleName} module has questions yet.`}
            </p>
          ) : (
            sources.map(test => (
              <button
                key={test.id}
                type="button"
                role="radio"
                aria-checked={sourceId === test.id}
                onClick={() => setSourceId(test.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border p-3 text-left text-sm transition-colors ${
                  sourceId === test.id
                    ? "border-[var(--admin-primary)]"
                    : "border-[var(--admin-border)] hover:bg-[var(--admin-background)]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--admin-heading)]">
                    {label(test)}
                  </span>
                  <span className="text-[var(--admin-body)]">
                    {test.questionCount} question
                    {test.questionCount === 1 ? "" : "s"}
                    {test.setId ? "" : " · standalone test"}
                  </span>
                </span>
                <span
                  className={`admin-status-label shrink-0 ${VARIANTS[test.variant].tone}`}
                >
                  {VARIANTS[test.variant].label}
                </span>
              </button>
            ))
          )}
        </div>

        {(() => {
          const source = tests.find(test => test.id === sourceId);
          const notes = [
            target.questionCount > 0 &&
              `This replaces the ${target.questionCount} question${target.questionCount === 1 ? "" : "s"} already in this module.`,
            source &&
              target.module === "reading" &&
              source.variant !== target.variant &&
              "Academic and General Training Reading papers are different; check this is the one you want.",
          ].filter(Boolean);
          return notes.length ? (
            <div className="space-y-1 text-sm text-[var(--admin-warning,#b45309)]">
              {notes.map(note => (
                <p key={String(note)}>{note}</p>
              ))}
            </div>
          ) : null;
        })()}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="admin-button admin-button-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!sourceId || copy.isPending}
            onClick={() =>
              sourceId && copy.mutate({ sourceId, targetId: target.testId })
            }
            className="admin-primary-button"
          >
            {copy.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy {moduleName}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminFullTests() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: sets = [], isLoading } = trpc.mockTestSets.list.useQuery();

  /** Academic and General Training are separate tabs; each shows only its own tests. */
  const search = new URLSearchParams(useSearch());
  const [tab, setTab] = useState<Variant>(
    search.get("type") === "general" ? "general" : "academic"
  );
  const [copyTarget, setCopyTarget] = useState<CopyTarget | null>(null);
  const shown = sets.filter(set => set.variant === tab);

  const refresh = () => {
    utils.mockTestSets.list.invalidate();
    utils.mockTests.list.invalidate();
  };
  const remove = trpc.mockTestSets.delete.useMutation({
    onSuccess: () => {
      toast.success("Test deleted");
      refresh();
    },
    onError: error => toast.error(error.message),
  });

  /**
   * The tab's tests grouped by book: Cambridge books first, then Practice Tests Plus (each newest
   * book first, tests in order); our own tests come last.
   */
  type Group = {
    key: string;
    title: string;
    rank: number;
    book: number | null;
    sets: typeof sets;
  };
  const groups: Group[] = [];
  for (const set of shown) {
    const setSeries = bookSeries(set.series);
    const book = setSeries && set.bookNumber ? set.bookNumber : null;
    const key = setSeries && book ? `${setSeries.key}-${book}` : "own";
    let group = groups.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        title:
          setSeries && book ? bookTitle(setSeries.key, book) : "Our own tests",
        rank:
          setSeries && book
            ? BOOK_SERIES.indexOf(setSeries)
            : BOOK_SERIES.length,
        book,
        sets: [],
      };
      groups.push(group);
    }
    group.sets.push(set);
  }
  groups.sort((a, b) => a.rank - b.rank || (b.book ?? 0) - (a.book ?? 0));
  for (const group of groups)
    if (group.book)
      group.sets.sort((a, b) => (a.testNumber ?? 0) - (b.testNumber ?? 0));
  const startNew = () =>
    navigate(
      `/admin/ielts/tests/new${tab === "general" ? "?type=general" : ""}`
    );

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Full tests"
        description="Create a test first, then add questions to each of its four modules."
        action={
          <button
            type="button"
            onClick={startNew}
            className="admin-primary-button"
          >
            <Plus className="h-4 w-4" />
            New test
          </button>
        }
      />

      {copyTarget && (
        <CopyModuleDialog
          target={copyTarget}
          onClose={() => setCopyTarget(null)}
          onCopied={() => {
            setCopyTarget(null);
            refresh();
          }}
        />
      )}

      <div
        className="-mx-1 mb-8 flex gap-1 overflow-x-auto"
        role="tablist"
        aria-label="Test type"
      >
        {(Object.keys(VARIANTS) as Variant[]).map(variant => {
          const active = tab === variant;
          const count = sets.filter(set => set.variant === variant).length;
          return (
            <button
              key={variant}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(variant)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm transition-colors ${
                active
                  ? "bg-[var(--admin-heading)] text-[var(--admin-background)]"
                  : "text-[var(--admin-body)] hover:bg-[var(--admin-card)]"
              }`}
            >
              {VARIANTS[variant].label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-red-600" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-12 text-center">
          <p className="font-medium text-[var(--admin-heading)]">
            No {VARIANTS[tab].label} tests yet
          </p>
          <p className="mt-1 text-sm text-[var(--admin-body)]">
            Create one, then add questions to its four modules.
          </p>
          <button
            type="button"
            onClick={startNew}
            className="admin-primary-button mt-5"
          >
            <Plus className="h-4 w-4" />
            New test
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(group => (
            <div key={group.key}>
              <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-[var(--admin-border)] pb-3">
                <h2 className="text-xl font-semibold text-[var(--admin-heading)]">
                  {group.title}
                </h2>
                <span className="text-sm text-[var(--admin-body)]">
                  {group.sets.length} test{group.sets.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-4">
                {group.sets.map(set => {
                  const done = set.modules.filter(
                    m => m.questionCount > 0
                  ).length;
                  const attempts = set.modules.reduce(
                    (sum, m) => sum + m.attemptCount,
                    0
                  );
                  return (
                    <section
                      key={set.id}
                      className="admin-list-card p-5 sm:p-6"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-[var(--admin-heading)]">
                            {group.book && set.testNumber
                              ? `Test ${set.testNumber}`
                              : set.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="text-sm text-[var(--admin-body)]">
                              {done} of 4 modules have questions
                            </span>
                          </div>
                        </div>
                        <AdminActionsMenu label={`Actions for ${set.title}`}>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/ielts/tests/${set.id}/edit`)
                            }
                          >
                            Edit details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const warning = attempts
                                ? ` Its modules have ${attempts} student attempt${attempts === 1 ? "" : "s"}, which will be deleted too.`
                                : "";
                              if (
                                confirm(
                                  `Delete "${set.title}" and all four modules?${warning}`
                                )
                              )
                                remove.mutate({ id: set.id });
                            }}
                          >
                            Delete test
                          </button>
                        </AdminActionsMenu>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {set.modules.map(m => {
                          const Icon = MODULE_ICONS[m.module];
                          const empty = m.questionCount === 0;
                          return (
                            <div
                              key={m.module}
                              className="flex flex-col rounded-[var(--radius-control)] bg-[var(--admin-background)]"
                            >
                              <button
                                type="button"
                                disabled={!m.testId}
                                onClick={() =>
                                  m.testId &&
                                  navigate(`/admin/ielts/${m.testId}`)
                                }
                                className="group flex flex-1 flex-col rounded-[var(--radius-control)] p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-2 font-medium text-[var(--admin-heading)]">
                                    <Icon className="h-4 w-4" />
                                    {MODULE_LABELS[m.module]}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--admin-body)]">
                                    <span
                                      aria-hidden
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{
                                        background: m.isPublished
                                          ? "var(--admin-success)"
                                          : "var(--admin-border)",
                                      }}
                                    />
                                    {m.isPublished ? "Published" : "Draft"}
                                  </span>
                                </span>
                                <span className="mt-3 text-sm text-[var(--admin-body)]">
                                  {empty
                                    ? "No questions yet"
                                    : `${m.questionCount} question${m.questionCount === 1 ? "" : "s"}`}
                                </span>
                                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--admin-primary)]">
                                  {empty ? (
                                    <>
                                      <Plus className="h-4 w-4" /> Add questions
                                    </>
                                  ) : (
                                    "Edit questions"
                                  )}
                                </span>
                              </button>
                              {m.testId && m.attemptCount === 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCopyTarget({
                                      testId: m.testId!,
                                      module: m.module,
                                      setTitle: set.title,
                                      variant: set.variant,
                                      questionCount: m.questionCount,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-none rounded-b-[var(--radius-control)] border-t border-[var(--admin-border)] px-4 py-2.5 text-left text-xs font-medium text-[var(--admin-body)] hover:text-[var(--admin-primary)]"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy from another test
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
