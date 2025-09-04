
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Pull2() {
  return (
    <>
      <UniversalNavigation />
      <WorkoutTable
        category="pull2"
        title="Pull 2 Workouts"
        description="Second pull workout - back, biceps, and rear delt exercises"
      />
    </>
  );
}