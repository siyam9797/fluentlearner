import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, Upload, ArrowLeft,
  X, ExternalLink, BookOpen, CheckCircle2, FileImage,
} from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";

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

function readFileAsBase64(file: File, onProgress?: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 60));
    };

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("ছবি পড়তে সমস্যা হয়েছে"));
        return;
      }

      const base64 = reader.result.split(",")[1];
      if (!base64) {
        reject(new Error("ছবি পড়তে সমস্যা হয়েছে"));
        return;
      }

      onProgress?.(60);
      resolve(base64);
    };

    reader.onerror = () => reject(new Error("ছবি পড়তে সমস্যা হয়েছে"));
    reader.readAsDataURL(file);
  });
}

export default function AdminCourses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [editingCourse, setEditingCourse] = useState<CourseFormData | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [featuresText, setFeaturesText] = useState("");
  const [outcomesText, setOutcomesText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingInstructor, setUploadingInstructor] = useState(false);
  const [uploadState, setUploadState] = useState<Record<UploadField, UploadState | null>>({
    imageUrl: null,
    instructorPhoto: null,
  });
  const [activeTab, setActiveTab] = useState<"basic" | "detail" | "instructor" | "faq">("basic");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instructorFileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: courses, isLoading } = trpc.courses.adminList.useQuery();
  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      utils.courses.adminList.invalidate();
      toast.success("কোর্স সফলভাবে তৈরি হয়েছে!");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      utils.courses.adminList.invalidate();
      toast.success("কোর্স আপডেট হয়েছে!");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      utils.courses.adminList.invalidate();
      toast.success("কোর্স মুছে ফেলা হয়েছে!");
    },
    onError: (err) => toast.error(err.message),
  });
  const uploadMutation = trpc.upload.image.useMutation();

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const updateUploadState = (field: UploadField, changes: Partial<UploadState>) => {
    setUploadState((prev) => ({
      ...prev,
      [field]: prev[field] ? { ...prev[field], ...changes } : null,
    }));
  };

  const clearUploadState = (field: UploadField) => {
    setUploadState((prev) => ({ ...prev, [field]: null }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: UploadField) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !editingCourse) return;
    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ছবি ফাইল আপলোড করুন");
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
      input.value = "";
      return;
    }
    const setLoading = field === "imageUrl" ? setUploading : setUploadingInstructor;
    setLoading(true);
    setUploadState((prev) => ({
      ...prev,
      [field]: {
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: "reading",
      },
    }));
    try {
      const base64 = await readFileAsBase64(file, (progress) => {
        updateUploadState(field, { progress, status: "reading" });
      });
      updateUploadState(field, { progress: 70, status: "uploading" });
      const result = await uploadMutation.mutateAsync({
        base64,
        filename: file.name,
        contentType: file.type,
      });
      setEditingCourse((prev) => prev ? { ...prev, [field]: result.url } : prev);
      updateUploadState(field, { progress: 100, status: "done", url: result.url });
      toast.success("ছবি আপলোড হয়েছে!");
    } catch (err) {
      updateUploadState(field, { progress: 0, status: "error" });
      toast.error(err instanceof Error ? err.message : "ছবি আপলোড ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
      input.value = "";
    }
  };

  const openCreate = () => {
    setEditingCourse({ ...emptyCourse });
    setEditingId(null);
    setFeaturesText("");
    setOutcomesText("");
    setUploadState({ imageUrl: null, instructorPhoto: null });
    setActiveTab("basic");
    setDialogOpen(true);
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

  const renderUploadStatus = (field: UploadField) => {
    const state = uploadState[field];
    if (!state) return null;

    const isActive = state?.status === "reading" || state?.status === "uploading";
    const isDone = state?.status === "done";
    const isError = state?.status === "error";

    return (
      <div className={`mt-2 rounded-lg border p-3 text-sm ${
        isError ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
      }`}>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              {isDone ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <FileImage className={`mt-0.5 h-4 w-4 shrink-0 ${isError ? "text-red-600" : "text-brand-red"}`} />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">{state.fileName}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(state.fileSize)} · {
                    state.status === "reading"
                      ? "ফাইল প্রস্তুত হচ্ছে"
                      : state.status === "uploading"
                        ? "সার্ভারে আপলোড হচ্ছে"
                        : state.status === "done"
                          ? "আপলোড সম্পন্ন"
                          : "আপলোড ব্যর্থ"
                  }
                </p>
              </div>
            </div>
            {isActive && (
              <span className={`text-xs font-semibold ${isError ? "text-red-600" : "text-gray-500"}`}>
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
    if (!slug && editingCourse.nameEn) slug = generateSlug(editingCourse.nameEn);
    else if (!slug && editingCourse.name) slug = generateSlug(editingCourse.name);

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
    if (confirm(`"${name}" কোর্সটি মুছে ফেলতে চান?`)) {
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
  const updateCurriculumModule = (index: number, field: "title" | "content", value: string) => {
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
  const updateFaqItem = (index: number, field: "question" | "answer", value: string) => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">কোর্স ম্যানেজমেন্ট</h1>
              <p className="text-sm text-gray-500">{courses?.length || 0} টি কোর্স</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red-dark text-white">
            <Plus className="h-4 w-4 mr-2" /> নতুন কোর্স
          </Button>
        </div>
      </div>

      {/* Course List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">এখনো কোনো কোর্স তৈরি করা হয়নি</p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> প্রথম কোর্স তৈরি করুন
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses?.map((course) => (
              <Card key={course.id} className={`relative overflow-hidden ${!course.isActive ? "opacity-60" : ""}`}>
                {course.imageUrl && (
                  <div className="h-40 overflow-hidden">
                    <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                  </div>
                )}
                {course.badge && (
                  <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded ${course.badgeColor || "bg-red-500"}`}>
                    {course.badge}
                  </span>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{course.name}</h3>
                      {course.nameEn && <p className="text-xs text-gray-500">{course.nameEn}</p>}
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">{categoryLabels[course.category]}</span>
                  </div>
                  {course.shortDescription && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    {course.price && <span className="font-bold text-brand-red">{course.price}</span>}
                    {course.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">{course.originalPrice}</span>
                    )}
                    {course.duration && (
                      <span className="text-xs text-gray-500 ml-auto">{course.duration}</span>
                    )}
                  </div>
                  {course.slug && (
                    <p className="text-xs text-gray-400 mb-2 truncate">/courses/{course.slug}</p>
                  )}
                  <div className="flex items-center gap-2 border-t pt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(course)}>
                      <Pencil className="h-3 w-3 mr-1" /> সম্পাদনা
                    </Button>
                    {course.slug && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/courses/${course.slug}`, "_blank")}
                        title="প্রিভিউ দেখুন"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(course.id, course.isActive ?? true)}>
                      {course.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFeatured(course.id, course.isFeatured ?? false)}
                      className={course.isFeatured ? "text-yellow-500" : ""}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 ml-auto"
                      onClick={() => handleDelete(course.id, course.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "কোর্স সম্পাদনা" : "নতুন কোর্স তৈরি"}</DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <div>
              {/* Tab Navigation */}
              <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
                {([
                  { key: "basic" as const, label: "মূল তথ্য" },
                  { key: "detail" as const, label: "বিস্তারিত ও কারিকুলাম" },
                  { key: "instructor" as const, label: "ইন্সট্রাক্টর" },
                  { key: "faq" as const, label: "FAQ" },
                ]).map((tab) => (
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
                    <Label>কোর্স ছবি</Label>
                    <p className="text-xs text-gray-400 mb-1">কোর্সের কভার ছবি আপলোড করুন (Max 5MB)</p>
                    <div className="mt-1">
                      {editingCourse.imageUrl ? (
                        <div className="relative w-full h-40 rounded overflow-hidden mb-2">
                          <img src={editingCourse.imageUrl} alt="" className="w-full h-full object-cover" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setEditingCourse({ ...editingCourse, imageUrl: "" });
                              clearUploadState("imageUrl");
                            }}
                          >
                            মুছুন
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-brand-red transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">ক্লিক করে ছবি আপলোড করুন</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "imageUrl")}
                      />
                      {uploading && <p className="text-sm text-brand-red mt-1">আপলোড হচ্ছে...</p>}
                      {renderUploadStatus("imageUrl")}
                    </div>
                  </div>

                  {/* Names */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>কোর্সের নাম (বাংলা) *</Label>
                      <Input
                        value={editingCourse.name}
                        onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })}
                        placeholder="IELTS সম্পূর্ণ প্রস্তুতি"
                      />
                    </div>
                    <div>
                      <Label>কোর্সের নাম (English)</Label>
                      <Input
                        value={editingCourse.nameEn}
                        onChange={e => {
                          const nameEn = e.target.value;
                          const slug = editingCourse.slug ? editingCourse.slug : generateSlug(nameEn);
                          setEditingCourse({ ...editingCourse, nameEn, slug });
                        }}
                        placeholder="IELTS Complete Preparation"
                      />
                    </div>
                  </div>

                  {/* Slug */}
                  <div>
                    <Label>URL Slug</Label>
                    <p className="text-xs text-gray-400 mb-1">কোর্সের পেজ লিংক — ইংরেজি নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হয়</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 whitespace-nowrap">/courses/</span>
                      <Input
                        value={editingCourse.slug}
                        onChange={e => setEditingCourse({ ...editingCourse, slug: e.target.value })}
                        placeholder="ielts-complete-preparation"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>সংক্ষিপ্ত বিবরণ</Label>
                    <Input
                      value={editingCourse.shortDescription}
                      onChange={e => setEditingCourse({ ...editingCourse, shortDescription: e.target.value })}
                      placeholder="এক লাইনে কোর্সের বিবরণ"
                    />
                  </div>

                  <div>
                    <Label>বিবরণ (কার্ড ও ফলব্যাক)</Label>
                    <Textarea
                      value={editingCourse.description}
                      onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                      placeholder="কোর্সের সংক্ষিপ্ত বিবরণ..."
                      rows={3}
                    />
                  </div>

                  {/* Pricing & Duration */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>মূল্য</Label>
                      <Input
                        value={editingCourse.price}
                        onChange={e => setEditingCourse({ ...editingCourse, price: e.target.value })}
                        placeholder="৳8,500"
                      />
                    </div>
                    <div>
                      <Label>আগের মূল্য</Label>
                      <Input
                        value={editingCourse.originalPrice}
                        onChange={e => setEditingCourse({ ...editingCourse, originalPrice: e.target.value })}
                        placeholder="৳12,000"
                      />
                    </div>
                    <div>
                      <Label>সময়কাল</Label>
                      <Input
                        value={editingCourse.duration}
                        onChange={e => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                        placeholder="2 মাস"
                      />
                    </div>
                  </div>

                  {/* Category & Level */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ক্যাটাগরি</Label>
                      <Select
                        value={editingCourse.category}
                        onValueChange={(v) => setEditingCourse({ ...editingCourse, category: v as any })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ielts">IELTS</SelectItem>
                          <SelectItem value="spoken">Spoken English</SelectItem>
                          <SelectItem value="grammar">Grammar</SelectItem>
                          <SelectItem value="study-abroad">Study Abroad</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>লেভেল</Label>
                      <Select
                        value={editingCourse.level}
                        onValueChange={(v) => setEditingCourse({ ...editingCourse, level: v as any })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="all">All Levels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ব্যাজ টেক্সট</Label>
                      <Input
                        value={editingCourse.badge}
                        onChange={e => setEditingCourse({ ...editingCourse, badge: e.target.value })}
                        placeholder="Most Popular"
                      />
                    </div>
                    <div>
                      <Label>ব্যাজ রঙ</Label>
                      <Select
                        value={editingCourse.badgeColor}
                        onValueChange={(v) => setEditingCourse({ ...editingCourse, badgeColor: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-red-500">লাল</SelectItem>
                          <SelectItem value="bg-green-500">সবুজ</SelectItem>
                          <SelectItem value="bg-blue-500">নীল</SelectItem>
                          <SelectItem value="bg-yellow-500">হলুদ</SelectItem>
                          <SelectItem value="bg-purple-500">বেগুনি</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <Label>কোর্সের বৈশিষ্ট্য (প্রতি লাইনে একটি)</Label>
                    <Textarea
                      value={featuresText}
                      onChange={e => setFeaturesText(e.target.value)}
                      placeholder={"1-on-1 মেন্টরশিপ\nমক টেস্ট\nস্টাডি ম্যাটেরিয়াল"}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>শিক্ষার্থী কী শিখবে (প্রতি লাইনে একটি)</Label>
                    <Textarea
                      value={outcomesText}
                      onChange={e => setOutcomesText(e.target.value)}
                      placeholder={"IELTS পরীক্ষার কৌশল\nWriting Task 1 & 2"}
                      rows={4}
                    />
                  </div>

                  {/* Schedule & Enrollment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>সময়সূচী</Label>
                      <Input
                        value={editingCourse.schedule}
                        onChange={e => setEditingCourse({ ...editingCourse, schedule: e.target.value })}
                        placeholder="সন্ধ্যা ৭-৯টা, শনি-বৃহ"
                      />
                    </div>
                    <div>
                      <Label>সর্বোচ্চ শিক্ষার্থী</Label>
                      <Input
                        type="number"
                        value={editingCourse.maxStudents || ""}
                        onChange={e => setEditingCourse({ ...editingCourse, maxStudents: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>WhatsApp এনরোলমেন্ট মেসেজ</Label>
                    <Input
                      value={editingCourse.enrollMessage}
                      onChange={e => setEditingCourse({ ...editingCourse, enrollMessage: e.target.value })}
                      placeholder="আমি [কোর্সের নাম] কোর্সে ভর্তি হতে চাই"
                    />
                  </div>

                  {/* Sort & Toggles */}
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                      <Label>ক্রম</Label>
                      <Input
                        type="number"
                        value={editingCourse.sortOrder}
                        onChange={e => setEditingCourse({ ...editingCourse, sortOrder: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingCourse.isActive}
                        onCheckedChange={v => setEditingCourse({ ...editingCourse, isActive: v })}
                      />
                      <Label>সক্রিয়</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingCourse.isFeatured}
                        onCheckedChange={v => setEditingCourse({ ...editingCourse, isFeatured: v })}
                      />
                      <Label>ফিচার্ড</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== DETAIL TAB ==================== */}
              {activeTab === "detail" && (
                <div className="space-y-6">
                  {/* Video URL */}
                  <div>
                    <Label>ভিডিও URL (YouTube)</Label>
                    <p className="text-xs text-gray-400 mb-1">YouTube ভিডিও লিংক দিন — কোর্স ডিটেইল পেজে embed হবে</p>
                    <Input
                      value={editingCourse.videoUrl}
                      onChange={e => setEditingCourse({ ...editingCourse, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {editingCourse.videoUrl && (
                      <p className="text-xs text-green-600 mt-1">ভিডিও যোগ করা হয়েছে</p>
                    )}
                  </div>

                  <div>
                    <Label>বিস্তারিত বিবরণ (Full Description)</Label>
                    <p className="text-xs text-gray-400 mb-1">কোর্স ডিটেইল পেজে দেখানো হবে</p>
                    <Textarea
                      value={editingCourse.fullDescription}
                      onChange={e => setEditingCourse({ ...editingCourse, fullDescription: e.target.value })}
                      placeholder="কোর্সের সম্পূর্ণ বিবরণ এখানে লিখুন..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label>এই কোর্স কাদের জন্য? (Target Audience)</Label>
                    <Textarea
                      value={editingCourse.targetAudience}
                      onChange={e => setEditingCourse({ ...editingCourse, targetAudience: e.target.value })}
                      placeholder="যারা IELTS পরীক্ষা দিতে চান&#10;যারা বিদেশে পড়তে যেতে চান"
                      rows={4}
                    />
                  </div>

                  {/* Curriculum Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label>কোর্স কারিকুলাম / সিলেবাস</Label>
                        <p className="text-xs text-gray-400">মডিউল যোগ করুন</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={addCurriculumModule}>
                        <Plus className="h-3 w-3 mr-1" /> মডিউল যোগ
                      </Button>
                    </div>
                    {editingCourse.curriculum.length === 0 ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
                        <BookOpen className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">কোনো মডিউল যোগ করা হয়নি</p>
                        <Button size="sm" variant="ghost" className="mt-2" onClick={addCurriculumModule}>
                          <Plus className="h-3 w-3 mr-1" /> প্রথম মডিউল যোগ করুন
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editingCourse.curriculum.map((module, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded bg-brand-red/10 text-brand-red text-xs font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <Input
                                value={module.title}
                                onChange={e => updateCurriculumModule(index, "title", e.target.value)}
                                placeholder={`মডিউল ${index + 1} শিরোনাম`}
                                className="flex-1"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-400 hover:text-red-600 shrink-0"
                                onClick={() => removeCurriculumModule(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Textarea
                              value={module.content}
                              onChange={e => updateCurriculumModule(index, "content", e.target.value)}
                              placeholder="এই মডিউলে কী কী শেখানো হবে..."
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
                    ইন্সট্রাক্টরের তথ্য কোর্স ডিটেইল পেজে প্রদর্শিত হবে।
                  </div>
                  <div>
                    <Label>ইন্সট্রাক্টরের নাম</Label>
                    <Input
                      value={editingCourse.instructorName}
                      onChange={e => setEditingCourse({ ...editingCourse, instructorName: e.target.value })}
                      placeholder="MD Aditow Zahid"
                    />
                  </div>
                  <div>
                    <Label>ইন্সট্রাক্টরের বিবরণ (Bio)</Label>
                    <Textarea
                      value={editingCourse.instructorBio}
                      onChange={e => setEditingCourse({ ...editingCourse, instructorBio: e.target.value })}
                      placeholder="অভিজ্ঞতা, যোগ্যতা, সাফল্য ইত্যাদি..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>ইন্সট্রাক্টরের ছবি</Label>
                    <div className="mt-1">
                      {editingCourse.instructorPhoto ? (
                        <div className="flex items-center gap-4">
                          <img src={editingCourse.instructorPhoto} alt="Instructor" className="w-20 h-20 rounded-xl object-cover" />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setEditingCourse({ ...editingCourse, instructorPhoto: "" });
                              clearUploadState("instructorPhoto");
                            }}
                          >
                            মুছুন
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-brand-red transition-colors"
                          onClick={() => instructorFileRef.current?.click()}
                        >
                          <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                          <p className="text-sm text-gray-500">ছবি আপলোড করুন</p>
                        </div>
                      )}
                      <input
                        ref={instructorFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "instructorPhoto")}
                      />
                      {uploadingInstructor && <p className="text-sm text-brand-red mt-1">আপলোড হচ্ছে...</p>}
                      {renderUploadStatus("instructorPhoto")}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== FAQ TAB ==================== */}
              {activeTab === "faq" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-700 mb-4">
                    কোর্স সম্পর্কে শিক্ষার্থীদের সচরাচর জিজ্ঞাসা (FAQ) যোগ করুন।
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={addFaqItem}>
                      <Plus className="h-3 w-3 mr-1" /> প্রশ্ন যোগ করুন
                    </Button>
                  </div>
                  {editingCourse.courseFaq.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
                      <p className="text-sm">কোনো FAQ যোগ করা হয়নি</p>
                      <Button size="sm" variant="ghost" className="mt-2" onClick={addFaqItem}>
                        <Plus className="h-3 w-3 mr-1" /> প্রথম প্রশ্ন যোগ করুন
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editingCourse.courseFaq.map((faq, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-gray-500">Q{index + 1}.</span>
                            <Input
                              value={faq.question}
                              onChange={e => updateFaqItem(index, "question", e.target.value)}
                              placeholder="প্রশ্ন লিখুন..."
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
                            onChange={e => updateFaqItem(index, "answer", e.target.value)}
                            placeholder="উত্তর লিখুন..."
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
              <div className="flex justify-end gap-2 pt-6 mt-6 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
                <Button
                  onClick={handleSave}
                  disabled={!editingCourse.name || createMutation.isPending || updateMutation.isPending}
                  className="bg-brand-red hover:bg-brand-red-dark text-white"
                >
                  {createMutation.isPending || updateMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
