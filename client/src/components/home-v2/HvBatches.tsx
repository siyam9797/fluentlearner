import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { DecorSquare, HvButton, Reveal } from "./primitives";
import { useCourseCards, useUpcomingBatches } from "./hooks";
import { V2 } from "./routes";
import { useV2Content } from "./useV2Content";

const DAY = 24 * 60 * 60 * 1000;

function startsIn(date: Date | null) {
  if (!date) return "Date coming soon";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / DAY);
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

/** Home section listing every upcoming batch with seats left; renders nothing when there are none. */
export default function HvBatches() {
  const { t } = useV2Content();
  const batches = useUpcomingBatches();
  const courses = useCourseCards();
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  // Which arrows can move: re-checked on scroll, resize and when the batch list changes.
  const updateEdges = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  }, []);
  useEffect(() => {
    updateEdges();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges, batches.length]);

  if (batches.length === 0) return null;

  // Move by one card (card width + gap), so a card is never left half-shown.
  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: "smooth",
    });
  };

  const description = t("v2_home_batches_description");

  return (
    <section id="batches" className="pb-20 lg:pb-32">
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <Reveal className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mb-14">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-2 text-base">
              <DecorSquare />
              {t("v2_home_batches_label")}
            </span>
            <h2 className="max-w-[640px] text-[32px] sm:text-[38px] lg:text-[44px]">
              {t("v2_home_batches_title")}
            </h2>
            {description && (
              <p className="max-w-[640px] text-lg">{description}</p>
            )}
          </div>
          {batches.length > 1 && (
            <div className="flex shrink-0 items-center gap-3">
              {([-1, 1] as const).map(direction => {
                const disabled = direction < 0 ? edges.start : edges.end;
                const Icon = direction < 0 ? ArrowLeft : ArrowRight;
                return (
                  <button
                    key={direction}
                    type="button"
                    onClick={() => scroll(direction)}
                    disabled={disabled}
                    aria-controls="batches-track"
                    aria-label={
                      direction < 0 ? "Previous batches" : "Next batches"
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/30"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}
        </Reveal>
      </div>

      {/* Full-width row so later cards run to the screen edge; side padding lines the first card up with the heading. */}
      <div
        id="batches-track"
        ref={track}
        onScroll={updateEdges}
        aria-label="Upcoming batches"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [--gutter:1.25rem] [--edge:calc(max(0px,(100%-1262px)/2)+var(--gutter))] [padding-inline:var(--edge)] [scroll-padding-inline:var(--edge)] [scrollbar-width:none] sm:[--gutter:2rem] lg:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {batches.map((batch, i) => {
          const course = courses.find(item => item.id === batch.courseId);
          const filled =
            batch.capacity > 0
              ? Math.min(100, (batch.enrolled / batch.capacity) * 100)
              : 0;
          return (
            <Reveal
              key={batch.id}
              delay={(i % 3) * 120}
              className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
            >
              <article
                className={cn(
                  "flex h-full flex-col gap-6 rounded-[var(--radius-card)] p-6",
                  i === 0 ? "bg-ink text-cream" : "bg-sand"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
                      i === 0
                        ? "bg-brand-red text-white"
                        : "bg-brand-red/10 text-brand-red"
                    )}
                  >
                    {i === 0 && (
                      <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
                        aria-hidden="true"
                      />
                    )}
                    {startsIn(batch.date)}
                  </span>
                  {course && (
                    <span
                      className={cn(
                        "truncate text-sm",
                        i === 0 ? "text-cream/70" : "text-ink/70"
                      )}
                    >
                      {course.label}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h3
                    className={cn(
                      "text-2xl lg:text-[28px]",
                      i === 0 && "text-cream"
                    )}
                  >
                    {batch.name}
                  </h3>
                  {course && (
                    <p className={i === 0 ? "text-cream/80" : "text-ink/70"}>
                      {course.title}
                    </p>
                  )}
                </div>

                <div
                  className={cn(
                    "mt-auto flex flex-col gap-3 text-sm",
                    i === 0 ? "text-cream/80" : "text-ink/70"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {batch.date
                      ? batch.date.toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Start date to be announced"}
                  </span>
                  {batch.capacity > 0 && (
                    <>
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {batch.seatsLeft === 1
                          ? "Last seat left"
                          : `${batch.seatsLeft} of ${batch.capacity} seats left`}
                      </span>
                      <span
                        className={cn(
                          "h-1.5 overflow-hidden rounded-full",
                          i === 0 ? "bg-cream/15" : "bg-ink/10"
                        )}
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-brand-red"
                          style={{ width: `${filled}%` }}
                        />
                      </span>
                    </>
                  )}
                </div>

                <HvButton
                  href={V2.enroll(batch.courseId ?? undefined)}
                  variant={i === 0 ? "red" : "dark"}
                  className="w-full"
                >
                  {t("v2_home_batches_button")}
                </HvButton>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
