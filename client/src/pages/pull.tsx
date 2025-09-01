import Navigation from "@/components/layout/navigation";
import WorkoutTable from "@/components/workout-table";

export default function Pull() {
  return (
    <>
      <Navigation />
      <WorkoutTable
        category="pull"
        title="Pull Workouts"
        description="Back, biceps, and rear delt exercises"
      />
    </>
  );
}
