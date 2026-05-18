/**
 * ComparisonTable — Psychological Trust Element
 * Why FluentLearner vs generic coaching centers.
 * Cialdini's Authority + Contrast Principle: Shows clear advantages.
 * Does NOT name competitors directly — uses "অন্যান্য প্ল্যাটফর্ম" generically.
 */
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Check, X, Shield } from "lucide-react";
import { SITE_STATS, CONTACT, PRICING } from "@/lib/siteConstants";

const comparisons = [
  { feature: "One-to-One Mentoring", featureBn: "ব্যক্তিগত মেন্টরিং", us: true, others: false },
  { feature: "24/7 WhatsApp Support", featureBn: "২৪/৭ WhatsApp সাপোর্ট", us: true, others: false },
  { feature: "Recorded Classes", featureBn: "রেকর্ডেড ক্লাস", us: true, others: true },
  { feature: "Mock Tests with Feedback", featureBn: "মক টেস্ট ও ফিডব্যাক", us: true, others: true },
  { feature: "Personalized Study Plan", featureBn: "ব্যক্তিগত স্টাডি প্ল্যান", us: true, others: false },
  { feature: "Writing Review per Student", featureBn: "প্রতিটি Writing আলাদা রিভিউ", us: true, others: false },
  { feature: "Affordable VIP Pricing", featureBn: `সাশ্রয়ী VIP মূল্য (${PRICING.VIP_1M} থেকে)`, us: true, others: false },
  { feature: `Proven ${SITE_STATS.SUCCESS_RATE}% Success Rate`, featureBn: `প্রমাণিত ${SITE_STATS.SUCCESS_RATE}% সাফল্যের হার`, us: true, others: false },
  { feature: `${SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ Successful Students`, featureBn: `${SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ সফল শিক্ষার্থী`, us: true, others: false },
];

export default function ComparisonTable() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section ref={ref} className="py-16 lg:py-24 bg-brand-gray relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-red/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span
            className={`inline-block text-brand-red font-body text-sm font-bold uppercase tracking-[0.2em] mb-3 transition-all duration-600 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            কেন FluentLearner?
          </span>
          <h2
            className={`font-display text-brand-dark text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight transition-all duration-600 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            পার্থক্যটা <span className="text-brand-red">স্পষ্ট</span>
          </h2>
        </div>

        {/* Table */}
        <div
          className={`max-w-3xl mx-auto bg-white rounded-2xl shadow-xl shadow-brand-red/5 border border-gray-100 overflow-hidden transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-brand-dark text-white">
            <div className="col-span-6 p-4 sm:p-5">
              <span className="font-body text-xs uppercase tracking-widest text-white/50">Feature</span>
            </div>
            <div className="col-span-3 p-4 sm:p-5 text-center border-l border-white/10">
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-red-light" />
                <span className="font-display text-sm font-bold">FluentLearner</span>
              </div>
            </div>
            <div className="col-span-3 p-4 sm:p-5 text-center border-l border-white/10">
              <span className="font-body text-xs text-white/50">অন্যান্য</span>
            </div>
          </div>

          {/* Table Body */}
          {comparisons.map((item, index) => (
            <div
              key={item.feature}
              className={`grid grid-cols-12 border-b border-gray-50 last:border-b-0 hover:bg-brand-red/2 transition-all duration-300 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: isVisible ? `${300 + index * 60}ms` : "0ms" }}
            >
              <div className="col-span-6 p-4 sm:p-5">
                <p className="font-display text-brand-dark text-sm font-semibold">{item.featureBn}</p>
                <p className="text-brand-charcoal/40 font-body text-xs mt-0.5">{item.feature}</p>
              </div>
              <div className="col-span-3 p-4 sm:p-5 flex items-center justify-center border-l border-gray-50">
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="col-span-3 p-4 sm:p-5 flex items-center justify-center border-l border-gray-50">
                {item.others ? (
                  <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-400" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className={`text-center mt-8 transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <a
            href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=Assalamu%20Alaikum%2C%20I%20want%20to%20know%20more%20about%20FluentLearner%20courses`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-red text-white font-display font-bold text-base rounded-xl hover:bg-brand-red-dark transition-all duration-300 shadow-lg shadow-brand-red/20 hover:-translate-y-0.5"
          >
            আজই শুরু করুন — বিনামূল্যে কথা বলুন
          </a>
        </div>
      </div>
    </section>
  );
}
