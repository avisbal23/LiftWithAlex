import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptimizedInput } from "@/components/optimized-input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import * as Portal from "@radix-ui/react-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, ChevronDown, ChevronUp, GripVertical, Download, Upload, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Exercise, type InsertExercise, type UpdateExercise, type InsertWorkoutLog, type DailySetProgress, type InsertChangesAudit } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import * as XLSX from 'xlsx';

interface WorkoutTableProps {
  category: string;
  title: string;
  description: string;
}

export default function WorkoutTable({ category, title, description }: WorkoutTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNotes, setSelectedNotes] = useState<{ exercise: string; notes: string } | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});
  const [exerciseEditStates, setExerciseEditStates] = useState<Record<string, { name: string; weight: string; reps: string; notes: string }>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const [editingExercises, setEditingExercises] = useState<Record<string, Partial<Exercise>>>({});
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [textInputs, setTextInputs] = useState<Record<string, Record<string, string>>>({});

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", category],
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Fetch daily set progress for this category
  const { data: dailyProgress = [] } = useQuery<DailySetProgress[]>({
    queryKey: ["/api/daily-set-progress", category],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/daily-set-progress/${category}`);
      return response.json();
    },
  });

  // Query to check if today's workout is already logged
  const { data: workoutStatus } = useQuery<{ isCompleted: boolean }>({
    queryKey: ["/api/daily-workout-status", category],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/daily-workout-status/${category}`);
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (exercise: InsertExercise) => {
      const response = await apiRequest("POST", "/api/exercises", exercise);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", category] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExercise }) => {
      const response = await apiRequest("PATCH", `/api/exercises/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedExercise) => {
      // Update the cache directly with the new data to avoid full refetch
      queryClient.setQueryData<Exercise[]>(["/api/exercises", category], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(exercise => 
          exercise.id === updatedExercise.id ? updatedExercise : exercise
        );
      });
      
      // Also update the global cache if it exists
      queryClient.setQueryData<Exercise[]>(["/api/exercises"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(exercise => 
          exercise.id === updatedExercise.id ? updatedExercise : exercise
        );
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", category] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({
        title: "Exercise deleted",
        description: "Exercise has been removed from your workout.",
      });
    },
  });

  const logWorkoutMutation = useMutation({
    mutationFn: async (workoutCategory: string) => {
      const response = await apiRequest("POST", "/api/workout-logs", { category: workoutCategory });
      return response.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs/latest"] });
      
      // Set today's workout as completed
      try {
        await apiRequest("POST", `/api/daily-workout-status/${category}`, { isCompleted: true });
        queryClient.invalidateQueries({ queryKey: ["/api/daily-workout-status", category] });
      } catch (error) {
        console.error("Failed to update workout status:", error);
      }
      
    },
  });

  // Tap to increment sets for an exercise (mobile tap-to-track)
  const tapSetMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      const response = await apiRequest("POST", `/api/daily-set-progress/tap/${exerciseId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-set-progress", category] });
    },
  });

  // Mutation for logging changes to the audit table
  const logChangeMutation = useMutation({
    mutationFn: async (auditEntry: InsertChangesAudit) => {
      const response = await apiRequest("POST", "/api/changes-audit", auditEntry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changes-audit"] });
    },
  });

  const getCategoryDisplayName = (cat: string) => {
    switch (cat) {
      case "chest": return "Chest Day";
      case "back": return "Back Day";
      case "arms": return "Arms Day";
      case "legs": return "Leg Day";
      case "pull2": return "BACK";
      case "legs2": return "Leg Day 2";
      case "core": return "Core";
      case "cardio": return "Cardio";
      default: return cat;
    }
  };

  // Helper function to get set progress for an exercise
  const getExerciseProgress = (exerciseId: string): DailySetProgress | undefined => {
    return dailyProgress.find(progress => progress.exerciseId === exerciseId);
  };

  // Helper function to get progress percentage
  const getProgressPercentage = (exerciseId: string): number => {
    const progress = getExerciseProgress(exerciseId);
    const sets = progress?.setsCompleted || 0;
    return Math.min(sets / 3 * 100, 100);
  };

  // Helper function to handle tap/click on exercise card
  const handleExerciseTap = (exerciseId: string) => {
    const progress = getExerciseProgress(exerciseId);
    const currentSets = progress?.setsCompleted || 0;
    
    // Only allow tapping if not already at max sets
    if (currentSets < 3) {
      tapSetMutation.mutate(exerciseId);
    }
  };

  const addNewExercise = () => {
    // Find the highest order value and add 1
    const maxOrder = exercises.reduce((max, exercise) => 
      Math.max(max, exercise.order || 0), 0
    );
    createMutation.mutate({
      name: "New Exercise",
      weight: 0,
      reps: 0,
      notes: "",
      category,
      order: maxOrder + 1,
    });
  };

  const updateExercise = useCallback((id: string, field: keyof UpdateExercise, value: string | number) => {
    // Get current exercise data before update for audit logging
    const currentExercise = exercises.find(ex => ex.id === id);
    
    updateMutation.mutate({
      id,
      data: { [field]: value },
    }, {
      onSuccess: (updatedExercise) => {
        // Log weight changes to audit table
        if (field === "weight" && currentExercise && typeof value === "number") {
          const previousWeight = currentExercise.weight || 0;
          const newWeight = value;
          
          // Only log if weight actually changed
          if (previousWeight !== newWeight && previousWeight > 0) {
            const percentageChange = ((newWeight - previousWeight) / previousWeight) * 100;
            
            logChangeMutation.mutate({
              exerciseId: id,
              exerciseName: currentExercise.name,
              previousWeight,
              newWeight,
              percentageIncrease: percentageChange,
              category: currentExercise.category,
            });
          }
        }
      }
    });
  }, [updateMutation, exercises, logChangeMutation]);

  const saveExercise = useCallback((exerciseId: string) => {
    const changes = editingExercises[exerciseId];
    if (changes && Object.keys(changes).length > 0) {
      updateMutation.mutate({
        id: exerciseId,
        data: changes as UpdateExercise,
      }, {
        onSuccess: () => {
          // Invalidate cache if order changed to trigger re-sort
          if (changes.order !== undefined) {
            queryClient.invalidateQueries({ queryKey: ["/api/exercises", category] });
          }
        }
      });
      // Clear local changes after saving
      setEditingExercises(prev => {
        const newState = { ...prev };
        delete newState[exerciseId];
        return newState;
      });
      toast({
        title: "Exercise saved",
        description: "Your changes have been saved successfully.",
      });
    }
  }, [editingExercises, updateMutation, toast, queryClient, category]);

  const hasChanges = useCallback((exerciseId: string) => {
    const changes = editingExercises[exerciseId];
    return changes && Object.keys(changes).length > 0;
  }, [editingExercises]);

  // Toggle exercise card collapse and auto-save
  const toggleExerciseCollapse = (exerciseId: string) => {
    const isCurrentlyOpen = collapsedExercises[exerciseId] || false;
    const editState = exerciseEditStates[exerciseId];
    
    // If closing and has pending changes, save them
    if (isCurrentlyOpen && editState) {
      const exercise = exercises.find(e => e.id === exerciseId);
      if (exercise) {
        const hasNameChange = editState.name !== exercise.name;
        const hasWeightChange = editState.weight !== String(exercise.weight || 0);
        const hasRepsChange = editState.reps !== String(exercise.reps || 0);
        const hasNotesChange = editState.notes !== (exercise.notes || "");
        
        if (hasNameChange || hasWeightChange || hasRepsChange || hasNotesChange) {
          const updates: Partial<Exercise> = {};
          if (hasNameChange) updates.name = editState.name;
          if (hasWeightChange) updates.weight = parseInt(editState.weight) || 0;
          if (hasRepsChange) updates.reps = parseInt(editState.reps) || 0;
          if (hasNotesChange) updates.notes = editState.notes;
          
          updateMutation.mutate({ id: exerciseId, data: updates });
        }
      }
      
      // Clear edit state when closing
      setExerciseEditStates(prev => {
        const newState = { ...prev };
        delete newState[exerciseId];
        return newState;
      });
    }
    
    // If opening, initialize edit state
    if (!isCurrentlyOpen) {
      const exercise = exercises.find(e => e.id === exerciseId);
      if (exercise) {
        setExerciseEditStates(prev => ({
          ...prev,
          [exerciseId]: {
            name: exercise.name,
            weight: String(exercise.weight || 0),
            reps: String(exercise.reps || 0),
            notes: exercise.notes || ""
          }
        }));
      }
    }
    
    setCollapsedExercises(prev => ({
      ...prev,
      [exerciseId]: !isCurrentlyOpen
    }));
  };

  // Update edit state for collapsible cards
  const updateEditState = (exerciseId: string, field: 'weight' | 'reps' | 'notes' | 'name', value: string) => {
    setExerciseEditStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }));
  };

  // Weight input handlers that commit on blur to prevent premature audit logging
  const handleWeightChange = useCallback((exerciseId: string, value: string) => {
    setWeightInputs(prev => ({ ...prev, [exerciseId]: value }));
  }, []);

  const commitWeightChange = useCallback((exerciseId: string, value: string) => {
    const numericValue = parseInt(value) || 0;
    updateExercise(exerciseId, "weight", numericValue);
    // Clear the local state after committing
    setWeightInputs(prev => {
      const newState = { ...prev };
      delete newState[exerciseId];
      return newState;
    });
  }, [updateExercise]);

  const getWeightValue = useCallback((exerciseId: string, exerciseWeight: number | null) => {
    // Use local editing state if available, otherwise use exercise weight
    return weightInputs[exerciseId] !== undefined ? weightInputs[exerciseId] : (exerciseWeight || 0).toString();
  }, [weightInputs]);

  // Text input handlers that commit on blur to prevent flickering
  const handleTextChange = useCallback((exerciseId: string, field: string, value: string) => {
    setTextInputs(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }));
  }, []);

  const commitTextChange = useCallback((exerciseId: string, field: keyof UpdateExercise, value: string) => {
    updateExercise(exerciseId, field, value);
    // Clear the local state after committing
    setTextInputs(prev => {
      const newState = { ...prev };
      if (newState[exerciseId]) {
        delete newState[exerciseId][field];
        // Clean up empty objects
        if (Object.keys(newState[exerciseId]).length === 0) {
          delete newState[exerciseId];
        }
      }
      return newState;
    });
  }, [updateExercise]);

  const getTextValue = useCallback((exerciseId: string, field: string, exerciseValue: string | null | undefined) => {
    // Use local editing state if available, otherwise use exercise value
    return textInputs[exerciseId]?.[field] !== undefined ? textInputs[exerciseId][field] : (exerciseValue || "");
  }, [textInputs]);

  // Simple debounced update for non-weight fields
  const debouncedUpdate = useCallback((id: string, field: keyof UpdateExercise, value: string | number) => {
    if (field === "weight") {
      // Weight fields should use the commit-on-blur approach instead
      console.warn("Weight field should use commitWeightChange, not debouncedUpdate");
      return;
    }
    
    const timeoutKey = `${id}-${field}`;
    if (timeoutRefs.current[timeoutKey]) {
      clearTimeout(timeoutRefs.current[timeoutKey]);
    }
    timeoutRefs.current[timeoutKey] = setTimeout(() => {
      updateExercise(id, field, value);
    }, 1000);
  }, [updateExercise]);

  const isCardio = category === "cardio";

  const toggleCardExpansion = (exerciseId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const deleteExercise = (id: string) => {
    if (confirm("Are you sure you want to delete this exercise?")) {
      deleteMutation.mutate(id);
    }
  };


  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Reorder exercises array
    const reorderedExercises = Array.from(exercises);
    const [removed] = reorderedExercises.splice(sourceIndex, 1);
    reorderedExercises.splice(destinationIndex, 0, removed);

    // Update order values based on new positions
    const updatesPromise = reorderedExercises.map((exercise, index) => {
      const newOrder = index + 1;
      if (exercise.order !== newOrder) {
        return updateMutation.mutateAsync({
          id: exercise.id,
          data: { order: newOrder },
        });
      }
      return Promise.resolve();
    });

    // Execute all updates and refresh the list
    Promise.all(updatesPromise).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", category] });
      toast({
        title: "Order updated",
        description: "Exercise order has been saved.",
      });
    });
  };

  // Export workout as CSV in ORDER|TITLE|WEIGHT|REPS|NOTES format
  const exportWorkoutCSV = () => {
    const sortedExercises = exercises
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const csvContent = [
      "ORDER|TITLE|WEIGHT|REPS|NOTES",
      ...sortedExercises.map(exercise => 
        `${exercise.order || 0}|${exercise.name}|${exercise.weight || 0}|${exercise.reps || 0}|${exercise.notes || ""}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}-workout-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Workout exported!",
      description: "CSV file saved to downloads.",
    });
  };

  // Parse data from different file types
  const parseFileData = async (file: File): Promise<string[]> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'xlsx') {
      // Handle XLSX files
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const workbook = XLSX.read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to array of arrays, then to pipe-delimited strings
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            const lines = jsonData
              .filter(row => row && row.length > 0) // Filter empty rows
              .map(row => {
                // Ensure we have 5 columns, fill missing ones with empty strings
                const paddedRow = [...row];
                while (paddedRow.length < 5) {
                  paddedRow.push('');
                }
                return paddedRow.slice(0, 5).join('|');
              });
            
            resolve(lines);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read XLSX file'));
        reader.readAsArrayBuffer(file);
      });
    } else {
      // Handle CSV and TXT files as text
      const text = await file.text();
      return text.split('\n').filter(line => line.trim() !== '');
    }
  };

  // Import workout from CSV, TXT, or XLSX
  const importWorkoutFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt,.xlsx';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const lines = await parseFileData(file);
        
        if (lines.length === 0) {
          toast({
            title: "Error",
            description: "File is empty.",
            variant: "destructive",
          });
          return;
        }

        // Skip header line if it exists
        const startIndex = lines[0].includes('ORDER|TITLE|WEIGHT|REPS|NOTES') ? 1 : 0;
        const dataLines = lines.slice(startIndex);

        if (dataLines.length === 0) {
          toast({
            title: "Error",
            description: "No data rows found in file.",
            variant: "destructive",
          });
          return;
        }

        // Show loading toast
        toast({
          title: "Importing...",
          description: `Clearing existing workouts and importing ${dataLines.length} exercises from ${file.name}.`,
        });

        // First, capture existing weights before deletion for delta tracking
        let existingWeights = new Map<string, number>();
        try {
          const existingExercises = await queryClient.fetchQuery({
            queryKey: ["/api/exercises", category],
          }) as Exercise[];

          // Store existing weights by exercise name for comparison
          existingExercises.forEach(exercise => {
            existingWeights.set(exercise.name, exercise.weight || 0);
          });

          // Delete all existing exercises in this category
          for (const exercise of existingExercises) {
            await apiRequest("DELETE", `/api/exercises/${exercise.id}`);
          }
        } catch (error) {
          console.error('Error clearing existing exercises:', error);
          toast({
            title: "Import failed",
            description: "Could not clear existing workouts. Please try again.",
            variant: "destructive",
          });
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        const importedExercises: Exercise[] = [];

        // Process imports with better error handling
        for (let index = 0; index < dataLines.length; index++) {
          const line = dataLines[index];
          try {
            const parts = line.split('|');
            if (parts.length < 5) {
              errors.push(`Line ${index + 1}: Invalid format (expected 5 columns)`);
              errorCount++;
              continue;
            }

            const [orderStr, title, weightStr, repsStr, notes] = parts;
            
            if (!title?.trim()) {
              errors.push(`Line ${index + 1}: Missing exercise title`);
              errorCount++;
              continue;
            }

            const exerciseData: InsertExercise = {
              name: title.trim(),
              category,
              weight: parseFloat(weightStr) || 0,
              reps: parseInt(repsStr) || 0,
              notes: notes?.trim() || "",
              order: parseInt(orderStr) || 0,
            };

            const response = await apiRequest("POST", "/api/exercises", exerciseData);
            const newExercise = await response.json() as Exercise;
            importedExercises.push(newExercise);
            successCount++;
          } catch (error) {
            console.error(`Error importing line ${index + 1}:`, error);
            errors.push(`Line ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            errorCount++;
          }
        }

        // Track weight changes and log to audit table
        let auditEntriesCount = 0;
        for (const newExercise of importedExercises) {
          const previousWeight = existingWeights.get(newExercise.name);
          
          if (previousWeight && newExercise.weight && newExercise.weight > previousWeight) {
            try {
              const percentageIncrease = ((newExercise.weight - previousWeight) / previousWeight) * 100;
              await apiRequest("POST", "/api/changes-audit", {
                exerciseId: newExercise.id,
                exerciseName: newExercise.name,
                previousWeight: previousWeight,
                newWeight: newExercise.weight,
                percentageIncrease: percentageIncrease,
                category: category
              });
              auditEntriesCount++;
            } catch (error) {
              console.error(`Error logging audit for ${newExercise.name}:`, error);
            }
          }
        }

        // Refresh both exercises and audit queries
        await queryClient.invalidateQueries({ queryKey: ["/api/exercises", category] });
        await queryClient.invalidateQueries({ queryKey: ["/api/changes-audit"] });
        
        // Show results with audit tracking information
        if (successCount > 0 && errorCount === 0) {
          const auditMessage = auditEntriesCount > 0 
            ? ` ${auditEntriesCount} weight increases tracked in audit.`
            : "";
          toast({
            title: "Import successful!",
            description: `Successfully imported ${successCount} exercises.${auditMessage}`,
          });
        } else if (successCount > 0 && errorCount > 0) {
          const auditMessage = auditEntriesCount > 0 
            ? ` ${auditEntriesCount} weight increases tracked.`
            : "";
          toast({
            title: "Partial import",
            description: `Imported ${successCount} exercises. ${errorCount} failed.${auditMessage}`,
            variant: "destructive",
          });
          console.log("Import errors:", errors);
        } else {
          toast({
            title: "Import failed",
            description: errorCount > 0 ? `All ${errorCount} exercises failed to import.` : "No exercises were imported.",
            variant: "destructive",
          });
          console.log("Import errors:", errors);
        }

      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Please check the file format and try again.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground" data-testid={`heading-${category}`}>
            {title}
          </h2>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="bg-accent/50 border-accent text-accent-foreground hover:bg-accent/80"
                data-testid={`button-import-export-${category}`}
              >
                <FileText className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportWorkoutCSV} data-testid={`menu-export-${category}`}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={importWorkoutFile} data-testid={`menu-import-${category}`}>
                <Upload className="w-4 h-4 mr-2" />
                Import File (CSV, TXT, XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={() => logWorkoutMutation.mutate(category)}
            disabled={logWorkoutMutation.isPending}
            variant="outline"
            className={workoutStatus?.isCompleted 
              ? "bg-green-500/20 border-green-500/40 hover:bg-green-500/30 text-green-700 dark:text-green-400 font-medium"
              : "bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary font-medium"
            }
            data-testid={`button-today-is-${category}-day`}
          >
            Log Workout
          </Button>
          <Button 
            onClick={addNewExercise} 
            disabled={createMutation.isPending}
            data-testid={`button-add-exercise-${category}`}
            className="hidden md:inline-flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-foreground">No exercises yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first exercise.</p>
          <div className="mt-6">
            <Button onClick={addNewExercise} disabled={createMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* Desktop Table View */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                        
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {isCardio ? "Activity" : "Exercise"}
                      </th>
                    {isCardio ? (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Distance
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Pace
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Calories
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          RPE
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Weight (lbs)
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Reps
                        </th>
                      </>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      View
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <Droppable droppableId="exercises">
                  {(provided) => (
                    <tbody 
                      className="bg-background divide-y divide-border"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {exercises.map((exercise, index) => (
                        <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                          {(provided, snapshot) => (
                            <tr 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              data-testid={`row-exercise-${exercise.id}`}
                              className={snapshot.isDragging ? "opacity-75" : ""}
                            >
                              <td className="px-3 py-2">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </td>
                      <td className="px-3 py-2">
                        <Input
                          type="text"
                          value={getTextValue(exercise.id, "name", exercise.name)}
                          onChange={(e) => handleTextChange(exercise.id, "name", e.target.value)}
                          onBlur={(e) => commitTextChange(exercise.id, "name", e.target.value)}
                          className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors whitespace-normal break-words"
                          data-testid={`input-exercise-name-${exercise.id}`}
                        />
                      </td>
                      {isCardio ? (
                        <>
                          <td className="px-3 py-2">
                            <Input
                              type="text"
                              value={getTextValue(exercise.id, "duration", exercise.duration)}
                              onChange={(e) => handleTextChange(exercise.id, "duration", e.target.value)}
                              onBlur={(e) => commitTextChange(exercise.id, "duration", e.target.value)}
                              placeholder="28:32"
                              className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-20"
                              data-testid={`input-duration-${exercise.id}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="text"
                              value={exercise.distance || ""}
                              onChange={(e) => debouncedUpdate(exercise.id, "distance", e.target.value)}
                              placeholder="3.1 miles"
                              className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-24"
                              data-testid={`input-distance-${exercise.id}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="text"
                              value={exercise.pace || ""}
                              onChange={(e) => debouncedUpdate(exercise.id, "pace", e.target.value)}
                              placeholder="9:10/mile"
                              className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-24"
                              data-testid={`input-pace-${exercise.id}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={exercise.calories || 0}
                              onChange={(e) => debouncedUpdate(exercise.id, "calories", parseInt(e.target.value) || 0)}
                              placeholder="320"
                              className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-20"
                              data-testid={`input-calories-${exercise.id}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={exercise.rpe || 0}
                              onChange={(e) => debouncedUpdate(exercise.id, "rpe", parseInt(e.target.value) || 0)}
                              placeholder="8"
                              min="1"
                              max="10"
                              className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-16"
                              data-testid={`input-rpe-${exercise.id}`}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={getWeightValue(exercise.id, exercise.weight)}
                              onChange={(e) => handleWeightChange(exercise.id, e.target.value)}
                              onBlur={(e) => commitWeightChange(exercise.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  commitWeightChange(exercise.id, e.currentTarget.value);
                                  e.currentTarget.blur();
                                }
                              }}
                              className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-20"
                              data-testid={`input-weight-${exercise.id}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={exercise.reps || 0}
                              onChange={(e) => debouncedUpdate(exercise.id, "reps", parseInt(e.target.value) || 0)}
                              className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-16"
                              data-testid={`input-reps-${exercise.id}`}
                            />
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2">
                        <Input
                          type="text"
                          value={exercise.notes || ""}
                          onChange={(e) => debouncedUpdate(exercise.id, "notes", e.target.value)}
                          placeholder="Add notes..."
                          className="border-none bg-transparent p-1 text-sm text-muted-foreground focus:bg-background hover:bg-accent transition-colors"
                          data-testid={`input-notes-${exercise.id}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Collapsible open={collapsedExercises[exercise.id] || false} onOpenChange={() => toggleExerciseCollapse(exercise.id)}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                              data-testid={`button-view-notes-${exercise.id}`}
                            >
                              {collapsedExercises[exercise.id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="hidden" />
                        </Collapsible>
                        {collapsedExercises[exercise.id] && (
                          <Portal.Root>
                            <div className="fixed inset-0 z-[70]">
                              <div 
                                className="absolute inset-0 bg-background/60 backdrop-blur-sm" 
                                onClick={() => toggleExerciseCollapse(exercise.id)} 
                              />
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[min(600px,95vw)] max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-xl">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <Badge variant="secondary" className="capitalize">
                                      {category}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2 mb-4">
                                    <label className="text-sm font-medium text-muted-foreground">Exercise Name</label>
                                    <Input
                                      type="text"
                                      value={exerciseEditStates[exercise.id]?.name || exercise.name}
                                      onChange={(e) => updateEditState(exercise.id, "name", e.target.value)}
                                      className="text-lg font-bold text-primary"
                                      data-testid={`input-name-detail-${exercise.id}`}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Weight (lbs)</label>
                                      <Input
                                        type="number"
                                        value={exerciseEditStates[exercise.id]?.weight || exercise.weight || 0}
                                        onChange={(e) => updateEditState(exercise.id, "weight", e.target.value)}
                                        className="text-lg font-bold text-primary"
                                        data-testid={`input-weight-detail-${exercise.id}`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Reps</label>
                                      <Input
                                        type="number"
                                        value={exerciseEditStates[exercise.id]?.reps || exercise.reps || 0}
                                        onChange={(e) => updateEditState(exercise.id, "reps", e.target.value)}
                                        className="text-lg font-bold text-primary"
                                        data-testid={`input-reps-detail-${exercise.id}`}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2 mb-4">
                                    <label className="text-sm font-medium text-muted-foreground">Notes & Instructions</label>
                                    <textarea
                                      value={exerciseEditStates[exercise.id]?.notes || exercise.notes || ""}
                                      onChange={(e) => updateEditState(exercise.id, "notes", e.target.value)}
                                      placeholder="Add notes or instructions..."
                                      className="w-full p-3 bg-muted rounded-lg border border-input text-sm leading-relaxed resize-none focus:bg-background focus:border-primary transition-colors"
                                      rows={4}
                                      data-testid={`textarea-notes-detail-${exercise.id}`}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center pt-3 border-t border-border">
                                    <div className="text-xs text-muted-foreground">
                                      Last updated: {new Date(exercise.createdAt || new Date()).toLocaleDateString("en-US", { 
                                        month: "short", 
                                        day: "numeric", 
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit"
                                      })}
                                    </div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteExercise(exercise.id)}
                                      disabled={deleteMutation.isPending}
                                      className="flex items-center gap-2"
                                      data-testid={`button-delete-detail-${exercise.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Portal.Root>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExercise(exercise.id)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive/80 p-1 rounded transition-colors"
                            data-testid={`button-delete-${exercise.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </table>
            </div>
            </div>
          </DragDropContext>

          {/* Mobile Card View */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="mobile-exercises">
              {(provided) => (
                <div 
                  className="md:hidden space-y-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {exercises.map((exercise, index) => {
                    const isExpanded = expandedCards.has(exercise.id);
                    const keyMetric = isCardio ? exercise.duration : `${exercise.weight} lbs`;
                    const progress = getExerciseProgress(exercise.id);
                    const setsCompleted = progress?.setsCompleted || 0;
                    const progressPercentage = getProgressPercentage(exercise.id);
                    const isComplete = setsCompleted >= 3;
                    
                    return (
                      <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                        {(provided, snapshot) => {
                          return (
                            <div className="relative">
                              <Card 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative overflow-hidden bg-card transition-all duration-300 ${
                                  snapshot.isDragging ? 'opacity-75' : ''
                                } ${
                                  isComplete ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''
                                }`} 
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                                data-testid={`card-exercise-${exercise.id}`}
                              >
                            {/* Progress Bar Background */}
                            <div className="absolute inset-0 z-0">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  isComplete 
                                    ? 'bg-green-100 dark:bg-green-900/50' 
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            
                            {/* Tappable Area */}
                            <div 
                              className={`absolute inset-0 z-10 cursor-pointer transition-colors ${
                                setsCompleted < 3 ? 'hover:bg-black/5 active:bg-black/10' : 'cursor-default'
                              }`}
                              onClick={() => handleExerciseTap(exercise.id)}
                              data-testid={`tap-area-${exercise.id}`}
                            />
                  <CardContent className="relative z-20 p-4 pointer-events-none">
                    {/* Collapsed Header - Always Visible */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0 pointer-events-auto">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Input
                            type="text"
                            value={getTextValue(exercise.id, "name", exercise.name)}
                            onChange={(e) => handleTextChange(exercise.id, "name", e.target.value)}
                            onBlur={(e) => commitTextChange(exercise.id, "name", e.target.value)}
                            className="font-semibold text-base border-none bg-transparent p-0 text-foreground focus:bg-background hover:bg-accent transition-colors flex-1 whitespace-normal break-words pointer-events-auto"
                            data-testid={`input-exercise-name-mobile-${exercise.id}`}
                          />
                          <div className="flex items-center gap-2">
                            {/* Editable Key Metrics */}
                            {isCardio ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="text"
                                  value={getTextValue(exercise.id, "duration", exercise.duration)}
                                  onChange={(e) => handleTextChange(exercise.id, "duration", e.target.value)}
                                  onBlur={(e) => commitTextChange(exercise.id, "duration", e.target.value)}
                                  placeholder="28:32"
                                  className="text-sm font-medium text-muted-foreground bg-transparent border-none p-0 w-16 text-center hover:bg-accent focus:bg-background transition-colors pointer-events-auto"
                                  data-testid={`input-duration-collapsed-${exercise.id}`}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-0.5">
                                <Input
                                  type="number"
                                  value={getWeightValue(exercise.id, exercise.weight)}
                                  onChange={(e) => handleWeightChange(exercise.id, e.target.value)}
                                  onBlur={(e) => commitWeightChange(exercise.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      commitWeightChange(exercise.id, e.currentTarget.value);
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="text-sm font-medium text-muted-foreground bg-transparent border-none p-0 w-12 text-center hover:bg-accent focus:bg-background transition-colors pointer-events-auto"
                                  data-testid={`input-weight-collapsed-${exercise.id}`}
                                />
                                <span className="text-muted-foreground">×</span>
                                <Input
                                  type="number"
                                  value={exercise.reps || 0}
                                  onChange={(e) => debouncedUpdate(exercise.id, "reps", parseInt(e.target.value) || 0)}
                                  className="text-sm font-medium text-muted-foreground bg-transparent border-none p-0 w-10 text-center hover:bg-accent focus:bg-background transition-colors pointer-events-auto"
                                  data-testid={`input-reps-collapsed-${exercise.id}`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <Collapsible open={collapsedExercises[exercise.id] || false} onOpenChange={() => toggleExerciseCollapse(exercise.id)}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground p-2 pointer-events-auto"
                              data-testid={`button-view-notes-mobile-${exercise.id}`}
                            >
                              {collapsedExercises[exercise.id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-background border rounded-lg shadow-lg p-6 w-[500px] max-w-[95vw] max-h-[80vh] overflow-y-auto">
                            <div className="space-y-3">
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="capitalize">
                                    {category}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2 mb-4">
                                  <div className="text-sm font-medium text-muted-foreground">Exercise Name</div>
                                  <Input
                                    type="text"
                                    value={exerciseEditStates[exercise.id]?.name || exercise.name}
                                    onChange={(e) => updateEditState(exercise.id, "name", e.target.value)}
                                    className="text-xl font-bold text-primary border border-input"
                                    data-testid={`input-name-detail-mobile-${exercise.id}`}
                                  />
                                </div>
                                <div className="space-y-2 mb-4">
                                  <div className="text-sm font-medium text-muted-foreground">Order</div>
                                  <Input
                                    type="number"
                                    value={exercise.order || 0}
                                    onChange={(e) => updateExercise(exercise.id, "order", parseInt(e.target.value) || 0)}
                                    className="text-xl font-bold text-primary border border-input"
                                    data-testid={`input-order-detail-mobile-${exercise.id}`}
                                    min="1"
                                  />
                                </div>
                                {isCardio ? (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Duration</div>
                                      <Input
                                        type="text"
                                        value={getTextValue(exercise.id, "duration", exercise.duration)}
                                        onChange={(e) => handleTextChange(exercise.id, "duration", e.target.value)}
                                        onBlur={(e) => commitTextChange(exercise.id, "duration", e.target.value)}
                                        placeholder="28:32"
                                        className="text-xl font-bold text-primary border border-input"
                                        data-testid={`input-duration-detail-mobile-${exercise.id}`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Distance</div>
                                      <Input
                                        type="text"
                                        value={getTextValue(exercise.id, "distance", exercise.distance)}
                                        onChange={(e) => handleTextChange(exercise.id, "distance", e.target.value)}
                                        onBlur={(e) => commitTextChange(exercise.id, "distance", e.target.value)}
                                        placeholder="3.1 miles"
                                        className="text-xl font-bold text-primary border border-input"
                                        data-testid={`input-distance-detail-mobile-${exercise.id}`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Pace</div>
                                      <Input
                                        type="text"
                                        value={getTextValue(exercise.id, "pace", exercise.pace)}
                                        onChange={(e) => handleTextChange(exercise.id, "pace", e.target.value)}
                                        onBlur={(e) => commitTextChange(exercise.id, "pace", e.target.value)}
                                        placeholder="9:10/mile"
                                        className="text-xl font-bold text-primary border border-input"
                                        data-testid={`input-pace-detail-mobile-${exercise.id}`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Calories</div>
                                      <Input
                                        type="number"
                                        value={getTextValue(exercise.id, "calories", exercise.calories?.toString())}
                                        onChange={(e) => handleTextChange(exercise.id, "calories", e.target.value)}
                                        onBlur={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          commitTextChange(exercise.id, "calories", value as any);
                                        }}
                                        className="text-xl font-bold text-primary border border-input"
                                        data-testid={`input-calories-detail-mobile-${exercise.id}`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">RPE (1-10)</div>
                                      <Input
                                        type="number"
                                        value={getTextValue(exercise.id, "rpe", exercise.rpe?.toString())}
                                        onChange={(e) => handleTextChange(exercise.id, "rpe", e.target.value)}
                                        onBlur={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          commitTextChange(exercise.id, "rpe", value as any);
                                        }}
                                        min="1"
                                        max="10"
                                        className="text-xl font-bold text-primary border border-input"
                                        data-testid={`input-rpe-detail-mobile-${exercise.id}`}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Weight (lbs)</div>
                                      <Input
                                        type="number"
                                        value={getWeightValue(exercise.id, exercise.weight)}
                                        onChange={(e) => handleWeightChange(exercise.id, e.target.value)}
                                        onBlur={(e) => commitWeightChange(exercise.id, e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            commitWeightChange(exercise.id, e.currentTarget.value);
                                            e.currentTarget.blur();
                                          }
                                        }}
                                        className="text-xl font-bold text-primary border border-input"
                                        data-testid={`input-weight-detail-mobile-${exercise.id}`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Reps</div>
                                      <Input
                                        type="number"
                                        value={getTextValue(exercise.id, "reps", exercise.reps?.toString())}
                                        onChange={(e) => handleTextChange(exercise.id, "reps", e.target.value)}
                                        onBlur={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          commitTextChange(exercise.id, "reps", value as any);
                                        }}
                                        className="text-xl font-bold text-primary border border-input"
                                        data-testid={`input-reps-detail-mobile-${exercise.id}`}
                                      />
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-muted-foreground">Notes & Instructions</div>
                                  <textarea
                                    value={getTextValue(exercise.id, "notes", exercise.notes)}
                                    onChange={(e) => handleTextChange(exercise.id, "notes", e.target.value)}
                                    onBlur={(e) => commitTextChange(exercise.id, "notes", e.target.value)}
                                    placeholder="Add notes or instructions..."
                                    className="w-full p-3 bg-muted rounded-lg border border-input text-sm leading-relaxed resize-none focus:bg-background focus:border-primary transition-colors"
                                    rows={4}
                                    data-testid={`textarea-notes-detail-mobile-${exercise.id}`}
                                  />
                                </div>
                                
                                {/* Delete Button */}
                                <div className="flex justify-end pt-4 border-t border-border">
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteExercise(exercise.id)}
                                    disabled={deleteMutation.isPending}
                                    className="flex items-center gap-2"
                                    data-testid={`button-delete-detail-mobile-${exercise.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Exercise
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                        
                      </div>
                    </div>
                    
                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Order</label>
                          <Input
                            type="number"
                            value={editingExercises[exercise.id]?.order ?? exercise.order ?? 0}
                            onChange={(e) => setEditingExercises(prev => ({ ...prev, [exercise.id]: { ...prev[exercise.id], order: parseInt(e.target.value) || 0 } }))}
                            className="text-sm h-8 pointer-events-auto"
                            data-testid={`input-order-expanded-${exercise.id}`}
                            min="1"
                          />
                        </div>
                        {isCardio ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</label>
                              <Input
                                type="text"
                                value={exercise.duration || ""}
                                onChange={(e) => debouncedUpdate(exercise.id, "duration", e.target.value)}
                                placeholder="28:32"
                                className="text-base font-semibold pointer-events-auto"
                                data-testid={`input-duration-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Distance</label>
                              <Input
                                type="text"
                                value={exercise.distance || ""}
                                onChange={(e) => debouncedUpdate(exercise.id, "distance", e.target.value)}
                                placeholder="3.1 miles"
                                className="text-base font-semibold pointer-events-auto"
                                data-testid={`input-distance-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pace</label>
                              <Input
                                type="text"
                                value={exercise.pace || ""}
                                onChange={(e) => debouncedUpdate(exercise.id, "pace", e.target.value)}
                                placeholder="9:10/mile"
                                className="text-base font-semibold pointer-events-auto"
                                data-testid={`input-pace-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Calories</label>
                              <Input
                                type="number"
                                value={exercise.calories || 0}
                                onChange={(e) => debouncedUpdate(exercise.id, "calories", parseInt(e.target.value) || 0)}
                                placeholder="320"
                                className="text-base font-semibold pointer-events-auto"
                                data-testid={`input-calories-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">RPE (1-10)</label>
                              <Input
                                type="number"
                                value={exercise.rpe || 0}
                                onChange={(e) => debouncedUpdate(exercise.id, "rpe", parseInt(e.target.value) || 0)}
                                placeholder="8"
                                min="1"
                                max="10"
                                className="text-base font-semibold pointer-events-auto"
                                data-testid={`input-rpe-mobile-${exercise.id}`}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight (lbs)</label>
                              <Input
                                type="number"
                                value={getWeightValue(exercise.id, exercise.weight)}
                                onChange={(e) => handleWeightChange(exercise.id, e.target.value)}
                                onBlur={(e) => commitWeightChange(exercise.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    commitWeightChange(exercise.id, e.currentTarget.value);
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="text-base font-semibold pointer-events-auto"
                                data-testid={`input-weight-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reps</label>
                              <Input
                                type="number"
                                value={exercise.reps || 0}
                                onChange={(e) => debouncedUpdate(exercise.id, "reps", parseInt(e.target.value) || 0)}
                                className="text-base font-semibold pointer-events-auto"
                                data-testid={`input-reps-mobile-${exercise.id}`}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
                          <Input
                            type="text"
                            value={exercise.notes || ""}
                            onChange={(e) => debouncedUpdate(exercise.id, "notes", e.target.value)}
                            placeholder="Add notes..."
                            className="text-sm pointer-events-auto"
                            data-testid={`input-notes-mobile-${exercise.id}`}
                          />
                        </div>
                        
                        {/* Delete Exercise Button */}
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteExercise(exercise.id)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive/80 border-destructive/20 hover:border-destructive/40 pointer-events-auto"
                            data-testid={`button-delete-mobile-${exercise.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Exercise
                          </Button>
                        </div>
                      </div>
                    )}
                          </CardContent>
                          </Card>
                            </div>
                          )
                        }}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          size="icon"
          onClick={addNewExercise}
          disabled={createMutation.isPending}
          className="w-12 h-12 rounded-full shadow-lg"
          data-testid={`button-add-mobile-${category}`}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </main>
  );
}
