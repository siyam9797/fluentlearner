/**
 * AdminMockTests — one module's mock tests (Listening, Reading, Writing or Speaking) as a standard
 * admin list: search, filters, table or grid view, publish switch and paging.
 * Route: /admin/ielts/{module} (/admin/ielts itself opens Listening).
 */
import { useMemo, useState } from "react";
import {
  BookOpenText,
  ClipboardCheck,
  Headphones,
  Loader2,
  Mic,
  PenLine,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminAttemptsDrawer from "@/components/AdminAttemptsDrawer";
import AdminFilterDrawer, {
  AdminFilterButton,
  passesFilter,
  type FilterGroup,
  type FilterSelection,
} from "@/components/AdminFilterDrawer";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminPagination, {
  useAdminPagination,
} from "@/components/AdminPagination";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useSearch } from "@/lib/router";
import {
  CAMBRIDGE,
  DEFAULT_DURATION_MINUTES,
  MODULE_LABELS,
  type MockModule,
} from "@shared/mock";

export const MODULE_ICONS: Record<MockModule, typeof BookOpenText> = {
  reading: BookOpenText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};

/** Modules in IELTS test-day order. */
export const MOCK_MODULES: MockModule[] = [
  "listening",
  "reading",
  "writing",
  "speaking",
];
export const isMockModule = (value: string): value is MockModule =>
  (MOCK_MODULES as string[]).includes(value);

export const MODULE_BLURB: Record<MockModule, string> = {
  reading: "Passages with auto-marked questions and band conversion.",
  listening: "Audio parts with auto-marked questions and band conversion.",
  writing:
    "Task 1 and Task 2 with word counts. You mark against the four criteria.",
  speaking: "Parts 1–3 recorded in the browser. You listen and mark.",
};

const NO_FILTERS: FilterSelection = {
  source: [],
  status: [],
};

type Source = "own" | "cambridge";
// Also the list order: our own tests first, the large Cambridge library last.
const SOURCES: { key: Source; label: string }[] = [
  { key: "own", label: "Our tests" },
  { key: "cambridge", label: CAMBRIDGE.label },
];
const SOURCE_RANK = Object.fromEntries(
  SOURCES.map(({ key }, index) => [key, index])
) as Record<Source, number>;

const iconButton = "admin-icon-button";

export default function AdminMockTests({ module }: { module: MockModule }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: everyTest = [], isLoading } = trpc.mockTests.list.useQuery();
  const allTests = everyTest.filter(test => test.module === module);
  const label = MODULE_LABELS[module];
  const ModuleIcon = MODULE_ICONS[module];
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterSelection>(NO_FILTERS);
  const [listView, setListView] = useState<AdminListView>("table");
  // Student attempts panel; ?attempts=submitted (from the hub or Overview) opens it on "To grade".
  const search = new URLSearchParams(useSearch());
  const [attemptsPanel, setAttemptsPanel] = useState<{
    test?: { id: number; title: string };
    status?: "submitted" | "graded" | "all";
  } | null>(() =>
    search.get("attempts") === "submitted" ? { status: "submitted" } : null
  );

  type Test = (typeof allTests)[number];
  const sourceOf = (test: Test): Source =>
    test.series === CAMBRIDGE.key ? "cambridge" : "own";
  const statusOf = (test: Test) => (test.isPublished ? "published" : "draft");

  const needle = query.trim().toLowerCase();
  const tests = allTests
    .filter(
      test =>
        (!needle || test.title.toLowerCase().includes(needle)) &&
        passesFilter(filters, "source", sourceOf(test)) &&
        passesFilter(filters, "status", statusOf(test))
    )
    .sort((a, b) => SOURCE_RANK[sourceOf(a)] - SOURCE_RANK[sourceOf(b)]);
  const { pageRows: shown, pagination } = useAdminPagination(
    tests,
    "admin-mock-tests-page-size",
    [query, filters]
  );

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const count = (match: (test: Test) => boolean) =>
      allTests.filter(match).length;
    return [
      {
        key: "source",
        title: "Source",
        options: SOURCES.map(({ key, label }) => ({
          value: key,
          label,
          count: count(test => sourceOf(test) === key),
        })),
      },
      {
        key: "status",
        title: "Status",
        options: [
          {
            value: "published",
            label: "Published",
            count: count(test => test.isPublished),
          },
          {
            value: "draft",
            label: "Draft",
            count: count(test => !test.isPublished),
          },
        ],
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyTest, module]);

  const publish = trpc.mockTests.setPublished.useMutation({
    onSuccess: (_, vars) => {
      toast.success(
        vars.isPublished
          ? "Test published — students can see it now"
          : "Test hidden from students"
      );
      utils.mockTests.list.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const remove = trpc.mockTests.delete.useMutation({
    onSuccess: () => {
      toast.success("Test deleted");
      utils.mockTests.list.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const closeSearch = () => {
    setQuery("");
    setSearchOpen(false);
  };

  const kindOf = (test: Test) => {
    const parts: string[] = [];
    if (test.module === "reading")
      parts.push(test.variant === "general" ? "General" : "Academic");
    else parts.push("Full test");
    if (test.format === "answer_sheet") parts.push("Answer sheet");
    return parts.filter(Boolean).join(" · ");
  };
  // Every test is offered both ways; students pick timed exam or practice when they start.
  const modeOf = (test: Test) =>
    `Timed ${test.durationMinutes ?? DEFAULT_DURATION_MINUTES[test.module]} min · Practice`;

  const publishSwitch = (test: Test) => (
    <div className="flex items-center gap-2">
      <Switch
        id={`publish-${test.id}`}
        checked={test.isPublished}
        disabled={publish.isPending}
        onCheckedChange={checked =>
          publish.mutate({ id: test.id, isPublished: checked })
        }
      />
      <label
        htmlFor={`publish-${test.id}`}
        className="cursor-pointer text-sm text-gray-600"
      >
        {test.isPublished ? "Published" : "Draft"}
      </label>
    </div>
  );

  const actions = (test: Test) => (
    <AdminActionsMenu label={`Actions for ${test.title}`}>
      <button type="button" onClick={() => navigate(`/admin/ielts/${test.id}`)}>
        Edit
      </button>
      <button
        type="button"
        onClick={() =>
          window.open(`/admin/ielts/preview/${test.id}`, "_blank", "noopener")
        }
      >
        Preview as student
      </button>
      <button
        type="button"
        onClick={() =>
          setAttemptsPanel({ test: { id: test.id, title: test.title } })
        }
      >
        Student attempts
      </button>
      <button
        type="button"
        className="danger"
        onClick={() => {
          const warning = test.attemptCount
            ? ` This also deletes ${test.attemptCount} student attempt(s).`
            : "";
          if (confirm(`Delete "${test.title}"?${warning}`))
            remove.mutate({ id: test.id });
        }}
      >
        Delete
      </button>
    </AdminActionsMenu>
  );

  const attempts = (test: Test) => {
    const open = (status?: "submitted") =>
      setAttemptsPanel({ test: { id: test.id, title: test.title }, status });
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => open()}
          className="hover:text-[var(--admin-primary)] hover:underline"
        >
          {test.attemptCount}
        </button>
        {test.awaitingGrading > 0 && (
          <button
            type="button"
            onClick={() => open("submitted")}
            className="admin-status-label warning"
          >
            {test.awaitingGrading} to grade
          </button>
        )}
      </span>
    );
  };
  const moduleToGrade = allTests.reduce(
    (sum, test) => sum + test.awaitingGrading,
    0
  );

  const filterButton = (
    <AdminFilterButton
      label={`Filter ${label} tests`}
      selection={filters}
      onClick={() => setFilterOpen(true)}
    />
  );

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={label}
        description={MODULE_BLURB[module]}
        action={
          searchOpen ? undefined : (
            <div className="flex flex-wrap items-center gap-2">
              <AdminViewToggle
                view={listView}
                onChange={setListView}
                label={`${label} tests`}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={`Search ${label} tests`}
                className={iconButton}
              >
                <Search className="h-4 w-4" />
              </button>
              {filterButton}
              <button
                type="button"
                onClick={() =>
                  setAttemptsPanel({
                    status: moduleToGrade > 0 ? "submitted" : "all",
                  })
                }
                aria-label="Student attempts"
                title="Student attempts"
                className={iconButton}
              >
                <ClipboardCheck className="h-4 w-4" />
                {moduleToGrade > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                    {moduleToGrade}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate(`/admin/ielts/new?module=${module}`)}
                className="admin-primary-button"
              >
                <Plus className="h-4 w-4" />
                New {label} test
              </button>
            </div>
          )
        }
      />

      {searchOpen && (
        <div className="-mt-4 mb-8 flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
              }}
              onKeyDown={e => e.key === "Escape" && closeSearch()}
              placeholder={`Search ${label} tests by title`}
              className="h-11 w-full rounded-lg border border-gray-300 pl-11 pr-4 outline-none focus:border-red-500"
            />
          </div>
          {filterButton}
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search"
            className={iconButton}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {attemptsPanel && (
        <AdminAttemptsDrawer
          module={module}
          test={attemptsPanel.test}
          initialStatus={attemptsPanel.status}
          onClose={() => setAttemptsPanel(null)}
        />
      )}

      {filterOpen && (
        <AdminFilterDrawer
          title={`Filter ${label} tests`}
          groups={filterGroups}
          selection={filters}
          onChange={next => {
            setFilters(next);
          }}
          onClose={() => setFilterOpen(false)}
          resultCount={tests.length}
        />
      )}

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : allTests.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-14 text-center text-gray-500">
          <ModuleIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-900">No {label} tests yet</p>
          <p className="mt-1 text-sm">{MODULE_BLURB[module]}</p>
          <button
            onClick={() => navigate(`/admin/ielts/new?module=${module}`)}
            className="admin-primary-button mt-6"
          >
            <Plus className="h-4 w-4" />
            Create the first {label} test
          </button>
        </div>
      ) : tests.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No tests match your search or filters.
        </div>
      ) : (
        <>
          {listView === "grid" ? (
            <div className="admin-view-grid">
              {shown.map(test => {
                const Icon = MODULE_ICONS[test.module];
                return (
                  <div key={test.id} className="admin-list-card p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                          <Icon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/ielts/${test.id}`}
                            className="block truncate font-bold text-gray-900 hover:text-[#c76f42]"
                          >
                            {test.title}
                          </Link>
                          <p className="mt-0.5 truncate text-sm text-gray-500">
                            {kindOf(test)}
                          </p>
                        </div>
                      </div>
                      {actions(test)}
                    </div>
                    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{modeOf(test)}</span>
                      <span>
                        {test.questionCount} question
                        {test.questionCount === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Attempts: {attempts(test)}
                      </span>
                    </div>
                    {publishSwitch(test)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Test</th>
                    <th className="px-4 py-3 font-medium">Modes</th>
                    <th className="px-4 py-3 font-medium">Questions</th>
                    <th className="px-4 py-3 font-medium">Attempts</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(test => {
                    const Icon = MODULE_ICONS[test.module];
                    return (
                      <tr
                        key={test.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="max-w-[360px] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <Icon className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/ielts/${test.id}`}
                                className="block truncate font-medium text-gray-900 hover:text-[#c76f42]"
                              >
                                {test.title}
                              </Link>
                              <p className="truncate text-xs text-gray-500">
                                {kindOf(test)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {modeOf(test)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {test.questionCount}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {attempts(test)}
                        </td>
                        <td className="px-4 py-3">{publishSwitch(test)}</td>
                        <td className="px-4 py-3">{actions(test)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <AdminPagination {...pagination} noun="tests" />
        </>
      )}
    </div>
  );
}
