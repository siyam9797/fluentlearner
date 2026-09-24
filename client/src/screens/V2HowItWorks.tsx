/** v2 How It Works page — /v2/how-it-works */
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import HvAccordion from "@/components/home-v2/HvAccordion";
import HvBenefits from "@/components/home-v2/HvBenefits";
import HvCTA from "@/components/home-v2/HvCTA";
import { DecorSquare, HvButton, Reveal, formatCompact } from "@/components/home-v2/primitives";
import { getGeneralFaqs } from "@/components/home-v2/data";
import { V2 } from "@/components/home-v2/routes";

const phases = [
  {
    title: "Free consultation",
    text: "Message a mentor on WhatsApp with your current level, target band and exam date. We'll recommend the plan that fits your timeline.",
    includes: ["Level check", "Target band planning", "Course recommendation"],
  },
  {
    title: "Enroll and get your plan",
    text: "Register online in a few minutes and pay by bKash, Nagad, Rocket or bank transfer. Your study plan is built around your weakest modules.",
    includes: ["Online enrollment", "Flexible payment", "Personal study plan"],
  },
  {
    title: "Learn with one-to-one mentoring",
    text: "Work through Listening, Reading, Writing and Speaking with a mentor who knows your strengths and gaps. Miss a class? Every session is recorded.",
    includes: ["Live classes", "Class recordings", "Study materials"],
  },
  {
    title: "Practise with mock tests and feedback",
    text: "Sit exam-style mock tests and get detailed, band-descriptor based feedback. Every writing task is reviewed individually.",
    includes: ["Mock tests", "Writing reviews", "Speaking practice"],
  },
  {
    title: "Walk into the exam ready",
    text: "Go into test day knowing exactly what to expect, with WhatsApp support all the way to your results and a certificate when you complete the course.",
    includes: ["WhatsApp support", "Exam-day confidence", "Certificate of completion"],
  },
];

export default function V2HowItWorks() {
  const ss = useSiteSettings();
  const faqs = getGeneralFaqs(formatCompact(ss.totalScorers), String(ss.successRate));
  const consultHref = `https://wa.me/${ss.contactWhatsapp}?text=${encodeURIComponent("Assalamu Alaikum, I would like a free IELTS consultation.")}`;
  const questionHref = `https://wa.me/${ss.contactWhatsapp}?text=${encodeURIComponent("Assalamu Alaikum, I have a question about FluentLearner courses.")}`;

  return (
    <HvLayout>
      <SEOHead
        title="How It Works | FluentLearner"
        description="From a free consultation to exam day — see how FluentLearner's one-to-one IELTS mentoring works, step by step."
        path={PAGE_SEO.home.path}
      />
      <HvPageHeader
        crumbs={[{ label: "How It Works" }]}
        title="A clear path from first class to exam day"
        description="Five simple stages, one mentor beside you the whole way. Here's exactly what happens after you reach out."
      >
        <HvButton href={consultHref} variant="dark" external>Book a Free Consultation</HvButton>
      </HvPageHeader>

      {/* Phases */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1230px] gap-12 px-4 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              The process
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">What to expect, stage by stage</h2>
            <p className="mt-5 text-lg text-ink/75">
              Every stage is guided by your mentor, and your plan is adjusted as your mock test scores improve.
            </p>
          </Reveal>

          <ol className="flex flex-col gap-4">
            {phases.map((phase, i) => (
              <li key={phase.title}>
                <Reveal
                  delay={i * 80}
                  className={cn(
                    "grid gap-6 rounded-[5px] p-6 sm:grid-cols-[88px_1fr] lg:p-8",
                    i === 0 ? "bg-brand-red text-white" : "bg-sand",
                  )}
                >
                  <span className="text-[56px] font-semibold leading-none">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className={cn("text-[24px]", i === 0 && "text-white")}>{phase.title}</h3>
                    <p className={cn("mt-3 text-lg", i === 0 ? "text-white/85" : "text-ink/75")}>{phase.text}</p>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {phase.includes.map(item => (
                        <li
                          key={item}
                          className={cn(
                            "rounded-full px-3 py-1 text-sm",
                            i === 0 ? "bg-white/15 text-white" : "bg-cream text-ink/80",
                          )}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <HvBenefits />

      {/* FAQ */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto grid max-w-[1230px] gap-12 px-4 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              FAQ
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">Questions students ask us most</h2>
            <p className="mt-5 text-lg text-ink/75">Can't find your answer? Our team replies on WhatsApp within minutes.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <HvButton href={questionHref} variant="dark" external>Ask a Question</HvButton>
              <HvButton href={V2.contact} variant="outline">Contact Page</HvButton>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <HvAccordion items={faqs.map(faq => ({ title: faq.question, body: <p>{faq.answer}</p> }))} />
          </Reveal>
        </div>
      </section>

      <HvCTA />
    </HvLayout>
  );
}
