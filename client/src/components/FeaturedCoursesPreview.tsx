/**
 * FeaturedCoursesPreview — Shows featured courses from DB on home page
 * Falls back to static courses if DB is empty
 */
import { trpc } from "@/lib/trpc";

import { BookOpen, Clock, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

// Static fallback courses (shown when DB has no featured courses)
const staticCourses = [
  {
    id: -1,
    name: "IELTS সম্পূর্ণ প্রস্তুতি",
    nameEn: "IELTS Complete Preparation",
    shortDescription: "Listening, Reading, Writing, Speaking — সব মডিউলের সম্পূর্ণ প্রস্তুতি",
    price: "৳8,500",
    originalPrice: "৳12,000",
    duration: "2 মাস",
    badge: "Most Popular",
    badgeColor: "bg-red-500",
    features: ["1-on-1 মেন্টরশিপ", "মক টেস্ট", "স্টাডি ম্যাটেরিয়াল"],
    category: "ielts",
    imageUrl: null,
  },
  {
    id: -2,
    name: "Spoken English Mastery",
    nameEn: "Spoken English Mastery",
    shortDescription: "আত্মবিশ্বাসের সাথে ইংরেজিতে কথা বলুন — ৩০ দিনে পরিবর্তন দেখুন",
    price: "৳5,000",
    originalPrice: "৳7,500",
    duration: "1 মাস",
    badge: "Trending",
    badgeColor: "bg-green-500",
    features: ["Daily Practice", "Real Conversation", "Pronunciation Guide"],
    category: "spoken",
    imageUrl: null,
  },
  {
    id: -3,
    name: "IELTS VIP Batch",
    nameEn: "IELTS VIP Batch",
    shortDescription: "সর্বোচ্চ ১০ জনের ব্যাচে ব্যক্তিগত মনোযোগ ও গ্যারান্টিড স্কোর",
    price: "৳15,000",
    originalPrice: "৳20,000",
    duration: "3 মাস",
    badge: "Premium",
    badgeColor: "bg-purple-500",
    features: ["Max 10 Students", "Guaranteed Score", "Extra Mock Tests"],
    category: "ielts",
    imageUrl: null,
  },
];

export default function FeaturedCoursesPreview() {
  const { data: featuredCourses, isLoading } = trpc.courses.featured.useQuery();
  const [, setLocation] = useLocation();

  // Use DB courses if available, otherwise static
  const displayCourses = featuredCourses && featuredCourses.length > 0 ? featuredCourses : staticCourses;

  const handleEnroll = (course: any) => {
    if (course.id > 0) {
      setLocation(`/enroll?courseId=${course.id}`);
    } else {
      setLocation('/enroll');
    }
  };

  return (
    <section id="courses" className="py-16 bg-gray-50">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-brand-red/10 text-brand-red px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            আমাদের কোর্সসমূহ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-3" style={{ fontFamily: "var(--font-display)" }}>
            আপনার লক্ষ্যে পৌঁছানোর <span className="text-brand-red">সঠিক পথ</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            আন্তর্জাতিক মানের কারিকুলাম ও অভিজ্ঞ মেন্টরের সাথে আপনার IELTS ও English দক্ষতা গড়ে তুলুন
          </p>
        </div>

        {/* Course Cards */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden">
                <div className="h-40 bg-gray-200" />
                <div className="p-6">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayCourses.slice(0, 3).map((course: any) => (
              <div
                key={course.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-red/20 hover:shadow-xl transition-all duration-300"
              >
                {/* Image or Gradient */}
                {course.imageUrl ? (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={course.imageUrl}
                      alt={`${course.name} কোর্সের ছবি`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {course.badge && (
                      <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full ${course.badgeColor || "bg-brand-red"}`}>
                        {course.badge}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative h-40 bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-brand-red/30" />
                    {course.badge && (
                      <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full ${course.badgeColor || "bg-brand-red"}`}>
                        {course.badge}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <h3
                    className="text-lg font-bold text-gray-900 group-hover:text-brand-red transition-colors mb-1 cursor-pointer"
                    style={{ fontFamily: "var(--font-display)" }}
                    onClick={() => { if (course.slug) setLocation(`/courses/${course.slug}`); }}
                  >
                    {course.name}
                  </h3>
                  {course.nameEn && course.nameEn !== course.name && (
                    <p className="text-xs text-gray-500 mb-2">{course.nameEn}</p>
                  )}
                  {course.shortDescription && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.shortDescription}</p>
                  )}

                  {/* Features */}
                  {course.features && (course.features as string[]).length > 0 && (
                    <div className="space-y-1 mb-4">
                      {(course.features as string[]).slice(0, 3).map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price & Duration */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {course.price && <span className="text-lg font-bold text-brand-red">{course.price}</span>}
                      {course.originalPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">{course.originalPrice}</span>
                      )}
                    </div>
                    {course.duration && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" /> {course.duration}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex gap-2">
                    {course.slug && (
                      <button
                        onClick={() => setLocation(`/courses/${course.slug}`)}
                        className="flex-1 flex items-center justify-center gap-1 border border-brand-red/30 text-brand-red hover:bg-brand-red/5 py-2.5 rounded-lg text-sm font-medium transition-all"
                      >
                        বিস্তারিত
                      </button>
                    )}
                    <button
                      onClick={() => handleEnroll(course)}
                      className={`${course.slug ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-all`}
                    >
                      ভর্তি হন
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => setLocation("/courses")}
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white rounded-lg font-semibold transition-all duration-300"
          >
            সব কোর্স দেখুন
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
