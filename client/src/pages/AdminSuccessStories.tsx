import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Upload, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";

type StoryFormData = {
  studentName: string;
  imageUrl: string;
  thumbnailUrl: string;
  bandScore: string;
  courseName: string;
  testimonial: string;
  category: "ielts-score" | "visa-success" | "university-admission" | "spoken-english" | "other";
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

export default function AdminSuccessStories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [editingStory, setEditingStory] = useState<StoryFormData | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: stories, isLoading } = trpc.successStories.adminList.useQuery();
  const createMutation = trpc.successStories.create.useMutation({
    onSuccess: () => {
      utils.successStories.adminList.invalidate();
      toast.success("সাফল্যের গল্প তৈরি হয়েছে!");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.successStories.update.useMutation({
    onSuccess: () => {
      utils.successStories.adminList.invalidate();
      toast.success("আপডেট হয়েছে!");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.successStories.delete.useMutation({
    onSuccess: () => {
      utils.successStories.adminList.invalidate();
      toast.success("মুছে ফেলা হয়েছে!");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingStory) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
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
        toast.success("ছবি আপলোড হয়েছে!");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("ছবি আপলোড ব্যর্থ হয়েছে");
      setUploading(false);
    }
  };

  const openCreate = () => {
    setEditingStory({ ...emptyStory });
    setEditingId(null);
    setDialogOpen(true);
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

  const handleSave = () => {
    if (!editingStory) return;
    if (!editingStory.imageUrl) {
      toast.error("ছবি আপলোড করুন");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: editingStory });
    } else {
      createMutation.mutate(editingStory);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`"${name}" এর গল্পটি মুছে ফেলতে চান?`)) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">সাফল্যের গল্প ম্যানেজমেন্ট</h1>
              <p className="text-sm text-gray-500">{stories?.length || 0} টি গল্প</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red-dark text-white">
            <Plus className="h-4 w-4 mr-2" /> নতুন গল্প
          </Button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
          <Card className="text-center py-12">
            <CardContent>
              <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">এখনো কোনো সাফল্যের গল্প যোগ করা হয়নি</p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> প্রথম গল্প যোগ করুন
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {stories?.map((story) => (
              <Card key={story.id} className={`relative overflow-hidden group ${!story.isActive ? "opacity-60" : ""}`}>
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={story.imageUrl}
                    alt={story.studentName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {story.bandScore && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded">
                    Band {story.bandScore}
                  </span>
                )}
                {story.isFeatured && (
                  <Star className="absolute top-2 left-2 h-5 w-5 text-yellow-400 fill-yellow-400" />
                )}
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{story.studentName}</h3>
                  <p className="text-xs text-gray-500">{categoryLabels[story.category]}</p>
                  {story.courseName && <p className="text-xs text-brand-red mt-1">{story.courseName}</p>}
                  <div className="flex items-center gap-1 mt-2 border-t pt-2">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(story)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => updateMutation.mutate({ id: story.id, data: { isActive: !story.isActive } })}
                    >
                      {story.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 px-2 ${story.isFeatured ? "text-yellow-500" : ""}`}
                      onClick={() => updateMutation.mutate({ id: story.id, data: { isFeatured: !story.isFeatured } })}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-red-500 ml-auto"
                      onClick={() => handleDelete(story.id, story.studentName)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "গল্প সম্পাদনা" : "নতুন সাফল্যের গল্প"}</DialogTitle>
          </DialogHeader>
          {editingStory && (
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <Label>ছবি *</Label>
                <div className="mt-1">
                  {editingStory.imageUrl ? (
                    <div className="relative w-full aspect-[3/4] max-h-60 rounded overflow-hidden mb-2">
                      <img src={editingStory.imageUrl} alt="" className="w-full h-full object-cover" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => setEditingStory({ ...editingStory, imageUrl: "" })}
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
                      <p className="text-sm text-gray-500">ছবি আপলোড করুন (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {uploading && <p className="text-sm text-brand-red mt-1">আপলোড হচ্ছে...</p>}
                </div>
              </div>

              <div>
                <Label>শিক্ষার্থীর নাম *</Label>
                <Input
                  value={editingStory.studentName}
                  onChange={e => setEditingStory({ ...editingStory, studentName: e.target.value })}
                  placeholder="শিক্ষার্থীর নাম"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Band Score</Label>
                  <Input
                    value={editingStory.bandScore}
                    onChange={e => setEditingStory({ ...editingStory, bandScore: e.target.value })}
                    placeholder="7.5"
                  />
                </div>
                <div>
                  <Label>ক্যাটাগরি</Label>
                  <Select
                    value={editingStory.category}
                    onValueChange={(v) => setEditingStory({ ...editingStory, category: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ielts-score">IELTS Score</SelectItem>
                      <SelectItem value="visa-success">Visa Success</SelectItem>
                      <SelectItem value="university-admission">University Admission</SelectItem>
                      <SelectItem value="spoken-english">Spoken English</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>কোর্সের নাম</Label>
                <Input
                  value={editingStory.courseName}
                  onChange={e => setEditingStory({ ...editingStory, courseName: e.target.value })}
                  placeholder="IELTS VIP Batch"
                />
              </div>

              <div>
                <Label>শিক্ষার্থীর মন্তব্য</Label>
                <Textarea
                  value={editingStory.testimonial}
                  onChange={e => setEditingStory({ ...editingStory, testimonial: e.target.value })}
                  placeholder="শিক্ষার্থীর অভিজ্ঞতা..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>তারিখ</Label>
                  <Input
                    value={editingStory.achievementDate}
                    onChange={e => setEditingStory({ ...editingStory, achievementDate: e.target.value })}
                    placeholder="মার্চ ২০২৬"
                  />
                </div>
                <div>
                  <Label>ক্রম</Label>
                  <Input
                    type="number"
                    value={editingStory.sortOrder}
                    onChange={e => setEditingStory({ ...editingStory, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingStory.isActive}
                    onCheckedChange={v => setEditingStory({ ...editingStory, isActive: v })}
                  />
                  <Label>সক্রিয়</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingStory.isFeatured}
                    onCheckedChange={v => setEditingStory({ ...editingStory, isFeatured: v })}
                  />
                  <Label>ফিচার্ড</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
                <Button
                  onClick={handleSave}
                  disabled={!editingStory.studentName || !editingStory.imageUrl || createMutation.isPending || updateMutation.isPending}
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
