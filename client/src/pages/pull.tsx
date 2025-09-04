
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Pull() {
  return (
    <>
      <UniversalNavigation />
      <WorkoutTable
        category="pull"
        title="Pull Workouts"
        description="Back, biceps, and rear delt exercises"
      />
    </>
  );
}
