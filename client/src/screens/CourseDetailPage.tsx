/**
 * CourseDetailPage — Full course detail view with slug-based routing
 * 
 * Sections:
 * 1. Breadcrumb navigation
 * 2. Course hero (title, image, price, CTA)
 * 3. Full description
 * 4. Curriculum/Syllabus accordion
 * 5. Key features & learning outcomes
 * 6. Instructor profile
 * 7. Course FAQ accordion
 * 8. Enrollment CTA
 */
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOHead from "@/components/SEOHead";
import { CONTACT } from "@/lib/siteConstants";
import { useRoute, useLocation } from "@/lib/router";
import { useState, useMemo } from "react";
import {
  BookOpen, Clock, Users, CheckCircle, ArrowRight, ArrowLeft,
  GraduationCap, Target, ChevronDown, ChevronUp, MessageCircle,
  User, Sparkles, HelpCircle, PlayCircle, FileText, Layers, Home,
  ChevronRight, Phone,
} from "lucide-react";

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all: "All Levels",
};

const categoryLabels: Record<string, string> = {
  ielts: "IELTS",
  spoken: "Spoken English",
  grammar: "Grammar",
  "study-abroad": "Study Abroad",
  other: "Other",
};

export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  // Try slug first, fall back to ID-based lookup
  const isNumericId = /^\d+$/.test(slug);
  
  const { data: courseBySlug, isLoading: slugLoading } = trpc.courses.getBySlug.useQuery(
    { slug },
    { enabled: !isNumericId && !!slug }
  );
  
  const { data: courseById, isLoading: idLoading } = trpc.courses.getById.useQuery(
    { id: parseInt(slug) },
    { enabled: isNumericId && !!slug }
  );

  const course = isNumericId ? courseById : courseBySlug;
  const isLoading = isNumericId ? idLoading : slugLoading;

  const [openCurriculumIndex, setOpenCurriculumIndex] = useState<number | null>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const curriculum = useMemo(() => {
    if (!course?.curriculum) return [];
    return course.curriculum as { title: string; content: string }[];
  }, [course?.curriculum]);

  const courseFaq = useMemo(() => {
    if (!course?.courseFaq) return [];
    return course.courseFaq as { question: string; answer: string }[];
  }, [course?.courseFaq]);

  const features = useMemo(() => {
    if (!course?.features) return [];
    return course.features as string[];
  }, [course?.features]);

  const learningOutcomes = useMemo(() => {
    if (!course?.learningOutcomes) return [];
    return course.learningOutcomes as string[];
  }, [course?.learningOutcomes]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading course information...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h2>
            <p className="text-gray-500 mb-6">This course is unavailable or has been removed.</p>
            <button
              onClick={() => navigate("/courses")}
              className="inline-flex items-center gap-2 bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-red-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              View All Courses
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOHead
        title={`${course.nameEn || course.name} | FluentLearner`}
        description={course.shortDescription || course.description || `${course.nameEn || course.name} \u2014 FluentLearner-\u098f\u09b0 \u09aa\u09cd\u09b0\u09ab\u09c7\u09b6\u09a8\u09be\u09b2 \u0995\u09cb\u09b0\u09cd\u09b8`}
        path={`/courses/${course.slug || slug}`}
        ogImage={course.imageUrl || undefined}
        ogImageAlt={`${course.nameEn || course.name} - FluentLearner IELTS Coaching`}
        type="article"
      />
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="flex items-center gap-1 hover:text-brand-red transition-colors">
              <Home className="h-3.5 w-3.5" />
              Home
            </a>
            <ChevronRight className="h-3.5 w-3.5" />
            <a href="/courses" onClick={(e) => { e.preventDefault(); navigate("/courses"); }} className="hover:text-brand-red transition-colors">
              Courses
            </a>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-800 font-medium truncate max-w-[200px]">{course.nameEn || course.name}</span>
          </nav>
        </div>
      </div>

      {/* Course Hero Section */}
      <section className="bg-gradient-to-br from-brand-red-deep via-brand-red-dark to-brand-red">
        <div className="container py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Course Info */}
            <div className="text-white">
              <div className="flex items-center gap-2 mb-4">
                {course.category && (
                  <span className="bg-white/20 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full text-xs font-medium">
                    {categoryLabels[course.category] || course.category}
                  </span>
                )}
                {course.level && (
                  <span className="bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs">
                    {levelLabels[course.level] || course.level}
                  </span>
                )}
                {course.badge && (
                  <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${course.badgeColor || "bg-yellow-500"}`}>
                    {course.badge}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {course.nameEn || course.name}
              </h1>
              {course.nameEn && (
                <p className="text-white/70 text-lg mb-4">{course.nameEn}</p>
              )}
              {course.shortDescription && (
                <p className="text-white/80 text-lg mb-6 leading-relaxed">{course.shortDescription}</p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 mb-8 text-white/70 text-sm">
                {course.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {course.duration}
                  </span>
                )}
                {course.maxStudents && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> Maximum {course.maxStudents} students
                  </span>
                )}
                {course.schedule && (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> {course.schedule}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                {course.price && (
                  <span className="text-3xl font-bold text-yellow-300">{course.price}</span>
                )}
                {course.originalPrice && (
                  <span className="text-lg text-white/50 line-through">{course.originalPrice}</span>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/enroll?courseId=${course.id}`)}
                  className="flex items-center gap-2 bg-white text-brand-red px-8 py-3.5 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <GraduationCap className="h-5 w-5" />
                  Enroll Now
                </button>
                <a
                  href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=${encodeURIComponent(course.enrollMessage || `I would like to learn more about the "${course.nameEn || course.name}" course.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 px-6 py-3.5 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Ask on WhatsApp
                </a>
              </div>
            </div>

            {/* Right: Video or Course Image */}
            <div className="hidden md:block">
              {course.videoUrl ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video">
                  <iframe
                    src={course.videoUrl
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "youtube.com/embed/")
                      .replace(/&.*$/, "")}
                    title={`${course.nameEn || course.name} video`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : course.imageUrl ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={course.imageUrl}
                    alt={`${course.nameEn || course.name} course image`}
                    className="w-full h-[350px] object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm h-[350px] flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-white/20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Column — Main Content */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Full Description */}
            {(course.fullDescription || course.description) && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                  <FileText className="h-6 w-6 text-brand-red" />
                  Course Description
                </h2>
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                  {course.fullDescription || course.description}
                </div>
              </div>
            )}

            {/* Target Audience */}
            {course.targetAudience && (
              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-brand-red" />
                  Who Is This Course For?
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{course.targetAudience}</p>
              </div>
            )}

            {/* Curriculum / Syllabus */}
            {curriculum.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                  <Layers className="h-6 w-6 text-brand-red" />
                  Course Curriculum
                </h2>
                <p className="text-gray-500 mb-6">{curriculum.length} modules</p>
                <div className="space-y-3">
                  {curriculum.map((module, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:border-brand-red/30 transition-colors"
                    >
                      <button
                        onClick={() => setOpenCurriculumIndex(openCurriculumIndex === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red font-bold text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-gray-900">{module.title}</span>
                        </div>
                        {openCurriculumIndex === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {openCurriculumIndex === index && (
                        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                          <p className="text-gray-600 leading-relaxed whitespace-pre-line pl-11">
                            {module.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features & Learning Outcomes */}
            {(features.length > 0 || learningOutcomes.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-6">
                {features.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Course Features
                    </h3>
                    <ul className="space-y-2.5">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {learningOutcomes.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      What You Will Learn
                    </h3>
                    <ul className="space-y-2.5">
                      {learningOutcomes.map((outcome, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <PlayCircle className="h-4 w-4 text-blue-500 shrink-0 mt-1" />
                          <span className="text-sm">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Instructor Profile */}
            {course.instructorName && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                  <User className="h-6 w-6 text-brand-red" />
                  Course Instructor
                </h2>
                <div className="flex flex-col sm:flex-row gap-6">
                  {course.instructorPhoto ? (
                    <img
                      src={course.instructorPhoto}
                      alt={course.instructorName}
                      className="w-24 h-24 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
                      <User className="h-10 w-10 text-brand-red/40" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{course.instructorName}</h3>
                    {course.instructorBio && (
                      <p className="text-gray-600 mt-2 leading-relaxed whitespace-pre-line">{course.instructorBio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Course FAQ */}
            {courseFaq.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                  <HelpCircle className="h-6 w-6 text-brand-red" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {courseFaq.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                        {openFaqIndex === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                        )}
                      </button>
                      {openFaqIndex === index && (
                        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Quick Info Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Course Information</h3>
                <div className="space-y-3">
                  {course.duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4" /> Duration
                      </span>
                      <span className="font-medium text-gray-900">{course.duration}</span>
                    </div>
                  )}
                  {course.level && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Layers className="h-4 w-4" /> Level
                      </span>
                      <span className="font-medium text-gray-900">{levelLabels[course.level]}</span>
                    </div>
                  )}
                  {course.maxStudents && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Users className="h-4 w-4" /> Batch Size
                      </span>
                      <span className="font-medium text-gray-900">Maximum {course.maxStudents} students</span>
                    </div>
                  )}
                  {course.schedule && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Sparkles className="h-4 w-4" /> Schedule
                      </span>
                      <span className="font-medium text-gray-900">{course.schedule}</span>
                    </div>
                  )}
                  {course.category && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <BookOpen className="h-4 w-4" /> Category
                      </span>
                      <span className="font-medium text-gray-900">{categoryLabels[course.category]}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-3 mb-4">
                    {course.price && (
                      <span className="text-2xl font-bold text-brand-red">{course.price}</span>
                    )}
                    {course.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">{course.originalPrice}</span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/enroll?courseId=${course.id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded-lg font-bold transition-colors shadow-lg shadow-brand-red/20"
                  >
                    <GraduationCap className="h-5 w-5" />
                    Enroll Now
                  </button>
                </div>
              </div>

              {/* WhatsApp Help Card */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Contact us with any questions about this course
                </p>
                <a
                  href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=${encodeURIComponent(`I would like to learn more about the "${course.nameEn || course.name}" course.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask on WhatsApp
                </a>
                <a
                  href={`tel:${CONTACT.PHONE_TEL}`}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {CONTACT.PHONE_SHORT}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-brand-red-deep to-brand-red py-16">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Start Your IELTS Journey Today
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Seats are limited — enroll now and achieve your target score!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate(`/enroll?courseId=${course.id}`)}
              className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <GraduationCap className="h-5 w-5" />
              Enroll Now
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=${encodeURIComponent(`I would like to enroll in the "" course.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Contact on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
