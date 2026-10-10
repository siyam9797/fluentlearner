/** v2 Success Stories page — /success-stories */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import { useV2Content } from "@/components/home-v2/useV2Content";
import { cn } from "@/lib/utils";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import HvTestimonials from "@/components/home-v2/HvTestimonials";
import HvCTA from "@/components/home-v2/HvCTA";
import {
  ArrowButton,
  Reveal,
  formatCompact,
} from "@/components/home-v2/primitives";
import { useAllStoryCards } from "@/components/home-v2/hooks";
import {
  STORY_CATEGORY_LABELS,
  type StoryCard,
} from "@/components/home-v2/data";

function Lightbox({
  stories,
  index,
  onClose,
  onMove,
}: {
  stories: StoryCard[];
  index: number;
  onClose: () => void;
  onMove: (step: number) => void;
}) {
  const story = stories[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onMove(-1);
      if (e.key === "ArrowRight") onMove(1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onMove]);

  const navButton =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-red";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name}'s result`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-[1000px] flex-col gap-6 md:flex-row md:items-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={story.imageUrl}
          alt={`${story.name}'s IELTS result`}
          className="max-h-[70vh] w-full rounded-[var(--radius-card)] object-contain md:w-3/5"
        />
        <div className="flex flex-col gap-4 text-cream md:w-2/5">
          {story.band && (
            <p className="text-[56px] font-semibold leading-none">
              {story.band}
            </p>
          )}
          <h2 className="text-2xl text-cream">{story.name}</h2>
          {story.detail && <p className="text-ash">{story.detail}</p>}
          {story.quote && (
            <p className="text-lg leading-relaxed text-cream/90">
              “{story.quote}”
            </p>
          )}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className={navButton}
              onClick={() => onMove(-1)}
              aria-label="Previous story"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={navButton}
              onClick={() => onMove(1)}
              aria-label="Next story"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <span className="ml-2 text-sm text-ash">
              {index + 1} / {stories.length}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          autoFocus
          className="absolute -top-2 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-brand-red hover:text-white md:-right-2 md:-top-14"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function V2SuccessStories() {
  const ss = useV2Content();
  const { t, on } = ss;
  const stories = useAllStoryCards();
  const [filter, setFilter] = useState("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(stories.map(story => story.category ?? "other"))),
    [stories]
  );
  const visible =
    filter === "all"
      ? stories
      : stories.filter(story => (story.category ?? "other") === filter);

  return (
    <HvLayout>
      <SEOHead
        {...PAGE_SEO.successStories}
        title={t("v2_stories_seo_title")}
        description={t("v2_stories_seo_description")}
      />
      <HvPageHeader
        crumbs={[{ label: "Success Stories" }]}
        title={t("v2_stories_header_title")}
        description={t("v2_stories_header_description")}
      >
        <dl className="grid w-full grid-cols-3 gap-4 border-t border-ink/15 pt-6">
          {[
            {
              value: `${formatCompact(ss.totalScorers)}+`,
              label: t("v2_stories_stat_scorers"),
            },
            { value: `${ss.successRate}%`, label: t("v2_stories_stat_rate") },
            { value: ss.avgBandScore, label: t("v2_stories_stat_band") },
          ].map(stat => (
            <div key={stat.label}>
              <dd className="text-[28px] font-semibold leading-none lg:text-[36px]">
                {stat.value}
              </dd>
              <dt className="mt-2 text-sm text-ink/60">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </HvPageHeader>

      <section className="pb-20 pt-12 lg:pb-32 lg:pt-16">
        <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
          {categories.length > 1 && (
            <div
              className="mb-10 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter stories"
            >
              {["all", ...categories].map(key => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
                    filter === key
                      ? "border-ink bg-ink text-white"
                      : "border-ink/20 hover:border-ink"
                  )}
                >
                  {key === "all"
                    ? t("v2_stories_filter_all")
                    : (STORY_CATEGORY_LABELS[key] ?? key)}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((story, i) => (
              <Reveal key={story.id} delay={(i % 3) * 100}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className="group block w-full text-left"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-sand">
                    <img
                      src={story.imageUrl}
                      alt={`${story.name}'s result`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {story.band && (
                      <span className="absolute left-3 top-3 rounded-[4px] bg-ink px-3 py-1.5 text-sm font-semibold text-white">
                        Band {story.band}
                      </span>
                    )}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <h2 className="truncate text-[22px] transition-colors group-hover:text-brand-red">
                        {story.name}
                      </h2>
                      <p className="mt-1 truncate text-ink/70">
                        {[
                          story.detail,
                          story.category &&
                            STORY_CATEGORY_LABELS[story.category],
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <ArrowButton />
                  </div>
                </button>
              </Reveal>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="py-20 text-center text-lg text-ink/60">
              {t("v2_stories_empty")}
            </p>
          )}
        </div>
      </section>

      {on("v2_stories_testimonials_show") && <HvTestimonials />}
      {on("v2_stories_cta_show") && <HvCTA />}

      {openIndex !== null && visible[openIndex] && (
        <Lightbox
          stories={visible}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onMove={step =>
            setOpenIndex(i =>
              i === null ? i : (i + step + visible.length) % visible.length
            )
          }
        />
      )}
    </HvLayout>
  );
}
