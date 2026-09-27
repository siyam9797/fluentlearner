/** v2 How It Works page — /v2/how-it-works */
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import { useV2Content } from "@/components/home-v2/useV2Content";
import { cn } from "@/lib/utils";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import HvAccordion from "@/components/home-v2/HvAccordion";
import HvBenefits from "@/components/home-v2/HvBenefits";
import HvCTA from "@/components/home-v2/HvCTA";
import { DecorSquare, HvButton, Reveal } from "@/components/home-v2/primitives";
import { lines } from "@/components/home-v2/useV2Content";
import { V2 } from "@/components/home-v2/routes";

export default function V2HowItWorks() {
  const { t, on, list, whatsapp } = useV2Content();
  const phases = list("v2_process_phases");
  const faqs = list("v2_faq_items").filter(faq => faq.question);
  const consultHref = whatsapp("v2_process_header_message");
  const questionHref = whatsapp("v2_faq_message");

  return (
    <HvLayout>
      <SEOHead
        title={t("v2_process_seo_title")}
        description={t("v2_process_seo_description")}
        path={PAGE_SEO.home.path}
      />
      <HvPageHeader
        crumbs={[{ label: "How It Works" }]}
        title={t("v2_process_header_title")}
        description={t("v2_process_header_description")}
      >
        <HvButton href={consultHref} variant="dark" external>
          {t("v2_process_header_button")}
        </HvButton>
      </HvPageHeader>

      {/* Phases */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1262px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              {t("v2_process_label")}
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
              {t("v2_process_title")}
            </h2>
            <p className="mt-5 text-lg text-ink/75">{t("v2_process_text")}</p>
          </Reveal>

          <ol className="flex flex-col gap-4">
            {phases.map((phase, i) => (
              <li key={i}>
                <Reveal
                  delay={i * 80}
                  className={cn(
                    "grid gap-6 rounded-[var(--radius-card)] p-6 sm:grid-cols-[88px_1fr] lg:p-8",
                    i === 0 ? "bg-brand-red text-white" : "bg-sand"
                  )}
                >
                  <span className="text-[56px] font-semibold leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className={cn("text-[24px]", i === 0 && "text-white")}>
                      {phase.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-3 text-lg",
                        i === 0 ? "text-white/85" : "text-ink/75"
                      )}
                    >
                      {phase.text}
                    </p>
                    {lines(phase.includes).length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {lines(phase.includes).map(item => (
                          <li
                            key={item}
                            className={cn(
                              "rounded-full px-3 py-1 text-sm",
                              i === 0
                                ? "bg-white/15 text-white"
                                : "bg-cream text-ink/80"
                            )}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {on("v2_process_benefits_show") && <HvBenefits />}

      {/* FAQ */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto grid max-w-[1262px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              {t("v2_faq_label")}
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
              {t("v2_faq_title")}
            </h2>
            <p className="mt-5 text-lg text-ink/75">{t("v2_faq_text")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <HvButton href={questionHref} variant="dark" external>
                {t("v2_faq_button")}
              </HvButton>
              <HvButton href={V2.contact} variant="outline">
                {t("v2_faq_contact_button")}
              </HvButton>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <HvAccordion
              items={faqs.map(faq => ({
                title: faq.question,
                body: <p className="whitespace-pre-line">{faq.answer}</p>,
              }))}
            />
          </Reveal>
        </div>
      </section>

      {on("v2_process_cta_show") && <HvCTA />}
    </HvLayout>
  );
}
