/**
 * HeroSection — FluentLearner Red+White Brand Theme
 * Bold red gradient hero with trainer photo, stats, and personal branding.
 * Enhanced with Bengali tagline, urgency elements, and psychological trust signals.
 * Cialdini's Authority: Trainer photo + credentials create instant authority.
 * Cialdini's Social Proof: Numbers (5,129+) create bandwagon effect.
 */
import { useEffect, useState } from "react";
import { useCountUp } from "@/hooks/useScrollAnimation";
import { Award, Users, TrendingUp, ChevronDown, Star, Play, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { SITE_STATS, BRAND } from "@/lib/siteConstants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const ss = useSiteSettings();
  const scorers = useCountUp(ss.totalScorers, 2500, loaded);
  const avgScore = useCountUp(ss.totalScorers > 0 ? Math.round(parseFloat(ss.avgBandScore) * 10 || SITE_STATS.AVG_BAND_SCORE_RAW) : SITE_STATS.AVG_BAND_SCORE_RAW, 2000, loaded);
  const successRate = useCountUp(ss.successRate, 2200, loaded);
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="home" className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Background — Deep Red Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-red-deep via-brand-red-dark to-brand-red" />
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      {/* Light gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-red-deep/60 via-transparent to-brand-red-deep/30" />

      {/* Content */}
      <div className="container relative z-10 py-20 lg:py-0">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Content — 7 cols */}
          <div className="lg:col-span-7">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 mb-6 transition-all duration-700 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Award className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-body text-sm font-medium tracking-wide">
                No.1 Online Learning Platform in Bangladesh
              </span>
            </div>

            {/* Bengali Tagline */}
            <p
              className={`text-yellow-300/90 font-body text-base sm:text-lg mb-2 transition-all duration-700 delay-75 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {ss.heroSubtitle}
            </p>

            {/* Headline */}
            <h1
              className={`font-display text-white leading-tight transition-all duration-700 delay-100 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold block">
                Your Path to
              </span>
              <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold block mt-2">
                <span className="text-yellow-300">IELTS</span> Success
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`mt-6 text-white/80 font-body text-lg lg:text-xl max-w-xl leading-relaxed transition-all duration-700 delay-200 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {ss.heroDescription || `Expert-led IELTS preparation with one-to-one mentorship — trusted by ${ss.totalScorers.toLocaleString()}+ successful scorers across Bangladesh.`}
            </p>

            {/* CTA Buttons */}
            <div
              className={`mt-8 flex flex-wrap gap-4 transition-all duration-700 delay-300 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <button
                onClick={() => navigate('/enroll')}
                className="group px-8 py-3.5 bg-white text-brand-red font-body font-bold text-base rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                এখনই ভর্তি হন
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#courses"
                className="px-8 py-3.5 border-2 border-white/40 text-white font-body font-semibold text-base rounded-lg hover:bg-white/10 hover:border-white/60 transition-all duration-300 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                কোর্স দেখুন
              </a>
            </div>

            {/* Trainer Mini Card + Trust Signal */}
            <div
              className={`mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-all duration-700 delay-400 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={ss.founderPhoto}
                  alt={`${ss.founderName} — ${ss.founderTitle}`}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/40 shadow-lg"
                />
                <div>
                  <p className="text-white font-display text-sm font-bold">{ss.founderName}</p>
                  <p className="text-white/60 font-body text-xs">{ss.founderTitle}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                    ))}
                  </div>
                </div>
              </div>
              {/* Trust micro-signal */}
              <div className="hidden sm:block w-px h-10 bg-white/15" />
              <div className="hidden sm:block">
                <p className="text-white/70 font-body text-xs leading-relaxed">
                  <span className="text-yellow-300 font-bold">{ss.facebookFollowers}</span> Facebook followers
                </p>
                <p className="text-white/50 font-body text-xs">
                  Chittagong, Bangladesh
                </p>
              </div>
            </div>
          </div>

          {/* Right Side — Stats Cards — 5 cols */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Main Stat Card */}
            <div
              className={`bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-8 text-center transition-all duration-700 delay-300 ${
                loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-yellow-300" />
                <span className="text-white/70 font-body text-sm uppercase tracking-widest">সফল শিক্ষার্থী</span>
              </div>
              <div className="font-display text-6xl lg:text-7xl font-extrabold text-white">
                {scorers.toLocaleString()}
                <span className="text-yellow-300 text-4xl">+</span>
              </div>
              <p className="text-white/50 font-body text-sm mt-2">মার্চ ২০২৬ পর্যন্ত</p>
            </div>

            {/* Two smaller stat cards */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-5 text-center transition-all duration-700 delay-400 ${
                  loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <TrendingUp className="w-5 h-5 text-yellow-300 mx-auto mb-2" />
                <div className="font-display text-3xl font-extrabold text-white">
                  {(avgScore / 10).toFixed(1)}
                </div>
                <p className="text-white/50 font-body text-xs mt-1">গড় ব্যান্ড স্কোর</p>
              </div>
              <div
                className={`bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-5 text-center transition-all duration-700 delay-500 ${
                  loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <Award className="w-5 h-5 text-yellow-300 mx-auto mb-2" />
                <div className="font-display text-3xl font-extrabold text-white">
                  {successRate}%
                </div>
                <p className="text-white/50 font-body text-xs mt-1">সাফল্যের হার</p>
              </div>
            </div>

            {/* Quick trust badge */}
            <div
              className={`bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 transition-all duration-700 delay-600 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div>
                <p className="text-white/80 font-body text-sm">
                  <span className="font-bold text-green-300">এখনই ভর্তি চলছে</span> — পরবর্তী ব্যাচ শীঘ্রই শুরু
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <a href="#courses" aria-label="Scroll to courses">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </a>
      </div>

      {/* Diagonal Bottom Edge */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0 80L1440 30V80H0Z" fill="oklch(0.99 0.00 0)" />
        </svg>
      </div>
    </section>
  );
}
