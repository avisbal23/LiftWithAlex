import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { FlippableCard } from "@/components/FlippableCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Supplement, insertSupplementSchema, type InsertSupplement } from "@shared/schema";
import { z } from "zod";

// Form schema for supplement creation/editing
const supplementFormSchema = insertSupplementSchema.omit({ urlPreview: true }).extend({
  // Add frontend validation for required fields
  name: z.string().min(1, "Supplement name is required"),
});

type SupplementFormData = z.infer<typeof supplementFormSchema>;

interface URLPreview {
  title: string;
  description: string;
  siteName: string;
  previewImage: string;
  type: string;
  url: string;
  error?: string;
  isYouTube?: boolean;
  embedUrl?: string;
  videoId?: string;
}

export default function SupplementsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Form setup
  const form = useForm<SupplementFormData>({
    resolver: zodResolver(supplementFormSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
      personalNotes: "",
      referenceUrl: "",
    },
  });

  // Fetch supplements
  const { data: supplements = [], isLoading } = useQuery<Supplement[]>({
    queryKey: ["/api/supplements"],
  });

  // Create supplement mutation
  const createSupplementMutation = useMutation({
    mutationFn: async (data: InsertSupplement) => {
      const response = await apiRequest("POST", "/api/supplements", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      toast({
        title: "Success",
        description: "Supplement added successfully",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add supplement",
        variant: "destructive",
      });
    },
  });

  // Update supplement mutation
  const updateSupplementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSupplement> }) => {
      const response = await apiRequest("PATCH", `/api/supplements/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      toast({
        title: "Success",
        description: "Supplement updated successfully",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update supplement",
        variant: "destructive",
      });
    },
  });

  // Delete supplement mutation
  const deleteSupplementMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/supplements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      toast({
        title: "Success",
        description: "Supplement deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete supplement",
        variant: "destructive",
      });
    },
  });

  // Fetch URL metadata
  const fetchUrlPreview = async (url: string): Promise<URLPreview | null> => {
    if (!url || !url.trim()) return null;
    
    try {
      setIsLoadingPreview(true);
      const response = await apiRequest("POST", "/api/url-metadata", { url: url.trim() });
      return response.json() as Promise<URLPreview>;
    } catch (error) {
      console.error("Failed to fetch URL preview:", error);
      return null;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: SupplementFormData) => {
    try {
      let urlPreview: URLPreview | null = null;
      
      // Fetch URL preview if reference URL is provided
      if (data.referenceUrl) {
        urlPreview = await fetchUrlPreview(data.referenceUrl);
      }

      const supplementData: InsertSupplement = {
        name: data.name,
        imageUrl: data.imageUrl?.trim() || null,
        personalNotes: data.personalNotes?.trim() || null,
        referenceUrl: data.referenceUrl?.trim() || null,
        urlPreview: urlPreview ? JSON.stringify(urlPreview) : null,
      };

      if (editingSupplement) {
        updateSupplementMutation.mutate({ 
          id: editingSupplement.id, 
          data: supplementData 
        });
      } else {
        createSupplementMutation.mutate(supplementData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process supplement data",
        variant: "destructive",
      });
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplement(null);
    form.reset();
  };

  // Handle edit
  const handleEdit = (id: string) => {
    const supplement = supplements.find(s => s.id === id);
    if (supplement) {
      setEditingSupplement(supplement);
      form.reset({
        name: supplement.name,
        imageUrl: supplement.imageUrl || "",
        personalNotes: supplement.personalNotes || "",
        referenceUrl: supplement.referenceUrl || "",
      });
      setIsDialogOpen(true);
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this supplement?")) {
      deleteSupplementMutation.mutate(id);
    }
  };

  // Filter supplements based on search term
  const filteredSupplements = supplements.filter(supplement =>
    supplement.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="heading-supplements">
            Supplements Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your supplements with images and reference links
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-supplement">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSupplement ? "Edit Supplement" : "Add New Supplement"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplement Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Vitamin D3, Creatine"
                          {...field}
                          data-testid="input-supplement-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/supplement-image.jpg"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-image-url"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            data-testid="button-upload-image"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dosage, timing, effects, etc."
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-personal-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/supplement-info"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-reference-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSupplementMutation.isPending || updateSupplementMutation.isPending || isLoadingPreview}
                    data-testid="button-save-supplement"
                  >
                    {createSupplementMutation.isPending || updateSupplementMutation.isPending || isLoadingPreview
                      ? "Saving..."
                      : editingSupplement
                      ? "Update Supplement"
                      : "Add Supplement"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search supplements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-supplements"
        />
      </div>

      {/* Supplements Grid */}
      {filteredSupplements.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">💊</div>
            <CardTitle className="mb-2">No supplements found</CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm
                ? "No supplements match your search criteria."
                : "Start tracking your supplements by adding your first entry."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-supplement">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Supplement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSupplements.map((supplement) => {
            let parsedUrlPreview: URLPreview | undefined;
            try {
              parsedUrlPreview = supplement.urlPreview ? JSON.parse(supplement.urlPreview) : undefined;
            } catch {
              parsedUrlPreview = undefined;
            }
            
            return (
              <FlippableCard
                key={supplement.id}
                id={supplement.id}
                name={supplement.name}
                imageUrl={supplement.imageUrl || undefined}
                personalNotes={supplement.personalNotes || undefined}
                referenceUrl={supplement.referenceUrl || undefined}
                urlPreview={parsedUrlPreview}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}