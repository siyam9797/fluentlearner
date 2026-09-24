import { Check } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HvButton, Reveal, formatCompact } from "./primitives";

const reasons = [
  "One-to-One Mentoring",
  "Flexible Schedule",
  "Recorded Classes",
  "High Band Scores",
  "Detailed Writing Reviews",
  "24/7 WhatsApp Support",
];

export default function HvAbout() {
  const ss = useSiteSettings();
  const description =
    ss.aboutDescription ||
    `Founded by ${ss.founderName}, FluentLearner is more than a coaching centre — it's a supportive community that helps you feel confident and prepared on exam day.`;
  const mentorHref = `https://wa.me/${ss.contactWhatsapp}?text=${encodeURIComponent("Assalamu Alaikum, I want to talk to a mentor about my IELTS preparation.")}`;

  return (
    <section id="about" className="relative overflow-hidden bg-brand-red py-20 text-white lg:py-32">
      <div className="mx-auto max-w-[1230px] px-4">
        <Reveal className="flex w-full flex-col items-start md:w-[60%] md:pr-12 lg:w-1/2 lg:pr-16 xl:pr-28">
          <h2 className="text-[28px] sm:text-[32px] lg:text-4xl text-white">
            Trusted by{" "}
            <span className="text-[36px] sm:text-[45px] lg:text-[60px] font-semibold text-white">
              {formatCompact(ss.totalScorers)}+
            </span>{" "}
            students — here's why IELTS candidates choose us
          </h2>
          <p className="mt-5 text-lg text-white/85">{description}</p>

          <ul className="my-10 grid w-full grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:my-14">
            {reasons.map(reason => (
              <li key={reason} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="text-lg font-medium">{reason}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-6">
            <HvButton href={mentorHref} variant="inverse" external>Talk to a Mentor</HvButton>
            <div>
              <p className="font-medium">{ss.founderName}</p>
              <p className="text-sm text-white/70">{ss.founderTitle}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="relative mt-12 h-[400px] w-full md:absolute md:inset-y-0 md:right-0 md:mt-0 md:h-full md:w-[40%] lg:w-1/2">
        <img
          src={ss.aboutImage || ss.founderPhoto}
          alt={`${ss.founderName} at the FluentLearner studio`}
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
        />
      </div>
    </section>
  );
}
