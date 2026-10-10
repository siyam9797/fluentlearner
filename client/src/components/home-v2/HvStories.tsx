import { Link } from "@/lib/router";
import { HvButton, Reveal } from "./primitives";
import { V2 } from "./routes";
import { useStoryCards } from "./hooks";
import { FALLBACK_STORIES } from "./data";
import { useV2Content } from "./useV2Content";

const GRID_SIZE = 6;

/** Grid of result photos: two columns on phones, three from desktop. */
export default function HvStories() {
  const { t } = useV2Content();
  const featured = useStoryCards();
  // Top up from the bundled results so the grid is always full.
  const stories = [...featured, ...FALLBACK_STORIES]
    .filter(
      (story, i, all) =>
        all.findIndex(other => other.imageUrl === story.imageUrl) === i
    )
    .slice(0, GRID_SIZE);

  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <Reveal className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mb-14">
          <div className="flex max-w-[640px] flex-col gap-4">
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
              {t("v2_home_stories_title")}
            </h2>
            {t("v2_home_stories_description") && (
              <p className="text-lg">{t("v2_home_stories_description")}</p>
            )}
          </div>
          <HvButton
            href={V2.stories}
            variant="outline"
            className="shrink-0 self-start sm:self-auto"
          >
            {t("v2_home_stories_button")}
          </HvButton>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {stories.map((story, i) => (
            <Reveal key={story.id} delay={(i % 3) * 100}>
              <Link
                href={V2.stories}
                className="group relative block aspect-square overflow-hidden rounded-[var(--radius-card)] bg-sand"
              >
                <img
                  src={story.imageUrl}
                  alt={`${story.name}'s IELTS result${story.band ? `, band ${story.band}` : ""}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {story.band && (
                  <span className="absolute left-2.5 top-2.5 rounded-[var(--radius-control)] bg-brand-red px-2.5 py-1 text-sm font-semibold text-white sm:left-4 sm:top-4 sm:px-3 sm:text-base">
                    {story.band}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end bg-gradient-to-t from-ink/80 to-transparent p-3 pt-12 text-sm font-medium text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:p-5 sm:pt-16 sm:text-lg">
                  {story.name}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
