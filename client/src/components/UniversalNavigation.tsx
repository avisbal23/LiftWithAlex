import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type TabSettings } from "@shared/schema";

export function UniversalNavigation() {
  const [location, navigate] = useLocation();

  // Fixed main navigation items that are always visible
  const mainNavItems = [
    { name: "Home", path: "/", key: "home" },
    { name: "Push", path: "/push", key: "push" },
    { name: "Pull", path: "/pull", key: "pull" },
    { name: "Legs", path: "/legs", key: "legs" },
    { name: "Cardio", path: "/cardio", key: "cardio" }
  ];

  // Additional pages for dropdown menu
  const dropdownPages = [
    { name: "Weight Tracking", path: "/weight", key: "weight" },
    { name: "Steps Tracking", path: "/steps", key: "steps" },
    { name: "Blood Tracking", path: "/blood", key: "blood" },
    { name: "Photo Progress", path: "/photos", key: "photos" },
    { name: "Thoughts & Reflections", path: "/thoughts", key: "thoughts" },
    { name: "Supplements", path: "/supplements", key: "supplements" },
    { name: "Affirmations", path: "/affirmations", key: "affirmations" },
    { name: "Admin", path: "/admin", key: "admin" }
  ];

  const handleNavClick = (path: string) => {
    if (path === "/" && location === "/") {
      // Already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log("Home button clicked - scrolling to top");
    } else {
      // Navigate to selected page
      navigate(path);
      console.log(`Navigating to: ${path}`);
    }
  };

  return (
    <div className="w-full bg-background/50 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Mobile Navigation (screens < md) */}
        <nav className="flex md:hidden items-center w-full">
          {/* Main Navigation Buttons - Mobile (scrollable) */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto pr-1">
            {mainNavItems.map((page, index) => {
              return (
                <Button
                  key={page.key}
                  variant="outline"
                  onClick={() => handleNavClick(page.path)}
                  data-testid={`button-nav-mobile-${page.key}`}
                  className={`
                    flex items-center gap-1 px-2 py-2 rounded-md transition-all duration-200
                    border flex-1 min-w-0 whitespace-nowrap font-medium text-xs
                    ${location === page.path 
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm" 
                      : "bg-background/80 hover:bg-accent hover:text-accent-foreground border-border shadow-sm"
                    }
                  `}
                >
                  <span className="truncate">{page.name.toUpperCase()}</span>
                </Button>
              );
            })}
          </div>

          {/* Menu Dropdown - Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                data-testid="button-menu-dropdown-mobile"
                className="
                  flex items-center gap-2 px-2.5 py-2 rounded-md transition-all duration-200
                  border bg-background/80 hover:bg-accent hover:text-accent-foreground border-border shadow-sm flex-shrink-0
                "
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {dropdownPages.map((page) => (
                <DropdownMenuItem
                  key={page.key}
                  onClick={() => handleNavClick(page.path)}
                  data-testid={`menu-item-mobile-${page.key}`}
                  className={`
                    cursor-pointer
                    ${location === page.path ? "bg-primary/10 text-primary font-medium" : ""}
                  `}
                >
                  {page.name}
                  {location === page.path && (
                    <span className="ml-auto text-xs">•</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Desktop Navigation (screens >= md) */}
        <nav className="hidden md:flex items-center w-full">
          
          {/* Main Navigation Buttons Always Visible */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            {mainNavItems.map((page) => {
              return (
                <Button
                  key={page.key}
                  variant="outline"
                  onClick={() => handleNavClick(page.path)}
                  data-testid={`button-nav-desktop-${page.key}`}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200
                    border flex-1 min-w-0 font-semibold text-sm justify-center
                    ${location === page.path 
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-md scale-105" 
                      : "bg-background/80 hover:bg-accent hover:text-accent-foreground border-border shadow-sm hover:shadow-md hover:scale-[1.02]"
                    }
                  `}
                >
                  <span className="truncate">{page.name.toUpperCase()}</span>
                </Button>
              );
            })}
          </div>

          {/* Dropdown Menu for Additional Pages - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                data-testid="button-menu-dropdown-desktop"
                className="
                  flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200
                  border bg-background/80 hover:bg-accent hover:text-accent-foreground border-border shadow-sm hover:shadow-md hover:scale-[1.02] flex-shrink-0
                "
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {dropdownPages.map((page) => (
                <DropdownMenuItem
                  key={page.key}
                  onClick={() => handleNavClick(page.path)}
                  data-testid={`menu-item-desktop-${page.key}`}
                  className={`
                    cursor-pointer
                    ${location === page.path ? "bg-primary/10 text-primary font-medium" : ""}
                  `}
                >
                  {page.name}
                  {location === page.path && (
                    <span className="ml-auto text-xs">•</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

        </nav>
      </div>
    </div>
  );
}