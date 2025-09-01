import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from "recharts";
import { Calendar, Upload, Plus, Trash2, Edit3 } from "lucide-react";
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

export default function WeightTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for chart controls
  const [dateRange, setDateRange] = useState(30); // days
  const [showWeight, setShowWeight] = useState(true);
  const [showBodyFat, setShowBodyFat] = useState(true);
  const [showMuscle, setShowMuscle] = useState(false);
  
  // Form state for adding new entries
  const [newEntry, setNewEntry] = useState({
    weight: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    bodyFat: "",
    muscle: "",
  });

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
        notes: "",
        bodyFat: "",
        muscle: "",
      });
      toast({
        title: "Weight entry added",
        description: "Your weight data has been recorded successfully.",
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
        description: "Weight entry has been removed.",
      });
    },
  });

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const cutoffDate = subDays(new Date(), dateRange);
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
      weight: parseInt(newEntry.weight),
      date: new Date(newEntry.date),
      notes: newEntry.notes,
      bodyFat: newEntry.bodyFat ? parseInt(newEntry.bodyFat) : undefined,
      muscle: newEntry.muscle ? parseInt(newEntry.muscle) : undefined,
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
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Expected format: date, weight, bodyFat, muscle, notes
        const entries: InsertWeightEntry[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          const entry: any = {
            date: new Date(values[0]),
            weight: parseInt(values[1]),
            notes: values[4] || "",
          };
          
          if (values[2]) entry.bodyFat = parseInt(values[2]);
          if (values[3]) entry.muscle = parseInt(values[3]);
          
          entries.push(entry);
        }

        // Create all entries
        entries.forEach(entry => {
          createMutation.mutate(entry);
        });

        toast({
          title: "File uploaded successfully",
          description: `Added ${entries.length} weight entries.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please check your file format. Expected: date,weight,bodyFat,muscle,notes",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
              Weight Tracking
            </h2>
            <p className="text-muted-foreground">Monitor your weight, body fat, and muscle mass over time</p>
          </div>
          
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
              Upload CSV
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
                  <DialogTitle>Add Weight Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (lbs) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={newEntry.weight}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="175"
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
                      <Label htmlFor="bodyFat">Body Fat %</Label>
                      <Input
                        id="bodyFat"
                        type="number"
                        value={newEntry.bodyFat}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, bodyFat: e.target.value }))}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="muscle">Muscle Mass (lbs)</Label>
                      <Input
                        id="muscle"
                        type="number"
                        value={newEntry.muscle}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, muscle: e.target.value }))}
                        placeholder="155"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Feeling strong today..."
                    />
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Date Range Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Date Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant={dateRange === 30 ? "default" : "outline"} 
                size="sm" 
                onClick={() => setDateRange(30)}
                className="w-full"
              >
                30 Days
              </Button>
              <Button 
                variant={dateRange === 90 ? "default" : "outline"} 
                size="sm" 
                onClick={() => setDateRange(90)}
                className="w-full"
              >
                90 Days
              </Button>
              <Button 
                variant={dateRange === 365 ? "default" : "outline"} 
                size="sm" 
                onClick={() => setDateRange(365)}
                className="w-full"
              >
                1 Year
              </Button>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Display Options</CardTitle>
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
                  checked={showMuscle} 
                  onCheckedChange={(checked) => setShowMuscle(!!checked)} 
                />
                <Label htmlFor="show-muscle" className="text-sm">Muscle Mass</Label>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredData.length > 0 && (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Current:</span> {filteredData[filteredData.length - 1]?.weight} lbs
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Change:</span> {
                      filteredData.length > 1 
                        ? `${(filteredData[filteredData.length - 1]?.weight || 0) - (filteredData[0]?.weight || 0)} lbs`
                        : "N/A"
                    }
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Entries:</span> {filteredData.length}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* File Upload Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CSV Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Expected format:</div>
                <code className="block bg-muted p-2 rounded">
                  date,weight,bodyFat,muscle,notes<br />
                  2024-01-01,175,12,155,"Good start"
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Chart */}
        {filteredData.length > 0 ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
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
                      `${value}${name === 'bodyFat' ? '%' : name === 'weight' || name === 'muscle' ? ' lbs' : ''}`,
                      name === 'bodyFat' ? 'Body Fat %' : name === 'muscle' ? 'Muscle Mass' : 'Weight'
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
                  {showMuscle && (
                    <Bar 
                      yAxisId="weight"
                      dataKey="muscle" 
                      fill="#16a34a" 
                      opacity={0.6}
                      name="muscle"
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
              <h3 className="text-lg font-semibold mb-2">No Weight Data</h3>
              <p className="text-muted-foreground mb-4">Start tracking your weight by adding your first entry or uploading a CSV file.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Add First Entry</Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Weight Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Weight (lbs)</TableHead>
                  <TableHead>Body Fat %</TableHead>
                  <TableHead>Muscle (lbs)</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weightEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No weight entries found. Add your first entry to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  weightEntries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{entry.weight}</TableCell>
                        <TableCell>{entry.bodyFat || "-"}</TableCell>
                        <TableCell>{entry.muscle || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.notes || "-"}</TableCell>
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
          </CardContent>
        </Card>
      </main>
    </>
  );
}