/**
 * Footer — FluentLearner Red+White Brand Theme
 * Multi-column footer with dark background and red accents.
 * Updated with proper page links for multi-page site.
 * Smooth scroll support for hash links (/#about, /#contact).
 */
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { CONTACT, BRAND } from "@/lib/siteConstants";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "wouter";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About Us", href: "/#about" },
  { label: "Success Stories", href: "/success-stories" },
  { label: "Contact", href: "/#contact" },
  // { label: "Certificate Verify", href: "/verify" }, // Hidden until feature is ready
];

const courseLinks = [
  { label: "IELTS Complete Preparation", href: "/courses" },
  { label: "Spoken English Mastery", href: "/courses" },
  { label: "IELTS VIP Batch", href: "/courses" },
  { label: "Study Abroad Guidance", href: "/courses" },
];

export default function Footer() {
  const ss = useSiteSettings();
  const [location, setLocation] = useLocation();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    if (href.startsWith("/#")) {
      const hash = href.substring(1); // Get #about or #contact
      if (location === "/") {
        // Already on home page, just scroll
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        // Navigate to home first, then scroll
        setLocation("/");
        setTimeout(() => {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    } else {
      setLocation(href);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer id="contact" className="bg-brand-dark pt-16 pb-8">
      <div className="container">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-brand-red rounded-lg px-2.5 py-1.5">
                <span className="font-display text-white text-base font-bold tracking-wide">
                  FluentLearner
                </span>
              </div>
            </div>
            <p className="text-white/40 font-body text-xs uppercase tracking-[0.15em] mb-3">IELTS & SPOKEN</p>
            <p className="text-white/50 font-body text-sm leading-relaxed mt-2">
              Bangladesh's No.1 IELTS coaching platform, dedicated to transforming students' dreams of studying abroad into reality.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 mt-6">
              <a
                href={ss.socialFacebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-brand-red hover:border-brand-red/30 hover:bg-brand-red/10 transition-all"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href={ss.socialYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-brand-red hover:border-brand-red/30 hover:bg-brand-red/10 transition-all"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a
                href={`https://wa.me/${ss.contactWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#25D366] hover:border-[#25D366]/30 hover:bg-[#25D366]/10 transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-white text-base font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-white/50 font-body text-sm hover:text-brand-red-light transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h3 className="font-display text-white text-base font-bold mb-4">Our Courses</h3>
            <ul className="space-y-2.5">
              {courseLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-white/50 font-body text-sm hover:text-brand-red-light transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-white text-base font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${ss.contactPhone.replace(/[\s-]/g, '')}`} className="flex items-start gap-2.5 text-white/50 hover:text-brand-red-light transition-colors group">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0 text-brand-red/60 group-hover:text-brand-red-light" />
                  <span className="font-body text-sm">{ss.contactPhone}</span>
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${ss.contactWhatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-white/50 hover:text-[#25D366] transition-colors group">
                  <MessageCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#25D366]/60 group-hover:text-[#25D366]" />
                  <span className="font-body text-sm">WhatsApp: {ss.contactPhone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${ss.contactEmail}`} className="flex items-start gap-2.5 text-white/50 hover:text-brand-red-light transition-colors group">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0 text-brand-red/60 group-hover:text-brand-red-light" />
                  <span className="font-body text-sm">{ss.contactEmail}</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2.5 text-white/50">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-red/60" />
                  <span className="font-body text-sm">{ss.contactAddress}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 font-body text-xs">
            &copy; {new Date().getFullYear()} FluentLearner. All rights reserved.
          </p>
          <p className="text-white/20 font-body text-xs">
            Crafted with excellence by{" "}
            <a href="https://rashik.one" target="_blank" rel="noopener noreferrer" className="text-brand-red/40 hover:text-brand-red/60 transition-colors">
              Rashik
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
