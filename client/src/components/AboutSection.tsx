/**
 * AboutSection — FluentLearner Red+White Brand Theme
 * Trainer personal branding section with photo and highlights.
 */
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { GraduationCap, Globe, HeartHandshake, Lightbulb, Award, Users } from "lucide-react";
import { SITE_STATS, BRAND } from "@/lib/siteConstants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const highlights = [
  {
    icon: GraduationCap,
    title: "Expert Mentoring",
    description: "Proven IELTS teaching methodologies with personal attention",
  },
  {
    icon: Globe,
    title: "Study Abroad",
    description: "Complete guidance for international education & immigration",
  },
  {
    icon: HeartHandshake,
    title: "One-to-One Support",
    description: "Dedicated sessions to address your specific weaknesses",
  },
  {
    icon: Lightbulb,
    title: "Smart Learning",
    description: "Modern techniques combined with proven strategies",
  },
];

export default function AboutSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const ss = useSiteSettings();

  return (
    <section id="about" className="relative py-20 lg:py-28 bg-brand-cream overflow-hidden" ref={ref}>
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Side — Trainer Photo */}
          <div
            className={`relative transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-brand-red/10">
              <img
                src={ss.founderPhoto}
                alt={`${ss.founderName} \u2014 ${ss.founderTitle} at FluentLearner`}
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-red-deep/50 to-transparent" />
              {/* Overlay Name Badge */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-brand-dark text-base font-bold">{ss.founderName}</h3>
                      <p className="text-brand-charcoal/60 font-body text-xs">{ss.founderTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-brand-red/15 rounded-xl hidden lg:block" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-brand-red/5 rounded-xl hidden lg:block" />
          </div>

          {/* Content Side */}
          <div>
            <span
              className={`inline-block text-brand-red font-body text-sm font-bold uppercase tracking-[0.2em] mb-4 transition-all duration-600 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              About FluentLearner
            </span>
            <h2
              className={`font-display text-brand-dark text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6 transition-all duration-600 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Where <span className="text-brand-red">Ambition</span> Meets{" "}
              <span className="text-brand-red">Excellence</span>
            </h2>
            <p
              className={`text-brand-charcoal/70 font-body text-lg leading-relaxed mb-4 transition-all duration-600 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {ss.aboutDescription || `Founded by ${ss.founderName}, FluentLearner has established itself as Bangladesh's most trusted IELTS coaching platform. Our mission is simple \u2014 to transform every student's dream of studying abroad into reality through world-class preparation and unwavering support.`}
            </p>
            <p
              className={`text-brand-charcoal/60 font-body text-base leading-relaxed mb-8 transition-all duration-600 delay-250 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {ss.aboutMission || `With ${ss.totalScorers.toLocaleString()}+ successful scorers and a ${ss.successRate}% success rate, we provide one-to-one mentorship that focuses on each student's unique strengths and weaknesses. Our VIP coaching approach ensures personalized attention that group classes simply cannot match.`}
            </p>

            {/* Stats Row */}
            <div
              className={`flex gap-6 mb-8 transition-all duration-600 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold text-brand-red">{ss.totalScorers.toLocaleString()}+</div>
                <p className="text-brand-charcoal/50 font-body text-xs mt-1">Successful Scorers</p>
              </div>
              <div className="w-px bg-brand-red/15" />
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold text-brand-red">{ss.successRate}%</div>
                <p className="text-brand-charcoal/50 font-body text-xs mt-1">Success Rate</p>
              </div>
              <div className="w-px bg-brand-red/15" />
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold text-brand-red">{ss.avgBandScore}</div>
                <p className="text-brand-charcoal/50 font-body text-xs mt-1">Avg. Band Score</p>
              </div>
            </div>

            {/* Highlight Grid */}
            <div className="grid grid-cols-2 gap-4">
              {highlights.map((item, index) => (
                <div
                  key={item.title}
                  className={`p-4 bg-white border border-gray-100 rounded-lg hover:border-brand-red/20 hover:shadow-md hover:shadow-brand-red/5 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: isVisible ? `${300 + index * 100}ms` : "0ms" }}
                >
                  <item.icon className="w-6 h-6 text-brand-red mb-2" />
                  <h3 className="font-display text-brand-dark text-sm font-bold mb-1">{item.title}</h3>
                  <p className="text-brand-charcoal/50 font-body text-xs leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
