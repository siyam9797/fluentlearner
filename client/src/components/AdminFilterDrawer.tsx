"use client";

import { useEffect } from "react";
import { ListFilter, X } from "lucide-react";

export type FilterOption = { value: string; label: string; count: number };
export type FilterGroup = {
  key: string;
  title: string;
  options: FilterOption[];
};
/** Selected values per group key; an empty list means "no filter" for that group. */
export type FilterSelection = Record<string, string[]>;

export const countFilters = (selection: FilterSelection) =>
  Object.values(selection).reduce((sum, values) => sum + values.length, 0);

/** Does `value` pass the group's filter? (Nothing selected in a group lets everything through.) */
export const passesFilter = (
  selection: FilterSelection,
  key: string,
  value: string
) => !selection[key]?.length || selection[key].includes(value);

const iconButton = "admin-icon-button";

/** The square filter button used in admin page headers, with a count of active filters. */
export function AdminFilterButton({
  label,
  selection,
  onClick,
}: {
  label: string;
  selection: FilterSelection;
  onClick: () => void;
}) {
  const active = countFilters(selection);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={iconButton}
    >
      <ListFilter className="h-4 w-4" />
      {active > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] text-white">
          {active}
        </span>
      )}
    </button>
  );
}

/** Right-hand filter panel shared by admin list pages. */
export default function AdminFilterDrawer({
  title,
  groups,
  selection,
  onChange,
  onClose,
  resultCount,
}: {
  title: string;
  groups: FilterGroup[];
  selection: FilterSelection;
  onChange: (selection: FilterSelection) => void;
  onClose: () => void;
  /** Rows matching the current filters; shown on the footer button. */
  resultCount?: number;
}) {
  const active = countFilters(selection);
  const toggle = (key: string, value: string) => {
    const current = selection[key] ?? [];
    onChange({
      ...selection,
      [key]: current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value],
    });
  };
  const clearGroup = (key: string) => onChange({ ...selection, [key]: [] });
  const clearAll = () =>
    onChange(Object.fromEntries(groups.map(group => [group.key, []])));

  // Escape closes the panel, and the page behind it doesn't scroll.
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

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 cursor-default rounded-none! bg-black/25"
      />
      <aside className="admin-filter-panel absolute inset-y-3 right-3 flex w-[calc(100%-1.5rem)] max-w-[380px] flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-heading)]">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {active > 0
                ? `${active} filter${active === 1 ? "" : "s"} applied`
                : "Select one or more options."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="admin-icon-button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 divide-y divide-[var(--admin-border)] overflow-y-auto px-6">
          {groups.map(group => {
            const chosen = selection[group.key] ?? [];
            return (
              <section key={group.key} className="py-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {group.title}
                  </h3>
                  {chosen.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearGroup(group.key)}
                      className="text-xs text-[var(--admin-primary)] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {group.options.map(option => {
                    const checked = chosen.includes(option.value);
                    const empty = option.count === 0 && !checked;
                    return (
                      <label
                        key={option.value}
                        className={`-mx-3 flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm transition-colors ${
                          empty
                            ? "cursor-default text-gray-400"
                            : "cursor-pointer text-[var(--admin-heading)] hover:bg-[var(--admin-card)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={empty}
                          onChange={() => toggle(group.key, option.value)}
                          className="h-4 w-4"
                        />
                        <span className="flex-1 truncate">{option.label}</span>
                        <span className="min-w-7 rounded-full bg-[var(--admin-card)] px-2 py-0.5 text-center text-xs text-gray-500">
                          {option.count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="flex gap-3 border-t border-[var(--admin-border)] px-6 py-4">
          <button
            type="button"
            onClick={clearAll}
            disabled={active === 0}
            className="admin-button admin-button-secondary flex-1"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="admin-button admin-button-primary flex-1"
          >
            {resultCount === undefined
              ? "Done"
              : `Show ${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </button>
        </footer>
      </aside>
    </div>
  );
}
