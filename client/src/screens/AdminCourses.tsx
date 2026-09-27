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
import { Plus, BookOpen, CheckCircle2, FileImage } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useLocation } from "@/lib/router";
import AdminImageUploader from "@/components/AdminImageUploader";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminInstructorPicker, {
  toCourseInstructor,
} from "@/components/AdminInstructorPicker";
import { useInstructors } from "@/hooks/useInstructors";

type CurriculumModule = { title: string; content: string };
type FaqItem = { question: string; answer: string };
/** Instructor photos are uploaded by AdminInstructorPicker, so only the course image goes through here. */
type UploadField = "imageUrl";
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

/** Sections of the Edit course page, in the order they appear in its left-hand menu. */
const COURSE_SECTIONS = [
  {
    id: "basics",
    title: "Basics",
    description: "Name, image and how the course is described on cards.",
  },
  {
    id: "pricing",
    title: "Pricing & enrollment",
    description: "Fees, timing and the seats shown on the course page.",
  },
  {
    id: "description",
    title: "Description",
    description: "The main text and video on the course page.",
  },
  {
    id: "included",
    title: "What's included",
    description: "Checklists shown on the course page and in the price box.",
  },
  {
    id: "curriculum",
    title: "Curriculum",
    description: "Modules shown as a numbered list on the course page.",
  },
  {
    id: "instructor",
    title: "Instructor",
    description: "The “Your mentor” card on the course page.",
  },
  {
    id: "faq",
    title: "FAQ",
    description: "Questions and answers at the bottom of the course page.",
  },
  {
    id: "visibility",
    title: "Visibility",
    description: "Whether the course is shown, its badge, order and link.",
  },
] as const;
type CourseSectionId = (typeof COURSE_SECTIONS)[number]["id"];

/** A labelled form field with an optional hint underneath the input. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-[#747d87]">{hint}</p>}
    </div>
  );
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
  const [uploadState, setUploadState] = useState<
    Record<UploadField, UploadState | null>
  >({
    imageUrl: null,
  });
  const [activeTab, setActiveTab] = useState<CourseSectionId>("basics");
  const [view, setView] = useState<AdminListView>("table");
  const currentSection =
    COURSE_SECTIONS.find(section => section.id === activeTab) ??
    COURSE_SECTIONS[0];
  const patchCourse = (patch: Partial<CourseFormData>) =>
    setEditingCourse(current => (current ? { ...current, ...patch } : current));

  // Pre-select the first saved instructor for a course that has none — once per opened course,
  // so choosing "No instructor" afterwards sticks.
  const { instructors, isLoading: instructorsLoading } = useInstructors();
  const preselectedFor = useRef<string | null>(null);
  const courseKey = editingCourse ? String(editingId ?? "new") : null;
  useEffect(() => {
    if (
      !courseKey ||
      !editingCourse ||
      instructorsLoading ||
      preselectedFor.current === courseKey
    )
      return;
    preselectedFor.current = courseKey;
    if (!editingCourse.instructorName && instructors.length)
      patchCourse(toCourseInstructor(instructors[0]));
  }, [courseKey, editingCourse, instructorsLoading, instructors]); // eslint-disable-line react-hooks/exhaustive-deps

  const utils = trpc.useUtils();
  const { data: courses, isLoading } = trpc.courses.adminList.useQuery();
  const createMutation = trpc.courses.create.useMutation({
    onSuccess: async ({ id }) => {
      await utils.courses.adminList.invalidate();
      toast.success("Course created. Add the remaining details below.");
      // Continue on the full editor so curriculum, instructor and FAQ can be filled in.
      navigate(`/admin/courses/${id}/edit`);
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
    const setLoading = setUploading;
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
    setUploadState({ imageUrl: null });
    setActiveTab("basics");
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
            title={editingId ? "Edit Course" : "Add Course"}
            description=""
            parent={{ label: "Courses", href: "/admin/courses" }}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent page showCloseButton={false}>
              {editingCourse && (
                <div>
                  {editingId ? (
                    <div className="grid gap-10 md:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
                      <nav
                        className="space-y-1 md:sticky md:top-8 md:self-start"
                        aria-label="Course sections"
                      >
                        {COURSE_SECTIONS.map(section => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveTab(section.id)}
                            aria-current={
                              activeTab === section.id ? "page" : undefined
                            }
                            className={`flex h-9 w-full items-center text-left text-sm transition-colors ${activeTab === section.id ? "text-[#c76f42]" : "text-[#6c7580] hover:text-[#30363d]"}`}
                          >
                            {section.title}
                          </button>
                        ))}
                      </nav>
                      <section className="min-w-0">
                        <h2 className="font-display text-xl font-bold text-[#30363d]">
                          {currentSection.title}
                        </h2>
                        <p className="mb-8 mt-1 text-sm text-[#747d87]">
                          {currentSection.description}
                        </p>

                        {activeTab === "basics" && (
                          <div className="space-y-6">
                            <Field
                              label="Course image"
                              hint="Landscape, 16:9. Shown on course cards and the course page."
                            >
                              <AdminImageUploader
                                value={editingCourse.imageUrl}
                                label="Course image"
                                recommendation="Landscape, 16:9 ratio"
                                uploading={uploading}
                                onChange={e => handleImageUpload(e, "imageUrl")}
                                onMediaSelect={url =>
                                  patchCourse({ imageUrl: url })
                                }
                                onRemove={() => {
                                  patchCourse({ imageUrl: "" });
                                  clearUploadState("imageUrl");
                                }}
                              />
                              {renderUploadStatus("imageUrl")}
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field
                                label="Course name *"
                                hint="Used in the admin and the old website."
                              >
                                <Input
                                  value={editingCourse.name}
                                  onChange={e =>
                                    patchCourse({ name: e.target.value })
                                  }
                                  placeholder="IELTS Complete Preparation"
                                />
                              </Field>
                              <Field
                                label="Name shown on website"
                                hint="Optional. Leave blank to use the course name."
                              >
                                <Input
                                  value={editingCourse.nameEn}
                                  onChange={e =>
                                    patchCourse({ nameEn: e.target.value })
                                  }
                                  placeholder={
                                    editingCourse.name ||
                                    "IELTS Complete Preparation"
                                  }
                                />
                              </Field>
                            </div>
                            <Field
                              label="Short description"
                              hint="One line under the course name on cards and at the top of the course page."
                            >
                              <Input
                                value={editingCourse.shortDescription}
                                onChange={e =>
                                  patchCourse({
                                    shortDescription: e.target.value,
                                  })
                                }
                                placeholder="Describe the course in one line"
                              />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="Category">
                                <Select
                                  value={editingCourse.category}
                                  onValueChange={v =>
                                    patchCourse({
                                      category: v as CourseFormData["category"],
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ielts">IELTS</SelectItem>
                                    <SelectItem value="spoken">
                                      Spoken English
                                    </SelectItem>
                                    <SelectItem value="grammar">
                                      Grammar
                                    </SelectItem>
                                    <SelectItem value="study-abroad">
                                      Study Abroad
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </Field>
                              <Field label="Level">
                                <Select
                                  value={editingCourse.level}
                                  onValueChange={v =>
                                    patchCourse({
                                      level: v as CourseFormData["level"],
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="beginner">
                                      Beginner
                                    </SelectItem>
                                    <SelectItem value="intermediate">
                                      Intermediate
                                    </SelectItem>
                                    <SelectItem value="advanced">
                                      Advanced
                                    </SelectItem>
                                    <SelectItem value="all">
                                      All Levels
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </Field>
                            </div>
                          </div>
                        )}

                        {activeTab === "pricing" && (
                          <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                              <Field label="Price">
                                <Input
                                  value={editingCourse.price}
                                  onChange={e =>
                                    patchCourse({ price: e.target.value })
                                  }
                                  placeholder="৳8,500"
                                />
                              </Field>
                              <Field
                                label="Original price"
                                hint="Shown crossed out."
                              >
                                <Input
                                  value={editingCourse.originalPrice}
                                  onChange={e =>
                                    patchCourse({
                                      originalPrice: e.target.value,
                                    })
                                  }
                                  placeholder="৳12,000"
                                />
                              </Field>
                              <Field label="Duration">
                                <Input
                                  value={editingCourse.duration}
                                  onChange={e =>
                                    patchCourse({ duration: e.target.value })
                                  }
                                  placeholder="2 months"
                                />
                              </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="Schedule">
                                <Input
                                  value={editingCourse.schedule}
                                  onChange={e =>
                                    patchCourse({ schedule: e.target.value })
                                  }
                                  placeholder="7–9 PM, Saturday–Thursday"
                                />
                              </Field>
                              <Field
                                label="Maximum students"
                                hint="Used to show seats left."
                              >
                                <Input
                                  type="number"
                                  value={editingCourse.maxStudents || ""}
                                  onChange={e =>
                                    patchCourse({
                                      maxStudents: e.target.value
                                        ? parseInt(e.target.value)
                                        : null,
                                    })
                                  }
                                  placeholder="20"
                                />
                              </Field>
                            </div>
                            <Field
                              label="WhatsApp enrollment message"
                              hint="Pre-filled when a visitor taps “Ask on WhatsApp”."
                            >
                              <Input
                                value={editingCourse.enrollMessage}
                                onChange={e =>
                                  patchCourse({ enrollMessage: e.target.value })
                                }
                                placeholder={`I would like to learn more about the "${editingCourse.nameEn || editingCourse.name || "course"}" course.`}
                              />
                            </Field>
                          </div>
                        )}

                        {activeTab === "description" && (
                          <div className="space-y-6">
                            <Field
                              label="Full description"
                              hint="The “About this course” text on the course page."
                            >
                              <Textarea
                                value={editingCourse.fullDescription}
                                onChange={e =>
                                  patchCourse({
                                    fullDescription: e.target.value,
                                  })
                                }
                                placeholder="Describe the course in detail…"
                                rows={8}
                              />
                            </Field>
                            <Field
                              label="Summary"
                              hint="Short version used by the old website, and on the course page when there is no full description."
                            >
                              <Textarea
                                value={editingCourse.description}
                                onChange={e =>
                                  patchCourse({ description: e.target.value })
                                }
                                placeholder="Course summary…"
                                rows={3}
                              />
                            </Field>
                            <Field label="Who this course is for">
                              <Textarea
                                value={editingCourse.targetAudience}
                                onChange={e =>
                                  patchCourse({
                                    targetAudience: e.target.value,
                                  })
                                }
                                placeholder={
                                  "Students preparing for IELTS\nStudents planning to study abroad"
                                }
                                rows={4}
                              />
                            </Field>
                            <Field
                              label="Intro video (YouTube URL)"
                              hint="Shown at the top of the course page instead of the image."
                            >
                              <Input
                                value={editingCourse.videoUrl}
                                onChange={e =>
                                  patchCourse({ videoUrl: e.target.value })
                                }
                                placeholder="https://www.youtube.com/watch?v=…"
                              />
                            </Field>
                          </div>
                        )}

                        {activeTab === "included" && (
                          <div className="space-y-6">
                            <Field
                              label="What students will learn"
                              hint="One per line. Shown as a checklist on the course page."
                            >
                              <Textarea
                                value={outcomesText}
                                onChange={e => setOutcomesText(e.target.value)}
                                placeholder={
                                  "IELTS exam strategies\nWriting Task 1 & 2"
                                }
                                rows={6}
                              />
                            </Field>
                            <Field
                              label="Course features"
                              hint="One per line. Shown with a tick in the price box."
                            >
                              <Textarea
                                value={featuresText}
                                onChange={e => setFeaturesText(e.target.value)}
                                placeholder={
                                  "1-on-1 mentoring\nMock tests\nStudy materials"
                                }
                                rows={6}
                              />
                            </Field>
                          </div>
                        )}

                        {activeTab === "curriculum" && (
                          <div className="space-y-3">
                            {editingCourse.curriculum.length === 0 && (
                              <p className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6 text-center text-sm text-[#747d87]">
                                No modules yet.
                              </p>
                            )}
                            {editingCourse.curriculum.map((module, index) => (
                              <div
                                key={index}
                                className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-xs font-medium uppercase text-[#747d87]">
                                    Module {index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeCurriculumModule(index)
                                    }
                                    className="text-sm text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <Input
                                    value={module.title}
                                    onChange={e =>
                                      updateCurriculumModule(
                                        index,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Module title"
                                  />
                                  <Textarea
                                    value={module.content}
                                    onChange={e =>
                                      updateCurriculumModule(
                                        index,
                                        "content",
                                        e.target.value
                                      )
                                    }
                                    placeholder="What this module covers…"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addCurriculumModule}
                              className="flex h-11 w-full items-center justify-center gap-2 border border-dashed border-[#d9d9d9] text-sm text-[#6c7580] hover:border-[#c76f42] hover:text-[#c76f42]"
                            >
                              <Plus className="h-4 w-4" /> Add module
                            </button>
                          </div>
                        )}

                        {activeTab === "instructor" && (
                          <AdminInstructorPicker
                            value={{
                              instructorName: editingCourse.instructorName,
                              instructorPhoto: editingCourse.instructorPhoto,
                              instructorBio: editingCourse.instructorBio,
                            }}
                            onChange={patchCourse}
                          />
                        )}

                        {activeTab === "faq" && (
                          <div className="space-y-3">
                            {editingCourse.courseFaq.length === 0 && (
                              <p className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6 text-center text-sm text-[#747d87]">
                                No questions yet.
                              </p>
                            )}
                            {editingCourse.courseFaq.map((faq, index) => (
                              <div
                                key={index}
                                className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-xs font-medium uppercase text-[#747d87]">
                                    Question {index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFaqItem(index)}
                                    className="text-sm text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <Input
                                    value={faq.question}
                                    onChange={e =>
                                      updateFaqItem(
                                        index,
                                        "question",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Question"
                                  />
                                  <Textarea
                                    value={faq.answer}
                                    onChange={e =>
                                      updateFaqItem(
                                        index,
                                        "answer",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Answer"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addFaqItem}
                              className="flex h-11 w-full items-center justify-center gap-2 border border-dashed border-[#d9d9d9] text-sm text-[#6c7580] hover:border-[#c76f42] hover:text-[#c76f42]"
                            >
                              <Plus className="h-4 w-4" /> Add question
                            </button>
                          </div>
                        )}

                        {activeTab === "visibility" && (
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] px-4 py-3">
                                <span>
                                  <span className="block text-sm font-medium text-[#30363d]">
                                    Active
                                  </span>
                                  <span className="block text-xs text-[#747d87]">
                                    Show this course on the website.
                                  </span>
                                </span>
                                <Switch
                                  checked={editingCourse.isActive}
                                  onCheckedChange={v =>
                                    patchCourse({ isActive: v })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] px-4 py-3">
                                <span>
                                  <span className="block text-sm font-medium text-[#30363d]">
                                    Featured
                                  </span>
                                  <span className="block text-xs text-[#747d87]">
                                    Highlight this course on the old website's
                                    home page.
                                  </span>
                                </span>
                                <Switch
                                  checked={editingCourse.isFeatured}
                                  onCheckedChange={v =>
                                    patchCourse({ isFeatured: v })
                                  }
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field
                                label="Badge"
                                hint="Small label on the course page, e.g. “Most popular”."
                              >
                                <Input
                                  value={editingCourse.badge}
                                  onChange={e =>
                                    patchCourse({ badge: e.target.value })
                                  }
                                  placeholder="Most Popular"
                                />
                              </Field>
                              <Field
                                label="Badge colour"
                                hint="Used by the old website."
                              >
                                <Select
                                  value={editingCourse.badgeColor}
                                  onValueChange={v =>
                                    patchCourse({ badgeColor: v })
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bg-red-500">
                                      Red
                                    </SelectItem>
                                    <SelectItem value="bg-green-500">
                                      Green
                                    </SelectItem>
                                    <SelectItem value="bg-blue-500">
                                      Blue
                                    </SelectItem>
                                    <SelectItem value="bg-yellow-500">
                                      Yellow
                                    </SelectItem>
                                    <SelectItem value="bg-purple-500">
                                      Purple
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field
                                label="Display order"
                                hint="Lower numbers appear first."
                              >
                                <Input
                                  type="number"
                                  value={editingCourse.sortOrder}
                                  onChange={e =>
                                    patchCourse({
                                      sortOrder: parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </Field>
                              <Field
                                label="URL slug"
                                hint="The end of the course page link. Created from the name if left blank."
                              >
                                <Input
                                  value={editingCourse.slug}
                                  onChange={e =>
                                    patchCourse({ slug: e.target.value })
                                  }
                                  placeholder="ielts-complete-preparation"
                                />
                              </Field>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  ) : (
                    /* Quick add: just the essentials. Everything else is filled in on the full editor after creating. */
                    <div className="space-y-5">
                      <p className="text-sm text-gray-500">
                        Start with the basics. After you create the course you
                        can add the curriculum, instructor, FAQ and other
                        details.
                      </p>
                      <div>
                        <Label>Course image</Label>
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
                      <div>
                        <Label>Course name *</Label>
                        <Input
                          autoFocus
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
                        <Label>Short description</Label>
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
                      <div className="grid gap-4 sm:grid-cols-2">
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
                            <SelectTrigger className="w-full">
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
                            <SelectTrigger className="w-full">
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
                      <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-0 flex gap-2 pt-8">
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
                        : editingId
                          ? "Save"
                          : "Create course"}
                    </Button>
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
