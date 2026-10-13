/** Shared card shapes and labels for the public website. */

export type CourseCard = {
  id: number;
  slug?: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  label: string;
  /** DB category key, used for filtering */
  category: string;
  price: string | null;
  duration: string | null;
  imageUrl: string | null;
};

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
    quote:
      "FluentLearner's structured approach and dedicated mentoring helped me achieve Band 8.0. The mock tests were incredibly helpful.",
  },
  {
    id: -2,
    name: "Lailun Tonny",
    band: "7.5",
    detail: "IELTS VIP",
    imageUrl: "/success-2.jpg",
    quote:
      "Really indebted to Zahid Bhai. His dedication and enthusiasm towards teaching is remarkable. FluentLearner is definitely the best choice.",
  },
  {
    id: -3,
    name: "Jannatul Ferdous Binti",
    band: "7.5",
    detail: "IELTS VIP",
    imageUrl: "/success-4.jpg",
    quote:
      "Thanks bhaiya and apu for your constant support. The guidance made all the difference in my IELTS preparation journey.",
  },
  {
    id: -4,
    name: "Orko Rahman",
    band: "7.0",
    detail: "Online VIP Batch",
    imageUrl: "/success-3.jpg",
    quote: null,
  },
  {
    id: -5,
    name: "Golam Imran",
    band: "7.0",
    detail: "VIP Batch",
    imageUrl: "/success-5.jpg",
    quote: null,
  },
  {
    id: -6,
    name: "Suprova Das Keya",
    band: "7.0",
    detail: "VIP Course · Online",
    imageUrl: "/success-6.jpg",
    quote: null,
  },
  {
    id: -7,
    name: "Raihan Rahmatullah",
    band: "7.5",
    detail: "Speaking · Online Batch",
    imageUrl: "/success-7.jpg",
    quote: null,
  },
];
