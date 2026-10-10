/** v2 Contact page — /contact */
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useV2Content } from "@/components/home-v2/useV2Content";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import { DecorSquare, HvSelect, Reveal } from "@/components/home-v2/primitives";
import { useCourseCards } from "@/components/home-v2/hooks";

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-ink/20 bg-white/60 px-4 py-3.5 text-base outline-none transition-colors placeholder:text-ink/40 focus:border-ink focus:bg-white";

export default function V2Contact() {
  const ss = useV2Content();
  const { t } = ss;
  const courses = useCourseCards();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    course: "",
    message: "",
  });
  const update =
    (key: keyof typeof form) => (e: { target: { value: string } }) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  // There is no contact endpoint, so the form hands a pre-filled message to WhatsApp.
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const lines = [
      t("v2_contact_form_greeting"),
      `Name: ${form.name.trim()}`,
      form.phone.trim() ? `Phone: ${form.phone.trim()}` : null,
      form.course ? `Interested in: ${form.course}` : null,
      "",
      form.message.trim(),
    ].filter((line): line is string => line !== null);
    window.open(
      `https://wa.me/${ss.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const channels = [
    {
      icon: WhatsAppIcon,
      label: t("v2_contact_whatsapp_label"),
      value: ss.contactPhone,
      note: t("v2_contact_whatsapp_note"),
      href: ss.whatsapp(),
      external: true,
    },
    {
      icon: Phone,
      label: t("v2_contact_phone_label"),
      value: ss.contactPhone,
      note: t("v2_contact_phone_note"),
      href: `tel:${ss.contactPhone.replace(/[\s-]/g, "")}`,
    },
    {
      icon: Mail,
      label: t("v2_contact_email_label"),
      value: ss.contactEmail,
      note: t("v2_contact_email_note"),
      href: `mailto:${ss.contactEmail}`,
    },
    {
      icon: MapPin,
      label: t("v2_contact_location_label"),
      value: ss.contactAddress,
      note: t("v2_contact_location_note"),
      href: null,
    },
  ];

  return (
    <HvLayout>
      <SEOHead
        {...PAGE_SEO.contact}
        path="/"
        title={t("v2_contact_seo_title")}
        description={t("v2_contact_seo_description")}
      />
      <HvPageHeader
        crumbs={[{ label: "Contact" }]}
        title={t("v2_contact_header_title")}
        description={t("v2_contact_header_description")}
      />

      <section className="pb-20 pt-12 lg:pb-32 lg:pt-16">
        <div className="mx-auto grid max-w-[1262px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="grid content-start gap-3 sm:grid-cols-2 lg:gap-4">
            {channels.map((channel, i) => {
              const body = (
                <>
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-brand-red transition-colors group-hover:bg-brand-red group-hover:text-white">
                      <channel.icon className="h-5 w-5" />
                    </span>
                    {channel.href && (
                      <ArrowUpRight
                        className="h-5 w-5 text-ink/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="mt-10">
                    <p className="text-sm text-ink/60">{channel.label}</p>
                    <p className="mt-1 text-lg font-medium [overflow-wrap:anywhere]">
                      {channel.value.includes("@") ? (
                        <>
                          {channel.value.split("@")[0]}@<wbr />
                          {channel.value.split("@")[1]}
                        </>
                      ) : (
                        channel.value
                      )}
                    </p>
                    <p className="mt-2 text-sm text-ink/60">{channel.note}</p>
                  </div>
                </>
              );
              const cls =
                "group flex h-full flex-col rounded-[var(--radius-card)] bg-sand p-6 transition-colors";
              return (
                <Reveal key={i} delay={i * 80} className="h-full">
                  {channel.href ? (
                    <a
                      href={channel.href}
                      className={`${cls} hover:bg-[#dedbd0]`}
                      {...(channel.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {body}
                    </a>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </Reveal>
              );
            })}

            <Reveal delay={320} className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] bg-ink p-6 text-cream">
                <p className="text-lg">{t("v2_contact_social_text")}</p>
                <div className="flex gap-3">
                  <a
                    href={ss.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 px-4 py-2 text-sm transition-colors hover:border-brand-red hover:bg-brand-red"
                  >
                    Facebook
                  </a>
                  <a
                    href={ss.socialYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 px-4 py-2 text-sm transition-colors hover:border-brand-red hover:bg-brand-red"
                  >
                    YouTube
                  </a>
                  {ss.socialInstagram && (
                    <a
                      href={ss.socialInstagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/20 px-4 py-2 text-sm transition-colors hover:border-brand-red hover:bg-brand-red"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <form
              onSubmit={submit}
              className="rounded-[var(--radius-card)] border border-ink/15 p-6 lg:p-10"
            >
              <p className="mb-3 flex items-center gap-2 text-lg">
                <DecorSquare />
                {t("v2_contact_form_label")}
              </p>
              <h2 className="text-[28px] lg:text-[32px]">
                {t("v2_contact_form_title")}
              </h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Your name
                  <input
                    required
                    value={form.name}
                    onChange={update("name")}
                    className={fieldClass}
                    placeholder="Full name"
                    autoComplete="name"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Phone (optional)
                  <input
                    value={form.phone}
                    onChange={update("phone")}
                    className={fieldClass}
                    placeholder="01XXX-XXXXXX"
                    type="tel"
                    autoComplete="tel"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
                  Course you're interested in
                  <HvSelect
                    label="Course you're interested in"
                    value={form.course}
                    onChange={course =>
                      setForm(previous => ({ ...previous, course }))
                    }
                    placeholder="Not sure yet"
                    options={courses.map(course => ({
                      value: course.title,
                      label: course.title,
                    }))}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
                  Message
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={update("message")}
                    className={`${fieldClass} resize-y`}
                    placeholder="Your current level, target band, exam date…"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="hv-btn hv-btn-dark mt-6 w-full gap-2"
              >
                <WhatsAppIcon className="relative h-5 w-5" />
                <span className="hv-btn-label">
                  <span>{t("v2_contact_form_button")}</span>
                  <span aria-hidden="true">{t("v2_contact_form_button")}</span>
                </span>
              </button>
              <p className="mt-3 text-center text-sm text-ink/60">
                {t("v2_contact_form_note")}
              </p>
            </form>
          </Reveal>
        </div>
      </section>
    </HvLayout>
  );
}
