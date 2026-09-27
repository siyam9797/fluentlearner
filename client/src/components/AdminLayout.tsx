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
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import {
  AdminAppearance,
  adminAppearanceChangeEvent,
  appearanceFromSettings,
  loadStoredAdminAppearance,
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
  FileText,
  FolderOpen,
  Globe2,
  GraduationCap,
  Home,
  ImageIcon,
  Layers,
  LayoutTemplate,
  LogOut,
  Menu,
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
    items: [{ label: "Overview", href: "/admin", icon: Home }],
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
      { label: "Site Content", href: "/admin/site-settings", icon: FileText },
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
          <h1 className="font-display text-2xl font-bold tracking-tight">
            FluentLearner
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
  const [storedAppearance, setStoredAppearance] =
    useState<AdminAppearance | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
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
  const palette = appearance.darkMode ? appearance.dark : appearance.light;
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
        className="px-1 text-left font-display text-xl font-bold tracking-tight text-[#24292f]"
      >
        FluentLearner
      </button>
      <nav className="mt-7 min-h-0 flex-1 space-y-4 overflow-y-auto">
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
                  item => !item.userManagement || canManageUsers(user.role)
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
                  return (
                    <div key={item.href}>
                      <button
                        onClick={() => go(item.href)}
                        aria-expanded={item.children ? active : undefined}
                        className={`flex h-11 w-full items-center gap-3 px-1 text-left text-sm transition-colors ${active ? "text-[#c76f42]" : "text-[#343a40] hover:text-black"}`}
                      >
                        <Icon className="h-[17px] w-[17px] stroke-[1.5]" />
                        <span className="flex-1">{item.label}</span>
                        {item.children && (
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${active ? "" : "-rotate-90"}`}
                          />
                        )}
                      </button>
                      {item.children && active && (
                        <div className="mb-1 ml-[9px] space-y-0.5 border-l border-[#e3e3e3] pl-5">
                          {item.children.map(child => (
                            <button
                              key={child.href}
                              onClick={() => go(child.href)}
                              aria-current={
                                activeChild === child ? "page" : undefined
                              }
                              className={`flex h-8 w-full items-center text-left text-[13px] transition-colors ${activeChild === child ? "font-medium text-[#c76f42]" : "text-[#5c636b] hover:text-black"}`}
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
                <p className="truncate text-xs font-semibold text-[#292d32]">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-[#717780]">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="border-t border-[#dedede] py-2">
              <button
                onClick={() => navigate("/")}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[#343a40] hover:text-[#c76f42]"
              >
                <Globe2 className="h-4 w-4 stroke-[1.5]" />
                <span className="flex-1">View site</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#9ba0a6]" />
              </button>
              <button
                onClick={() => go("/admin/profile")}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[#343a40] hover:text-[#c76f42]"
              >
                <UserRound className="h-4 w-4 stroke-[1.5]" /> Profile
              </button>
              <button
                onClick={() => go("/admin/settings")}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[#343a40] hover:text-[#c76f42]"
              >
                <Settings className="h-4 w-4 stroke-[1.5]" /> Settings
              </button>
            </div>
            <div className="border-t border-[#dedede] pt-2">
              <button
                onClick={logout}
                className="flex h-10 w-full items-center gap-3 px-1 text-left text-sm text-[#343a40] hover:text-red-600"
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
            <p className="truncate text-xs font-medium text-[#292d32]">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-[#717780]">{roleLabel}</p>
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
      className={`admin-theme min-h-screen ${appearance.darkMode ? "admin-dark" : ""}`}
      style={themeStyle}
    >
      <AdminPortalTheme style={themeStyle} darkMode={appearance.darkMode} />
      <div className="fixed inset-y-0 left-0 z-40 hidden border-r border-[#dedede] lg:block">
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
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e6e6e6] bg-[var(--admin-background)] px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display font-bold">FluentLearner</span>
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
