import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertPhotoProgress } from "@shared/schema";

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

interface MobilePhotoUploaderProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MobilePhotoUploader({ onSuccess, onCancel }: MobilePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bodyPart: "",
    weight: "",
    takenAt: new Date().toISOString().slice(0, 16), // Current date in datetime-local format
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10485760) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadAndSave = async () => {
    if (!selectedFile) {
      toast({
        title: "No photo selected",
        description: "Please select a photo to upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your photo",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bodyPart) {
      toast({
        title: "Body part required",
        description: "Please select a body part",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get upload URL
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const uploadData = await uploadResponse.json() as { uploadURL: string };
      
      // Step 2: Upload file directly to object storage
      const uploadResult = await fetch(uploadData.uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Upload failed');
      }

      // Step 3: Set ACL permissions
      await apiRequest("PUT", "/api/objects/set-acl", { photoURL: uploadData.uploadURL });

      // Step 4: Save photo progress entry
      const photoData: InsertPhotoProgress = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        photoUrl: uploadData.uploadURL,
        bodyPart: formData.bodyPart,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        takenAt: new Date(formData.takenAt),
      };

      await apiRequest("POST", "/api/photo-progress", photoData);

      toast({
        title: "Success!",
        description: "Your progress photo has been uploaded and saved",
      });

      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Progress Photo</Label>
        
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Take or select a progress photo
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto"
              data-testid="button-select-photo"
            >
              <Camera className="w-4 h-4 mr-2" />
              Select Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-photo-file"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={previewUrl!}
                alt="Preview"
                className="w-full max-w-sm mx-auto rounded-lg border"
                data-testid="img-photo-preview"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={removeSelectedFile}
                data-testid="button-remove-photo"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              <Check className="w-4 h-4 inline mr-1" />
              Photo selected: {selectedFile.name}
            </p>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Front progress - Week 12"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            data-testid="input-mobile-title"
          />
        </div>

        <div>
          <Label htmlFor="bodyPart">Body Part *</Label>
          <Select value={formData.bodyPart} onValueChange={(value) => setFormData({ ...formData, bodyPart: value })}>
            <SelectTrigger data-testid="select-mobile-body-part">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="165.5"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              data-testid="input-mobile-weight"
            />
          </div>

          <div>
            <Label htmlFor="takenAt">Date Taken</Label>
            <Input
              id="takenAt"
              type="datetime-local"
              value={formData.takenAt}
              onChange={(e) => setFormData({ ...formData, takenAt: e.target.value })}
              data-testid="input-mobile-date"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Notes (optional)</Label>
          <Textarea
            id="description"
            placeholder="Add notes about your progress, workout routine, etc."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            data-testid="textarea-mobile-description"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
          className="w-full sm:w-auto"
          data-testid="button-cancel-mobile"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUploadAndSave}
          disabled={isUploading || !selectedFile}
          className="w-full sm:flex-1"
          data-testid="button-upload-save-mobile"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading & Saving...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Save Photo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}