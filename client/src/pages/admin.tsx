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
import { Download, Upload, Database, FileText, Activity, Droplets } from "lucide-react";
import { type Exercise, type WeightEntry } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workoutImportData, setWorkoutImportData] = useState("");
  const [weightImportData, setWeightImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: weightEntries = [] } = useQuery<WeightEntry[]>({
    queryKey: ["/api/weight-entries"],
  });

  const exportWorkouts = () => {
    const workoutData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      exercises: exercises
    };
    
    const dataStr = JSON.stringify(workoutData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `visbal-gym-workouts-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Workouts Exported",
      description: `${exercises.length} exercises exported successfully`,
    });
  };

  const exportWeights = () => {
    const weightData = {
      version: "1.0", 
      exportedAt: new Date().toISOString(),
      weightEntries: weightEntries
    };
    
    const dataStr = JSON.stringify(weightData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `visbal-gym-weights-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Weight Data Exported",
      description: `${weightEntries.length} weight entries exported successfully`,
    });
  };

  const importWorkouts = async () => {
    if (!workoutImportData.trim()) {
      toast({
        title: "Error",
        description: "Please paste workout data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const data = JSON.parse(workoutImportData);
      
      if (!data.exercises || !Array.isArray(data.exercises)) {
        throw new Error("Invalid format - missing exercises array");
      }

      // Clear existing exercises first
      const deletePromises = exercises.map(exercise => 
        apiRequest(`/api/exercises/${exercise.id}`, {
          method: "DELETE",
        })
      );
      await Promise.all(deletePromises);

      // Import new exercises
      const importPromises = data.exercises.map((exercise: any) => 
        apiRequest("/api/exercises", {
          method: "POST",
          body: JSON.stringify({
            name: exercise.name,
            weight: exercise.weight || 0,
            reps: exercise.reps || 0,
            notes: exercise.notes || "",
            category: exercise.category,
            duration: exercise.duration || "",
            distance: exercise.distance || "",
            pace: exercise.pace || "",
            calories: exercise.calories || 0,
            rpe: exercise.rpe || 0
          }),
        })
      );
      await Promise.all(importPromises);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      
      toast({
        title: "Import Successful",
        description: `${data.exercises.length} exercises imported successfully`,
      });
      setWorkoutImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid JSON format",
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
      const data = JSON.parse(weightImportData);
      
      if (!data.weightEntries || !Array.isArray(data.weightEntries)) {
        throw new Error("Invalid format - missing weightEntries array");
      }

      // Clear existing weight entries first
      const deletePromises = weightEntries.map(entry => 
        apiRequest(`/api/weight-entries/${entry.id}`, {
          method: "DELETE",
        })
      );
      await Promise.all(deletePromises);

      // Import new weight entries
      const importPromises = data.weightEntries.map((entry: any) => 
        apiRequest("/api/weight-entries", {
          method: "POST",
          body: JSON.stringify(entry),
        })
      );
      await Promise.all(importPromises);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      
      toast({
        title: "Import Successful",
        description: `${data.weightEntries.length} weight entries imported successfully`,
      });
      setWeightImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid JSON format",
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
              <div className="flex gap-2">
                <Button 
                  onClick={exportWorkouts}
                  className="flex items-center gap-2"
                  data-testid="button-export-workouts"
                >
                  <Download className="w-4 h-4" />
                  Export All Workouts
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  ({exercises.length} exercises)
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workout-import">Import Workout Data</Label>
                <Textarea
                  id="workout-import"
                  placeholder="Paste your workout export JSON here..."
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
              <div className="flex gap-2">
                <Button 
                  onClick={exportWeights}
                  className="flex items-center gap-2"
                  data-testid="button-export-weights"
                >
                  <Download className="w-4 h-4" />
                  Export Weight Data
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  ({weightEntries.length} entries)
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight-import">Import Weight Data</Label>
                <Textarea
                  id="weight-import"
                  placeholder="Paste your weight export JSON here..."
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

          {/* Data Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Export/Import Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Workout Export Format:</h4>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`{
  "version": "1.0",
  "exportedAt": "2025-01-24T...",
  "exercises": [
    {
      "name": "Flat Dumbbell Press",
      "weight": 80,
      "reps": 6,
      "notes": "80, 75 lbs | 5–7 reps",
      "category": "push",
      "duration": "",
      "distance": "",
      "pace": "",
      "calories": 0,
      "rpe": 0
    }
  ]
}`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Weight Export Format:</h4>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`{
  "version": "1.0",
  "exportedAt": "2025-01-24T...", 
  "weightEntries": [
    {
      "date": "2025-01-24T...",
      "weight": 175.2,
      "bodyFat": 15.8,
      "muscleMass": 147.1,
      "bmi": 24.2
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}