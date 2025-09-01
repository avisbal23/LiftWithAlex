import Navigation from "@/components/layout/navigation";
import WorkoutTable from "@/components/workout-table";

export default function Push2() {
  return (
    <>
      <Navigation />
      <WorkoutTable
        category="push2"
        title="Push 2 Workouts"
        description="Second push workout - chest, shoulders, and triceps exercises"
      />
    </>
  );
}