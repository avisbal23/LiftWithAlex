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
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={navRef} className="flex space-x-6 overflow-x-auto scrollbar-hide">
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
