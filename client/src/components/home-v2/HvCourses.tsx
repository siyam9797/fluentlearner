import { useState } from "react";
import { BookOpen, Clock } from "lucide-react";
import { Link } from "@/lib/router";
import { ArrowButton, DecorSquare, HvButton, Reveal } from "./primitives";
import { useCourseCards } from "./hooks";
import { V2 } from "./routes";
import type { CourseCard } from "./data";

export function CourseItem({ course, index }: { course: CourseCard; index: number }) {
  const href = course.id > 0 ? V2.course(course.slug || course.id) : V2.courses;
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link href={href} className="group flex h-full flex-col justify-between rounded-[5px] bg-sand p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <span className="flex items-center gap-2 text-base">
          <DecorSquare />
          {course.label}
        </span>
        <div className="relative h-40 w-full overflow-hidden rounded-[5px] sm:h-[120px] sm:w-[190px] lg:w-[250px]">
          {course.imageUrl && !imageFailed ? (
            <img
              src={course.imageUrl}
              alt=""
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-ink p-4 text-cream">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ash">FluentLearner</span>
              <span className="text-[44px] font-semibold leading-none">{String(index + 1).padStart(2, "0")}</span>
              <BookOpen
                className="absolute -bottom-3 right-3 h-20 w-20 text-white/[0.07] transition-transform duration-700 group-hover:-translate-y-1 group-hover:scale-105"
                strokeWidth={1.25}
                aria-hidden="true"
              />
              <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-[2px] bg-brand-red" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl lg:text-[28px] transition-colors group-hover:text-brand-red">{course.title}</h3>
          {course.description && <p className="line-clamp-2">{course.description}</p>}
          {(course.price || course.duration) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/70">
              {course.price && <span className="text-base font-semibold text-ink">{course.price}</span>}
              {course.duration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {course.duration}
                </span>
              )}
            </p>
          )}
        </div>
        <ArrowButton />
      </div>
    </Link>
  );
}

export default function HvCourses() {
  const courses = useCourseCards().slice(0, 4);

  return (
    <section id="courses" className="pb-20 lg:pb-32">
      <div className="mx-auto max-w-[1230px] px-4">
        <Reveal className="mb-10 flex items-end justify-between gap-8 lg:mb-14">
          <h2 className="max-w-[640px] text-[32px] sm:text-[38px] lg:text-[44px]">
            Everything you need to reach your target band
          </h2>
          <HvButton href={V2.courses} variant="outline" className="hidden md:inline-flex">View All Courses</HvButton>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-5">
          {courses.map((course, i) => (
            <Reveal key={course.id} delay={(i % 2) * 120} className="h-full">
              <CourseItem course={course} index={i} />
            </Reveal>
          ))}
        </div>

        <HvButton href={V2.courses} variant="outline" className="mt-8 w-full md:hidden">View All Courses</HvButton>
      </div>
    </section>
  );
}
