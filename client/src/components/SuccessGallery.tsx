/**
 * SuccessGallery — Psychological Trust Element
 * Displays real branded student success graphics from FluentLearner.
 * Cialdini's Social Proof + Authority: Visual proof is 10x more convincing than text.
 * These are actual client-provided branded graphics with real IELTS scores.
 */
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const successGraphics = [
  {
    id: 1,
    name: "Sajal Chaklader",
    band: "8.0",
    institution: "RUET",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/OcZatZIzbKldgspI.jpg",
    alt: "Sajal Chaklader IELTS Band 8.0 success story from FluentLearner - RUET student",
  },
  {
    id: 2,
    name: "Lailun Tonny",
    band: "7.5",
    institution: "VIP Batch",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/EpaHLlGOlaZfdECi.jpg",
    alt: "Lailun Tonny IELTS Band 7.5 success story with Facebook review proof from FluentLearner",
  },
  {
    id: 3,
    name: "Orko Rahman",
    band: "7.0",
    institution: "Online VIP",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/mbvEmTgfXhXROvWD.jpg",
    alt: "Orko Rahman IELTS Band 7.0 success story from FluentLearner Online VIP Batch",
  },
  {
    id: 4,
    name: "Jannatul Ferdous Binti",
    band: "7.5",
    institution: "VIP Batch",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/AjZcyqOgatQgrVXr.jpg",
    alt: "Jannatul Ferdous Binti IELTS Band 7.5 with WhatsApp proof from FluentLearner",
  },
  {
    id: 5,
    name: "Golam Imran",
    band: "7.0",
    institution: "NOV VIP",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/fzuuiLtahXtjHhNc.jpg",
    alt: "Golam Imran IELTS Band 7.0 with official Test Report Form from FluentLearner",
  },
  {
    id: 6,
    name: "Suprova Das Keya",
    band: "7.0",
    institution: "VIP Online",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/NwiWkkYEUfapGfHq.jpg",
    alt: "Suprova Das Keya IELTS Band 7.0 success story from FluentLearner VIP Online Batch",
  },
  {
    id: 7,
    name: "Raihan Rahmatullah",
    band: "7.0",
    institution: "Online Batch",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/uiUZXAfGGquBfQxZ.jpg",
    alt: "Raihan Rahmatullah IELTS Speaking 7.5 Top Scorer from FluentLearner Online Batch",
  },
];

export default function SuccessGallery() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const navigate = (dir: number) => {
    setCurrentIndex((prev) => (prev + dir + successGraphics.length) % successGraphics.length);
  };

  return (
    <>
      <section ref={ref} className="py-16 lg:py-24 bg-brand-cream relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="container relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className={`inline-block text-brand-red font-body text-sm font-bold uppercase tracking-[0.2em] mb-3 transition-all duration-600 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              প্রমাণিত সাফল্য
            </span>
            <h2
              className={`font-display text-brand-dark text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight transition-all duration-600 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Real Results, <span className="text-brand-red">Real Proof</span>
            </h2>
            <p
              className={`mt-4 text-brand-charcoal/60 font-body text-lg leading-relaxed transition-all duration-600 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              আমাদের শিক্ষার্থীদের প্রকৃত IELTS ফলাফল — WhatsApp কথোপকথন, Facebook রিভিউ এবং অফিসিয়াল টেস্ট রিপোর্ট সহ।
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {successGraphics.map((item, index) => (
              <div
                key={item.id}
                className={`group relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:shadow-brand-red/10 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                } ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                style={{ transitionDelay: isVisible ? `${200 + index * 80}ms` : "0ms" }}
                onClick={() => openLightbox(index)}
              >
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-red-deep/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-4">
                  <div>
                    <p className="text-white font-display text-sm sm:text-base font-bold">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-300 font-display text-lg sm:text-xl font-extrabold">Band {item.band}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div
            className={`mt-8 text-center transition-all duration-700 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-brand-charcoal/40 font-body text-sm">
              প্রতিটি ফলাফল যাচাইযোগ্য — অফিসিয়াল IELTS রিপোর্ট, WhatsApp কথোপকথন এবং Facebook রিভিউ সহ
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Image */}
          <img
            src={successGraphics[currentIndex].image}
            alt={successGraphics[currentIndex].alt}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white font-display text-base font-bold">
              {successGraphics[currentIndex].name}
            </p>
            <p className="text-white/60 font-body text-sm">
              Band {successGraphics[currentIndex].band} — {successGraphics[currentIndex].institution}
            </p>
            <p className="text-white/30 font-body text-xs mt-1">
              {currentIndex + 1} / {successGraphics.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
