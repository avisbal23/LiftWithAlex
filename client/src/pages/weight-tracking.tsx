import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from "recharts";
import { Calendar, Upload, Plus, Trash2, Download, X, BarChart, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, HelpCircle, FileText, Ruler } from "lucide-react";
import { format, subDays, subMonths, parseISO } from "date-fns";
import { type WeightEntry, type InsertWeightEntry, type BodyMeasurement, type InsertBodyMeasurement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import WeightAudit from "@/components/weight-audit";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function WeightTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for chart controls
  const [dateRange, setDateRange] = useState("90");
  const [showWeight, setShowWeight] = useState(true);
  const [showBodyFat, setShowBodyFat] = useState(true);
  const [showMuscleMass, setShowMuscleMass] = useState(false);
  const [showBMI, setShowBMI] = useState(false);
  
  // Form state for adding new entries
  const [newEntry, setNewEntry] = useState({
    weight: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "h:mm:ss a"),
    bodyFat: "",
    muscleMass: "",
    bmi: "",
  });
  
  // State for dismissible callout
  
  // State for chart controls collapsible
  
  // State for chart/table tabs
  const [activeTab, setActiveTab] = useState("chart");
  
  // State for add entry dialog advanced fields
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // State for body measurements
  const [showMeasurementDialog, setShowMeasurementDialog] = useState(false);
  const [measurementForm, setMeasurementForm] = useState<Partial<InsertBodyMeasurement>>({
    date: new Date(),
    neck: null,
    chest: null,
    waist: null,
    hips: null,
    biceps: null,
    thighs: null,
    calves: null,
    unit: 'in'
  });

  // Fetch weight entries
  const { data: weightEntries = [], isLoading } = useQuery<WeightEntry[]>({
    queryKey: ["/api/weight-entries"],
  });

  // Body measurements query
  const { data: bodyMeasurements = [], isLoading: isMeasurementsLoading } = useQuery<BodyMeasurement[]>({
    queryKey: ["/api/body-measurements"],
  });

  const { data: latestMeasurement } = useQuery<BodyMeasurement>({
    queryKey: ["/api/body-measurements/latest"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (entry: InsertWeightEntry) => {
      const response = await apiRequest("POST", "/api/weight-entries", entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weight-audit"] });
      setNewEntry({
        weight: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "h:mm:ss a"),
        bodyFat: "",
        muscleMass: "",
        bmi: "",
      });
      toast({
        title: "Weight entry added",
        description: "Your health data has been recorded successfully.",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/weight-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weight-audit"] });
      toast({
        title: "Entry deleted",
        description: "Health data entry has been removed.",
      });
    },
  });

  // Body measurement mutations
  const createMeasurementMutation = useMutation({
    mutationFn: async (measurement: InsertBodyMeasurement) => {
      const response = await apiRequest("POST", "/api/body-measurements", measurement);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements/latest"] });
      toast({
        title: "Measurement added",
        description: "Body measurement has been added successfully.",
      });
      setShowMeasurementDialog(false);
      setMeasurementForm({
        date: new Date(),
        neck: null,
        chest: null,
        waist: null,
        hips: null,
        biceps: null,
        thighs: null,
        calves: null,
        unit: 'in'
      });
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/body-measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements/latest"] });
      toast({
        title: "Measurement deleted",
        description: "Body measurement has been deleted successfully.",
      });
    },
  });

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const daysBack = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), daysBack);
    return weightEntries
      .filter(entry => new Date(entry.date) >= cutoffDate)
      .map(entry => ({
        ...entry,
        date: format(new Date(entry.date), "MMM dd"),
        fullDate: entry.date,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [weightEntries, dateRange]);

  // Calculate dynamic Y-axis domains
  const chartDomains = useMemo(() => {
    if (filteredData.length === 0) return { weight: [0, 100], percent: [0, 100] };

    const weightValues: number[] = [];
    const percentValues: number[] = [];

    filteredData.forEach(entry => {
      if (showWeight && entry.weight) weightValues.push(entry.weight);
      if (showMuscleMass && entry.muscleMass) weightValues.push(entry.muscleMass);
      if (showBodyFat && entry.bodyFat) percentValues.push(entry.bodyFat);
      if (showBMI && entry.bmi) percentValues.push(entry.bmi);
    });

    const calculateDomain = (values: number[]) => {
      if (values.length === 0) return [0, 100];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const padding = Math.max(range * 0.1, 1); // 10% padding or minimum 1
      return [Math.max(0, min - padding), max + padding];
    };

    return {
      weight: calculateDomain(weightValues),
      percent: calculateDomain(percentValues)
    };
  }, [filteredData, showWeight, showBodyFat, showMuscleMass, showBMI]);

  const handleAddEntry = () => {
    if (!newEntry.weight || !newEntry.date) {
      toast({
        title: "Missing required fields",
        description: "Please fill in weight and date.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      weight: parseFloat(newEntry.weight),
      date: new Date(newEntry.date),
      time: newEntry.time,
      bodyFat: newEntry.bodyFat ? parseFloat(newEntry.bodyFat) : undefined,
      muscleMass: newEntry.muscleMass ? parseFloat(newEntry.muscleMass) : undefined,
      bmi: newEntry.bmi ? parseFloat(newEntry.bmi) : undefined,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        // Skip header line and process data
        const entries: InsertWeightEntry[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          if (values.length < 3) continue;
          
          // RENPHO format: Date, Time, Weight(lb), Body Fat(%), Fat-Free Mass(lb), Muscle Mass(lb), BMI, etc.
          const entry: InsertWeightEntry = {
            date: new Date(values[0].trim()),
            time: values[1]?.trim() || "",
            weight: parseFloat(values[2]) || 0,
            bodyFat: values[3] ? parseFloat(values[3]) : undefined,
            fatFreeMass: values[4] ? parseFloat(values[4]) : undefined,
            muscleMass: values[5] ? parseFloat(values[5]) : undefined,
            bmi: values[6] ? parseFloat(values[6]) : undefined,
            subcutaneousFat: values[7] ? parseFloat(values[7]) : undefined,
            skeletalMuscle: values[8] ? parseFloat(values[8]) : undefined,
            bodyWater: values[9] ? parseFloat(values[9]) : undefined,
            visceralFat: values[10] ? parseInt(values[10]) : undefined,
            boneMass: values[11] ? parseFloat(values[11]) : undefined,
            protein: values[12] ? parseFloat(values[12]) : undefined,
            bmr: values[13] ? parseInt(values[13]) : undefined,
            metabolicAge: values[14] ? parseInt(values[14]) : undefined,
            remarks: values[19]?.trim() || "",
          };
          
          entries.push(entry);
        }

        // Create all entries
        entries.forEach(entry => {
          createMutation.mutate(entry);
        });

        toast({
          title: "RENPHO file uploaded successfully",
          description: `Added ${entries.length} health data entries.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please check your RENPHO CSV file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportCSV = () => {
    // Create RENPHO format CSV template
    const header = "Date, Time, Weight(lb),Body Fat(%),Fat-Free Mass(lb),Muscle Mass(lb),BMI,Subcutaneous Fat(%),Skeletal Muscle(%),Body Water(%),Visceral Fat,Bone Mass(lb),Protein (%),BMR(kcal),Metabolic Age,Optimal Weight(lb),Target to optimal weight(lb),Target to optimal fat mass(lb),Target to optimal muscle mass(lb),Body Type,Remarks";
    
    const rows = weightEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(entry => {
        const formatValue = (val: any) => val !== undefined && val !== null ? val : '--';
        return [
          format(new Date(entry.date), "M/d/yy"),
          entry.time || '--',
          entry.weight,
          formatValue(entry.bodyFat),
          formatValue(entry.fatFreeMass),
          formatValue(entry.muscleMass),
          formatValue(entry.bmi),
          formatValue(entry.subcutaneousFat),
          formatValue(entry.skeletalMuscle),
          formatValue(entry.bodyWater),
          formatValue(entry.visceralFat),
          formatValue(entry.boneMass),
          formatValue(entry.protein),
          formatValue(entry.bmr),
          formatValue(entry.metabolicAge),
          formatValue(entry.optimalWeight),
          formatValue(entry.targetToOptimalWeight),
          formatValue(entry.targetToOptimalFatMass),
          formatValue(entry.targetToOptimalMuscleMass),
          formatValue(entry.bodyType),
          entry.remarks || '--'
        ].join(',');
      });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `renpho_health_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exported",
      description: "Your health data has been exported in RENPHO format.",
    });
  };

  if (isLoading) {
    return (
      <>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <UniversalNavigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground" data-testid="heading-weight-tracking">
              Weight & Health Tracking
            </h2>
            <p className="text-muted-foreground">Monitor your complete health metrics over time</p>
          </div>
        </div>


        <div className="flex items-center justify-between mb-6">
          <div></div>
          
          <div className="flex items-center gap-3">
            {/* File Upload */}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="weight-file-upload"
            />
            
            {/* Import/Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-accent/50 border-accent text-accent-foreground hover:bg-accent/80"
                  data-testid="button-import-export-weight"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={exportCSV}
                  disabled={weightEntries.length === 0}
                  data-testid="menu-export-weight"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => document.getElementById('weight-file-upload')?.click()}
                  data-testid="menu-import-weight"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import RENPHO
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Entry Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-add-weight-entry">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Health Data Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Essential Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weight">Weight (lbs) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={newEntry.weight}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="172.8"
                          data-testid="input-weight"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newEntry.date}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                          data-testid="input-date"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        value={newEntry.time}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, time: e.target.value }))}
                        placeholder="9:15:29 AM"
                        data-testid="input-time"
                      />
                    </div>
                  </div>

                  {/* Advanced Fields Accordion */}
                  <Accordion type="single" collapsible className="border rounded-lg">
                    <AccordionItem value="advanced-fields" className="border-none">
                      <AccordionTrigger 
                        className="px-4 py-3 text-sm font-medium hover:no-underline"
                        data-testid="accordion-trigger-more-fields"
                      >
                        More Fields (Optional)
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="bodyFat" className="text-sm">Body Fat %</Label>
                              <Input
                                id="bodyFat"
                                type="number"
                                step="0.1"
                                value={newEntry.bodyFat}
                                onChange={(e) => setNewEntry(prev => ({ ...prev, bodyFat: e.target.value }))}
                                placeholder="15.1"
                                data-testid="input-body-fat"
                              />
                            </div>
                            <div>
                              <Label htmlFor="muscleMass" className="text-sm">Muscle Mass (lbs)</Label>
                              <Input
                                id="muscleMass"
                                type="number"
                                step="0.1"
                                value={newEntry.muscleMass}
                                onChange={(e) => setNewEntry(prev => ({ ...prev, muscleMass: e.target.value }))}
                                placeholder="139.4"
                                data-testid="input-muscle-mass"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="bmi" className="text-sm">BMI</Label>
                            <Input
                              id="bmi"
                              type="number"
                              step="0.1"
                              value={newEntry.bmi}
                              onChange={(e) => setNewEntry(prev => ({ ...prev, bmi: e.target.value }))}
                              placeholder="27.1"
                              data-testid="input-bmi"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <Button 
                    onClick={handleAddEntry} 
                    disabled={createMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-entry"
                  >
                    {createMutation.isPending ? "Adding..." : "Add Entry"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Statistics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/30 dark:border-blue-800/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Current Weight</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="kpi-current-weight">
                {filteredData.length > 0 ? `${filteredData[filteredData.length - 1]?.weight} lbs` : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200/30 dark:border-emerald-800/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Body Fat</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300" data-testid="kpi-body-fat">
                {filteredData.length > 0 && filteredData[filteredData.length - 1]?.bodyFat 
                  ? `${filteredData[filteredData.length - 1]?.bodyFat}%` 
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200/30 dark:border-purple-800/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Weight Change</span>
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300" data-testid="kpi-weight-change">
                {filteredData.length > 1 
                  ? `${((filteredData[filteredData.length - 1]?.weight || 0) - (filteredData[0]?.weight || 0)).toFixed(1)} lbs`
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/30 dark:border-amber-800/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Total Entries</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300" data-testid="kpi-total-entries">
                {weightEntries.length}
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Chart and Table Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Health Data Visualization</CardTitle>
                <TabsList className="grid w-[200px] grid-cols-2" data-testid="tabs-chart-table">
                  <TabsTrigger value="chart" data-testid="tab-trigger-chart">Chart</TabsTrigger>
                  <TabsTrigger value="table" data-testid="tab-trigger-table">Table</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <TabsContent value="chart" className="mt-0">
              <CardContent className="pt-0">
                {filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        yAxisId="weight" 
                        orientation="left" 
                        domain={chartDomains.weight}
                        tickFormatter={(value) => value.toFixed(0)}
                      />
                      <YAxis 
                        yAxisId="percent" 
                        orientation="right" 
                        domain={chartDomains.percent}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip 
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(value, name) => [
                          `${typeof value === 'number' ? value.toFixed(1) : value}${
                            name === 'bodyFat' ? '%' : 
                            name === 'weight' || name === 'muscleMass' ? ' lbs' : 
                            name === 'bmi' ? '' : ''
                          }`,
                          name === 'bodyFat' ? 'Body Fat %' : 
                          name === 'muscleMass' ? 'Muscle Mass' : 
                          name === 'bmi' ? 'BMI' : 'Weight'
                        ]}
                      />
                      <Legend />
                      
                      {showWeight && (
                        <Line 
                          yAxisId="weight"
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          name="weight"
                        />
                      )}
                      {showBodyFat && (
                        <Line 
                          yAxisId="percent"
                          type="monotone" 
                          dataKey="bodyFat" 
                          stroke="#dc2626" 
                          strokeWidth={2}
                          name="bodyFat"
                        />
                      )}
                      {showMuscleMass && (
                        <Line 
                          yAxisId="weight"
                          type="monotone" 
                          dataKey="muscleMass" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          name="muscleMass"
                        />
                      )}
                      {showBMI && (
                        <Line 
                          yAxisId="percent"
                          type="monotone" 
                          dataKey="bmi" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          name="bmi"
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Health Data</h3>
                    <p className="text-muted-foreground mb-4">Start tracking your health metrics by adding your first entry or importing a RENPHO CSV file.</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>Add First Entry</Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
                
                {/* Chart Controls */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Range Control */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger data-testid="select-date-range">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="180">6 Months</SelectItem>
                          <SelectItem value="365">1 Year</SelectItem>
                          <SelectItem value="1825">5 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Display Options */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Chart Display</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="show-weight" 
                            checked={showWeight} 
                            onCheckedChange={(checked) => setShowWeight(!!checked)} 
                            data-testid="checkbox-show-weight"
                          />
                          <Label htmlFor="show-weight" className="text-sm">Weight</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="show-bodyfat" 
                            checked={showBodyFat} 
                            onCheckedChange={(checked) => setShowBodyFat(!!checked)} 
                            data-testid="checkbox-show-bodyfat"
                          />
                          <Label htmlFor="show-bodyfat" className="text-sm">Body Fat %</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="show-muscle" 
                            checked={showMuscleMass} 
                            onCheckedChange={(checked) => setShowMuscleMass(!!checked)} 
                            data-testid="checkbox-show-muscle"
                          />
                          <Label htmlFor="show-muscle" className="text-sm">Muscle Mass</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="show-bmi" 
                            checked={showBMI} 
                            onCheckedChange={(checked) => setShowBMI(!!checked)} 
                            data-testid="checkbox-show-bmi"
                          />
                          <Label htmlFor="show-bmi" className="text-sm">BMI</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="table" className="mt-0">
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {weightEntries.length} entries total
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Weight (lbs)</TableHead>
                        <TableHead>Body Fat %</TableHead>
                        <TableHead>Muscle Mass (lbs)</TableHead>
                        <TableHead>BMI</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weightEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                            No health data entries found. Add your first entry to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        weightEntries
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell>{entry.time || "-"}</TableCell>
                              <TableCell>{entry.weight}</TableCell>
                              <TableCell>{entry.bodyFat ? `${entry.bodyFat}%` : "-"}</TableCell>
                              <TableCell>{entry.muscleMass || "-"}</TableCell>
                              <TableCell>{entry.bmi || "-"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteMutation.mutate(entry.id)}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-weight-${entry.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>
          </Card>
        </Tabs>

        {/* Weight Change History */}
        <WeightAudit />

        {/* Import Help Accordion */}
        <Card className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200/30 dark:border-orange-800/30">
          <Accordion type="single" collapsible>
            <AccordionItem value="import-help" className="border-none">
              <AccordionTrigger 
                className="px-6 py-4 hover:no-underline"
                data-testid="accordion-trigger-import-help"
              >
                <div className="flex items-center gap-3 text-orange-700 dark:text-orange-300">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-semibold">Import Help & RENPHO Format Guide</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-800 dark:text-orange-200">How to Import RENPHO Data:</h4>
                    <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                      <p className="flex items-start gap-2">
                        <span className="font-medium min-w-[20px]">1.</span>
                        <span>Open the RENPHO app on your phone</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-medium min-w-[20px]">2.</span>
                        <span>Go to Profile → Data Export → Export CSV</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-medium min-w-[20px]">3.</span>
                        <span>Save the CSV file to your device</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-medium min-w-[20px]">4.</span>
                        <span>Click "Import RENPHO" button above and select your file</span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-800 dark:text-orange-200">Expected CSV Format:</h4>
                    <div className="bg-orange-100/70 dark:bg-orange-900/30 p-4 rounded-lg overflow-x-auto border border-orange-200/50 dark:border-orange-800/50">
                      <code className="text-xs whitespace-pre text-orange-900 dark:text-orange-100">
{`Date, Time, Weight(lb),Body Fat(%),Fat-Free Mass(lb),Muscle Mass(lb),BMI,Subcutaneous Fat(%),Skeletal Muscle(%),...
8/24/25,11:52:37 AM,166.4,15.0,141.4,134.2,26.8,12.4,54.9,61.4,9,7.2,19.4,1769,31,--,--,--,--,--,--
8/21/25,7:47:06 AM,167.4,15.1,142.0,135.0,27.0,12.5,54.8,61.3,10,7.0,19.4,1747,31,--,--,--,--,--,--`}
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-800 dark:text-orange-200">Export Your Data:</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Use the "Export CSV" button above to download your current data in RENPHO format. 
                      You can edit this file and re-import it to update or add new entries.
                    </p>
                  </div>
                  
                  <div className="bg-orange-100/50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                    <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-200">💡 Pro Tip:</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      The system automatically parses all health metrics including weight, body fat, muscle mass, BMI, and more advanced metrics like visceral fat and metabolic age.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Body Measurements Section */}
        <Card className="mb-8">
          <Accordion type="single" collapsible>
            <AccordionItem value="body-measurements">
              <AccordionTrigger className="flex items-center gap-3 px-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Body Measurements</h3>
                    <p className="text-sm text-muted-foreground">Track body measurements with tape measure</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Track your body measurements over time to monitor progress and changes</p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Measurement
                    </Button>
                  </div>

                  {/* Body visualization placeholder - will be implemented next */}
                  <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8">
                    <div className="text-center">
                      <p className="text-muted-foreground">Body measurement visualization will appear here</p>
                      <p className="text-sm text-muted-foreground mt-2">Shows latest measurements around body silhouette</p>
                    </div>
                  </div>

                  {/* Import/Export Controls */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Import/Export Data</h4>
                      <p className="text-sm text-muted-foreground">Import from measurement apps or export your data</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </main>
    </>
  );
}