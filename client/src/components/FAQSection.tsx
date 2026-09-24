/**
 * FAQSection — Psychological Trust Element
 * Addresses common fears and objections of Bangladeshi IELTS students.
 * Cialdini's Commitment: Reduces perceived risk → easier to commit.
 * Cialdini's Authority: Shows expertise through detailed answers.
 * Cultural context: Addresses Bangladesh-specific concerns (price, online quality, etc.)
 */
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ChevronDown, HelpCircle } from "lucide-react";
import { CONTACT } from "@/lib/siteConstants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const getFaqs = (totalScorers: string, successRate: string) => [
  {
    question: "Can I really get good results from an online course?",
    questionEn: "Online learning with personal mentoring",
    answer: `Absolutely. Most of our ${totalScorers}+ successful students joined online batches. One-to-one mentoring gives you focused attention, structured feedback, and direct support from your mentor.`,
  },
  {
    question: "How long is the course? Can I prepare in one month?",
    questionEn: "Flexible one-month and two-month plans",
    answer: "Our IELTS VIP Course offers Plan A for one month and Plan B for two months. If your English foundation is already solid, an intensive one-month plan can help you make significant progress.",
  },
  {
    question: "I score low in Writing. How can you help?",
    questionEn: "I score low in Writing — how can you help?",
    answer: "Every writing task is reviewed individually. You receive detailed feedback, proven structures, vocabulary guidance, and practical exercises based on IELTS band descriptors.",
  },
  {
    question: "Will I get recordings if I miss a class?",
    questionEn: "Will I get recordings if I miss a class?",
    answer: "Yes. Class recordings, study materials, mock tests, and WhatsApp support are included, so you can review lessons at a convenient time.",
  },
  {
    question: "Why should I choose FluentLearner over other platforms?",
    questionEn: "Why should I choose FluentLearner over others?",
    answer: `You receive one-to-one mentoring, a proven track record of ${totalScorers}+ successful students and a ${successRate}% success rate, plus practical course plans at accessible prices.`,
  },
  {
    question: "Do you provide a certificate after course completion?",
    questionEn: "Do you provide a certificate after course completion?",
    answer: "Yes. Students who successfully complete a course receive a FluentLearner Certificate of Completion. Our primary goal, however, is helping you achieve your target IELTS band score.",
  },
  {
    question: "How do I pay? Can I pay in installments?",
    questionEn: "How do I pay? Can I pay in installments?",
    answer: "You can pay by bKash, Nagad, Rocket, or bank transfer. Installment options may be available; contact us on WhatsApp to discuss a suitable payment plan.",
  },
];

type FAQ = ReturnType<typeof getFaqs>[number];

function FAQItem({ faq, index, isVisible }: { faq: FAQ; index: number; isVisible: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border border-gray-100 rounded-xl overflow-hidden transition-all duration-500 ${
        open ? "bg-white shadow-md shadow-brand-red/5" : "bg-white hover:border-brand-red/20"
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: isVisible ? `${200 + index * 80}ms` : "0ms" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-5 text-left"
        aria-expanded={open}
      >
        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
          open ? "bg-brand-red text-white" : "bg-brand-red/8 text-brand-red"
        }`}>
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-brand-dark text-base font-bold leading-snug">
            {faq.question}
          </h3>
          <p className="text-brand-charcoal/40 font-body text-xs mt-0.5">{faq.questionEn}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-brand-charcoal/40 shrink-0 mt-1 transition-transform duration-300 ${
          open ? "rotate-180 text-brand-red" : ""
        }`} />
      </button>

      <div className={`overflow-hidden transition-all duration-400 ${
        open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="px-5 pb-5 pl-16">
          <p className="text-brand-charcoal/70 font-body text-sm leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const { totalScorers, successRate } = useSiteSettings();
  const faqs = getFaqs(
    totalScorers.toLocaleString("bn-BD"),
    successRate.toLocaleString("bn-BD"),
  );

  return (
    <section ref={ref} className="py-16 lg:py-24 bg-white relative">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left — Header */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <span
                className={`inline-block text-brand-red font-body text-sm font-bold uppercase tracking-[0.2em] mb-3 transition-all duration-600 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                Frequently Asked Questions
              </span>
              <h2
                className={`font-display text-brand-dark text-3xl sm:text-4xl font-extrabold leading-tight mb-4 transition-all duration-600 delay-100 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                Answers to your <span className="text-brand-red">questions</span>
              </h2>
              <p
                className={`text-brand-charcoal/60 font-body text-base leading-relaxed mb-6 transition-all duration-600 delay-200 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                Find answers to common questions about IELTS preparation. Contact us on WhatsApp if you need more help.
              </p>
              <a
                href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=Assalamu%20Alaikum%2C%20I%20have%20a%20question%20about%20FluentLearner%20courses`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white font-body font-bold text-sm rounded-lg hover:bg-brand-red-dark transition-all duration-300 shadow-md shadow-brand-red/20 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
              >
                Ask Another Question
              </a>
            </div>
          </div>

          {/* Right — FAQ Items */}
          <div className="lg:col-span-8 space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
