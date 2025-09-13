
import WorkoutTable from "@/components/workout-table";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import ChangesAudit from "@/components/changes-audit";

export default function Legs2() {
  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6">
        <WorkoutTable
          category="legs2"
          title="Legs 2 Workouts"
          description="Second leg workout - quadriceps, hamstrings, and glute exercises"
        />
        <ChangesAudit category="legs2" />
      </div>
    </>
  );
}