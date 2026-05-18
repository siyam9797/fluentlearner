/**
 * AdminPaymentSettings — Admin page for managing payment methods
 * Features: Add/edit/delete payment methods, set active/inactive, custom instructions
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, AlertCircle,
  Loader2, CreditCard, ToggleLeft, ToggleRight, GripVertical, Upload, QrCode
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface PaymentForm {
  methodName: string;
  accountNumber: string;
  accountHolder: string;
  accountType: string;
  instructions: string;
  qrCodeUrl: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: PaymentForm = {
  methodName: "",
  accountNumber: "",
  accountHolder: "",
  accountType: "",
  instructions: "",
  qrCodeUrl: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminPaymentSettings() {
  const { user, loading: authLoading } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyForm);

  const utils = trpc.useUtils();

  const { data: methods = [], isLoading } = trpc.paymentSettings.adminList.useQuery();

  const createMutation = trpc.paymentSettings.create.useMutation({
    onSuccess: () => {
      toast.success("পেমেন্ট পদ্ধতি যোগ করা হয়েছে");
      setIsAdding(false);
      setForm(emptyForm);
      utils.paymentSettings.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.paymentSettings.update.useMutation({
    onSuccess: () => {
      toast.success("পেমেন্ট পদ্ধতি আপডেট হয়েছে");
      setEditingId(null);
      setForm(emptyForm);
      utils.paymentSettings.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.paymentSettings.delete.useMutation({
    onSuccess: () => {
      toast.success("পেমেন্ট পদ্ধতি মুছে ফেলা হয়েছে");
      utils.paymentSettings.adminList.invalidate();
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
          <a href={getLoginUrl()} className="text-red-600 font-bold hover:underline">লগইন করুন</a>
        </div>
      </div>
    );
  }

  const uploadMutation = trpc.upload.image.useMutation();
  const qrFileRef = useRef<HTMLInputElement>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ২MB এর বেশি হতে পারবে না");
      return;
    }
    setUploadingQr(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
        });
        setForm(prev => ({ ...prev, qrCodeUrl: result.url }));
        toast.success("QR কোড আপলোড হয়েছে!");
        setUploadingQr(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("QR কোড আপলোড ব্যর্থ হয়েছে");
      setUploadingQr(false);
    }
  };

  const startEdit = (method: any) => {
    setEditingId(method.id);
    setIsAdding(false);
    setForm({
      methodName: method.methodName,
      accountNumber: method.accountNumber,
      accountHolder: method.accountHolder || "",
      accountType: method.accountType || "",
      instructions: method.instructions || "",
      qrCodeUrl: method.qrCodeUrl || "",
      isActive: method.isActive,
      sortOrder: method.sortOrder,
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (isSaving) return; // Prevent double-submit
    if (!form.methodName.trim() || !form.accountNumber.trim()) {
      toast.error("পদ্ধতির নাম এবং অ্যাকাউন্ট নম্বর আবশ্যক");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyForm);
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
              <h1 className="text-xl font-bold text-gray-900">পেমেন্ট সেটিংস</h1>
              <p className="text-sm text-gray-500">পেমেন্ট পদ্ধতি যোগ, সম্পাদনা ও নিয়ন্ত্রণ করুন</p>
            </div>
          </div>
          {!isAdding && !editingId && (
            <button
              onClick={() => { setIsAdding(true); setForm({ ...emptyForm, sortOrder: methods.length }); }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-all"
            >
              <Plus className="w-4 h-4" /> নতুন পদ্ধতি
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-bold text-blue-800 mb-1">পেমেন্ট পদ্ধতি কীভাবে কাজ করে?</p>
            <p>এখানে যোগ করা সক্রিয় পদ্ধতিগুলো শিক্ষার্থীদের ভর্তি ফর্মে দেখানো হবে। তারা এই নম্বরে পেমেন্ট করে ট্রানজেকশন আইডি জমা দেবে।</p>
          </div>
        </div>

        {/* Add/Edit form */}
        {(isAdding || editingId) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-900">
              {editingId ? "পেমেন্ট পদ্ধতি সম্পাদনা" : "নতুন পেমেন্ট পদ্ধতি যোগ করুন"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  পদ্ধতির নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.methodName}
                  onChange={e => setForm(prev => ({ ...prev, methodName: e.target.value }))}
                  placeholder="যেমন: bKash, Nagad, Rocket"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  অ্যাকাউন্ট নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={e => setForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="যেমন: 01729879855"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অ্যাকাউন্ট হোল্ডারের নাম</label>
                <input
                  type="text"
                  value={form.accountHolder}
                  onChange={e => setForm(prev => ({ ...prev, accountHolder: e.target.value }))}
                  placeholder="যেমন: MD Aditow Zahid"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অ্যাকাউন্ট ধরন</label>
                <input
                  type="text"
                  value={form.accountType}
                  onChange={e => setForm(prev => ({ ...prev, accountType: e.target.value }))}
                  placeholder="যেমন: Personal, Merchant"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">নির্দেশনা / ইন্সট্রাকশন</label>
              <textarea
                value={form.instructions}
                onChange={e => setForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="শিক্ষার্থীদের জন্য বিশেষ নির্দেশনা লিখুন...&#10;যেমন: Send Money অপশন ব্যবহার করুন। Reference-এ আপনার নাম লিখুন।"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none resize-none"
                rows={3}
              />
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">QR কোড (ঐচ্ছিক)</label>
              <p className="text-xs text-gray-400 mb-2">পেমেন্ট QR কোড ছবি আপলোড করুন — শিক্ষার্থীরা স্ক্যান করে পেমেন্ট করতে পারবে</p>
              {form.qrCodeUrl ? (
                <div className="flex items-center gap-4">
                  <img src={form.qrCodeUrl} alt="QR Code" className="w-24 h-24 rounded-lg border object-contain" />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, qrCodeUrl: "" }))}
                    className="text-red-500 text-sm font-medium hover:underline"
                  >
                    মুছুন
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-red-300 transition-colors"
                  onClick={() => qrFileRef.current?.click()}
                >
                  <QrCode className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">QR কোড আপলোড করুন</p>
                </div>
              )}
              <input
                ref={qrFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrUpload}
              />
              {uploadingQr && <p className="text-sm text-red-600 mt-1">আপলোড হচ্ছে...</p>}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                className="flex items-center gap-2 text-sm"
              >
                {form.isActive ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
                <span className={form.isActive ? "text-green-700 font-medium" : "text-gray-500"}>
                  {form.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
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

        {/* Payment methods list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : methods.length === 0 && !isAdding ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">কোনো পেমেন্ট পদ্ধতি যোগ করা হয়নি</p>
            <button
              onClick={() => { setIsAdding(true); setForm(emptyForm); }}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-red-700 transition-all"
            >
              <Plus className="w-4 h-4 inline mr-1" /> প্রথম পদ্ধতি যোগ করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map(method => (
              <div
                key={method.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  method.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      method.isActive ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {method.methodName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{method.methodName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          method.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {method.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-mono">{method.accountNumber}</p>
                      {method.accountHolder && (
                        <p className="text-xs text-gray-400">{method.accountHolder}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(method)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="সম্পাদনা"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("এই পেমেন্ট পদ্ধতি মুছে ফেলতে চান?")) {
                          deleteMutation.mutate({ id: method.id });
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                {method.instructions && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">নির্দেশনা:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{method.instructions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
