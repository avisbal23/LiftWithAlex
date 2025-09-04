
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Cardio() {
  return (
    <>
      <UniversalNavigation />
      <WorkoutTable
        category="cardio"
        title="Cardio Workouts"
        description="Cardiovascular exercises and conditioning"
      />
    </>
  );
}