"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminSelect from "@/components/AdminSelect";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

/**
 * Paging state for an admin list: the page, a per-page size remembered per list
 * (under `storageKey`), and the rows on the current page. A new search or filter
 * (`resetKey`) starts again from page 1. Spread `pagination` into <AdminPagination>.
 */
export function useAdminPagination<T>(
  rows: T[],
  storageKey: string,
  resetKey?: unknown
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // Read after mount so the server render and the first client render match.
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(storageKey));
      if (PAGE_SIZE_OPTIONS.includes(stored)) setPageSize(stored);
    } catch {
      // Storage can be unavailable (private mode); the default size is used.
    }
  }, [storageKey]);
  const resetOn = JSON.stringify(resetKey ?? null);
  useEffect(() => setPage(1), [resetOn]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  return {
    pageRows: rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    pagination: {
      page: currentPage,
      pageSize,
      total: rows.length,
      onPageSizeChange: (size: number) => {
        setPageSize(size);
        setPage(1);
        try {
          localStorage.setItem(storageKey, String(size));
        } catch {
          // Storage can be unavailable (private mode); the choice then lasts this visit.
        }
      },
      onPageChange: (next: number) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    },
  };
}

/** Page numbers to show: always the first, last and the current page's neighbours, with gaps as "…". */
function pageItems(page: number, pageCount: number) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter(item => item >= 1 && item <= pageCount)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((item, index) => {
    if (index > 0 && item - sorted[index - 1] > 1) items.push("gap");
    items.push(item);
  });
  return items;
}

export default function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  noun = "items",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Shows a "per page" dropdown when given. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  /** Plural name for the count, e.g. "words". */
  noun?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const smallestSize = onPageSizeChange
    ? Math.min(...pageSizeOptions)
    : pageSize;
  if (total <= smallestSize) return null;
  const first = (page - 1) * pageSize + 1;
  const single = pageCount === 1;
  const last = Math.min(page * pageSize, total);
  const button =
    "grid h-9 min-w-9 place-items-center rounded-[var(--radius-control)] px-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-35";

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--admin-body)]">
        <span>
          Showing {first}–{last} of {total} {noun}
        </span>
        {onPageSizeChange && (
          <span className="flex items-center gap-2">
            Show
            <AdminSelect
              value={pageSize}
              size="sm"
              className="w-[84px]"
              aria-label={`${noun} per page`}
              onChange={event => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AdminSelect>
            per page
          </span>
        )}
      </div>
      <div
        className={cn(
          "order-first flex items-center gap-1",
          single && "hidden"
        )}
      >
        <button
          type="button"
          className={cn(button, "hover:bg-[var(--admin-card)]")}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-sm text-[var(--admin-body)]"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                button,
                item === page
                  ? "bg-[var(--admin-primary)] font-medium text-[var(--admin-secondary)]"
                  : "text-[var(--admin-heading)] hover:bg-[var(--admin-card)]"
              )}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          className={cn(button, "hover:bg-[var(--admin-card)]")}
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
