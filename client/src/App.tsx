import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Chest from "@/pages/chest";
import Back from "@/pages/back";
import Legs from "@/pages/legs";
import Pull2 from "@/pages/pull2";
import Legs2 from "@/pages/legs2";
import Arms from "@/pages/arms";
import Core from "@/pages/core";
import Cardio from "@/pages/cardio";
import WeightTracking from "@/pages/weight-tracking";
import StepsTracking from "@/pages/steps-tracking";
import BloodTracking from "@/pages/blood-tracking";
import PhotoProgress from "@/pages/photo-progress";
import Thoughts from "@/pages/thoughts";
import Supplements from "@/pages/supplements";
import Affirmations from "@/pages/affirmations";
import Admin from "@/pages/admin";
import Header from "@/components/layout/header";
import { PasswordGate } from "@/components/password-gate";
import { DeveloperTag } from "@/components/DeveloperTag";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chest" component={Chest} />
        <Route path="/back" component={Back} />
        <Route path="/legs" component={Legs} />
        <Route path="/pull2" component={Pull2} />
        <Route path="/legs2" component={Legs2} />
        <Route path="/arms" component={Arms} />
        <Route path="/core" component={Core} />
        <Route path="/cardio" component={Cardio} />
        <Route path="/weight" component={WeightTracking} />
        <Route path="/steps" component={StepsTracking} />
        <Route path="/blood" component={BloodTracking} />
        <Route path="/blood-tracking" component={BloodTracking} />
        <Route path="/photos" component={PhotoProgress} />
        <Route path="/thoughts" component={Thoughts} />
        <Route path="/supplements" component={Supplements} />
        <Route path="/affirmations" component={Affirmations} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
      <DeveloperTag />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
