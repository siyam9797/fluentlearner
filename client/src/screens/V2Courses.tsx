/** v2 Courses page — /v2/courses */
import { useMemo, useState } from "react";
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import { CourseItem } from "@/components/home-v2/HvCourses";
import HvBenefits from "@/components/home-v2/HvBenefits";
import HvCTA from "@/components/home-v2/HvCTA";
import { HvButton, Reveal } from "@/components/home-v2/primitives";
import { useCourseCards } from "@/components/home-v2/hooks";
import { CATEGORY_LABELS } from "@/components/home-v2/data";

export default function V2Courses() {
  const ss = useSiteSettings();
  const courses = useCourseCards();
  const [filter, setFilter] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(courses.map(course => course.category))),
    [courses],
  );
  const visible = filter === "all" ? courses : courses.filter(course => course.category === filter);
  const adviceHref = `https://wa.me/${ss.contactWhatsapp}?text=${encodeURIComponent("Assalamu Alaikum, can you help me choose the right course?")}`;

  return (
    <HvLayout>
      <SEOHead {...PAGE_SEO.courses} />
      <HvPageHeader
        crumbs={[{ label: "Courses" }]}
        title="Courses built around your target band"
        description="From intensive one-to-one IELTS mentoring to spoken English foundations — every plan comes with mock tests, recorded classes and WhatsApp support."
      />

      <section className="pb-20 pt-12 lg:pb-32 lg:pt-16">
        <div className="mx-auto max-w-[1230px] px-4">
          {categories.length > 1 && (
            <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter courses">
              {["all", ...categories].map(key => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
                    filter === key
                      ? "border-ink bg-ink text-white"
                      : "border-ink/20 hover:border-ink",
                  )}
                >
                  {key === "all" ? "All courses" : CATEGORY_LABELS[key] ?? key}
                  <span className={cn("ml-2", filter === key ? "text-white/60" : "text-ink/40")}>
                    {key === "all" ? courses.length : courses.filter(c => c.category === key).length}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-5">
            {visible.map((course, i) => (
              <Reveal key={course.id} delay={(i % 2) * 120} className="h-full">
                <CourseItem course={course} index={courses.indexOf(course)} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[5px] bg-ink p-8 text-cream md:flex-row md:items-center lg:mt-20 lg:p-12">
            <div className="max-w-[560px]">
              <h2 className="text-[28px] text-cream lg:text-[32px]">Not sure which course is right for you?</h2>
              <p className="mt-3 text-ash">
                Tell us your current level and target band — a mentor will recommend the plan that fits.
              </p>
            </div>
            <HvButton href={adviceHref} variant="red" external>Get Free Advice</HvButton>
          </Reveal>
        </div>
      </section>

      <HvBenefits />
      <HvCTA />
    </HvLayout>
  );
}
