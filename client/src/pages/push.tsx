
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";
import WorkoutStopwatch from "@/components/workout-stopwatch";

export default function Push() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutStopwatch />
        <WorkoutTable
          category="push"
          title="Push Workouts"
          description="Chest, shoulders, and triceps exercises"
        />
        <ChangesAudit category="push" />
      </div>
    </>
  );
}
