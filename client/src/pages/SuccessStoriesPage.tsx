import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOHead from "@/components/SEOHead";
import { CONTACT, BRAND, SITE_STATS } from "@/lib/siteConstants";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Users,
  Award,
  Target,
  MessageCircle,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Quote,
  GraduationCap,
  Plane,
  Globe,
  Mic,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";

const categoryFilters = [
  { key: "all", label: "সব", icon: Star },
  { key: "ielts-score", label: "IELTS Score", icon: Target },
  { key: "visa-success", label: "Visa Success", icon: Plane },
  { key: "university-admission", label: "University", icon: GraduationCap },
  { key: "spoken-english", label: "Spoken English", icon: Mic },
];

const categoryLabels: Record<string, string> = {
  "ielts-score": "IELTS Score Achievement",
  "visa-success": "Visa Success",
  "university-admission": "University Admission",
  "spoken-english": "Spoken English",
  other: "Achievement",
};

export default function SuccessStoriesPage() {
  const { data: stories, isLoading } = trpc.successStories.list.useQuery();
  const { data: storiesCount } = trpc.successStories.count.useQuery();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedStory, setSelectedStory] = useState<number | null>(null);

  const filteredStories = useMemo(() => {
    if (!stories) return [];
    if (activeFilter === "all") return stories;
    return stories.filter((s) => s.category === activeFilter);
  }, [stories, activeFilter]);

  const selectedStoryData = useMemo(() => {
    if (selectedStory === null || !stories) return null;
    return stories.find((s) => s.id === selectedStory);
  }, [selectedStory, stories]);

  const navigateStory = (direction: "prev" | "next") => {
    if (!filteredStories.length || selectedStory === null) return;
    const currentIndex = filteredStories.findIndex((s) => s.id === selectedStory);
    if (direction === "prev" && currentIndex > 0) {
      setSelectedStory(filteredStories[currentIndex - 1].id);
    } else if (direction === "next" && currentIndex < filteredStories.length - 1) {
      setSelectedStory(filteredStories[currentIndex + 1].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOHead
        title="সাফল্যের গল্প | FluentLearner - Our Success Stories"
        description={`${SITE_STATS.TOTAL_SCORERS}+ শিক্ষার্থীর সাফল্যের গল্প। IELTS স্কোর, ভিসা সাফল্য, বিশ্ববিদ্যালয় ভর্তি — FluentLearner-এর শিক্ষার্থীদের অর্জন দেখুন।`}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-red-deep via-brand-red-dark to-brand-red overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-80 h-80 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm mb-6">
              <Trophy className="h-4 w-4 text-yellow-300" />
              আমাদের গর্বের মুহূর্ত
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
              সাফল্যের গল্প
              <br />
              <span className="text-yellow-300">যারা পেরেছে, আপনিও পারবেন</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              আমাদের শিক্ষার্থীদের অর্জন আমাদের সবচেয়ে বড় পরিচয়। প্রতিটি সাফল্য একটি অনুপ্রেরণার গল্প।
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold text-white">{SITE_STATS.TOTAL_SCORERS.toLocaleString()}+</div>
                <div className="text-white/60 text-xs mt-1">সফল শিক্ষার্থী</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold text-white">{SITE_STATS.SUCCESS_RATE}%</div>
                <div className="text-white/60 text-xs mt-1">সাফল্যের হার</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold text-white">{SITE_STATS.AVG_BAND_SCORE}</div>
                <div className="text-white/60 text-xs mt-1">গড় ব্যান্ড স্কোর</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[64px] z-30 bg-white border-b shadow-sm">
        <div className="container py-2 md:py-3">
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            <Filter className="h-4 w-4 text-gray-400 shrink-0 hidden md:block" />
            {categoryFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeFilter === filter.key
                    ? "bg-brand-red text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <filter.icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="container py-12">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">কোনো গল্প পাওয়া যায়নি</h3>
            <p className="text-gray-500">এই ক্যাটাগরিতে এখনো কোনো সাফল্যের গল্প যোগ করা হয়নি।</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group cursor-pointer"
                onClick={() => setSelectedStory(story.id)}
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                  <img
                    src={story.imageUrl}
                    alt={`${story.studentName} এর সাফল্যের গল্প`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Band Score Badge */}
                  {story.bandScore && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                      Band {story.bandScore}
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs">
                    {categoryLabels[story.category]}
                  </div>

                  {/* Featured Star */}
                  {story.isFeatured && (
                    <Star className="absolute top-10 left-2 h-4 w-4 text-yellow-400 fill-yellow-400" />
                  )}

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white font-semibold text-sm truncate">{story.studentName}</h3>
                    {story.courseName && (
                      <p className="text-white/70 text-xs truncate">{story.courseName}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedStoryData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-3 right-3 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Navigation */}
              <button
                onClick={() => navigateStory("prev")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigateStory("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors md:right-auto md:left-[calc(60%-10px)]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Image */}
              <div className="md:w-3/5 h-64 md:h-auto">
                <img
                  src={selectedStoryData.imageUrl}
                  alt={`${selectedStoryData.studentName} এর সাফল্যের গল্প`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="md:w-2/5 p-6 overflow-y-auto">
                {selectedStoryData.bandScore && (
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold mb-4">
                    <Award className="h-4 w-4" />
                    Band Score: {selectedStoryData.bandScore}
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {selectedStoryData.studentName}
                </h2>
                <p className="text-sm text-brand-red mb-1">
                  {categoryLabels[selectedStoryData.category]}
                </p>
                {selectedStoryData.courseName && (
                  <p className="text-sm text-gray-500 mb-4">{selectedStoryData.courseName}</p>
                )}
                {selectedStoryData.testimonial && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <Quote className="h-5 w-5 text-brand-red/30 mb-2" />
                    <p className="text-gray-700 text-sm italic leading-relaxed">
                      "{selectedStoryData.testimonial}"
                    </p>
                  </div>
                )}
                {selectedStoryData.achievementDate && (
                  <p className="text-xs text-gray-400 mb-4">{selectedStoryData.achievementDate}</p>
                )}
                <a
                  href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=${encodeURIComponent(`আমিও ${selectedStoryData.studentName} এর মতো সাফল্য পেতে চাই। কোর্স সম্পর্কে জানতে চাই।`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  আমিও শুরু করতে চাই
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-brand-red-deep to-brand-red py-16">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            পরবর্তী সাফল্যের গল্প <span className="text-yellow-300">আপনার হতে পারে</span>
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            আমাদের {SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ সফল শিক্ষার্থীর মতো আপনিও আপনার লক্ষ্য অর্জন করতে পারেন।
            আজই শুরু করুন!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=${encodeURIComponent("আমি IELTS কোর্সে ভর্তি হতে চাই। বিস্তারিত জানতে চাই।")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              এখনই ভর্তি হন
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://ielts.fluentlearner.com/"
              target="_blank"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
            >
              স্টুডেন্ট পোর্টাল
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
