/**
 * AdminEnrollments — Admin page for managing student enrollments
 * Features: View all enrollments, filter by status, verify/reject, assign batch, generate student ID
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Users,
  AlertCircle,
  Loader2,
  ChevronRight,
  CreditCard,
  Plus,
  X,
  ListFilter,
} from "lucide-react";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminFilterDrawer from "@/components/AdminFilterDrawer";
import { useLocation } from "@/lib/router";

type StatusFilter = "pending" | "verified" | "rejected" | "refunded";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: Clock,
  },
  verified: {
    label: "Verified",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
    icon: CreditCard,
  },
};

export default function AdminEnrollments() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [view, setView] = useState<AdminListView>("table");

  const { data: enrollments = [], isLoading } =
    trpc.enrollments.adminList.useQuery();
  const { data: courses = [] } = trpc.courses.adminList.useQuery();

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }
  if (!user || !canAccessAdminDashboard(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

  const getCourseName = (courseId: number) => {
    return courses.find(c => c.id === courseId)?.name || `Course #${courseId}`;
  };

  // Filter enrollments by search
  const filteredEnrollments = enrollments.filter(e => {
    if (
      selectedStatuses.length > 0 &&
      !selectedStatuses.includes(e.status as StatusFilter)
    )
      return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.studentName.toLowerCase().includes(q) ||
      e.studentMobile.includes(q) ||
      e.transactionId.toLowerCase().includes(q) ||
      (e.studentId && e.studentId.toLowerCase().includes(q))
    );
  });
  const filterControl = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setFilterOpen(open => !open)}
        aria-label="Filter enrollments"
        aria-expanded={filterOpen}
        className="admin-icon-button"
      >
        <ListFilter className="h-4 w-4" />
        {selectedStatuses.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {selectedStatuses.length}
          </span>
        )}
      </button>
      {filterOpen && (
        <AdminFilterDrawer
          title="Filter enrollments"
          groups={[
            {
              key: "status",
              title: "Status",
              options: (
                ["pending", "verified", "rejected"] as StatusFilter[]
              ).map(status => ({
                value: status,
                label: statusConfig[status]?.label ?? status,
                count: enrollments.filter(e => e.status === status).length,
              })),
            },
          ]}
          selection={{ status: selectedStatuses }}
          onChange={next =>
            setSelectedStatuses((next.status ?? []) as StatusFilter[])
          }
          onClose={() => setFilterOpen(false)}
          resultCount={filteredEnrollments.length}
        />
      )}
    </div>
  );

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <div className="relative">
        <AdminPageHeader
          title="Enrollments"
          description="Review and manage all enrollment applications."
          action={
            !searchOpen ? (
              <div className="flex flex-wrap items-center gap-2">
                <AdminViewToggle
                  view={view}
                  onChange={setView}
                  label="Enrollments"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search enrollments"
                  className="admin-icon-button"
                >
                  <Search className="h-4 w-4" />
                </button>
                {filterControl}
                <button
                  onClick={() =>
                    window.open("/enroll", "_blank", "noopener,noreferrer")
                  }
                  className="admin-primary-button"
                >
                  <Plus className="h-4 w-4" />
                  New enrollment
                </button>
              </div>
            ) : undefined
          }
        />
        {searchOpen && (
          <div className="absolute inset-x-0 top-0 z-20 flex min-h-[84px] items-center gap-3 bg-[var(--admin-background)]">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, email or transaction ID"
                className="h-11 w-full rounded-lg border border-gray-300 pl-11 pr-4 outline-none focus:border-red-500"
              />
            </div>
            {filterControl}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchOpen(false);
              }}
              aria-label="Close search"
              className="admin-icon-button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="space-y-6">
        {/* Enrollments list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : view === "grid" ? (
          <div className="admin-view-grid">
            {filteredEnrollments.map(enrollment => {
              const status =
                statusConfig[enrollment.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <button
                  type="button"
                  key={enrollment.id}
                  className="admin-enrollment-card admin-list-card"
                  onClick={() =>
                    navigate(`/admin/enrollments/${enrollment.id}`)
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border ${status.bg}`}
                    >
                      <StatusIcon className={`h-5 w-5 ${status.color}`} />
                    </span>
                    <span
                      className={`admin-enrollment-status border ${status.bg} ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-5 min-w-0">
                    <span className="block truncate text-base font-bold text-gray-900">
                      {enrollment.studentName}
                    </span>
                    <span className="mt-1.5 block truncate text-sm text-gray-500">
                      {getCourseName(enrollment.courseId)}
                    </span>
                    <span className="mt-3 block text-xs text-gray-500">
                      {enrollment.paymentMethod} · ৳{enrollment.paymentAmount}
                    </span>
                  </div>

                  <div className="admin-enrollment-footer">
                    <span
                      className={
                        enrollment.studentId
                          ? "font-mono font-semibold text-green-700"
                          : "text-gray-400"
                      }
                    >
                      {enrollment.studentId || "ID not assigned"}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                      Details <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Transaction</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map(enrollment => {
                  const status =
                    statusConfig[enrollment.status] || statusConfig.pending;
                  return (
                    <tr
                      key={enrollment.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {enrollment.studentName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {enrollment.studentMobile}
                        </p>
                        {enrollment.studentId && (
                          <p className="mt-1 text-xs font-mono text-green-700">
                            {enrollment.studentId}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getCourseName(enrollment.courseId)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">
                          {enrollment.paymentMethod}
                        </p>
                        <p className="text-xs text-gray-500">
                          ৳{enrollment.paymentAmount}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {enrollment.transactionId}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(enrollment.createdAt).toLocaleDateString(
                          "en-GB"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`admin-status-label ${enrollment.status === "pending" ? "warning" : enrollment.status === "rejected" ? "failed" : enrollment.status === "refunded" ? "info" : ""}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminActionsMenu
                          label={`Actions for ${enrollment.studentName}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/enrollments/${enrollment.id}`)
                            }
                          >
                            View details
                          </button>
                          <a
                            href={`https://wa.me/88${enrollment.studentMobile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            WhatsApp
                          </a>
                        </AdminActionsMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
