/**
 * Static fallback content for /home-2.
 * Shown whenever the database returns nothing (e.g. local dev without seed data).
 */
import { PRICING } from "@/lib/siteConstants";

export type CourseCard = {
  id: number;
  slug?: string | null;
  title: string;
  description: string | null;
  label: string;
  /** DB category key, used for filtering */
  category: string;
  price: string | null;
  duration: string | null;
  imageUrl: string | null;
};

export const FALLBACK_COURSES: CourseCard[] = [
  {
    id: -1,
    title: "IELTS VIP Course — Plan A",
    description: "One month of intensive one-to-one IELTS mentoring across all four modules",
    label: "IELTS",
    category: "ielts",
    price: PRICING.VIP_1M,
    duration: "1 month",
    imageUrl: null,
  },
  {
    id: -2,
    title: "IELTS VIP Course — Plan B",
    description: "Two months of structured preparation with mock tests and detailed writing feedback",
    label: "IELTS",
    category: "ielts",
    price: PRICING.VIP_2M,
    duration: "2 months",
    imageUrl: null,
  },
  {
    id: -3,
    title: "Basic Grammar & Spoken English",
    description: "Build a solid grammar foundation and speak English with everyday confidence",
    label: "Spoken English",
    category: "spoken",
    price: PRICING.GRAMMAR,
    duration: null,
    imageUrl: null,
  },
  {
    id: -4,
    title: "IELTS Speaking Premium",
    description: "Focused speaking practice with a mentor to lift fluency, pronunciation and band score",
    label: "Speaking",
    category: "ielts",
    price: PRICING.SPEAKING,
    duration: null,
    imageUrl: null,
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  ielts: "IELTS",
  spoken: "Spoken English",
  grammar: "Grammar",
  "study-abroad": "Study Abroad",
  other: "Course",
};

export type StoryCard = {
  id: number;
  name: string;
  band: string | null;
  detail: string | null;
  imageUrl: string;
  quote: string | null;
  category?: string;
  date?: string | null;
};

export const STORY_CATEGORY_LABELS: Record<string, string> = {
  "ielts-score": "IELTS Score",
  "visa-success": "Visa Success",
  "university-admission": "University",
  "spoken-english": "Spoken English",
  other: "Achievement",
};

export const FALLBACK_STORIES: StoryCard[] = [
  {
    id: -1,
    name: "Sajal Chaklader",
    band: "8.0",
    detail: "IELTS VIP · RUET",
    imageUrl: "/success-1.jpg",
    quote: "FluentLearner's structured approach and dedicated mentoring helped me achieve Band 8.0. The mock tests were incredibly helpful.",
  },
  {
    id: -2,
    name: "Lailun Tonny",
    band: "7.5",
    detail: "IELTS VIP",
    imageUrl: "/success-2.jpg",
    quote: "Really indebted to Zahid Bhai. His dedication and enthusiasm towards teaching is remarkable. FluentLearner is definitely the best choice.",
  },
  {
    id: -3,
    name: "Jannatul Ferdous Binti",
    band: "7.5",
    detail: "IELTS VIP",
    imageUrl: "/success-4.jpg",
    quote: "Thanks bhaiya and apu for your constant support. The guidance made all the difference in my IELTS preparation journey.",
  },
  { id: -4, name: "Orko Rahman", band: "7.0", detail: "Online VIP Batch", imageUrl: "/success-3.jpg", quote: null },
  { id: -5, name: "Golam Imran", band: "7.0", detail: "VIP Batch", imageUrl: "/success-5.jpg", quote: null },
  { id: -6, name: "Suprova Das Keya", band: "7.0", detail: "VIP Course · Online", imageUrl: "/success-6.jpg", quote: null },
  { id: -7, name: "Raihan Rahmatullah", band: "7.5", detail: "Speaking · Online Batch", imageUrl: "/success-7.jpg", quote: null },
];

export function getGeneralFaqs(scorers: string, successRate: string) {
  return [
    {
      question: "Can I really get good results from an online course?",
      answer: `Absolutely. Most of our ${scorers}+ successful students joined online batches. One-to-one mentoring gives you focused attention, structured feedback and direct support from your mentor.`,
    },
    {
      question: "How long is the course? Can I prepare in one month?",
      answer: "Our IELTS VIP Course offers Plan A for one month and Plan B for two months. If your English foundation is already solid, an intensive one-month plan can help you make significant progress.",
    },
    {
      question: "I score low in Writing. How can you help?",
      answer: "Every writing task is reviewed individually. You receive detailed feedback, proven structures, vocabulary guidance and practical exercises based on the IELTS band descriptors.",
    },
    {
      question: "Will I get recordings if I miss a class?",
      answer: "Yes. Class recordings, study materials, mock tests and WhatsApp support are included, so you can review lessons at a convenient time.",
    },
    {
      question: "Why should I choose FluentLearner over other platforms?",
      answer: `You get one-to-one mentoring, a proven track record of ${scorers}+ successful students and a ${successRate}% success rate, plus practical course plans at accessible prices.`,
    },
    {
      question: "Do you provide a certificate after course completion?",
      answer: "Yes. Students who complete a course receive a FluentLearner Certificate of Completion. Our main goal, however, is helping you reach your target IELTS band score.",
    },
    {
      question: "How do I pay? Can I pay in installments?",
      answer: "You can pay by bKash, Nagad, Rocket or bank transfer. Installment options may be available — contact us on WhatsApp to discuss a suitable payment plan.",
    },
  ];
}
