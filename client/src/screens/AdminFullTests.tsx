/**
 * AdminFullTests — full IELTS tests (e.g. "Cambridge IELTS 18 · Test 1"), in Academic and General
 * Training tabs (?type=general). Tests are added on their own page (AdminFullTestForm).
 * Create the test first; it comes with an empty Listening, Reading, Writing and Speaking module,
 * and each module's questions are then added in the test editor (/admin/ielts/:id).
 */
import { useState } from "react";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "@/lib/router";
import {
  BOOK_SERIES,
  bookSeries,
  bookTitle,
  MODULE_LABELS,
} from "@shared/mock";
import { MODULE_ICONS } from "./AdminMockTests";

type Variant = "academic" | "general";
/** Academic and General Training use the standard admin tags, in two different tones. */
const VARIANTS: Record<Variant, { label: string; tone: string }> = {
  academic: { label: "Academic", tone: "info" },
  general: { label: "General Training", tone: "warning" },
};

const OPEN_GROUPS_KEY = "admin-full-tests-open-books";

export default function AdminFullTests() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: sets = [], isLoading } = trpc.mockTestSets.list.useQuery();

  /** Academic and General Training are separate tabs; each shows only its own tests. */
  const search = new URLSearchParams(useSearch());
  const [tab, setTab] = useState<Variant>(
    search.get("type") === "general" ? "general" : "academic"
  );
  /** Books whose tests are shown; all start closed. Remembered in this browser only. */
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem(OPEN_GROUPS_KEY) ?? "[]") as string[]
      );
    } catch {
      return new Set();
    }
  });
  const toggleGroup = (key: string) =>
    setOpenGroups(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify([...next]));
      } catch {
        // Storage can be unavailable (private window); the list still works.
      }
      return next;
    });
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
        <div className="space-y-3">
          {groups.map(group => {
            const open = openGroups.has(group.key);
            const modules = group.sets.flatMap(set => set.modules);
            const filled = modules.filter(m => m.questionCount > 0).length;
            return (
              <div key={group.key}>
                <h2>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`book-${group.key}`}
                    onClick={() => toggleGroup(group.key)}
                    className="group flex w-full items-center gap-3 py-3 text-left"
                  >
                    <ChevronDown
                      aria-hidden
                      className={`h-4 w-4 shrink-0 text-[var(--admin-body)] transition-transform ${open ? "" : "-rotate-90"}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-lg font-semibold text-[var(--admin-heading)] transition-colors group-hover:text-[var(--admin-primary)]">
                      {group.title}
                    </span>
                    <span className="shrink-0 text-sm text-[var(--admin-body)]">
                      {group.sets.length} test
                      {group.sets.length === 1 ? "" : "s"}
                      <span className="hidden sm:inline">
                        {" "}
                        · {filled} of {modules.length} modules have questions
                      </span>
                    </span>
                  </button>
                </h2>
                {open && (
                  <div id={`book-${group.key}`} className="space-y-4 pb-5 pt-4">
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
                            <AdminActionsMenu
                              label={`Actions for ${set.title}`}
                            >
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
                                          <Plus className="h-4 w-4" /> Add
                                          questions
                                        </>
                                      ) : (
                                        "Edit questions"
                                      )}
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
