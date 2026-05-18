/**
 * AdminEnrollments — Admin page for managing student enrollments
 * Features: View all enrollments, filter by status, verify/reject, assign batch, generate student ID
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Eye, Search,
  Filter, Users, AlertCircle, Loader2, BadgeCheck, Ban,
  ChevronDown, ChevronUp, ExternalLink, Phone, Mail,
  CreditCard, Hash, Calendar, MessageCircle
} from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "all" | "pending" | "verified" | "rejected" | "refunded";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "যাচাই প্রক্রিয়াধীন", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  verified: { label: "যাচাইকৃত", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  rejected: { label: "প্রত্যাখ্যাত", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
  refunded: { label: "ফেরত দেওয়া হয়েছে", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: CreditCard },
};

export default function AdminEnrollments() {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: enrollments = [], isLoading } = trpc.enrollments.adminList.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: stats } = trpc.enrollments.stats.useQuery();
  const { data: courses = [] } = trpc.courses.adminList.useQuery();
  const { data: batchesList = [] } = trpc.batches.adminList.useQuery();

  const verifyMutation = trpc.enrollments.verify.useMutation({
    onSuccess: (data) => {
      toast.success(`ভর্তি যাচাই সম্পন্ন! Student ID: ${data.studentId}`);
      utils.enrollments.adminList.invalidate();
      utils.enrollments.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.enrollments.reject.useMutation({
    onSuccess: () => {
      toast.success("আবেদন প্রত্যাখ্যান করা হয়েছে");
      setRejectingId(null);
      setRejectReason("");
      utils.enrollments.adminList.invalidate();
      utils.enrollments.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">অ্যাক্সেস নেই</h2>
          <p className="text-gray-600 mb-4">এই পেজ দেখতে Admin হিসেবে লগইন করুন</p>
          <a href="/admin" className="text-red-600 font-bold hover:underline">লগইন করুন</a>
        </div>
      </div>
    );
  }

  const getCourseName = (courseId: number) => {
    return courses.find(c => c.id === courseId)?.name || `Course #${courseId}`;
  };

  // Filter enrollments by search
  const filteredEnrollments = enrollments.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.studentName.toLowerCase().includes(q) ||
      e.studentMobile.includes(q) ||
      e.transactionId.toLowerCase().includes(q) ||
      (e.studentId && e.studentId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <span className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ভর্তি ম্যানেজমেন্ট</h1>
              <p className="text-sm text-gray-500">সকল ভর্তি আবেদন পরিচালনা করুন</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">মোট আবেদন</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-xs text-amber-600">যাচাই প্রক্রিয়াধীন</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.verified}</p>
              <p className="text-xs text-green-600">যাচাইকৃত</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              <p className="text-xs text-red-600">প্রত্যাখ্যাত</p>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="নাম, মোবাইল, TrxID, বা Student ID দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "pending", "verified", "rejected"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? "bg-red-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s === "all" ? "সব" : statusConfig[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enrollments list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">কোনো আবেদন পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEnrollments.map(enrollment => {
              const status = statusConfig[enrollment.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedId === enrollment.id;

              return (
                <div key={enrollment.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Summary row */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : enrollment.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${status.bg} border`}>
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{enrollment.studentName}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {getCourseName(enrollment.courseId)} • {enrollment.paymentMethod} • ৳{enrollment.paymentAmount}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {enrollment.studentId && (
                          <span className="hidden sm:inline-flex bg-green-100 text-green-700 text-xs font-mono font-bold px-2 py-1 rounded">
                            {enrollment.studentId}
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-1 rounded border ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Student info */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 text-sm">শিক্ষার্থীর তথ্য</h4>
                          <div className="space-y-1.5 text-sm">
                            <p className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3.5 h-3.5" /> {enrollment.studentMobile}
                            </p>
                            {enrollment.studentEmail && (
                              <p className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-3.5 h-3.5" /> {enrollment.studentEmail}
                              </p>
                            )}
                            {enrollment.studentId && (
                              <p className="flex items-center gap-2 text-gray-600">
                                <Hash className="w-3.5 h-3.5" /> Student ID: <span className="font-mono font-bold">{enrollment.studentId}</span>
                              </p>
                            )}
                            <p className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-3.5 h-3.5" /> {new Date(enrollment.createdAt).toLocaleDateString("bn-BD")}
                            </p>
                          </div>
                        </div>

                        {/* Payment info */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 text-sm">পেমেন্ট তথ্য</h4>
                          <div className="space-y-1.5 text-sm">
                            <p className="text-gray-600">পদ্ধতি: <span className="font-medium">{enrollment.paymentMethod}</span></p>
                            <p className="text-gray-600">প্রেরকের নম্বর: <span className="font-medium">{enrollment.paymentAccountNumber}</span></p>
                            <p className="text-gray-600">TrxID: <span className="font-mono font-bold">{enrollment.transactionId}</span></p>
                            <p className="text-gray-600">পরিমাণ: <span className="font-bold text-red-600">৳{enrollment.paymentAmount}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Payment screenshot */}
                      {enrollment.paymentScreenshotUrl && (
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm mb-2">পেমেন্ট স্ক্রিনশট</h4>
                          <a href={enrollment.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                            <img
                              src={enrollment.paymentScreenshotUrl}
                              alt="Payment screenshot"
                              className="max-h-48 rounded-lg border border-gray-200 object-contain"
                            />
                          </a>
                        </div>
                      )}

                      {/* Admin notes */}
                      {enrollment.adminNotes && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs font-bold text-blue-800 mb-1">অ্যাডমিন নোট:</p>
                          <p className="text-sm text-blue-700">{enrollment.adminNotes}</p>
                        </div>
                      )}

                      {/* Rejection reason */}
                      {enrollment.rejectionReason && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <p className="text-xs font-bold text-red-800 mb-1">প্রত্যাখ্যানের কারণ:</p>
                          <p className="text-sm text-red-700">{enrollment.rejectionReason}</p>
                        </div>
                      )}

                      {/* Action buttons for pending enrollments */}
                      {enrollment.status === "pending" && (
                        <div className="space-y-3 pt-2">
                          {/* Batch selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ব্যাচ নির্ধারণ (ঐচ্ছিক)</label>
                            <select
                              value={selectedBatchId || ""}
                              onChange={e => setSelectedBatchId(e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                            >
                              <option value="">ব্যাচ নির্বাচন করুন</option>
                              {batchesList.filter(b => b.isOpen).map(b => (
                                <option key={b.id} value={b.id}>{b.name} ({b.currentCount}/{b.maxCapacity})</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => verifyMutation.mutate({
                                id: enrollment.id,
                                batchId: selectedBatchId,
                              })}
                              disabled={verifyMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-60 transition-all"
                            >
                              {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                              যাচাই করুন
                            </button>
                            <button
                              onClick={() => setRejectingId(rejectingId === enrollment.id ? null : enrollment.id)}
                              className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-red-200 transition-all"
                            >
                              <Ban className="w-4 h-4" /> প্রত্যাখ্যান
                            </button>
                          </div>

                          {/* Reject reason input */}
                          {rejectingId === enrollment.id && (
                            <div className="space-y-2">
                              <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="প্রত্যাখ্যানের কারণ লিখুন..."
                                className="w-full px-3 py-2 rounded-lg border border-red-300 text-sm focus:ring-2 focus:ring-red-200 outline-none resize-none"
                                rows={2}
                              />
                              <button
                                onClick={() => rejectMutation.mutate({
                                  id: enrollment.id,
                                  rejectionReason: rejectReason,
                                })}
                                disabled={!rejectReason.trim() || rejectMutation.isPending}
                                className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-60 transition-all"
                              >
                                {rejectMutation.isPending ? "প্রক্রিয়াধীন..." : "প্রত্যাখ্যান নিশ্চিত করুন"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* WhatsApp contact */}
                      <a
                        href={`https://wa.me/88${enrollment.studentMobile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp-এ যোগাযোগ
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
