import { Mail, MapPin, Phone } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Link } from "@/lib/router";
import { useCourseCards } from "./hooks";
import { V2 } from "./routes";
import { MenuLink } from "./HvNavbar";
import { useV2Content } from "./useV2Content";
import SiteLogo from "@/components/SiteLogo";

const socialClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-ash transition-colors hover:border-brand-red hover:bg-brand-red hover:text-white";

export default function HvFooter() {
  const ss = useV2Content();
  // The footer lists every item flat, sub-items included.
  const pages = ss.menuAt("footer").flatMap(item => [item, ...item.children]);
  const courses = useCourseCards().slice(0, 4);

  return (
    <footer className="bg-ink pb-8 pt-16 lg:pt-20">
      <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mb-16 lg:grid-cols-[1.4fr_0.6fr_0.9fr_1fr] lg:gap-8">
          <div className="flex flex-col gap-6">
            <SiteLogo on="dark" className="h-10 w-auto self-start" />
            <p className="max-w-[320px] text-lg text-ash">
              {ss.t("v2_footer_tagline")}
            </p>
            <div className="flex gap-3">
              <a
                href={ss.socialFacebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={socialClass}
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={ss.socialYoutube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className={socialClass}
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              {ss.socialInstagram && (
                <a
                  href={ss.socialInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className={socialClass}
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0 3.675a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </a>
              )}
              <a
                href={ss.whatsapp()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className={socialClass}
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {pages.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="mb-2 text-lg text-cream">
                {ss.t("v2_footer_explore_title")}
              </h3>
              {pages.map(page => (
                <MenuLink
                  key={page.id}
                  item={page}
                  className="text-ash transition-colors hover:text-cream"
                />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="mb-2 text-lg text-cream">
              {ss.t("v2_footer_courses_title")}
            </h3>
            {courses.map(course => (
              <Link
                key={course.id}
                href={
                  course.id > 0
                    ? V2.course(course.slug || course.id)
                    : V2.courses
                }
                className="text-ash transition-colors hover:text-cream"
              >
                {course.title}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="mb-2 text-lg text-cream">
              {ss.t("v2_footer_contact_title")}
            </h3>
            <a
              href={`tel:${ss.contactPhone.replace(/[\s-]/g, "")}`}
              className="flex items-start gap-2.5 text-ash transition-colors hover:text-cream"
            >
              <Phone className="mt-1 h-4 w-4 flex-none" aria-hidden="true" />
              {ss.contactPhone}
            </a>
            <a
              href={`mailto:${ss.contactEmail}`}
              className="flex items-start gap-2.5 break-all text-ash transition-colors hover:text-cream"
            >
              <Mail className="mt-1 h-4 w-4 flex-none" aria-hidden="true" />
              {ss.contactEmail}
            </a>
            <p className="flex items-start gap-2.5 text-ash">
              <MapPin className="mt-1 h-4 w-4 flex-none" aria-hidden="true" />
              {ss.contactAddress}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-8 text-sm text-ash sm:flex-row sm:items-center sm:justify-between">
          <p>{ss.t("v2_footer_text")}</p>
          <p>
            Developed by{" "}
            <a
              href="https://siyam.me"
              target="_blank"
              rel="noopener"
              className="font-medium text-cream underline decoration-brand-red decoration-2 underline-offset-4 transition-colors hover:text-brand-red-light"
            >
              Siyam
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
