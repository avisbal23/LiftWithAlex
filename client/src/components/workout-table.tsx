import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Exercise, type InsertExercise, type UpdateExercise } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface WorkoutTableProps {
  category: string;
  title: string;
  description: string;
}

export default function WorkoutTable({ category, title, description }: WorkoutTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Exercise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Weight (lbs)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Reps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Notes
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
