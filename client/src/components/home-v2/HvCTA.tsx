import { cn } from "@/lib/utils";
import { HvButton, Reveal } from "./primitives";
import { useStoryCardsState, useUpcomingBatches } from "./hooks";
import { V2 } from "./routes";
import { FALLBACK_STORIES } from "./data";
import { useV2Content } from "./useV2Content";
import { optimizedSrc } from "@/lib/image";

// Fan layout for the photo strip: [rotation, vertical offset]
const FAN: [number, number][] = [
  [-10, 24],
  [-6, 10],
  [-3, 2],
  [0, 0],
  [3, 2],
  [6, 10],
  [10, 24],
];

export default function HvCTA() {
  const ss = useV2Content();
  const { stories, ready } = useStoryCardsState();
  const next =
    useUpcomingBatches().find(
      (batch): batch is typeof batch & { date: Date } => batch.date !== null
    ) ?? null;

  // Always fill the strip with seven photos, topping up from the bundled results.
  const photos = (ready ? [...stories, ...FALLBACK_STORIES] : [])
    .map(story => story.imageUrl)
    .filter((src, i, all) => all.indexOf(src) === i)
    .slice(0, FAN.length);

  const seatsLeft = next?.seatsLeft ?? 0;
  const whatsappHref = ss.whatsapp("v2_cta_whatsapp_message");
  const description = ss.t("v2_cta_description");

  return (
    <section className="overflow-hidden bg-cream py-20 lg:py-32">
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <div
          className="flex items-center justify-center gap-1.5"
          aria-hidden="true"
        >
          {(ready ? photos : FAN.map(() => "")).map((src, i) => {
            const className = cn(
              "h-[110px] w-[80px] flex-none rounded-[3px] bg-sand object-cover shadow-[0_3px_8px_rgba(31,31,31,0.2)] sm:h-[150px] sm:w-[120px]",
              (i === 0 || i === FAN.length - 1) && "hidden sm:block"
            );
            const style = {
              transform: `rotate(${FAN[i][0]}deg) translateY(${FAN[i][1]}px)`,
            };
            return src ? (
              <img
                key={src}
                src={optimizedSrc(src, 256)}
                alt=""
                loading="lazy"
                className={className}
                style={style}
              />
            ) : (
              <div key={i} className={className} style={style} />
            );
          })}
        </div>

        <Reveal className="mt-16 flex flex-col items-center gap-8 text-center lg:mt-20">
          <div className="flex max-w-[680px] flex-col items-center gap-4">
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
              {ss.t("v2_cta_title")}
            </h2>
            {description && <p className="text-lg">{description}</p>}
            {next && ss.on("v2_cta_show_batch") && (
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-4 py-1.5 text-sm font-medium text-brand-red">
                <span
                  className="h-2 w-2 rounded-full bg-brand-red animate-pulse"
                  aria-hidden="true"
                />
                Next batch starts{" "}
                {next.date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
                {seatsLeft > 0 && ` · ${seatsLeft} seats left`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <HvButton href={V2.enroll()} variant="dark">
              {ss.t("v2_cta_enroll_text")}
            </HvButton>
            <HvButton href={whatsappHref} variant="outline" external>
              {ss.t("v2_cta_whatsapp_text")}
            </HvButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
