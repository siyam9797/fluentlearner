import { Award, BookOpen, Globe, GraduationCap, Headphones, Mic, PenLine, type LucideIcon } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCountUp, useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { Pill, Reveal, formatCompact } from "./primitives";
import { usePillImages } from "./hooks";

export const ICON_ROW: LucideIcon[] = [BookOpen, Headphones, PenLine, Mic, GraduationCap, Globe, Award];

export function IconRow({ icons = ICON_ROW }: { icons?: LucideIcon[] }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {icons.map((Icon, i) => (
        <span
          key={i}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[4px] bg-brand-red text-white shadow-[0_2px_4px_rgba(31,31,31,0.1)]",
            i % 2 === 0 ? "-translate-y-1.5 -rotate-6" : "translate-y-1.5 rotate-6",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      ))}
    </div>
  );
}

function Stat({ value, suffix, label, first }: { value: string; suffix: string; label: string; first?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 sm:items-start lg:border-l lg:border-ink/20 lg:py-5 lg:pl-10",
        first && "lg:border-l-0 lg:pl-0",
      )}
    >
      <div className="flex items-start text-[50px] sm:text-[60px] lg:text-[80px] font-semibold leading-none">
        {value}
        <span className="-mt-1 text-[35px] lg:text-[45px] leading-[0.7] text-brand-red">{suffix}</span>
      </div>
      <h3 className="text-lg">{label}</h3>
    </div>
  );
}

export default function HvNumbers() {
  const ss = useSiteSettings();
  const pills = usePillImages();
  const { ref, isVisible } = useScrollAnimation(0.3);

  const bandMatch = /^(\d+(?:\.\d+)?)(.*)$/.exec(ss.avgBandScore.trim());
  const bandValue = bandMatch ? parseFloat(bandMatch[1]) : 7;
  const bandSuffix = bandMatch?.[2] || "";

  const scorers = useCountUp(ss.totalScorers, 2000, isVisible);
  const rate = useCountUp(ss.successRate, 1800, isVisible);
  const band = useCountUp(Math.round(bandValue * 10), 1600, isVisible);
  const years = useCountUp(ss.yearsExperience, 1400, isVisible);

  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto flex max-w-[1270px] flex-col items-center gap-16 px-4 lg:gap-24 lg:px-10">
        <Reveal className="flex max-w-[720px] flex-col items-center gap-8 text-center">
          <IconRow />
          <h2 className="text-[28px] sm:text-[32px] lg:text-4xl">
            We focus<Pill src={pills[0]} position="50% 22%" />not only on IELTS scores but on building real-world
            <Pill src={pills[1]} position="50% 50%" />English confidence for life
          </h2>
        </Reveal>

        <div ref={ref} className="grid w-full grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-10">
          <Stat first value={formatCompact(scorers)} suffix="+" label="Successful Scorers" />
          <Stat value={String(rate)} suffix="%" label="Success Rate" />
          <Stat value={(band / 10).toFixed(1)} suffix={bandSuffix} label="Average Band Score" />
          <Stat value={String(years)} suffix="+" label="Years of Mentoring" />
        </div>
      </div>
    </section>
  );
}
