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
    question: "অনলাইন কোর্সে কি সত্যিই ভালো ফলাফল পাওয়া সম্ভব?",
    questionEn: "Can I really get good results from an online course?",
    answer: `অবশ্যই! আমাদের ${totalScorers}+ সফল শিক্ষার্থীর বেশিরভাগই অনলাইন ব্যাচ থেকে। অনলাইনে one-to-one mentoring-এ আপনি আরও বেশি ব্যক্তিগত মনোযোগ পান। Sajal Chaklader (Band 8.0, RUET) এবং Dr Milon Chowdhury (Band 8.0) — দুজনেই আমাদের অনলাইন VIP ব্যাচ থেকে এই স্কোর অর্জন করেছেন।`,
  },
  {
    question: "কোর্সের মেয়াদ কতদিন? আমি কি ১ মাসে IELTS প্রস্তুতি নিতে পারব?",
    questionEn: "How long is the course? Can I prepare in 1 month?",
    answer: "আমাদের IELTS VIP Course-এ দুটি প্ল্যান আছে — Plan A (১ মাস, ৳৮,৫০০) এবং Plan B (২ মাস, ৳১০,০০০)। যদি আপনার ইংরেজির ভিত্তি মোটামুটি ভালো থাকে, তাহলে ১ মাসেই Band 7.0+ সম্ভব। Dr Milon Chowdhury মাত্র ১৫ দিনের কোচিং-এ Band 8.0 পেয়েছেন!",
  },
  {
    question: "Writing-এ কম স্কোর আসে — আপনারা কিভাবে সাহায্য করবেন?",
    questionEn: "I score low in Writing — how can you help?",
    answer: "Writing হলো বেশিরভাগ বাংলাদেশি শিক্ষার্থীর দুর্বল জায়গা। আমাদের VIP কোর্সে প্রতিটি Writing Task আলাদাভাবে review করা হয়, detailed feedback দেওয়া হয়, এবং proven templates শেখানো হয়। আমাদের শিক্ষার্থীরা গড়ে Writing-এ 6.0-7.0 পাচ্ছেন, যা বেশিরভাগ university requirement পূরণ করে।",
  },
  {
    question: "আমি কি ক্লাস মিস করলে রেকর্ডিং পাব?",
    questionEn: "Will I get recordings if I miss a class?",
    answer: "হ্যাঁ! প্রতিটি ক্লাসের রেকর্ডিং দেওয়া হয়। এছাড়াও Study Material, Mock Test, এবং ২৪/৭ WhatsApp সাপোর্ট পাবেন। আপনি যেকোনো সময় আপনার সুবিধামতো ক্লাস দেখতে পারবেন।",
  },
  {
    question: "অন্যান্য প্ল্যাটফর্মের তুলনায় FluentLearner কেন বেছে নেব?",
    questionEn: "Why should I choose FluentLearner over others?",
    answer: `তিনটি কারণে: (১) One-to-One Mentoring — গ্রুপ ক্লাসে ব্যক্তিগত মনোযোগ পাওয়া যায় না, আমরা প্রতিটি শিক্ষার্থীর দুর্বলতা আলাদাভাবে address করি। (২) Proven Track Record — ${totalScorers}+ সফল শিক্ষার্থী, ${successRate}% সাফল্যের হার। (৩) Affordable Pricing — মাত্র ৳৮,৫০০ থেকে শুরু, যা অন্যান্য VIP কোর্সের তুলনায় অনেক কম।`,
  },
  {
    question: "কোর্স শেষে কি সার্টিফিকেট দেওয়া হয়?",
    questionEn: "Do you provide a certificate after course completion?",
    answer: "হ্যাঁ, কোর্স সফলভাবে সম্পন্ন করলে FluentLearner থেকে একটি Certificate of Completion দেওয়া হয়। তবে মনে রাখবেন, আসল সার্টিফিকেট হলো আপনার IELTS Band Score — এবং সেটাই আমাদের মূল লক্ষ্য।",
  },
  {
    question: "পেমেন্ট কিভাবে করব? কিস্তিতে দেওয়া যাবে?",
    questionEn: "How do I pay? Can I pay in installments?",
    answer: "bKash, Nagad, Rocket, বা Bank Transfer-এ পেমেন্ট করতে পারবেন। কিস্তির ব্যবস্থাও আছে — বিস্তারিত জানতে WhatsApp-এ যোগাযোগ করুন (01301-872288)। আমরা আপনার সুবিধামতো পেমেন্ট প্ল্যান তৈরি করে দেব।",
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
                সচরাচর জিজ্ঞাসা
              </span>
              <h2
                className={`font-display text-brand-dark text-3xl sm:text-4xl font-extrabold leading-tight mb-4 transition-all duration-600 delay-100 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                আপনার প্রশ্নের <span className="text-brand-red">উত্তর</span>
              </h2>
              <p
                className={`text-brand-charcoal/60 font-body text-base leading-relaxed mb-6 transition-all duration-600 delay-200 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                IELTS প্রস্তুতি নিয়ে আপনার মনে যে প্রশ্নগুলো আসতে পারে, তার উত্তর এখানে পাবেন। আরও কিছু জানতে চাইলে সরাসরি WhatsApp-এ জিজ্ঞেস করুন।
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
                আরও প্রশ্ন আছে? জিজ্ঞেস করুন
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
