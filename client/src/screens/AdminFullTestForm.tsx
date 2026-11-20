/**
 * AdminFullTestForm — add a full IELTS test, or a whole book of them (Cambridge, Practice Tests
 * Plus), or edit a full test's details.
 * Routes: /admin/ielts/tests/new (?type=general starts on General Training)
 *         /admin/ielts/tests/:id/edit
 */
import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminSelect from "@/components/AdminSelect";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useSearch } from "@/lib/router";
import {
  BOOK_SERIES,
  bookSeries,
  bookTestTitle,
  bookTitle,
} from "@shared/mock";

type Variant = "academic" | "general";
type FormState = {
  title: string;
  variant: Variant;
  /** Book series key (cambridge, practice_plus), or "" for our own test. */
  series: string;
  book: string;
  test: string;
  /** How many tests to create when adding a whole book. */
  testCount: string;
};
const EMPTY_FORM: FormState = {
  title: "",
  variant: "academic",
  series: "",
  book: "",
  test: "",
  testCount: "",
};

/** Same field styles as the other admin form pages (e.g. New user). */
const inputClass =
  "mt-2 h-11 w-full border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]";
const labelClass = "text-sm font-medium text-[var(--admin-heading)]";
const hintClass =
  "mt-2 block text-xs font-normal leading-5 text-[var(--admin-body)]";

export default function AdminFullTestForm({ id }: { id?: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const search = new URLSearchParams(useSearch());
  const editing: "new" | number = id ?? "new";
  const { data: sets, isLoading } = trpc.mockTestSets.list.useQuery(undefined, {
    enabled: id !== undefined,
  });
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    variant: search.get("type") === "general" ? "general" : "academic",
  }));
  const [loaded, setLoaded] = useState(id === undefined);

  // Editing: fill the form once the test has loaded.
  useEffect(() => {
    if (loaded || !sets) return;
    const set = sets.find(item => item.id === id);
    if (set)
      setForm({
        title: set.title,
        variant: set.variant,
        series: bookSeries(set.series)?.key ?? "",
        book: set.bookNumber ? String(set.bookNumber) : "",
        test: set.testNumber ? String(set.testNumber) : "",
        testCount: "",
      });
    setLoaded(true);
  }, [sets, id, loaded]);

  /** Back to the list, on the tab the test belongs to. */
  const backPath = `/admin/ielts/tests${form.variant === "general" ? "?type=general" : ""}`;
  const done = () => {
    utils.mockTestSets.list.invalidate();
    utils.mockTests.list.invalidate();
    navigate(backPath);
  };

  const create = trpc.mockTestSets.create.useMutation({
    onSuccess: () => {
      toast.success("Test created. Add questions to each module.");
      done();
    },
    onError: error => toast.error(error.message),
  });
  const createBook = trpc.mockTestSets.createBook.useMutation({
    onSuccess: ({ created, skipped }) => {
      const book = bookTitle(form.series, Number(form.book) || 1);
      if (created.length === 0)
        toast.info(`All tests of ${book} are already added`);
      else
        toast.success(
          `Added ${book} · Test ${created.join(", ")}` +
            (skipped.length
              ? ` (Test ${skipped.join(", ")} already existed)`
              : "") +
            ". Add questions to each module."
        );
      done();
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.mockTestSets.update.useMutation({
    onSuccess: () => {
      toast.success("Test updated");
      done();
    },
    onError: error => toast.error(error.message),
  });
  const series = bookSeries(form.series);
  // A one-book series (the Official Guide) has no volume number: it is always book 1.
  const book = series?.singleBook ? 1 : Number(form.book) || null;
  const testNumber = Number(form.test) || null;
  // Cambridge books always have four tests, so the count isn't asked for.
  const testCount = series?.fixedTestCount
    ? series.testsPerBook
    : Number(form.testCount) || series?.testsPerBook || 0;
  /** A new book entry is a whole book: all of its tests are created together. */
  const addingBook = editing === "new" && !!series;
  const suggestedTitle =
    series && book && testNumber
      ? bookTestTitle(series.key, book, testNumber)
      : "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (series && addingBook) {
      if (!book) return toast.error(`Enter the ${series.label} book number`);
      if (testCount < 1 || testCount > 20)
        return toast.error("Enter how many tests the book has (1–20)");
      return createBook.mutate({
        series: series.key,
        bookNumber: book,
        variant: form.variant,
        testCount,
      });
    }
    // Book tests are named from the book and test number; our own tests need a title.
    if (series && (!book || !testNumber))
      return toast.error("Enter the book and test number");
    const title = series ? suggestedTitle : form.title.trim();
    if (!title) return toast.error("Give the test a title");
    const data = {
      title,
      variant: form.variant,
      series: series ? series.key : null,
      bookNumber: series ? book : null,
      testNumber: series ? testNumber : null,
    };
    if (editing === "new") create.mutate(data);
    else if (typeof editing === "number") update.mutate({ id: editing, data });
  };

  const saving = create.isPending || createBook.isPending || update.isPending;
  const missing =
    id !== undefined && loaded && !sets?.some(set => set.id === id);

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={
          editing !== "new"
            ? "Edit test"
            : series
              ? series.singleBook
                ? `New ${series.label} tests`
                : `New ${series.label} book`
              : "New test"
        }
        parent={{ label: "Full tests", href: backPath }}
      />
      {(id !== undefined && isLoading) || !loaded ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-red-600" />
        </div>
      ) : missing ? (
        <p className="py-16 text-center text-[var(--admin-body)]">
          This test no longer exists.
        </p>
      ) : (
        <form onSubmit={submit} className="max-w-3xl">
          <div className="mb-7">
            <h2 className="font-display text-xl font-semibold text-[var(--admin-heading)]">
              Test details
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-body)]">
              {editing !== "new"
                ? "Change where the test comes from, its type or its name."
                : "Choose where the test comes from. Each test gets an empty Listening, Reading, Writing and Speaking module to add questions to."}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Source
              <AdminSelect
                value={form.series}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    series: e.target.value,
                    testCount: "",
                  }))
                }
              >
                <option value="">Our own test</option>
                {BOOK_SERIES.map(item => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </AdminSelect>
              {addingBook && (
                <span className={hintClass}>
                  {series.singleBook
                    ? "Adds all of the book's tests at once."
                    : "Adds every test of the book at once."}{" "}
                  Tests already added are skipped.
                </span>
              )}
            </label>
            <label className={labelClass}>
              Type
              <AdminSelect
                value={form.variant}
                onChange={e =>
                  setForm(f => ({ ...f, variant: e.target.value as Variant }))
                }
              >
                <option value="academic">Academic</option>
                <option value="general">General Training</option>
              </AdminSelect>
            </label>

            {series && !series.singleBook && (
              <label className={labelClass}>
                Book
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.book}
                  onChange={e => setForm(f => ({ ...f, book: e.target.value }))}
                  className={inputClass}
                  placeholder={`e.g. ${series.books}`}
                />
                {addingBook && series.fixedTestCount && book && (
                  <span className={hintClass}>
                    Adds {bookTitle(series.key, book)} · Test 1–{testCount}
                  </span>
                )}
              </label>
            )}
            {series &&
              !(addingBook && series.fixedTestCount) &&
              (addingBook ? (
                <label className={labelClass}>
                  Tests in book
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.testCount}
                    onChange={e =>
                      setForm(f => ({ ...f, testCount: e.target.value }))
                    }
                    className={inputClass}
                    placeholder={String(series.testsPerBook)}
                  />
                  {book && (
                    <span className={hintClass}>
                      Adds {bookTitle(series.key, book)} · Test{" "}
                      {testCount > 1 ? `1–${testCount}` : "1"}
                    </span>
                  )}
                </label>
              ) : (
                <label className={labelClass}>
                  Test
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.test}
                    onChange={e =>
                      setForm(f => ({ ...f, test: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="1"
                  />
                  {suggestedTitle && (
                    <span className={hintClass}>
                      Will be named {suggestedTitle}
                    </span>
                  )}
                </label>
              ))}

            {!series && (
              <label className={`${labelClass} sm:col-span-2`}>
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

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="admin-button admin-button-primary"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editing !== "new"
                ? "Save changes"
                : addingBook
                  ? series.singleBook
                    ? "Add tests"
                    : "Add book"
                  : "Create test"}
            </button>
            <Link
              href={backPath}
              className="admin-button admin-button-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
