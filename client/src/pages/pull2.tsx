
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";

export default function Pull2() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutTable
          category="pull2"
          title="BACK Workouts"
          description="BACK workout - back, biceps, and rear delt exercises"
        />
        <ChangesAudit category="pull2" />
      </div>
    </>
  );
}