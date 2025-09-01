import { useQuery } from "@tanstack/react-query";
import { type Exercise } from "@shared/schema";
import Navigation from "@/components/layout/navigation";
import { Zap, BarChart3, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const calculateStats = () => {
    if (exercises.length === 0) {
      return {
        weeklyWorkouts: 0,
        totalVolume: 0,
        lastWorkout: null,
        recentWorkouts: [],
      };
    }

    // Calculate weekly workouts (group by date)
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentExercises = exercises.filter(ex => 
      new Date(ex.createdAt) >= oneWeekAgo
    );

    // Group by date and category for weekly workouts
    const workoutDays = new Set(
      recentExercises.map(ex => 
        `${new Date(ex.createdAt).toDateString()}-${ex.category}`
      )
    );

    // Calculate total volume
    const totalVolume = recentExercises.reduce((sum, ex) => 
      sum + (ex.weight * ex.reps), 0
    );

    // Get last workout
    const lastWorkout = exercises.length > 0 ? exercises[0] : null;

    // Group recent workouts by date and category
    const workoutsByDate = recentExercises.reduce((acc, ex) => {
      const date = new Date(ex.createdAt).toDateString();
      const key = `${date}-${ex.category}`;
      
      if (!acc[key]) {
        acc[key] = {
          date: new Date(ex.createdAt),
          category: ex.category,
          exercises: [],
          volume: 0,
        };
      }
      
      acc[key].exercises.push(ex);
      acc[key].volume += ex.weight * ex.reps;
      
      return acc;
    }, {} as Record<string, any>);

    const recentWorkouts = Object.values(workoutsByDate)
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    return {
      weeklyWorkouts: workoutDays.size,
      totalVolume,
      lastWorkout,
      recentWorkouts,
    };
  };

  const stats = calculateStats();

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "push": return "bg-primary/10 text-primary";
      case "pull": return "bg-secondary/10 text-secondary-foreground";
      case "legs": return "bg-accent/10 text-accent-foreground";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="heading-dashboard">
            Dashboard
          </h2>
          <p className="text-muted-foreground">Welcome back! Here's your recent activity.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-weekly-workouts">
                  {stats.weeklyWorkouts}
                </p>
                <p className="text-sm text-muted-foreground">Workouts</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-volume">
                  {stats.totalVolume.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">lbs this week</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-full">
                <BarChart3 className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Workout</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-last-workout">
                  {stats.lastWorkout ? formatDate(new Date(stats.lastWorkout.createdAt)) : "No data"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.lastWorkout ? `${stats.lastWorkout.category} day` : ""}
                </p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <Clock className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Recent Workouts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Exercises
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {stats.recentWorkouts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No recent workouts to display
                    </td>
                  </tr>
                ) : (
                  stats.recentWorkouts.map((workout: any, index: number) => (
                    <tr key={index} data-testid={`row-recent-workout-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {workout.date.toLocaleDateString("en-US", { 
                          month: "short", 
                          day: "numeric", 
                          year: "numeric" 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getCategoryColor(workout.category)}>
                          {workout.category.charAt(0).toUpperCase() + workout.category.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {workout.volume.toLocaleString()} lbs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
