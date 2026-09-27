import { Check } from "lucide-react";
import { useV2Content } from "./useV2Content";
import { HvButton, Reveal, formatCompact } from "./primitives";

export default function HvAbout() {
  const ss = useV2Content();
  const description = ss.t("v2_home_about_description");
  const reasons = ss
    .list("v2_home_about_reasons")
    .map(item => item.text)
    .filter(Boolean);
  const mentorHref = ss.whatsapp("v2_home_about_message");

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-brand-red py-20 text-white lg:py-32"
    >
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <Reveal className="flex w-full flex-col items-start md:w-[60%] md:pr-12 lg:w-1/2 lg:pr-16 xl:pr-28">
          <h2 className="text-[28px] sm:text-[32px] lg:text-4xl text-white">
            {ss.t("v2_home_about_title_before")}{" "}
            <span className="text-[36px] sm:text-[45px] lg:text-[60px] font-semibold text-white">
              {formatCompact(ss.totalScorers)}+
            </span>{" "}
            {ss.t("v2_home_about_title_after")}
          </h2>
          {description && (
            <p className="mt-5 whitespace-pre-line text-lg text-white/85">
              {description}
            </p>
          )}

          <ul className="my-10 grid w-full grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:my-14">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-white">
                  <Check
                    className="h-3.5 w-3.5"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-lg font-medium">{reason}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-6">
            <HvButton href={mentorHref} variant="inverse" external>
              {ss.t("v2_home_about_button")}
            </HvButton>
            <div>
              <p className="font-medium">{ss.founderName}</p>
              <p className="text-sm text-white/70">{ss.founderTitle}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="relative mt-12 h-[400px] w-full md:absolute md:inset-y-0 md:right-0 md:mt-0 md:h-full md:w-[40%] lg:w-1/2">
        <img
          src={ss.t("v2_home_about_image") || ss.founderPhoto}
          alt={`${ss.founderName} at the FluentLearner studio`}
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
        />
      </div>
    </section>
  );
}
