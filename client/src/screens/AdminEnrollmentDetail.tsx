"use client";

import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  ReceiptText,
  UserRound,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import AdminSelect from "@/components/AdminSelect";

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "Pending", className: "warning", icon: Clock },
  verified: { label: "Verified", className: "", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "failed", icon: XCircle },
  refunded: { label: "Refunded", className: "info", icon: CreditCard },
};

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-[var(--admin-body)]">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-[var(--admin-heading)]">
        {children || "—"}
      </dd>
    </div>
  );
}

export default function AdminEnrollmentDetail() {
  const pathname = usePathname() || "";
  const id = Number(pathname.split("/").filter(Boolean).pop());
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [batchId, setBatchId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const enrollmentQuery = trpc.enrollments.getById.useQuery(
    { id },
    { enabled: Number.isInteger(id) && id > 0 }
  );
  const { data: courses = [] } = trpc.courses.adminList.useQuery();
  const { data: batches = [] } = trpc.batches.adminList.useQuery();
  const verify = trpc.enrollments.verify.useMutation({
    onSuccess: async result => {
      toast.success(`Enrollment verified — ${result.studentId}`);
      await utils.enrollments.getById.invalidate({ id });
      await utils.enrollments.adminList.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const reject = trpc.enrollments.reject.useMutation({
    onSuccess: async () => {
      toast.success("Enrollment rejected");
      setRejecting(false);
      await utils.enrollments.getById.invalidate({ id });
      await utils.enrollments.adminList.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  if (enrollmentQuery.isLoading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--admin-primary)]" />
      </div>
    );
  const enrollment = enrollmentQuery.data;
  if (!enrollment)
    return (
      <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
        <AdminPageHeader
          title="Enrollment not found"
          parent={{ label: "Enrollments", href: "/admin/enrollments" }}
        />
        <button
          className="admin-button admin-button-secondary"
          onClick={() => navigate("/admin/enrollments")}
        >
          Back to enrollments
        </button>
      </div>
    );

  const course = courses.find(item => item.id === enrollment.courseId);
  const batch = batches.find(item => item.id === enrollment.batchId);
  const status = statusConfig[enrollment.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={enrollment.studentName}
        parent={{ label: "Enrollments", href: "/admin/enrollments" }}
        action={
          <span className={`admin-status-label ${status.className}`}>
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
            {status.label}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6">
            <div className="mb-6 flex items-center gap-3">
              <UserRound className="h-5 w-5 text-[var(--admin-primary)]" />
              <h2 className="font-display text-xl font-semibold">
                Student information
              </h2>
            </div>
            <dl className="grid gap-6 sm:grid-cols-2">
              <Detail label="Full name">{enrollment.studentName}</Detail>
              <Detail label="Student ID">
                {enrollment.studentId || "Not assigned"}
              </Detail>
              <Detail label="Mobile">
                <a
                  href={`tel:${enrollment.studentMobile}`}
                  className="inline-flex items-center gap-2 hover:text-[var(--admin-primary)]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {enrollment.studentMobile}
                </a>
              </Detail>
              <Detail label="Email">
                {enrollment.studentEmail ? (
                  <a
                    href={`mailto:${enrollment.studentEmail}`}
                    className="inline-flex items-center gap-2 hover:text-[var(--admin-primary)]"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {enrollment.studentEmail}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Course">
                {course?.name || `Course #${enrollment.courseId}`}
              </Detail>
              <Detail label="Batch">{batch?.name || "Not assigned"}</Detail>
              <Detail label="Applied on">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(enrollment.createdAt).toLocaleString("en-GB")}
                </span>
              </Detail>
            </dl>
          </section>

          <section className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6">
            <div className="mb-6 flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-[var(--admin-primary)]" />
              <h2 className="font-display text-xl font-semibold">
                Payment information
              </h2>
            </div>
            <dl className="grid gap-6 sm:grid-cols-2">
              <Detail label="Method">{enrollment.paymentMethod}</Detail>
              <Detail label="Amount">৳{enrollment.paymentAmount}</Detail>
              <Detail label="Sender account">
                {enrollment.paymentAccountNumber}
              </Detail>
              <Detail label="Transaction ID">
                <span className="font-mono">{enrollment.transactionId}</span>
              </Detail>
            </dl>
            {enrollment.paymentScreenshotUrl && (
              <a
                href={enrollment.paymentScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block max-w-sm"
              >
                <img
                  src={enrollment.paymentScreenshotUrl}
                  alt="Payment receipt"
                  className="max-h-80 w-full object-contain object-left"
                />
              </a>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {enrollment.status === "pending" && (
            <section className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6">
              <h2 className="font-display text-xl font-semibold">
                Review application
              </h2>
              <label className="mt-6 block text-sm font-medium">
                Assign batch
                <AdminSelect
                  value={batchId || ""}
                  onChange={event =>
                    setBatchId(
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                  className="mt-2 w-full"
                >
                  <option value="">No batch selected</option>
                  {batches
                    .filter(item => item.isOpen)
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.currentCount}/{item.maxCapacity})
                      </option>
                    ))}
                </AdminSelect>
              </label>
              <label className="mt-5 block text-sm font-medium">
                Admin notes
                <textarea
                  value={adminNotes}
                  onChange={event => setAdminNotes(event.target.value)}
                  rows={4}
                  className="mt-2 w-full border p-3"
                  placeholder="Optional internal note"
                />
              </label>
              <button
                onClick={() =>
                  verify.mutate({ id, batchId, adminNotes: adminNotes || null })
                }
                disabled={verify.isPending}
                className="admin-button admin-button-success mt-5 w-full"
              >
                <BadgeCheck className="h-4 w-4" />
                {verify.isPending ? "Verifying…" : "Verify enrollment"}
              </button>
              <button
                onClick={() => setRejecting(value => !value)}
                className="admin-button admin-button-secondary mt-3 w-full"
              >
                Reject application
              </button>
              {rejecting && (
                <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
                  <textarea
                    value={rejectionReason}
                    onChange={event => setRejectionReason(event.target.value)}
                    rows={3}
                    className="w-full border p-3"
                    placeholder="Reason for rejection"
                  />
                  <button
                    onClick={() => reject.mutate({ id, rejectionReason })}
                    disabled={!rejectionReason.trim() || reject.isPending}
                    className="admin-button admin-button-danger mt-3 w-full"
                  >
                    {reject.isPending ? "Rejecting…" : "Confirm rejection"}
                  </button>
                </div>
              )}
            </section>
          )}

          {(enrollment.adminNotes || enrollment.rejectionReason) && (
            <section className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6">
              <h2 className="font-display text-xl font-semibold">Notes</h2>
              {enrollment.adminNotes && (
                <div className="mt-5">
                  <p className="text-xs text-[var(--admin-body)]">Admin note</p>
                  <p className="mt-1 text-sm">{enrollment.adminNotes}</p>
                </div>
              )}
              {enrollment.rejectionReason && (
                <div className="mt-5">
                  <p className="text-xs text-[var(--admin-body)]">
                    Rejection reason
                  </p>
                  <p className="mt-1 text-sm text-[var(--admin-failed)]">
                    {enrollment.rejectionReason}
                  </p>
                </div>
              )}
            </section>
          )}

          <a
            href={`https://wa.me/88${enrollment.studentMobile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-button admin-button-secondary flex w-full"
          >
            <MessageCircle className="h-4 w-4" />
            Contact on WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}
