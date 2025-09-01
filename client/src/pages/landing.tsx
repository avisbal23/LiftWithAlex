import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Visbal Gym Tracker
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your workouts, monitor progress, and achieve your fitness goals
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full"
            size="lg"
            data-testid="button-login"
          >
            Get Started
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>Multi-user gym tracker with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>8 workout categories (Push/Pull/Legs split + Cardio)</li>
              <li>Weight tracking with RENPHO data</li>
              <li>Blood lab tracking with CSV import/export</li>
              <li>Photo progress tracking</li>
              <li>Thoughts & reflections journal</li>
              <li>Admin tools for data management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}