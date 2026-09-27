/**
 * AdminBatches — Admin page for managing student batches
 * Features: Create batches, open/close enrollment, track capacity
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Check,
  X,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useLocation } from "@/lib/router";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import { Switch } from "@/components/ui/switch";
import AdminSelect from "@/components/AdminSelect";

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

export default function AdminBatches({
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
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [view, setView] = useState<AdminListView>("table");

  const utils = trpc.useUtils();

  const { data: batches = [], isLoading } = trpc.batches.adminList.useQuery();
  const { data: courses = [] } = trpc.courses.adminList.useQuery();

  useEffect(() => {
    if (!editId || !batches.length) return;
    const batch = batches.find(item => item.id === editId);
    if (!batch) return;
    setEditingId(batch.id);
    setForm({
      name: batch.name,
      courseId: batch.courseId,
      startDate: batch.startDate
        ? new Date(batch.startDate).toISOString().split("T")[0]
        : "",
      maxCapacity: batch.maxCapacity ?? 30,
      isOpen: batch.isOpen ?? true,
    });
  }, [batches, editId]);

  const createMutation = trpc.batches.create.useMutation({
    onSuccess: () => {
      toast.success("New batch created");
      setIsAdding(false);
      setForm(emptyForm);
      utils.batches.adminList.invalidate();
      navigate("/admin/batches");
      navigate("/admin/batches");
    },
    onError: err => toast.error(err.message),
  });

  const updateMutation = trpc.batches.update.useMutation({
    onSuccess: () => {
      toast.success("Batch updated");
      setEditingId(null);
      setForm(emptyForm);
      utils.batches.adminList.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const deleteMutation = trpc.batches.delete.useMutation({
    onSuccess: () => {
      toast.success("Batch deleted");
      utils.batches.adminList.invalidate();
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (isSaving) return; // Prevent double-submit
    if (!form.name.trim()) {
      toast.error("Batch name is required");
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
    if (createMode || editId) navigate("/admin/batches");
  };

  const getCourseName = (courseId: number | null) => {
    if (!courseId) return "All Courses";
    return courses.find(c => c.id === courseId)?.name || `Course #${courseId}`;
  };

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={editingId ? "Edit Batch" : isAdding ? "New Batch" : "Batches"}
        description="Create batches and manage student capacity."
        parent={
          isAdding || editingId
            ? { label: "Batches", href: "/admin/batches" }
            : undefined
        }
        action={
          !isAdding && !editingId ? (
            <div className="flex items-center gap-2">
              <AdminViewToggle view={view} onChange={setView} label="Batches" />
              <button
                onClick={() => navigate("/admin/batches/new")}
                className="admin-primary-button"
              >
                <Plus className="h-4 w-4" />
                New batch
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
              {editingId ? "Edit Batch" : "Create New Batch"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e =>
                    setForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Batch 25 - March 2026"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <AdminSelect
                  value={form.courseId || ""}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      courseId: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e =>
                    setForm(prev => ({ ...prev, startDate: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Students
                </label>
                <input
                  type="number"
                  value={form.maxCapacity}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      maxCapacity: parseInt(e.target.value) || 30,
                    }))
                  }
                  min={1}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="batch-open"
                checked={form.isOpen}
                onCheckedChange={checked =>
                  setForm(prev => ({ ...prev, isOpen: checked }))
                }
              />
              <label htmlFor="batch-open" className="cursor-pointer text-sm">
                {form.isOpen ? "Enrollment Open" : "Enrollment Closed"}
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

        {/* Batches list */}
        {!isAdding &&
          !editingId &&
          (isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : batches.length === 0 && !isAdding ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No batches have been created</p>
            </div>
          ) : view === "grid" ? (
            <div className="admin-view-grid">
              {batches.map(batch => {
                const currentCount = batch.currentCount ?? 0;
                const maxCapacity = batch.maxCapacity ?? 30;
                const capacityPercent =
                  maxCapacity > 0
                    ? Math.round((currentCount / maxCapacity) * 100)
                    : 0;
                const isFull = currentCount >= maxCapacity;

                return (
                  <div
                    key={batch.id}
                    className="admin-list-card min-h-[240px] p-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            batch.isOpen ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
                          <Users
                            className={`w-6 h-6 ${batch.isOpen ? "text-green-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">
                              {batch.name}
                            </h3>
                            <span
                              className={`admin-status-label ${batch.isOpen && !isFull ? "" : "inactive"}`}
                            >
                              {isFull
                                ? "Full"
                                : batch.isOpen
                                  ? "Enrollment Open"
                                  : "Enrollment Closed"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />{" "}
                              {getCourseName(batch.courseId)}
                            </span>
                            {batch.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />{" "}
                                {new Date(batch.startDate).toLocaleDateString(
                                  "bn-BD"
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <AdminActionsMenu label={`Actions for ${batch.name}`}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/batches/${batch.id}/edit`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            confirm("Delete this batch?") &&
                            deleteMutation.mutate({ id: batch.id })
                          }
                        >
                          Delete
                        </button>
                      </AdminActionsMenu>
                    </div>

                    {/* Capacity bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {currentCount} / {maxCapacity} students
                        </span>
                        <span
                          className={`font-bold ${
                            capacityPercent >= 90
                              ? "text-red-600"
                              : capacityPercent >= 70
                                ? "text-amber-600"
                                : "text-green-600"
                          }`}
                        >
                          {capacityPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            capacityPercent >= 90
                              ? "bg-red-500"
                              : capacityPercent >= 70
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(capacityPercent, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Batch</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Start date</th>
                    <th className="px-4 py-3 font-medium">Capacity</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(batch => {
                    const currentCount = batch.currentCount ?? 0;
                    const maxCapacity = batch.maxCapacity ?? 30;
                    const full = currentCount >= maxCapacity;
                    return (
                      <tr
                        key={batch.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {batch.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {getCourseName(batch.courseId)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {batch.startDate
                            ? new Date(batch.startDate).toLocaleDateString(
                                "en-GB"
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {currentCount} / {maxCapacity}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`admin-status-label ${batch.isOpen && !full ? "" : "inactive"}`}
                          >
                            {full ? "Full" : batch.isOpen ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <AdminActionsMenu label={`Actions for ${batch.name}`}>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/batches/${batch.id}/edit`)
                              }
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                confirm("Delete this batch?") &&
                                deleteMutation.mutate({ id: batch.id })
                              }
                            >
                              Delete
                            </button>
                          </AdminActionsMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}
