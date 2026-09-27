import {
  ClipboardCheck,
  HeartHandshake,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { PillText, Reveal } from "./primitives";
import { usePillImages } from "./hooks";
import { useV2Content } from "./useV2Content";

const ICONS = [UserRound, ClipboardCheck, HeartHandshake, MessageCircle];

export default function HvBenefits() {
  const pills = usePillImages();
  const { t, list } = useV2Content();
  const benefits = list("v2_benefits_items");

  return (
    <section className="relative overflow-hidden bg-ink py-20 lg:py-32">
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <Reveal className="mb-14 max-w-[620px] lg:mb-20">
          <h2 className="text-[32px] sm:text-[38px] lg:text-[44px] text-cream">
            <PillText text={t("v2_benefits_title")} pills={pills} offset={2} />
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10 xl:gap-16">
          {benefits.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={i} delay={i * 100} className="flex flex-col gap-6">
                <Icon
                  className="h-10 w-10 text-brand-red-light"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-3">
                  <h3 className="text-[22px] text-cream">{item.title}</h3>
                  <p className="text-ash">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
