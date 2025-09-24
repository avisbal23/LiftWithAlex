import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Upload, FileSpreadsheet, Download } from "lucide-react";
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // CSV Import functionality
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase()] = values[index] || '';
      });
      return row;
    });
    
    return rows;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportResults(null);
      
      const text = await file.text();
      const csvData = parseCSV(text);
      
      if (csvData.length === 0) {
        toast({
          title: "Empty file",
          description: "The CSV file appears to be empty or invalid",
          variant: "destructive",
        });
        return;
      }

      // Validate and transform CSV data to supplement format
      const supplements: InsertSupplement[] = [];
      const errors: string[] = [];

      csvData.forEach((row, index) => {
        try {
          if (!row.name || row.name.trim() === '') {
            errors.push(`Row ${index + 2}: Name is required`);
            return;
          }

          const supplement: InsertSupplement = {
            name: row.name.trim(),
            imageUrl: row.imageurl || row.image_url || row.imageUrl || null,
            personalNotes: row.personalnotes || row.personal_notes || row.personalNotes || row.notes || null,
            referenceUrl: row.referenceurl || row.reference_url || row.referenceUrl || row.url || null,
            urlPreview: null, // Will be fetched if referenceUrl exists
          };

          supplements.push(supplement);
        } catch (error) {
          errors.push(`Row ${index + 2}: Invalid data format`);
        }
      });

      if (supplements.length === 0) {
        toast({
          title: "No valid data",
          description: "No valid supplement data found in the CSV file",
          variant: "destructive",
        });
        setImportResults({ success: 0, errors });
        return;
      }

      // Bulk import supplements
      const response = await apiRequest("POST", "/api/supplements/bulk", supplements);
      const result = await response.json();

      setImportResults({ success: result.imported || supplements.length, errors });
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.imported || supplements.length} supplements`,
      });

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: "Failed to import CSV file. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'imageUrl', 'personalNotes', 'referenceUrl'],
      ['Vitamin D3', 'https://example.com/vitamin-d3.jpg', '4000 IU daily with breakfast', 'https://www.youtube.com/watch?v=example'],
      ['Creatine Monohydrate', '', '5g post-workout', 'https://examine.com/supplements/creatine/'],
      ['Omega-3 Fish Oil', '', '2 capsules with dinner', '']
    ];
    
    const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supplements_sample.csv';
    link.click();
    window.URL.revokeObjectURL(url);
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
        
        <div className="flex gap-2">
          {/* CSV Import Button */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-csv">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Import Supplements from CSV</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Upload a CSV file with supplement data. Required column: <code>name</code>. 
                  Optional columns: <code>imageUrl</code>, <code>personalNotes</code>, <code>referenceUrl</code>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCSV}
                    data-testid="button-download-sample"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="input-csv-file"
                  />
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Click to select a CSV file or drag and drop
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    data-testid="button-select-csv"
                  >
                    {isImporting ? "Importing..." : "Select File"}
                  </Button>
                </div>

                {importResults && (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600 dark:text-green-400">
                      ✓ Successfully imported {importResults.success} supplements
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm text-red-600 dark:text-red-400">
                          Errors encountered:
                        </div>
                        <div className="text-xs text-red-500 dark:text-red-400 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, index) => (
                            <div key={index}>• {error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Add Supplement Button */}
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
              // Debug logging to help identify issues
              if (parsedUrlPreview?.isYouTube) {
                console.log('YouTube supplement found:', {
                  name: supplement.name,
                  urlPreview: parsedUrlPreview,
                  embedUrl: parsedUrlPreview.embedUrl
                });
              }
            } catch (error) {
              console.error('Failed to parse URL preview for supplement:', supplement.name, error);
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