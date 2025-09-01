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
  { name: "Weight", path: "/weight" },
  { name: "Blood", path: "/blood" },
  { name: "Photos", path: "/photos" },
  { name: "Thoughts", path: "/thoughts" },
];

export default function Navigation() {
  const [location] = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep selected tab visible, then reset scroll position
  useEffect(() => {
    const rightSideTabs = ["/pull2", "/legs2", "/cardio", "/weight", "/blood", "/photos", "/thoughts"];
    
    if (rightSideTabs.includes(location) && navRef.current) {
      const tabIndex = tabs.findIndex(tab => tab.path === location);
      if (tabIndex !== -1) {
        const tabElement = navRef.current.children[tabIndex] as HTMLElement;
        if (tabElement) {
          // Scroll to show the selected tab briefly
          tabElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
          });
          
          // After a short delay, scroll back to the beginning to prevent horizontal scroll lock
          setTimeout(() => {
            if (navRef.current) {
              navRef.current.scrollTo({
                left: 0,
                behavior: "smooth"
              });
            }
          }, 1000);
        }
      }
    } else if (navRef.current) {
      // For left-side tabs, ensure we're scrolled to the beginning
      navRef.current.scrollTo({
        left: 0,
        behavior: "smooth"
      });
    }
  }, [location]);

  return (
    <nav className="bg-card border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={navRef} className="flex space-x-3 overflow-x-auto scrollbar-hide py-3">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "relative px-4 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 rounded-lg transition-all duration-200 ease-in-out transform",
                location === tab.path
                  ? "bg-gradient-to-b from-primary to-primary/80 text-white shadow-lg shadow-primary/30 -translate-y-0.5 scale-105"
                  : "bg-gradient-to-b from-muted to-muted/70 text-muted-foreground hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 active:translate-y-0 active:shadow-sm"
              )}
              data-testid={`link-${tab.name.toLowerCase().replace(' ', '-')}`}
            >
              {/* 3D Effect - Top highlight */}
              <div className={cn(
                "absolute inset-x-0 top-0 h-px rounded-t-lg",
                location === tab.path
                  ? "bg-white/30"
                  : "bg-white/20 dark:bg-white/10"
              )}></div>
              
              {/* 3D Effect - Bottom shadow */}
              <div className={cn(
                "absolute inset-x-0 bottom-0 h-px rounded-b-lg",
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
