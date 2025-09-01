import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from "recharts";
import { Calendar, Upload, Plus, Trash2, Download, X } from "lucide-react";
import { format, subDays, subMonths, parseISO } from "date-fns";
import { type WeightEntry, type InsertWeightEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WeightTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for chart controls
  const [dateRange, setDateRange] = useState("30");
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
  const [showCallout, setShowCallout] = useState(true);

  // Fetch weight entries
  const { data: weightEntries = [], isLoading } = useQuery<WeightEntry[]>({
    queryKey: ["/api/weight-entries"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (entry: InsertWeightEntry) => {
      const response = await apiRequest("POST", "/api/weight-entries", entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
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
      toast({
        title: "Entry deleted",
        description: "Health data entry has been removed.",
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
        <Navigation />
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
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground" data-testid="heading-weight-tracking">
              Weight & Health Tracking
            </h2>
            <p className="text-muted-foreground">Monitor your complete health metrics over time</p>
          </div>
        </div>

        {/* RENPHO Import Callout */}
        {showCallout && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCallout(false)}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/50"
              data-testid="button-close-callout"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-start gap-3 pr-8">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  💡 Import Data from RENPHO App
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Export from RENPHO app and import to sync all your weight and body metrics.
                </p>
              </div>
            </div>
          </div>
        )}

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
            <Button
              variant="outline"
              onClick={() => document.getElementById('weight-file-upload')?.click()}
              data-testid="button-upload-weight-data"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import RENPHO
            </Button>

            {/* Export CSV */}
            <Button
              variant="outline"
              onClick={exportCSV}
              disabled={weightEntries.length === 0}
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            {/* Add Entry Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-add-weight-entry">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Health Data Entry</DialogTitle>
                </DialogHeader>
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        value={newEntry.time}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, time: e.target.value }))}
                        placeholder="9:15:29 AM"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bodyFat">Body Fat %</Label>
                      <Input
                        id="bodyFat"
                        type="number"
                        step="0.1"
                        value={newEntry.bodyFat}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, bodyFat: e.target.value }))}
                        placeholder="15.1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="muscleMass">Muscle Mass (lbs)</Label>
                      <Input
                        id="muscleMass"
                        type="number"
                        step="0.1"
                        value={newEntry.muscleMass}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, muscleMass: e.target.value }))}
                        placeholder="139.4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bmi">BMI</Label>
                      <Input
                        id="bmi"
                        type="number"
                        step="0.1"
                        value={newEntry.bmi}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, bmi: e.target.value }))}
                        placeholder="27.1"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddEntry} 
                    disabled={createMutation.isPending}
                    className="w-full"
                  >
                    Add Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Date Range Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="180">6 Months</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Chart Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-weight" 
                  checked={showWeight} 
                  onCheckedChange={(checked) => setShowWeight(!!checked)} 
                />
                <Label htmlFor="show-weight" className="text-sm">Weight</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-bodyfat" 
                  checked={showBodyFat} 
                  onCheckedChange={(checked) => setShowBodyFat(!!checked)} 
                />
                <Label htmlFor="show-bodyfat" className="text-sm">Body Fat %</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-muscle" 
                  checked={showMuscleMass} 
                  onCheckedChange={(checked) => setShowMuscleMass(!!checked)} 
                />
                <Label htmlFor="show-muscle" className="text-sm">Muscle Mass</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-bmi" 
                  checked={showBMI} 
                  onCheckedChange={(checked) => setShowBMI(!!checked)} 
                />
                <Label htmlFor="show-bmi" className="text-sm">BMI</Label>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredData.length > 0 && (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Weight:</span> {filteredData[filteredData.length - 1]?.weight} lbs
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Body Fat:</span> {filteredData[filteredData.length - 1]?.bodyFat || "N/A"}%
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Change:</span> {
                      filteredData.length > 1 
                        ? `${((filteredData[filteredData.length - 1]?.weight || 0) - (filteredData[0]?.weight || 0)).toFixed(1)} lbs`
                        : "N/A"
                    }
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Entries Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Data Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Total Entries:</span> {weightEntries.length}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">In Range:</span> {filteredData.length}
              </div>
              {filteredData.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Latest:</span> {format(new Date(filteredData[filteredData.length - 1]?.fullDate), "MMM dd")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interactive Chart */}
        {filteredData.length > 0 ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Health Progress Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="weight" orientation="left" />
                  <YAxis yAxisId="percent" orientation="right" />
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
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Health Data</h3>
              <p className="text-muted-foreground mb-4">Start tracking your health metrics by adding your first entry or importing a RENPHO CSV file.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Add First Entry</Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Health Data Entries ({weightEntries.length})</CardTitle>
          </CardHeader>
          <CardContent>
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
        </Card>

        {/* RENPHO CSV Format Information (moved to bottom) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">RENPHO CSV Format Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Import Instructions:</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You can import your RENPHO health data by exporting from the RENPHO app and uploading the CSV file here. 
                  The system will automatically parse all health metrics including weight, body fat, muscle mass, BMI, and more.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Expected CSV Format:</h4>
                <div className="bg-muted p-3 rounded-md overflow-x-auto">
                  <code className="text-xs whitespace-pre">
{`Date, Time, Weight(lb),Body Fat(%),Fat-Free Mass(lb),Muscle Mass(lb),BMI,Subcutaneous Fat(%),Skeletal Muscle(%),...
8/24/25,11:52:37 AM,166.4,15.0,141.4,134.2,26.8,12.4,54.9,61.4,9,7.2,19.4,1769,31,--,--,--,--,--,--
8/21/25,7:47:06 AM,167.4,15.1,142.0,135.0,27.0,12.5,54.8,61.3,10,7.0,19.4,1747,31,--,--,--,--,--,--`}
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Export Template:</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use the "Export CSV" button above to download your current data in RENPHO format. 
                  You can then edit this file and re-import it to update or add new entries.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}