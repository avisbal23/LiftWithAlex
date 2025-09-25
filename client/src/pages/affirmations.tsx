import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Download, Plus, Trash2, Search, Heart, Star, RotateCcw, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Affirmation, InsertAffirmation } from "@shared/schema";

export default function AffirmationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [newAffirmationText, setNewAffirmationText] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all affirmations
  const { data: affirmations = [], isLoading } = useQuery<Affirmation[]>({
    queryKey: ["/api/affirmations"],
  });

  // Fetch active affirmations
  const { data: activeAffirmations = [] } = useQuery<Affirmation[]>({
    queryKey: ["/api/affirmations/active"],
  });

  // Create affirmation mutation
  const createAffirmationMutation = useMutation({
    mutationFn: (data: InsertAffirmation) => apiRequest("POST", "/api/affirmations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
      setNewAffirmationText("");
      toast({ title: "Affirmation added successfully!" });
    },
  });

  // Update affirmation mutation
  const updateAffirmationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAffirmation> }) =>
      apiRequest("PATCH", `/api/affirmations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
    },
  });

  // Delete affirmation mutation
  const deleteAffirmationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/affirmations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
      toast({ title: "Affirmation deleted successfully!" });
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: (affirmationsData: InsertAffirmation[]) =>
      apiRequest("POST", "/api/affirmations/bulk", affirmationsData),
    onSuccess: (result: { imported: number; total: number; errors?: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      setImportResults({ success: result.imported, errors: result.errors || [] });
      toast({
        title: `Successfully imported ${result.imported} affirmations!`,
        description: result.errors?.length ? `${result.errors.length} items had errors.` : undefined,
      });
    },
    onError: () => {
      toast({ title: "Import failed", description: "Please check your data format.", variant: "destructive" });
    },
  });

  // Random selection mutation
  const randomSelectMutation = useMutation({
    mutationFn: async () => {
      if (affirmations.length < 10) {
        throw new Error("Need at least 10 affirmations to randomly select");
      }

      // First deactivate all current active affirmations
      const deactivatePromises = activeAffirmations.map(affirmation =>
        apiRequest("PATCH", `/api/affirmations/${affirmation.id}`, { isActive: "false" })
      );
      await Promise.all(deactivatePromises);

      // Randomly select 10 affirmations
      const shuffled = [...affirmations].sort(() => Math.random() - 0.5);
      const selectedAffirmations = shuffled.slice(0, 10);

      // Activate the selected affirmations
      const activatePromises = selectedAffirmations.map(affirmation =>
        apiRequest("PATCH", `/api/affirmations/${affirmation.id}`, { isActive: "true" })
      );
      await Promise.all(activatePromises);

      return selectedAffirmations.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
      toast({
        title: "Random selection complete!",
        description: `Selected ${count} affirmations randomly.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Random selection failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddAffirmation = () => {
    if (!newAffirmationText.trim()) return;
    
    createAffirmationMutation.mutate({
      text: newAffirmationText.trim(),
      isActive: "false",
    });
  };

  const handleToggleActive = (affirmation: Affirmation) => {
    const isCurrentlyActive = affirmation.isActive === "true";
    
    // Check if trying to activate and already at limit
    if (!isCurrentlyActive && activeAffirmations.length >= 10) {
      toast({
        title: "Maximum affirmations reached",
        description: "You can only have 10 active affirmations at once. Deactivate one first.",
        variant: "destructive",
      });
      return;
    }

    updateAffirmationMutation.mutate({
      id: affirmation.id,
      data: { isActive: isCurrentlyActive ? "false" : "true" },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this affirmation?")) {
      deleteAffirmationMutation.mutate(id);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    // Parse the text file - one affirmation per line
    const lines = importText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const affirmationsData: InsertAffirmation[] = lines.map(line => ({
      text: line,
      isActive: "false",
    }));

    bulkImportMutation.mutate(affirmationsData);
    setImportText("");
  };

  const handleRandomSelect = () => {
    if (affirmations.length < 10) {
      toast({
        title: "Not enough affirmations",
        description: "You need at least 10 affirmations to use random selection.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("This will replace your current active affirmations with 10 randomly selected ones. Continue?")) {
      randomSelectMutation.mutate();
    }
  };

  const handleExport = () => {
    const exportData = affirmations.map(a => a.text).join('\n');
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affirmations.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredAffirmations = affirmations.filter(affirmation =>
    affirmation.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading affirmations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affirmations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Positive affirmations to boost your mindset and confidence
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-affirmations">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Import Affirmations</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-text">Paste affirmations (one per line)</Label>
                  <Textarea
                    id="import-text"
                    placeholder="I am confident and capable.&#10;I deserve success and happiness.&#10;I am worthy of love and respect."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="min-h-[200px]"
                    data-testid="textarea-import-affirmations"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={!importText.trim() || bulkImportMutation.isPending}
                    data-testid="button-confirm-import"
                  >
                    {bulkImportMutation.isPending ? "Importing..." : "Import Affirmations"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                    data-testid="button-cancel-import"
                  >
                    Cancel
                  </Button>
                </div>

                {importResults && (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600 dark:text-green-400">
                      ✓ Successfully imported {importResults.success} affirmations
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

          <Button variant="outline" onClick={handleExport} data-testid="button-export-affirmations">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Affirmations Cards */}
      {activeAffirmations.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Affirmations</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomSelect}
                disabled={affirmations.length < 10 || randomSelectMutation.isPending}
                data-testid="button-random-select"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                {randomSelectMutation.isPending ? "Selecting..." : "Random 10"}
              </Button>
              <Badge variant="secondary" data-testid="badge-active-count">
                {activeAffirmations.length}/10 active
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeAffirmations.map((affirmation) => (
              <Card key={affirmation.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500" data-testid={`card-active-affirmation-${affirmation.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Heart className="h-5 w-5 text-green-500 fill-current" />
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-gray-900 dark:text-gray-100">
                      {affirmation.text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        affirmations.length >= 10 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Affirmations</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRandomSelect}
                  disabled={affirmations.length < 10 || randomSelectMutation.isPending}
                  data-testid="button-random-select-empty"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {randomSelectMutation.isPending ? "Selecting..." : "Random 10"}
                </Button>
                <Badge variant="secondary" data-testid="badge-active-count-empty">
                  0/10 active
                </Badge>
              </div>
            </div>
            <Card className="text-center py-8">
              <CardContent>
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No active affirmations selected. Choose your favorites manually or use random selection.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null
      )}

      {/* Add New Affirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Affirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Enter your positive affirmation..."
              value={newAffirmationText}
              onChange={(e) => setNewAffirmationText(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-new-affirmation"
            />
            <Button
              onClick={handleAddAffirmation}
              disabled={!newAffirmationText.trim() || createAffirmationMutation.isPending}
              data-testid="button-add-affirmation"
            >
              {createAffirmationMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affirmations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Affirmations ({affirmations.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search affirmations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-affirmations"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAffirmations.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? "No affirmations match your search." : "No affirmations yet. Add your first one above!"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Active</TableHead>
                  <TableHead>Affirmation</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffirmations.map((affirmation) => (
                  <TableRow key={affirmation.id} data-testid={`row-affirmation-${affirmation.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={affirmation.isActive === "true"}
                        onCheckedChange={() => handleToggleActive(affirmation)}
                        disabled={updateAffirmationMutation.isPending}
                        data-testid={`checkbox-active-${affirmation.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span data-testid={`text-affirmation-${affirmation.id}`}>
                        {affirmation.text}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(affirmation.id)}
                        disabled={deleteAffirmationMutation.isPending}
                        data-testid={`button-delete-${affirmation.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}