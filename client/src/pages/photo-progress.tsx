import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Calendar, User, Trash2, Edit, Plus, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { insertPhotoProgressSchema, type PhotoProgress, type InsertPhotoProgress } from "@shared/schema";
import type { UploadResult } from "@uppy/core";


const bodyPartOptions = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "side", label: "Side" },
  { value: "arms", label: "Arms" },
  { value: "legs", label: "Legs" },
  { value: "abs", label: "Abs" },
  { value: "chest", label: "Chest" },
  { value: "shoulders", label: "Shoulders" },
  { value: "face", label: "Face" },
];

export default function PhotoProgressPage() {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoProgress | null>(null);
  const { toast } = useToast();

  const { data: photoProgress = [], isLoading } = useQuery({
    queryKey: ["/api/photo-progress"],
  });

  const addForm = useForm<InsertPhotoProgress>({
    resolver: zodResolver(insertPhotoProgressSchema),
    defaultValues: {
      title: "",
      description: "",
      photoUrl: "",
      bodyPart: "",
      weight: undefined,
      takenAt: new Date(),
    },
  });

  const editForm = useForm<InsertPhotoProgress>({
    resolver: zodResolver(insertPhotoProgressSchema),
    defaultValues: {
      title: "",
      description: "",
      photoUrl: "",
      bodyPart: "",
      weight: undefined,
      takenAt: new Date(),
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertPhotoProgress) => {
      return apiRequest("POST", "/api/photo-progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photo-progress"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Success",
        description: "Photo progress entry added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add photo progress entry",
        variant: "destructive",
      });
      console.error("Add photo error:", error);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPhotoProgress> }) => {
      return apiRequest("PATCH", `/api/photo-progress/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photo-progress"] });
      setEditingPhoto(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Photo progress entry updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update photo progress entry",
        variant: "destructive",
      });
      console.error("Edit photo error:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/photo-progress/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photo-progress"] });
      toast({
        title: "Success",
        description: "Photo progress entry deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete photo progress entry",
        variant: "destructive",
      });
      console.error("Delete photo error:", error);
    },
  });

  const handlePhotoUpload = async (form: typeof addForm) => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json() as { uploadURL: string };
      const { uploadURL } = data;
      return { method: "PUT" as const, url: uploadURL };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, form: typeof addForm) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const photoURL = uploadedFile.uploadURL;

      try {
        // Set ACL policy for the photo
        await apiRequest("PUT", "/api/objects/set-acl", { photoURL });

        // Update form with the photo URL
        form.setValue("photoUrl", photoURL || "");
        
        toast({
          title: "Success",
          description: "Photo uploaded successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to set photo permissions",
          variant: "destructive",
        });
        console.error("Set ACL error:", error);
      }
    }
  };

  const photos = (photoProgress as PhotoProgress[]) || [];
  const filteredPhotos = selectedBodyPart === "all" 
    ? photos 
    : photos.filter((photo: PhotoProgress) => photo.bodyPart === selectedBodyPart);

  const startEdit = (photo: PhotoProgress) => {
    setEditingPhoto(photo);
    editForm.reset({
      title: photo.title,
      description: photo.description || "",
      photoUrl: photo.photoUrl,
      bodyPart: photo.bodyPart || "",
      weight: photo.weight || undefined,
      takenAt: new Date(photo.takenAt),
    });
  };

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading photo progress...</div>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
            <Camera className="w-10 h-10 text-blue-600" />
            Photo Progress Tracking
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your fitness journey with progress photos
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Label htmlFor="bodyPart" className="text-sm font-medium">Filter by body part:</Label>
            <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
              <SelectTrigger className="w-40" data-testid="select-body-part">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {bodyPartOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-photo">
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Progress Photo</DialogTitle>
                <DialogDescription>
                  Upload a new progress photo and add details
                </DialogDescription>
              </DialogHeader>

              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit((data) => {
                  if (!data.photoUrl) {
                    toast({
                      title: "Error",
                      description: "Please upload a photo before submitting",
                      variant: "destructive",
                    });
                    return;
                  }
                  addMutation.mutate(data);
                })} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Front progress - Week 12" 
                              {...field} 
                              data-testid="input-photo-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add notes about your progress, workout routine, etc." 
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-photo-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="bodyPart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Part</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger data-testid="select-photo-body-part">
                                <SelectValue placeholder="Select body part" />
                              </SelectTrigger>
                              <SelectContent>
                                {bodyPartOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (lbs) - Optional</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="165.5" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                data-testid="input-photo-weight"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="takenAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Taken</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local"
                                {...field}
                                value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                data-testid="input-photo-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <Label>Photo</Label>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760} // 10MB
                        onGetUploadParameters={() => handlePhotoUpload(addForm)}
                        onComplete={(result) => handleUploadComplete(result, addForm)}
                        buttonClassName="w-full"
                      >
                        <div className="flex items-center justify-center gap-2 py-8">
                          <ImageIcon className="w-6 h-6" />
                          <span>Upload Progress Photo</span>
                        </div>
                      </ObjectUploader>
                      {addForm.watch("photoUrl") && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ Photo uploaded successfully
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      data-testid="button-cancel-add"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addMutation.isPending || !addForm.watch("photoUrl")}
                      data-testid="button-save-photo"
                    >
                      {addMutation.isPending ? "Adding..." : "Add Photo"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((photo: PhotoProgress) => (
            <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={photo.photoUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  data-testid={`img-photo-${photo.id}`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEdit(photo)}
                      data-testid={`button-edit-${photo.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(photo.id)}
                      data-testid={`button-delete-${photo.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg" data-testid={`title-${photo.id}`}>
                  {photo.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(photo.takenAt), "MMM d, yyyy")}
                  </span>
                  {photo.weight && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {photo.weight} lbs
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              {(photo.description || photo.bodyPart) && (
                <CardContent className="pt-0">
                  {photo.bodyPart && (
                    <div className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {bodyPartOptions.find(opt => opt.value === photo.bodyPart)?.label || photo.bodyPart}
                    </div>
                  )}
                  {photo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`description-${photo.id}`}>
                      {photo.description}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-16">
            <Camera className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {selectedBodyPart === "all" ? "No progress photos yet" : `No ${bodyPartOptions.find(opt => opt.value === selectedBodyPart)?.label.toLowerCase()} photos yet`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start tracking your fitness journey with progress photos
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              data-testid="button-add-first-photo"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Photo
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        {editingPhoto && (
          <Dialog open={!!editingPhoto} onOpenChange={() => setEditingPhoto(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Progress Photo</DialogTitle>
                <DialogDescription>
                  Update photo details
                </DialogDescription>
              </DialogHeader>

              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit((data) => editMutation.mutate({ id: editingPhoto.id, data }))} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Front progress - Week 12" 
                              {...field} 
                              data-testid="input-edit-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add notes about your progress, workout routine, etc." 
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-edit-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="bodyPart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Part</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger data-testid="select-edit-body-part">
                                <SelectValue placeholder="Select body part" />
                              </SelectTrigger>
                              <SelectContent>
                                {bodyPartOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (lbs) - Optional</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="165.5" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                data-testid="input-edit-weight"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="takenAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Taken</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local"
                                {...field}
                                value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                data-testid="input-edit-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingPhoto(null)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={editMutation.isPending}
                      data-testid="button-save-edit"
                    >
                      {editMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      </div>
    </>
  );
}