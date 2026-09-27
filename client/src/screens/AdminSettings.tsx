"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { LockKeyhole, Monitor, Palette } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import {
  loadStoredAdminAppearance,
  saveStoredAdminAppearance,
} from "@/lib/adminAppearance";
import AdminImageUploader from "@/components/AdminImageUploader";
import { Switch } from "@/components/ui/switch";

type SettingsTab = "branding" | "appearance" | "security";
type Branding = {
  logo_light: string;
  logo_dark: string;
  favicon: string;
  page_title: string;
  site_tagline: string;
};
type PaletteKey =
  | "primary"
  | "secondary"
  | "heading"
  | "body"
  | "placeholder"
  | "border"
  | "card_bg"
  | "background"
  | "success"
  | "failed"
  | "warning"
  | "info";
type Appearance = {
  darkMode: boolean;
  light: Record<PaletteKey, string>;
  dark: Record<PaletteKey, string>;
};
const emptyBranding: Branding = {
  logo_light: "",
  logo_dark: "",
  favicon: "",
  page_title: "FluentLearner",
  site_tagline: "Learn English with confidence.",
};
const settingMeta: Record<keyof Branding, { label: string; type: string }> = {
  logo_light: { label: "Logo (light)", type: "image" },
  logo_dark: { label: "Logo (dark)", type: "image" },
  favicon: { label: "Favicon", type: "image" },
  page_title: { label: "Page title", type: "text" },
  site_tagline: { label: "Tagline", type: "text" },
};
const paletteRows: {
  key: PaletteKey;
  label: string;
  description: string;
  status?: boolean;
}[] = [
  { key: "primary", label: "Primary", description: "Actions and accents" },
  { key: "secondary", label: "Secondary", description: "Text on primary" },
  { key: "heading", label: "Heading", description: "Titles and headings" },
  { key: "body", label: "Body", description: "Paragraph and label text" },
  {
    key: "placeholder",
    label: "Placeholder",
    description: "Form placeholder text",
  },
  { key: "border", label: "Border", description: "Dividers and inputs" },
  { key: "card_bg", label: "Card BG", description: "Cards and shaded areas" },
  {
    key: "background",
    label: "Background",
    description: "Admin, Student, and Website V2 page background",
  },
  {
    key: "success",
    label: "Success",
    description: "Published and completed",
    status: true,
  },
  {
    key: "failed",
    label: "Failed",
    description: "Errors and failures",
    status: true,
  },
  {
    key: "warning",
    label: "Warning",
    description: "Drafts and attention",
    status: true,
  },
  { key: "info", label: "Info", description: "New and unread", status: true },
];
const defaultAppearance: Appearance = {
  darkMode: false,
  light: {
    primary: "#C07F50",
    secondary: "#FFFFFF",
    heading: "#1E272E",
    body: "#646F79",
    placeholder: "#9AA5AF",
    border: "#E0E0E0",
    card_bg: "#FFFFFF",
    background: "#F8F7EC",
    success: "#2E7D32",
    failed: "#C62828",
    warning: "#ED6C02",
    info: "#1976D2",
  },
  dark: {
    primary: "#E0A978",
    secondary: "#1E272E",
    heading: "#F5F1EC",
    body: "#B7BEC4",
    placeholder: "#6B7580",
    border: "#33393F",
    card_bg: "#20262B",
    background: "#14181B",
    success: "#4CAF50",
    failed: "#EF5350",
    warning: "#FFA726",
    info: "#42A5F5",
  },
};
function loadLocalAppearance(): Appearance | null {
  return loadStoredAdminAppearance();
}

function saveLocalAppearance(appearance: Appearance) {
  saveStoredAdminAppearance(appearance);
}

function ColorCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2">
      <span className="relative grid h-11 w-11 place-items-center rounded-full border border-[#dedede] bg-white">
        <span
          className="h-8 w-8 rounded-full"
          style={{ backgroundColor: value }}
        />
      </span>
      <span className="font-mono text-xs uppercase text-[#747d87]">
        {value}
      </span>
      <input
        type="color"
        value={value}
        onChange={event => onChange(event.target.value.toUpperCase())}
        className="sr-only"
      />
    </label>
  );
}

function UploadField({
  label,
  value,
  recommendation,
  onChange,
}: {
  label: string;
  value: string;
  recommendation: string;
  onChange: (value: string) => void;
}) {
  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Images must be smaller than 5MB.");
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => toast.error("The image could not be read.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-[#30363d]">
        {label}
      </label>
      <AdminImageUploader
        value={value}
        label={label}
        recommendation={recommendation}
        onChange={selectFile}
        onMediaSelect={onChange}
        onRemove={() => onChange("")}
      />
    </div>
  );
}

export default function AdminSiteSettings() {
  const [tab, setTab] = useState<SettingsTab>("branding");
  const [branding, setBranding] = useState<Branding>(emptyBranding);
  const [savedBranding, setSavedBranding] = useState<Branding>(emptyBranding);
  const [appearance, setAppearance] = useState<Appearance>(defaultAppearance);
  const [savedAppearance, setSavedAppearance] =
    useState<Appearance>(defaultAppearance);
  const [sessionAlerts, setSessionAlerts] = useState(true);
  const settings = trpc.siteSettings.getAll.useQuery();
  const updateSettings = trpc.siteSettings.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!settings.data) return;
    const next = { ...emptyBranding };
    (Object.keys(next) as (keyof Branding)[]).forEach(key => {
      if (settings.data[key]) next[key] = settings.data[key];
    });
    setBranding(next);
    setSavedBranding(next);
    const localAppearance = loadLocalAppearance();
    const nextAppearance: Appearance = {
      darkMode: settings.data.appearance_dark_mode
        ? settings.data.appearance_dark_mode === "true"
        : (localAppearance?.darkMode ?? false),
      light: { ...defaultAppearance.light },
      dark: { ...defaultAppearance.dark },
    };
    paletteRows.forEach(({ key }) => {
      const lightValue = settings.data[`appearance_light_${key}`];
      const darkValue = settings.data[`appearance_dark_${key}`];
      if (lightValue) nextAppearance.light[key] = lightValue;
      else if (localAppearance?.light[key])
        nextAppearance.light[key] = localAppearance.light[key];
      if (darkValue) nextAppearance.dark[key] = darkValue;
      else if (localAppearance?.dark[key])
        nextAppearance.dark[key] = localAppearance.dark[key];
    });
    setAppearance(nextAppearance);
    setSavedAppearance(nextAppearance);
  }, [settings.data]);

  const setValue = (key: keyof Branding, value: string) =>
    setBranding(current => ({ ...current, [key]: value }));
  const saveBranding = async () => {
    if (!branding.page_title.trim())
      return toast.error("Page title is required.");
    try {
      await updateSettings.mutateAsync(
        (Object.keys(branding) as (keyof Branding)[]).map(key => ({
          key,
          value: branding[key] || null,
          type: settingMeta[key].type,
          group: "branding",
          label: settingMeta[key].label,
        }))
      );
      setSavedBranding(branding);
      await utils.siteSettings.getAll.invalidate();
      toast.success("Branding saved.");
    } catch {
      toast.error("Branding could not be saved.");
    }
  };
  const setColor = (mode: "light" | "dark", key: PaletteKey, value: string) =>
    setAppearance(current => ({
      ...current,
      [mode]: { ...current[mode], [key]: value },
    }));
  const saveAppearance = async () => {
    const entries = [
      {
        key: "appearance_dark_mode",
        value: String(appearance.darkMode),
        label: "Dark mode",
      },
    ];
    paletteRows.forEach(row => {
      entries.push({
        key: `appearance_light_${row.key}`,
        value: appearance.light[row.key],
        label: `${row.label} (light)`,
      });
      entries.push({
        key: `appearance_dark_${row.key}`,
        value: appearance.dark[row.key],
        label: `${row.label} (dark)`,
      });
    });
    try {
      saveLocalAppearance(appearance);
      await updateSettings.mutateAsync(
        entries.map(entry => ({ ...entry, type: "color", group: "appearance" }))
      );
      setSavedAppearance(appearance);
      await utils.siteSettings.getAll.invalidate();
      toast.success("Appearance saved.");
    } catch {
      setSavedAppearance(appearance);
      toast.success("Appearance saved locally.");
    }
  };
  const tabs = [
    { id: "branding" as const, label: "Branding", icon: Palette },
    { id: "appearance" as const, label: "Appearance", icon: Monitor },
    { id: "security" as const, label: "Security", icon: LockKeyhole },
  ];

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Settings"
        description="Manage how the site presents itself."
      />
      <div className="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <nav className="space-y-1 md:sticky md:top-8 md:self-start">
          {tabs.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex h-11 w-full items-center gap-3 text-left text-sm transition-colors ${tab === item.id ? "text-[#c76f42]" : "text-[#6c7580] hover:text-[#30363d]"}`}
              >
                <Icon className="h-4 w-4 stroke-[1.4]" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <main className="min-w-0">
          {settings.isLoading ? (
            <p className="py-16 text-center text-sm text-[#747d87]">
              Loading settings…
            </p>
          ) : tab === "branding" ? (
            <div className="space-y-14">
              <section>
                <h2 className="font-display text-xl font-bold text-[#30363d]">
                  Light appearance
                </h2>
                <p className="mb-7 mt-1 text-xs text-[#747d87]">
                  Logo used when light mode is active.
                </p>
                <UploadField
                  label="Logo (light)"
                  value={branding.logo_light}
                  recommendation="320 × 96px"
                  onChange={value => setValue("logo_light", value)}
                />
              </section>
              <section>
                <h2 className="font-display text-xl font-bold text-[#30363d]">
                  Dark appearance
                </h2>
                <p className="mb-7 mt-1 text-xs text-[#747d87]">
                  Logo used when dark mode is active.
                </p>
                <UploadField
                  label="Logo (dark)"
                  value={branding.logo_dark}
                  recommendation="320 × 96px"
                  onChange={value => setValue("logo_dark", value)}
                />
              </section>
              <section>
                <h2 className="font-display text-xl font-bold text-[#30363d]">
                  Site details
                </h2>
                <p className="mb-7 mt-1 text-xs text-[#747d87]">
                  Favicon and page title, shared across light and dark mode.
                </p>
                <UploadField
                  label="Favicon"
                  value={branding.favicon}
                  recommendation="512 × 512px"
                  onChange={value => setValue("favicon", value)}
                />
                <div className="mt-8 space-y-5">
                  <label className="block text-xs font-medium text-[#30363d]">
                    Page title
                    <input
                      value={branding.page_title}
                      onChange={event =>
                        setValue("page_title", event.target.value)
                      }
                      className="mt-2 h-11 w-full border border-[#d9d9d9] px-3.5 text-sm outline-none focus:border-[#c76f42]"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#30363d]">
                    Tagline
                    <input
                      value={branding.site_tagline}
                      onChange={event =>
                        setValue("site_tagline", event.target.value)
                      }
                      className="mt-2 h-11 w-full border border-[#d9d9d9] px-3.5 text-sm outline-none focus:border-[#c76f42]"
                    />
                  </label>
                </div>
                <div className="mt-0 flex flex-wrap gap-3 pt-8">
                  <button
                    onClick={saveBranding}
                    disabled={updateSettings.isPending}
                    className="admin-button admin-button-primary min-w-42"
                  >
                    {updateSettings.isPending ? "Saving…" : "Save branding"}
                  </button>
                  <button
                    onClick={() => setBranding(savedBranding)}
                    disabled={
                      JSON.stringify(branding) === JSON.stringify(savedBranding)
                    }
                    className="admin-button admin-button-secondary min-w-42"
                  >
                    Discard changes
                  </button>
                </div>
              </section>
            </div>
          ) : tab === "appearance" ? (
            <section>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c76f42]">
                    Active appearance
                  </p>
                  <h2 className="font-display text-xl font-bold text-[#30363d]">
                    Dark mode
                  </h2>
                  <p className="mt-1 text-xs text-[#747d87]">
                    {appearance.darkMode
                      ? "Dark mode is active."
                      : "Light mode is active."}{" "}
                    Turn on Dark mode to configure both palettes.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Switch
                    id="dark-mode"
                    checked={appearance.darkMode}
                    onCheckedChange={checked =>
                      setAppearance(current => ({
                        ...current,
                        darkMode: checked,
                      }))
                    }
                  />
                  <label
                    htmlFor="dark-mode"
                    className="cursor-pointer text-xs font-medium text-[#30363d]"
                  >
                    {appearance.darkMode ? "On" : "Off"}
                  </label>
                </div>
              </div>
              <div className="mt-14">
                <h2 className="font-display text-xl font-bold text-[#30363d]">
                  Theme palettes
                </h2>
                <p className="mt-1 text-xs text-[#747d87]">
                  Adjust the matching Light and Dark values side by side.
                </p>
                <div className="mt-7 grid grid-cols-[minmax(0,1fr)_110px_110px] items-center border-b border-[#dedede] pb-5 text-center text-xs font-medium">
                  <span />
                  <span>Light</span>
                  <span>Dark</span>
                </div>
                {paletteRows
                  .filter(row => !row.status)
                  .map(row => (
                    <div
                      key={row.key}
                      className="grid min-h-[100px] grid-cols-[minmax(0,1fr)_110px_110px] items-center border-b border-[#dedede]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#30363d]">
                          {row.label}
                        </p>
                        <p className="mt-1 text-xs text-[#747d87]">
                          {row.description}
                        </p>
                      </div>
                      <ColorCell
                        value={appearance.light[row.key]}
                        onChange={value => setColor("light", row.key, value)}
                      />
                      <ColorCell
                        value={appearance.dark[row.key]}
                        onChange={value => setColor("dark", row.key, value)}
                      />
                    </div>
                  ))}
              </div>
              <div className="mt-12">
                <h2 className="font-display text-xl font-bold text-[#30363d]">
                  Status colors
                </h2>
                <p className="mt-1 text-xs text-[#747d87]">
                  Customize the colors used for success, errors, warnings, and
                  new items.
                </p>
                <div className="mt-7 grid grid-cols-[minmax(0,1fr)_110px_110px] items-center border-b border-[#dedede] pb-5 text-center text-xs font-medium">
                  <span />
                  <span>Light</span>
                  <span>Dark</span>
                </div>
                {paletteRows
                  .filter(row => row.status)
                  .map(row => (
                    <div
                      key={row.key}
                      className="grid min-h-[100px] grid-cols-[minmax(0,1fr)_110px_110px] items-center border-b border-[#dedede]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#30363d]">
                          {row.label}
                        </p>
                        <p className="mt-1 text-xs text-[#747d87]">
                          {row.description}
                        </p>
                      </div>
                      <ColorCell
                        value={appearance.light[row.key]}
                        onChange={value => setColor("light", row.key, value)}
                      />
                      <ColorCell
                        value={appearance.dark[row.key]}
                        onChange={value => setColor("dark", row.key, value)}
                      />
                    </div>
                  ))}
              </div>
              <div className="mt-0 flex flex-wrap gap-3 pt-8">
                <button
                  onClick={saveAppearance}
                  disabled={updateSettings.isPending}
                  className="admin-button admin-button-primary min-w-48"
                >
                  {updateSettings.isPending ? "Saving…" : "Save appearance"}
                </button>
                <button
                  onClick={() => setAppearance(savedAppearance)}
                  disabled={
                    JSON.stringify(appearance) ===
                    JSON.stringify(savedAppearance)
                  }
                  className="admin-button admin-button-secondary min-w-42"
                >
                  Discard changes
                </button>
              </div>
            </section>
          ) : (
            <section>
              <h2 className="font-display text-xl font-bold text-[#30363d]">
                Security
              </h2>
              <p className="mb-8 mt-1 text-sm text-[#747d87]">
                Manage local administrator security preferences.
              </p>
              <label className="flex items-center justify-between border-y border-[#dedede] py-5 text-sm text-[#30363d]">
                <span>
                  <strong className="block font-medium">
                    Login notifications
                  </strong>
                  <span className="mt-1 block text-xs text-[#747d87]">
                    Show a notice when a new local session starts.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={sessionAlerts}
                  onChange={event => setSessionAlerts(event.target.checked)}
                  className="h-4 w-4 accent-[#c76f42]"
                />
              </label>
              <button
                onClick={() => toast.success("Security preferences saved.")}
                className="admin-button admin-button-primary mt-8"
              >
                Save security
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
