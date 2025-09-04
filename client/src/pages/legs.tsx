
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Legs() {
  return (
    <>
      <UniversalNavigation />
      <WorkoutTable
        category="legs"
        title="Leg Workouts"
        description="Quadriceps, hamstrings, and glute exercises"
      />
    </>
  );
}
