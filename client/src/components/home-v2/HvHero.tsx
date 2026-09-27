import { useState } from "react";
import { useV2Content } from "./useV2Content";
import { cn } from "@/lib/utils";
import { ArrowButton, BannerImage, HvButton } from "./primitives";
import { V2 } from "./routes";
import { useStoryCards } from "./hooks";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

const AVATAR_TONES = [
  "bg-brand-red text-white",
  "bg-ink text-white",
  "bg-sand text-ink",
];

/** A featured student's photo, falling back to their initials if the image is missing or fails to load. */
function StudentAvatar({
  name,
  src,
  tone,
  customPhoto = false,
}: {
  name: string;
  src: string | null | undefined;
  tone: string;
  /** A photo chosen in the Website editor isn't tied to this story, so don't label it with the story's name. */
  customPhoto?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const base =
    "-ml-2.5 flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full border-2 border-cream text-sm font-semibold";
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={customPhoto ? "" : name}
        title={customPhoto ? undefined : name}
        onError={() => setFailed(true)}
        className={cn(base, "bg-sand object-cover object-center")}
      />
    );
  }
  return (
    <span title={name} className={cn(base, tone)}>
      {initials(name)}
    </span>
  );
}

export default function HvHero() {
  const ss = useV2Content();
  const stories = useStoryCards();
  // CSS-only entrance so the server-rendered hero is visible before hydration.
  const enter =
    "animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both motion-reduce:animate-none";
  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <section id="home" className="relative pt-32 lg:pt-44">
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-[700px] flex-col gap-8 lg:gap-10">
            <div className="flex flex-col gap-4">
              <h1
                className={cn("text-[40px] sm:text-5xl lg:text-[60px]", enter)}
                style={delay(0)}
              >
                {ss.t("v2_home_hero_title")}
              </h1>
              <p
                className={cn("text-lg text-ink/80 max-w-[560px]", enter)}
                style={delay(100)}
              >
                {ss.t("v2_home_hero_description")}
              </p>
            </div>

            <div
              className={cn(
                "flex flex-wrap items-center gap-x-8 gap-y-5",
                enter
              )}
              style={delay(200)}
            >
              <HvButton
                href={ss.whatsapp("v2_home_hero_cta_message")}
                variant="dark"
                external
              >
                {ss.t("v2_home_hero_cta_text")}
              </HvButton>
              <div className="flex items-center gap-3">
                <div className="flex pl-2.5">
                  {stories.slice(0, 3).map((story, i) => (
                    <StudentAvatar
                      key={story.id}
                      name={story.name}
                      // A photo chosen in Website → Home → Hero wins over the story image.
                      src={
                        ss.t(`v2_home_hero_avatar_${i + 1}`) || story.imageUrl
                      }
                      customPhoto={!!ss.t(`v2_home_hero_avatar_${i + 1}`)}
                      tone={AVATAR_TONES[i % AVATAR_TONES.length]}
                    />
                  ))}
                </div>
                <p className="text-base">{ss.t("v2_home_hero_proof")}</p>
              </div>
            </div>
          </div>

          {/* Accent block — overlaps the banner image on desktop */}
          <div
            className={cn(
              "relative z-10 flex w-full flex-col gap-8 rounded-[var(--radius-card)] bg-brand-red px-6 py-8 text-white sm:px-10 lg:-mb-[120px] lg:w-[360px] lg:gap-10 lg:py-10",
              enter
            )}
            style={delay(300)}
          >
            <div className="flex flex-col gap-3">
              <div className="text-[60px] lg:text-[80px] font-semibold leading-none">
                {ss.successRate}%
              </div>
              <h2 className="text-lg text-white">
                {ss.t("v2_home_hero_card_label")}
              </h2>
            </div>
            <div className="flex items-end justify-between gap-6">
              <p className="text-white/90">{ss.t("v2_home_hero_card_text")}</p>
              <ArrowButton href={V2.stories} label="See success stories" />
            </div>
          </div>
        </div>
      </div>

      <BannerImage
        src={ss.t("v2_home_hero_image") || ss.founderPhoto}
        alt={`${ss.founderName}, ${ss.founderTitle}`}
        className="mt-14 h-[380px] sm:h-[450px] lg:mt-20 lg:h-[600px]"
      />
    </section>
  );
}
