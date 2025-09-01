import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Push from "@/pages/push";
import Pull from "@/pages/pull";
import Legs from "@/pages/legs";
import Push2 from "@/pages/push2";
import Pull2 from "@/pages/pull2";
import Legs2 from "@/pages/legs2";
import Cardio from "@/pages/cardio";
import WeightTracking from "@/pages/weight-tracking";
import BloodTracking from "@/pages/blood-tracking";
import Admin from "@/pages/admin";
import Header from "@/components/layout/header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/push" component={Push} />
      <Route path="/pull" component={Pull} />
      <Route path="/legs" component={Legs} />
      <Route path="/push2" component={Push2} />
      <Route path="/pull2" component={Pull2} />
      <Route path="/legs2" component={Legs2} />
      <Route path="/cardio" component={Cardio} />
      <Route path="/weight" component={WeightTracking} />
      <Route path="/blood" component={BloodTracking} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
