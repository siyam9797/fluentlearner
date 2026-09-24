/** v2 About page — /v2/about */
import { Compass, Target } from "lucide-react";
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import HvNumbers from "@/components/home-v2/HvNumbers";
import HvBenefits from "@/components/home-v2/HvBenefits";
import HvCTA from "@/components/home-v2/HvCTA";
import { DecorSquare, HvButton, Reveal, formatCompact } from "@/components/home-v2/primitives";
import { V2 } from "@/components/home-v2/routes";

export default function V2About() {
  const ss = useSiteSettings();
  const story =
    ss.aboutDescription ||
    `Founded by ${ss.founderName}, FluentLearner has grown into one of Bangladesh's most trusted IELTS coaching platforms. Our mission is simple — to turn every student's dream of studying or working abroad into reality through world-class preparation and unwavering support.`;
  const approach = `With ${formatCompact(ss.totalScorers)}+ successful scorers and a ${ss.successRate}% success rate, we believe personal attention beats crowded classrooms. Every student gets one-to-one mentoring that targets their own strengths and weaknesses, backed by mock tests, detailed writing reviews and support right up to exam day.`;
  const mission =
    ss.aboutMission ||
    "To make expert IELTS and English coaching accessible to every student in Bangladesh, with personal mentoring that turns effort into measurable band scores.";
  const vision =
    ss.aboutVision ||
    "A generation of confident English speakers who can study, work and build their future anywhere in the world.";
  const bio =
    ss.founderBio ||
    `${ss.founderName} leads every FluentLearner programme personally. Years of one-to-one mentoring have shaped a teaching method that is practical, structured and focused on what actually moves a band score.`;

  return (
    <HvLayout>
      <SEOHead {...PAGE_SEO.about} path="/" />
      <HvPageHeader
        crumbs={[{ label: "About" }]}
        title="Where ambition meets real results"
        description="FluentLearner is a mentoring-first IELTS and spoken English school — built on personal attention, honest feedback and verified results."
        image={ss.aboutImage || ss.founderPhoto}
        imageAlt={`${ss.founderName} at the FluentLearner studio`}
      />

      {/* Story */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto grid max-w-[1230px] gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              Our story
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">More than a coaching centre</h2>
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-6 text-lg leading-relaxed text-ink/80">
            <p className="whitespace-pre-line">{story}</p>
            {!ss.aboutDescription && <p>{approach}</p>}
          </Reveal>
        </div>
      </section>

      <div className="bg-sand">
        <HvNumbers />
      </div>

      {/* Mission & vision */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto grid max-w-[1230px] gap-4 px-4 md:grid-cols-2 lg:gap-5">
          <Reveal className="flex h-full flex-col gap-10 rounded-[5px] bg-brand-red p-8 text-white lg:p-12">
            <Target className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2 className="text-[28px] text-white lg:text-[32px]">Our mission</h2>
              <p className="mt-4 text-lg text-white/85">{mission}</p>
            </div>
          </Reveal>
          <Reveal delay={120} className="flex h-full flex-col gap-10 rounded-[5px] bg-ink p-8 text-cream lg:p-12">
            <Compass className="h-10 w-10 text-brand-red-light" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2 className="text-[28px] text-cream lg:text-[32px]">Our vision</h2>
              <p className="mt-4 text-lg text-ash">{vision}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Founder */}
      <section className="pb-20 lg:pb-32">
        <div className="mx-auto grid max-w-[1230px] items-center gap-10 px-4 lg:grid-cols-2 lg:gap-20">
          <Reveal className="overflow-hidden rounded-[5px]">
            <img
              src={ss.founderPhoto}
              alt={`${ss.founderName}, ${ss.founderTitle}`}
              className="aspect-[4/5] w-full object-cover object-[50%_20%] sm:aspect-[4/3] lg:aspect-[4/5]"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="mb-4 flex items-center gap-2 text-lg">
              <DecorSquare />
              Meet the founder
            </p>
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">{ss.founderName}</h2>
            <p className="mt-2 text-lg text-brand-red">{ss.founderTitle}</p>
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink/80">{bio}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <HvButton href={V2.courses} variant="dark">Explore Courses</HvButton>
              <HvButton href={V2.contact} variant="outline">Contact Us</HvButton>
            </div>
          </Reveal>
        </div>
      </section>

      <HvBenefits />
      <HvCTA />
    </HvLayout>
  );
}
