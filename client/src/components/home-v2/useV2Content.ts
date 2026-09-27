import { trpc } from "@/lib/trpc";
import { SITE_STATS } from "@/lib/siteConstants";
import {
  V2_FIELDS,
  type V2Field,
  type V2ListItem,
  type V2Menus,
  type V2MenuItem,
} from "./content";
import { formatCompact } from "./primitives";

type Settings = Record<string, string | null> | undefined;

/** A field's default, serialised the way it is stored. */
function serializeDefault(field: V2Field): string {
  if (field.type === "toggle") return String(field.default);
  if (field.type === "list" || field.type === "menus")
    return JSON.stringify(field.default);
  return field.default;
}

/** What the page shows when this field has no v2 value of its own. */
export function fallbackValue(settings: Settings, field: V2Field): string {
  if (field.type === "menus") {
    // Carry over the header/footer menus saved before multiple menus existed.
    const menus = field.default.menus.map(menu => {
      const saved =
        settings?.[
          menu.id === "menu-header" ? "v2_menu_header" : "v2_menu_footer"
        ];
      return saved
        ? { ...menu, items: parseMenuItems(saved) ?? menu.items }
        : menu;
    });
    return JSON.stringify({ ...field.default, menus });
  }
  const legacy = field.legacyKey ? settings?.[field.legacyKey] : null;
  return legacy ? legacy : serializeDefault(field);
}

/** Stored v2 value, else the fallback. "" is a deliberate blank and is kept. */
export function resolveValue(settings: Settings, field: V2Field): string {
  const stored = settings?.[field.key];
  return stored === null || stored === undefined
    ? fallbackValue(settings, field)
    : stored;
}

export function parseList(value: string, field: V2Field): V2ListItem[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed.filter(item => item && typeof item === "object");
  } catch {
    // fall through to the default
  }
  return field.type === "list" ? field.default : [];
}

function toMenuItems(value: unknown): V2MenuItem[] | null {
  if (!Array.isArray(value)) return null;
  return normalizeMenu(
    value
      .filter(item => item && typeof item === "object")
      .map((item, i) => ({
        id: String(item.id ?? `item-${i}`),
        label: String(item.label ?? ""),
        url: String(item.url ?? ""),
        newTab: Boolean(item.newTab),
        depth: Number(item.depth) || 0,
      }))
  );
}

function parseMenuItems(value: string): V2MenuItem[] | null {
  try {
    return toMenuItems(JSON.parse(value));
  } catch {
    return null;
  }
}

/** Reads the stored menus value; anything malformed falls back to the field default. */
export function parseMenus(value: string, field: V2Field): V2Menus {
  const fallback: V2Menus =
    field.type === "menus" ? field.default : { menus: [], locations: {} };
  try {
    const parsed = JSON.parse(value);
    if (!parsed || !Array.isArray(parsed.menus)) return fallback;
    const menus = parsed.menus
      .filter((menu: unknown) => menu && typeof menu === "object")
      .map(
        (
          menu: { id?: unknown; name?: unknown; items?: unknown },
          i: number
        ) => ({
          id: String(menu.id ?? `menu-${i}`),
          name: String(menu.name ?? `Menu ${i + 1}`),
          items: toMenuItems(menu.items) ?? [],
        })
      );
    const ids = new Set(menus.map((menu: { id: string }) => menu.id));
    const locations: Record<string, string | null> = {};
    for (const [location, id] of Object.entries(parsed.locations ?? {})) {
      locations[location] = typeof id === "string" && ids.has(id) ? id : null;
    }
    return { menus, locations };
  } catch {
    return fallback;
  }
}

/** Keeps depths valid: the first item is top level and no item is nested more than one below the item above. */
export function normalizeMenu(items: V2MenuItem[], maxDepth = 1): V2MenuItem[] {
  let previous = -1;
  return items.map(item => {
    const depth = Math.max(0, Math.min(item.depth, previous + 1, maxDepth));
    previous = depth;
    return { ...item, depth };
  });
}

export type V2MenuNode = V2MenuItem & { children: V2MenuItem[] };

function toTree(items: V2MenuItem[]): V2MenuNode[] {
  const tree: V2MenuNode[] = [];
  for (const item of items) {
    if (item.depth > 0 && tree.length)
      tree[tree.length - 1].children.push(item);
    else tree.push({ ...item, children: [] });
  }
  return tree;
}

function parseNumber(value: string, fallback: number): number {
  const raw = value
    .trim()
    .replace(/,/g, "")
    .replace(/[+%]+$/, "")
    .trim();
  const multiplier = /k$/i.test(raw) ? 1000 : 1;
  const n = Number(raw.replace(/k$/i, "")) * multiplier;
  return raw && !Number.isNaN(n) ? n : fallback;
}

/** Splits a "lines" list field into its non-empty lines. */
export function lines(value: string | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

/**
 * Content for the v2 website, as edited on the admin "Website" page.
 * Usage: const c = useV2Content(); c.t("v2_home_hero_title")
 */
export function useV2Content() {
  const { data, isLoading } = trpc.siteSettings.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const raw = (key: string): string => {
    const field = V2_FIELDS[key];
    if (!field) throw new Error(`Unknown v2 content key: ${key}`);
    return resolveValue(data, field);
  };

  const totalScorers = parseNumber(
    raw("v2_stat_total_scorers"),
    SITE_STATS.TOTAL_SCORERS
  );
  const successRate = parseNumber(
    raw("v2_stat_success_rate"),
    SITE_STATS.SUCCESS_RATE
  );
  const avgBandScore = raw("v2_stat_avg_band") || SITE_STATS.AVG_BAND_SCORE;
  const yearsExperience = parseNumber(
    raw("v2_stat_years_experience"),
    SITE_STATS.YEARS_EXPERIENCE
  );
  const founderName = raw("v2_founder_name");

  const tokens: Record<string, string> = {
    scorers: formatCompact(totalScorers),
    successRate: String(successRate),
    avgBand: avgBandScore,
    years: String(yearsExperience),
    founder: founderName,
  };
  const fill = (value: string) =>
    value.replace(/\{(\w+)\}/g, (match, name: string) => tokens[name] ?? match);

  const t = (key: string) => fill(raw(key));
  const whatsappNumber = raw("v2_contact_whatsapp").replace(/\D/g, "");

  return {
    isLoading,
    /** Text with {tokens} filled in. */
    t,
    /** Toggle fields: is the section switched on? */
    on: (key: string) => raw(key) !== "false",
    /** List fields, with {tokens} filled in on every value. */
    list: (key: string): V2ListItem[] =>
      parseList(raw(key), V2_FIELDS[key]).map(item =>
        Object.fromEntries(
          Object.entries(item).map(([name, value]) => [
            name,
            fill(String(value ?? "")),
          ])
        )
      ),
    /** The menu assigned to a theme location, as top-level items with their dropdown children. */
    menuAt: (location: string): V2MenuNode[] => {
      const { menus, locations } = parseMenus(
        raw("v2_menus"),
        V2_FIELDS.v2_menus
      );
      const menu = menus.find(item => item.id === locations[location]);
      return menu
        ? toTree(menu.items.map(item => ({ ...item, label: fill(item.label) })))
        : [];
    },
    /** wa.me link, optionally with the message stored under `messageKey`. */
    whatsapp: (messageKey?: string) => {
      const message = messageKey ? t(messageKey) : "";
      return `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
    },
    whatsappNumber,
    totalScorers,
    successRate,
    avgBandScore,
    yearsExperience,
    founderName,
    founderTitle: t("v2_founder_title"),
    founderPhoto: raw("v2_founder_photo"),
    contactPhone: t("v2_contact_phone"),
    contactEmail: t("v2_contact_email"),
    contactAddress: t("v2_contact_address"),
    socialFacebook: raw("v2_social_facebook"),
    socialYoutube: raw("v2_social_youtube"),
    socialInstagram: raw("v2_social_instagram"),
  };
}
