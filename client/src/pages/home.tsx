import { useQuery } from "@tanstack/react-query";
import { type Exercise } from "@shared/schema";
import Navigation from "@/components/layout/navigation";
import { Link } from "wouter";
import { Trophy, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const getPersonalRecords = () => {
    if (exercises.length === 0) return {};

    // Group exercises by unique name to avoid duplicates between Day 1 and Day 2
    const uniqueExercises = exercises.reduce((acc, exercise) => {
      const exerciseName = exercise.name;
      
      if (!acc[exerciseName]) {
        acc[exerciseName] = {
          name: exerciseName,
          category: exercise.category,
          maxWeight: exercise.weight || 0,
          maxReps: exercise.reps || 0,
          maxDuration: exercise.duration || "",
          isCardio: exercise.category === "cardio"
        };
      } else {
        // Update with better records
        if ((exercise.weight || 0) > acc[exerciseName].maxWeight) {
          acc[exerciseName].maxWeight = exercise.weight || 0;
        }
        if ((exercise.reps || 0) > acc[exerciseName].maxReps) {
          acc[exerciseName].maxReps = exercise.reps || 0;
        }
        if (exercise.duration && exercise.duration < acc[exerciseName].maxDuration) {
          acc[exerciseName].maxDuration = exercise.duration;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Group by category and take first 4 from each
    const categories = ["push", "pull", "legs", "cardio"];
    const prsByCategory = {} as Record<string, any[]>;

    categories.forEach(category => {
      const categoryExercises = Object.values(uniqueExercises)
        .filter((ex: any) => ex.category === category || 
                            (category === "legs" && (ex.category === "legs2")) ||
                            (category === "push" && (ex.category === "push2")) ||
                            (category === "pull" && (ex.category === "pull2")))
        .slice(0, 4);
      
      prsByCategory[category] = categoryExercises;
    });

    return prsByCategory;
  };

  const prs = getPersonalRecords();

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "push": return "Push";
      case "pull": return "Pull"; 
      case "legs": return "Legs";
      case "cardio": return "Cardio";
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "push": return "bg-red-500/10 text-red-600 border-red-200";
      case "pull": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "legs": return "bg-green-500/10 text-green-600 border-green-200";
      case "cardio": return "bg-purple-500/10 text-purple-600 border-purple-200";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded mb-4"></div>
            <div className="h-6 bg-muted rounded mb-8 w-1/2"></div>
            <div className="space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="heading-welcome">
            💪 Gym Tracker
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Track your workouts, beat your personal records
          </p>
          
          {/* Quick Navigation */}
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
        </div>

        {/* Personal Records Section */}
        {Object.keys(prs).length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Personal Records
            </h2>
            
            {Object.entries(prs).map(([category, exercises]) => (
              exercises.length > 0 && (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Weight className="w-5 h-5" />
                    {getCategoryDisplayName(category)}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {exercises.map((exercise: any, index: number) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-foreground truncate">
                            {exercise.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Badge className={getCategoryColor(category)} variant="outline">
                            {getCategoryDisplayName(category)}
                          </Badge>
                          
                          {exercise.isCardio ? (
                            <div className="space-y-1">
                              {exercise.maxDuration && (
                                <div className="text-lg font-bold text-foreground">
                                  {exercise.maxDuration}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">Best Time</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-lg font-bold text-foreground">
                                {exercise.maxWeight} lbs
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Max {exercise.maxReps} reps
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {Object.keys(prs).length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏋️‍♂️</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Ready to start?</h2>
            <p className="text-muted-foreground">Add some exercises to track your progress</p>
          </div>
        )}
      </main>
    </>
  );
}
