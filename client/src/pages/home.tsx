import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type WorkoutLog, type Quote, type PersonalRecord, type UserSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import { Link } from "wouter";
import { Trophy, Calendar, Edit3, Save, X, Scale, Settings, MessageCircle, Trash2, Activity, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


export default function Home() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Load personal records from independent API
  const { data: personalRecords } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/personal-records"],
  });
  
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

  const { data: randomQuote } = useQuery<Quote | null>({
    queryKey: ["/api/quotes/random"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Load user settings for current body weight
  const { data: userSettings } = useQuery<UserSettings | null>({
    queryKey: ["/api/user-settings"],
  });

  // Update user settings mutation
  const updateUserSettingsMutation = useMutation({
    mutationFn: (settings: { currentBodyWeight: number }) =>
      apiRequest("POST", "/api/user-settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
    },
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

  const updatePersonalRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/personal-records/${id}`, {
        exercise: data.exercise,
        weight: data.weight || "",
        reps: data.reps || "",
        time: data.time || "",
        category: data.category,
        order: data.order,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-records"] });
      setEditingId(null);
    },
  });
  
  const handleSave = (id: string, updatedData: any) => {
    updatePersonalRecordMutation.mutate({ id, data: updatedData });
  };

  const deletePersonalRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/personal-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-records"] });
    },
  });
  
  const handleDelete = (id: string) => {
    deletePersonalRecordMutation.mutate(id);
  };

  const addPersonalRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/personal-records", {
        exercise: data.exercise,
        weight: data.weight || "",
        reps: data.reps || "",
        time: data.time || "",
        category: data.category,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-records"] });
      setNewPR({ exercise: "", weight: "", reps: "", time: "", category: "Push" });
    },
  });
  
  const handleAddPR = () => {
    if (!newPR.exercise) return;
    addPersonalRecordMutation.mutate(newPR);
  };

  // Use PersonalRecords directly for display
  const prs = (personalRecords || []).map((record) => ({
    id: record.id,
    exercise: record.exercise,
    weight: record.weight || "",
    reps: record.reps || "",
    time: record.time || "",
    category: record.category,
    order: record.order || 0,
    color: getCategoryColor(record.category)
  }));

  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          {/* Random Quote */}
          {randomQuote && (
            <div className="relative mb-6 max-w-2xl mx-auto" data-testid="random-quote">
              {/* Glass Container */}
              <div className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-2xl shadow-primary/20">
                {/* Inner glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <blockquote className="text-lg font-medium text-foreground italic mb-3 leading-relaxed">
                    "{randomQuote.text}"
                  </blockquote>
                  <cite className="text-sm text-muted-foreground font-medium">
                    — {randomQuote.author}
                  </cite>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-2 left-2 w-1 h-1 bg-primary/30 rounded-full"></div>
                <div className="absolute top-2 right-2 w-1 h-1 bg-primary/30 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-primary/30 rounded-full"></div>
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-primary/30 rounded-full"></div>
              </div>
            </div>
          )}
          
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
            
            {/* Quick Access - Blood & Photos */}
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <Link to="/blood-tracking">
                <Badge className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20 transition-colors px-4 py-2 text-sm cursor-pointer flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Blood
                </Badge>
              </Link>
              <Link to="/photo-progress">
                <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-200 hover:bg-indigo-500/20 transition-colors px-4 py-2 text-sm cursor-pointer flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Photos
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

        {/* Personal Records Section - 3D Glassmorphism */}
        <div className="relative">
          {/* Glass Background */}
          <div className="backdrop-blur-lg bg-black/10 dark:bg-gray-200/10 border border-white/20 dark:border-gray-600/20 rounded-2xl shadow-2xl">
            {/* 3D Glass Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/5 dark:from-gray-300/10 dark:to-gray-700/5 rounded-2xl"></div>
            
            <div className="relative p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {/* 3D Trophy Icon */}
                  <div className="relative">
                    <Trophy className="w-6 h-6 text-yellow-500 relative z-10 drop-shadow-lg" />
                    <div className="absolute inset-0 text-yellow-400/30 transform translate-x-0.5 translate-y-0.5 blur-sm">
                      <Trophy className="w-6 h-6" />
                    </div>
                  </div>
                  {/* 3D Text */}
                  <span className="relative">
                    <span className="absolute inset-0 text-black/20 dark:text-gray-600/30 transform translate-x-0.5 translate-y-0.5 blur-sm">
                      Personal Records
                    </span>
                    <span className="relative bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent font-extrabold">
                      Personal Records
                    </span>
                  </span>
                </h2>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      data-testid="button-add-pr"
                      className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      {/* Button 3D Effect */}
                      <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                      <span className="relative z-10">Add PR</span>
                    </Button>
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
                      data-testid="input-exercise-name"
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
                        data-testid="select-category"
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
                          data-testid="input-time"
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
                            data-testid="input-weight"
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
                        data-testid="input-reps"
                      />
                    </div>
                  )}
                  
                  <Button onClick={handleAddPR} className="w-full" data-testid="button-submit-pr">
                    Add Personal Record
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Current Body Weight Input */}
          <div className="mb-6">
            <Label htmlFor="currentBodyWeight" className="text-sm font-medium text-foreground mb-2 block">
              Current Body Weight (lbs)
            </Label>
            <Input
              id="currentBodyWeight"
              type="number"
              step="0.1"
              value={userSettings?.currentBodyWeight || ""}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  updateUserSettingsMutation.mutate({ currentBodyWeight: value });
                }
              }}
              placeholder="Enter your current body weight"
              className="max-w-xs relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30"
              data-testid="input-current-body-weight"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
                {prs.map((pr) => (
                  <PRCard
                    key={pr.id}
                    pr={pr}
                    currentBodyWeight={userSettings?.currentBodyWeight || 0}
                    isEditing={editingId === pr.id}
                    onEdit={() => handleEdit(pr.id)}
                    onSave={(updatedData) => handleSave(pr.id, updatedData)}
                    onDelete={() => handleDelete(pr.id)}
                    onCancel={() => setEditingId(null)}
                  />
                ))}
              </div>
            </div>
            
            {/* Bottom Glass Highlight */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-gray-400/30 to-transparent rounded-b-2xl"></div>
          </div>
        </div>
      </main>
    </>
  );
}

function PRCard({ pr, currentBodyWeight, isEditing, onEdit, onSave, onDelete, onCancel }: {
  pr: any;
  currentBodyWeight: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [editData, setEditData] = useState(() => ({ ...pr }));
  const [isFlipped, setIsFlipped] = useState(false);

  const calculateBodyWeightPercentage = () => {
    const prWeight = parseFloat(pr.weight);
    if (currentBodyWeight > 0 && prWeight > 0) {
      return ((prWeight / currentBodyWeight) * 100).toFixed(1);
    }
    return null;
  };

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
            
            <div>
              <Label htmlFor="order" className="text-sm font-medium text-foreground">Position (Order)</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={editData.order || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                className="mt-1"
                placeholder="Enter position number"
              />
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
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${
        isFlipped 
          ? "z-50 scale-110 col-span-2" 
          : "hover:-translate-y-1 hover:scale-105"
      }`}
      onClick={handleFlip}
    >
      {/* 3D Glassmorphism Card */}
      <div className={`backdrop-blur-lg bg-black/20 dark:bg-gray-200/15 border border-white/30 dark:border-gray-600/40 rounded-xl shadow-2xl transition-all duration-300 ${
        isFlipped 
          ? "shadow-3xl ring-4 ring-white/20 dark:ring-gray-400/20" 
          : "group-hover:shadow-3xl"
      }`}>
        {/* 3D Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-black/5 dark:from-gray-300/15 dark:to-gray-700/5 rounded-xl"></div>
        
        {/* Inner Glass Highlight */}
        <div className="absolute inset-0.5 bg-gradient-to-b from-white/20 to-transparent dark:from-gray-300/20 rounded-xl opacity-50"></div>
        <div className="relative flex-1 flex flex-col justify-center items-center p-6 aspect-square">
          {/* 3D Glass Edit/Save/Cancel Buttons */}
          {!isEditing ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="absolute top-3 right-3 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm bg-white/20 dark:bg-gray-600/30 border border-white/30 dark:border-gray-500/40 rounded-lg hover:bg-white/30 dark:hover:bg-gray-500/40 hover:scale-110"
              data-testid={`button-edit-pr-${pr.id}`}
            >
              <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/20 to-transparent dark:from-gray-400/20"></div>
              <Edit3 className="w-3 h-3 relative z-10 text-foreground" />
            </Button>
          ) : (
            <div className="absolute top-3 right-3 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.({
                    exercise: editData.exercise,
                    weight: editData.weight,
                    reps: editData.reps,
                    time: editData.time,
                    category: editData.category
                  });
                }}
                className="h-8 w-8 p-0 transition-all duration-200 backdrop-blur-sm bg-green-500/20 dark:bg-green-400/20 border border-green-500/30 dark:border-green-400/30 rounded-lg hover:bg-green-500/30 dark:hover:bg-green-400/30 hover:scale-110"
                data-testid={`button-save-pr-${pr.id}`}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-green-400/20 to-transparent"></div>
                <Save className="w-3 h-3 relative z-10 text-green-600 dark:text-green-400" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="h-8 w-8 p-0 transition-all duration-200 backdrop-blur-sm bg-red-500/20 dark:bg-red-400/20 border border-red-500/30 dark:border-red-400/30 rounded-lg hover:bg-red-500/30 dark:hover:bg-red-400/30 hover:scale-110"
                data-testid={`button-cancel-pr-${pr.id}`}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-red-400/20 to-transparent"></div>
                <X className="w-3 h-3 relative z-10 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          )}

          {!isFlipped ? (
            // Front side - 3D Glassmorphism view
            <div className="text-center space-y-4">
              {/* 3D Glass Badge */}
              <div className="relative inline-block">
                <div className="backdrop-blur-sm bg-white/20 dark:bg-gray-600/25 border border-white/30 dark:border-gray-500/40 rounded-full px-4 py-2 shadow-lg">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent dark:from-gray-400/20"></div>
                  <span className="relative z-10 text-base font-medium text-foreground">{pr.exercise}</span>
                </div>
              </div>
              
              {pr.category === "Cardio" ? (
                <div className="text-center space-y-2">
                  {/* 3D Text Effect */}
                  <div className="relative">
                    <div className="absolute inset-0 text-black/20 dark:text-gray-600/30 transform translate-x-0.5 translate-y-0.5 blur-sm text-3xl font-bold">
                      {pr.time}
                    </div>
                    <div className="relative text-3xl font-bold bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {pr.time}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground/80 font-medium">Best Time</div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  {/* 3D Weight Text */}
                  <div className="relative">
                    <div className="absolute inset-0 text-black/20 dark:text-gray-600/30 transform translate-x-0.5 translate-y-0.5 blur-sm text-3xl font-bold">
                      {pr.weight} lbs
                    </div>
                    <div className="relative text-3xl font-bold bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {pr.weight} lbs
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground/80 font-medium">
                    Max {pr.reps} reps
                  </div>
                  {calculateBodyWeightPercentage() && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold bg-yellow-100/20 dark:bg-yellow-400/10 rounded-full px-2 py-1 mt-2">
                      {calculateBodyWeightPercentage()}% BW
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Back side - Compass-style layout
            <div className="w-full p-6 space-y-6">
              {/* Workout Title with Matching Emojis */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-xl">🏋️</span>
                  <span className="text-lg font-bold text-foreground">{pr.exercise}</span>
                  <span className="text-xl">🏋️</span>
                </div>
              </div>
              
              {/* Compass-style Data Grid with T-shaped Dividers */}
              <div className="relative">
                {/* T-shaped Divider Lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Vertical line */}
                  <div className="absolute w-px h-full bg-white/20 dark:bg-gray-400/20"></div>
                  {/* Horizontal line */}
                  <div className="absolute w-full h-px bg-white/20 dark:bg-gray-400/20"></div>
                </div>
                
                {/* 4-Quadrant Grid */}
                <div className="relative grid grid-cols-2 gap-0 h-24">
                  {pr.category === "Cardio" ? (
                    <>
                      {/* Top Left - Category */}
                      <div className="flex items-center justify-center p-3">
                        <div className="text-center">
                          <div className="text-lg mb-1">📊</div>
                          <div className="text-xs font-medium text-foreground">{pr.category}</div>
                        </div>
                      </div>
                      
                      {/* Top Right - Time */}
                      <div className="flex items-center justify-center p-3">
                        <div className="text-center">
                          <div className="text-lg mb-1">⏱️</div>
                          <div className="text-xs font-medium text-foreground">{pr.time}</div>
                        </div>
                      </div>
                      
                      {/* Bottom Left - Empty */}
                      <div className="flex items-center justify-center p-3">
                        <div className="text-center opacity-30">
                          <div className="text-lg mb-1">💪</div>
                          <div className="text-xs font-medium text-foreground">Cardio</div>
                        </div>
                      </div>
                      
                      {/* Bottom Right - Empty */}
                      <div className="flex items-center justify-center p-3">
                        <div className="text-center opacity-30">
                          <div className="text-lg mb-1">🔥</div>
                          <div className="text-xs font-medium text-foreground">Endurance</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Top Left - Category */}
                      <div className="flex items-center justify-center p-3">
                        <div className="text-center">
                          <div className="text-lg mb-1">📊</div>
                          <div className="text-xs font-medium text-foreground">{pr.category}</div>
                        </div>
                      </div>
                      
                      {/* Top Right - Weight */}
                      <div className="flex items-center justify-center p-3">
                        <div className="text-center">
                          <div className="text-lg mb-1">⚖️</div>
                          <div className="text-xs font-medium text-foreground">{pr.weight} lbs</div>
                        </div>
                      </div>
                      
                      {/* Bottom Left - Reps */}
                      <div className="flex items-center justify-center p-3">
                        <div className="text-center">
                          <div className="text-lg mb-1">🔢</div>
                          <div className="text-xs font-medium text-foreground">{pr.reps} reps</div>
                        </div>
                      </div>
                      
                      {/* Bottom Right - Body Weight % */}
                      <div className="flex items-center justify-center p-3">
                        {calculateBodyWeightPercentage() ? (
                          <div className="text-center">
                            <div className="text-lg mb-1">📈</div>
                            <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{calculateBodyWeightPercentage()}%</div>
                          </div>
                        ) : (
                          <div className="text-center opacity-30">
                            <div className="text-lg mb-1">📈</div>
                            <div className="text-xs font-medium text-foreground">--%</div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Glass Highlight */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-gray-400/30 to-transparent rounded-b-xl"></div>
      </div>
    </div>
  );
}