/**
 * UrgencyBanner — Psychological Trust Element
 * Countdown timer to next batch start date + limited seats.
 * Cialdini's Scarcity: "Only X seats remaining" creates urgency.
 * Now triggers enrollment funnel instead of direct WhatsApp.
 */
import { useState, useEffect, useMemo } from "react";
import { Clock, Users, Flame, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

function parseBatchDate(value: string): Date | null {
  // Date-only values must be parsed in local time; `new Date("YYYY-MM-DD")`
  // is UTC and can display the previous day in some time zones.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatBatchDate(date: Date): string {
  const monthsBn = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const monthsEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${date.getDate()} ${monthsBn[date.getMonth()]} ${date.getFullYear()} (${monthsEn[date.getMonth()]} ${date.getDate()})`;
}

export default function UrgencyBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [visible, setVisible] = useState(false);
  const [, navigate] = useLocation();
  const { data: activeBatches = [], isLoading } = trpc.batches.active.useQuery();

  const nextBatch = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeBatches
      .map(batch => ({ batch, date: batch.startDate ? parseBatchDate(batch.startDate) : null }))
      .filter((item): item is typeof item & { date: Date } => Boolean(item.date && item.date >= today))
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;
  }, [activeBatches]);

  const batchDate = nextBatch?.date ?? null;
  const seatsRemaining = nextBatch
    ? Math.max(0, (nextBatch.batch.maxCapacity ?? 0) - (nextBatch.batch.currentCount ?? 0))
    : 0;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!batchDate) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = batchDate.getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(interval);
  }, [batchDate]);

  // The admin controls whether this banner is shown by keeping an upcoming
  // batch active and open on the batch management page.
  if (isLoading || !nextBatch || !batchDate) return null;

  return (
    <section className={`bg-brand-dark py-5 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left — Batch Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-brand-red-light animate-pulse" />
            </div>
            <div>
              <p className="text-white font-display text-sm font-bold">
                পরবর্তী ব্যাচ শুরু: <span className="text-yellow-300">{formatBatchDate(batchDate)}</span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Users className="w-3.5 h-3.5 text-brand-red-light" />
                <span className="text-white/50 font-body text-xs">
                  মাত্র <span className="text-yellow-300 font-bold">{seatsRemaining.toLocaleString("bn-BD")}টি</span> সিট বাকি আছে
                </span>
              </div>
            </div>
          </div>

          {/* Center — Countdown */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40" />
            <div className="flex items-center gap-1.5">
              {[
                { value: timeLeft.days, label: "দিন" },
                { value: timeLeft.hours, label: "ঘণ্টা" },
                { value: timeLeft.minutes, label: "মিনিট" },
                { value: timeLeft.seconds, label: "সেকেন্ড" },
              ].map((unit, i) => (
                <div key={unit.label} className="flex items-center gap-1.5">
                  <div className="bg-white/10 rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
                    <div className="font-display text-white text-lg font-extrabold leading-none">
                      {String(unit.value).padStart(2, "0")}
                    </div>
                    <div className="text-white/40 font-body text-[9px] mt-0.5">{unit.label}</div>
                  </div>
                  {i < 3 && <span className="text-white/30 font-display text-lg font-bold">:</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Right — CTA — Opens Enrollment Funnel */}
          <button
            onClick={() => navigate('/enroll')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-body font-bold text-sm rounded-lg hover:bg-brand-red-light transition-all duration-300 shadow-lg shadow-brand-red/30 hover:-translate-y-0.5 shrink-0 cursor-pointer"
          >
            এখনই ভর্তি হন
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
