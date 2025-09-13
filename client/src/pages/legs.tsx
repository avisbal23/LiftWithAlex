
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";

export default function Legs() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutTable
          category="legs"
          title="Leg Workouts"
          description="Quadriceps, hamstrings, and glute exercises"
        />
        <ChangesAudit category="legs" />
      </div>
    </>
  );
}
