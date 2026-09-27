import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DecorSquare } from "./primitives";
import { useStoryCards } from "./hooks";
import { FALLBACK_STORIES } from "./data";
import { useV2Content } from "./useV2Content";

export default function HvTestimonials() {
  const { t } = useV2Content();
  const fromDb = useStoryCards().filter(story => story.quote);
  const slides = fromDb.length
    ? fromDb
    : FALLBACK_STORIES.filter(story => story.quote);
  const [index, setIndex] = useState(0);
  const count = slides.length;
  if (!count) return null;

  const current = slides[index % count];
  const go = (step: number) => setIndex(i => (i + step + count) % count);

  return (
    <section
      className="bg-ink py-20 lg:py-32"
      aria-roledescription="carousel"
      aria-label="Student testimonials"
    >
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <div className="flex flex-col-reverse gap-10 md:flex-row md:items-stretch md:gap-12 lg:gap-20">
          <div className="flex flex-1 flex-col justify-between gap-10">
            <div className="flex items-center gap-2">
              <DecorSquare />
              <h2 className="text-lg text-cream">
                {t("v2_testimonials_label")}
              </h2>
            </div>

            <div
              key={current.id}
              className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
              aria-live="polite"
            >
              <p className="text-[22px] sm:text-[28px] lg:text-[32px] font-medium leading-[1.2] text-cream">
                “{current.quote}”
              </p>
              <p className="text-lg font-medium text-cream">
                <em>
                  — {current.name}
                  {current.band ? `, Band ${current.band}` : ""}
                </em>
              </p>
            </div>

            {count > 1 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red text-white transition-colors hover:bg-cream hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red text-white transition-colors hover:bg-cream hover:text-ink"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <span className="ml-3 text-sm text-ash">
                  {String((index % count) + 1).padStart(2, "0")} /{" "}
                  {String(count).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>

          <div className="relative h-[350px] w-full md:h-[480px] md:w-1/2 lg:h-[550px]">
            {slides.map((slide, i) => (
              <img
                key={slide.id}
                src={slide.imageUrl}
                alt={i === index % count ? `${slide.name}'s IELTS result` : ""}
                loading="lazy"
                className={cn(
                  "absolute inset-0 h-full w-full rounded-[var(--radius-card)] object-cover object-[50%_30%] transition-opacity duration-500",
                  i === index % count ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
