/**
 * Frame for the student mock test area: sign-in gate, top bar and page container.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronUp,
  ClipboardCheck,
  ExternalLink,
  FolderOpen,
  Globe2,
  Keyboard,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { interTight } from "@/components/home-v2/font";
import { DecorSquare, HV_FIELD } from "@/components/home-v2/primitives";
import { V2 } from "@/components/home-v2/routes";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const fieldClass = HV_FIELD;

function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async user => {
      utils.auth.me.setData(undefined, user);
      await utils.auth.me.invalidate();
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[440px] flex-col justify-center px-4 py-16">
      <p className="mb-4 flex items-center gap-2 text-lg">
        <DecorSquare />
        Student area
      </p>
      <h1 className="text-[40px]">IELTS mock tests</h1>
      <p className="mt-3 text-lg text-ink/70">
        Sign in with the account your mentor created for you.
      </p>
      <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            className={fieldClass}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        {login.error && (
          <p className="text-sm text-brand-red" role="alert">
            {login.error.message}
          </p>
        )}
        <button
          className="hv-btn hv-btn-dark mt-2 w-full"
          disabled={login.isPending}
        >
          <span className="hv-btn-label">
            <span>{login.isPending ? "Signing in…" : "Sign in"}</span>
            <span aria-hidden="true">
              {login.isPending ? "Signing in…" : "Sign in"}
            </span>
          </span>
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        No account yet? Ask your mentor on WhatsApp, or{" "}
        <Link href={V2.contact} className="underline">
          contact us
        </Link>
        .
      </p>
    </div>
  );
}

export default function StudentShell({
  children,
  bare,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  const { user, loading, logout } = useAuth();
  const [pathname, navigate] = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const isStudent = user?.role === "student";
  const { data: studentProfile } = trpc.student.profile.useQuery(undefined, {
    enabled: isStudent && !loading,
  });
  const { get } = useSiteSettings();
  // Page and card colours come from Admin → Settings → Appearance (Background / Card BG).
  const background = get("appearance_light_background", "#F8F7EC");
  const cardBackground = get("appearance_light_card_bg", "#FFFFFF");
  const portalStyle = {
    "--color-cream": background,
    "--student-card": cardBackground,
    backgroundColor: background,
  } as CSSProperties;

  const nav = [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Practice", href: "/student/practice", icon: BookOpenCheck },
    { label: "Mock tests", href: "/student/mocks", icon: ClipboardCheck },
    { label: "My results", href: "/student/results", icon: BarChart3 },
    { label: "My batch", href: "/student/batch", icon: CalendarDays },
    { label: "Resources", href: "/student/resources", icon: FolderOpen },
    { label: "Typing practice", href: "/student/typing", icon: Keyboard },
    { label: "My profile", href: "/student/profile", icon: UserRound },
  ];

  const signOut = async () => {
    setAccountOpen(false);
    await logout();
    navigate("/student");
  };

  const go = (href: string) => {
    setAccountOpen(false);
    navigate(href);
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const gate = loading ? (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
    >
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      <span className="sr-only">Loading</span>
    </div>
  ) : !user ? (
    <StudentLogin />
  ) : !isStudent ? (
    <div className="mx-auto max-w-[520px] px-4 py-24 text-center">
      <h1 className="text-[32px]">Student accounts only</h1>
      <p className="mt-3 text-ink/70">
        This account does not have Student access. Create a student account
        under Admin → Users to try the tests, or{" "}
        <button type="button" className="underline" onClick={() => logout()}>
          sign out
        </button>
        .
      </p>
    </div>
  ) : null;

  if (bare)
    return (
      <div
        className={`${interTight.variable} home-v2 min-h-screen`}
        style={portalStyle}
      >
        {gate ?? children}
      </div>
    );

  if (!isStudent || loading) {
    return (
      <div
        className={`${interTight.variable} home-v2 min-h-screen`}
        style={portalStyle}
      >
        <header className="border-b border-ink/10 bg-cream">
          <div className="mx-auto flex h-[72px] max-w-[1230px] items-center px-4">
            <Link href="/student" aria-label="Student dashboard">
              <img src="/logo.svg" alt="FluentLearner" className="h-9 w-auto" />
            </Link>
          </div>
        </header>
        {gate}
      </div>
    );
  }

  return (
    <div
      className={`${interTight.variable} home-v2 min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]`}
      style={portalStyle}
    >
      <aside className="hidden h-screen flex-col bg-ink text-white lg:sticky lg:top-0 lg:flex">
        <Link
          href="/student"
          aria-label="Student dashboard"
          className="border-b border-white/10 px-7 py-7"
        >
          <img
            src="/logo-white.svg"
            alt="FluentLearner"
            className="h-9 w-auto"
          />
        </Link>
        <div className="px-5 pt-7">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Student portal
          </p>
          <nav className="mt-3 flex flex-col gap-1" aria-label="Student">
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-3 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-brand-red text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div
          ref={accountRef}
          className="relative mt-auto border-t border-white/10 p-5"
        >
          {accountOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-5 right-5 overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-[#292929] p-2 shadow-[0_18px_45px_rgba(0,0,0,.3)]">
              <div className="flex items-center gap-3 px-2 py-2.5">
                {studentProfile?.avatarUrl ? (
                  <img
                    src={studentProfile.avatarUrl}
                    alt=""
                    className="h-10 w-10 flex-none rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-red text-sm font-semibold uppercase">
                    {(user?.name || user?.email || "S").slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-medium">
                    {user?.name || "Student"}
                  </strong>
                  <span className="block truncate text-xs text-white/40">
                    {studentProfile?.targetBand
                      ? `Target band ${studentProfile.targetBand}`
                      : "Target band not set"}
                  </span>
                </span>
              </div>
              <div className="my-2 border-t border-white/10" />
              <button
                type="button"
                onClick={() => go("/")}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-white/65 hover:bg-white/8 hover:text-white"
              >
                <Globe2 className="h-4 w-4" />
                <span className="flex-1">View website</span>
                <ExternalLink className="h-3.5 w-3.5 text-white/30" />
              </button>
              <button
                type="button"
                onClick={() => go("/student/profile")}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-white/65 hover:bg-white/8 hover:text-white"
              >
                <UserRound className="h-4 w-4" />
                My profile
              </button>
              <button
                type="button"
                onClick={() => go("/student/batch")}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-white/65 hover:bg-white/8 hover:text-white"
              >
                <CalendarDays className="h-4 w-4" />
                My batch
              </button>
              <button
                type="button"
                onClick={() => go("/student/resources")}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-white/65 hover:bg-white/8 hover:text-white"
              >
                <FolderOpen className="h-4 w-4" />
                Resources
              </button>
              <button
                type="button"
                onClick={() => go("/student/settings")}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-white/65 hover:bg-white/8 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <div className="my-2 border-t border-white/10" />
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm text-white/65 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-label="Open student account menu"
            onClick={() => setAccountOpen(value => !value)}
            className="flex w-full items-center gap-3 rounded-[var(--radius-control)] border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/8"
          >
            {studentProfile?.avatarUrl ? (
              <img
                src={studentProfile.avatarUrl}
                alt=""
                className="h-10 w-10 flex-none rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-red text-sm font-semibold uppercase">
                {(user?.name || user?.email || "S").slice(0, 1)}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-medium">
                {user?.name || "Student"}
              </strong>
              <span className="block truncate text-xs text-white/40">
                {studentProfile?.targetBand
                  ? `Target band ${studentProfile.targetBand}`
                  : "Set target band"}
              </span>
            </span>
            <ChevronUp
              className={cn(
                "h-4 w-4 text-white/35 transition-transform",
                !accountOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/student" aria-label="Student dashboard">
              <img src="/logo.svg" alt="FluentLearner" className="h-8 w-auto" />
            </Link>
            <Link
              href="/student/profile"
              className="rounded-full border border-ink/15 p-1"
              aria-label="Open profile"
            >
              {studentProfile?.avatarUrl ? (
                <img
                  src={studentProfile.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-semibold uppercase text-white">
                  {(user?.name || user?.email || "S").slice(0, 1)}
                </span>
              )}
            </Link>
          </div>
          <nav
            className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3"
            aria-label="Student"
          >
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex flex-none items-center gap-2 rounded-full px-4 py-2 text-xs font-medium",
                  pathname === item.href
                    ? "bg-ink text-white"
                    : "bg-sand text-ink/70"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
