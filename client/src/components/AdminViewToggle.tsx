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
  const next: AdminListView = view === "grid" ? "table" : "grid";
  const title = `Switch to ${next} view`;
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={`${label}: ${title}`}
      title={title}
      className="admin-icon-button"
    >
      {next === "table" ? (
        <TableProperties className="h-4 w-4" />
      ) : (
        <Grid2X2 className="h-4 w-4" />
      )}
    </button>
  );
}
