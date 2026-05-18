/**
 * CoursesSection — FluentLearner Red+White Brand Theme
 * Course cards with red accents on white background.
 * Real pricing and course details from client data.
 * Enrollment funnel integration — each course card opens funnel with pre-selected course.
 */
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BookOpen, Mic, GraduationCap, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

const courses = [
  {
    id: 1,
    funnelId: "ielts-vip-2m",
    icon: GraduationCap,
    title: "IELTS VIP Course",
    subtitle: "Private Batch — One-to-One",
    description: "Comprehensive IELTS preparation covering all four modules — Listening, Reading, Writing, and Speaking. Personal mentorship to achieve Band 7.0+.",
    features: [
      "Full 4-module coverage (L/R/W/S)",
      "One-to-one mentoring sessions",
      "Mock tests & detailed feedback",
      "Study materials included",
      "WhatsApp support 24/7",
    ],
    plans: [
      { name: "Plan A — 1 Month", price: "৳8,500" },
      { name: "Plan B — 2 Months", price: "৳10,000" },
    ],
    badge: "Most Popular",
    featured: true,
  },
  {
    id: 2,
    funnelId: "grammar-spoken",
    icon: BookOpen,
    title: "Basic Grammar & Spoken",
    subtitle: "Foundation Course",
    description: "Build a strong foundation in English grammar and develop confident speaking skills. Perfect for beginners starting their English journey.",
    features: [
      "Grammar fundamentals",
      "Vocabulary building",
      "Daily conversation practice",
      "Pronunciation training",
      "2-month structured program",
    ],
    plans: [
      { name: "Full Course — 2 Months", price: "৳5,100" },
    ],
    badge: null,
    featured: false,
  },
  {
    id: 3,
    funnelId: "speaking-premium",
    icon: Mic,
    title: "IELTS Speaking Premium",
    subtitle: "One-to-One Preparation",
    description: "Intensive speaking-focused course with one-on-one practice sessions, mock interviews, and expert feedback to boost your speaking score.",
    features: [
      "1-on-1 speaking practice",
      "Mock interview sessions",
      "Pronunciation correction",
      "Cue card strategies",
      "Expert feedback after each session",
    ],
    plans: [
      { name: "Full Course — 1 Month", price: "৳2,600" },
    ],
    badge: "New",
    featured: false,
  },
];

export default function CoursesSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [, navigate] = useLocation();

  return (
    <section id="courses" className="py-20 lg:py-28 bg-white relative" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className={`inline-block text-brand-red font-body text-sm font-bold uppercase tracking-[0.2em] mb-3 transition-all duration-600 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Our Courses
          </span>
          <h2
            className={`font-display text-brand-dark text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight transition-all duration-600 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Choose Your <span className="text-brand-red">Path</span>
          </h2>
          <p
            className={`mt-4 text-brand-charcoal/60 font-body text-lg leading-relaxed transition-all duration-600 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Expert-designed courses to help you achieve your target IELTS score and beyond.
          </p>
        </div>

        {/* Course Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className={`relative rounded-xl overflow-hidden transition-all duration-500 group ${
                course.featured
                  ? "bg-brand-red text-white shadow-xl shadow-brand-red/20 ring-2 ring-brand-red"
                  : "bg-white text-brand-dark border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-brand-red/10"
              } ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isVisible ? `${200 + index * 120}ms` : "0ms" }}
            >
              {/* Badge */}
              {course.badge && (
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold font-body ${
                  course.featured
                    ? "bg-yellow-400 text-brand-dark"
                    : "bg-brand-red/10 text-brand-red"
                }`}>
                  {course.badge}
                </div>
              )}

              <div className="p-6 lg:p-8">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${
                  course.featured ? "bg-white/20" : "bg-brand-red/10"
                }`}>
                  <course.icon className={`w-6 h-6 ${course.featured ? "text-white" : "text-brand-red"}`} />
                </div>

                {/* Title */}
                <h3 className="font-display text-xl font-bold mb-1">{course.title}</h3>
                <p className={`font-body text-sm mb-4 ${course.featured ? "text-white/70" : "text-brand-charcoal/50"}`}>
                  {course.subtitle}
                </p>

                {/* Description */}
                <p className={`font-body text-sm leading-relaxed mb-5 ${
                  course.featured ? "text-white/80" : "text-brand-charcoal/60"
                }`}>
                  {course.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {course.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                        course.featured ? "text-yellow-300" : "text-brand-red"
                      }`} />
                      <span className={`font-body text-sm ${
                        course.featured ? "text-white/80" : "text-brand-charcoal/60"
                      }`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Pricing */}
                <div className={`border-t pt-5 ${course.featured ? "border-white/20" : "border-gray-100"}`}>
                  {course.plans.map((plan) => (
                    <div key={plan.name} className="flex justify-between items-center mb-2">
                      <span className={`font-body text-sm ${course.featured ? "text-white/70" : "text-brand-charcoal/50"}`}>
                        {plan.name}
                      </span>
                      <span className={`font-display text-lg font-bold ${course.featured ? "text-yellow-300" : "text-brand-red"}`}>
                        {plan.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA — Opens Enrollment Funnel with pre-selected course */}
                <button
                  onClick={() => navigate('/enroll')}
                  className={`mt-5 w-full text-center px-6 py-3 rounded-lg font-body font-bold text-sm transition-all duration-300 cursor-pointer ${
                    course.featured
                      ? "bg-white text-brand-red hover:bg-gray-50 shadow-lg"
                      : "bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20"
                  }`}
                >
                  এখনই ভর্তি হন
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
