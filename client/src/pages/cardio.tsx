import Navigation from "@/components/layout/navigation";
import WorkoutTable from "@/components/workout-table";

export default function Cardio() {
  return (
    <>
      <Navigation />
      <WorkoutTable
        category="cardio"
        title="Cardio Workouts"
        description="Cardiovascular exercises and conditioning"
      />
    </>
  );
}