import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, MessageCircle, Heart, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Thought, InsertThought, UpdateThought } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function ThoughtsPage() {
  const [newThought, setNewThought] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: thoughts = [], isLoading } = useQuery<Thought[]>({
    queryKey: ["/api/thoughts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertThought) => apiRequest("/api/thoughts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      setNewThought("");
      toast({
        title: "Thought shared! 💭",
        description: "Your reflection has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create thought. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateThought }) =>
      apiRequest(`/api/thoughts/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      setEditingId(null);
      setEditContent("");
      toast({
        title: "Updated",
        description: "Your thought has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update thought. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/thoughts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      toast({
        title: "Deleted",
        description: "Your thought has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete thought. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newThought.trim()) return;
    
    createMutation.mutate({
      content: newThought.trim(),
      mood: "neutral",
      tags: [],
    });
  };

  const handleEdit = (thought: Thought) => {
    setEditingId(thought.id);
    setEditContent(thought.content);
  };

  const handleUpdate = () => {
    if (!editContent.trim() || !editingId) return;
    
    updateMutation.mutate({
      id: editingId,
      data: { content: editContent.trim() },
    });
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "happy": return "😊";
      case "sad": return "😢";
      case "excited": return "🎉";
      case "frustrated": return "😤";
      case "grateful": return "🙏";
      case "motivated": return "💪";
      case "contemplative": return "🤔";
      default: return "💭";
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "happy": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "sad": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "excited": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "frustrated": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "grateful": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "motivated": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "contemplative": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Thoughts & Reflections
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Share your gym journey thoughts, reflections, and insights
          </p>
        </div>

        {/* Create New Thought */}
        <Card className="mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-4">
              <Textarea
                placeholder="What's on your mind about your fitness journey? Share your thoughts, victories, challenges, or reflections..."
                value={newThought}
                onChange={(e) => setNewThought(e.target.value)}
                className="min-h-[100px] resize-none"
                data-testid="textarea-new-thought"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {newThought.length}/500 characters
                </span>
                <Button 
                  onClick={handleSubmit}
                  disabled={!newThought.trim() || createMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                  data-testid="button-submit-thought"
                >
                  {createMutation.isPending ? "Sharing..." : "Share Thought"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thoughts Feed */}
        <div className="space-y-4">
          {thoughts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No thoughts yet</h3>
                <p>Share your first reflection about your fitness journey!</p>
              </div>
            </Card>
          ) : (
            thoughts.map((thought) => (
              <Card key={thought.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {editingId === thought.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px] resize-none"
                        data-testid={`textarea-edit-${thought.id}`}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                          data-testid={`button-cancel-edit-${thought.id}`}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdate}
                          disabled={!editContent.trim() || updateMutation.isPending}
                          data-testid={`button-save-edit-${thought.id}`}
                        >
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="space-y-4">
                      {/* Content */}
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {thought.content}
                      </p>

                      {/* Mood & Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getMoodColor(thought.mood || "neutral")}>
                          {getMoodEmoji(thought.mood || "neutral")} {thought.mood || "neutral"}
                        </Badge>
                        {thought.tags && thought.tags.length > 0 && (
                          thought.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              #{tag}
                            </Badge>
                          ))
                        )}
                      </div>

                      {/* Timestamp & Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">
                          {format(new Date(thought.createdAt || Date.now()), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                        <div className="flex items-center space-x-2">
                          {/* Engagement buttons (for future features) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-500"
                            data-testid={`button-like-${thought.id}`}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-blue-500"
                            data-testid={`button-share-${thought.id}`}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                          
                          {/* Edit/Delete actions */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(thought)}
                            className="text-gray-500 hover:text-blue-500"
                            data-testid={`button-edit-${thought.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(thought.id)}
                            className="text-gray-500 hover:text-red-500"
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${thought.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </div>
      </div>
    </>
  );
}