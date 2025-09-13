
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";

export default function Pull() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
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
