/**
 * AdminCambridgeLibrary — Cambridge IELTS 1–21 × Test 1–4 × module grid.
 * Each cell opens the existing test or starts a pre-filled answer sheet.
 * Route: /admin/mock-tests/cambridge
 */
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { CAMBRIDGE, MODULE_LABELS, type MockModule } from "@shared/mock";

const MODULES: MockModule[] = ["listening", "reading", "writing", "speaking"];
const SHORT: Record<MockModule, string> = { listening: "L", reading: "R", writing: "W", speaking: "S" };

export default function AdminCambridgeLibrary() {
  const [, navigate] = useLocation();
  const { data: tests = [], isLoading } = trpc.mockTests.list.useQuery();
  const [onlyMissing, setOnlyMissing] = useState(false);

  const byKey = useMemo(() => {
    const map = new Map<string, (typeof tests)[number]>();
    for (const t of tests) {
      if (t.series === CAMBRIDGE.key && t.bookNumber && t.testNumber) map.set(`${t.bookNumber}-${t.testNumber}-${t.module}`, t);
    }
    return map;
  }, [tests]);

  const total = CAMBRIDGE.books * CAMBRIDGE.testsPerBook * MODULES.length;
  const published = [...byKey.values()].filter(t => t.isPublished).length;
  const books = Array.from({ length: CAMBRIDGE.books }, (_, i) => CAMBRIDGE.books - i);

  const open = (book: number, test: number, module: MockModule) => {
    const existing = byKey.get(`${book}-${test}-${module}`);
    navigate(existing
      ? `/admin/mock-tests/${existing.id}`
      : `/admin/mock-tests/new?series=${CAMBRIDGE.key}&book=${book}&test=${test}&module=${module}`);
  };

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader title="Cambridge IELTS Library" parent={{ label: "Mock Tests", href: "/admin/mock-tests" }} />

      <div className="-mt-4 mb-6 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        <p>
          Click a module to add it. New Cambridge tests start as an <strong>answer sheet</strong>: students work from their own
          Cambridge book and audio, and you only paste the answer key from your copy — the book's passages and recordings are not
          stored on the site.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span><strong className="text-gray-900">{published}</strong> of {total} modules published · {byKey.size} added</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-dashed border-gray-400" />Not added</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-gray-300" />Draft</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-green-600" />Published</span>
          <label className="ml-auto flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} />
            Show only books with gaps
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Book</th>
                {Array.from({ length: CAMBRIDGE.testsPerBook }, (_, i) => (
                  <th key={i} className="px-4 py-3 text-left font-medium">Test {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map(book => {
                const complete = Array.from({ length: CAMBRIDGE.testsPerBook }, (_, i) => i + 1)
                  .every(test => MODULES.every(m => byKey.get(`${book}-${test}-${m}`)?.isPublished));
                if (onlyMissing && complete) return null;
                return (
                  <tr key={book} className="border-b border-gray-100 last:border-0">
                    <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-bold text-gray-900">{CAMBRIDGE.label} {book}</th>
                    {Array.from({ length: CAMBRIDGE.testsPerBook }, (_, i) => i + 1).map(test => (
                      <td key={test} className="px-4 py-3">
                        <div className="flex gap-1">
                          {MODULES.map(module => {
                            const t = byKey.get(`${book}-${test}-${module}`);
                            const state = !t ? "missing" : t.isPublished ? "published" : "draft";
                            return (
                              <button
                                key={module}
                                type="button"
                                onClick={() => open(book, test, module)}
                                title={`Book ${book} · Test ${test} · ${MODULE_LABELS[module]} — ${state === "missing" ? "not added" : state}${t?.awaitingGrading ? ` · ${t.awaitingGrading} to grade` : ""}`}
                                aria-label={`Cambridge ${book} test ${test} ${MODULE_LABELS[module]}: ${state === "missing" ? "not added" : state}`}
                                className={cn(
                                  "relative h-8 w-8 rounded-md text-xs font-bold transition-transform hover:scale-110",
                                  state === "missing" && "border border-dashed border-gray-400 text-gray-400",
                                  state === "draft" && "bg-gray-300 text-gray-700",
                                  state === "published" && "bg-green-600 text-white",
                                )}
                              >
                                {SHORT[module]}
                                {!!t?.awaitingGrading && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
