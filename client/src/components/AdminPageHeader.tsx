"use client";

import { ReactNode } from "react";
import { Link } from "@/lib/router";

export default function AdminPageHeader({ title, action, parent }: { title: string; description?: string; action?: ReactNode; parent?: { label: string; href: string } }) {
  return <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="font-display text-[34px] font-bold tracking-[-0.03em] text-[#252a30]">{title}</h1>
      <nav aria-label="Breadcrumb" className="mt-2 flex items-center gap-2 text-sm text-[#555d66]">
        <Link href="/admin" className="transition-colors hover:text-[#c76f42]">Dashboard</Link>
        <span aria-hidden="true" className="text-[#9ba0a6]">›</span>
        {parent && <>
          <Link href={parent.href} className="transition-colors hover:text-[#c76f42]">{parent.label}</Link>
          <span aria-hidden="true" className="text-[#9ba0a6]">›</span>
        </>}
        <span aria-current="page">{title}</span>
      </nav>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </header>;
}
