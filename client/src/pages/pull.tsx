
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";
import WorkoutStopwatch from "@/components/workout-stopwatch";
import WorkoutNotes from "@/components/workout-notes";

export default function Pull() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutStopwatch />
        <WorkoutNotes category="pull" />
        <WorkoutTable
          category="pull"
          title="Pull Workouts"
          description="Back, biceps, and rear delt exercises"
        />
        <ChangesAudit category="pull" />
      </div>
    </>
  );
}
