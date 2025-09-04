import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, FileText, Activity, Droplets, FileDown, MessageSquare, Settings } from "lucide-react";
import { type Exercise, type WeightEntry, type Quote, type ShortcutSettings } from "@shared/schema";
import { Switch } from "@/components/ui/switch";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workoutImportData, setWorkoutImportData] = useState("");
  const [weightImportData, setWeightImportData] = useState("");
  const [quotesImportData, setQuotesImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: weightEntries = [] } = useQuery<WeightEntry[]>({
    queryKey: ["/api/weight-entries"],
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: shortcutSettings = [] } = useQuery<ShortcutSettings[]>({
    queryKey: ["/api/shortcut-settings"],
  });

  const updateShortcutMutation = useMutation({
    mutationFn: async ({ shortcutKey, isVisible }: { shortcutKey: string; isVisible: boolean }) => {
      return apiRequest(`/api/shortcut-settings/${shortcutKey}`, {
        method: "PATCH",
        body: { isVisible: isVisible ? 1 : 0 }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shortcut-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shortcut-settings/visible"] });
      toast({
        title: "Settings Updated",
        description: "Shortcut visibility settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shortcut settings",
        variant: "destructive",
      });
    },
  });

  const handleShortcutToggle = (shortcutKey: string, isVisible: boolean) => {
    updateShortcutMutation.mutate({ shortcutKey, isVisible });
  };

  const downloadWorkoutTemplate = () => {
    const csvHeaders = 'name,category,weight,reps,notes,duration,distance,pace,calories,rpe,createdAt';
    const sampleRows = [
      '"Flat Dumbbell Press","push",80,6,"Good form","","","",0,0,"2025-01-24T12:00:00.000Z"',
      '"Cardio Run","cardio",0,0,"Morning run","30:00","3.5 miles","8:34/mi",350,7,"2025-01-24T07:00:00.000Z"',
      '"Lat Pulldown","pull",150,8,"Focus on squeeze","","","",0,0,"2025-01-24T12:15:00.000Z"'
    ];
    
    const csvContent = [csvHeaders, ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workout-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Workout import template CSV file downloaded",
    });
  };

  const downloadWeightTemplate = () => {
    const csvHeaders = 'Date,Time,Weight(lb),Body Fat(%),Fat-Free Mass(lb),Muscle Mass(lb),BMI,Subcutaneous Fat(%),Skeletal Muscle(%),Body Water(%),Visceral Fat,Bone Mass(lb),Protein (%),BMR(kcal),Metabolic Age';
    const sampleRows = [
      '8/24/25,11:52:37 AM,166.4,15.0,141.4,134.2,26.8,12.4,54.9,61.4,9,7.2,19.4,1769,31',
      '8/21/25,7:47:06 AM,167.4,15.1,142.0,135.0,27.0,12.5,54.8,61.3,10,7.0,19.4,1747,31',
      '8/18/25,8:15:22 AM,168.2,15.3,142.8,135.8,27.1,12.7,54.7,61.2,10,7.0,19.3,1752,31'
    ];
    
    const csvContent = [csvHeaders, ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'weight-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Weight import template CSV file downloaded (RENPHO format)",
    });
  };

  const exportWorkouts = () => {
    if (exercises.length === 0) {
      toast({
        title: "No Data",
        description: "No exercises to export",
        variant: "destructive",
      });
      return;
    }
    
    const csvHeaders = 'name,category,weight,reps,notes,duration,distance,pace,calories,rpe,createdAt';
    const csvRows = exercises.map(exercise => {
      const createdAt = new Date(exercise.createdAt).toISOString();
      return `"${exercise.name}","${exercise.category}",${exercise.weight || 0},${exercise.reps || 0},"${(exercise.notes || '').replace(/"/g, '""')}","${exercise.duration || ''}","${exercise.distance || ''}","${exercise.pace || ''}",${exercise.calories || 0},${exercise.rpe || 0},"${createdAt}"`;
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visbal-gym-workouts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Workouts Exported",
      description: `${exercises.length} exercises exported to CSV`,
    });
  };

  const exportWeights = () => {
    if (weightEntries.length === 0) {
      toast({
        title: "No Data",
        description: "No weight entries to export",
        variant: "destructive",
      });
      return;
    }
    
    const csvHeaders = 'Date,Time,Weight(lb),Body Fat(%),Fat-Free Mass(lb),Muscle Mass(lb),BMI,Subcutaneous Fat(%),Skeletal Muscle(%),Body Water(%),Visceral Fat,Bone Mass(lb),Protein (%),BMR(kcal),Metabolic Age';
    const csvRows = weightEntries.map(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', { month: '1-2', day: '1-2', year: '2-digit' }).replace(/\//g, '/');
      const time = entry.time || '12:00:00 PM';
      return `${date},${time},${entry.weight || 0},${entry.bodyFat || 0},${entry.fatFreeMass || 0},${entry.muscleMass || 0},${entry.bmi || 0},${entry.subcutaneousFat || 0},${entry.skeletalMuscle || 0},${entry.bodyWater || 0},${entry.visceralFat || 0},${entry.boneMass || 0},${entry.protein || 0},${entry.bmr || 0},${entry.metabolicAge || 0}`;
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visbal-gym-weights-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Weight Data Exported",
      description: `${weightEntries.length} weight entries exported to CSV`,
    });
  };

  const importWorkouts = async () => {
    if (!workoutImportData.trim()) {
      toast({
        title: "Error",
        description: "Please paste workout CSV data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const lines = workoutImportData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("CSV must have at least header and one data row");
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['name', 'category', 'weight', 'reps', 'notes', 'duration', 'distance', 'pace', 'calories', 'rpe'];
      
      if (!expectedHeaders.every(header => headers.includes(header))) {
        throw new Error(`CSV must include headers: ${expectedHeaders.join(', ')}`);
      }
      
      const rows = lines.slice(1).map(line => {
        const values = line.match(/([^,"]+|"[^"]*")/g) || [];
        const row: any = {};
        headers.forEach((header, index) => {
          let value = values[index]?.trim() || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          row[header] = value;
        });
        return row;
      });

      // Clear existing exercises first
      const deletePromises = exercises.map(exercise => 
        apiRequest(`/api/exercises/${exercise.id}`, {
          method: "DELETE",
        })
      );
      await Promise.all(deletePromises);

      // Import new exercises
      const importPromises = rows.map((row: any) => 
        apiRequest("/api/exercises", {
          method: "POST",
          body: JSON.stringify({
            name: row.name || '',
            weight: parseFloat(row.weight) || 0,
            reps: parseInt(row.reps) || 0,
            notes: row.notes || "",
            category: row.category || 'push',
            duration: row.duration || "",
            distance: row.distance || "",
            pace: row.pace || "",
            calories: parseInt(row.calories) || 0,
            rpe: parseInt(row.rpe) || 0
          }),
        })
      );
      await Promise.all(importPromises);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      
      toast({
        title: "Import Successful",
        description: `${rows.length} exercises imported from CSV`,
      });
      setWorkoutImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid CSV format",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const importWeights = async () => {
    if (!weightImportData.trim()) {
      toast({
        title: "Error", 
        description: "Please paste weight CSV data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const lines = weightImportData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("CSV must have at least header and one data row");
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['Date', 'Time', 'Weight(lb)', 'Body Fat(%)', 'Muscle Mass(lb)', 'BMI'];
      
      if (!expectedHeaders.every(header => headers.includes(header))) {
        throw new Error(`CSV must include headers: ${expectedHeaders.join(', ')}`);
      }
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim();
        });
        return row;
      });

      // Clear existing weight entries first
      const deletePromises = weightEntries.map(entry => 
        apiRequest(`/api/weight-entries/${entry.id}`, {
          method: "DELETE",
        })
      );
      await Promise.all(deletePromises);

      // Import new weight entries
      const importPromises = rows.map((row: any) => 
        apiRequest("/api/weight-entries", {
          method: "POST",
          body: JSON.stringify({
            date: row['Date'] || '',
            time: row['Time'] || '',
            weight: parseFloat(row['Weight(lb)']) || 0,
            bodyFat: parseFloat(row['Body Fat(%)']) || 0,
            fatFreeMass: parseFloat(row['Fat-Free Mass(lb)']) || 0,
            muscleMass: parseFloat(row['Muscle Mass(lb)']) || 0,
            bmi: parseFloat(row['BMI']) || 0,
            subcutaneousFat: parseFloat(row['Subcutaneous Fat(%)']) || 0,
            skeletalMuscle: parseFloat(row['Skeletal Muscle(%)']) || 0,
            bodyWater: parseFloat(row['Body Water(%)']) || 0,
            visceralFat: parseInt(row['Visceral Fat']) || 0,
            boneMass: parseFloat(row['Bone Mass(lb)']) || 0,
            protein: parseFloat(row['Protein (%)']) || 0,
            bmr: parseInt(row['BMR(kcal)']) || 0,
            metabolicAge: parseInt(row['Metabolic Age']) || 0
          }),
        })
      );
      await Promise.all(importPromises);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      
      toast({
        title: "Import Successful",
        description: `${rows.length} weight entries imported from CSV`,
      });
      setWeightImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid CSV format",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadQuotesTemplate = () => {
    const sampleQuotes = [
      '"The only way to do great work is to love what you do." - Steve Jobs',
      '"Success isn\'t always about greatness. It\'s about consistency." - Dwayne Johnson',
      '"Discipline is choosing between what you want now and what you want most." - Abraham Lincoln',
      '"Fear = Fuel" - Me',
      '"OUT WORK, OUT BELIEVE" - Me'
    ];
    
    const textContent = sampleQuotes.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes-import-template.txt';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Quotes import template text file downloaded",
    });
  };

  const exportQuotes = () => {
    if (quotes.length === 0) {
      toast({
        title: "No Data",
        description: "No quotes to export",
        variant: "destructive",
      });
      return;
    }

    // Export in your preferred format: "Quote text" - Author
    const textContent = quotes.map(quote => {
      return `"${quote.text}" - ${quote.author}`;
    }).join('\n');
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quotes-export-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `${quotes.length} quotes exported to text file`,
    });
  };

  const importQuotes = async () => {
    if (!quotesImportData.trim()) {
      toast({
        title: "Error", 
        description: "Please paste quotes text data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const lines = quotesImportData.trim().split('\n');
      if (lines.length < 1) {
        throw new Error("Must have at least one quote to import");
      }
      
      const parsedQuotes = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Parse format: "Quote text" - Author
        const match = trimmedLine.match(/^"(.+?)"\s*-\s*(.+)$/);
        if (match) {
          const [, text, author] = match;
          parsedQuotes.push({
            text: text.trim(),
            author: author.trim(),
            category: 'motivational', // Default category
            isActive: true
          });
        }
      }
      
      if (parsedQuotes.length === 0) {
        throw new Error('No valid quotes found. Expected format: "Quote text" - Author');
      }

      // Clear existing quotes first
      const deletePromises = quotes.map(quote => 
        apiRequest(`/api/quotes/${quote.id}`, {
          method: "DELETE",
        })
      );
      await Promise.all(deletePromises);

      // Import new quotes
      const importPromises = parsedQuotes.map(quote => 
        apiRequest("/api/quotes", {
          method: "POST",
          body: JSON.stringify(quote),
        })
      );
      await Promise.all(importPromises);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      
      toast({
        title: "Import Successful",
        description: `${parsedQuotes.length} quotes imported successfully`,
      });
      setQuotesImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid text format",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="heading-admin">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Export and import your gym data in bulk
          </p>
        </div>

        <div className="grid gap-6">
          {/* Workout Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Workout Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={exportWorkouts}
                  className="flex items-center gap-2"
                  data-testid="button-export-workouts"
                >
                  <Download className="w-4 h-4" />
                  Export All Workouts
                </Button>
                <Button 
                  onClick={downloadWorkoutTemplate}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-download-workout-template"
                >
                  <FileDown className="w-4 h-4" />
                  Download Template
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  ({exercises.length} exercises)
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workout-import">Import Workout Data</Label>
                <Textarea
                  id="workout-import"
                  placeholder="Paste your workout export CSV here...\nFormat: name,category,weight,reps,notes,duration,distance,pace,calories,rpe"
                  value={workoutImportData}
                  onChange={(e) => setWorkoutImportData(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
                <Button 
                  onClick={importWorkouts}
                  disabled={isImporting || !workoutImportData.trim()}
                  className="flex items-center gap-2"
                  variant="outline"
                  data-testid="button-import-workouts"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? "Importing..." : "Import Workouts"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  ⚠️ This will replace ALL existing workout data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weight Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Weight Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={exportWeights}
                  className="flex items-center gap-2"
                  data-testid="button-export-weights"
                >
                  <Download className="w-4 h-4" />
                  Export Weight Data
                </Button>
                <Button 
                  onClick={downloadWeightTemplate}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-download-weight-template"
                >
                  <FileDown className="w-4 h-4" />
                  Download Template
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  ({weightEntries.length} entries)
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight-import">Import Weight Data</Label>
                <Textarea
                  id="weight-import"
                  placeholder="Paste your weight export CSV here...\nFormat: Date,Time,Weight(lb),Body Fat(%),Fat-Free Mass(lb),Muscle Mass(lb),BMI,..."
                  value={weightImportData}
                  onChange={(e) => setWeightImportData(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
                <Button 
                  onClick={importWeights}
                  disabled={isImporting || !weightImportData.trim()}
                  className="flex items-center gap-2"
                  variant="outline"
                  data-testid="button-import-weights"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? "Importing..." : "Import Weight Data"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  ⚠️ This will replace ALL existing weight data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quotes Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Quotes Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={exportQuotes}
                  className="flex items-center gap-2"
                  data-testid="button-export-quotes"
                >
                  <Download className="w-4 h-4" />
                  Export Quotes
                </Button>
                <Button 
                  onClick={downloadQuotesTemplate}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-download-quotes-template"
                >
                  <FileDown className="w-4 h-4" />
                  Download Template
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  ({quotes.length} quotes)
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quotes-import">Import Quotes Data</Label>
                <Textarea
                  id="quotes-import"
                  placeholder={`Paste your quotes here...
Format: "Quote text" - Author
Example:
"The only way to do great work is to love what you do." - Steve Jobs
"Fear = Fuel" - Me`}
                  value={quotesImportData}
                  onChange={(e) => setQuotesImportData(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
                <Button 
                  onClick={importQuotes}
                  disabled={isImporting || !quotesImportData.trim()}
                  className="flex items-center gap-2"
                  variant="outline"
                  data-testid="button-import-quotes"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? "Importing..." : "Import Quotes"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  ⚠️ This will replace ALL existing quotes data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Home Screen Shortcut Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Home Screen Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Control which shortcuts appear on the home screen. Toggle any shortcut on or off to customize your main navigation.
              </p>
              <div className="space-y-3">
                {shortcutSettings.map((shortcut) => (
                  <div key={shortcut.shortcutKey} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{shortcut.shortcutName}</span>
                      <span className="text-sm text-muted-foreground">({shortcut.routePath})</span>
                    </div>
                    <Switch
                      checked={shortcut.isVisible === 1}
                      onCheckedChange={(checked) => handleShortcutToggle(shortcut.shortcutKey, checked)}
                      disabled={updateShortcutMutation.isPending}
                      data-testid={`switch-shortcut-${shortcut.shortcutKey}`}
                    />
                  </div>
                ))}
              </div>
              {shortcutSettings.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Loading shortcut settings...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Data Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                CSV Export/Import Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Workout CSV Format:</h4>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`name,category,weight,reps,notes,duration,distance,pace,calories,rpe,createdAt
"Flat Dumbbell Press","push",80,6,"80, 75 lbs | 5–7 reps","","","",0,0,"2025-01-24T12:00:00.000Z"
"Incline Dumbbell Press","push",70,10,"Good form","","","",0,0,"2025-01-24T12:05:00.000Z"
"Cardio Run","cardio",0,0,"Morning run","30:00","3.5 miles","8:34/mi",350,7,"2025-01-24T07:00:00.000Z"`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Weight CSV Format (RENPHO Compatible):</h4>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`Date,Time,Weight(lb),Body Fat(%),Fat-Free Mass(lb),Muscle Mass(lb),BMI,Subcutaneous Fat(%),Skeletal Muscle(%),Body Water(%),Visceral Fat,Bone Mass(lb),Protein (%),BMR(kcal),Metabolic Age
8/24/25,11:52:37 AM,166.4,15.0,141.4,134.2,26.8,12.4,54.9,61.4,9,7.2,19.4,1769,31
8/21/25,7:47:06 AM,167.4,15.1,142.0,135.0,27.0,12.5,54.8,61.3,10,7.0,19.4,1747,31`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Quotes Text Format:</h4>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`"Fear = Fuel" - Me
"OUT WORK, OUT BELIEVE" - Me
"The Gym Is the Only Place I Love to Be a Failure" - Me
"Control the Controlables" - Unknown
"It's Easy to Be on the Bottom. It Doesn't Take Any Effort to Be a Loser." - Unknown`}
                  </pre>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg dark:bg-blue-950">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Data Import Sources:</h5>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Weight Data:</strong> Import directly from RENPHO app CSV exports</li>
                    <li>• <strong>Blood Labs:</strong> Import directly from Rhythm Health platform exports</li>
                    <li>• <strong>Quotes:</strong> Import your custom motivational quotes in simple text format</li>
                    <li>• All exports work with Excel, Google Sheets, or other CSV apps</li>
                    <li>• All imports will replace existing data - backup first if needed</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}