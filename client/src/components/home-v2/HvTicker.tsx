import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { DecorSquare, Reveal } from "./primitives";
import type { V2ListItem } from "./content";
import { useV2Content } from "./useV2Content";

const initials = (name: string) =>
  name
    .replace(/^(dr|md|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");

function AchievementCard({
  item,
  hidden,
}: {
  item: V2ListItem;
  hidden?: boolean;
}) {
  const highlight = /^(yes|y|true|1)$/i.test((item.highlight ?? "").trim());
  const muted = highlight ? "text-white/80" : "text-ink/60";
  return (
    <li
      aria-hidden={hidden || undefined}
      className={cn(
        "mr-4 flex w-[260px] shrink-0 flex-col justify-between gap-8 rounded-[var(--radius-card)] p-5 sm:w-[300px] lg:mr-5 lg:p-6",
        highlight ? "bg-brand-red text-white" : "bg-sand"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            highlight ? "bg-white text-brand-red" : "bg-ink text-cream"
          )}
        >
          {initials(item.name)}
        </span>
        <div className="min-w-0">
          <h3
            className={cn(
              "truncate text-base font-medium",
              highlight && "text-white"
            )}
          >
            {item.name}
          </h3>
          <p className={cn("text-sm", muted)}>IELTS {item.module}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <span className={cn("text-sm", muted)}>Band score</span>
        <span className="text-[48px] font-semibold leading-none lg:text-[56px]">
          {item.band}
        </span>
      </div>
    </li>
  );
}

/** One scrolling row; the items are rendered twice and slide by half the track, so the loop is seamless. */
function TickerRow({
  items,
  reverse,
}: {
  items: V2ListItem[];
  reverse?: boolean;
}) {
  return (
    <div className="hv-ticker overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <ul
        className={cn(
          "hv-ticker-track flex w-max",
          reverse && "hv-ticker-reverse"
        )}
        style={
          { "--hv-ticker-duration": `${items.length * 6}s` } as CSSProperties
        }
      >
        {[...items, ...items].map((item, i) => (
          <AchievementCard key={i} item={item} hidden={i >= items.length} />
        ))}
      </ul>
    </div>
  );
}

/** Recent student scores in two rows scrolling opposite ways; each row pauses on hover. */
export default function HvTicker() {
  const ss = useV2Content();
  const items = ss.list("v2_home_ticker_items").filter(item => item.name);
  if (!items.length) return null;

  // Alternate items between the rows; a short list stays on one row.
  const rows =
    items.length < 8
      ? [items]
      : [
          items.filter((_, i) => i % 2 === 0),
          items.filter((_, i) => i % 2 === 1),
        ];

  return (
    <section className="py-20 lg:py-32">
      <Reveal className="mx-auto mb-12 flex max-w-[760px] flex-col items-center gap-5 px-5 text-center sm:px-8 lg:mb-16">
        <span className="flex items-center gap-2 text-base">
          <DecorSquare />
          {ss.t("v2_home_ticker_label")}
        </span>
        <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
          {ss.t("v2_home_ticker_title")}
        </h2>
        {ss.t("v2_home_ticker_description") && (
          <p className="text-lg">{ss.t("v2_home_ticker_description")}</p>
        )}
      </Reveal>

      <div className="flex flex-col gap-4 lg:gap-5">
        {rows.map((row, i) => (
          <TickerRow key={i} items={row} reverse={i === 1} />
        ))}
      </div>
    </section>
  );
}
