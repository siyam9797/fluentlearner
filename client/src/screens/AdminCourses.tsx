import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, X, BookOpen, CheckCircle2, FileImage } from "lucide-react";
import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useLocation } from "@/lib/router";
import AdminImageUploader from "@/components/AdminImageUploader";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import AdminActionsMenu from "@/components/AdminActionsMenu";

type CurriculumModule = { title: string; content: string };
type FaqItem = { question: string; answer: string };
type UploadField = "imageUrl" | "instructorPhoto";
type UploadState = {
  fileName: string;
  fileSize: number;
  progress: number;
  status: "reading" | "uploading" | "done" | "error";
  url?: string;
};

type CourseFormData = {
  name: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  fullDescription: string;
  imageUrl: string;
  duration: string;
  originalPrice: string;
  price: string;
  badge: string;
  badgeColor: string;
  category: "ielts" | "spoken" | "grammar" | "study-abroad" | "other";
  level: "beginner" | "intermediate" | "advanced" | "all";
  features: string[];
  learningOutcomes: string[];
  curriculum: CurriculumModule[];
  targetAudience: string;
  instructorName: string;
  instructorBio: string;
  instructorPhoto: string;
  courseFaq: FaqItem[];
  videoUrl: string;
  slug: string;
  schedule: string;
  maxStudents: number | null;
  enrolledCount: number | null;
  enrollMessage: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
};

const emptyCourse: CourseFormData = {
  name: "",
  nameEn: "",
  shortDescription: "",
  description: "",
  fullDescription: "",
  imageUrl: "",
  duration: "",
  originalPrice: "",
  price: "",
  badge: "",
  badgeColor: "bg-red-500",
  category: "ielts",
  level: "all",
  features: [],
  learningOutcomes: [],
  curriculum: [],
  targetAudience: "",
  instructorName: "",
  instructorBio: "",
  instructorPhoto: "",
  courseFaq: [],
  videoUrl: "",
  slug: "",
  schedule: "",
  maxStudents: null,
  enrolledCount: null,
  enrollMessage: "",
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readFileAsBase64(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = event => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 60));
    };

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read the image"));
        return;
      }

      const base64 = reader.result.split(",")[1];
      if (!base64) {
        reject(new Error("Unable to read the image"));
        return;
      }

      onProgress?.(60);
      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Unable to read the image"));
    reader.readAsDataURL(file);
  });
}

export default function AdminCourses({
  createMode = false,
  editId,
}: {
  createMode?: boolean;
  editId?: number;
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [editingCourse, setEditingCourse] = useState<CourseFormData | null>(
    createMode ? { ...emptyCourse } : null
  );
  const [editingId, setEditingId] = useState<number | null>(editId ?? null);
  const [dialogOpen, setDialogOpen] = useState(createMode || Boolean(editId));
  const [featuresText, setFeaturesText] = useState("");
  const [outcomesText, setOutcomesText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingInstructor, setUploadingInstructor] = useState(false);
  const [uploadState, setUploadState] = useState<
    Record<UploadField, UploadState | null>
  >({
    imageUrl: null,
    instructorPhoto: null,
  });
  const [activeTab, setActiveTab] = useState<
    "basic" | "detail" | "instructor" | "faq"
  >("basic");
  const [view, setView] = useState<AdminListView>("table");

  const utils = trpc.useUtils();
  const { data: courses, isLoading } = trpc.courses.adminList.useQuery();
  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      utils.courses.adminList.invalidate();
      toast.success("Course created successfully!");
      setDialogOpen(false);
      navigate("/admin/courses");
    },
    onError: err => toast.error(err.message),
  });
  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      utils.courses.adminList.invalidate();
      toast.success("Course updated successfully!");
      setDialogOpen(false);
      navigate("/admin/courses");
    },
    onError: err => toast.error(err.message),
  });
  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      utils.courses.adminList.invalidate();
      toast.success("Course deleted successfully!");
    },
    onError: err => toast.error(err.message),
  });
  const uploadMutation = trpc.upload.image.useMutation();

  const updateUploadState = (
    field: UploadField,
    changes: Partial<UploadState>
  ) => {
    setUploadState(prev => ({
      ...prev,
      [field]: prev[field] ? { ...prev[field], ...changes } : null,
    }));
  };

  const clearUploadState = (field: UploadField) => {
    setUploadState(prev => ({ ...prev, [field]: null }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: UploadField
  ) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !editingCourse) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
      input.value = "";
      return;
    }
    const setLoading =
      field === "imageUrl" ? setUploading : setUploadingInstructor;
    setLoading(true);
    setUploadState(prev => ({
      ...prev,
      [field]: {
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: "reading",
      },
    }));
    try {
      const base64 = await readFileAsBase64(file, progress => {
        updateUploadState(field, { progress, status: "reading" });
      });
      updateUploadState(field, { progress: 70, status: "uploading" });
      const result = await uploadMutation.mutateAsync({
        base64,
        filename: file.name,
        contentType: file.type,
      });
      setEditingCourse(prev =>
        prev ? { ...prev, [field]: result.url } : prev
      );
      updateUploadState(field, {
        progress: 100,
        status: "done",
        url: result.url,
      });
      toast.success("Image uploaded!");
    } catch (err) {
      updateUploadState(field, { progress: 0, status: "error" });
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setLoading(false);
      input.value = "";
    }
  };

  const openCreate = () => {
    navigate("/admin/courses/new");
  };

  const openEdit = (course: any) => {
    const formData: CourseFormData = {
      name: course.name || "",
      nameEn: course.nameEn || "",
      shortDescription: course.shortDescription || "",
      description: course.description || "",
      fullDescription: course.fullDescription || "",
      imageUrl: course.imageUrl || "",
      duration: course.duration || "",
      originalPrice: course.originalPrice || "",
      price: course.price || "",
      badge: course.badge || "",
      badgeColor: course.badgeColor || "bg-red-500",
      category: course.category || "ielts",
      level: course.level || "all",
      features: course.features || [],
      learningOutcomes: course.learningOutcomes || [],
      curriculum: course.curriculum || [],
      targetAudience: course.targetAudience || "",
      instructorName: course.instructorName || "",
      instructorBio: course.instructorBio || "",
      instructorPhoto: course.instructorPhoto || "",
      courseFaq: course.courseFaq || [],
      videoUrl: course.videoUrl || "",
      slug: course.slug || "",
      schedule: course.schedule || "",
      maxStudents: course.maxStudents,
      enrolledCount: course.enrolledCount,
      enrollMessage: course.enrollMessage || "",
      sortOrder: course.sortOrder || 0,
      isActive: course.isActive ?? true,
      isFeatured: course.isFeatured ?? false,
    };
    setEditingCourse(formData);
    setEditingId(course.id);
    setFeaturesText((course.features || []).join("\n"));
    setOutcomesText((course.learningOutcomes || []).join("\n"));
    setUploadState({ imageUrl: null, instructorPhoto: null });
    setActiveTab("basic");
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!editId || !courses?.length) return;
    const course = courses.find(item => item.id === editId);
    if (course) openEdit(course);
  }, [courses, editId]);

  if (!canAccessAdminDashboard(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const renderUploadStatus = (field: UploadField) => {
    const state = uploadState[field];
    if (!state) return null;

    const isActive =
      state?.status === "reading" || state?.status === "uploading";
    const isDone = state?.status === "done";
    const isError = state?.status === "error";

    return (
      <div
        className={`mt-2 rounded-lg border p-3 text-sm ${
          isError ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              {isDone ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <FileImage
                  className={`mt-0.5 h-4 w-4 shrink-0 ${isError ? "text-red-600" : "text-brand-red"}`}
                />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">
                  {state.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(state.fileSize)} ·{" "}
                  {state.status === "reading"
                    ? "Preparing file"
                    : state.status === "uploading"
                      ? "Uploading to server"
                      : state.status === "done"
                        ? "Upload complete"
                        : "Upload failed"}
                </p>
              </div>
            </div>
            {isActive && (
              <span
                className={`text-xs font-semibold ${isError ? "text-red-600" : "text-gray-500"}`}
              >
                {state.progress}%
              </span>
            )}
          </div>
          {isActive && (
            <Progress
              value={state.progress}
              className="bg-brand-red/10 [&_[data-slot=progress-indicator]]:bg-brand-red"
            />
          )}
        </div>
      </div>
    );
  };

  const handleSave = () => {
    if (!editingCourse) return;
    let slug = editingCourse.slug;
    if (!slug && editingCourse.nameEn)
      slug = generateSlug(editingCourse.nameEn);
    else if (!slug && editingCourse.name)
      slug = generateSlug(editingCourse.name);

    const data = {
      ...editingCourse,
      slug,
      features: featuresText.split("\n").filter(Boolean),
      learningOutcomes: outcomesText.split("\n").filter(Boolean),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`"${name}" Delete this course?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const toggleActive = (id: number, current: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !current } });
  };

  const toggleFeatured = (id: number, current: boolean) => {
    updateMutation.mutate({ id, data: { isFeatured: !current } });
  };

  // Curriculum helpers
  const addCurriculumModule = () => {
    if (!editingCourse) return;
    setEditingCourse({
      ...editingCourse,
      curriculum: [...editingCourse.curriculum, { title: "", content: "" }],
    });
  };
  const updateCurriculumModule = (
    index: number,
    field: "title" | "content",
    value: string
  ) => {
    if (!editingCourse) return;
    const updated = [...editingCourse.curriculum];
    updated[index] = { ...updated[index], [field]: value };
    setEditingCourse({ ...editingCourse, curriculum: updated });
  };
  const removeCurriculumModule = (index: number) => {
    if (!editingCourse) return;
    setEditingCourse({
      ...editingCourse,
      curriculum: editingCourse.curriculum.filter((_, i) => i !== index),
    });
  };

  // FAQ helpers
  const addFaqItem = () => {
    if (!editingCourse) return;
    setEditingCourse({
      ...editingCourse,
      courseFaq: [...editingCourse.courseFaq, { question: "", answer: "" }],
    });
  };
  const updateFaqItem = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    if (!editingCourse) return;
    const updated = [...editingCourse.courseFaq];
    updated[index] = { ...updated[index], [field]: value };
    setEditingCourse({ ...editingCourse, courseFaq: updated });
  };
  const removeFaqItem = (index: number) => {
    if (!editingCourse) return;
    setEditingCourse({
      ...editingCourse,
      courseFaq: editingCourse.courseFaq.filter((_, i) => i !== index),
    });
  };

  const categoryLabels: Record<string, string> = {
    ielts: "IELTS",
    spoken: "Spoken English",
    grammar: "Grammar",
    "study-abroad": "Study Abroad",
    other: "Other",
  };

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <div className={dialogOpen ? "hidden" : ""}>
        <AdminPageHeader
          title="Courses"
          description={`${courses?.length || 0} courses in your catalog.`}
          action={
            <div className="flex items-center gap-2">
              <AdminViewToggle view={view} onChange={setView} label="Courses" />
              <button onClick={openCreate} className="admin-primary-button">
                <Plus className="h-4 w-4" />
                New course
              </button>
            </div>
          }
        />
        {isLoading ? (
          <div className="admin-view-grid">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-40 bg-gray-200 rounded mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses?.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No courses have been created yet</p>
          </div>
        ) : view === "grid" ? (
          <div className="admin-view-grid">
            {courses?.map(course => (
              <Card
                key={course.id}
                className={`admin-list-card ${!course.isActive ? "opacity-60" : ""}`}
              >
                <div className="absolute right-3 top-3 z-20">
                  <AdminActionsMenu label={`Actions for ${course.name}`}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/courses/${course.id}/edit`)
                      }
                    >
                      Edit
                    </button>
                    {course.slug && (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(`/courses/${course.slug}`, "_blank")
                        }
                      >
                        Preview
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(course.id, course.isActive ?? true)
                      }
                    >
                      {course.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toggleFeatured(course.id, course.isFeatured ?? false)
                      }
                    >
                      {course.isFeatured ? "Remove featured" : "Make featured"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(course.id, course.name)}
                    >
                      Delete
                    </button>
                  </AdminActionsMenu>
                </div>
                {course.imageUrl ? (
                  <div className="admin-list-card-image aspect-[4/3]">
                    <img
                      src={course.imageUrl}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="admin-list-card-image grid aspect-[4/3] place-items-center">
                    <BookOpen className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <span
                  className={`admin-status-label absolute left-3 top-3 z-10 ${course.isActive ? "" : "inactive"}`}
                >
                  {course.isActive ? "Published" : "Hidden"}
                </span>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{course.name}</h3>
                      {course.nameEn && (
                        <p className="text-xs text-gray-500">{course.nameEn}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {categoryLabels[course.category]}
                    </span>
                  </div>
                  {course.shortDescription && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {course.shortDescription}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    {course.price && (
                      <span className="font-bold text-brand-red">
                        {course.price}
                      </span>
                    )}
                    {course.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {course.originalPrice}
                      </span>
                    )}
                    {course.duration && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {course.duration}
                      </span>
                    )}
                  </div>
                  {course.slug && (
                    <p className="text-xs text-gray-400 mb-2 truncate">
                      /courses/{course.slug}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="admin-list-table-wrap">
            <table className="admin-list-table min-w-[780px]">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses?.map(course => (
                  <tr
                    key={course.id}
                    className={`border-b border-gray-100 last:border-0 ${!course.isActive ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-[220px] items-center gap-3">
                        {course.imageUrl ? (
                          <img
                            src={course.imageUrl}
                            alt=""
                            className="h-12 w-16 object-cover"
                          />
                        ) : (
                          <div className="grid h-12 w-16 place-items-center bg-gray-100">
                            <BookOpen className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {course.name}
                          </p>
                          {course.nameEn && (
                            <p className="text-xs text-gray-500">
                              {course.nameEn}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {categoryLabels[course.category]}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {course.price || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {course.duration || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`admin-status-label ${course.isActive ? "" : "inactive"}`}
                      >
                        {course.isActive ? "Published" : "Hidden"}
                      </span>
                      {course.isFeatured && (
                        <span className="ml-2 text-xs text-amber-600">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminActionsMenu label={`Actions for ${course.name}`}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/courses/${course.id}/edit`)
                          }
                        >
                          Edit
                        </button>
                        {course.slug && (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(`/courses/${course.slug}`, "_blank")
                            }
                          >
                            Preview
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(course.id, course.isActive ?? true)
                          }
                        >
                          {course.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            toggleFeatured(
                              course.id,
                              course.isFeatured ?? false
                            )
                          }
                        >
                          {course.isFeatured
                            ? "Remove featured"
                            : "Make featured"}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDelete(course.id, course.name)}
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
        )}
      </div>

      {/* Create/Edit page */}
      {dialogOpen && (
        <>
          <AdminPageHeader
            title={editingId ? "Edit Course" : "New Course"}
            description=""
            parent={{ label: "Courses", href: "/admin/courses" }}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent page showCloseButton={false}>
              {editingCourse && (
                <div>
                  {/* Tab Navigation */}
                  <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
                    {[
                      { key: "basic" as const, label: "Basic Information" },
                      {
                        key: "detail" as const,
                        label: "Details and Curriculum",
                      },
                      { key: "instructor" as const, label: "Instructor" },
                      { key: "faq" as const, label: "FAQ" },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ==================== BASIC TAB ==================== */}
                  {activeTab === "basic" && (
                    <div className="space-y-4">
                      {/* Image Upload */}
                      <div>
                        <Label>Course Image</Label>
                        <div className="mt-2">
                          <AdminImageUploader
                            value={editingCourse.imageUrl}
                            label="Course image"
                            recommendation="Landscape, 16:9 ratio"
                            uploading={uploading}
                            onChange={e => handleImageUpload(e, "imageUrl")}
                            onMediaSelect={url =>
                              setEditingCourse({
                                ...editingCourse,
                                imageUrl: url,
                              })
                            }
                            onRemove={() => {
                              setEditingCourse({
                                ...editingCourse,
                                imageUrl: "",
                              });
                              clearUploadState("imageUrl");
                            }}
                          />
                          {renderUploadStatus("imageUrl")}
                        </div>
                      </div>

                      {/* Names */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Course Name *</Label>
                          <Input
                            value={editingCourse.name}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                name: e.target.value,
                              })
                            }
                            placeholder="IELTS Complete Preparation"
                          />
                        </div>
                        <div>
                          <Label>Secondary Course Name</Label>
                          <Input
                            value={editingCourse.nameEn}
                            onChange={e => {
                              const nameEn = e.target.value;
                              const slug = editingCourse.slug
                                ? editingCourse.slug
                                : generateSlug(nameEn);
                              setEditingCourse({
                                ...editingCourse,
                                nameEn,
                                slug,
                              });
                            }}
                            placeholder="IELTS Complete Preparation"
                          />
                        </div>
                      </div>

                      {/* Slug */}
                      <div>
                        <Label>URL Slug</Label>
                        <p className="text-xs text-gray-400 mb-1">
                          The course page link is generated automatically from
                          the English name
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 whitespace-nowrap">
                            /courses/
                          </span>
                          <Input
                            value={editingCourse.slug}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                slug: e.target.value,
                              })
                            }
                            placeholder="ielts-complete-preparation"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Short Description</Label>
                        <Input
                          value={editingCourse.shortDescription}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              shortDescription: e.target.value,
                            })
                          }
                          placeholder="Describe the course in one line"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editingCourse.description}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              description: e.target.value,
                            })
                          }
                          placeholder="Course summary..."
                          rows={3}
                        />
                      </div>

                      {/* Pricing & Duration */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Price</Label>
                          <Input
                            value={editingCourse.price}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                price: e.target.value,
                              })
                            }
                            placeholder="৳8,500"
                          />
                        </div>
                        <div>
                          <Label>Original Price</Label>
                          <Input
                            value={editingCourse.originalPrice}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                originalPrice: e.target.value,
                              })
                            }
                            placeholder="৳12,000"
                          />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input
                            value={editingCourse.duration}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                duration: e.target.value,
                              })
                            }
                            placeholder="2 months"
                          />
                        </div>
                      </div>

                      {/* Category & Level */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={editingCourse.category}
                            onValueChange={v =>
                              setEditingCourse({
                                ...editingCourse,
                                category: v as any,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ielts">IELTS</SelectItem>
                              <SelectItem value="spoken">
                                Spoken English
                              </SelectItem>
                              <SelectItem value="grammar">Grammar</SelectItem>
                              <SelectItem value="study-abroad">
                                Study Abroad
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Level</Label>
                          <Select
                            value={editingCourse.level}
                            onValueChange={v =>
                              setEditingCourse({
                                ...editingCourse,
                                level: v as any,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">
                                Intermediate
                              </SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="all">All Levels</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Badge Text</Label>
                          <Input
                            value={editingCourse.badge}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                badge: e.target.value,
                              })
                            }
                            placeholder="Most Popular"
                          />
                        </div>
                        <div>
                          <Label>Badge Color</Label>
                          <Select
                            value={editingCourse.badgeColor}
                            onValueChange={v =>
                              setEditingCourse({
                                ...editingCourse,
                                badgeColor: v,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bg-red-500">Red</SelectItem>
                              <SelectItem value="bg-green-500">
                                Green
                              </SelectItem>
                              <SelectItem value="bg-blue-500">Blue</SelectItem>
                              <SelectItem value="bg-yellow-500">
                                Yellow
                              </SelectItem>
                              <SelectItem value="bg-purple-500">
                                Purple
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <Label>Course Features (one per line)</Label>
                        <Textarea
                          value={featuresText}
                          onChange={e => setFeaturesText(e.target.value)}
                          placeholder={
                            "1-on-1 Mentoring\nMock Tests\nStudy Materials"
                          }
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label>What Students Will Learn (one per line)</Label>
                        <Textarea
                          value={outcomesText}
                          onChange={e => setOutcomesText(e.target.value)}
                          placeholder={
                            "IELTS Exam strategies\nWriting Task 1 & 2"
                          }
                          rows={4}
                        />
                      </div>

                      {/* Schedule & Enrollment */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Schedule</Label>
                          <Input
                            value={editingCourse.schedule}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                schedule: e.target.value,
                              })
                            }
                            placeholder="7–9 PM, Saturday–Thursday"
                          />
                        </div>
                        <div>
                          <Label>Maximum Students</Label>
                          <Input
                            type="number"
                            value={editingCourse.maxStudents || ""}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                maxStudents: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              })
                            }
                            placeholder="20"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>WhatsApp Enrollment Message</Label>
                        <Input
                          value={editingCourse.enrollMessage}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              enrollMessage: e.target.value,
                            })
                          }
                          placeholder="I would like to enroll in [Course Name]"
                        />
                      </div>

                      {/* Sort & Toggles */}
                      <div className="grid grid-cols-3 gap-4 items-end">
                        <div>
                          <Label>Display Order</Label>
                          <Input
                            type="number"
                            value={editingCourse.sortOrder}
                            onChange={e =>
                              setEditingCourse({
                                ...editingCourse,
                                sortOrder: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editingCourse.isActive}
                            onCheckedChange={v =>
                              setEditingCourse({
                                ...editingCourse,
                                isActive: v,
                              })
                            }
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editingCourse.isFeatured}
                            onCheckedChange={v =>
                              setEditingCourse({
                                ...editingCourse,
                                isFeatured: v,
                              })
                            }
                          />
                          <Label>Featured</Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================== DETAIL TAB ==================== */}
                  {activeTab === "detail" && (
                    <div className="space-y-6">
                      {/* Video URL */}
                      <div>
                        <Label>video URL (YouTube)</Label>
                        <p className="text-xs text-gray-400 mb-1">
                          YouTube video URL — will be embedded on the course
                          detail page
                        </p>
                        <Input
                          value={editingCourse.videoUrl}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              videoUrl: e.target.value,
                            })
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {editingCourse.videoUrl && (
                          <p className="text-xs text-green-600 mt-1">
                            video added
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Full Course Description</Label>
                        <p className="text-xs text-gray-400 mb-1">
                          Shown on the course detail page
                        </p>
                        <Textarea
                          value={editingCourse.fullDescription}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              fullDescription: e.target.value,
                            })
                          }
                          placeholder="Enter the full course description..."
                          rows={6}
                        />
                      </div>

                      <div>
                        <Label>Target Audience</Label>
                        <Textarea
                          value={editingCourse.targetAudience}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              targetAudience: e.target.value,
                            })
                          }
                          placeholder="Students preparing for IELTS&#10;Students planning to study abroad"
                          rows={4}
                        />
                      </div>

                      {/* Curriculum Builder */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <Label>Course Curriculum / Syllabus</Label>
                            <p className="text-xs text-gray-400">Add modules</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addCurriculumModule}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Module
                          </Button>
                        </div>
                        {editingCourse.curriculum.length === 0 ? (
                          <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
                            <BookOpen className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">No modules added</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2"
                              onClick={addCurriculumModule}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add the First
                              Module
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {editingCourse.curriculum.map((module, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-6 h-6 rounded bg-brand-red/10 text-brand-red text-xs font-bold flex items-center justify-center shrink-0">
                                    {index + 1}
                                  </span>
                                  <Input
                                    value={module.title}
                                    onChange={e =>
                                      updateCurriculumModule(
                                        index,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Module ${index + 1} Title`}
                                    className="flex-1"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-600 shrink-0"
                                    onClick={() =>
                                      removeCurriculumModule(index)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Textarea
                                  value={module.content}
                                  onChange={e =>
                                    updateCurriculumModule(
                                      index,
                                      "content",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Describe what this module covers..."
                                  rows={3}
                                  className="ml-8"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== INSTRUCTOR TAB ==================== */}
                  {activeTab === "instructor" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 mb-4">
                        Instructor information appears on the course detail
                        page.
                      </div>
                      <div>
                        <Label>Instructor Name</Label>
                        <Input
                          value={editingCourse.instructorName}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              instructorName: e.target.value,
                            })
                          }
                          placeholder="MD Aditow Zahid"
                        />
                      </div>
                      <div>
                        <Label>Instructor Description (Bio)</Label>
                        <Textarea
                          value={editingCourse.instructorBio}
                          onChange={e =>
                            setEditingCourse({
                              ...editingCourse,
                              instructorBio: e.target.value,
                            })
                          }
                          placeholder="Experience, qualifications, achievements, etc...."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Instructor Image</Label>
                        <div className="mt-2">
                          <AdminImageUploader
                            value={editingCourse.instructorPhoto}
                            label="Instructor image"
                            recommendation="Square image, at least 512 × 512px"
                            uploading={uploadingInstructor}
                            onChange={e =>
                              handleImageUpload(e, "instructorPhoto")
                            }
                            onMediaSelect={url =>
                              setEditingCourse({
                                ...editingCourse,
                                instructorPhoto: url,
                              })
                            }
                            onRemove={() => {
                              setEditingCourse({
                                ...editingCourse,
                                instructorPhoto: "",
                              });
                              clearUploadState("instructorPhoto");
                            }}
                          />
                          {renderUploadStatus("instructorPhoto")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================== FAQ TAB ==================== */}
                  {activeTab === "faq" && (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-700 mb-4">
                        Add frequently asked questions about the course.
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addFaqItem}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add questions
                        </Button>
                      </div>
                      {editingCourse.courseFaq.length === 0 ? (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
                          <p className="text-sm">No FAQs added</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2"
                            onClick={addFaqItem}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add the First
                            Question
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editingCourse.courseFaq.map((faq, index) => (
                            <div
                              key={index}
                              className="border rounded-lg p-4 bg-gray-50"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-gray-500">
                                  Q{index + 1}.
                                </span>
                                <Input
                                  value={faq.question}
                                  onChange={e =>
                                    updateFaqItem(
                                      index,
                                      "question",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter a question..."
                                  className="flex-1"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-600 shrink-0"
                                  onClick={() => removeFaqItem(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <Textarea
                                value={faq.answer}
                                onChange={e =>
                                  updateFaqItem(index, "answer", e.target.value)
                                }
                                placeholder="Enter an answer..."
                                rows={3}
                                className="ml-6"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-0 flex justify-end gap-2 pt-6">
                    <Button
                      variant="outline"
                      onClick={() =>
                        createMode || editId
                          ? navigate("/admin/courses")
                          : setDialogOpen(false)
                      }
                      className="admin-button admin-button-secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={
                        !editingCourse.name ||
                        createMutation.isPending ||
                        updateMutation.isPending
                      }
                      className="admin-button admin-button-primary"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
