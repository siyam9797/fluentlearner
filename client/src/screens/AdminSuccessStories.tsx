import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Star, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useLocation } from "@/lib/router";
import AdminImageUploader from "@/components/AdminImageUploader";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import AdminActionsMenu from "@/components/AdminActionsMenu";

type StoryFormData = {
  studentName: string;
  imageUrl: string;
  thumbnailUrl: string;
  bandScore: string;
  courseName: string;
  testimonial: string;
  category:
    | "ielts-score"
    | "visa-success"
    | "university-admission"
    | "spoken-english"
    | "other";
  achievementDate: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
};

const emptyStory: StoryFormData = {
  studentName: "",
  imageUrl: "",
  thumbnailUrl: "",
  bandScore: "",
  courseName: "",
  testimonial: "",
  category: "ielts-score",
  achievementDate: "",
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
};

export default function AdminSuccessStories({
  createMode = false,
  editId,
}: {
  createMode?: boolean;
  editId?: number;
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [editingStory, setEditingStory] = useState<StoryFormData | null>(
    createMode ? { ...emptyStory } : null
  );
  const [editingId, setEditingId] = useState<number | null>(editId ?? null);
  const [dialogOpen, setDialogOpen] = useState(createMode || Boolean(editId));
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<AdminListView>("table");

  const utils = trpc.useUtils();
  const { data: stories, isLoading } = trpc.successStories.adminList.useQuery();
  const createMutation = trpc.successStories.create.useMutation({
    onSuccess: () => {
      utils.successStories.adminList.invalidate();
      toast.success("Success story created!");
      setDialogOpen(false);
      navigate("/admin/success-stories");
    },
    onError: err => toast.error(err.message),
  });
  const updateMutation = trpc.successStories.update.useMutation({
    onSuccess: () => {
      utils.successStories.adminList.invalidate();
      toast.success("Updated successfully!");
      setDialogOpen(false);
      navigate("/admin/success-stories");
    },
    onError: err => toast.error(err.message),
  });
  const deleteMutation = trpc.successStories.delete.useMutation({
    onSuccess: () => {
      utils.successStories.adminList.invalidate();
      toast.success("Deleted successfully!");
    },
    onError: err => toast.error(err.message),
  });
  const uploadMutation = trpc.upload.image.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingStory) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
        });
        setEditingStory({ ...editingStory, imageUrl: result.url });
        toast.success("Image uploaded!");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Image upload failed");
      setUploading(false);
    }
  };

  const openCreate = () => {
    navigate("/admin/success-stories/new");
  };

  const openEdit = (story: any) => {
    setEditingStory({
      studentName: story.studentName || "",
      imageUrl: story.imageUrl || "",
      thumbnailUrl: story.thumbnailUrl || "",
      bandScore: story.bandScore || "",
      courseName: story.courseName || "",
      testimonial: story.testimonial || "",
      category: story.category || "ielts-score",
      achievementDate: story.achievementDate || "",
      sortOrder: story.sortOrder || 0,
      isActive: story.isActive ?? true,
      isFeatured: story.isFeatured ?? false,
    });
    setEditingId(story.id);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!editId || !stories?.length) return;
    const story = stories.find(item => item.id === editId);
    if (story) openEdit(story);
  }, [editId, stories]);

  if (!canAccessAdminDashboard(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const handleSave = () => {
    if (!editingStory) return;
    if (!editingStory.imageUrl) {
      toast.error("Upload an image");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: editingStory });
    } else {
      createMutation.mutate(editingStory);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`"${name}" Delete this story?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const categoryLabels: Record<string, string> = {
    "ielts-score": "IELTS Score",
    "visa-success": "Visa Success",
    "university-admission": "University Admission",
    "spoken-english": "Spoken English",
    other: "Other",
  };

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <div className={dialogOpen ? "hidden" : ""}>
        <AdminPageHeader
          title="Success Stories"
          description={`${stories?.length || 0} published student stories.`}
          action={
            <div className="flex items-center gap-2">
              <AdminViewToggle
                view={view}
                onChange={setView}
                label="Success stories"
              />
              <button onClick={openCreate} className="admin-primary-button">
                <Plus className="h-4 w-4" />
                New story
              </button>
            </div>
          }
        />
        {isLoading ? (
          <div className="admin-view-grid">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-48 bg-gray-200 rounded mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stories?.length === 0 ? (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              No success stories have been added yet
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="admin-view-grid">
            {stories?.map(story => (
              <Card
                key={story.id}
                className={`admin-list-card group ${!story.isActive ? "opacity-60" : ""}`}
              >
                <div className="absolute right-3 top-3 z-20">
                  <AdminActionsMenu label={`Actions for ${story.studentName}`}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/success-stories/${story.id}/edit`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({
                          id: story.id,
                          data: { isActive: !story.isActive },
                        })
                      }
                    >
                      {story.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({
                          id: story.id,
                          data: { isFeatured: !story.isFeatured },
                        })
                      }
                    >
                      {story.isFeatured ? "Remove featured" : "Make featured"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(story.id, story.studentName)}
                    >
                      Delete
                    </button>
                  </AdminActionsMenu>
                </div>
                <div className="admin-list-card-image aspect-square">
                  <img
                    src={story.imageUrl}
                    alt={story.studentName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span
                  className={`admin-status-label absolute left-3 top-3 z-10 ${story.isActive ? "" : "inactive"}`}
                >
                  {story.isActive ? "Published" : "Hidden"}
                </span>
                {story.isFeatured && (
                  <Star className="absolute top-2 left-2 h-5 w-5 text-yellow-400 fill-yellow-400" />
                )}
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {story.studentName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {categoryLabels[story.category]}
                  </p>
                  {story.courseName && (
                    <p className="text-xs text-brand-red mt-1">
                      {story.courseName}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Band</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stories?.map(story => (
                  <tr
                    key={story.id}
                    className={`border-b border-gray-100 last:border-0 ${!story.isActive ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-[190px] items-center gap-3">
                        <img
                          src={story.imageUrl}
                          alt=""
                          className="h-12 w-10 object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {story.studentName}
                          </p>
                          {story.achievementDate && (
                            <p className="text-xs text-gray-500">
                              {story.achievementDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {story.bandScore || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {categoryLabels[story.category]}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {story.courseName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`admin-status-label ${story.isActive ? "" : "inactive"}`}
                      >
                        {story.isActive ? "Published" : "Hidden"}
                      </span>
                      {story.isFeatured && (
                        <span className="ml-2 text-xs text-amber-600">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminActionsMenu
                        label={`Actions for ${story.studentName}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/success-stories/${story.id}/edit`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateMutation.mutate({
                              id: story.id,
                              data: { isActive: !story.isActive },
                            })
                          }
                        >
                          {story.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateMutation.mutate({
                              id: story.id,
                              data: { isFeatured: !story.isFeatured },
                            })
                          }
                        >
                          {story.isFeatured
                            ? "Remove featured"
                            : "Make featured"}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            handleDelete(story.id, story.studentName)
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
        )}
      </div>

      {/* Create/Edit page */}
      {dialogOpen && (
        <>
          <AdminPageHeader
            title={editingId ? "Edit Story" : "New Success Story"}
            description=""
            parent={{
              label: "Success Stories",
              href: "/admin/success-stories",
            }}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent page showCloseButton={false} className="max-w-3xl">
              {editingStory && (
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <Label>Image *</Label>
                    <div className="mt-2">
                      <AdminImageUploader
                        value={editingStory.imageUrl}
                        label="Student image"
                        recommendation="Portrait, 3:4 ratio"
                        uploading={uploading}
                        onChange={handleImageUpload}
                        onMediaSelect={url =>
                          setEditingStory({ ...editingStory, imageUrl: url })
                        }
                        onRemove={() =>
                          setEditingStory({ ...editingStory, imageUrl: "" })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Student Name *</Label>
                    <Input
                      value={editingStory.studentName}
                      onChange={e =>
                        setEditingStory({
                          ...editingStory,
                          studentName: e.target.value,
                        })
                      }
                      placeholder="Student Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Band Score</Label>
                      <Input
                        value={editingStory.bandScore}
                        onChange={e =>
                          setEditingStory({
                            ...editingStory,
                            bandScore: e.target.value,
                          })
                        }
                        placeholder="7.5"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={editingStory.category}
                        onValueChange={v =>
                          setEditingStory({
                            ...editingStory,
                            category: v as any,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ielts-score">
                            IELTS Score
                          </SelectItem>
                          <SelectItem value="visa-success">
                            Visa Success
                          </SelectItem>
                          <SelectItem value="university-admission">
                            University Admission
                          </SelectItem>
                          <SelectItem value="spoken-english">
                            Spoken English
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Course Name</Label>
                    <Input
                      value={editingStory.courseName}
                      onChange={e =>
                        setEditingStory({
                          ...editingStory,
                          courseName: e.target.value,
                        })
                      }
                      placeholder="IELTS VIP Batch"
                    />
                  </div>

                  <div>
                    <Label>Student Testimonial</Label>
                    <Textarea
                      value={editingStory.testimonial}
                      onChange={e =>
                        setEditingStory({
                          ...editingStory,
                          testimonial: e.target.value,
                        })
                      }
                      placeholder="Share the student experience..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input
                        value={editingStory.achievementDate}
                        onChange={e =>
                          setEditingStory({
                            ...editingStory,
                            achievementDate: e.target.value,
                          })
                        }
                        placeholder="March 2026"
                      />
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={editingStory.sortOrder}
                        onChange={e =>
                          setEditingStory({
                            ...editingStory,
                            sortOrder: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingStory.isActive}
                        onCheckedChange={v =>
                          setEditingStory({ ...editingStory, isActive: v })
                        }
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingStory.isFeatured}
                        onCheckedChange={v =>
                          setEditingStory({ ...editingStory, isFeatured: v })
                        }
                      />
                      <Label>Featured</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-8">
                    <Button
                      onClick={handleSave}
                      disabled={
                        !editingStory.studentName ||
                        !editingStory.imageUrl ||
                        createMutation.isPending ||
                        updateMutation.isPending
                      }
                      className="admin-button admin-button-primary"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        createMode || editId
                          ? navigate("/admin/success-stories")
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
