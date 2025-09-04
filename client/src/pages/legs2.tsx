
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Legs2() {
  return (
    <>
      <UniversalNavigation />
      <WorkoutTable
        category="legs2"
        title="Legs 2 Workouts"
        description="Second leg workout - quadriceps, hamstrings, and glute exercises"
      />
    </>
  );
}