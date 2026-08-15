import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  Image as ImageIcon,
  Globe,
  MessageCircle,
  FileText,
  Upload,
  Shield,
  XCircle,
} from "lucide-react";

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
  { key: "hero_title", label: "হিরো শিরোনাম", type: "text", group: "hero", placeholder: "Your Path to IELTS Success" },
  { key: "hero_subtitle", label: "হিরো সাব-টাইটেল", type: "text", group: "hero", placeholder: "আপনার IELTS সাফল্যের নির্ভরযোগ্য সঙ্গী" },
  { key: "hero_description", label: "হিরো বিবরণ", type: "textarea", group: "hero", placeholder: "Expert-led IELTS preparation with one-to-one mentorship..." },
  { key: "hero_image", label: "হিরো ছবি/ব্যানার URL", type: "image", group: "hero", placeholder: "https://..." },
  { key: "hero_cta_text", label: "CTA বাটন টেক্সট", type: "text", group: "hero", placeholder: "এখনই ভর্তি হন" },
  { key: "hero_cta_link", label: "CTA বাটন লিংক", type: "url", group: "hero", placeholder: "/enroll" },

  // Stats
  { key: "stat_total_scorers", label: "মোট সফল শিক্ষার্থী", type: "text", group: "stats", placeholder: "10000 বা 10K+" },
  { key: "stat_success_rate", label: "সাফল্যের হার (%)", type: "text", group: "stats", placeholder: "95 বা 95%" },
  { key: "stat_avg_band", label: "গড় ব্যান্ড স্কোর", type: "text", group: "stats", placeholder: "7.0+" },
  { key: "stat_years_experience", label: "অভিজ্ঞতা (বছর)", type: "text", group: "stats", placeholder: "6" },
  { key: "stat_course_type", label: "কোর্সের ধরণ", type: "text", group: "stats", placeholder: "Online & Offline" },
  { key: "stat_facebook_followers", label: "Facebook ফলোয়ার্স", type: "text", group: "stats", placeholder: "27K+" },

  // About Section
  { key: "about_title", label: "About শিরোনাম", type: "text", group: "about", placeholder: "আমাদের সম্পর্কে" },
  { key: "about_description", label: "About বিবরণ", type: "textarea", group: "about", placeholder: "প্রতিষ্ঠানের পরিচিতি..." },
  { key: "about_image", label: "About ছবি URL", type: "image", group: "about", placeholder: "https://..." },
  { key: "about_mission", label: "মিশন", type: "textarea", group: "about", placeholder: "আমাদের মিশন..." },
  { key: "about_vision", label: "ভিশন", type: "textarea", group: "about", placeholder: "আমাদের ভিশন..." },

  // Founder/Instructor
  { key: "founder_name", label: "প্রতিষ্ঠাতার নাম", type: "text", group: "founder", placeholder: "MD Aditow Zahid" },
  { key: "founder_title", label: "পদবি", type: "text", group: "founder", placeholder: "Founder & Lead IELTS Mentor" },
  { key: "founder_photo", label: "প্রতিষ্ঠাতার ছবি URL", type: "image", group: "founder", placeholder: "https://..." },
  { key: "founder_bio", label: "প্রতিষ্ঠাতার পরিচিতি", type: "textarea", group: "founder", placeholder: "সংক্ষিপ্ত পরিচিতি..." },

  // Contact Info
  { key: "contact_phone", label: "ফোন নম্বর", type: "text", group: "contact", placeholder: "+880 1301-872288" },
  { key: "contact_email", label: "ইমেইল", type: "text", group: "contact", placeholder: "fluentlearnerbd@gmail.com" },
  { key: "contact_whatsapp", label: "WhatsApp নম্বর", type: "text", group: "contact", placeholder: "8801301872288" },
  { key: "contact_address", label: "ঠিকানা", type: "textarea", group: "contact", placeholder: "Chittagong, Bangladesh" },

  // Social Links
  { key: "social_facebook", label: "Facebook পেজ URL", type: "url", group: "social", placeholder: "https://www.facebook.com/fluentlearner" },
  { key: "social_youtube", label: "YouTube চ্যানেল URL", type: "url", group: "social", placeholder: "https://www.youtube.com/@FluentLearnerIELTS" },
  { key: "social_instagram", label: "Instagram URL", type: "url", group: "social", placeholder: "https://www.instagram.com/..." },

  // Footer
  { key: "footer_text", label: "ফুটার টেক্সট", type: "text", group: "footer", placeholder: "© 2026 FluentLearner. All rights reserved." },
  { key: "footer_tagline", label: "ফুটার ট্যাগলাইন", type: "text", group: "footer", placeholder: "আপনার IELTS সাফল্যের নির্ভরযোগ্য সঙ্গী" },
];

const GROUP_CONFIG: Record<string, { title: string; icon: React.ElementType; description: string }> = {
  hero: { title: "হিরো সেকশন", icon: Globe, description: "হোমপেজের প্রধান ব্যানার ও শিরোনাম" },
  stats: { title: "পরিসংখ্যান", icon: FileText, description: "সাইটের সংখ্যাগত তথ্য (শিক্ষার্থী, ব্যান্ড স্কোর ইত্যাদি)" },
  about: { title: "About সেকশন", icon: FileText, description: "প্রতিষ্ঠানের পরিচিতি, মিশন ও ভিশন" },
  founder: { title: "প্রতিষ্ঠাতা তথ্য", icon: Shield, description: "প্রতিষ্ঠাতা/মেন্টরের নাম, ছবি ও পরিচিতি" },
  contact: { title: "যোগাযোগ তথ্য", icon: MessageCircle, description: "ফোন, ইমেইল, WhatsApp, ঠিকানা" },
  social: { title: "সোশ্যাল মিডিয়া", icon: Globe, description: "Facebook, YouTube, Instagram লিংক" },
  footer: { title: "ফুটার কন্টেন্ট", icon: FileText, description: "ফুটারের টেক্সট ও ট্যাগলাইন" },
};

export default function AdminSiteSettings() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState("hero");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing settings
  const { data: settingsData, isLoading: settingsLoading } = trpc.siteSettings.getAll.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
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
      const settings = SETTING_DEFINITIONS.map((def) => ({
        key: def.key,
        value: values[def.key] || null,
        type: def.type,
        group: def.group,
        label: def.label,
      }));
      await updateMutation.mutateAsync(settings);
      utils.siteSettings.getAll.invalidate();
      toast.success("সেটিংস সফলভাবে সেভ হয়েছে!");
    } catch (err) {
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB-এর বেশি হতে পারবে না");
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
        setValues((prev) => ({ ...prev, [key]: result.url }));
        toast.success("ছবি আপলোড হয়েছে");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("ছবি আপলোড করতে সমস্যা হয়েছে");
    }
  };

  // Auth checks
  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand-red border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/admin";
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-600 mb-2">অ্যাক্সেস নেই</h1>
            <p className="text-gray-500 mb-4">আপনার অ্যাডমিন অনুমতি নেই।</p>
            <Button variant="outline" onClick={() => setLocation("/")}>হোম পেজে ফিরুন</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSettings = SETTING_DEFINITIONS.filter((d) => d.group === activeGroup);
  const activeGroupConfig = GROUP_CONFIG[activeGroup];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/admin")} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">সাইট সেটিংস</h1>
              <p className="text-xs text-gray-500">ওয়েবসাইটের কন্টেন্ট পরিবর্তন করুন</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-red hover:bg-brand-red-dark text-white"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> সেভ হচ্ছে...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> সব সেভ করুন</>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar — Group Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden lg:sticky lg:top-20">
              <div className="p-3 border-b bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">সেকশন</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {groups.map((g) => {
                  const cfg = GROUP_CONFIG[g];
                  const Icon = cfg?.icon || FileText;
                  return (
                    <button
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                        activeGroup === g
                          ? "bg-brand-red/10 text-brand-red"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{cfg?.title || g}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content — Settings Form */}
          <div className="flex-1 min-w-0">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                {/* Group Header */}
                <div className="mb-6 pb-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {activeGroupConfig && <activeGroupConfig.icon className="w-5 h-5 text-indigo-500" />}
                    {activeGroupConfig?.title || activeGroup}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{activeGroupConfig?.description}</p>
                </div>

                {/* Settings Fields */}
                <div className="space-y-5">
                  {activeSettings.map((def) => (
                    <div key={def.key}>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        {def.label}
                      </label>

                      {def.type === "textarea" ? (
                        <Textarea
                          value={values[def.key] || ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [def.key]: e.target.value }))}
                          placeholder={def.placeholder}
                          rows={4}
                          className="resize-y"
                        />
                      ) : def.type === "image" ? (
                        <div className="space-y-2">
                          <Input
                            value={values[def.key] || ""}
                            onChange={(e) => setValues((prev) => ({ ...prev, [def.key]: e.target.value }))}
                            placeholder={def.placeholder}
                          />
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition-colors">
                              <Upload className="w-4 h-4" />
                              ছবি আপলোড
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(def.key, file);
                                }}
                              />
                            </label>
                            {values[def.key] && (
                              <img
                                src={values[def.key]}
                                alt="Preview"
                                className="h-12 w-12 object-cover rounded-lg border"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <Input
                          value={values[def.key] || ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [def.key]: e.target.value }))}
                          placeholder={def.placeholder}
                          type={def.type === "url" ? "url" : "text"}
                        />
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        কী: <code className="bg-gray-100 px-1 rounded text-xs">{def.key}</code>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Save Button (bottom) */}
                <div className="mt-8 pt-4 border-t flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-red hover:bg-brand-red-dark text-white px-8"
                  >
                    {isSaving ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> সেভ হচ্ছে...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> সব সেভ করুন</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
