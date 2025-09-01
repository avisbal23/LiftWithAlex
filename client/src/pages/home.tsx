import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type WorkoutLog } from "@shared/schema";
import Navigation from "@/components/layout/navigation";
import { Link } from "wouter";
import { Trophy, Calendar, Edit3, Save, X } from "lucide-react";
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
              Today is <span className="text-primary font-bold">{getNextWorkoutDay()}</span>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

  const handleSave = () => {
    onSave(editData);
  };

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardHeader className="pb-2">
          <Input
            value={editData.exercise}
            onChange={(e) => setEditData(prev => ({ ...prev, exercise: e.target.value }))}
            className="text-sm font-medium"
            placeholder="Exercise name"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          <select
            value={editData.category}
            onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
          >
            <option value="Push">Push</option>
            <option value="Pull">Pull</option>
            <option value="Legs">Legs</option>
            <option value="Cardio">Cardio</option>
          </select>
          
          {editData.category === "Cardio" ? (
            <Input
              value={editData.time || ""}
              onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
              placeholder="22:30"
              className="text-sm"
            />
          ) : (
            <div className="space-y-2">
              <Input
                value={editData.weight || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="Weight"
                className="text-sm"
              />
              <Input
                value={editData.reps || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, reps: e.target.value }))}
                placeholder="Reps"
                className="text-sm"
              />
            </div>
          )}
          
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="flex-1">
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground truncate flex items-center justify-between">
          {pr.exercise}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-6 w-6 p-0"
              data-testid={`button-edit-pr-${pr.id}`}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              data-testid={`button-delete-pr-${pr.id}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Badge className={pr.color} variant="outline">
          {pr.category}
        </Badge>
        
        {pr.category === "Cardio" ? (
          <div className="space-y-1">
            <div className="text-lg font-bold text-foreground">
              {pr.time}
            </div>
            <div className="text-xs text-muted-foreground">Best Time</div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-lg font-bold text-foreground">
              {pr.weight} lbs
            </div>
            <div className="text-xs text-muted-foreground">
              Max {pr.reps} reps
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}