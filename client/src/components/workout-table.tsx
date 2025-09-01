import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, ChevronDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Exercise, type InsertExercise, type UpdateExercise, type InsertWorkoutLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", category],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", category] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
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

  const addNewExercise = () => {
    createMutation.mutate({
      name: "New Exercise",
      weight: 0,
      reps: 0,
      notes: "",
      category,
    });
  };

  const updateExercise = (id: string, field: keyof UpdateExercise, value: string | number) => {
    updateMutation.mutate({
      id,
      data: { [field]: value },
    });
  };

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid={`heading-${category}`}>
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => logWorkoutMutation.mutate(category)}
            disabled={logWorkoutMutation.isPending}
            variant="outline"
            className="bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary font-medium"
            data-testid={`button-today-is-${category}-day`}
          >
            Today is {getCategoryDisplayName(category)}
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
          <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {isCardio ? "Activity" : "Exercise"}
                    </th>
                    {isCardio ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Distance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Pace
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Calories
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          RPE
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Weight (lbs)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Reps
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      View
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {exercises.map((exercise) => (
                    <tr key={exercise.id} data-testid={`row-exercise-${exercise.id}`}>
                      <td className="px-6 py-4">
                        <Input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                          className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors"
                          data-testid={`input-exercise-name-${exercise.id}`}
                        />
                      </td>
                      {isCardio ? (
                        <>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={exercise.duration || ""}
                              onChange={(e) => updateExercise(exercise.id, "duration", e.target.value)}
                              placeholder="28:32"
                              className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-20"
                              data-testid={`input-duration-${exercise.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={exercise.distance || ""}
                              onChange={(e) => updateExercise(exercise.id, "distance", e.target.value)}
                              placeholder="3.1 miles"
                              className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-24"
                              data-testid={`input-distance-${exercise.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={exercise.pace || ""}
                              onChange={(e) => updateExercise(exercise.id, "pace", e.target.value)}
                              placeholder="9:10/mile"
                              className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-24"
                              data-testid={`input-pace-${exercise.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              value={exercise.calories || 0}
                              onChange={(e) => updateExercise(exercise.id, "calories", parseInt(e.target.value) || 0)}
                              placeholder="320"
                              className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-20"
                              data-testid={`input-calories-${exercise.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              value={exercise.rpe || 0}
                              onChange={(e) => updateExercise(exercise.id, "rpe", parseInt(e.target.value) || 0)}
                              placeholder="8"
                              min="1"
                              max="10"
                              className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-16"
                              data-testid={`input-rpe-${exercise.id}`}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              value={exercise.weight}
                              onChange={(e) => updateExercise(exercise.id, "weight", parseInt(e.target.value) || 0)}
                              className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-20"
                              data-testid={`input-weight-${exercise.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(exercise.id, "reps", parseInt(e.target.value) || 0)}
                              className="border-none bg-transparent p-2 text-sm text-foreground focus:bg-background hover:bg-accent transition-colors w-16"
                              data-testid={`input-reps-${exercise.id}`}
                            />
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4">
                        <Input
                          type="text"
                          value={exercise.notes}
                          onChange={(e) => updateExercise(exercise.id, "notes", e.target.value)}
                          placeholder="Add notes..."
                          className="border-none bg-transparent p-2 text-sm text-muted-foreground focus:bg-background hover:bg-accent transition-colors"
                          data-testid={`input-notes-${exercise.id}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedNotes({ exercise: exercise.name, notes: exercise.notes });
                                setEditingNotes(exercise.notes);
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
                                  Last updated: {new Date(exercise.createdAt).toLocaleDateString("en-US", { 
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
                      <td className="px-6 py-4">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {exercises.map((exercise) => {
              const isExpanded = expandedCards.has(exercise.id);
              const keyMetric = isCardio ? exercise.duration : `${exercise.weight} lbs`;
              
              return (
                <Card key={exercise.id} className="bg-card" data-testid={`card-exercise-${exercise.id}`}>
                  <CardContent className="p-4">
                    {/* Collapsed Header - Always Visible */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={exercise.name}
                            onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                            className="font-semibold text-base border-none bg-transparent p-0 text-foreground focus:bg-background hover:bg-accent transition-colors flex-1"
                            data-testid={`input-exercise-name-mobile-${exercise.id}`}
                          />
                          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {keyMetric}
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
                                setSelectedNotes({ exercise: exercise.name, notes: exercise.notes });
                                setEditingNotes(exercise.notes);
                              }}
                              className="text-muted-foreground hover:text-foreground p-2"
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
                          className="text-muted-foreground hover:text-foreground p-2"
                          data-testid={`button-expand-${exercise.id}`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExercise(exercise.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive/80 p-2"
                          data-testid={`button-delete-mobile-${exercise.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="space-y-4 border-t border-border pt-4">
                        {isCardio ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</label>
                              <Input
                                type="text"
                                value={exercise.duration || ""}
                                onChange={(e) => updateExercise(exercise.id, "duration", e.target.value)}
                                placeholder="28:32"
                                className="text-base font-semibold"
                                data-testid={`input-duration-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Distance</label>
                              <Input
                                type="text"
                                value={exercise.distance || ""}
                                onChange={(e) => updateExercise(exercise.id, "distance", e.target.value)}
                                placeholder="3.1 miles"
                                className="text-base font-semibold"
                                data-testid={`input-distance-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pace</label>
                              <Input
                                type="text"
                                value={exercise.pace || ""}
                                onChange={(e) => updateExercise(exercise.id, "pace", e.target.value)}
                                placeholder="9:10/mile"
                                className="text-base font-semibold"
                                data-testid={`input-pace-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Calories</label>
                              <Input
                                type="number"
                                value={exercise.calories || 0}
                                onChange={(e) => updateExercise(exercise.id, "calories", parseInt(e.target.value) || 0)}
                                placeholder="320"
                                className="text-base font-semibold"
                                data-testid={`input-calories-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">RPE (1-10)</label>
                              <Input
                                type="number"
                                value={exercise.rpe || 0}
                                onChange={(e) => updateExercise(exercise.id, "rpe", parseInt(e.target.value) || 0)}
                                placeholder="8"
                                min="1"
                                max="10"
                                className="text-base font-semibold"
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
                                value={exercise.weight}
                                onChange={(e) => updateExercise(exercise.id, "weight", parseInt(e.target.value) || 0)}
                                className="text-base font-semibold"
                                data-testid={`input-weight-mobile-${exercise.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reps</label>
                              <Input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(exercise.id, "reps", parseInt(e.target.value) || 0)}
                                className="text-base font-semibold"
                                data-testid={`input-reps-mobile-${exercise.id}`}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
                          <Input
                            type="text"
                            value={exercise.notes}
                            onChange={(e) => updateExercise(exercise.id, "notes", e.target.value)}
                            placeholder="Add notes..."
                            className="text-sm"
                            data-testid={`input-notes-mobile-${exercise.id}`}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
