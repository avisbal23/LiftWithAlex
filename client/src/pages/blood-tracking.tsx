import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Plus, Calendar, Upload, Download, ChevronDown, ChevronUp, Target, Activity, BarChart, CheckCircle, FileText, Save, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type BloodEntry, insertBloodEntrySchema } from "@shared/schema";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function BloodTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [collapsedRecords, setCollapsedRecords] = useState<Record<string, boolean>>({});
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, { value: string; unit: string }>>({});
  
  // Import state
  const [importData, setImportData] = useState("");
  const [csvImportData, setCsvImportData] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isProcessingTemplate, setIsProcessingTemplate] = useState(false);
  const [templateResults, setTemplateResults] = useState<{
    successful: number;
    failed: Array<{ row: number; error: string }>;
  } | null>(null);

  const { data: bloodEntries = [] } = useQuery<BloodEntry[]>({
    queryKey: ["/api/blood-entries"],
  });

  // Helper function to get latest marker value
  const getLatestMarkerValue = (fieldName: keyof BloodEntry, unitFieldName: keyof BloodEntry) => {
    const sortedEntries = bloodEntries
      .filter(entry => entry[fieldName] != null)
      .sort((a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime());
    const entry = sortedEntries[0];
    if (entry && entry[fieldName] != null) {
      return `${entry[fieldName]} ${entry[unitFieldName] || ''}`.trim();
    }
    return "N/A";
  };

  // Add new blood entry function - similar to workout pattern
  const addNewBloodEntry = async () => {
    const newEntry = {
      asOf: new Date(),
      source: "manual_entry",
    };

    try {
      const response = await apiRequest("POST", "/api/blood-entries", newEntry);
      const createdEntry = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/blood-entries"] });
      
      // Auto-expand the new entry for editing
      if (createdEntry.id) {
        setCollapsedRecords(prev => ({ ...prev, [createdEntry.id]: false }));
        setEditingEntry(createdEntry.id);
      }
      
      toast({
        title: "Success",
        description: "New blood entry created. Add your lab values below.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create blood entry",
        variant: "destructive",
      });
    }
  };

  // Update blood entry function
  const updateBloodEntry = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BloodEntry> }) =>
      apiRequest("PATCH", `/api/blood-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blood-entries"] });
      setEditingEntry(null);
      setEditingValues({});
      toast({
        title: "Success",
        description: "Blood entry updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update blood entry",
        variant: "destructive",
      });
    },
  });

  // Delete blood entry function
  const deleteBloodEntry = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/blood-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blood-entries"] });
      toast({
        title: "Success",
        description: "Blood entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete blood entry",
        variant: "destructive",
      });
    },
  });

  // Toggle collapse function
  const toggleCollapse = (id: string) => {
    setCollapsedRecords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle save entry
  const handleSaveEntry = (entryId: string) => {
    const entryData = { ...editingValues };
    
    // Convert string values to numbers where needed
    const numberFields = [
      'totalTestosterone', 'freeTestosterone', 'shbg', 'estradiol',
      'tsh', 'freeT3', 'ldlCalc', 'hdl', 'apob', 'vitaminD25oh', 'hba1c'
    ];
    
    const processedData: any = {};
    Object.entries(entryData).forEach(([key, fieldData]) => {
      if (numberFields.includes(key)) {
        processedData[key] = fieldData.value ? parseFloat(fieldData.value) : undefined;
      } else {
        processedData[key] = fieldData.value || undefined;
      }
      
      // Also save unit fields
      const unitKey = `${key}Unit`;
      if (fieldData.unit) {
        processedData[unitKey] = fieldData.unit;
      }
    });

    updateBloodEntry.mutate({ id: entryId, data: processedData });
  };

  // Handle field change
  const handleFieldChange = (field: string, value: string, unit?: string) => {
    setEditingValues(prev => ({
      ...prev,
      [field]: {
        value,
        unit: unit || prev[field]?.unit || "",
      }
    }));
  };

  // Generate CSV template
  const generateCsvTemplate = () => {
    const headers = [
      'asOf', 'source', 'totalTestosterone', 'totalTestosteroneUnit',
      'freeTestosterone', 'freeTestosteroneUnit', 'shbg', 'shbgUnit',
      'estradiol', 'estradiolUnit', 'tsh', 'tshUnit', 'freeT3', 'freeT3Unit',
      'ldlCalc', 'ldlCalcUnit', 'hdl', 'hdlUnit', 'apob', 'apobUnit',
      'vitaminD25oh', 'vitaminD25ohUnit', 'hba1c', 'hba1cUnit'
    ];
    
    const csvContent = headers.join(',') + '\n' + 
      '2024-01-15,manual_entry,450,ng/dL,85,pg/mL,28,nmol/L,26,pg/mL,2.5,uIU/mL,3.2,pg/mL,120,mg/dL,60,mg/dL,95,mg/dL,45,ng/mL,5.4,%';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blood-lab-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Import from template/CSV
  const importMutation = useMutation({
    mutationFn: async (entry: any) => {
      const response = await apiRequest("POST", "/api/blood-entries", entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blood-entries"] });
    },
  });

  const processImportData = async (data: string, isTemplate: boolean = false) => {
    try {
      let entries: any[];
      
      if (isTemplate) {
        // Process CSV format
        const lines = data.trim().split('\n');
        const headers = lines[0].split(',');
        entries = lines.slice(1).map(line => {
          const values = line.split(',');
          const entry: any = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            if (value) {
              if (header === 'asOf') {
                entry[header] = new Date(value);
              } else if (header.includes('Unit')) {
                entry[header] = value;
              } else if (['totalTestosterone', 'freeTestosterone', 'shbg', 'estradiol', 'tsh', 'freeT3', 'ldlCalc', 'hdl', 'apob', 'vitaminD25oh', 'hba1c'].includes(header)) {
                entry[header] = parseFloat(value);
              } else {
                entry[header] = value;
              }
            }
          });
          return entry;
        });
      } else {
        // Process CSV or JSON format
        try {
          // Try parsing as JSON first
          entries = JSON.parse(data);
        } catch {
          // If JSON parsing fails, try CSV
          const lines = data.trim().split('\n');
          if (lines.length < 2) {
            throw new Error('Invalid data format');
          }
          const headers = lines[0].split(',');
          entries = lines.slice(1).map(line => {
            const values = line.split(',');
            const entry: any = {};
            headers.forEach((header, index) => {
              const value = values[index]?.trim();
              if (value) {
                if (header === 'asOf') {
                  entry[header] = new Date(value);
                } else if (header.includes('Unit')) {
                  entry[header] = value;
                } else if (['totalTestosterone', 'freeTestosterone', 'shbg', 'estradiol', 'tsh', 'freeT3', 'ldlCalc', 'hdl', 'apob', 'vitaminD25oh', 'hba1c'].includes(header)) {
                  entry[header] = parseFloat(value);
                } else {
                  entry[header] = value;
                }
              }
            });
            return entry;
          });
        }
      }

      let successCount = 0;
      const failures: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < entries.length; i++) {
        try {
          await importMutation.mutateAsync(entries[i]);
          successCount++;
        } catch (error) {
          failures.push({ row: i + 1, error: String(error) });
        }
      }

      setTemplateResults({ successful: successCount, failed: failures });
      
      toast({
        title: "Import Complete",
        description: `Imported ${successCount} entries successfully${failures.length > 0 ? `, ${failures.length} failed` : ''}`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid data format",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UniversalNavigation />
      
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Droplets className="w-8 h-8 text-red-500" />
                Blood Lab Tracking
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your blood work and lab results over time
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={addNewBloodEntry} data-testid="button-add-blood-entry">
              <Plus className="w-4 h-4 mr-2" />
              Add Blood Entry
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-import-data">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Blood Lab Data</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="template" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="template" data-testid="tab-template-import">
                      <FileText className="w-4 h-4 mr-2" />
                      Template Import
                    </TabsTrigger>
                    <TabsTrigger value="rhythm" data-testid="tab-rhythm-csv">
                      <Upload className="w-4 h-4 mr-2" />
                      CSV/JSON Import
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="template" className="space-y-4 mt-6">
                    <div className="space-y-6">
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">Step 1: Download Template</h3>
                        <p className="text-muted-foreground mb-4">
                          Download the CSV template, fill it with your lab data, then upload it back.
                        </p>
                        <Button 
                          onClick={generateCsvTemplate} 
                          variant="outline"
                          data-testid="button-download-template"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Blood Lab Template
                        </Button>
                      </div>

                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">Step 2: Upload Completed Template</h3>
                        <p className="text-muted-foreground mb-4">
                          Select your completed CSV file to import the lab results.
                        </p>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                            data-testid="input-template-file"
                          />
                          <Button 
                            onClick={async () => {
                              if (!templateFile) return;
                              setIsProcessingTemplate(true);
                              const text = await templateFile.text();
                              await processImportData(text, true);
                              setIsProcessingTemplate(false);
                            }}
                            disabled={!templateFile || isProcessingTemplate}
                            data-testid="button-process-template"
                          >
                            {isProcessingTemplate ? "Processing..." : "Import Template"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="rhythm" className="space-y-4 mt-6">
                    <div className="space-y-6">
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">Import from CSV/JSON</h3>
                        <p className="text-muted-foreground mb-4">
                          Paste your CSV or JSON data directly, or upload a file.
                        </p>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept=".csv,.json"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const text = await file.text();
                                setCsvImportData(text);
                              }
                            }}
                            data-testid="input-csv-file"
                          />
                          <div className="relative">
                            <textarea
                              value={csvImportData}
                              onChange={(e) => setCsvImportData(e.target.value)}
                              placeholder="Paste your CSV or JSON data here..."
                              className="w-full h-40 p-3 border rounded-md resize-none"
                              data-testid="textarea-csv-data"
                            />
                          </div>
                          <Button 
                            onClick={() => processImportData(csvImportData, false)}
                            disabled={!csvImportData.trim()}
                            data-testid="button-import-csv"
                          >
                            Import Data
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {templateResults && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Import Results</h4>
                    <p className="text-green-600 dark:text-green-400">
                      Successfully imported {templateResults.successful} entries
                    </p>
                    {templateResults.failed.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-600 dark:text-red-400">
                          {templateResults.failed.length} entries failed:
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {templateResults.failed.map((failure, idx) => (
                            <li key={idx}>Row {failure.row}: {failure.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Latest Values Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Testosterone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getLatestMarkerValue('totalTestosterone', 'totalTestosteroneUnit')}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Free Testosterone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {getLatestMarkerValue('freeTestosterone', 'freeTestosteroneUnit')}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">LDL Cholesterol</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {getLatestMarkerValue('ldlCalc', 'ldlCalcUnit')}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Vitamin D</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {getLatestMarkerValue('vitaminD25oh', 'vitaminD25ohUnit')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blood Entries List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Blood Lab Records</h2>
            
            {bloodEntries.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No blood entries yet.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Click "Add Blood Entry" to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {bloodEntries
                  .sort((a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime())
                  .map((entry) => (
                    <Card key={entry.id} className="border">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {new Date(entry.asOf).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {entry.source?.replace('_', ' ') || 'Manual Entry'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCollapse(entry.id)}
                              data-testid={`button-toggle-${entry.id}`}
                            >
                              {collapsedRecords[entry.id] ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronUp className="w-4 h-4" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBloodEntry.mutate(entry.id)}
                              data-testid={`button-delete-${entry.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {!collapsedRecords[entry.id] && (
                          <div className="mt-4 space-y-4">
                            {editingEntry === entry.id ? (
                              // Editing Mode - Similar to workout editing
                              <div className="space-y-4">
                                <Accordion type="multiple" className="w-full" defaultValue={["hormones"]}>
                                  {/* Hormone Balance */}
                                  <AccordionItem value="hormones">
                                    <AccordionTrigger>
                                      <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Hormone Balance
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Total Testosterone */}
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">Total Testosterone</label>
                                            <Input
                                              type="number"
                                              step="0.1"
                                              placeholder="400"
                                              value={editingValues.totalTestosterone?.value || entry.totalTestosterone || ''}
                                              onChange={(e) => handleFieldChange('totalTestosterone', e.target.value)}
                                              data-testid={`input-total-testosterone-${entry.id}`}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Select 
                                              value={editingValues.totalTestosterone?.unit || entry.totalTestosteroneUnit || "ng/dL"}
                                              onValueChange={(value) => handleFieldChange('totalTestosterone', editingValues.totalTestosterone?.value || entry.totalTestosterone?.toString() || '', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="ng/dL">ng/dL</SelectItem>
                                                <SelectItem value="nmol/L">nmol/L</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* Free Testosterone */}
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">Free Testosterone</label>
                                            <Input
                                              type="number"
                                              step="0.1"
                                              placeholder="85"
                                              value={editingValues.freeTestosterone?.value || entry.freeTestosterone || ''}
                                              onChange={(e) => handleFieldChange('freeTestosterone', e.target.value)}
                                              data-testid={`input-free-testosterone-${entry.id}`}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Select 
                                              value={editingValues.freeTestosterone?.unit || entry.freeTestosteroneUnit || "pg/mL"}
                                              onValueChange={(value) => handleFieldChange('freeTestosterone', editingValues.freeTestosterone?.value || entry.freeTestosterone?.toString() || '', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="pg/mL">pg/mL</SelectItem>
                                                <SelectItem value="pmol/L">pmol/L</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Thyroid */}
                                  <AccordionItem value="thyroid">
                                    <AccordionTrigger>
                                      <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Thyroid Function
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* TSH */}
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">TSH</label>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              placeholder="2.5"
                                              value={editingValues.tsh?.value || entry.tsh || ''}
                                              onChange={(e) => handleFieldChange('tsh', e.target.value)}
                                              data-testid={`input-tsh-${entry.id}`}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Select 
                                              value={editingValues.tsh?.unit || entry.tshUnit || "uIU/mL"}
                                              onValueChange={(value) => handleFieldChange('tsh', editingValues.tsh?.value || entry.tsh?.toString() || '', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="uIU/mL">uIU/mL</SelectItem>
                                                <SelectItem value="mIU/L">mIU/L</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Lipids */}
                                  <AccordionItem value="lipids">
                                    <AccordionTrigger>
                                      <div className="flex items-center gap-2">
                                        <BarChart className="w-4 h-4" />
                                        Lipid Panel
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* LDL */}
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">LDL Cholesterol</label>
                                            <Input
                                              type="number"
                                              step="0.1"
                                              placeholder="120"
                                              value={editingValues.ldlCalc?.value || entry.ldlCalc || ''}
                                              onChange={(e) => handleFieldChange('ldlCalc', e.target.value)}
                                              data-testid={`input-ldl-${entry.id}`}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Select 
                                              value={editingValues.ldlCalc?.unit || entry.ldlCalcUnit || "mg/dL"}
                                              onValueChange={(value) => handleFieldChange('ldlCalc', editingValues.ldlCalc?.value || entry.ldlCalc?.toString() || '', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="mg/dL">mg/dL</SelectItem>
                                                <SelectItem value="mmol/L">mmol/L</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* HDL */}
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">HDL Cholesterol</label>
                                            <Input
                                              type="number"
                                              step="0.1"
                                              placeholder="60"
                                              value={editingValues.hdl?.value || entry.hdl || ''}
                                              onChange={(e) => handleFieldChange('hdl', e.target.value)}
                                              data-testid={`input-hdl-${entry.id}`}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Select 
                                              value={editingValues.hdl?.unit || entry.hdlUnit || "mg/dL"}
                                              onValueChange={(value) => handleFieldChange('hdl', editingValues.hdl?.value || entry.hdl?.toString() || '', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="mg/dL">mg/dL</SelectItem>
                                                <SelectItem value="mmol/L">mmol/L</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Vitamins */}
                                  <AccordionItem value="vitamins">
                                    <AccordionTrigger>
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Vitamins & General Health
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Vitamin D */}
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">Vitamin D</label>
                                            <Input
                                              type="number"
                                              step="0.1"
                                              placeholder="45"
                                              value={editingValues.vitaminD25oh?.value || entry.vitaminD25oh || ''}
                                              onChange={(e) => handleFieldChange('vitaminD25oh', e.target.value)}
                                              data-testid={`input-vitamin-d-${entry.id}`}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Select 
                                              value={editingValues.vitaminD25oh?.unit || entry.vitaminD25ohUnit || "ng/mL"}
                                              onValueChange={(value) => handleFieldChange('vitaminD25oh', editingValues.vitaminD25oh?.value || entry.vitaminD25oh?.toString() || '', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="ng/mL">ng/mL</SelectItem>
                                                <SelectItem value="nmol/L">nmol/L</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* HbA1c */}
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">HbA1c</label>
                                            <Input
                                              type="number"
                                              step="0.1"
                                              placeholder="5.4"
                                              value={editingValues.hba1c?.value || entry.hba1c || ''}
                                              onChange={(e) => handleFieldChange('hba1c', e.target.value)}
                                              data-testid={`input-hba1c-${entry.id}`}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Select 
                                              value={editingValues.hba1c?.unit || entry.hba1cUnit || "%"}
                                              onValueChange={(value) => handleFieldChange('hba1c', editingValues.hba1c?.value || entry.hba1c?.toString() || '', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="%">%</SelectItem>
                                                <SelectItem value="mmol/mol">mmol/mol</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={() => handleSaveEntry(entry.id)}
                                    disabled={updateBloodEntry.isPending}
                                    data-testid={`button-save-${entry.id}`}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    {updateBloodEntry.isPending ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingEntry(null);
                                      setEditingValues({});
                                    }}
                                    data-testid={`button-cancel-${entry.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View Mode - Display lab values
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  {entry.totalTestosterone && (
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Total T:</span>
                                      <div className="font-medium">{entry.totalTestosterone} {entry.totalTestosteroneUnit}</div>
                                    </div>
                                  )}
                                  {entry.freeTestosterone && (
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Free T:</span>
                                      <div className="font-medium">{entry.freeTestosterone} {entry.freeTestosteroneUnit}</div>
                                    </div>
                                  )}
                                  {entry.ldlCalc && (
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">LDL:</span>
                                      <div className="font-medium">{entry.ldlCalc} {entry.ldlCalcUnit}</div>
                                    </div>
                                  )}
                                  {entry.vitaminD25oh && (
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Vitamin D:</span>
                                      <div className="font-medium">{entry.vitaminD25oh} {entry.vitaminD25ohUnit}</div>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingEntry(entry.id)}
                                  data-testid={`button-edit-${entry.id}`}
                                >
                                  Edit Values
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}