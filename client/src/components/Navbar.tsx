/**
 * Navbar — FluentLearner Red+White Brand Theme
 * Sticky navigation with white/red branding.
 * Now supports both page links and anchor links.
 */
import { useState, useEffect } from "react";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { CONTACT, BRAND } from "@/lib/siteConstants";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "wouter";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/#about" },
  { label: "Success Stories", href: "/success-stories" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const ss = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);

    // If it's a hash link on the home page (e.g., /#about)
    if (href.startsWith("/#")) {
      const hash = href.substring(1); // Get #about
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
      // Regular page navigation
      setLocation(href);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Top Info Bar */}
      <div className="bg-brand-red-deep text-white/90 text-sm py-2 hidden md:block">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href={`tel:${ss.contactPhone.replace(/[\s-]/g, '')}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span>{ss.contactPhone}</span>
            </a>
            <a href={`mailto:${ss.contactEmail}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{ss.contactEmail}</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href={ss.socialFacebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href={ss.socialYoutube} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/98 backdrop-blur-md shadow-lg shadow-brand-dark/5"
            : "bg-white/95 backdrop-blur-sm"
        }`}
      >
        <div className="container flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => handleNavClick(e, "/")}
            className="flex items-center gap-2.5 group"
          >
            <div className="bg-brand-dark rounded-lg px-2.5 py-1.5 group-hover:bg-brand-red-deep transition-all duration-300">
              <span className="font-display text-white text-base font-bold tracking-wide">
                FluentLearner
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-brand-dark font-body text-xs font-semibold uppercase tracking-[0.15em] leading-tight">
                IELTS & SPOKEN
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              // Exact match: Home = "/", Courses = "/courses", etc.
              // Hash links like "/#about" and "/#contact" are only active when on "/" AND scrolled to that section
              // For simplicity, hash links are never shown as "active" in nav — only page routes
              const basePath = link.href.split("#")[0] || "/";
              const isHashLink = link.href.includes("#") && link.href !== "/";
              const isActive = isHashLink ? false : (basePath === "/" ? location === "/" : location === basePath || location.startsWith(basePath + "/"));
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-4 py-2 font-body text-sm font-medium tracking-wide transition-colors duration-300 relative group ${
                    isActive ? "text-brand-red" : "text-brand-dark/80 hover:text-brand-red"
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-brand-red transition-all duration-300 ${
                    isActive ? "w-3/4" : "w-0 group-hover:w-3/4"
                  }`} />
                </a>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setLocation('/enroll')}
              className="px-5 py-2.5 bg-brand-red text-white font-body font-semibold text-sm rounded-lg hover:bg-brand-red-dark transition-all duration-300 shadow-md shadow-brand-red/20 hover:shadow-lg hover:shadow-brand-red/30 cursor-pointer"
            >
              Enroll Now
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-brand-dark p-2 hover:text-brand-red transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-400 ${
            mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="container pb-6 pt-2 border-t border-brand-red/10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="block py-3 text-brand-dark/80 hover:text-brand-red font-body text-base font-medium border-b border-gray-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setLocation('/enroll');
              }}
              className="mt-4 w-full text-center px-5 py-3 bg-brand-red text-white font-body font-semibold text-sm rounded-lg cursor-pointer"
            >
              এখনই ভর্তি হন
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
