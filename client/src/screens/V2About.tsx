/** v2 About page — /v2/about */
import { Compass, Target } from "lucide-react";
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import HvNumbers from "@/components/home-v2/HvNumbers";
import HvBenefits from "@/components/home-v2/HvBenefits";
import HvCTA from "@/components/home-v2/HvCTA";
import { DecorSquare, HvButton, Reveal } from "@/components/home-v2/primitives";
import { useV2Content } from "@/components/home-v2/useV2Content";
import { V2 } from "@/components/home-v2/routes";

export default function V2About() {
  const ss = useV2Content();
  const { t, on } = ss;
  const story = t("v2_about_story_text");
  const approach = t("v2_about_story_text_2");

  return (
    <HvLayout>
      <SEOHead
        {...PAGE_SEO.about}
        path="/"
        title={t("v2_about_seo_title")}
        description={t("v2_about_seo_description")}
      />
      <HvPageHeader
        crumbs={[{ label: "About" }]}
        title={t("v2_about_header_title")}
        description={t("v2_about_header_description")}
        image={t("v2_about_header_image") || ss.founderPhoto}
        imageAlt={`${ss.founderName} at the FluentLearner studio`}
      />

      {/* Story */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto grid max-w-[1262px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              {t("v2_about_story_label")}
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
              {t("v2_about_story_title")}
            </h2>
          </Reveal>
          <Reveal
            delay={120}
            className="flex flex-col gap-6 text-lg leading-relaxed text-ink/80"
          >
            {story && <p className="whitespace-pre-line">{story}</p>}
            {approach && <p className="whitespace-pre-line">{approach}</p>}
          </Reveal>
        </div>
      </section>

      {on("v2_about_numbers_show") && (
        <div className="bg-sand">
          <HvNumbers />
        </div>
      )}

      {/* Mission & vision */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto grid max-w-[1262px] gap-4 px-5 sm:px-8 md:grid-cols-2 lg:gap-5">
          <Reveal className="flex h-full flex-col gap-10 rounded-[var(--radius-card)] bg-brand-red p-8 text-white lg:p-12">
            <Target
              className="h-10 w-10"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div>
              <h2 className="text-[28px] text-white lg:text-[32px]">
                {t("v2_about_mission_title")}
              </h2>
              <p className="mt-4 whitespace-pre-line text-lg text-white/85">
                {t("v2_about_mission")}
              </p>
            </div>
          </Reveal>
          <Reveal
            delay={120}
            className="flex h-full flex-col gap-10 rounded-[var(--radius-card)] bg-ink p-8 text-cream lg:p-12"
          >
            <Compass
              className="h-10 w-10 text-brand-red-light"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div>
              <h2 className="text-[28px] text-cream lg:text-[32px]">
                {t("v2_about_vision_title")}
              </h2>
              <p className="mt-4 whitespace-pre-line text-lg text-ash">
                {t("v2_about_vision")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Founder */}
      <section className="pb-20 lg:pb-32">
        <div className="mx-auto grid max-w-[1262px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
          <Reveal className="overflow-hidden rounded-[var(--radius-card)]">
            <img
              src={ss.founderPhoto}
              alt={`${ss.founderName}, ${ss.founderTitle}`}
              className="aspect-[4/5] w-full object-cover object-[50%_20%] sm:aspect-[4/3] lg:aspect-[4/5]"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              {t("v2_about_founder_label")}
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
              {ss.founderName}
            </h2>
            <p className="mt-2 text-lg text-brand-red">{ss.founderTitle}</p>
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink/80">
              {t("v2_founder_bio")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <HvButton href={V2.courses} variant="dark">
                {t("v2_about_founder_primary")}
              </HvButton>
              <HvButton href={V2.contact} variant="outline">
                {t("v2_about_founder_secondary")}
              </HvButton>
            </div>
          </Reveal>
        </div>
      </section>

      {on("v2_about_benefits_show") && <HvBenefits />}
      {on("v2_about_cta_show") && <HvCTA />}
    </HvLayout>
  );
}
