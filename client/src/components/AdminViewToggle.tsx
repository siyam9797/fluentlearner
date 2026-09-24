"use client";

import { Grid2X2, TableProperties } from "lucide-react";

export type AdminListView = "grid" | "table";

export default function AdminViewToggle({
  view,
  onChange,
  label,
}: {
  view: AdminListView;
  onChange: (view: AdminListView) => void;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={`${label} view`}
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        title="Grid view"
        className={`grid h-9 w-9 place-items-center border transition-colors ${view === "grid" ? "border-[var(--admin-primary)] text-[var(--admin-primary)]" : "border-transparent text-[var(--admin-body)] hover:text-[var(--admin-primary)]"}`}
      >
        <Grid2X2 className="h-[17px] w-[17px] stroke-[1.5]" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        aria-label="Table view"
        aria-pressed={view === "table"}
        title="Table view"
        className={`grid h-9 w-9 place-items-center border transition-colors ${view === "table" ? "border-[var(--admin-primary)] text-[var(--admin-primary)]" : "border-transparent text-[var(--admin-body)] hover:text-[var(--admin-primary)]"}`}
      >
        <TableProperties className="h-[17px] w-[17px] stroke-[1.5]" />
      </button>
    </div>
  );
}
