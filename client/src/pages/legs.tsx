import Navigation from "@/components/layout/navigation";
import WorkoutTable from "@/components/workout-table";

export default function Legs() {
  return (
    <>
      <Navigation />
      <WorkoutTable
        category="legs"
        title="Leg Workouts"
        description="Quadriceps, hamstrings, and glute exercises"
      />
    </>
  );
}
