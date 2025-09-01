import Navigation from "@/components/layout/navigation";
import WorkoutTable from "@/components/workout-table";

export default function Legs2() {
  return (
    <>
      <Navigation />
      <WorkoutTable
        category="legs2"
        title="Legs 2 Workouts"
        description="Second leg workout - quadriceps, hamstrings, and glute exercises"
      />
    </>
  );
}