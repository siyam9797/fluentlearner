/**
 * AdminFullTests — full IELTS tests (e.g. "Cambridge IELTS 18 · Test 1").
 * Create the test first; it comes with an empty Listening, Reading, Writing and Speaking module,
 * and each module's questions are then added in the test editor (/admin/ielts/:id).
 */
import { useState, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminFilterDrawer, {
  AdminFilterButton,
  passesFilter,
  type FilterSelection,
} from "@/components/AdminFilterDrawer";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import { CAMBRIDGE, MODULE_LABELS } from "@shared/mock";
import { MODULE_ICONS } from "./AdminMockTests";

type Variant = "academic" | "general";
type FormState = {
  title: string;
  variant: Variant;
  cambridge: boolean;
  book: string;
  test: string;
};
const EMPTY_FORM: FormState = {
  title: "",
  variant: "academic",
  cambridge: false,
  book: "",
  test: "",
};

/** Academic and General Training use the standard admin tags, in two different tones. */
const VARIANTS: Record<Variant, { label: string; tone: string }> = {
  academic: { label: "Academic", tone: "info" },
  general: { label: "General Training", tone: "warning" },
};

const inputClass =
  "mt-2 h-11 w-full rounded-[var(--radius-control)] border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]";

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-11 rounded-[var(--radius-control)] border text-sm transition-colors ${
            value === option.value
              ? "border-[var(--admin-primary)] text-[var(--admin-primary)]"
              : "border-[var(--admin-border)] text-[var(--admin-heading)] hover:bg-[var(--admin-background)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminFullTests() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: sets = [], isLoading } = trpc.mockTestSets.list.useQuery();

  /** null = form closed; "new" = creating; a number = editing that full test. */
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filters, setFilters] = useState<FilterSelection>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const shown = sets.filter(set =>
    passesFilter(filters, "variant", set.variant)
  );

  const refresh = () => {
    utils.mockTestSets.list.invalidate();
    utils.mockTests.list.invalidate();
  };
  const close = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };
  const create = trpc.mockTestSets.create.useMutation({
    onSuccess: () => {
      toast.success("Test created. Add questions to each module.");
      refresh();
      close();
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.mockTestSets.update.useMutation({
    onSuccess: () => {
      toast.success("Test updated");
      refresh();
      close();
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.mockTestSets.delete.useMutation({
    onSuccess: () => {
      toast.success("Test deleted");
      refresh();
    },
    onError: error => toast.error(error.message),
  });

  const book = Number(form.book) || null;
  const testNumber = Number(form.test) || null;
  const suggestedTitle =
    form.cambridge && book && testNumber
      ? `${CAMBRIDGE.label} ${book} · Test ${testNumber}`
      : "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Cambridge tests are named from the book and test number; our own tests need a title.
    if (form.cambridge && (!book || !testNumber))
      return toast.error("Enter the Cambridge book and test number");
    const title = form.cambridge ? suggestedTitle : form.title.trim();
    if (!title) return toast.error("Give the test a title");
    const data = {
      title,
      variant: form.variant,
      series: form.cambridge ? CAMBRIDGE.key : null,
      bookNumber: form.cambridge ? book : null,
      testNumber: form.cambridge ? testNumber : null,
    };
    if (editing === "new") create.mutate(data);
    else if (typeof editing === "number") update.mutate({ id: editing, data });
  };

  const startEdit = (set: (typeof sets)[number]) => {
    setEditing(set.id);
    setForm({
      title: set.title,
      variant: set.variant,
      cambridge: set.series === CAMBRIDGE.key,
      book: set.bookNumber ? String(set.bookNumber) : "",
      test: set.testNumber ? String(set.testNumber) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Full tests"
        description="Create a test first, then add questions to each of its four modules."
        action={
          editing === null ? (
            <div className="flex items-center gap-2">
              <AdminFilterButton
                label="Filter full tests"
                selection={filters}
                onClick={() => setFilterOpen(true)}
              />
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="admin-primary-button"
              >
                <Plus className="h-4 w-4" />
                New test
              </button>
            </div>
          ) : undefined
        }
      />

      {filterOpen && (
        <AdminFilterDrawer
          title="Filter full tests"
          groups={[
            {
              key: "variant",
              title: "Type",
              options: (Object.keys(VARIANTS) as Variant[]).map(variant => ({
                value: variant,
                label: VARIANTS[variant].label,
                count: sets.filter(set => set.variant === variant).length,
              })),
            },
          ]}
          selection={filters}
          onChange={setFilters}
          onClose={() => setFilterOpen(false)}
          resultCount={shown.length}
        />
      )}

      {editing !== null && (
        <form
          onSubmit={submit}
          className="mb-10 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--admin-heading)]">
              {editing === "new" ? "New test" : "Edit test"}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cancel"
              className="admin-icon-button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="text-sm font-medium text-[var(--admin-heading)]">
              Source
              <Segmented
                value={form.cambridge ? "cambridge" : "own"}
                options={[
                  { value: "own", label: "Our own test" },
                  { value: "cambridge", label: CAMBRIDGE.label },
                ]}
                onChange={value =>
                  setForm(f => ({ ...f, cambridge: value === "cambridge" }))
                }
              />
            </div>
            <div className="text-sm font-medium text-[var(--admin-heading)]">
              Type
              <Segmented<Variant>
                value={form.variant}
                options={[
                  { value: "academic", label: "Academic" },
                  { value: "general", label: "General Training" },
                ]}
                onChange={variant => setForm(f => ({ ...f, variant }))}
              />
            </div>

            {form.cambridge && (
              <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:max-w-sm">
                <label className="text-sm font-medium text-[var(--admin-heading)]">
                  Book
                  <input
                    type="number"
                    min={1}
                    max={CAMBRIDGE.books}
                    value={form.book}
                    onChange={e =>
                      setForm(f => ({ ...f, book: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="18"
                  />
                </label>
                <label className="text-sm font-medium text-[var(--admin-heading)]">
                  Test
                  <input
                    type="number"
                    min={1}
                    max={CAMBRIDGE.testsPerBook}
                    value={form.test}
                    onChange={e =>
                      setForm(f => ({ ...f, test: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="1"
                  />
                </label>
                {suggestedTitle && (
                  <p className="col-span-2 text-sm text-[var(--admin-body)]">
                    Will be named{" "}
                    <span className="font-medium text-[var(--admin-heading)]">
                      {suggestedTitle}
                    </span>
                  </p>
                )}
              </div>
            )}

            {!form.cambridge && (
              <label className="text-sm font-medium text-[var(--admin-heading)] sm:col-span-2">
                Title
                <input
                  required
                  value={form.title}
                  onChange={e =>
                    setForm(f => ({ ...f, title: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. Mock Test 1"
                />
              </label>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="admin-primary-button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing === "new" ? "Create test" : "Save changes"}
            </button>
            {editing === "new" && (
              <p className="text-sm text-[var(--admin-body)]">
                Creates an empty Listening, Reading, Writing and Speaking
                module.
              </p>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-red-600" />
        </div>
      ) : sets.length === 0 ? (
        editing === null && (
          <div className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-12 text-center">
            <p className="font-medium text-[var(--admin-heading)]">
              No full tests yet
            </p>
            <p className="mt-1 text-sm text-[var(--admin-body)]">
              Create one, then add questions to its four modules.
            </p>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="admin-primary-button mt-5"
            >
              <Plus className="h-4 w-4" />
              New test
            </button>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {shown.length === 0 && (
            <p className="py-10 text-center text-sm text-[var(--admin-body)]">
              No tests match these filters.
            </p>
          )}
          {shown.map(set => {
            const done = set.modules.filter(m => m.questionCount > 0).length;
            const attempts = set.modules.reduce(
              (sum, m) => sum + m.attemptCount,
              0
            );
            return (
              <section key={set.id} className="admin-list-card p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[var(--admin-heading)]">
                      {set.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span
                        className={`admin-status-label ${VARIANTS[set.variant].tone}`}
                      >
                        {VARIANTS[set.variant].label}
                      </span>
                      <span className="text-sm text-[var(--admin-body)]">
                        {done} of 4 modules have questions
                      </span>
                    </div>
                  </div>
                  <AdminActionsMenu label={`Actions for ${set.title}`}>
                    <button type="button" onClick={() => startEdit(set)}>
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
                      <button
                        key={m.module}
                        type="button"
                        disabled={!m.testId}
                        onClick={() =>
                          m.testId && navigate(`/admin/ielts/${m.testId}`)
                        }
                        className="group flex flex-col rounded-[var(--radius-control)] bg-[var(--admin-background)] p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-50"
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
}
