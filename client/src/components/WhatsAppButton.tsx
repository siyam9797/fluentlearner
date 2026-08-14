/**
 * WhatsAppButton — Floating WhatsApp CTA
 * FluentLearner Red+White Brand Theme
 * WhatsApp Business: +8801301872288
 */
import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { CONTACT } from "@/lib/siteConstants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function WhatsAppButton() {
  const ss = useSiteSettings();
  const [visible, setVisible] = useState(false);
  const [tooltip, setTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    const tooltipTimer = setTimeout(() => setTooltip(false), 8000);
    return () => {
      clearTimeout(timer);
      clearTimeout(tooltipTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      {/* Tooltip */}
      {tooltip && (
        <div className="bg-white shadow-lg shadow-brand-red/10 rounded-lg px-4 py-3 max-w-[200px] relative animate-in fade-in slide-in-from-right-4 duration-500">
          <button
            onClick={() => setTooltip(false)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-brand-dark rounded-full flex items-center justify-center"
            aria-label="Close tooltip"
          >
            <X className="w-3 h-3 text-white" />
          </button>
          <p className="text-brand-dark font-body text-sm font-medium">Need help? Chat with us!</p>
          <p className="text-brand-charcoal/50 font-body text-xs mt-1">We reply within minutes</p>
        </div>
      )}

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${ss.contactWhatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:scale-105 transition-all duration-300"
        aria-label="Chat on WhatsApp"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
        <MessageCircle className="w-7 h-7 text-white relative z-10" />
      </a>
    </div>
  );
}
