import { ClipboardCheck, HeartHandshake, MessageCircle, UserRound } from "lucide-react";
import { Pill, Reveal } from "./primitives";
import { usePillImages } from "./hooks";

const benefits = [
  {
    icon: UserRound,
    title: "One-to-One Mentoring",
    text: "Every lesson is shaped around your level, your weak modules and your target band",
  },
  {
    icon: ClipboardCheck,
    title: "Mock Tests & Feedback",
    text: "Exam-style mock tests with detailed, band-descriptor based feedback after each one",
  },
  {
    icon: HeartHandshake,
    title: "Theory & Practice Mix",
    text: "Learn the strategy for each question type, then apply it straight away with guided practice",
  },
  {
    icon: MessageCircle,
    title: "Support at Every Step",
    text: "Recorded classes, study materials and WhatsApp support from enrollment to exam day",
  },
];

export default function HvBenefits() {
  const pills = usePillImages();

  return (
    <section className="relative overflow-hidden bg-ink py-20 lg:py-32">
      <div className="mx-auto max-w-[1230px] px-4">
        <Reveal className="mb-14 max-w-[620px] lg:mb-20">
          <h2 className="text-[32px] sm:text-[38px] lg:text-[44px] text-cream">
            Why our coaching<Pill src={pills[2]} position="50% 50%" />delivers real results for every student
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10 xl:gap-16">
          {benefits.map((item, i) => (
            <Reveal key={item.title} delay={i * 100} className="flex flex-col gap-6">
              <item.icon className="h-10 w-10 text-brand-red-light" strokeWidth={1.5} aria-hidden="true" />
              <div className="flex flex-col gap-3">
                <h3 className="text-[22px] text-cream">{item.title}</h3>
                <p className="text-ash">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
