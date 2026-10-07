"use client";

import { ChangeEvent, useEffect, useState } from "react";
import {
  CreditCard,
  LockKeyhole,
  Monitor,
  Palette,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { canManageUsers } from "@shared/roles";
import AdminSelect from "@/components/AdminSelect";
import { trpc } from "@/lib/trpc";
import { fileToBase64 } from "@/lib/fileToBase64";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import {
  loadStoredAdminAppearance,
  saveStoredAdminAppearance,
  saveAdminMode,
} from "@/lib/adminAppearance";
import AdminImageUploader from "@/components/AdminImageUploader";
import { Switch } from "@/components/ui/switch";

type SettingsTab = "branding" | "appearance" | "payments" | "security" | "ai";

/** Admin / Super Admin: bKash checkout credentials for online payment on the v2 enroll page. */
function OnlinePaymentSettings() {
  const utils = trpc.useUtils();
  const status = trpc.paymentGateway.status.useQuery();
  const [form, setForm] = useState({
    enabled: true,
    mode: "sandbox" as "sandbox" | "live",
    username: "",
    password: "",
    appKey: "",
    appSecret: "",
  });
  useEffect(() => {
    if (!status.data) return;
    setForm(current => ({
      ...current,
      enabled: status.data.enabled,
      mode: status.data.mode,
      username: status.data.username,
    }));
  }, [status.data]);
  const save = trpc.paymentGateway.save.useMutation({
    onSuccess: async () => {
      setForm(current => ({
        ...current,
        password: "",
        appKey: "",
        appSecret: "",
      }));
      await utils.paymentGateway.status.invalidate();
      utils.payments.available.invalidate();
      toast.success(
        form.enabled
          ? "Credentials checked with bKash and saved."
          : "Saved. Online payment is off."
      );
    },
    onError: error => toast.error(error.message),
  });
  const data = status.data;
  const field =
    "mt-2 h-11 w-full border border-[#d9d9d9] px-3.5 text-sm outline-none focus:border-[#c76f42]";
  const secret = (
    key: "password" | "appKey" | "appSecret",
    label: string,
    saved: boolean
  ) => (
    <label className="block text-xs font-medium text-[#30363d]">
      {label}
      <input
        type="password"
        value={form[key]}
        onChange={event =>
          setForm(current => ({ ...current, [key]: event.target.value }))
        }
        placeholder={saved ? "Saved — leave blank to keep" : ""}
        autoComplete="off"
        spellCheck={false}
        className={`${field} font-mono`}
      />
    </label>
  );

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-[#30363d]">bKash</h2>
      <p className="mb-8 mt-1 text-sm text-[#747d87]">
        Online payment on the new website&apos;s enroll page: students pay and
        are enrolled straight away. Bank and manual methods stay under Payments.
      </p>
      <div className="border-y border-[#dedede] py-5 text-sm text-[#30363d]">
        <strong className="block font-medium">Status</strong>
        <span className="mt-1 block text-xs text-[#747d87]">
          {status.isLoading
            ? "Checking…"
            : data?.active
              ? data.source === "environment"
                ? "On — using the server's BKASH_* settings. Saving here replaces them."
                : `On — ${data.mode === "live" ? "Live" : "Sandbox"} mode${data.appKeyHint ? `, app key ${data.appKeyHint}` : ""}.`
              : data?.source === "settings" && !data.enabled
                ? "Off — turned off here."
                : "Off — no bKash credentials are set."}
        </span>
      </div>
      <form
        className="mt-8 space-y-5"
        onSubmit={event => {
          event.preventDefault();
          save.mutate(form);
        }}
      >
        <label className="flex items-center justify-between gap-4 text-sm text-[#30363d]">
          <span>
            <strong className="block font-medium">Accept bKash payments</strong>
            <span className="mt-1 block text-xs text-[#747d87]">
              When off, the enroll page hides online payment.
            </span>
          </span>
          <Switch
            checked={form.enabled}
            onCheckedChange={enabled =>
              setForm(current => ({ ...current, enabled }))
            }
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#30363d]">
            Mode
            <div className="mt-2">
              <AdminSelect
                value={form.mode}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    mode: event.target.value as "sandbox" | "live",
                  }))
                }
              >
                <option value="sandbox">Sandbox (testing)</option>
                <option value="live">Live (real payments)</option>
              </AdminSelect>
            </div>
          </label>
          <label className="block text-xs font-medium text-[#30363d]">
            Username
            <input
              value={form.username}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              autoComplete="off"
              spellCheck={false}
              className={field}
            />
          </label>
          {secret("password", "Password", !!data?.hasPassword)}
          {secret("appKey", "App key", !!data?.appKeyHint)}
          {secret("appSecret", "App secret", !!data?.hasAppSecret)}
        </div>
        <p className="text-xs text-[#747d87]">
          From your bKash merchant (PGW) account. The credentials are checked
          with bKash before they&apos;re saved, and are never shown again.
        </p>
        <button
          type="submit"
          disabled={!form.username.trim() || save.isPending}
          className="admin-button admin-button-primary min-w-42"
        >
          {save.isPending ? "Checking with bKash…" : "Save online payment"}
        </button>
      </form>
    </section>
  );
}

/** Admin / Super Admin: SSLCommerz store for Nagad, Rocket and card payments on the v2 enroll page. */
function SslcommerzSettings() {
  const utils = trpc.useUtils();
  const status = trpc.paymentGateway.sslcommerzStatus.useQuery();
  const [form, setForm] = useState({
    enabled: true,
    mode: "sandbox" as "sandbox" | "live",
    storeId: "",
    storePassword: "",
  });
  useEffect(() => {
    if (!status.data) return;
    setForm(current => ({
      ...current,
      enabled: status.data.enabled,
      mode: status.data.mode,
      storeId: status.data.storeId,
    }));
  }, [status.data]);
  const save = trpc.paymentGateway.sslcommerzSave.useMutation({
    onSuccess: async () => {
      setForm(current => ({ ...current, storePassword: "" }));
      await utils.paymentGateway.sslcommerzStatus.invalidate();
      utils.payments.available.invalidate();
      toast.success(
        form.enabled
          ? "Store checked with SSLCommerz and saved."
          : "Saved. Nagad / Rocket / card payment is off."
      );
    },
    onError: error => toast.error(error.message),
  });
  const data = status.data;
  const field =
    "mt-2 h-11 w-full border border-[#d9d9d9] px-3.5 text-sm outline-none focus:border-[#c76f42]";

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-[#30363d]">
        Nagad, Rocket and cards (SSLCommerz)
      </h2>
      <p className="mb-8 mt-1 text-sm text-[#747d87]">
        A second button on the enroll page opens SSLCommerz&apos;s checkout,
        where students pay with Nagad, Rocket, a card or internet banking.
      </p>
      <div className="border-y border-[#dedede] py-5 text-sm text-[#30363d]">
        <strong className="block font-medium">Status</strong>
        <span className="mt-1 block text-xs text-[#747d87]">
          {status.isLoading
            ? "Checking…"
            : data?.active
              ? data.source === "environment"
                ? "On — using the server's SSLCOMMERZ_* settings. Saving here replaces them."
                : `On — ${data.mode === "live" ? "Live" : "Sandbox"} mode, store ${data.storeId}.`
              : data?.source === "settings" && !data.enabled
                ? "Off — turned off here."
                : "Off — no SSLCommerz store is set."}
        </span>
      </div>
      <form
        className="mt-8 space-y-5"
        onSubmit={event => {
          event.preventDefault();
          save.mutate(form);
        }}
      >
        <label className="flex items-center justify-between gap-4 text-sm text-[#30363d]">
          <span>
            <strong className="block font-medium">
              Accept Nagad, Rocket and cards
            </strong>
            <span className="mt-1 block text-xs text-[#747d87]">
              When off, the enroll page hides this button.
            </span>
          </span>
          <Switch
            checked={form.enabled}
            onCheckedChange={enabled =>
              setForm(current => ({ ...current, enabled }))
            }
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#30363d]">
            Mode
            <div className="mt-2">
              <AdminSelect
                value={form.mode}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    mode: event.target.value as "sandbox" | "live",
                  }))
                }
              >
                <option value="sandbox">Sandbox (testing)</option>
                <option value="live">Live (real payments)</option>
              </AdminSelect>
            </div>
          </label>
          <label className="block text-xs font-medium text-[#30363d]">
            Store ID
            <input
              value={form.storeId}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  storeId: event.target.value,
                }))
              }
              autoComplete="off"
              spellCheck={false}
              className={field}
            />
          </label>
          <label className="block text-xs font-medium text-[#30363d]">
            Store password
            <input
              type="password"
              value={form.storePassword}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  storePassword: event.target.value,
                }))
              }
              placeholder={
                data?.hasStorePassword ? "Saved — leave blank to keep" : ""
              }
              autoComplete="off"
              spellCheck={false}
              className={`${field} font-mono`}
            />
          </label>
        </div>
        <p className="text-xs text-[#747d87]">
          From your SSLCommerz merchant panel (a free sandbox store is available
          at developer.sslcommerz.com). The store is checked with SSLCommerz
          before it&apos;s saved, and the password is never shown again.
        </p>
        <button
          type="submit"
          disabled={!form.storeId.trim() || save.isPending}
          className="admin-button admin-button-primary min-w-42"
        >
          {save.isPending ? "Checking with SSLCommerz…" : "Save SSLCommerz"}
        </button>
      </form>
    </section>
  );
}

/** Super Admin: the Anthropic API key used for AI marking of Writing and Speaking. */
function AiSettings() {
  const utils = trpc.useUtils();
  const status = trpc.aiSettings.status.useQuery();
  const [apiKey, setApiKey] = useState("");
  const saveKey = trpc.aiSettings.saveKey.useMutation({
    onSuccess: async () => {
      setApiKey("");
      await utils.aiSettings.status.invalidate();
      utils.mockTests.aiAvailable.invalidate();
      toast.success("API key checked and saved. AI marking is on.");
    },
    onError: error => toast.error(error.message),
  });
  const clearKey = trpc.aiSettings.clearKey.useMutation({
    onSuccess: async () => {
      await utils.aiSettings.status.invalidate();
      utils.mockTests.aiAvailable.invalidate();
      toast.success("API key removed.");
    },
    onError: error => toast.error(error.message),
  });
  const source = status.data?.source ?? null;

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-[#30363d]">
        AI marking
      </h2>
      <p className="mb-8 mt-1 text-sm text-[#747d87]">
        Claude marks Writing and Speaking attempts with IELTS band scores and
        feedback. Add an Anthropic API key to turn it on.
      </p>
      <div className="border-y border-[#dedede] py-5 text-sm text-[#30363d]">
        <strong className="block font-medium">Status</strong>
        <span className="mt-1 block text-xs text-[#747d87]">
          {status.isLoading
            ? "Checking…"
            : source === "settings"
              ? `On — using the key saved here (${status.data?.hint}).`
              : source === "environment"
                ? `On — using the server's ANTHROPIC_API_KEY (${status.data?.hint}). A key saved here replaces it.`
                : "Off — no API key is set."}
        </span>
      </div>
      <form
        className="mt-8"
        onSubmit={event => {
          event.preventDefault();
          if (apiKey.trim()) saveKey.mutate({ apiKey: apiKey.trim() });
        }}
      >
        <label className="block text-xs font-medium text-[#30363d]">
          {source === "settings" ? "Replace API key" : "Anthropic API key"}
          <input
            type="password"
            value={apiKey}
            onChange={event => setApiKey(event.target.value)}
            placeholder="sk-ant-…"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 h-11 w-full border border-[#d9d9d9] px-3.5 font-mono text-sm outline-none focus:border-[#c76f42]"
          />
        </label>
        <p className="mt-2 text-xs text-[#747d87]">
          Create one at console.anthropic.com. The key is checked with Anthropic
          before it's saved, and it's never shown again after saving.
        </p>
        <div className="flex flex-wrap gap-3 pt-8">
          <button
            type="submit"
            disabled={!apiKey.trim() || saveKey.isPending}
            className="admin-button admin-button-primary min-w-42"
          >
            {saveKey.isPending ? "Checking…" : "Save API key"}
          </button>
          {source === "settings" && (
            <button
              type="button"
              disabled={clearKey.isPending}
              onClick={() =>
                confirm(
                  "Remove the saved API key? AI marking stops unless the server has its own key."
                ) && clearKey.mutate()
              }
              className="admin-button admin-button-secondary min-w-42"
            >
              Remove key
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
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
// What the site uses until something else is saved, so Branding shows the live logos and favicon.
const emptyBranding: Branding = {
  logo_light: "/logo.svg",
  logo_dark: "/logo-white.svg",
  favicon: "/favicon.jpg",
  page_title: "FluentLearner - IELTS Coaching Platform",
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
  dark,
}: {
  label: string;
  value: string;
  recommendation: string;
  onChange: (value: string) => void;
  dark?: boolean;
}) {
  const upload = trpc.upload.image.useMutation();
  // Upload the file and keep its URL: an inline data URL is too big for a setting and would be
  // sent to every visitor with the site settings.
  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Images must be smaller than 5MB.");
    try {
      const { url } = await upload.mutateAsync({
        base64: await fileToBase64(file),
        filename: file.name,
        contentType: file.type,
      });
      onChange(url);
    } catch {
      toast.error("The image could not be uploaded.");
    }
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
        uploading={upload.isPending}
        dark={dark}
        fit="contain"
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
  const { user } = useAuth();
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
      saveAdminMode(null);
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
    ...(canManageUsers(user?.role)
      ? [{ id: "payments" as const, label: "Online payment", icon: CreditCard }]
      : []),
    { id: "security" as const, label: "Security", icon: LockKeyhole },
    ...(user?.role === "super_admin"
      ? [{ id: "ai" as const, label: "AI marking", icon: Sparkles }]
      : []),
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
          {tab === "payments" ? (
            <div className="space-y-16">
              <OnlinePaymentSettings />
              <SslcommerzSettings />
            </div>
          ) : tab === "ai" ? (
            <AiSettings />
          ) : settings.isLoading ? (
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
                  dark
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
