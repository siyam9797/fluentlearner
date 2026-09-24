import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";
import { ArrowButton, BannerImage, HvButton, formatCompact } from "./primitives";
import { V2 } from "./routes";
import { useStoryCards } from "./hooks";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

const AVATAR_TONES = ["bg-brand-red text-white", "bg-ink text-white", "bg-sand text-ink"];

export default function HvHero() {
  const ss = useSiteSettings();
  const stories = useStoryCards();
  // CSS-only entrance so the server-rendered hero is visible before hydration.
  const enter = "animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both motion-reduce:animate-none";
  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <section id="home" className="relative pt-32 lg:pt-44">
      <div className="mx-auto max-w-[1230px] px-4">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-[700px] flex-col gap-8 lg:gap-10">
            <div className="flex flex-col gap-4">
              <h1 className={cn("text-[40px] sm:text-5xl lg:text-[60px]", enter)} style={delay(0)}>
                {ss.heroTitle}
              </h1>
              <p className={cn("text-lg text-ink/80 max-w-[560px]", enter)} style={delay(100)}>{ss.heroDescription}</p>
            </div>

            <div className={cn("flex flex-wrap items-center gap-x-8 gap-y-5", enter)} style={delay(200)}>
              <HvButton href={ss.heroCtaLink} variant="dark">{ss.heroCtaText}</HvButton>
              <div className="flex items-center gap-3">
                <div className="flex pl-2.5">
                  {stories.slice(0, 3).map((story, i) => (
                    <span
                      key={story.id}
                      title={story.name}
                      className={cn(
                        "-ml-2.5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream text-sm font-semibold",
                        AVATAR_TONES[i % AVATAR_TONES.length],
                      )}
                    >
                      {initials(story.name)}
                    </span>
                  ))}
                </div>
                <p className="text-base">{formatCompact(ss.totalScorers)}+ successful scorers</p>
              </div>
            </div>
          </div>

          {/* Accent block — overlaps the banner image on desktop */}
          <div
            className={cn(
              "relative z-10 flex w-full flex-col gap-8 bg-brand-red px-6 py-8 text-white sm:px-10 lg:-mb-[120px] lg:w-[360px] lg:gap-10 lg:py-10",
              enter,
            )}
            style={delay(300)}
          >
            <div className="flex flex-col gap-3">
              <div className="text-[60px] lg:text-[80px] font-semibold leading-none">{ss.successRate}%</div>
              <h2 className="text-lg text-white">Success rate</h2>
            </div>
            <div className="flex items-end justify-between gap-6">
              <p className="text-white/90">
                Join {formatCompact(ss.totalScorers)}+ students who reached their target band with us
              </p>
              <ArrowButton href={V2.stories} label="See success stories" />
            </div>
          </div>
        </div>
      </div>

      <BannerImage
        src={ss.heroImage || ss.founderPhoto}
        alt={`${ss.founderName}, ${ss.founderTitle}`}
        className="mt-14 h-[380px] sm:h-[450px] lg:mt-20 lg:h-[600px]"
      />
    </section>
  );
}
