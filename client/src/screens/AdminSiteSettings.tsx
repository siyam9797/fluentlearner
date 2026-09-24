import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminImageUploader from "@/components/AdminImageUploader";
import { Loader2, Globe, MessageCircle, FileText, Shield } from "lucide-react";

// ============================================
// Setting definitions — grouped by section
// ============================================
interface SettingDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "url";
  group: string;
  placeholder?: string;
}

const SETTING_DEFINITIONS: SettingDef[] = [
  // Hero Section
  {
    key: "hero_title",
    label: "Hero title",
    type: "text",
    group: "hero",
    placeholder: "Your Path to IELTS Success",
  },
  {
    key: "hero_subtitle",
    label: "Hero subtitle",
    type: "text",
    group: "hero",
    placeholder: "Your trusted partner for IELTS success",
  },
  {
    key: "hero_description",
    label: "Hero description",
    type: "textarea",
    group: "hero",
    placeholder: "Expert-led IELTS preparation with one-to-one mentorship...",
  },
  {
    key: "hero_image",
    label: "Hero image URL",
    type: "image",
    group: "hero",
    placeholder: "https://...",
  },
  {
    key: "hero_cta_text",
    label: "CTA button text",
    type: "text",
    group: "hero",
    placeholder: "Enroll now",
  },
  {
    key: "hero_cta_link",
    label: "CTA button link",
    type: "url",
    group: "hero",
    placeholder: "/enroll",
  },

  // Stats
  {
    key: "stat_total_scorers",
    label: "Total successful students",
    type: "text",
    group: "stats",
    placeholder: "10K+",
  },
  {
    key: "stat_success_rate",
    label: "Success rate (%)",
    type: "text",
    group: "stats",
    placeholder: "95%",
  },
  {
    key: "stat_avg_band",
    label: "Average band score",
    type: "text",
    group: "stats",
    placeholder: "7.0+",
  },
  {
    key: "stat_years_experience",
    label: "Years of experience",
    type: "text",
    group: "stats",
    placeholder: "6",
  },
  {
    key: "stat_course_type",
    label: "Course type",
    type: "text",
    group: "stats",
    placeholder: "Online & Offline",
  },
  {
    key: "stat_facebook_followers",
    label: "Facebook followers",
    type: "text",
    group: "stats",
    placeholder: "27K+",
  },

  // CTA Commitment Card
  {
    key: "cta_commitment_title",
    label: "Commitment title",
    type: "text",
    group: "cta",
    placeholder: "Our commitment",
  },
  {
    key: "cta_commitment_description",
    label: "Commitment description",
    type: "textarea",
    group: "cta",
    placeholder: "We are committed to every student's success...",
  },
  {
    key: "cta_support_value",
    label: "Support availability",
    type: "text",
    group: "cta",
    placeholder: "24/7",
  },
  {
    key: "cta_price_label",
    label: "Price label",
    type: "text",
    group: "cta",
    placeholder: "VIP courses start at",
  },
  {
    key: "cta_offer_label",
    label: "Offer label",
    type: "text",
    group: "cta",
    placeholder: "Limited-time offer",
  },

  // About Section
  {
    key: "about_title",
    label: "About title",
    type: "text",
    group: "about",
    placeholder: "About us",
  },
  {
    key: "about_description",
    label: "About description",
    type: "textarea",
    group: "about",
    placeholder: "Organization overview...",
  },
  {
    key: "about_image",
    label: "About image URL",
    type: "image",
    group: "about",
    placeholder: "https://...",
  },
  {
    key: "about_mission",
    label: "Mission",
    type: "textarea",
    group: "about",
    placeholder: "Our mission...",
  },
  {
    key: "about_vision",
    label: "Vision",
    type: "textarea",
    group: "about",
    placeholder: "Our vision...",
  },

  // Founder/Instructor
  {
    key: "founder_name",
    label: "Founder name",
    type: "text",
    group: "founder",
    placeholder: "Founder name",
  },
  {
    key: "founder_title",
    label: "Founder title",
    type: "text",
    group: "founder",
    placeholder: "Founder & Lead IELTS Mentor",
  },
  {
    key: "founder_photo",
    label: "Founder image URL",
    type: "image",
    group: "founder",
    placeholder: "https://...",
  },
  {
    key: "founder_bio",
    label: "Founder biography",
    type: "textarea",
    group: "founder",
    placeholder: "Short biography...",
  },

  // Contact Info
  {
    key: "contact_phone",
    label: "Phone number",
    type: "text",
    group: "contact",
    placeholder: "+880 1301-872288",
  },
  {
    key: "contact_email",
    label: "Email",
    type: "text",
    group: "contact",
    placeholder: "hello@example.com",
  },
  {
    key: "contact_whatsapp",
    label: "WhatsApp number",
    type: "text",
    group: "contact",
    placeholder: "8801301872288",
  },
  {
    key: "contact_address",
    label: "Address",
    type: "textarea",
    group: "contact",
    placeholder: "Chittagong, Bangladesh",
  },

  // Social Links
  {
    key: "social_facebook",
    label: "Facebook page URL",
    type: "url",
    group: "social",
    placeholder: "https://www.facebook.com/fluentlearner",
  },
  {
    key: "social_youtube",
    label: "YouTube channel URL",
    type: "url",
    group: "social",
    placeholder: "https://www.youtube.com/@FluentLearnerIELTS",
  },
  {
    key: "social_instagram",
    label: "Instagram URL",
    type: "url",
    group: "social",
    placeholder: "https://www.instagram.com/...",
  },

  // Footer
  {
    key: "footer_text",
    label: "Footer text",
    type: "text",
    group: "footer",
    placeholder: "© 2026 FluentLearner. All rights reserved.",
  },
  {
    key: "footer_tagline",
    label: "Footer tagline",
    type: "text",
    group: "footer",
    placeholder: "Your trusted partner for IELTS success",
  },
];

const GROUP_CONFIG: Record<
  string,
  { title: string; icon: React.ElementType; description: string }
> = {
  hero: {
    title: "Hero",
    icon: Globe,
    description: "Main homepage banner, messaging, and call to action.",
  },
  stats: {
    title: "Statistics",
    icon: FileText,
    description: "Student, success-rate, band-score, and audience figures.",
  },
  cta: {
    title: "Commitment card",
    icon: Shield,
    description: "Call-to-action copy, support availability, and offer labels.",
  },
  about: {
    title: "About",
    icon: FileText,
    description: "Organization overview, mission, vision, and imagery.",
  },
  founder: {
    title: "Founder",
    icon: Shield,
    description: "Founder or mentor profile shown on the website.",
  },
  contact: {
    title: "Contact",
    icon: MessageCircle,
    description: "Public phone, email, WhatsApp, and address details.",
  },
  social: {
    title: "Social media",
    icon: Globe,
    description: "Public Facebook, YouTube, and Instagram links.",
  },
  footer: {
    title: "Footer",
    icon: FileText,
    description: "Footer copyright text and tagline.",
  },
};

export default function AdminSiteSettings() {
  const { user, loading } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState("hero");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing settings
  const { data: settingsData, isLoading: settingsLoading } =
    trpc.siteSettings.getAll.useQuery(undefined, {
      enabled: !!user && canAccessAdminDashboard(user.role),
    });

  const updateMutation = trpc.siteSettings.update.useMutation();
  const uploadMutation = trpc.upload.image.useMutation();
  const utils = trpc.useUtils();

  // Populate form with existing values
  useEffect(() => {
    if (settingsData) {
      const v: Record<string, string> = {};
      for (const def of SETTING_DEFINITIONS) {
        v[def.key] = settingsData[def.key] || "";
      }
      setValues(v);
      setSavedValues(v);
    }
  }, [settingsData]);

  const groups = useMemo(() => {
    const g: string[] = [];
    for (const def of SETTING_DEFINITIONS) {
      if (!g.includes(def.group)) g.push(def.group);
    }
    return g;
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const settings = SETTING_DEFINITIONS.map(def => ({
        key: def.key,
        value: values[def.key] || null,
        type: def.type,
        group: def.group,
        label: def.label,
      }));
      await updateMutation.mutateAsync(settings);
      setSavedValues(values);
      utils.siteSettings.getAll.invalidate();
      toast.success("Site content saved.");
    } catch (err) {
      toast.error("Unable to save site content.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be smaller than 5MB.");
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
        });
        setValues(prev => ({ ...prev, [key]: result.url }));
        toast.success("Image uploaded.");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Unable to upload the image.");
    }
  };

  // Auth checks
  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand-red border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading site content…</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccessAdminDashboard(user.role)) return null;

  const activeSettings = SETTING_DEFINITIONS.filter(
    d => d.group === activeGroup
  );
  const activeGroupConfig = GROUP_CONFIG[activeGroup];

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Site Content"
        description="Manage the content displayed across your website."
      />
      <div className="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <nav className="space-y-1 md:sticky md:top-8 md:self-start">
          {groups.map(group => {
            const cfg = GROUP_CONFIG[group];
            const Icon = cfg?.icon || FileText;
            return (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`flex h-11 w-full items-center gap-3 text-left text-sm transition-colors ${activeGroup === group ? "text-[#c76f42]" : "text-[#6c7580] hover:text-[#30363d]"}`}
              >
                <Icon className="h-4 w-4 stroke-[1.4]" />
                <span className="truncate">{cfg?.title || group}</span>
              </button>
            );
          })}
        </nav>
        <main className="min-w-0">
          <section>
            <h2 className="font-display text-xl font-bold text-[#30363d]">
              {activeGroupConfig?.title || activeGroup}
            </h2>
            <p className="mb-8 mt-1 text-sm text-[#747d87]">
              {activeGroupConfig?.description}
            </p>
            <div className="space-y-6">
              {activeSettings.map(def => (
                <div key={def.key}>
                  <label className="mb-2 block text-sm font-medium text-[#30363d]">
                    {def.label}
                  </label>
                  {def.type === "textarea" ? (
                    <textarea
                      value={values[def.key] || ""}
                      onChange={event =>
                        setValues(current => ({
                          ...current,
                          [def.key]: event.target.value,
                        }))
                      }
                      placeholder={def.placeholder}
                      rows={5}
                      className="w-full resize-y border border-[#d9d9d9] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#c76f42]"
                    />
                  ) : def.type === "image" ? (
                    <div className="space-y-3">
                      <input
                        value={values[def.key] || ""}
                        onChange={event =>
                          setValues(current => ({
                            ...current,
                            [def.key]: event.target.value,
                          }))
                        }
                        placeholder={def.placeholder}
                        className="h-11 w-full border border-[#d9d9d9] bg-white px-3.5 text-sm outline-none focus:border-[#c76f42]"
                      />
                      <AdminImageUploader
                        value={values[def.key]}
                        label={def.label}
                        onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) handleImageUpload(def.key, file);
                        }}
                        onMediaSelect={url =>
                          setValues(current => ({ ...current, [def.key]: url }))
                        }
                        onRemove={() =>
                          setValues(current => ({ ...current, [def.key]: "" }))
                        }
                      />
                    </div>
                  ) : (
                    <input
                      type={def.type === "url" ? "url" : "text"}
                      value={values[def.key] || ""}
                      onChange={event =>
                        setValues(current => ({
                          ...current,
                          [def.key]: event.target.value,
                        }))
                      }
                      placeholder={def.placeholder}
                      className="h-11 w-full border border-[#d9d9d9] bg-white px-3.5 text-sm outline-none focus:border-[#c76f42]"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-0 flex flex-wrap gap-3 pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="admin-button admin-button-primary min-w-40"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? "Saving…" : "Save content"}
              </button>
              <button
                onClick={() => setValues(savedValues)}
                disabled={
                  JSON.stringify(values) === JSON.stringify(savedValues)
                }
                className="admin-button admin-button-secondary min-w-40"
              >
                Discard changes
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
