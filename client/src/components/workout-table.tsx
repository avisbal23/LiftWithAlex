import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptimizedInput } from "@/components/optimized-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, ChevronDown, GripVertical } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Exercise, type InsertExercise, type UpdateExercise, type InsertWorkoutLog, type DailySetProgress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";

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
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const [editingExercises, setEditingExercises] = useState<Record<string, Partial<Exercise>>>({});

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", category],
  });

  // Fetch daily set progress for this category
  const { data: dailyProgress = [] } = useQuery<DailySetProgress[]>({
    queryKey: ["/api/daily-set-progress", category],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/daily-set-progress/${category}`);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs/latest"] });
      toast({
        title: "Workout logged!",
        description: `Completed ${getCategoryDisplayName(category)} workout`,
      });
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

  const getCategoryDisplayName = (cat: string) => {
    switch (cat) {
      case "push": return "Push Day";
      case "pull": return "Pull Day";
      case "legs": return "Leg Day";
      case "push2": return "Push Day 2";
      case "pull2": return "Pull Day 2";
      case "legs2": return "Leg Day 2";
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
    updateMutation.mutate({
      id,
      data: { [field]: value },
    });
  }, [updateMutation]);

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

  const debouncedUpdate = useCallback((id: string, field: keyof UpdateExercise, value: string | number) => {
    const timeoutKey = `${id}-${field}`;
    if (timeoutRefs.current[timeoutKey]) {
      clearTimeout(timeoutRefs.current[timeoutKey]);
    }
    timeoutRefs.current[timeoutKey] = setTimeout(() => {
      updateExercise(id, field, value);
    }, 1000); // Increased to 1 second
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

  // Export workout as iPhone lock screen optimized image
  const exportWorkoutImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 9:16 aspect ratio optimized for iPhone portrait lock screen
    const width = 720;
    const height = 1280;
    canvas.width = width;
    canvas.height = height;

    // Calculate safe zones (top 30%, bottom 20% clear)
    const topSafeZone = height * 0.3;
    const bottomSafeZone = height * 0.2;
    const contentHeight = height - topSafeZone - bottomSafeZone;
    const contentStartY = topSafeZone;

    // Create modern gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a'); // Dark slate
    gradient.addColorStop(0.5, '#1e293b'); // Slate
    gradient.addColorStop(1, '#334155'); // Light slate
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i, j, 1, 1);
      }
    }
    ctx.globalAlpha = 1;

    // Category color coding
    const categoryColors = {
      'push': '#ef4444', // Red
      'pull': '#3b82f6', // Blue
      'legs': '#22c55e', // Green
      'push2': '#f97316', // Orange
      'pull2': '#8b5cf6', // Purple
      'legs2': '#06b6d4', // Cyan
      'cardio': '#ec4899', // Pink
    };
    const categoryColor = categoryColors[category.toLowerCase() as keyof typeof categoryColors] || '#6b7280';

    // Header card background
    const cardX = (width - (width * 0.95)) / 2;
    const cardY = contentStartY - 10;
    const cardWidth = width * 0.95;
    const cardHeight = 120;

    // Draw header card with rounded corners and subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    // Card background
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
    cardGradient.addColorStop(0, '#1f2937');
    cardGradient.addColorStop(1, '#374151');
    ctx.fillStyle = cardGradient;
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Header accent line
    ctx.fillStyle = categoryColor;
    ctx.roundRect(cardX, cardY, cardWidth, 6, 3);
    ctx.fill();

    // Header text with better typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    ctx.textAlign = 'center';
    const headerText = `${getCategoryDisplayName(category)} Workout`;
    ctx.fillText(headerText, width / 2, cardY + 55);

    // Date with accent color
    ctx.font = '22px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    ctx.fillStyle = '#d1d5db';
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillText(today, width / 2, cardY + 85);

    // Exercise table with modern design
    if (exercises.length > 0) {
      const tableStartY = contentStartY + 140;
      const tableWidth = width * 0.95;
      const tableX = (width - tableWidth) / 2;
      const rowHeight = Math.min(50, (contentHeight - 160) / (exercises.length + 1));

      // Table container with rounded corners
      ctx.fillStyle = 'rgba(31, 41, 55, 0.9)';
      ctx.roundRect(tableX, tableStartY - 10, tableWidth, (exercises.length + 1) * rowHeight + 20, 16);
      ctx.fill();

      // Table headers with gradient
      const headerGradient = ctx.createLinearGradient(tableX, tableStartY, tableX, tableStartY + rowHeight);
      headerGradient.addColorStop(0, categoryColor);
      headerGradient.addColorStop(1, categoryColor + '80');
      ctx.fillStyle = headerGradient;
      ctx.roundRect(tableX + 5, tableStartY, tableWidth - 10, rowHeight, 12);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.textAlign = 'left';
      
      const colWidths = isCardio 
        ? [tableWidth * 0.5, tableWidth * 0.25, tableWidth * 0.25]
        : [tableWidth * 0.45, tableWidth * 0.275, tableWidth * 0.275];
      
      const headers = isCardio ? ['Exercise', 'Duration', 'Distance'] : ['Exercise', 'Weight', 'Reps'];
      let currentX = tableX + 25;
      
      headers.forEach((header, index) => {
        ctx.fillText(header, currentX, tableStartY + 32);
        currentX += colWidths[index];
      });

      // Exercise rows with better styling
      exercises.slice(0, Math.floor((contentHeight - 180) / rowHeight)).forEach((exercise, index) => {
        const rowY = tableStartY + (index + 1) * rowHeight;
        
        // Alternating row colors with subtle gradients
        if (index % 2 === 0) {
          ctx.fillStyle = 'rgba(55, 65, 81, 0.3)';
          ctx.roundRect(tableX + 5, rowY, tableWidth - 10, rowHeight, 8);
          ctx.fill();
        }
        
        // Progress indicator for completed sets
        const progress = getExerciseProgress(exercise.id);
        const setsCompleted = progress?.setsCompleted || 0;
        if (setsCompleted > 0) {
          ctx.fillStyle = categoryColor + '40';
          const progressWidth = (tableWidth - 10) * (setsCompleted / 3);
          ctx.roundRect(tableX + 5, rowY, Math.min(progressWidth, tableWidth - 10), rowHeight, 8);
          ctx.fill();
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
        
        currentX = tableX + 25;
        
        // Exercise name with better truncation
        const exerciseName = exercise.name.length > 22 ? exercise.name.substring(0, 22) + '...' : exercise.name;
        ctx.fillText(exerciseName, currentX, rowY + 32);
        currentX += colWidths[0];
        
        // Progress indicator dots
        if (setsCompleted > 0) {
          ctx.fillStyle = categoryColor;
          for (let i = 0; i < setsCompleted; i++) {
            ctx.beginPath();
            ctx.arc(currentX - 30 + (i * 8), rowY + 25, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.fillStyle = '#e5e7eb';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
        
        if (isCardio) {
          // Duration
          ctx.fillText(exercise.duration || '—', currentX, rowY + 32);
          currentX += colWidths[1];
          // Distance
          ctx.fillText(exercise.distance || '—', currentX, rowY + 32);
        } else {
          // Weight
          ctx.fillText(exercise.weight ? `${exercise.weight} lbs` : '—', currentX, rowY + 32);
          currentX += colWidths[1];
          // Reps
          ctx.fillText(exercise.reps ? `${exercise.reps} reps` : '—', currentX, rowY + 32);
        }
      });

      // Summary stats at bottom
      const totalExercises = exercises.length;
      const progressData = exercises.map(ex => {
        const progress = getExerciseProgress(ex.id);
        return progress?.setsCompleted || 0;
      });
      const totalSetsCompleted = progressData.reduce((sum, sets) => sum + sets, 0);
      
      if (contentStartY + contentHeight - 40 > tableStartY + (exercises.length + 1) * rowHeight + 30) {
        const statsY = tableStartY + (exercises.length + 1) * rowHeight + 50;
        
        // Stats background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.roundRect(tableX + (tableWidth * 0.3), statsY - 15, tableWidth * 0.4, 35, 8);
        ctx.fill();
        
        ctx.fillStyle = categoryColor;
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
        ctx.textAlign = 'center';
        const statsText = `${totalSetsCompleted} sets • ${totalExercises} exercises`;
        ctx.fillText(statsText, width / 2, statsY + 7);
      }
    } else {
      // No exercises message with better styling
      ctx.fillStyle = 'rgba(107, 114, 128, 0.8)';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No exercises added yet', width / 2, contentStartY + contentHeight / 2);
      
      ctx.fillStyle = 'rgba(107, 114, 128, 0.6)';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.fillText('Add exercises to see your workout here', width / 2, contentStartY + contentHeight / 2 + 30);
    }

    // Branding watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('VISBAL GYM', width - 30, height - 30);

    // Download the image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${category}-workout-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Workout exported! 📱",
          description: "Beautiful lock screen image saved to downloads.",
        });
      }
    }, 'image/png');
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
          <Button 
            onClick={exportWorkoutImage}
            variant="outline"
            className="bg-accent/50 border-accent text-accent-foreground hover:bg-accent/80"
            data-testid={`button-export-${category}`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Image
          </Button>
          <Button 
            onClick={() => logWorkoutMutation.mutate(category)}
            disabled={logWorkoutMutation.isPending}
            variant="outline"
            className="bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary font-medium"
            data-testid={`button-today-is-${category}-day`}
          >
            Log {getCategoryDisplayName(category)} Workout
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
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                          className="border-none bg-transparent p-1 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors whitespace-normal break-words"
                          data-testid={`input-exercise-name-${exercise.id}`}
                        />
                      </td>
                      {isCardio ? (
                        <>
                          <td className="px-3 py-2">
                            <Input
                              type="text"
                              value={exercise.duration || ""}
                              onChange={(e) => updateExercise(exercise.id, "duration", e.target.value)}
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
                              value={exercise.weight || 0}
                              onChange={(e) => debouncedUpdate(exercise.id, "weight", parseInt(e.target.value) || 0)}
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedNotes({ exercise: exercise.name, notes: exercise.notes || "" });
                                setEditingNotes(exercise.notes || "");
                              }}
                              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                              data-testid={`button-view-notes-${exercise.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Exercise Details</DialogTitle>
                            </DialogHeader>
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-xl">{exercise.name}</CardTitle>
                                  <Badge variant="secondary" className="capitalize">
                                    {category}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Weight</div>
                                    <div className="text-2xl font-bold text-primary">
                                      {exercise.weight} <span className="text-base font-normal text-muted-foreground">lbs</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Reps</div>
                                    <div className="text-2xl font-bold text-primary">
                                      {exercise.reps || "—"}
                                    </div>
                                  </div>
                                </div>
                                {exercise.notes && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Notes & Instructions</div>
                                    <div className="p-4 bg-muted rounded-lg">
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {exercise.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                  Last updated: {new Date(exercise.createdAt || new Date()).toLocaleDateString("en-US", { 
                                    month: "short", 
                                    day: "numeric", 
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit"
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          </DialogContent>
                        </Dialog>
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
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative overflow-hidden bg-card transition-all duration-300 ${
                              snapshot.isDragging ? 'opacity-75' : ''
                            } ${
                              isComplete ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''
                            }`} 
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
                            value={exercise.name}
                            onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                            className="font-semibold text-base border-none bg-transparent p-0 text-foreground focus:bg-background hover:bg-accent transition-colors flex-1 whitespace-normal break-words pointer-events-auto"
                            data-testid={`input-exercise-name-mobile-${exercise.id}`}
                          />
                          <div className="flex items-center gap-2">
                            {/* Editable Key Metrics */}
                            {isCardio ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="text"
                                  value={exercise.duration || ""}
                                  onChange={(e) => debouncedUpdate(exercise.id, "duration", e.target.value)}
                                  placeholder="28:32"
                                  className="text-sm font-medium text-muted-foreground bg-transparent border-none p-0 w-16 text-center hover:bg-accent focus:bg-background transition-colors pointer-events-auto"
                                  data-testid={`input-duration-collapsed-${exercise.id}`}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={exercise.weight || 0}
                                  onChange={(e) => debouncedUpdate(exercise.id, "weight", parseInt(e.target.value) || 0)}
                                  className="text-sm font-medium text-muted-foreground bg-transparent border-none p-0 w-12 text-center hover:bg-accent focus:bg-background transition-colors pointer-events-auto"
                                  data-testid={`input-weight-collapsed-${exercise.id}`}
                                />
                                <span className="text-sm font-medium text-muted-foreground">lbs</span>
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
                            {/* Set Progress Indicator */}
                            <div className="flex items-center gap-1">
                              {[0, 1, 2].map((setIndex) => (
                                <div
                                  key={setIndex}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    setIndex < setsCompleted 
                                      ? (isComplete ? 'bg-green-500' : 'bg-blue-500') 
                                      : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            {/* Sets Text */}
                            <span className={`text-xs font-medium ${
                              isComplete 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-muted-foreground'
                            }`}>
                              {setsCompleted}/3
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedNotes({ exercise: exercise.name, notes: exercise.notes || "" });
                                setEditingNotes(exercise.notes || "");
                              }}
                              className="text-muted-foreground hover:text-foreground p-2 pointer-events-auto"
                              data-testid={`button-view-notes-mobile-${exercise.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] mx-4">
                            <DialogHeader>
                              <DialogTitle>Exercise Details</DialogTitle>
                            </DialogHeader>
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                                  <Badge variant="secondary" className="capitalize">
                                    {category}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2 mb-4">
                                  <div className="text-sm font-medium text-muted-foreground">Order</div>
                                  <div className="text-xl font-bold text-primary">
                                    #{exercise.order || 0}
                                  </div>
                                </div>
                                {isCardio ? (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Duration</div>
                                      <div className="text-xl font-bold text-primary">
                                        {exercise.duration || "—"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Distance</div>
                                      <div className="text-xl font-bold text-primary">
                                        {exercise.distance || "—"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Pace</div>
                                      <div className="text-xl font-bold text-primary">
                                        {exercise.pace || "—"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Calories</div>
                                      <div className="text-xl font-bold text-primary">
                                        {exercise.calories || "—"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">RPE</div>
                                      <div className="text-xl font-bold text-primary">
                                        {exercise.rpe || "—"} <span className="text-sm font-normal text-muted-foreground">/10</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Weight</div>
                                      <div className="text-xl font-bold text-primary">
                                        {exercise.weight} <span className="text-sm font-normal text-muted-foreground">lbs</span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground">Reps</div>
                                      <div className="text-xl font-bold text-primary">
                                        {exercise.reps || "—"}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {exercise.notes && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Notes & Instructions</div>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {exercise.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpansion(exercise.id)}
                          className="text-muted-foreground hover:text-foreground p-2 pointer-events-auto"
                          data-testid={`button-expand-${exercise.id}`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
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
                                value={exercise.weight || 0}
                                onChange={(e) => debouncedUpdate(exercise.id, "weight", parseInt(e.target.value) || 0)}
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
                        )}
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
