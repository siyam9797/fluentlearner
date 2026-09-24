import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionItem = { title: string; body: ReactNode };

/** Single-open accordion; `numbered` prefixes each row with 01, 02… */
export default function HvAccordion({
  items,
  defaultOpen = 0,
  numbered,
  tone = "light",
}: {
  items: AccordionItem[];
  defaultOpen?: number | null;
  numbered?: boolean;
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();
  const dark = tone === "dark";

  return (
    <div className={cn("border-t", dark ? "border-white/15" : "border-ink/15")}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <div key={item.title} className={cn("border-b", dark ? "border-white/15" : "border-ink/15")}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center gap-5 py-6 text-left"
              >
                {numbered && (
                  <span className={cn("w-8 flex-none text-sm font-medium", dark ? "text-ash" : "text-ink/50")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <span
                  className={cn(
                    "flex-1 text-lg font-medium transition-colors sm:text-xl",
                    dark ? "text-cream" : "text-ink",
                    "group-hover:text-brand-red",
                    isOpen && "text-brand-red",
                  )}
                >
                  {item.title}
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 flex-none items-center justify-center rounded-full transition-all duration-300",
                    isOpen ? "rotate-45 bg-brand-red text-white" : dark ? "bg-white/10 text-cream" : "bg-sand text-ink",
                  )}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              className={cn("grid transition-[grid-template-rows] duration-400 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <div className={cn("pb-6 pr-14", numbered && "pl-[52px]", dark ? "text-ash" : "text-ink/75")}>{item.body}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
