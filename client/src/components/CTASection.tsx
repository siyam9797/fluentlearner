/**
 * CTASection — FluentLearner Red+White Brand Theme
 * Enhanced with guarantee badge, urgency, and Bengali text.
 * Cialdini's Commitment: Guarantee reduces perceived risk.
 * Cialdini's Scarcity: Limited seats create urgency.
 * Now triggers enrollment funnel instead of direct WhatsApp.
 */
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Shield, ArrowRight, Phone, CheckCircle, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { SITE_STATS, CONTACT, PRICING } from "@/lib/siteConstants";

const guarantees = [
  `প্রমাণিত ${SITE_STATS.SUCCESS_RATE}% সাফল্যের হার`,
  "One-to-One ব্যক্তিগত মেন্টরিং",
  "২৪/৭ WhatsApp সাপোর্ট",
  "রেকর্ডেড ক্লাস + স্টাডি ম্যাটেরিয়াল",
  "মক টেস্ট ও বিস্তারিত ফিডব্যাক",
  "সার্টিফিকেট অব কমপ্লিশন",
];

export default function CTASection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [, navigate] = useLocation();

  return (
    <section ref={ref} className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-red-deep via-brand-red-dark to-brand-red" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 mb-6 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-body text-sm font-medium">সীমিত সিট — এখনই ভর্তি হন</span>
            </div>

            <h2
              className={`font-display text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 transition-all duration-700 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              আপনার <span className="text-yellow-300">IELTS সাফল্যের</span> যাত্রা শুরু করুন আজই
            </h2>

            <p
              className={`text-white/80 font-body text-lg leading-relaxed mb-6 max-w-xl transition-all duration-700 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              ৫,১২৯+ সফল শিক্ষার্থীর বিশ্বস্ত প্ল্যাটফর্মে যোগ দিন। আমাদের VIP কোর্সে ব্যক্তিগত মনোযোগ পান এবং আপনার স্বপ্নের Band Score অর্জন করুন।
            </p>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {guarantees.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: isVisible ? `${300 + index * 80}ms` : "0ms" }}
                >
                  <CheckCircle className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span className="text-white/80 font-body text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex flex-wrap gap-4 transition-all duration-700 delay-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <button
                onClick={() => navigate('/enroll')}
                className="group px-8 py-4 bg-white text-brand-red font-display font-bold text-base rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl shadow-black/10 hover:-translate-y-1 inline-flex items-center gap-2"
              >
                এখনই ভর্তি হন
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href={`tel:${CONTACT.PHONE_TEL}`}
                className="px-8 py-4 border-2 border-white/40 text-white font-body font-semibold text-base rounded-xl hover:bg-white/10 hover:border-white/60 transition-all duration-300 inline-flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                কল করুন — {CONTACT.PHONE_SHORT}
              </a>
            </div>
          </div>

          {/* Right — Guarantee Badge */}
          <div className="lg:col-span-5">
            <div
              className={`bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-8 text-center transition-all duration-700 delay-300 ${
                isVisible ? "opacity-100 translate-x-0 rotate-0" : "opacity-0 translate-x-8 rotate-2"
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-5">
                <Shield className="w-10 h-10 text-yellow-300" />
              </div>
              <h3 className="font-display text-white text-2xl font-extrabold mb-2">
                আমাদের প্রতিশ্রুতি
              </h3>
              <p className="text-white/70 font-body text-base leading-relaxed mb-6">
                আমরা প্রতিটি শিক্ষার্থীর সাফল্যে প্রতিশ্রুতিবদ্ধ। আমাদের ৯৫% সাফল্যের হার প্রমাণ করে যে আমাদের পদ্ধতি কার্যকর।
              </p>

              {/* Trust metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="font-display text-2xl font-extrabold text-yellow-300">{SITE_STATS.SUCCESS_RATE}%</div>
                  <p className="text-white/50 font-body text-[10px] mt-1">সাফল্যের হার</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="font-display text-2xl font-extrabold text-yellow-300">{SITE_STATS.AVG_BAND_SCORE}</div>
                  <p className="text-white/50 font-body text-[10px] mt-1">গড় ব্যান্ড</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="font-display text-2xl font-extrabold text-yellow-300">24/7</div>
                  <p className="text-white/50 font-body text-[10px] mt-1">সাপোর্ট</p>
                </div>
              </div>

              {/* Price anchor */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <p className="text-white/50 font-body text-xs mb-1">VIP কোর্স শুরু মাত্র</p>
                <div className="font-display text-3xl font-extrabold text-white">
                  {PRICING.VIP_1M} <span className="text-lg text-white/40 font-normal line-through">{PRICING.VIP_ORIGINAL}</span>
                </div>
                <p className="text-yellow-300/80 font-body text-xs mt-1 font-bold">সীমিত সময়ের অফার</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top diagonal */}
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full rotate-180">
          <path d="M0 60L1440 20V60H0Z" fill="oklch(0.99 0.00 0)" />
        </svg>
      </div>
    </section>
  );
}
