import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X, Check, Loader2, Zap, Image } from "lucide-react";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bodyPart: "",
    weight: "",
    fileType: "image" as "image" | "video",
    takenAt: new Date().toISOString().slice(0, 16), // Current date in datetime-local format
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Image compression function
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50485760) { // 50MB absolute limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image or video file",
          variant: "destructive",
        });
        return;
      }

      // Detect file type and set in form data
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      setFormData(prev => ({ ...prev, fileType }));

      // Compress image if it's large (skip compression for videos)
      let processedFile = file;
      if (fileType === 'image' && file.size > 2097152) { // 2MB - compress larger images
        setUploadStep("Optimizing image...");
        setUploadProgress(10);
        try {
          processedFile = await compressImage(file);
          setUploadProgress(20);
          setUploadStep("");
        } catch (error) {
          console.warn("Image compression failed, using original:", error);
          processedFile = file;
        }
      } else if (fileType === 'video') {
        setUploadStep("Preparing video...");
        setUploadProgress(10);
        // For videos, we'll use the original file without compression for now
        processedFile = file;
        setUploadProgress(20);
        setUploadStep("");
      }

      setSelectedFile(processedFile);
      const url = URL.createObjectURL(processedFile);
      setPreviewUrl(url);
      setUploadProgress(0);

      // Show compression savings if file was compressed
      if (processedFile.size < file.size) {
        const savings = ((file.size - processedFile.size) / file.size * 100).toFixed(0);
        toast({
          title: "Image optimized",
          description: `File size reduced by ${savings}% for faster upload`,
        });
      } else if (fileType === 'video') {
        toast({
          title: "Video ready",
          description: "Video selected and ready to upload",
        });
      }
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
    setUploadProgress(0);
    setUploadStep("Getting upload URL...");

    try {
      // Step 1: Get upload URL
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const uploadData = await uploadResponse.json() as { uploadURL: string };
      setUploadProgress(25);
      setUploadStep("Uploading image...");
      
      // Step 2: Upload file directly to object storage
      const uploadResult = await fetch(uploadData.uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error(`Upload failed with status: ${uploadResult.status}`);
      }

      setUploadProgress(70);
      setUploadStep("Setting permissions...");
      
      // Step 3: Set ACL permissions and get proper object path
      const aclResponse = await apiRequest("PUT", "/api/objects/set-acl", { photoURL: uploadData.uploadURL });
      const aclData = await aclResponse.json() as { objectPath: string };
      
      setUploadProgress(90);
      setUploadStep("Saving photo details...");

      // Step 4: Save photo progress entry with proper display path
      const photoData: InsertPhotoProgress = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        photoUrl: aclData.objectPath, // Use the proper object path for display
        fileType: formData.fileType,
        bodyPart: formData.bodyPart,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        takenAt: new Date(formData.takenAt),
      };

      await apiRequest("POST", "/api/photo-progress", photoData);
      
      setUploadProgress(100);
      setUploadStep("Complete!");

      toast({
        title: "Success!",
        description: `Your progress ${formData.fileType === 'video' ? 'video' : 'photo'} has been uploaded and saved`,
      });

      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Upload failed",
        description: `Error: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStep("");
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
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Progress Photo</Label>
        
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6">
              <Camera className="w-12 h-12 text-gray-400 mb-2 sm:mb-0 sm:mr-4" />
              <Image className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Take a new photo or select an existing one
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full sm:w-auto"
                data-testid="button-take-photo"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="button-select-photo"
              >
                <Image className="w-4 h-4 mr-2" />
                Select from Gallery
              </Button>
            </div>
            {/* Camera input - opens camera directly */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-camera-file"
            />
            {/* Gallery input - opens file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-gallery-file"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {formData.fileType === 'video' ? (
                <video
                  src={previewUrl!}
                  controls
                  className="w-full max-w-sm mx-auto rounded-lg border"
                  data-testid="video-preview"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full max-w-sm mx-auto rounded-lg border"
                  data-testid="img-photo-preview"
                />
              )}
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
              {formData.fileType === 'video' ? 'Video' : 'Photo'} selected: {selectedFile.name}
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
        <div className="space-y-3">
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{uploadStep}</span>
                <span className="text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          <Button
            onClick={handleUploadAndSave}
            disabled={isUploading || !selectedFile}
            className="w-full sm:flex-1"
            data-testid="button-upload-save-mobile"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadStep || "Processing..."}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Upload & Save Photo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}