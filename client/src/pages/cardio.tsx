
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";

export default function Cardio() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutTable
          category="cardio"
          title="Cardio Workouts"
          description="Cardiovascular exercises and conditioning"
        />
        <ChangesAudit category="cardio" />
      </div>
    </>
  );
}