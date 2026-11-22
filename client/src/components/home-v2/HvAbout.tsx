import { Check, Quote } from "lucide-react";
import { useV2Content } from "./useV2Content";
import { HvButton, Reveal, formatCompact } from "./primitives";
import { responsiveImage, optimizedSrc } from "@/lib/image";

export default function HvAbout() {
  const ss = useV2Content();
  const label = ss.t("v2_home_about_label");
  const description = ss.t("v2_home_about_description");
  const tagline = ss.t("v2_home_about_tagline");
  const quote = ss.t("v2_home_about_quote").trim().replace(/^["“]|["”]$/g, "");
  const quoteBy = ss.t("v2_home_about_quote_by");
  const stats = ss
    .list("v2_home_about_stats")
    .filter(item => item.value || item.label)
    .slice(0, 4);
  const reasons = ss
    .list("v2_home_about_reasons")
    .map(item => item.text)
    .filter(Boolean);
  const mentorHref = ss.whatsapp("v2_home_about_message");
  const photo = ss.t("v2_home_about_image") || ss.founderPhoto;

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-brand-red text-white"
    >
      {/* Soft light from the top left so the red isn't one flat block. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1262px] grid-cols-1 gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1fr_40%] lg:grid-cols-2 lg:gap-16 lg:py-28">
        <Reveal className="flex flex-col items-start justify-center">
          {label && (
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-1.5 text-sm text-white/85">
              <span
                className="h-1.5 w-1.5 rounded-full bg-white"
                aria-hidden="true"
              />
              {label}
            </span>
          )}

          <h2 className="text-[30px] leading-[1.1] text-white sm:text-[36px] lg:text-[44px]">
            {ss.t("v2_home_about_title_before")}{" "}
            <span className="font-semibold">
              {formatCompact(ss.totalScorers)}+
            </span>{" "}
            {ss.t("v2_home_about_title_after")}
          </h2>

          {description && (
            <p className="mt-6 max-w-[560px] whitespace-pre-line text-lg leading-relaxed text-white/80">
              {description}
            </p>
          )}
          {tagline && (
            <p className="mt-5 border-l-2 border-white/60 pl-4 text-lg font-medium text-white">
              {tagline}
            </p>
          )}

          {stats.length > 0 && (
            <dl className="mt-10 grid w-full grid-cols-3 divide-x divide-white/20 border-y border-white/20">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 py-5 pl-4 first:pl-0 sm:pl-6"
                >
                  <dt className="order-2 text-sm text-white/70">
                    {stat.label}
                  </dt>
                  <dd className="order-1 text-[26px] font-semibold leading-none sm:text-[34px]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {reasons.length > 0 && (
            <ul className="mt-10 grid w-full grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-brand-red">
                    <Check
                      className="h-3.5 w-3.5"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-base font-medium sm:text-lg">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-5">
            <HvButton href={mentorHref} variant="inverse" external>
              {ss.t("v2_home_about_button")}
            </HvButton>
            <div className="flex items-center gap-3">
              {ss.founderPhoto && (
                <img
                  src={optimizedSrc(ss.founderPhoto, 96)}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover object-top ring-2 ring-white/40"
                />
              )}
              <div>
                <p className="font-medium">{ss.founderName}</p>
                <p className="text-sm text-white/70">{ss.founderTitle}</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Mobile: photo, then the quote below it. md+: quote floats over the photo's lower edge. */}
        <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-ink shadow-[0_24px_60px_rgba(0,0,0,0.25)] md:min-h-[560px]">
          <div className="relative aspect-[4/5] bg-sand sm:aspect-[4/3] md:absolute md:inset-0 md:aspect-auto">
            {!ss.isLoading && (
              <img
                {...responsiveImage(
                  photo,
                  "(min-width: 1024px) 600px, (min-width: 768px) 40vw, 100vw"
                )}
                loading="lazy"
                alt={`${ss.founderName} at the FluentLearner studio`}
                className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 hidden h-2/3 bg-gradient-to-t from-black/60 to-transparent md:block"
            />
          </div>
          {quote && (
            <figure className="relative p-6 text-white md:absolute md:inset-x-6 md:bottom-6 md:rounded-[var(--radius-card)] md:bg-ink/80 md:backdrop-blur-md lg:inset-x-8 lg:bottom-8 lg:p-8">
              <Quote
                className="mb-3 h-7 w-7 fill-brand-red text-brand-red"
                aria-hidden="true"
              />
              <blockquote className="text-base leading-relaxed text-white/90 lg:text-lg">
                {quote}
              </blockquote>
              {quoteBy && (
                <figcaption className="mt-4 text-sm font-medium text-white/70">
                  — {quoteBy}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
