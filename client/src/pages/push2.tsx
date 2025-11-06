
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";
import WorkoutStopwatch from "@/components/workout-stopwatch";
import WorkoutNotes from "@/components/workout-notes";

export default function Push2() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutStopwatch />
        <WorkoutNotes category="push2" />
        <WorkoutTable
          category="push2"
          title="Push 2 (Shoulders)"
          description="Shoulders workout - chest, shoulders, and triceps exercises"
        />
        <ChangesAudit category="push2" />
      </div>
    </>
  );
}