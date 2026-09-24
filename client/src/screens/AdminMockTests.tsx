/**
 * AdminMockTests — list of IELTS mock tests with publish toggle and quick stats.
 */
import { useState } from "react";
import { BookOpenText, ClipboardCheck, Headphones, Library, Loader2, Mic, PenLine, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { CAMBRIDGE, MODULE_LABELS, type MockModule } from "@shared/mock";

export const MODULE_ICONS: Record<MockModule, typeof BookOpenText> = {
  reading: BookOpenText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};

export default function AdminMockTests() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: allTests = [], isLoading } = trpc.mockTests.list.useQuery();
  const [filter, setFilter] = useState<"all" | "cambridge" | "own">("all");
  const tests = allTests.filter(t => filter === "all" || (filter === "cambridge" ? t.series === CAMBRIDGE.key : !t.series));

  const publish = trpc.mockTests.setPublished.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isPublished ? "Test published — students can see it now" : "Test hidden from students");
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

  const awaiting = allTests.reduce((sum, t) => sum + t.awaitingGrading, 0);

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Mock Tests"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate("/admin/mock-tests/cambridge")} className="admin-button admin-button-secondary">
              <Library className="h-4 w-4" />Cambridge 1–21
            </button>
            <button onClick={() => navigate("/admin/mock-results")} className="admin-button admin-button-secondary">
              <ClipboardCheck className="h-4 w-4" />
              Results{awaiting > 0 && <span className="rounded-full bg-[var(--admin-primary,#c76f42)] px-2 text-xs text-white">{awaiting}</span>}
            </button>
            <button onClick={() => navigate("/admin/mock-tests/new")} className="admin-primary-button">
              <Plus className="h-4 w-4" />New test
            </button>
          </div>
        }
      />

      {allTests.length > 0 && (
        <div className="mb-5 flex gap-2">
          {([["all", "All tests"], ["cambridge", CAMBRIDGE.label], ["own", "Our own tests"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn("admin-button admin-filter-button", filter === key ? "admin-button-primary" : "admin-button-secondary")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
      ) : allTests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-900">No mock tests yet</p>
          <p className="mt-1 text-sm text-gray-500">Create a Reading, Listening, Writing or Speaking test for your students.</p>
          <button onClick={() => navigate("/admin/mock-tests/new")} className="admin-primary-button mt-6"><Plus className="h-4 w-4" />Create the first test</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(test => {
            const Icon = MODULE_ICONS[test.module];
            return (
              <div key={test.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gray-100">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/mock-tests/${test.id}`} className="block truncate font-bold text-gray-900 hover:underline">{test.title}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                      <span>{MODULE_LABELS[test.module]}{test.module === "reading" ? ` · ${test.variant === "general" ? "General" : "Academic"}` : ""}</span>
                      {test.format === "answer_sheet" && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">Answer sheet</span>}
                      <span>{test.mode === "exam" ? `Timed exam${test.durationMinutes ? ` · ${test.durationMinutes} min` : ""}` : "Practice"}</span>
                      <span>{test.questionCount} question{test.questionCount === 1 ? "" : "s"}</span>
                      <Link href={`/admin/mock-results?test=${test.id}`} className="hover:underline">
                        {test.attemptCount} attempt{test.attemptCount === 1 ? "" : "s"}
                      </Link>
                      {test.awaitingGrading > 0 && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">{test.awaitingGrading} to grade</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={test.isPublished}
                      disabled={publish.isPending}
                      onChange={e => publish.mutate({ id: test.id, isPublished: e.target.checked })}
                    />
                    <span className={test.isPublished ? "font-medium text-green-700" : "text-gray-500"}>{test.isPublished ? "Published" : "Draft"}</span>
                  </label>
                  <button onClick={() => navigate(`/admin/mock-tests/${test.id}`)} className="rounded-lg p-2 hover:bg-gray-100" aria-label={`Edit ${test.title}`}>
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => {
                      const warning = test.attemptCount ? ` This also deletes ${test.attemptCount} student attempt(s).` : "";
                      if (confirm(`Delete "${test.title}"?${warning}`)) remove.mutate({ id: test.id });
                    }}
                    className="rounded-lg p-2 hover:bg-red-50"
                    aria-label={`Delete ${test.title}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
