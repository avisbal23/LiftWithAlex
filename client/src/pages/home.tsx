import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type WorkoutLog } from "@shared/schema";
import Navigation from "@/components/layout/navigation";
import { Link } from "wouter";
import { Trophy, Calendar, Edit3, Save, X, Scale, Settings, MessageCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Static PR data that you can edit manually
const initialPRs = [
  {
    id: "1",
    exercise: "Flat Dumbbell Press",
    weight: "80",
    reps: "8",
    category: "Push",
    color: "bg-red-500/10 text-red-600 border-red-200"
  },
  {
    id: "2", 
    exercise: "Incline Dumbbell Press",
    weight: "70",
    reps: "10",
    category: "Push",
    color: "bg-red-500/10 text-red-600 border-red-200"
  },
  {
    id: "3",
    exercise: "Lat Pulldown",
    weight: "150",
    reps: "8",
    category: "Pull", 
    color: "bg-blue-500/10 text-blue-600 border-blue-200"
  },
  {
    id: "4",
    exercise: "Barbell Rows",
    weight: "135",
    reps: "10",
    category: "Pull",
    color: "bg-blue-500/10 text-blue-600 border-blue-200"
  },
  {
    id: "5",
    exercise: "Leg Press",
    weight: "400",
    reps: "12",
    category: "Legs",
    color: "bg-green-500/10 text-green-600 border-green-200"
  },
  {
    id: "6",
    exercise: "Romanian Deadlift",
    weight: "185",
    reps: "8", 
    category: "Legs",
    color: "bg-green-500/10 text-green-600 border-green-200"
  },
  {
    id: "7",
    exercise: "5K Run",
    time: "22:30",
    category: "Cardio",
    color: "bg-purple-500/10 text-purple-600 border-purple-200"
  },
  {
    id: "8",
    exercise: "10K Run", 
    time: "48:15",
    category: "Cardio",
    color: "bg-purple-500/10 text-purple-600 border-purple-200"
  }
];

export default function Home() {
  const [prs, setPrs] = useState(initialPRs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPR, setNewPR] = useState({
    exercise: "",
    weight: "",
    reps: "",
    time: "",
    category: "Push"
  });

  const { data: latestWorkoutLog } = useQuery<WorkoutLog | null>({
    queryKey: ["/api/workout-logs/latest"],
  });

  const getNextWorkoutDay = () => {
    if (!latestWorkoutLog) {
      return "Push Day"; // Default to starting with push
    }

    // Define the workout cycle
    const workoutCycle = ["push", "pull", "legs", "push2", "pull2", "legs2"];
    const currentIndex = workoutCycle.indexOf(latestWorkoutLog.category);
    
    if (currentIndex === -1) {
      // If it's cardio or unknown, suggest push
      return "Push Day";
    }
    
    // Move to next in cycle, wrap around to beginning
    const nextIndex = (currentIndex + 1) % workoutCycle.length;
    const nextCategory = workoutCycle[nextIndex];
    
    return getCategoryDisplayName(nextCategory);
  };

  const getLastWorkoutInfo = () => {
    if (!latestWorkoutLog) return null;
    
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(latestWorkoutLog.completedAt).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    return {
      category: getCategoryDisplayName(latestWorkoutLog.category),
      daysAgo: daysDiff,
      date: new Date(latestWorkoutLog.completedAt)
    };
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "push": return "Push Day";
      case "pull": return "Pull Day"; 
      case "legs": return "Leg Day";
      case "push2": return "Push Day 2";
      case "pull2": return "Pull Day 2";
      case "legs2": return "Leg Day 2";
      case "cardio": return "Cardio";
      default: return category;
    }
  };

  const getCategoryUrl = (displayName: string) => {
    switch (displayName) {
      case "Push Day": return "/push";
      case "Pull Day": return "/pull";
      case "Leg Day": return "/legs";
      case "Push Day 2": return "/push2";
      case "Pull Day 2": return "/pull2";
      case "Leg Day 2": return "/legs2";
      case "Cardio": return "/cardio";
      default: return "/push";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "push": return "bg-red-500/10 text-red-600 border-red-200";
      case "pull": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "legs": return "bg-green-500/10 text-green-600 border-green-200";
      case "cardio": return "bg-purple-500/10 text-purple-600 border-purple-200";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = (id: string, updatedData: any) => {
    setPrs(prev => prev.map(pr => 
      pr.id === id 
        ? { ...pr, ...updatedData, color: getCategoryColor(updatedData.category) }
        : pr
    ));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setPrs(prev => prev.filter(pr => pr.id !== id));
  };

  const handleAddPR = () => {
    if (!newPR.exercise) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    const newRecord = {
      id,
      exercise: newPR.exercise,
      weight: newPR.weight,
      reps: newPR.reps,
      time: newPR.time,
      category: newPR.category,
      color: getCategoryColor(newPR.category)
    };
    
    setPrs(prev => [...prev, newRecord]);
    setNewPR({ exercise: "", weight: "", reps: "", time: "", category: "Push" });
  };

  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="heading-welcome">
            Visbal Gym Tracker 💪🏼
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Track your workouts, beat your personal records
          </p>
          
          {/* Today's Suggested Workout */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium text-foreground">
              Today is{" "}
              <Link to={getCategoryUrl(getNextWorkoutDay())}>
                <span className="text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer underline decoration-2 underline-offset-2" data-testid="link-today-workout">
                  {getNextWorkoutDay()}
                </span>
              </Link>
            </span>
          </div>

          {getLastWorkoutInfo() && (
            <p className="text-sm text-muted-foreground mb-8">
              Last workout: {getLastWorkoutInfo()?.category} {
                getLastWorkoutInfo()?.daysAgo === 0 ? "today" :
                getLastWorkoutInfo()?.daysAgo === 1 ? "yesterday" :
                `${getLastWorkoutInfo()?.daysAgo} days ago`
              }
            </p>
          )}
          
          {/* Quick Navigation */}
          <div className="space-y-4">
            {/* Main Days */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/push">
                <Badge className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20 transition-colors px-4 py-2 text-sm cursor-pointer">
                  Push Day
                </Badge>
              </Link>
              <Link to="/pull">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20 transition-colors px-4 py-2 text-sm cursor-pointer">
                  Pull Day
                </Badge>
              </Link>
              <Link to="/legs">
                <Badge className="bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20 transition-colors px-4 py-2 text-sm cursor-pointer">
                  Leg Day
                </Badge>
              </Link>
              <Link to="/cardio">
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20 transition-colors px-4 py-2 text-sm cursor-pointer">
                  Cardio
                </Badge>
              </Link>
            </div>
            
            {/* Day 2 Options */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/push2">
                <Badge className="bg-red-400/10 text-red-500 border-red-100 hover:bg-red-400/20 transition-colors px-4 py-2 text-sm cursor-pointer">
                  Push Day 2
                </Badge>
              </Link>
              <Link to="/pull2">
                <Badge className="bg-blue-400/10 text-blue-500 border-blue-100 hover:bg-blue-400/20 transition-colors px-4 py-2 text-sm cursor-pointer">
                  Pull Day 2
                </Badge>
              </Link>
              <Link to="/legs2">
                <Badge className="bg-green-400/10 text-green-500 border-green-100 hover:bg-green-400/20 transition-colors px-4 py-2 text-sm cursor-pointer">
                  Leg Day 2
                </Badge>
              </Link>
            </div>
            
            {/* Additional Tools */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/weight">
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20 transition-colors px-4 py-2 text-sm cursor-pointer flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  Weight
                </Badge>
              </Link>
              <Link to="/thoughts">
                <Badge className="bg-pink-500/10 text-pink-600 border-pink-200 hover:bg-pink-500/20 transition-colors px-4 py-2 text-sm cursor-pointer flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Thoughts
                </Badge>
              </Link>
            </div>
            
            {/* Administration */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/admin">
                <Badge className="bg-gray-500/10 text-gray-600 border-gray-200 hover:bg-gray-500/20 transition-colors px-4 py-2 text-sm cursor-pointer flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  Administration
                </Badge>
              </Link>
            </div>
          </div>
        </div>

        {/* Personal Records Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Personal Records
            </h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-add-pr">Add PR</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Personal Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="exercise">Exercise Name</Label>
                    <Input
                      id="exercise"
                      value={newPR.exercise}
                      onChange={(e) => setNewPR(prev => ({ ...prev, exercise: e.target.value }))}
                      placeholder="Bench Press"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={newPR.category}
                        onChange={(e) => setNewPR(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="Push">Push</option>
                        <option value="Pull">Pull</option>
                        <option value="Legs">Legs</option>
                        <option value="Cardio">Cardio</option>
                      </select>
                    </div>
                    
                    {newPR.category === "Cardio" ? (
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          value={newPR.time}
                          onChange={(e) => setNewPR(prev => ({ ...prev, time: e.target.value }))}
                          placeholder="22:30"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="weight">Weight (lbs)</Label>
                          <Input
                            id="weight"
                            value={newPR.weight}
                            onChange={(e) => setNewPR(prev => ({ ...prev, weight: e.target.value }))}
                            placeholder="225"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {newPR.category !== "Cardio" && (
                    <div>
                      <Label htmlFor="reps">Reps</Label>
                      <Input
                        id="reps"
                        value={newPR.reps}
                        onChange={(e) => setNewPR(prev => ({ ...prev, reps: e.target.value }))}
                        placeholder="8"
                      />
                    </div>
                  )}
                  
                  <Button onClick={handleAddPR} className="w-full">
                    Add Personal Record
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {prs.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                isEditing={editingId === pr.id}
                onEdit={() => handleEdit(pr.id)}
                onSave={(updatedData) => handleSave(pr.id, updatedData)}
                onDelete={() => handleDelete(pr.id)}
                onCancel={() => setEditingId(null)}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function PRCard({ pr, isEditing, onEdit, onSave, onDelete, onCancel }: {
  pr: any;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [editData, setEditData] = useState(pr);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSave = () => {
    onSave(editData);
  };

  const handleFlip = () => {
    if (!isEditing) {
      setIsFlipped(!isFlipped);
    }
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm p-4">
        <Card className="border-primary flex flex-col shadow-2xl dark:shadow-white/30 shadow-black/20 bg-background w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Edit PR Record</h3>
            </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="exercise" className="text-sm font-medium text-foreground">Exercise Name</Label>
              <Input
                id="exercise"
                value={editData.exercise}
                onChange={(e) => setEditData(prev => ({ ...prev, exercise: e.target.value }))}
                className="mt-1"
                placeholder="Enter exercise name"
              />
            </div>
            
            <div>
              <Label htmlFor="category" className="text-sm font-medium text-foreground">Category</Label>
              <select
                id="category"
                value={editData.category}
                onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 mt-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Push">Push</option>
                <option value="Pull">Pull</option>
                <option value="Legs">Legs</option>
                <option value="Cardio">Cardio</option>
              </select>
            </div>
            
            {editData.category === "Cardio" ? (
              <div>
                <Label htmlFor="time" className="text-sm font-medium text-foreground">Best Time</Label>
                <Input
                  id="time"
                  value={editData.time || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="e.g., 22:30"
                  className="mt-1"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="weight" className="text-sm font-medium text-foreground">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    value={editData.weight || ""}
                    onChange={(e) => setEditData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Weight"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reps" className="text-sm font-medium text-foreground">Max Reps</Label>
                  <Input
                    id="reps"
                    value={editData.reps || ""}
                    onChange={(e) => setEditData(prev => ({ ...prev, reps: e.target.value }))}
                    placeholder="Reps"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              className="px-4"
              data-testid={`button-delete-pr-${pr.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <Card 
      className="hover:shadow-md transition-all duration-300 group aspect-square flex flex-col cursor-pointer shadow-lg dark:shadow-white/20 shadow-black/10"
      onClick={handleFlip}
    >
      <CardContent className="flex-1 flex flex-col justify-center items-center p-4 relative">
        {/* Edit button - only visible on hover */}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`button-edit-pr-${pr.id}`}
        >
          <Edit3 className="w-3 h-3" />
        </Button>

        {!isFlipped ? (
          // Front side - Simple view with exercise name
          <div className="text-center space-y-3">
            <Badge className={`${pr.color} text-base px-4 py-2`} variant="outline">
              {pr.exercise}
            </Badge>
            
            {pr.category === "Cardio" ? (
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {pr.time}
                </div>
                <div className="text-sm text-muted-foreground">Best Time</div>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {pr.weight} lbs
                </div>
                <div className="text-sm text-muted-foreground">
                  Max {pr.reps} reps
                </div>
              </div>
            )}
          </div>
        ) : (
          // Back side - Structured data view
          <div className="w-full space-y-3 text-center">
            <Badge className={`${pr.color} text-sm mb-2`} variant="outline">
              {pr.category}
            </Badge>
            
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Exercise</div>
                <div className="text-sm font-semibold">{pr.exercise}</div>
              </div>
              
              {pr.category === "Cardio" ? (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Best Time</div>
                  <div className="text-lg font-bold text-foreground">{pr.time}</div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Weight</div>
                    <div className="text-lg font-bold text-foreground">{pr.weight} lbs</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Max Reps</div>
                    <div className="text-lg font-bold text-foreground">{pr.reps}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}