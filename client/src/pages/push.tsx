
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Push() {
  return (
    <>
      <UniversalNavigation />
      <WorkoutTable
        category="push"
        title="Push Workouts"
        description="Chest, shoulders, and triceps exercises"
      />
    </>
  );
}
