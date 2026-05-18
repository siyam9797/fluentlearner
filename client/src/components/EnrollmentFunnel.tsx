/**
 * EnrollmentFunnel — 4-Step Psychological Enrollment Modal
 * 
 * Psychology Layers Applied:
 * Step 1: Cognitive Ease + Micro-Commitment (Foot-in-the-Door)
 * Step 2: Reciprocity + Emotional Contagion + Social Proof
 * Step 3: Commitment Escalation + Anchoring
 * Step 4: Loss Aversion + Scarcity + Endowment Effect
 * 
 * WhatsApp Business: +880 1729-879855
 * WhatsApp message uses bold (*text*), italic (_text_), and numbered formatting
 */
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { X, GraduationCap, Globe, Briefcase, BookOpen, ChevronRight, ChevronLeft, Check, MessageCircle, Phone, Users, Clock, Shield, Star, Award } from "lucide-react";
import { CONTACT } from "@/lib/siteConstants";

// ============================================
// ENROLLMENT CONTEXT — Global trigger system
// ============================================
interface EnrollmentContextType {
  openFunnel: (preSelectedCourse?: string) => void;
}

const EnrollmentContext = createContext<EnrollmentContextType>({
  openFunnel: () => {},
});

export function useEnrollment() {
  return useContext(EnrollmentContext);
}

// ============================================
// DATA — Courses, Success Stories, Goals
// ============================================
const WHATSAPP_BUSINESS = CONTACT.WHATSAPP_BUSINESS;

const goals = [
  {
    id: "higher-education",
    icon: GraduationCap,
    label: "উচ্চশিক্ষা",
    sublabel: "বিদেশে পড়াশোনা",
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    borderActive: "border-blue-500",
  },
  {
    id: "immigration",
    icon: Globe,
    label: "ইমিগ্রেশন",
    sublabel: "বিদেশে বসবাস",
    color: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    borderActive: "border-emerald-500",
  },
  {
    id: "career",
    icon: Briefcase,
    label: "ক্যারিয়ার",
    sublabel: "চাকরি / পদোন্নতি",
    color: "from-amber-500 to-amber-600",
    bgLight: "bg-amber-50",
    borderActive: "border-amber-500",
  },
  {
    id: "general",
    icon: BookOpen,
    label: "জেনারেল",
    sublabel: "ইংরেজি দক্ষতা বৃদ্ধি",
    color: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-50",
    borderActive: "border-purple-500",
  },
];

const successStories: Record<string, {
  name: string;
  overall: string;
  scores: { L: string; R: string; W: string; S: string };
  quote: string;
  course: string;
  image: string;
}> = {
  "higher-education": {
    name: "Dr. Afroza",
    overall: "7.5",
    scores: { L: "9.0", R: "8.0", W: "7.0", S: "6.0" },
    quote: "FluentLearner-এর VIP Batch আমার IELTS যাত্রাকে সম্পূর্ণ বদলে দিয়েছে। Zahid ভাইয়ের one-to-one mentorship-এ আমি Listening-এ 9.0 পেয়েছি!",
    course: "IELTS VIP Course",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/OcZatZIzbKldgspI.jpg",
  },
  "immigration": {
    name: "Ataur Rahman",
    overall: "7.5",
    scores: { L: "8.5", R: "7.0", W: "7.5", S: "6.5" },
    quote: "ইমিগ্রেশনের জন্য IELTS-এ 7.5 দরকার ছিল — FluentLearner-এর সাথে প্রথম attempt-এই পেয়ে গেলাম। Zahid ভাইয়ের strategy অসাধারণ!",
    course: "IELTS VIP Course",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/EpaHLlGOlaZfdECi.jpg",
  },
  "career": {
    name: "Raihan Rahmatullah",
    overall: "7.0",
    scores: { L: "7.5", R: "7.0", W: "6.5", S: "7.5" },
    quote: "চাকরিতে promotion-এর জন্য IELTS লাগছিল। FluentLearner Online Batch-এ Speaking 7.5 পেয়েছি — যেটা আমার সবচেয়ে দুর্বল ছিল!",
    course: "Online VIP Batch",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/uiUZXAfGGquBfQxZ.jpg",
  },
  "general": {
    name: "Sajal Chaklader",
    overall: "8.0",
    scores: { L: "8.5", R: "8.0", W: "7.0", S: "7.5" },
    quote: "RUET থেকে পাস করে IELTS-এ 8.0 পেয়েছি FluentLearner-এর সাথে। Zahid ভাইয়ের teaching method সত্যিই unique!",
    course: "IELTS VIP Course",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/OcZatZIzbKldgspI.jpg",
  },
};

const courses = [
  {
    id: "ielts-vip-2m",
    name: "IELTS VIP Course (2 Months)",
    nameShort: "IELTS VIP — 2 মাস",
    price: "৳10,000",
    priceNum: 10000,
    duration: "2 মাস",
    features: ["৬০+ ক্লাস", "Full Mock Test", "1-to-1 Mentorship", "২৪/৭ সাপোর্ট"],
    badge: "সবচেয়ে জনপ্রিয়",
    recommended: ["higher-education", "immigration"],
  },
  {
    id: "ielts-vip-1m",
    name: "IELTS VIP Course (1 Month)",
    nameShort: "IELTS VIP — 1 মাস",
    price: "৳8,500",
    priceNum: 8500,
    duration: "1 মাস",
    features: ["৩০+ ক্লাস", "Mock Test", "Study Material", "সার্টিফিকেট"],
    badge: "দ্রুত প্রস্তুতি",
    recommended: ["career"],
  },
  {
    id: "grammar-spoken",
    name: "Basic Grammar & Spoken",
    nameShort: "Grammar & Spoken",
    price: "৳5,100",
    priceNum: 5100,
    duration: "2.5 মাস",
    features: ["Grammar Foundation", "Spoken Practice", "Recorded Classes", "সার্টিফিকেট"],
    badge: null,
    recommended: ["general"],
  },
  {
    id: "speaking-premium",
    name: "IELTS Speaking Premium",
    nameShort: "Speaking Premium",
    price: "৳2,600",
    priceNum: 2600,
    duration: "1 মাস",
    features: ["Speaking Focus", "1-to-1 Practice", "Mock Speaking Test", "Feedback"],
    badge: null,
    recommended: [],
  },
];

const educationLevels = [
  { value: "ssc", label: "SSC / সমমান" },
  { value: "hsc", label: "HSC / সমমান" },
  { value: "honours", label: "অনার্স / ব্যাচেলর" },
  { value: "masters", label: "মাস্টার্স / তদূর্ধ্ব" },
  { value: "other", label: "অন্যান্য" },
];

// ============================================
// ENROLLMENT FUNNEL COMPONENT
// ============================================
interface EnrollmentFunnelProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCourse?: string;
}

function EnrollmentFunnelModal({ isOpen, onClose, preSelectedCourse }: EnrollmentFunnelProps) {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse || "");
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    education: "",
    referral: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (!preSelectedCourse) {
        setStep(1);
        setSelectedGoal("");
        setSelectedCourse("");
      } else {
        // If pre-selected course, skip to step 3
        setStep(3);
        setSelectedCourse(preSelectedCourse);
        setSelectedGoal("");
      }
      setFormData({ name: "", whatsapp: "", education: "", referral: "" });
      setErrors({});
    }
  }, [isOpen, preSelectedCourse]);

  // Auto-select recommended course based on goal
  useEffect(() => {
    if (selectedGoal && !preSelectedCourse) {
      const recommended = courses.find(c => c.recommended.includes(selectedGoal));
      if (recommended) setSelectedCourse(recommended.id);
    }
  }, [selectedGoal, preSelectedCourse]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const animateStep = useCallback((newStep: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setIsAnimating(false);
    }, 200);
  }, []);

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "আপনার নাম লিখুন";
    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "হোয়াটসঅ্যাপ নম্বর দিন";
    } else if (!/^01[3-9]\d{8}$/.test(formData.whatsapp.replace(/[\s-]/g, ""))) {
      newErrors.whatsapp = "সঠিক ১১ সংখ্যার নম্বর দিন (01XXXXXXXXX)";
    }
    if (!formData.education) newErrors.education = "শিক্ষাগত যোগ্যতা নির্বাচন করুন";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSelectedCourseData = () => courses.find(c => c.id === selectedCourse) || courses[0];

  const buildWhatsAppMessage = () => {
    const course = getSelectedCourseData();
    const goalLabel = goals.find(g => g.id === selectedGoal)?.label || "উল্লেখ নেই";
    const eduLabel = educationLevels.find(e => e.value === formData.education)?.label || "উল্লেখ নেই";
    const referralText = formData.referral.trim() || "সরাসরি ওয়েবসাইট থেকে";

    // WhatsApp formatting: *bold*, _italic_, numbered list
    const message = `🎓 *নতুন ভর্তি আবেদন — FluentLearner*

━━━━━━━━━━━━━━━━━━━━━━
📋 *আবেদনকারীর তথ্য:*
━━━━━━━━━━━━━━━━━━━━━━

1️⃣ *নাম:* ${formData.name}
2️⃣ *হোয়াটসঅ্যাপ:* ${formData.whatsapp}
3️⃣ *শিক্ষা:* ${eduLabel}
4️⃣ *IELTS উদ্দেশ্য:* ${goalLabel}

━━━━━━━━━━━━━━━━━━━━━━
📚 *নির্বাচিত কোর্স:*
━━━━━━━━━━━━━━━━━━━━━━

✅ *${course.name}*
💰 মূল্য: *${course.price}*
⏱️ সময়কাল: ${course.duration}

━━━━━━━━━━━━━━━━━━━━━━
📌 *রেফারেল:* ${referralText}
━━━━━━━━━━━━━━━━━━━━━━

_আমি ভর্তি হতে আগ্রহী! অনুগ্রহ করে পরবর্তী ধাপ জানান।_ 🙏`;

    return `https://wa.me/${WHATSAPP_BUSINESS}?text=${encodeURIComponent(message)}`;
  };

  if (!isOpen) return null;

  const progressWidth = preSelectedCourse
    ? step === 3 ? "50%" : "100%"
    : `${(step / 4) * 100}%`;

  const totalSteps = preSelectedCourse ? 2 : 4;
  const currentStepDisplay = preSelectedCourse
    ? step === 3 ? 1 : 2
    : step;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl shadow-brand-dark/20 overflow-hidden transition-all duration-300 ${
          isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-brand-red to-brand-red-light transition-all duration-700 ease-out"
            style={{ width: progressWidth }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-red/10 rounded-full flex items-center justify-center">
              <span className="text-brand-red font-display font-bold text-sm">{currentStepDisplay}/{totalSteps}</span>
            </div>
            <p className="text-brand-charcoal/50 font-body text-sm">
              {step === 1 && "আপনার লক্ষ্য জানান"}
              {step === 2 && "সাফল্যের গল্প"}
              {step === 3 && "আপনার তথ্য"}
              {step === 4 && "ভর্তি নিশ্চিত করুন"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-brand-charcoal/40" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {/* ===== STEP 1: Goal Selection ===== */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center pt-2">
                <h2 className="font-display text-2xl font-bold text-brand-dark">
                  আপনার IELTS যাত্রা শুরু করুন
                </h2>
                <p className="text-brand-charcoal/60 font-body text-sm mt-2">
                  আপনার IELTS এর উদ্দেশ্য কী? নিচে থেকে বেছে নিন
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                        isSelected
                          ? `${goal.borderActive} ${goal.bgLight} shadow-md`
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${goal.color} flex items-center justify-center mb-3 shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-display font-bold text-brand-dark text-sm">
                        {goal.label}
                      </h3>
                      <p className="text-brand-charcoal/50 font-body text-xs mt-0.5">
                        {goal.sublabel}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brand-red rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 text-brand-charcoal/40 font-body text-xs pt-2">
                <Users className="w-3.5 h-3.5" />
                <span>এই সপ্তাহে ২৩ জন শিক্ষার্থী ভর্তি হয়েছেন</span>
              </div>

              <button
                onClick={() => selectedGoal && animateStep(2)}
                disabled={!selectedGoal}
                className={`w-full py-3.5 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  selectedGoal
                    ? "bg-brand-red text-white shadow-lg shadow-brand-red/25 hover:bg-brand-red-dark hover:shadow-xl"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                পরবর্তী ধাপ
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ===== STEP 2: Success Story ===== */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center pt-2">
                <h2 className="font-display text-2xl font-bold text-brand-dark">
                  আপনিও পারবেন! 🎉
                </h2>
                <p className="text-brand-charcoal/60 font-body text-sm mt-2">
                  আপনার মতো লক্ষ্য নিয়ে যারা সফল হয়েছেন
                </p>
              </div>

              {(() => {
                const story = successStories[selectedGoal] || successStories["higher-education"];
                return (
                  <div className="bg-gradient-to-br from-brand-cream to-white rounded-xl border border-brand-red/10 overflow-hidden">
                    {/* Student card */}
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                          <img
                            src={story.image}
                            alt={story.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23dc2626'%3E%3Crect width='64' height='64' rx='12' fill='%23fef2f2'/%3E%3Ctext x='32' y='38' text-anchor='middle' font-size='24' fill='%23dc2626'%3E🎓%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-brand-dark text-base">{story.name}</h3>
                            <div className="px-2 py-0.5 bg-brand-red text-white rounded-full text-xs font-display font-bold">
                              Band {story.overall}
                            </div>
                          </div>
                          <p className="text-brand-charcoal/50 font-body text-xs mt-1">{story.course}</p>
                        </div>
                      </div>

                      {/* Band score breakdown */}
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {Object.entries(story.scores).map(([key, val]) => (
                          <div key={key} className="text-center bg-white rounded-lg py-2 border border-gray-100">
                            <p className="text-brand-charcoal/40 font-body text-[10px] uppercase tracking-wider">{key === "L" ? "Listening" : key === "R" ? "Reading" : key === "W" ? "Writing" : "Speaking"}</p>
                            <p className="font-display font-bold text-brand-dark text-lg">{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Quote */}
                      <div className="mt-4 relative">
                        <div className="absolute -top-1 -left-1 text-brand-red/20 text-3xl font-serif">"</div>
                        <p className="text-brand-charcoal/70 font-body text-sm italic pl-5 leading-relaxed">
                          {story.quote}
                        </p>
                      </div>
                    </div>

                    {/* Social proof footer */}
                    <div className="bg-brand-red/5 px-5 py-3 flex items-center gap-2 border-t border-brand-red/10">
                      <Award className="w-4 h-4 text-brand-red" />
                      <span className="text-brand-charcoal/60 font-body text-xs">
                        এই মাসে ১২ জন শিক্ষার্থী এই কোর্সে ভর্তি হয়েছেন
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => animateStep(1)}
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 text-brand-charcoal/60 font-display font-bold text-sm flex items-center gap-1 hover:border-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  পেছনে
                </button>
                <button
                  onClick={() => animateStep(3)}
                  className="flex-1 py-3.5 rounded-xl bg-brand-red text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 hover:bg-brand-red-dark hover:shadow-xl transition-all duration-300"
                >
                  আপনার জন্য সেরা কোর্সটি দেখুন
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Course + Info ===== */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center pt-2">
                <h2 className="font-display text-xl font-bold text-brand-dark">
                  {preSelectedCourse ? "আপনার তথ্য দিন" : "আপনার জন্য প্রস্তাবিত কোর্স"}
                </h2>
                <p className="text-brand-charcoal/60 font-body text-sm mt-1">
                  {preSelectedCourse ? "ভর্তি সম্পন্ন করতে নিচের তথ্যগুলো দিন" : "কোর্স নির্বাচন করুন এবং আপনার তথ্য দিন"}
                </p>
              </div>

              {/* Course Selection */}
              {!preSelectedCourse && (
                <div className="space-y-2">
                  <p className="font-body text-xs text-brand-charcoal/50 font-medium uppercase tracking-wider">কোর্স নির্বাচন করুন</p>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {courses.map((course) => {
                      const isSelected = selectedCourse === course.id;
                      const isRecommended = course.recommended.includes(selectedGoal);
                      return (
                        <button
                          key={course.id}
                          onClick={() => setSelectedCourse(course.id)}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-300 flex items-center justify-between ${
                            isSelected
                              ? "border-brand-red bg-brand-red/5 shadow-sm"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected ? (
                              <div className="w-5 h-5 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-brand-dark text-sm">{course.nameShort}</span>
                                {isRecommended && (
                                  <span className="px-1.5 py-0.5 bg-brand-red text-white text-[10px] font-display font-bold rounded-full">
                                    প্রস্তাবিত
                                  </span>
                                )}
                                {course.badge && !isRecommended && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-display font-bold rounded-full">
                                    {course.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-brand-charcoal/40 font-body text-xs">{course.duration}</span>
                            </div>
                          </div>
                          <span className="font-display font-bold text-brand-red text-sm">{course.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-3">
                <p className="font-body text-xs text-brand-charcoal/50 font-medium uppercase tracking-wider">আপনার তথ্য</p>

                {/* Name */}
                <div>
                  <input
                    type="text"
                    placeholder="আপনার পূর্ণ নাম *"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-body text-sm text-brand-dark placeholder:text-brand-charcoal/30 focus:outline-none transition-colors ${
                      errors.name ? "border-red-400 bg-red-50/50" : "border-gray-200 focus:border-brand-red bg-white"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs font-body mt-1 pl-1">{errors.name}</p>}
                </div>

                {/* WhatsApp */}
                <div>
                  <div className={`flex items-center rounded-xl border-2 overflow-hidden transition-colors ${
                    errors.whatsapp ? "border-red-400 bg-red-50/50" : "border-gray-200 focus-within:border-brand-red bg-white"
                  }`}>
                    <span className="px-3 py-3 bg-gray-50 text-brand-charcoal/50 font-body text-sm border-r border-gray-200">+88</span>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX *"
                      value={formData.whatsapp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
                        setFormData(prev => ({ ...prev, whatsapp: val }));
                        if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: "" }));
                      }}
                      className="flex-1 px-3 py-3 font-body text-sm text-brand-dark placeholder:text-brand-charcoal/30 focus:outline-none bg-transparent"
                    />
                  </div>
                  <p className="text-brand-charcoal/40 text-xs font-body mt-1 pl-1">
                    {errors.whatsapp || "আমরা এই নম্বরে কোর্সের বিস্তারিত পাঠাব"}
                  </p>
                </div>

                {/* Education */}
                <div>
                  <select
                    value={formData.education}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, education: e.target.value }));
                      if (errors.education) setErrors(prev => ({ ...prev, education: "" }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-body text-sm appearance-none transition-colors ${
                      errors.education ? "border-red-400 bg-red-50/50" : "border-gray-200 focus:border-brand-red bg-white"
                    } ${formData.education ? "text-brand-dark" : "text-brand-charcoal/30"}`}
                  >
                    <option value="" disabled>শিক্ষাগত যোগ্যতা নির্বাচন করুন *</option>
                    {educationLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  {errors.education && <p className="text-red-500 text-xs font-body mt-1 pl-1">{errors.education}</p>}
                </div>

                {/* Referral */}
                <div>
                  <input
                    type="text"
                    placeholder="কে আপনাকে জানিয়েছে? (ঐচ্ছিক)"
                    value={formData.referral}
                    onChange={(e) => setFormData(prev => ({ ...prev, referral: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-body text-sm text-brand-dark placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-red bg-white transition-colors"
                  />
                  <p className="text-brand-charcoal/40 text-xs font-body mt-1 pl-1">বন্ধু, পরিবার বা শিক্ষকের নাম</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                {!preSelectedCourse && (
                  <button
                    onClick={() => animateStep(2)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 text-brand-charcoal/60 font-display font-bold text-sm flex items-center gap-1 hover:border-gray-300 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    পেছনে
                  </button>
                )}
                <button
                  onClick={() => {
                    if (validateStep3()) animateStep(4);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-brand-red text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 hover:bg-brand-red-dark hover:shadow-xl transition-all duration-300"
                >
                  ভর্তি নিশ্চিত করুন
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 4: Confirmation ===== */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center pt-2">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="font-display text-xl font-bold text-brand-dark">
                  আপনার IELTS প্ল্যান তৈরি! 🎉
                </h2>
                <p className="text-brand-charcoal/60 font-body text-sm mt-1">
                  নিচের বাটনে ক্লিক করে ভর্তি সম্পন্ন করুন
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-brand-cream to-white rounded-xl border border-brand-red/15 overflow-hidden">
                <div className="bg-brand-red/5 px-5 py-3 border-b border-brand-red/10">
                  <h3 className="font-display font-bold text-brand-dark text-sm">আপনার ভর্তি সারাংশ</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-charcoal/50 font-body text-sm">নাম</span>
                    <span className="font-display font-bold text-brand-dark text-sm">{formData.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-charcoal/50 font-body text-sm">কোর্স</span>
                    <span className="font-display font-bold text-brand-red text-sm">{getSelectedCourseData().nameShort}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-charcoal/50 font-body text-sm">মূল্য</span>
                    <span className="font-display font-bold text-brand-dark text-lg">{getSelectedCourseData().price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-charcoal/50 font-body text-sm">সময়কাল</span>
                    <span className="font-body font-medium text-brand-dark text-sm">{getSelectedCourseData().duration}</span>
                  </div>

                  {/* Features */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {getSelectedCourseData().features.map((f, i) => (
                        <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-body font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Urgency */}
                <div className="bg-red-50 px-5 py-3 border-t border-brand-red/10 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-red animate-pulse" />
                  <span className="text-brand-red font-body text-xs font-semibold">
                    পরবর্তী ব্যাচ শুরু: ১৫ মার্চ ২০২৬ — মাত্র ৫টি আসন বাকি!
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {/* Primary: WhatsApp */}
                <a
                  href={buildWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-xl bg-[#25D366] text-white font-display font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/25 hover:bg-[#22c55e] hover:shadow-xl transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5" />
                  এখনই WhatsApp-এ ভর্তি নিশ্চিত করুন
                </a>

                {/* Secondary: Call */}
                <a
                  href={`tel:${CONTACT.PHONE_TEL}`}
                  className="w-full py-3.5 rounded-xl border-2 border-gray-200 text-brand-charcoal/70 font-display font-bold text-sm flex items-center justify-center gap-2 hover:border-brand-red hover:text-brand-red transition-all duration-300"
                >
                  <Phone className="w-4 h-4" />
                  কল করে জানুন — {CONTACT.PHONE_SHORT}
                </a>
              </div>

              {/* Guarantee */}
              <div className="flex items-start gap-3 bg-green-50/50 rounded-xl p-4 border border-green-200/50">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-green-800 text-xs">১০০% সন্তুষ্টি গ্যারান্টি</p>
                  <p className="text-green-700/70 font-body text-xs mt-0.5">
                    প্রথম ৩ দিনে সন্তুষ্ট না হলে সম্পূর্ণ টাকা ফেরত — কোনো প্রশ্ন নেই
                  </p>
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={() => animateStep(3)}
                className="w-full py-2 text-brand-charcoal/40 font-body text-xs hover:text-brand-charcoal/60 transition-colors"
              >
                ← তথ্য পরিবর্তন করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROVIDER COMPONENT — Wraps the app
// ============================================
export function EnrollmentProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preSelectedCourse, setPreSelectedCourse] = useState<string | undefined>();

  const openFunnel = useCallback((courseId?: string) => {
    setPreSelectedCourse(courseId);
    setIsOpen(true);
  }, []);

  return (
    <EnrollmentContext.Provider value={{ openFunnel }}>
      {children}
      <EnrollmentFunnelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        preSelectedCourse={preSelectedCourse}
      />
    </EnrollmentContext.Provider>
  );
}
