
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";
import WorkoutStopwatch from "@/components/workout-stopwatch";

export default function Push2() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutStopwatch />
        <WorkoutTable
          category="push2"
          title="SHARMS Workouts"
          description="SHARMS workout - chest, shoulders, and triceps exercises"
        />
        <ChangesAudit category="push2" />
      </div>
    </>
  );
}