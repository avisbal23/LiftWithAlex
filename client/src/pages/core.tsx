
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";
import WorkoutStopwatch from "@/components/workout-stopwatch";
import WorkoutNotes from "@/components/workout-notes";

export default function Core() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutStopwatch />
        <WorkoutNotes category="core" />
        <WorkoutTable
          category="core"
          title="Core Workouts"
          description="Abdominal and core exercises"
        />
        <ChangesAudit category="core" />
      </div>
    </>
  );
}
