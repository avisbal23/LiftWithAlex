import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Home", path: "/" },
  { name: "Push", path: "/push" },
  { name: "Pull", path: "/pull" },
  { name: "Legs", path: "/legs" },
  { name: "Push 2", path: "/push2" },
  { name: "Pull 2", path: "/pull2" },
  { name: "Legs 2", path: "/legs2" },
  { name: "Cardio", path: "/cardio" },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "py-4 px-2 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap flex-shrink-0",
                location === tab.path
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              )}
              data-testid={`link-${tab.name.toLowerCase().replace(' ', '-')}`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
