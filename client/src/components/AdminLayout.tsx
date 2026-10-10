"use client";

import {
  CSSProperties,
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteLogo from "@/components/SiteLogo";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import {
  AdminAppearance,
  adminAppearanceChangeEvent,
  appearanceFromSettings,
  adminModeChangeEvent,
  loadAdminMode,
  loadStoredAdminAppearance,
  saveAdminMode,
  type AdminMode,
} from "@/lib/adminAppearance";
import {
  canAccessAdminDashboard,
  canManageUsers,
  ROLE_DEFINITIONS,
  type AppRole,
} from "@shared/roles";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FolderOpen,
  Globe2,
  GraduationCap,
  Home,
  ImageIcon,
  Layers,
  LayoutTemplate,
  LogOut,
  Menu,
  Moon,
  Sun,
  Settings,
  Shield,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
  also?: string[];
  userManagement?: boolean;
  /** Shown to the Super Admin only. */
  superAdminOnly?: boolean;
  /** Sub-menu shown under the item while one of its pages is open. */
  children?: { label: string; href: string; also?: string[] }[];
};

type AdminThemeStyle = CSSProperties & Record<`--${string}`, string>;

function AdminPortalTheme({
  style,
  darkMode,
}: {
  style: AdminThemeStyle;
  darkMode: boolean;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const properties = Object.entries(style).map(([name, value]) => ({
      name,
      value: String(value),
      previousValue: root.style.getPropertyValue(name),
      previousPriority: root.style.getPropertyPriority(name),
    }));
    const hadAdminTheme = body.classList.contains("admin-theme");
    const hadAdminDark = body.classList.contains("admin-dark");

    for (const property of properties) {
      root.style.setProperty(property.name, property.value);
    }
    body.classList.add("admin-theme");
    body.classList.toggle("admin-dark", darkMode);

    return () => {
      for (const property of properties) {
        if (property.previousValue) {
          root.style.setProperty(
            property.name,
            property.previousValue,
            property.previousPriority
          );
        } else {
          root.style.removeProperty(property.name);
        }
      }
      if (!hadAdminTheme) body.classList.remove("admin-theme");
      if (hadAdminDark) body.classList.add("admin-dark");
      else body.classList.remove("admin-dark");
    };
  }, [darkMode, style]);

  return null;
}

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: "Dashboard",
    items: [
      { label: "Overview", href: "/admin", icon: Home },
      {
        label: "Student dashboard",
        href: "/student",
        icon: GraduationCap,
        superAdminOnly: true,
      },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Courses", href: "/admin/courses", icon: BookOpen },
      { label: "Batches", href: "/admin/batches", icon: Layers },
      {
        label: "Resources",
        href: "/admin/resources",
        icon: FolderOpen,
        children: [
          { label: "Resource files", href: "/admin/resources" },
          { label: "Vocabulary", href: "/admin/resources/vocabulary" },
        ],
      },
      {
        label: "IELTS Modules",
        href: "/admin/ielts",
        icon: ClipboardCheck,
        children: [
          { label: "Listening", href: "/admin/ielts/listening" },
          { label: "Reading", href: "/admin/ielts/reading" },
          { label: "Writing", href: "/admin/ielts/writing" },
          { label: "Speaking", href: "/admin/ielts/speaking" },
        ],
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: GraduationCap,
        also: ["/admin/students"],
        userManagement: true,
      },
      {
        label: "Roles",
        href: "/admin/roles",
        icon: Shield,
        userManagement: true,
      },
      { label: "Instructors", href: "/admin/instructors", icon: UserRound },
      { label: "Enrollments", href: "/admin/enrollments", icon: Users },
      { label: "Payments", href: "/admin/payment-settings", icon: CreditCard },
    ],
  },
  {
    label: "Website",
    items: [
      {
        label: "Website",
        href: "/admin/website",
        icon: LayoutTemplate,
        children: [
          {
            label: "Pages",
            href: "/admin/website",
            also: ["/admin/website/pages"],
          },
          { label: "Menus", href: "/admin/website/menus" },
          { label: "Settings", href: "/admin/website/settings" },
        ],
      },
      {
        label: "Success Stories",
        href: "/admin/success-stories",
        icon: Trophy,
      },
      { label: "Media", href: "/admin/media", icon: ImageIcon },
    ],
  },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async user => {
      utils.auth.me.setData(undefined, user);
      await utils.auth.me.invalidate();
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <main className="min-h-screen bg-[#f8f7ec] px-5 flex items-center justify-center text-[#24292f]">
      <form
        onSubmit={submit}
        className="w-full max-w-[390px] rounded-[var(--radius-card)] bg-[var(--admin-card)] p-8"
      >
        <div className="mb-8">
          <div className="mb-5 flex h-11 w-11 items-center justify-center border border-[#e4e4e4] bg-[#fafafa]">
            <Shield className="h-5 w-5" />
          </div>
          <h1>
            <SiteLogo className="h-10 w-auto" />
          </h1>
          <p className="mt-2 text-sm text-[#68707a]">
            Sign in to manage your learning platform.
          </p>
        </div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <input
          className="mb-4 h-11 w-full border border-[#d9d9d9] px-3 text-sm outline-none focus:border-[#c96f3b]"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="admin@localhost.test"
        />
        <label className="mb-1.5 block text-sm font-medium">Password</label>
        <input
          className="mb-3 h-11 w-full border border-[#d9d9d9] px-3 text-sm outline-none focus:border-[#c96f3b]"
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        {login.error && (
          <p className="mb-3 text-sm text-red-600">{login.error.message}</p>
        )}
        <button
          className="h-11 w-full bg-[#24292f] text-sm font-medium text-white hover:bg-black disabled:opacity-60"
          disabled={login.isPending}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  // Menus the user opened or closed by hand; the rest follow the current page.
  const [menuOverrides, setMenuOverrides] = useState<Record<string, boolean>>(
    {}
  );
  const [storedAppearance, setStoredAppearance] =
    useState<AdminAppearance | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  // This admin's own light/dark choice; null follows Settings → Appearance.
  const [mode, setMode] = useState<AdminMode | null>(null);
  useEffect(() => {
    setMode(loadAdminMode());
    const onChange = (event: Event) =>
      setMode((event as CustomEvent<AdminMode | null>).detail);
    window.addEventListener(adminModeChangeEvent, onChange);
    return () => window.removeEventListener(adminModeChangeEvent, onChange);
  }, []);
  const profile = useAdminProfile(
    user?.email || "",
    user?.name || "Administrator"
  );
  const { data: appearanceSettings } = trpc.siteSettings.getAll.useQuery(
    undefined,
    {
      enabled: !!user && canAccessAdminDashboard(user.role),
    }
  );

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => setMenuOverrides({}), [location]);

  useEffect(() => {
    if (appearanceSettings)
      setStoredAppearance(appearanceFromSettings(appearanceSettings));
  }, [appearanceSettings]);

  useEffect(() => {
    setStoredAppearance(loadStoredAdminAppearance());
    const applyAppearance = (event: Event) => {
      setStoredAppearance(
        (event as CustomEvent<AdminAppearance>).detail ||
          loadStoredAdminAppearance()
      );
    };
    window.addEventListener(adminAppearanceChangeEvent, applyAppearance);
    window.addEventListener("storage", applyAppearance);
    return () => {
      window.removeEventListener(adminAppearanceChangeEvent, applyAppearance);
      window.removeEventListener("storage", applyAppearance);
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8f7ec] grid place-items-center text-sm text-[#68707a]">
        Loading dashboard…
      </div>
    );
  if (!user) return <Login />;
  if (!canAccessAdminDashboard(user.role))
    return (
      <div className="min-h-screen grid place-items-center">
        Administrator access is required.
      </div>
    );

  const go = (href: string) => {
    navigate(href);
    setMobileOpen(false);
    setAccountOpen(false);
  };
  const displayName = profile.name || user.name || "Administrator";
  const roleLabel =
    ROLE_DEFINITIONS[user.role as AppRole]?.label || "Administrator";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
  const avatar = profile.avatar ? (
    <img
      src={profile.avatar}
      alt=""
      className="h-full w-full rounded-full object-cover grayscale"
    />
  ) : (
    initials
  );
  const appearance =
    storedAppearance || appearanceFromSettings(appearanceSettings);
  const darkMode = mode ? mode === "dark" : appearance.darkMode;
  const palette = darkMode ? appearance.dark : appearance.light;
  const modeRow = (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      onClick={() => saveAdminMode(darkMode ? "light" : "dark")}
      className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[var(--admin-heading)] hover:text-[var(--admin-primary)]"
    >
      {darkMode ? (
        <Moon className="h-4 w-4 stroke-[1.5]" />
      ) : (
        <Sun className="h-4 w-4 stroke-[1.5]" />
      )}
      <span className="flex-1">Dark mode</span>
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 rounded-full transition-colors ${darkMode ? "bg-[var(--admin-primary)]" : "bg-[var(--admin-border)]"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#fff] shadow transition-[left] ${darkMode ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
  const themeStyle = {
    "--admin-primary": palette.primary,
    "--admin-secondary": palette.secondary,
    "--admin-heading": palette.heading,
    "--admin-body": palette.body,
    "--admin-placeholder": palette.placeholder,
    "--admin-border": palette.border,
    "--admin-card": palette.card_bg,
    "--admin-background": palette.background,
    "--admin-success": palette.success,
    "--admin-failed": palette.failed,
    "--admin-warning": palette.warning,
    "--admin-info": palette.info,
    "--background": palette.background,
    "--foreground": palette.heading,
    "--card": palette.card_bg,
    "--card-foreground": palette.heading,
    "--popover": palette.card_bg,
    "--popover-foreground": palette.heading,
    "--primary": palette.primary,
    "--primary-foreground": palette.secondary,
    "--muted": palette.card_bg,
    "--muted-foreground": palette.body,
    "--border": palette.border,
    "--input": palette.border,
    "--ring": palette.primary,
  } as AdminThemeStyle;

  const sidebar = (
    <aside className="admin-sidebar flex h-full w-[260px] flex-col bg-[var(--admin-background)] px-3 py-3">
      <button
        onClick={() => go("/admin")}
        className="px-1 text-left"
        aria-label="Dashboard"
      >
        <SiteLogo on={darkMode ? "dark" : "light"} className="h-9 w-auto" />
      </button>
      <nav className="-mr-3 mt-7 min-h-0 flex-1 space-y-4 overflow-y-auto pr-3">
        {navigationGroups.map(group => (
          <section
            key={group.label}
            aria-labelledby={`admin-nav-${group.label.toLowerCase()}`}
          >
            <h2
              id={`admin-nav-${group.label.toLowerCase()}`}
              className="mb-1 px-1 text-[10px] font-medium uppercase text-[var(--admin-body)]"
            >
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.items
                .filter(
                  item =>
                    (!item.userManagement || canManageUsers(user.role)) &&
                    (!item.superAdminOnly || user.role === "super_admin")
                )
                .map(item => {
                  const active = [item.href, ...(item.also ?? [])].some(
                    href =>
                      location === href ||
                      (href !== "/admin" && location.startsWith(`${href}/`))
                  );
                  const Icon = item.icon;
                  const matches = (href: string, also: string[] = []) =>
                    [href, ...also].some(
                      path =>
                        location === path || location.startsWith(`${path}/`)
                    );
                  // The parent's own path is a prefix of its children's, so match children exactly first.
                  const activeChild =
                    item.children?.find(
                      child =>
                        child.href !== item.href &&
                        matches(child.href, child.also)
                    ) ??
                    item.children?.find(
                      child => child.href === item.href && active
                    );
                  const expanded = menuOverrides[item.href] ?? active;
                  return (
                    <div key={item.href}>
                      <button
                        onClick={() =>
                          item.children
                            ? setMenuOverrides(prev => ({
                                ...prev,
                                [item.href]: !expanded,
                              }))
                            : go(item.href)
                        }
                        aria-expanded={item.children ? expanded : undefined}
                        className={`flex h-11 w-full items-center gap-3 px-1 text-left text-sm transition-colors ${active ? "text-[#c76f42]" : "text-[var(--admin-heading)] opacity-80 hover:opacity-100"}`}
                      >
                        <Icon className="h-[17px] w-[17px] stroke-[1.5]" />
                        <span className="flex-1">{item.label}</span>
                        {item.children && (
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`}
                          />
                        )}
                      </button>
                      {item.children && expanded && (
                        <div className="mb-1 ml-[9px] space-y-1 border-l border-[var(--admin-border)] pl-[23px]">
                          {item.children.map(child => (
                            <button
                              key={child.href}
                              onClick={() => go(child.href)}
                              aria-current={
                                activeChild === child ? "page" : undefined
                              }
                              className={`flex h-11 w-full items-center text-left text-sm transition-colors ${activeChild === child ? "font-medium text-[#c76f42]" : "text-[var(--admin-body)] hover:text-[var(--admin-heading)]"}`}
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </nav>
      <div ref={accountRef} className="relative mt-auto shrink-0">
        {accountOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 w-full rounded-[var(--radius-card)] border border-[var(--admin-border)] bg-[var(--admin-background)] p-3 shadow-[0_16px_40px_rgba(20,25,30,0.14)]">
            <div className="flex items-center gap-2.5 px-1 pb-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#292d32] text-xs font-semibold text-white">
                {avatar}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--admin-heading)]">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-[var(--admin-body)]">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--admin-border)] py-2">
              <button
                onClick={() => navigate("/")}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[var(--admin-heading)] hover:text-[var(--admin-primary)]"
              >
                <Globe2 className="h-4 w-4 stroke-[1.5]" />
                <span className="flex-1">View site</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#9ba0a6]" />
              </button>
              <button
                onClick={() => go("/admin/profile")}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[var(--admin-heading)] hover:text-[var(--admin-primary)]"
              >
                <UserRound className="h-4 w-4 stroke-[1.5]" /> Profile
              </button>
              <button
                onClick={() => go("/admin/settings")}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[var(--admin-heading)] hover:text-[var(--admin-primary)]"
              >
                <Settings className="h-4 w-4 stroke-[1.5]" /> Settings
              </button>
              {modeRow}
            </div>
            <div className="border-t border-[var(--admin-border)] pt-2">
              <button
                onClick={logout}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[var(--admin-heading)] hover:text-red-600"
              >
                <LogOut className="h-4 w-4 stroke-[1.5]" /> Log out
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          aria-expanded={accountOpen}
          aria-label="Open account menu"
          onClick={() => setAccountOpen(value => !value)}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-2.5 text-left hover:brightness-[0.98]"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#292d32] text-xs font-semibold text-white">
            {avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--admin-heading)]">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-[var(--admin-body)]">
              {roleLabel}
            </p>
          </div>
          <ChevronUp
            className={`h-4 w-4 transition-transform ${accountOpen ? "text-[#c76f42]" : "rotate-180 text-[#68707a]"}`}
          />
        </button>
      </div>
    </aside>
  );

  return (
    <div
      className={`admin-theme min-h-screen ${darkMode ? "admin-dark" : ""}`}
      style={themeStyle}
    >
      <AdminPortalTheme style={themeStyle} darkMode={darkMode} />
      <div className="fixed inset-y-0 left-0 z-40 hidden border-r border-[var(--admin-border)] lg:block">
        {sidebar}
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/20"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[260px] border-r border-[#dedede]">
            {sidebar}
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-background)] px-4 text-[var(--admin-heading)] lg:hidden">
        <button onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <SiteLogo on={darkMode ? "dark" : "light"} className="h-7 w-auto" />
        <button onClick={() => navigate("/")} aria-label="View website">
          <Settings className="h-5 w-5" />
        </button>
      </header>
      <main className="admin-content min-h-screen lg:ml-[260px]">
        {children}
      </main>
    </div>
  );
}
