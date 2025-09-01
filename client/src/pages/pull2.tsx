import Navigation from "@/components/layout/navigation";
import WorkoutTable from "@/components/workout-table";

export default function Pull2() {
  return (
    <>
      <Navigation />
      <WorkoutTable
        category="pull2"
        title="Pull 2 Workouts"
        description="Second pull workout - back, biceps, and rear delt exercises"
      />
    </>
  );
}