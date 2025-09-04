import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, FileText, Activity, Droplets, FileDown, MessageSquare, Settings, Lock } from "lucide-react";
import { type Exercise, type WeightEntry, type Quote, type ShortcutSettings, type TabSettings } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { UniversalNavigation } from "@/components/UniversalNavigation";

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

  const { data: tabSettings = [] } = useQuery<TabSettings[]>({
    queryKey: ["/api/tab-settings"],
  });

  const updateShortcutMutation = useMutation({
    mutationFn: async ({ shortcutKey, isVisible }: { shortcutKey: string; isVisible: boolean }) => {
      return apiRequest("PATCH", `/api/shortcut-settings/${shortcutKey}`, { isVisible: isVisible ? 1 : 0 });
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

  const updateTabMutation = useMutation({
    mutationFn: async ({ tabKey, isVisible }: { tabKey: string; isVisible: boolean }) => {
      return apiRequest("PATCH", `/api/tab-settings/${tabKey}`, { isVisible: isVisible ? 1 : 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tab-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tab-settings/visible"] });
      toast({
        title: "Settings Updated",
        description: "Tab visibility settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tab settings",
        variant: "destructive",
      });
    },
  });

  const handleTabToggle = (tabKey: string, isVisible: boolean) => {
    updateTabMutation.mutate({ tabKey, isVisible });
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
    const sampleRows = [
      '2025-01-09|08:30|185.5|15.2|150.3',
      '2025-01-08|08:15|186.0|15.4|149.8',
      '2025-01-07|08:20|186.3|15.6|149.5'
    ];
    
    const content = sampleRows.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'weight-import-template.txt';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Weight import template downloaded (DATE|TIME|WEIGHT|BODYFATPERCENTAGE|LEANMASS format)",
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
      const createdAt = exercise.createdAt ? new Date(exercise.createdAt).toISOString() : new Date().toISOString();
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
      const date = new Date(entry.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '/');
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
        apiRequest("DELETE", `/api/exercises/${exercise.id}`)
      );
      await Promise.all(deletePromises);

      // Import new exercises
      const importPromises = rows.map((row: any) => 
        apiRequest("POST", "/api/exercises", {
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
        description: "Please paste weight data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const lines = weightImportData.trim().split('\n');
      if (lines.length < 1) {
        throw new Error("Data must have at least one row");
      }
      
      const rows = lines.map(line => {
        const values = line.split('|').map(v => v.trim());
        
        if (values.length < 5) {
          throw new Error("Each line must have 5 pipe-separated values: DATE|TIME|WEIGHT|BODYFATPERCENTAGE|LEANMASS");
        }
        
        const [rawDate, rawTime, weight, bodyFat, leanMass] = values;
        
        // Convert date from M/D/YY to YYYY-MM-DD
        let formattedDate = rawDate;
        const dateMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (dateMatch) {
          const [, month, day, year] = dateMatch;
          const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`; // Assume 00-49 is 2000s, 50-99 is 1900s
          formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else if (!rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          throw new Error(`Invalid date format "${rawDate}". Use M/D/YY or YYYY-MM-DD format.`);
        }
        
        // Convert time from 12-hour to 24-hour format if needed
        let formattedTime = rawTime;
        const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (timeMatch) {
          const [, hours, minutes, period] = timeMatch;
          let hour24 = parseInt(hours);
          if (period.toUpperCase() === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          formattedTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        } else if (rawTime.match(/^\d{1,2}:\d{2}$/)) {
          // Handle 24-hour format - just ensure proper padding
          const [hours, minutes] = rawTime.split(':');
          formattedTime = `${hours.padStart(2, '0')}:${minutes}`;
        } else {
          throw new Error(`Invalid time format "${rawTime}". Use HH:MM or H:MM AM/PM format.`);
        }
        
        // Handle null or numeric body fat percentage
        let parsedBodyFat = 0;
        if (bodyFat.toLowerCase() === 'null' || bodyFat === '') {
          parsedBodyFat = 0;
        } else {
          parsedBodyFat = parseFloat(bodyFat);
          if (isNaN(parsedBodyFat)) {
            throw new Error(`Invalid body fat value "${bodyFat}". Use a number or "null".`);
          }
        }

        // Handle null or numeric lean mass
        let parsedLeanMass = 0;
        if (leanMass.toLowerCase() === 'null' || leanMass === '') {
          parsedLeanMass = 0;
        } else {
          parsedLeanMass = parseFloat(leanMass);
          if (isNaN(parsedLeanMass)) {
            throw new Error(`Invalid lean mass value "${leanMass}". Use a number or "null".`);
          }
        }
        
        return {
          date: formattedDate,
          time: formattedTime,
          weight: parseFloat(weight),
          bodyFat: parsedBodyFat,
          fatFreeMass: parsedLeanMass
        };
      });

      // Validate numeric values
      rows.forEach((row, index) => {
        if (isNaN(row.weight) || row.weight <= 0) {
          throw new Error(`Invalid weight value on line ${index + 1}: "${row.weight}"`);
        }
        if (isNaN(row.bodyFat) || row.bodyFat < 0 || row.bodyFat > 100) {
          throw new Error(`Invalid body fat percentage on line ${index + 1}: "${row.bodyFat}"`);
        }
        if (isNaN(row.fatFreeMass) || row.fatFreeMass < 0) {
          throw new Error(`Invalid lean mass value on line ${index + 1}: "${row.fatFreeMass}"`);
        }
      });

      // Clear existing weight entries first
      const deletePromises = weightEntries.map(entry => 
        apiRequest("DELETE", `/api/weight-entries/${entry.id}`)
      );
      await Promise.all(deletePromises);

      // Import new weight entries
      const importPromises = rows.map((row) => 
        apiRequest("POST", "/api/weight-entries", {
          date: row.date,
          time: row.time,
          weight: row.weight,
          bodyFat: row.bodyFat,
          fatFreeMass: row.leanMass,
          muscleMass: row.leanMass, // Using lean mass for muscle mass
          bmi: 0, // Will be calculated if needed
          subcutaneousFat: 0,
          skeletalMuscle: 0,
          bodyWater: 0,
          visceralFat: 0,
          boneMass: 0,
          protein: 0,
          bmr: 0,
          metabolicAge: 0
        })
      );
      await Promise.all(importPromises);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      
      toast({
        title: "Import Successful",
        description: `${rows.length} weight entries imported`,
      });
      setWeightImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid data format",
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
            isActive: 1
          });
        }
      }
      
      if (parsedQuotes.length === 0) {
        throw new Error('No valid quotes found. Expected format: "Quote text" - Author');
      }

      // Clear existing quotes first
      const deletePromises = quotes.map(quote => 
        apiRequest("DELETE", `/api/quotes/${quote.id}`)
      );
      await Promise.all(deletePromises);

      // Import new quotes
      const importPromises = parsedQuotes.map(quote => 
        apiRequest("POST", "/api/quotes", quote)
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
      <UniversalNavigation />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" data-testid="heading-admin">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Export and import your gym data in bulk
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Workout Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Workout Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
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
                  className="min-h-[80px] sm:min-h-[100px] font-mono text-xs sm:text-sm"
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
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
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
                  placeholder="Paste your weight data here...\nFormat: DATE|TIME|WEIGHT|BODYFATPERCENTAGE|LEANMASS\nExample: 5/6/25|06:05|177.4|15.7|null\nSupports: M/D/YY dates, 24-hour time, and null values"
                  value={weightImportData}
                  onChange={(e) => setWeightImportData(e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] font-mono text-xs sm:text-sm"
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
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {shortcutSettings.map((shortcut) => (
                  <button
                    key={shortcut.shortcutKey}
                    onClick={() => handleShortcutToggle(shortcut.shortcutKey, shortcut.isVisible !== 1)}
                    disabled={updateShortcutMutation.isPending}
                    className={`
                      relative p-4 sm:p-6 rounded-xl transition-all duration-300 cursor-pointer group aspect-square
                      backdrop-blur-lg border shadow-2xl
                      ${shortcut.isVisible === 1
                        ? 'bg-green-100/20 dark:bg-green-950/20 border-green-300/30 dark:border-green-700/40 text-green-700 dark:text-green-300 shadow-green-400/20' 
                        : 'bg-red-100/20 dark:bg-red-950/20 border-red-300/30 dark:border-red-700/40 text-red-700 dark:text-red-300 shadow-red-400/20'
                      }
                      hover:-translate-y-1 hover:scale-105 hover:shadow-3xl
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
                    `}
                    data-testid={`button-shortcut-${shortcut.shortcutKey}`}
                  >
                    {/* Status indicator circle */}
                    <div className={`
                      absolute top-3 right-3 w-4 h-4 rounded-full border-2 transition-colors
                      ${shortcut.isVisible === 1
                        ? 'bg-green-500 border-green-600 shadow-green-400/50' 
                        : 'bg-red-500 border-red-600 shadow-red-400/50'
                      }
                      shadow-lg
                    `} />
                    
                    {/* Main content */}
                    <div className="text-left space-y-1 sm:space-y-2">
                      <h3 className="font-semibold text-sm sm:text-base">{shortcut.shortcutName}</h3>
                      <p className="text-xs sm:text-sm opacity-70">{shortcut.routePath}</p>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium">
                        <div className={`
                          w-2 h-2 rounded-full
                          ${shortcut.isVisible === 1 ? 'bg-green-500' : 'bg-red-500'}
                        `} />
                        {shortcut.isVisible === 1 ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>
                    
                    {/* 3D Glass Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-black/5 dark:from-gray-300/15 dark:to-gray-700/5 rounded-xl"></div>
                    
                    {/* Inner Glass Highlight */}
                    <div className="absolute inset-0.5 bg-gradient-to-b from-white/20 to-transparent dark:from-gray-300/20 rounded-xl opacity-50"></div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              {shortcutSettings.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Loading shortcut settings...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Navigation Tab Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Navigation Tab Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Control which navigation tabs are visible in the header. Toggle any tab on or off to customize your navigation menu.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {tabSettings.map((tab) => {
                  const isHomeTab = tab.tabKey === 'home';
                  const isAdminTab = tab.tabKey === 'admin';
                  const isLockedTab = isHomeTab || isAdminTab;
                  const isDisabled = updateTabMutation.isPending || isLockedTab;
                  
                  return (
                    <button
                    key={tab.tabKey}
                    onClick={() => !isLockedTab && handleTabToggle(tab.tabKey, tab.isVisible !== 1)}
                    disabled={isDisabled}
                    className={`
                      relative p-6 rounded-xl transition-all duration-300 group aspect-square
                      backdrop-blur-lg border shadow-2xl
                      ${tab.isVisible === 1
                        ? 'bg-green-100/20 dark:bg-green-950/20 border-green-300/30 dark:border-green-700/40 text-green-700 dark:text-green-300 shadow-green-400/20' 
                        : 'bg-red-100/20 dark:bg-red-950/20 border-red-300/30 dark:border-red-700/40 text-red-700 dark:text-red-300 shadow-red-400/20'
                      }
                      ${!isLockedTab ? 'cursor-pointer hover:-translate-y-1 hover:scale-105 hover:shadow-3xl' : 'cursor-not-allowed'}
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
                      ${isLockedTab ? 'opacity-75' : ''}
                    `}
                    data-testid={`button-tab-${tab.tabKey}`}
                  >
                    {/* Status indicator circle */}
                    <div className={`
                      absolute top-3 right-3 w-4 h-4 rounded-full border-2 transition-colors
                      ${tab.isVisible === 1
                        ? 'bg-green-500 border-green-600 shadow-green-400/50' 
                        : 'bg-red-500 border-red-600 shadow-red-400/50'
                      }
                      shadow-lg
                    `} />
                    
                    {/* Main content */}
                    <div className="text-left space-y-2">
                      <h3 className="font-semibold text-base">{tab.tabName}</h3>
                      <p className="text-sm opacity-70">{tab.routePath}</p>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className={`
                          w-2 h-2 rounded-full
                          ${tab.isVisible === 1 ? 'bg-green-500' : 'bg-red-500'}
                        `} />
                        {tab.isVisible === 1 ? 'VISIBLE' : 'HIDDEN'}
                        {isLockedTab && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/70 ml-1">
                            <Lock className="w-3 h-3" />
                            (Locked)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 3D Glass Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-black/5 dark:from-gray-300/15 dark:to-gray-700/5 rounded-xl"></div>
                    
                    {/* Inner Glass Highlight */}
                    <div className="absolute inset-0.5 bg-gradient-to-b from-white/20 to-transparent dark:from-gray-300/20 rounded-xl opacity-50"></div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  );
                })}
              </div>
              {tabSettings.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Loading tab settings...
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