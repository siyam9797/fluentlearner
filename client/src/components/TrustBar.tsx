/**
 * TrustBar — Psychological Trust Element
 * Animated stats bar below Hero section.
 * Cialdini's Social Proof + Authority: Shows credibility numbers.
 * Designed to be the first thing users see after the hero — instant trust signal.
 */
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import { Users, Trophy, TrendingUp, Calendar, Shield } from "lucide-react";
import { SITE_STATS } from "@/lib/siteConstants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function TrustBar() {
  const { ref, isVisible } = useScrollAnimation(0.3);
  const ss = useSiteSettings();

  const stats = [
    { icon: Users, value: ss.totalScorers, suffix: "+", label: "সফল শিক্ষার্থী", labelEn: "Successful Scorers" },
    { icon: Trophy, value: ss.successRate, suffix: "%", label: "সাফল্যের হার", labelEn: "Success Rate" },
    { icon: TrendingUp, value: 7, suffix: ".0+", label: "গড় ব্যান্ড স্কোর", labelEn: "Avg. Band Score" },
    { icon: Calendar, value: ss.yearsExperience, suffix: "+", label: "বছরের অভিজ্ঞতা", labelEn: "Years of Excellence" },
    { icon: Shield, value: 100, suffix: "%", label: "অনলাইন কোর্স", labelEn: "Online Courses" },
  ];

  const count0 = useCountUp(stats[0].value, 2000, isVisible);
  const count1 = useCountUp(stats[1].value, 1800, isVisible);
  const count3 = useCountUp(stats[3].value, 1500, isVisible);
  const count4 = useCountUp(stats[4].value, 1600, isVisible);

  const displayValues = [
    count0.toLocaleString() + stats[0].suffix,
    count1 + stats[1].suffix,
    ss.avgBandScore,
    count3 + stats[3].suffix,
    count4 + stats[4].suffix,
  ];

  return (
    <section
      ref={ref}
      className="relative -mt-6 z-20 pb-2"
    >
      <div className="container">
        <div
          className={`bg-white rounded-2xl shadow-xl shadow-brand-red/8 border border-gray-100 px-4 py-5 sm:px-8 sm:py-6 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.labelEn}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                } ${index >= 3 ? "hidden sm:flex" : ""} ${index >= 3 && index < 5 ? "lg:flex" : ""}`}
                style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-red/8 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <div className="font-display text-xl sm:text-2xl font-extrabold text-brand-dark leading-none">
                    {displayValues[index]}
                  </div>
                  <p className="text-brand-charcoal/50 font-body text-[10px] sm:text-xs mt-0.5 leading-tight">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
