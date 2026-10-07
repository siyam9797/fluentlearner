/**
 * AdminPaymentSettings — Admin page for managing payment methods
 * Features: Add/edit/delete payment methods, set active/inactive, custom instructions
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import { Plus, Check, X, AlertCircle, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "@/lib/router";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminImageUploader from "@/components/AdminImageUploader";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import { Switch } from "@/components/ui/switch";

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

export default function AdminPaymentSettings({
  createMode = false,
  editId,
}: {
  createMode?: boolean;
  editId?: number;
}) {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [editingId, setEditingId] = useState<number | null>(editId ?? null);
  const [isAdding, setIsAdding] = useState(createMode);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [view, setView] = useState<AdminListView>("table");

  const utils = trpc.useUtils();

  const { data: methods = [], isLoading } =
    trpc.paymentSettings.adminList.useQuery();
  const uploadMutation = trpc.upload.image.useMutation();
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    if (!editId || !methods.length) return;
    const method = methods.find(item => item.id === editId);
    if (!method) return;
    setEditingId(method.id);
    setForm({
      methodName: method.methodName,
      accountNumber: method.accountNumber,
      accountHolder: method.accountHolder || "",
      accountType: method.accountType || "",
      instructions: method.instructions || "",
      qrCodeUrl: method.qrCodeUrl || "",
      isActive: method.isActive ?? true,
      sortOrder: method.sortOrder ?? 0,
    });
  }, [editId, methods]);

  const createMutation = trpc.paymentSettings.create.useMutation({
    onSuccess: () => {
      toast.success("Payment method added");
      setIsAdding(false);
      setForm(emptyForm);
      utils.paymentSettings.adminList.invalidate();
      navigate("/admin/payment-settings");
      navigate("/admin/payment-settings");
    },
    onError: err => toast.error(err.message),
  });

  const updateMutation = trpc.paymentSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Payment method updated");
      setEditingId(null);
      setForm(emptyForm);
      utils.paymentSettings.adminList.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const deleteMutation = trpc.paymentSettings.delete.useMutation({
    onSuccess: () => {
      toast.success("Payment method deleted");
      utils.paymentSettings.adminList.invalidate();
    },
    onError: err => toast.error(err.message),
  });

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

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size cannot exceed 2MB");
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
        toast.success("QR code uploaded!");
        setUploadingQr(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("QR code upload failed");
      setUploadingQr(false);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (isSaving) return; // Prevent double-submit
    if (!form.methodName.trim() || !form.accountNumber.trim()) {
      toast.error("Method name and account number are required");
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
    if (createMode || editId) navigate("/admin/payment-settings");
  };

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={
          editingId
            ? "Edit Payment Method"
            : isAdding
              ? "New Payment Method"
              : "Payments"
        }
        description="Add, edit, and manage accepted payment methods."
        parent={
          isAdding || editingId
            ? { label: "Payments", href: "/admin/payment-settings" }
            : undefined
        }
        action={
          !isAdding && !editingId ? (
            <div className="flex items-center gap-2">
              <AdminViewToggle
                view={view}
                onChange={setView}
                label="Payments"
              />
              <button
                onClick={() => navigate("/admin/payment-settings/new")}
                className="admin-primary-button"
              >
                <Plus className="h-4 w-4" />
                New method
              </button>
            </div>
          ) : undefined
        }
      />
      <div className="space-y-6">
        {/* Add/Edit form */}
        {(isAdding || editingId) && (
          <div className="max-w-3xl space-y-5">
            <h3 className="font-bold text-gray-900">
              {editingId ? "Edit Payment Method" : "Add Payment Method"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.methodName}
                  onChange={e =>
                    setForm(prev => ({ ...prev, methodName: e.target.value }))
                  }
                  placeholder="e.g. bKash, Nagad, Rocket"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      accountNumber: e.target.value,
                    }))
                  }
                  placeholder="e.g. 01729879855"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={form.accountHolder}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      accountHolder: e.target.value,
                    }))
                  }
                  placeholder="e.g. MD Aditow Zahid"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <input
                  type="text"
                  value={form.accountType}
                  onChange={e =>
                    setForm(prev => ({ ...prev, accountType: e.target.value }))
                  }
                  placeholder="e.g. Personal, Merchant"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions / Instructions
              </label>
              <textarea
                value={form.instructions}
                onChange={e =>
                  setForm(prev => ({ ...prev, instructions: e.target.value }))
                }
                placeholder="Enter instructions for students...&#10;e.g. Use Send Money and include your name as the reference."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none resize-none"
                rows={3}
              />
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QR Code (Optional)
              </label>
              <div className="mt-2">
                <AdminImageUploader
                  value={form.qrCodeUrl}
                  label="QR code"
                  recommendation="Square image"
                  maxSizeLabel="Max 2 MB"
                  uploading={uploadingQr}
                  onChange={handleQrUpload}
                  onMediaSelect={url =>
                    setForm(prev => ({ ...prev, qrCodeUrl: url }))
                  }
                  onRemove={() => setForm(prev => ({ ...prev, qrCodeUrl: "" }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="payment-active"
                checked={form.isActive}
                onCheckedChange={checked =>
                  setForm(prev => ({ ...prev, isActive: checked }))
                }
              />
              <label
                htmlFor="payment-active"
                className="cursor-pointer text-sm"
              >
                {form.isActive ? "Active" : "Inactive"}
              </label>
            </div>

            <div className="flex gap-2 pt-8">
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="admin-button admin-button-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save
              </button>
              <button
                onClick={handleCancel}
                className="admin-button admin-button-secondary"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment methods list */}
        {!isAdding &&
          !editingId &&
          (isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : methods.length === 0 && !isAdding ? (
            <div className="py-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payment methods added</p>
            </div>
          ) : view === "grid" ? (
            <div className="admin-view-grid">
              {methods.map(method => (
                <div
                  key={method.id}
                  className={`admin-list-card min-h-[220px] p-6 transition-all ${
                    method.isActive
                      ? "border-gray-200"
                      : "border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                          method.isActive
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {method.methodName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">
                            {method.methodName}
                          </p>
                          <span
                            className={`admin-status-label ${method.isActive ? "" : "inactive"}`}
                          >
                            {method.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono">
                          {method.accountNumber}
                        </p>
                        {method.accountHolder && (
                          <p className="text-xs text-gray-400">
                            {method.accountHolder}
                          </p>
                        )}
                      </div>
                    </div>
                    <AdminActionsMenu
                      label={`Actions for ${method.methodName}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin/payment-settings/${method.id}/edit`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          confirm("Delete this payment method?") &&
                          deleteMutation.mutate({ id: method.id })
                        }
                      >
                        Delete
                      </button>
                    </AdminActionsMenu>
                  </div>
                  {method.instructions && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        Instructions:
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {method.instructions}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Account number</th>
                    <th className="px-4 py-3 font-medium">Account holder</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map(method => (
                    <tr
                      key={method.id}
                      className={`border-b border-gray-100 last:border-0 ${!method.isActive ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-[var(--radius-control)] grid h-10 w-10 place-items-center bg-red-50 font-semibold text-red-600">
                            {method.methodName.charAt(0)}
                          </span>
                          <strong className="text-gray-900">
                            {method.methodName}
                          </strong>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {method.accountNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {method.accountHolder || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {method.accountType || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`admin-status-label ${method.isActive ? "" : "inactive"}`}
                        >
                          {method.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <AdminActionsMenu
                          label={`Actions for ${method.methodName}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/payment-settings/${method.id}/edit`
                              )
                            }
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              confirm("Delete this payment method?") &&
                              deleteMutation.mutate({ id: method.id })
                            }
                          >
                            Delete
                          </button>
                        </AdminActionsMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}
