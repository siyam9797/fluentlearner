/**
 * FeaturedStoriesPreview — Shows featured success stories from DB on home page
 * Uses database-backed success stories.
 */
import { OLD_FEATURED_STORIES } from "@/old-site/content";
import { SITE_STATS } from "@/lib/siteConstants";
import { Trophy, ArrowRight, Star } from "lucide-react";
import { useLocation } from "@/lib/router";

export default function FeaturedStoriesPreview() {
  const featuredStories = OLD_FEATURED_STORIES;
  const isLoading = false;
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-dark" style={{ fontFamily: "var(--font-display)" }}>
              Success Stories
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Trophy className="h-4 w-4" />
            Our Pride
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Success <span className="text-brand-red">Stories</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A selection of inspiring stories from our {SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ students
          </p>
        </div>

        {/* Featured Stories Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {(featuredStories ?? []).slice(0, 8).map((story) => (
            <div
              key={story.id}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setLocation("/old/success-stories")}
            >
              <img
                src={story.imageUrl}
                alt={`${story.studentName} s success story`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Band Score */}
              {story.bandScore && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                  Band {story.bandScore}
                </div>
              )}

              {/* Featured Star */}
              {story.isFeatured && (
                <Star className="absolute top-2 left-2 h-4 w-4 text-yellow-400 fill-yellow-400" />
              )}

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold text-sm truncate">{story.studentName}</h3>
                {story.courseName && (
                  <p className="text-white/70 text-xs truncate">{story.courseName}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => setLocation("/old/success-stories")}
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white rounded-lg font-semibold transition-all duration-300"
          >
            View All Success Stories
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
