
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";
import WorkoutStopwatch from "@/components/workout-stopwatch";
import WorkoutNotes from "@/components/workout-notes";

export default function Arms() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutStopwatch />
        <WorkoutNotes category="arms" />
        <WorkoutTable
          category="arms"
          title="Arms Workouts"
          description="Biceps, triceps, and forearm exercises"
        />
        <ChangesAudit category="arms" />
      </div>
    </>
  );
}
