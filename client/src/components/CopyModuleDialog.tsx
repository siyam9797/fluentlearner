/**
 * CopyModuleDialog — copies another test's module (sections, passages, audio, questions and
 * answers) into a module, replacing what it had. Used in the module editor (/admin/ielts/:id).
 */
import { useState } from "react";
import { Copy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { MODULE_LABELS, type MockModule } from "@shared/mock";

type Variant = "academic" | "general";
const VARIANTS: Record<Variant, { label: string; tone: string }> = {
  academic: { label: "Academic", tone: "info" },
  general: { label: "General Training", tone: "warning" },
};

const inputClass =
  "mt-2 h-11 w-full rounded-[var(--radius-control)] border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]";

/** The module a "Copy from another test" dialog is filling. */
export type CopyTarget = {
  testId: number;
  module: MockModule;
  /** The module test's full title, e.g. "Cambridge IELTS 18 · Test 1 · Listening". */
  setTitle: string;
  variant: Variant;
  questionCount: number;
};

/**
 * Picks another test's module of the same kind (a full test's or a standalone one) and copies
 * its sections and questions into the target, replacing what the target had.
 */
export default function CopyModuleDialog({
  target,
  onClose,
  onCopied,
  note,
}: {
  target: CopyTarget;
  onClose: () => void;
  onCopied: () => void;
  /** Extra warning shown above the buttons, e.g. about unsaved edits. */
  note?: string;
}) {
  const { data: tests = [], isLoading } = trpc.mockTests.list.useQuery();
  const { data: sets = [] } = trpc.mockTestSets.list.useQuery();
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState<number | null>(null);
  const copy = trpc.mockTests.copyFrom.useMutation({
    onSuccess: ({ questions }) => {
      toast.success(
        `Copied ${questions} question${questions === 1 ? "" : "s"} into ${target.setTitle}`
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
            note,
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
