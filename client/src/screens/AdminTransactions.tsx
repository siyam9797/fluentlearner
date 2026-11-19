/**
 * AdminTransactions — every course payment: manual transfers and online checkouts.
 * Each payment is stored as an enrollment row; open one to verify, reject or refund it.
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Receipt, Search, X } from "lucide-react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useLocation } from "@/lib/router";

type Status = "pending" | "verified" | "rejected" | "refunded";

const STATUS: Record<Status, { label: string; color: string }> = {
  pending: { label: "Pending", color: "var(--admin-warning)" },
  verified: { label: "Verified", color: "var(--admin-success)" },
  rejected: { label: "Rejected", color: "var(--admin-failed)" },
  refunded: { label: "Refunded", color: "var(--admin-info)" },
};
const TABS: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "refunded", label: "Refunded" },
];

/** Online checkouts hold a placeholder ID (`bkash:…`, `online:starting:…`) until the gateway confirms payment. */
const isAwaitingPayment = (transactionId: string) =>
  /^(bkash|sslcommerz|online):/i.test(transactionId);

const amountOf = (amount: string) =>
  Number.parseFloat(amount.replace(/,/g, "")) || 0;
const money = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const taka = (n: number) => `৳${money.format(n)}`;

const dayKey = (date: Date) => date.toDateString();
function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return "Today";
  if (dayKey(date) === dayKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

export default function AdminTransactions() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Status | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: transactions = [], isLoading } =
    trpc.enrollments.adminList.useQuery();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }
  if (!user || !canAccessAdminDashboard(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Sign in as an administrator to view this page
          </p>
          <a href="/admin" className="text-red-600 font-bold hover:underline">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const received = transactions
    .filter(t => t.status === "verified")
    .reduce((sum, t) => sum + amountOf(t.paymentAmount), 0);
  const pending = transactions.filter(t => t.status === "pending");

  const q = searchQuery.trim().toLowerCase();
  const filtered = transactions.filter(
    t =>
      (tab === "all" || t.status === tab) &&
      (!q ||
        t.transactionId.toLowerCase().includes(q) ||
        t.paymentAccountNumber.includes(q) ||
        t.studentName.toLowerCase().includes(q) ||
        t.studentMobile.includes(q) ||
        (t.studentEmail?.toLowerCase().includes(q) ?? false))
  );

  // Newest first (the API already sorts), grouped by day.
  const groups: Array<{ label: string; items: typeof filtered }> = [];
  for (const t of filtered) {
    const label = dayLabel(new Date(t.createdAt));
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(t);
    else groups.push({ label, items: [t] });
  }

  const closeSearch = () => {
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[880px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title="Transactions"
        action={
          searchOpen ? undefined : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search transactions"
              className="admin-icon-button"
            >
              <Search className="h-4 w-4" />
            </button>
          )
        }
      />

      {/* Two headline numbers */}
      <div className="mb-10 grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-[var(--admin-body)]">Received</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--admin-heading)] sm:text-4xl">
            {taka(received)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTab("pending")}
          className="text-left"
        >
          <p className="text-sm text-[var(--admin-body)]">To verify</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--admin-heading)] sm:text-4xl">
            {pending.length}
            {pending.length > 0 && (
              <span className="ml-2 align-middle text-base font-normal text-[var(--admin-body)]">
                {taka(
                  pending.reduce((sum, t) => sum + amountOf(t.paymentAmount), 0)
                )}
              </span>
            )}
          </p>
        </button>
      </div>

      {searchOpen ? (
        <div className="mb-6 flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Escape" && closeSearch()}
              placeholder="Name, phone, sender number or transaction ID"
              className="h-11 w-full rounded-lg border border-gray-300 pl-11 pr-4 outline-none focus:border-red-500"
            />
          </div>
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search"
            className="admin-icon-button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className="-mx-1 mb-6 flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Status"
        >
          {TABS.map(({ value, label }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={`h-9 shrink-0 rounded-full px-4 text-sm transition-colors ${
                  active
                    ? "bg-[var(--admin-heading)] text-[var(--admin-background)]"
                    : "text-[var(--admin-body)] hover:bg-[var(--admin-card)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-red-600" />
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center text-[var(--admin-body)]">
          <Receipt className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No transactions</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <section key={group.label}>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--admin-body)] opacity-70">
                {group.label}
              </h2>
              <ul>
                {group.items.map(t => {
                  const status = STATUS[t.status as Status] ?? STATUS.pending;
                  const method = t.paymentMethod.replace(/\s*\(online\)$/i, "");
                  const time = new Date(t.createdAt).toLocaleTimeString(
                    "en-GB",
                    { hour: "numeric", minute: "2-digit" }
                  );
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/transactions/${t.id}`)}
                        className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-[var(--radius-control)] px-3 py-3 text-left transition-colors hover:bg-[var(--admin-card)]"
                      >
                        <span
                          aria-hidden
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--admin-card)] text-sm font-semibold text-[var(--admin-heading)]"
                        >
                          {t.studentName.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-[var(--admin-heading)]">
                            {t.studentName}
                          </span>
                          <span className="block truncate text-sm text-[var(--admin-body)]">
                            {method} · {time}
                            {isAwaitingPayment(t.transactionId) &&
                              " · awaiting payment"}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span
                            className={`block font-semibold tabular-nums ${
                              t.status === "rejected" || t.status === "refunded"
                                ? "text-[var(--admin-body)] line-through decoration-1"
                                : "text-[var(--admin-heading)]"
                            }`}
                          >
                            {taka(amountOf(t.paymentAmount))}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--admin-body)]">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: status.color }}
                            />
                            {status.label}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
