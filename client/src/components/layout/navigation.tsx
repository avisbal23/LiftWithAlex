import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Home", path: "/" },
  { name: "Push", path: "/push" },
  { name: "Pull", path: "/pull" },
  { name: "Legs", path: "/legs" },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "py-4 px-1 text-sm font-medium transition-colors hover:text-primary",
                location === tab.path
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              )}
              data-testid={`link-${tab.name.toLowerCase()}`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
