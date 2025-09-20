import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WorkoutNotesProps {
  category: string;
}

export default function WorkoutNotes({ category }: WorkoutNotesProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  // Query to get existing notes for today's workout
  const { data: notesData, isLoading } = useQuery<{ notes: string }>({
    queryKey: ["/api/workout-notes", category],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/workout-notes/${category}`);
      return response.json();
    },
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (notesData?.notes) {
      setNotes(notesData.notes);
    }
  }, [notesData]);

  // Mutation to save notes
  const saveNotesMutation = useMutation({
    mutationFn: async (notesToSave: string) => {
      const response = await apiRequest("POST", `/api/workout-notes/${category}`, { notes: notesToSave });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-notes", category] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save when collapsing
  const handleCollapseChange = (open: boolean) => {
    if (!open && notes !== (notesData?.notes || "")) {
      // Save when collapsing and notes have changed
      saveNotesMutation.mutate(notes);
    }
    setIsCollapsed(!open);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  return (
    <Card className="mb-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/30 dark:border-blue-800/30">
      <Collapsible open={!isCollapsed} onOpenChange={handleCollapseChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors">
            <CardTitle className="flex items-center justify-between text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Workout Prep & Notes
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Textarea
              placeholder="Add your workout prep notes, goals, or thoughts here..."
              value={notes}
              onChange={handleNotesChange}
              className="min-h-[120px] resize-none bg-white/80 dark:bg-gray-900/80 border-blue-200/50 dark:border-blue-800/50 focus:border-blue-400 dark:focus:border-blue-600"
              disabled={isLoading}
              data-testid={`textarea-notes-${category}`}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}