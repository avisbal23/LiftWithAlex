
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";
import WorkoutStopwatch from "@/components/workout-stopwatch";
import WorkoutNotes from "@/components/workout-notes";

export default function Chest() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutStopwatch />
        <WorkoutNotes category="chest" />
        <WorkoutTable
          category="chest"
          title="Chest Workouts"
          description="Chest exercises"
        />
        <ChangesAudit category="chest" />
      </div>
    </>
  );
}
