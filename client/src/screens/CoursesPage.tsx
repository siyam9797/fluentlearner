import { OLD_COURSES } from "@/old-site/content";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOHead from "@/components/SEOHead";
import { CONTACT, SITE_STATS } from "@/lib/siteConstants";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Target,
  Award,
  Sparkles,
  MessageCircle,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "@/lib/router";

const categoryFilters = [
  { key: "all", label: "All Courses", labelEn: "All Courses" },
  { key: "ielts", label: "IELTS", labelEn: "IELTS" },
  { key: "spoken", label: "Spoken English", labelEn: "Spoken English" },
  { key: "grammar", label: "Grammar", labelEn: "Grammar" },
  { key: "study-abroad", label: "Study Abroad", labelEn: "Study Abroad" },
];

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all: "All Levels",
};

export default function CoursesPage() {
  const courses = OLD_COURSES;
  const isLoading = false;
  const [activeFilter, setActiveFilter] = useState("all");
  const [, navigate] = useLocation();

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (activeFilter === "all") return courses;
    return courses.filter((c) => c.category === activeFilter);
  }, [courses, activeFilter]);

  const handleEnroll = (course: any) => {
    navigate(`/enroll?courseId=${course.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOHead
        title="Courses | FluentLearner - IELTS & Spoken English"
        description={`${SITE_STATS.TOTAL_SCORERS}+ successful students trust our IELTS, Spoken English, Grammar, and Study Abroad courses.`}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-red-deep via-brand-red-dark to-brand-red overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm mb-6">
              <GraduationCap className="h-4 w-4" />
              International-standard course curriculum
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Choose the right course for you
              <br />
              <span className="text-yellow-300"></span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              Expert-led courses designed to help you achieve your target IELTS score
              and master English communication skills.
            </p>
            <div className="flex items-center justify-center gap-6 mt-8 text-white/70 text-sm">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> {SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ Students
              </span>
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4" /> {SITE_STATS.SUCCESS_RATE}% Success Rate
              </span>
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" /> {SITE_STATS.AVG_BAND_SCORE} Average Score
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[72px] z-20 bg-white border-b shadow-sm">
        <div className="container py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            {categoryFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.key
                    ? "bg-brand-red text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="container py-12">
        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-6 border border-t-0 rounded-b-2xl">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No courses found</h3>
            <p className="text-gray-500">No courses have been added to this category yet.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-red/30 hover:shadow-xl transition-all duration-300">
                  {/* Image */}
                  {course.imageUrl ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={course.imageUrl}
                        alt={`${course.nameEn || course.name} course image`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {course.badge && (
                        <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full ${course.badgeColor || "bg-brand-red"}`}>
                          {course.badge}
                        </span>
                      )}
                      {course.level && (
                        <span className="absolute top-3 right-3 px-2 py-1 text-xs bg-white/90 text-gray-700 rounded-full">
                          {levelLabels[course.level]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-brand-red/30" />
                      {course.badge && (
                        <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full ${course.badgeColor || "bg-brand-red"}`}>
                          {course.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3
                        className="text-lg font-bold text-gray-900 group-hover:text-brand-red transition-colors cursor-pointer"
                        style={{ fontFamily: "var(--font-display)" }}
                        onClick={(e) => { e.stopPropagation(); if (course.slug) navigate(`/old/courses/${course.slug}`); }}
                      >
                        {course.nameEn || course.name}
                      </h3>
                      {course.nameEn && (
                        <p className="text-sm text-gray-500 mt-0.5">{course.nameEn}</p>
                      )}
                    </div>

                    {course.shortDescription && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.shortDescription}</p>
                    )}

                    {/* Features */}
                    {course.features && (course.features as string[]).length > 0 && (
                      <div className="space-y-1.5 mb-4">
                        {(course.features as string[]).slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {(course.features as string[]).length > 3 && (
                          <p className="text-xs text-brand-red ml-6">+{(course.features as string[]).length - 3} more</p>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {course.duration}
                        </span>
                      )}
                      {course.maxStudents && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> Max {course.maxStudents} students
                        </span>
                      )}
                      {course.schedule && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> {course.schedule}
                        </span>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        {course.price && (
                          <span className="text-xl font-bold text-brand-red">{course.price}</span>
                        )}
                        {course.originalPrice && (
                          <span className="text-sm text-gray-400 line-through ml-2">{course.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {course.slug && (
                          <button
                            onClick={() => navigate(`/old/courses/${course.slug}`)}
                            className="flex items-center gap-1 text-brand-red border border-brand-red/30 hover:bg-brand-red/5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                          >
                            View Details
                          </button>
                        )}
                        <button
                          onClick={() => handleEnroll(course)}
                          className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:shadow-lg"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Enroll
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-brand-red-deep to-brand-red py-16">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Which course is right for you?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Our counselor will help you choose the right course for your goals. Contact us today!
          </p>
          <a
            href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=${encodeURIComponent("I would like to learn about the courses. Which course is right for me?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Get Free Counseling
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <Footer />
      <WhatsAppButton oldSite />
    </div>
  );
}
