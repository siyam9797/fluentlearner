/**
 * AdminBatches — Admin page for managing student batches
 * Features: Create batches, open/close enrollment, track capacity
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, AlertCircle,
  Loader2, Users, Calendar, ToggleLeft, ToggleRight, BookOpen
} from "lucide-react";
import { toast } from "sonner";

interface BatchForm {
  name: string;
  courseId: number | null;
  startDate: string;
  maxCapacity: number;
  isOpen: boolean;
}

const emptyForm: BatchForm = {
  name: "",
  courseId: null,
  startDate: "",
  maxCapacity: 30,
  isOpen: true,
};

export default function AdminBatches() {
  const { user, loading: authLoading } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<BatchForm>(emptyForm);

  const utils = trpc.useUtils();

  const { data: batches = [], isLoading } = trpc.batches.adminList.useQuery();
  const { data: courses = [] } = trpc.courses.adminList.useQuery();

  const createMutation = trpc.batches.create.useMutation({
    onSuccess: () => {
      toast.success("নতুন ব্যাচ তৈরি হয়েছে");
      setIsAdding(false);
      setForm(emptyForm);
      utils.batches.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.batches.update.useMutation({
    onSuccess: () => {
      toast.success("ব্যাচ আপডেট হয়েছে");
      setEditingId(null);
      setForm(emptyForm);
      utils.batches.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.batches.delete.useMutation({
    onSuccess: () => {
      toast.success("ব্যাচ মুছে ফেলা হয়েছে");
      utils.batches.adminList.invalidate();
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

  const startEdit = (batch: any) => {
    setEditingId(batch.id);
    setIsAdding(false);
    setForm({
      name: batch.name,
      courseId: batch.courseId,
      startDate: batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : "",
      maxCapacity: batch.maxCapacity,
      isOpen: batch.isOpen,
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (isSaving) return; // Prevent double-submit
    if (!form.name.trim()) {
      toast.error("ব্যাচের নাম আবশ্যক");
      return;
    }

    const payload = {
      name: form.name,
      courseId: form.courseId,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      maxCapacity: form.maxCapacity,
      isOpen: form.isOpen,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyForm);
  };

  const getCourseName = (courseId: number | null) => {
    if (!courseId) return "সব কোর্স";
    return courses.find(c => c.id === courseId)?.name || `Course #${courseId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <span className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ব্যাচ ম্যানেজমেন্ট</h1>
              <p className="text-sm text-gray-500">ব্যাচ তৈরি করুন এবং শিক্ষার্থী সংখ্যা নিয়ন্ত্রণ করুন</p>
            </div>
          </div>
          {!isAdding && !editingId && (
            <button
              onClick={() => { setIsAdding(true); setForm(emptyForm); }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-all"
            >
              <Plus className="w-4 h-4" /> নতুন ব্যাচ
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Add/Edit form */}
        {(isAdding || editingId) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-900">
              {editingId ? "ব্যাচ সম্পাদনা" : "নতুন ব্যাচ তৈরি করুন"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ব্যাচের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="যেমন: Batch 25 - March 2026"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">কোর্স</label>
                <select
                  value={form.courseId || ""}
                  onChange={e => setForm(prev => ({ ...prev, courseId: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                >
                  <option value="">সব কোর্সের জন্য</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শুরুর তারিখ</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">সর্বোচ্চ শিক্ষার্থী</label>
                <input
                  type="number"
                  value={form.maxCapacity}
                  onChange={e => setForm(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 30 }))}
                  min={1}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                className="flex items-center gap-2 text-sm"
              >
                {form.isOpen ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
                <span className={form.isOpen ? "text-green-700 font-medium" : "text-gray-500"}>
                  {form.isOpen ? "ভর্তি চালু" : "ভর্তি বন্ধ"}
                </span>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-60 transition-all"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                সংরক্ষণ করুন
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all"
              >
                <X className="w-4 h-4" /> বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Batches list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : batches.length === 0 && !isAdding ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">কোনো ব্যাচ তৈরি হয়নি</p>
            <button
              onClick={() => { setIsAdding(true); setForm(emptyForm); }}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-red-700 transition-all"
            >
              <Plus className="w-4 h-4 inline mr-1" /> প্রথম ব্যাচ তৈরি করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map(batch => {
              const currentCount = batch.currentCount ?? 0;
              const maxCapacity = batch.maxCapacity ?? 30;
              const capacityPercent = maxCapacity > 0
                ? Math.round((currentCount / maxCapacity) * 100)
                : 0;
              const isFull = currentCount >= maxCapacity;

              return (
                <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        batch.isOpen ? "bg-green-100" : "bg-gray-100"
                      }`}>
                        <Users className={`w-6 h-6 ${batch.isOpen ? "text-green-600" : "text-gray-400"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{batch.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            batch.isOpen && !isFull
                              ? "bg-green-100 text-green-700"
                              : isFull
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {isFull ? "পূর্ণ" : batch.isOpen ? "ভর্তি চালু" : "ভর্তি বন্ধ"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> {getCourseName(batch.courseId)}
                          </span>
                          {batch.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {new Date(batch.startDate).toLocaleDateString("bn-BD")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(batch)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("এই ব্যাচ মুছে ফেলতে চান?")) {
                            deleteMutation.mutate({ id: batch.id });
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {currentCount} / {maxCapacity} জন
                      </span>
                      <span className={`font-bold ${
                        capacityPercent >= 90 ? "text-red-600" : capacityPercent >= 70 ? "text-amber-600" : "text-green-600"
                      }`}>
                        {capacityPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-amber-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
