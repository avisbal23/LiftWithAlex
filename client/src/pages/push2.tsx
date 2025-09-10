
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Push2() {
  return (
    <>
      <UniversalNavigation />
      <WorkoutTable
        category="push2"
        title="SHARMS Workouts"
        description="SHARMS workout - chest, shoulders, and triceps exercises"
      />
    </>
  );
}