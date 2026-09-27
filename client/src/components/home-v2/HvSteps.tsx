import {
  CalendarCheck,
  ClipboardList,
  Headphones,
  Mic,
  PenLine,
  Target,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IconRow } from "./HvNumbers";
import { PillText, Reveal } from "./primitives";
import { usePillImages } from "./hooks";
import { useV2Content } from "./useV2Content";

export default function HvSteps() {
  const pills = usePillImages();
  const { t, list } = useV2Content();
  const steps = list("v2_home_steps_items");

  return (
    <section id="process" className="bg-cream pb-20 lg:pb-32">
      <div className="mx-auto flex max-w-[1270px] flex-col items-center gap-14 px-5 sm:px-8 lg:gap-20 lg:px-10">
        <Reveal className="flex max-w-[760px] flex-col items-center gap-8 text-center">
          <IconRow
            icons={[
              ClipboardList,
              Headphones,
              PenLine,
              Target,
              Mic,
              CalendarCheck,
              Trophy,
            ]}
          />
          <h2 className="text-[28px] sm:text-[32px] lg:text-4xl">
            <PillText
              text={t("v2_home_steps_title")}
              pills={pills}
              offset={3}
            />
          </h2>
        </Reveal>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
          {steps.map((step, i) => (
            <Reveal
              key={i}
              delay={i * 150}
              className={cn(i === 1 && "md:mt-36")}
            >
              <div
                className={cn(
                  "relative flex min-h-[280px] flex-col justify-between gap-12 rounded-[var(--radius-card)] p-6 lg:min-h-[320px] lg:p-8",
                  i === 0 ? "bg-brand-red text-white" : "bg-sand"
                )}
              >
                <div className="text-[60px] lg:text-[80px] font-semibold leading-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className={cn("text-[22px]", i === 0 && "text-white")}>
                    {step.title}
                  </h3>
                  <p className={i === 0 ? "text-white/90" : undefined}>
                    {step.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
