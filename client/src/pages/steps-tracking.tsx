import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from "recharts";
import { Calendar, Upload, Plus, Trash2, Download, X, BarChart, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, HelpCircle, FileText, Footprints, MapPin } from "lucide-react";
import { format, subDays, subMonths, parseISO } from "date-fns";
import { type StepEntry, type InsertStepEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UniversalNavigation } from "@/components/UniversalNavigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function StepsTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for chart controls
  const [dateRange, setDateRange] = useState("90");
  const [showSteps, setShowSteps] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [showFloors, setShowFloors] = useState(false);
  
  // Form state for adding new entries
  const [newEntry, setNewEntry] = useState({
    steps: "",
    date: format(new Date(), "yyyy-MM-dd"),
    distance: "",
    floorsAscended: "",
  });
  
  // State for chart/table tabs
  const [activeTab, setActiveTab] = useState("chart");
  
  // State for add entry dialog advanced fields
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Fetch step entries
  const { data: stepEntries = [], isLoading } = useQuery<StepEntry[]>({
    queryKey: ["/api/step-entries"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (entry: InsertStepEntry) => {
      const response = await apiRequest("POST", "/api/step-entries", entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/step-entries"] });
      setNewEntry({
        steps: "",
        date: format(new Date(), "yyyy-MM-dd"),
        distance: "",
        floorsAscended: "",
      });
      toast({
        title: "Step entry added",
        description: "Your activity data has been recorded successfully.",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/step-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/step-entries"] });
      toast({
        title: "Entry deleted",
        description: "Activity data entry has been removed.",
      });
    },
  });

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const daysBack = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), daysBack);
    return stepEntries
      .filter(entry => new Date(entry.date) >= cutoffDate)
      .map(entry => ({
        ...entry,
        date: format(new Date(entry.date), "MMM dd"),
        fullDate: entry.date,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [stepEntries, dateRange]);

  // Calculate dynamic Y-axis domains
  const chartDomains = useMemo(() => {
    if (filteredData.length === 0) return { steps: [0, 10000], distance: [0, 10] };

    const stepValues: number[] = [];
    const distanceValues: number[] = [];

    filteredData.forEach(entry => {
      if (showSteps && entry.steps) stepValues.push(entry.steps);
      if (showDistance && entry.distance) distanceValues.push(entry.distance);
      if (showFloors && entry.floorsAscended) stepValues.push(entry.floorsAscended * 100); // Scale floors for visualization
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
      steps: calculateDomain(stepValues),
      distance: calculateDomain(distanceValues)
    };
  }, [filteredData, showSteps, showDistance, showFloors]);

  // Calculate averages for different periods
  const averages = useMemo(() => {
    if (stepEntries.length === 0) return { daily: 0, weekly: 0, monthly: 0 };

    const now = new Date();
    const lastWeek = subDays(now, 7);
    const lastMonth = subDays(now, 30);

    const weeklyEntries = stepEntries.filter(entry => new Date(entry.date) >= lastWeek);
    const monthlyEntries = stepEntries.filter(entry => new Date(entry.date) >= lastMonth);

    const calculateAverage = (entries: StepEntry[]) => {
      if (entries.length === 0) return 0;
      const total = entries.reduce((sum, entry) => sum + entry.steps, 0);
      return Math.round(total / entries.length);
    };

    return {
      daily: stepEntries.length > 0 ? stepEntries[stepEntries.length - 1]?.steps || 0 : 0,
      weekly: calculateAverage(weeklyEntries),
      monthly: calculateAverage(monthlyEntries)
    };
  }, [stepEntries]);

  const handleAddEntry = () => {
    if (!newEntry.steps || !newEntry.date) {
      toast({
        title: "Missing required fields",
        description: "Please fill in steps and date.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      steps: parseInt(newEntry.steps),
      date: new Date(newEntry.date),
      distance: newEntry.distance ? parseFloat(newEntry.distance) : undefined,
      floorsAscended: newEntry.floorsAscended ? parseInt(newEntry.floorsAscended) : undefined,
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
        const entries: InsertStepEntry[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          if (values.length < 2) continue;
          
          // Format: Date, Steps, Distance, Floors Ascended
          const entry: InsertStepEntry = {
            date: new Date(values[0].trim()),
            steps: parseInt(values[1].trim()) || 0,
            distance: values[2] ? parseFloat(values[2].trim()) : undefined,
            floorsAscended: values[3] ? parseInt(values[3].trim()) : undefined,
          };
          
          entries.push(entry);
        }

        // Create all entries
        entries.forEach(entry => {
          createMutation.mutate(entry);
        });

        toast({
          title: "CSV file uploaded successfully",
          description: `Added ${entries.length} step data entries.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please check your CSV file format: Date, Steps, Distance, Floors Ascended",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportCSV = () => {
    // Create CSV in the format: Date, Steps, Distance, Floors Ascended
    const header = "Date,Steps,Distance,Floors Ascended";
    
    const rows = stepEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(entry => {
        const formatValue = (val: any) => val !== undefined && val !== null ? val : '';
        return [
          format(new Date(entry.date), "yyyy-MM-dd"),
          entry.steps,
          formatValue(entry.distance),
          formatValue(entry.floorsAscended)
        ].join(',');
      });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `steps_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exported",
      description: "Your step data has been exported successfully.",
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
            <h2 className="text-2xl font-bold text-foreground" data-testid="heading-steps-tracking">
              Steps Tracking
            </h2>
            <p className="text-muted-foreground">Monitor your daily activity and movement patterns</p>
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
              id="steps-file-upload"
            />
            
            {/* Import/Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-accent/50 border-accent text-accent-foreground hover:bg-accent/80"
                  data-testid="button-import-export-steps"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={exportCSV}
                  disabled={stepEntries.length === 0}
                  data-testid="menu-export-steps"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => document.getElementById('steps-file-upload')?.click()}
                  data-testid="menu-import-steps"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Entry Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-add-step-entry">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Step Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Essential Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="steps">Steps *</Label>
                        <Input
                          id="steps"
                          type="number"
                          value={newEntry.steps}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, steps: e.target.value }))}
                          placeholder="8540"
                          data-testid="input-steps"
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
                              <Label htmlFor="distance" className="text-sm">Distance (miles)</Label>
                              <Input
                                id="distance"
                                type="number"
                                step="0.1"
                                value={newEntry.distance}
                                onChange={(e) => setNewEntry(prev => ({ ...prev, distance: e.target.value }))}
                                placeholder="4.2"
                                data-testid="input-distance"
                              />
                            </div>
                            <div>
                              <Label htmlFor="floorsAscended" className="text-sm">Floors Ascended</Label>
                              <Input
                                id="floorsAscended"
                                type="number"
                                value={newEntry.floorsAscended}
                                onChange={(e) => setNewEntry(prev => ({ ...prev, floorsAscended: e.target.value }))}
                                placeholder="12"
                                data-testid="input-floors-ascended"
                              />
                            </div>
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
                <Footprints className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Today's Steps</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="kpi-current-steps">
                {averages.daily.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200/30 dark:border-emerald-800/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">7-Day Average</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300" data-testid="kpi-weekly-average">
                {averages.weekly.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200/30 dark:border-purple-800/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">30-Day Average</span>
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300" data-testid="kpi-monthly-average">
                {averages.monthly.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200/30 dark:border-orange-800/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Entries</span>
              </div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300" data-testid="kpi-total-entries">
                {stepEntries.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Controls */}
        <Collapsible defaultOpen className="mb-6">
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    <CardTitle>Chart Controls</CardTitle>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Date Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger data-testid="select-date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 3 months</SelectItem>
                        <SelectItem value="180">Last 6 months</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                        <SelectItem value="99999">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Metrics Toggle */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Metrics to Display</Label>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="steps"
                          checked={showSteps}
                          onCheckedChange={(checked) => setShowSteps(checked === true)}
                          data-testid="checkbox-show-steps"
                        />
                        <Label htmlFor="steps" className="text-sm">Steps</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="distance"
                          checked={showDistance}
                          onCheckedChange={(checked) => setShowDistance(checked === true)}
                          data-testid="checkbox-show-distance"
                        />
                        <Label htmlFor="distance" className="text-sm">Distance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="floors"
                          checked={showFloors}
                          onCheckedChange={(checked) => setShowFloors(checked === true)}
                          data-testid="checkbox-show-floors"
                        />
                        <Label htmlFor="floors" className="text-sm">Floors</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Chart and Table Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart" data-testid="tab-chart">Chart View</TabsTrigger>
            <TabsTrigger value="table" data-testid="tab-table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Step Activity Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                    <Footprints className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">No step data available</p>
                    <p className="text-sm">Add your first entry to see your activity chart</p>
                  </div>
                ) : (
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={filteredData} margin={{ top: 15, right: 15, left: 15, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11 }}
                          interval={filteredData.length > 30 ? Math.floor(filteredData.length / 15) : 'preserveStartEnd'}
                          angle={filteredData.length > 20 ? -45 : 0}
                          textAnchor={filteredData.length > 20 ? 'end' : 'middle'}
                          height={filteredData.length > 20 ? 60 : 30}
                        />
                        <YAxis 
                          yAxisId="steps"
                          domain={chartDomains.steps}
                          tick={{ fontSize: 11 }}
                          width={50}
                        />
                        <YAxis 
                          yAxisId="distance"
                          orientation="right"
                          domain={chartDomains.distance}
                          tick={{ fontSize: 11 }}
                          width={45}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                          formatter={(value: any, name: string) => [
                            name === 'steps' ? value?.toLocaleString() : value,
                            name === 'steps' ? 'Steps' : 
                            name === 'distance' ? 'Distance (mi)' : 'Floors'
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        
                        {showSteps && (
                          <Line 
                            yAxisId="steps"
                            type="monotone" 
                            dataKey="steps" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                            name="Steps"
                          />
                        )}
                        
                        {showDistance && (
                          <Line 
                            yAxisId="distance"
                            type="monotone" 
                            dataKey="distance" 
                            stroke="hsl(142 76% 36%)" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(142 76% 36%)', strokeWidth: 2, r: 4 }}
                            name="Distance"
                          />
                        )}
                        
                        {showFloors && (
                          <Bar 
                            yAxisId="steps"
                            dataKey="floorsAscended" 
                            fill="hsl(262 83% 58%)" 
                            opacity={0.7}
                            name="Floors"
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Step Data Table
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stepEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">No step data available</p>
                    <p className="text-sm">Add your first entry to see your data table</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Steps</TableHead>
                          <TableHead>Distance (mi)</TableHead>
                          <TableHead>Floors</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stepEntries
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell data-testid={`date-${entry.id}`}>
                                {format(new Date(entry.date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell data-testid={`steps-${entry.id}`}>
                                {entry.steps.toLocaleString()}
                              </TableCell>
                              <TableCell data-testid={`distance-${entry.id}`}>
                                {entry.distance ? entry.distance.toFixed(1) : "—"}
                              </TableCell>
                              <TableCell data-testid={`floors-${entry.id}`}>
                                {entry.floorsAscended || "—"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(entry.id)}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${entry.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}