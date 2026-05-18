/**
 * TestimonialsSection — FluentLearner Red+White Brand Theme
 * Real student success stories with band score breakdowns.
 * Enhanced with Bengali headers, trust signals, and psychological elements.
 * Cialdini's Social Proof: Real names + real scores = powerful trust.
 * Cialdini's Authority: Detailed score breakdowns show expertise.
 */
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Star, Quote, Trophy, MessageSquare } from "lucide-react";
import { SITE_STATS, CONTACT } from "@/lib/siteConstants";

const testimonials = [
  {
    id: 1,
    name: "Dr Milon Chowdhury",
    band: "8.0",
    course: "VIP 1-to-1",
    scores: { L: 8.5, R: 8.0, W: 7.0, S: 7.5 },
    text: "The mentor is truly professional. He is keen to find out strong as well as weak points of individual candidate. My score improved significantly in only 15 days coaching.",
    textBn: "মাত্র ১৫ দিনের কোচিং-এ Band 8.0!",
    initials: "MC",
    highlight: true,
    verified: true,
  },
  {
    id: 2,
    name: "Dr Afroza",
    band: "7.5",
    course: "IELTS VIP",
    scores: { L: 9.0, R: 8.0, W: 7.0, S: 6.0 },
    text: "Alhamdulillah! The one-to-one preparation approach at FluentLearner helped me achieve my dream score. Listening 9.0!",
    textBn: "Listening-এ 9.0 — সর্বোচ্চ স্কোর!",
    initials: "DA",
    highlight: false,
    verified: true,
  },
  {
    id: 3,
    name: "Sajal Chaklader",
    band: "8.0",
    course: "IELTS VIP (RUET)",
    scores: { L: 8.5, R: 8.0, W: 7.0, S: 7.5 },
    text: "FluentLearner's structured approach and dedicated mentoring helped me achieve Band 8.0. The mock tests were incredibly helpful.",
    textBn: "RUET থেকে Band 8.0!",
    initials: "SC",
    highlight: false,
    verified: true,
  },
  {
    id: 4,
    name: "Lailun Tonny",
    band: "7.5",
    course: "IELTS VIP",
    scores: { L: 8.5, R: 8.5, W: 6.5, S: 6.5 },
    text: "Really indebted to Zahid Bhai. His dedication and enthusiasm towards teaching is remarkable. FluentLearner is definitely the best choice.",
    textBn: "Reading ও Listening দুটোতেই 8.5!",
    initials: "LT",
    highlight: false,
    verified: true,
  },
  {
    id: 5,
    name: "Jannatul Ferdous Binti",
    band: "7.5",
    course: "IELTS VIP",
    scores: { L: 8.0, R: 8.5, W: 6.5, S: 7.0 },
    text: "Thanks bhaiya and apu for your constant support. The guidance made all the difference in my IELTS preparation journey.",
    textBn: "Reading 8.5 — WhatsApp প্রমাণ সহ!",
    initials: "JB",
    highlight: false,
    verified: true,
  },
  {
    id: 6,
    name: "Nusrat Kabir",
    band: "7.0+",
    course: "IELTS VIP",
    scores: { L: 7.5, R: 7.0, W: 6.5, S: 7.0 },
    text: "Huge thanks to Allah, and then to Fluent Learner, especially Zahid Vaiya and Ruhi Apu — their support, mocks, and guidance changed everything.",
    textBn: "Mock test থেকে প্রায় সব প্রশ্ন এসেছিল!",
    initials: "NK",
    highlight: false,
    verified: true,
  },
  {
    id: 7,
    name: "Ataur Rahman",
    band: "7.5",
    course: "Online Batch",
    scores: { L: 8.5, R: 7.0, W: 7.5, S: 6.5 },
    text: "Alhamdulillah! The online batch was incredibly well-organized and the mentoring quality was outstanding.",
    textBn: "Listening 8.5 + Writing 7.5!",
    initials: "AR",
    highlight: false,
    verified: true,
  },
];

function ScoreBadge({ label, score, featured }: { label: string; score: number; featured?: boolean }) {
  const isHigh = score >= 8.0;
  return (
    <div className={`text-center px-3 py-2 rounded-lg ${
      featured ? "bg-white/15" : isHigh ? "bg-green-50" : "bg-brand-red/8"
    }`}>
      <div className={`font-display text-lg font-extrabold ${
        featured ? "text-yellow-300" : isHigh ? "text-green-600" : "text-brand-red"
      }`}>{score}</div>
      <div className={`font-body text-[10px] uppercase tracking-wider ${
        featured ? "text-white/60" : "text-brand-charcoal/40"
      }`}>{label}</div>
    </div>
  );
}

export default function TestimonialsSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-white relative" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className={`inline-block text-brand-red font-body text-sm font-bold uppercase tracking-[0.2em] mb-3 transition-all duration-600 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            সাফল্যের গল্প
          </span>
          <h2
            className={`font-display text-brand-dark text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight transition-all duration-600 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            আমাদের শিক্ষার্থীরা <span className="text-brand-red">সফল</span>
          </h2>
          <p
            className={`mt-4 text-brand-charcoal/60 font-body text-lg leading-relaxed transition-all duration-600 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            প্রকৃত শিক্ষার্থীদের প্রকৃত ফলাফল — প্রতিটি স্কোর যাচাইযোগ্য এবং প্রমাণিত।
          </p>
        </div>

        {/* Featured Testimonial — Dr Milon */}
        <div
          className={`mb-10 bg-brand-red rounded-xl p-6 lg:p-8 shadow-xl shadow-brand-red/15 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="text-yellow-300 font-body text-sm font-bold uppercase tracking-wider">সর্বোচ্চ স্কোরার</span>
              </div>
              <Quote className="w-8 h-8 text-white/20 mb-3" />
              <p className="text-white/90 font-body text-base lg:text-lg leading-relaxed italic mb-2">
                "{testimonials[0].text}"
              </p>
              <p className="text-yellow-300/80 font-body text-sm font-bold mb-4">
                {testimonials[0].textBn}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-display text-base font-bold">{testimonials[0].initials}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-white text-base font-bold">{testimonials[0].name}</p>
                    {testimonials[0].verified && (
                      <span className="text-[10px] bg-white/20 text-white/80 px-2 py-0.5 rounded-full font-body">যাচাইকৃত</span>
                    )}
                  </div>
                  <p className="text-white/60 font-body text-sm">{testimonials[0].course}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="font-display text-5xl font-extrabold text-white mb-2">
                  {testimonials[0].band}
                </div>
                <p className="text-white/60 font-body text-sm mb-4">Overall Band Score</p>
                <div className="grid grid-cols-4 gap-2">
                  <ScoreBadge label="Listening" score={testimonials[0].scores.L} featured />
                  <ScoreBadge label="Reading" score={testimonials[0].scores.R} featured />
                  <ScoreBadge label="Writing" score={testimonials[0].scores.W} featured />
                  <ScoreBadge label="Speaking" score={testimonials[0].scores.S} featured />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.slice(1).map((t, index) => (
            <div
              key={t.id}
              className={`bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-lg hover:shadow-brand-red/5 hover:border-brand-red/10 transition-all duration-500 group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isVisible ? `${300 + index * 100}ms` : "0ms" }}
            >
              {/* Band Score Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-colors">
                    <span className="text-brand-red group-hover:text-white font-display text-sm font-bold transition-colors">{t.initials}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-brand-dark text-sm font-bold">{t.name}</p>
                      {t.verified && (
                        <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-brand-charcoal/40 font-body text-xs">{t.course}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-display text-xl font-extrabold text-brand-red">{t.band}</div>
                  <p className="text-brand-charcoal/40 font-body text-[9px] uppercase tracking-wider">Band</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                <ScoreBadge label="L" score={t.scores.L} />
                <ScoreBadge label="R" score={t.scores.R} />
                <ScoreBadge label="W" score={t.scores.W} />
                <ScoreBadge label="S" score={t.scores.S} />
              </div>

              {/* Bengali highlight */}
              <p className="text-brand-red font-body text-xs font-bold mb-2">{t.textBn}</p>

              {/* Text */}
              <p className="text-brand-charcoal/60 font-body text-sm leading-relaxed line-clamp-3">
                "{t.text}"
              </p>

              {/* Stars + Source */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-brand-charcoal/30">
                  <MessageSquare className="w-3 h-3" />
                  <span className="font-body text-[10px]">Verified Review</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-brand-charcoal/50 font-body text-base mb-4">
            <span className="text-brand-red font-bold">{SITE_STATS.TOTAL_SCORERS.toLocaleString()}+</span> সফল শিক্ষার্থীর সাথে যোগ দিন। আপনার সাফল্যের গল্প পরবর্তী হতে পারে।
          </p>
          <a
            href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=Assalamu%20Alaikum%2C%20I%20want%20to%20start%20my%20IELTS%20preparation%20with%20FluentLearner`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-red text-white font-body font-bold text-base rounded-lg hover:bg-brand-red-dark transition-all duration-300 shadow-lg shadow-brand-red/20 hover:-translate-y-0.5"
          >
            আজই শুরু করুন
          </a>
        </div>
      </div>
    </section>
  );
}
