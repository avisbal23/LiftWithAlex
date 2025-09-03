import { Link, useLocation } from "wouter";
import { useEffect, useRef } from "react";
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
  const navRef = useRef<HTMLDivElement>(null);

  // Keep selected tab visible without auto-scrolling back
  useEffect(() => {
    if (navRef.current) {
      const tabIndex = tabs.findIndex(tab => tab.path === location);
      if (tabIndex !== -1) {
        const tabElement = navRef.current.children[tabIndex] as HTMLElement;
        if (tabElement) {
          // Scroll to show the selected tab and keep it visible
          tabElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
          });
        }
      }
    }
  }, [location]);

  return (
    <nav className="backdrop-blur-md bg-white/20 dark:bg-gray-900/30 border-b border-white/30 dark:border-gray-600/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={navRef} className="flex space-x-3 overflow-x-auto scrollbar-hide py-3">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "relative px-4 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 rounded-xl transition-all duration-300 ease-in-out transform",
                location === tab.path
                  ? "backdrop-blur-sm bg-primary dark:bg-primary text-white shadow-lg shadow-primary/30 -translate-y-0.5 scale-105 border border-primary/60 dark:border-primary/70"
                  : "backdrop-blur-sm bg-white/20 dark:bg-gray-700/30 text-muted-foreground hover:bg-primary/20 dark:hover:bg-primary/20 hover:text-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 active:translate-y-0 active:shadow-sm border border-white/20 dark:border-gray-600/30"
              )}
              data-testid={`link-${tab.name.toLowerCase().replace(' ', '-')}`}
            >
              {/* Glass shine effect */}
              <div className={cn(
                "absolute inset-0.5 bg-gradient-to-b from-white/30 to-transparent dark:from-gray-300/30 rounded-lg opacity-60",
                location === tab.path ? "opacity-40" : "opacity-20"
              )}></div>
              
              {/* 3D Effect - Top highlight */}
              <div className={cn(
                "absolute inset-x-0 top-0 h-px rounded-t-xl",
                location === tab.path
                  ? "bg-white/40"
                  : "bg-white/20 dark:bg-white/10"
              )}></div>
              
              {/* 3D Effect - Bottom shadow */}
              <div className={cn(
                "absolute inset-x-0 bottom-0 h-px rounded-b-xl",
                location === tab.path
                  ? "bg-black/20"
                  : "bg-black/10 dark:bg-black/20"
              )}></div>
              
              <span className="relative z-10">{tab.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
