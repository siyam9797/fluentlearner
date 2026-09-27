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
      className="flex items-center gap-2"
      role="group"
      aria-label={`${label} view`}
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        title="Grid view"
        className="admin-icon-button"
      >
        <Grid2X2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        aria-label="Table view"
        aria-pressed={view === "table"}
        title="Table view"
        className="admin-icon-button"
      >
        <TableProperties className="h-4 w-4" />
      </button>
    </div>
  );
}
