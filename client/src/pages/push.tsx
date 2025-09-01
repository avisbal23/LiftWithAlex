import Navigation from "@/components/layout/navigation";
import WorkoutTable from "@/components/workout-table";

export default function Push() {
  return (
    <>
      <Navigation />
      <WorkoutTable
        category="push"
        title="Push Workouts"
        description="Chest, shoulders, and triceps exercises"
      />
    </>
  );
}
