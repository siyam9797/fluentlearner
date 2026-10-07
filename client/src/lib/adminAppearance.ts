export const adminPaletteKeys = [
  "primary",
  "secondary",
  "heading",
  "body",
  "placeholder",
  "border",
  "card_bg",
  "background",
  "success",
  "failed",
  "warning",
  "info",
] as const;

export type AdminPaletteKey = (typeof adminPaletteKeys)[number];
export type AdminPalette = Record<AdminPaletteKey, string>;

export const defaultAdminAppearance = {
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

export type AdminAppearance = typeof defaultAdminAppearance;
export const adminAppearanceStorageKey = "fluentlearner:appearance";
export const adminAppearanceChangeEvent = "fluentlearner:appearance-change";

export function loadStoredAdminAppearance(): AdminAppearance | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(adminAppearanceStorageKey) || "null"
    ) as Partial<AdminAppearance> | null;
    if (!parsed) return null;
    return {
      darkMode: parsed.darkMode ?? defaultAdminAppearance.darkMode,
      light: { ...defaultAdminAppearance.light, ...parsed.light },
      dark: { ...defaultAdminAppearance.dark, ...parsed.dark },
    };
  } catch {
    return null;
  }
}

export function saveStoredAdminAppearance(appearance: AdminAppearance) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    adminAppearanceStorageKey,
    JSON.stringify(appearance)
  );
  window.dispatchEvent(
    new CustomEvent(adminAppearanceChangeEvent, { detail: appearance })
  );
}

export function appearanceFromSettings(
  settings?: Record<string, string | null>
): AdminAppearance {
  const appearance: AdminAppearance = {
    darkMode: settings?.appearance_dark_mode === "true",
    light: { ...defaultAdminAppearance.light },
    dark: { ...defaultAdminAppearance.dark },
  };

  adminPaletteKeys.forEach(key => {
    const light = settings?.[`appearance_light_${key}`];
    const dark = settings?.[`appearance_dark_${key}`];
    if (light) appearance.light[key] = light;
    if (dark) appearance.dark[key] = dark;
  });

  return appearance;
}

/** Each admin's own light/dark choice (the sun/moon switcher), kept in this browser. */
export type AdminMode = "light" | "dark";
const adminModeStorageKey = "fluentlearner:admin-mode";
export const adminModeChangeEvent = "fluentlearner:admin-mode-change";

export function loadAdminMode(): AdminMode | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(adminModeStorageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** null clears the choice, so the dashboard follows Settings → Appearance again. */
export function saveAdminMode(mode: AdminMode | null) {
  if (typeof window === "undefined") return;
  try {
    if (mode) window.localStorage.setItem(adminModeStorageKey, mode);
    else window.localStorage.removeItem(adminModeStorageKey);
  } catch {
    // Private browsing: the choice lasts until the page is reloaded.
  }
  window.dispatchEvent(new CustomEvent(adminModeChangeEvent, { detail: mode }));
}
