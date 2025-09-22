import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon, Menu, ChevronDown, Dumbbell, Activity } from "lucide-react";
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
    { name: "Home", path: "/", key: "home", icon: HomeIcon },
    { name: "Push", path: "/push", key: "push", icon: Dumbbell },
    { name: "Pull", path: "/pull", key: "pull", icon: Dumbbell },
    { name: "Legs", path: "/legs", key: "legs", icon: Dumbbell },
    { name: "Cardio", path: "/cardio", key: "cardio", icon: Activity }
  ];

  // Additional pages for dropdown menu
  const dropdownPages = [
    { name: "Weight Tracking", path: "/weight", key: "weight" },
    { name: "Blood Tracking", path: "/blood", key: "blood" },
    { name: "Photo Progress", path: "/photos", key: "photos" },
    { name: "Thoughts & Reflections", path: "/thoughts", key: "thoughts" },
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
        <nav className="flex md:hidden items-center justify-between gap-2 w-full">
          {/* Home Button - Mobile */}
          <Button 
            variant={location === "/" ? "default" : "outline"}
            onClick={() => handleNavClick("/")}
            data-testid="button-home-nav-mobile"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
              border-2 flex-shrink-0
              ${location === "/" 
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                : "border-white dark:border-black bg-transparent hover:bg-muted"
              }
            `}
          >
            <HomeIcon className="h-4 w-4" />
            <span className="font-medium text-sm">Home</span>
          </Button>

          {/* Current Page Indicator - Mobile */}
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-muted-foreground">
              {mainNavItems.find(page => page.path === location)?.name || "Home"}
            </span>
          </div>

          {/* Menu Dropdown - Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                data-testid="button-menu-dropdown-mobile"
                className="
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                  border-2 border-white dark:border-black bg-transparent hover:bg-muted flex-shrink-0
                "
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {[...mainNavItems.filter(page => page.path !== "/"), ...dropdownPages].map((page) => (
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
        <nav className="hidden md:flex items-center gap-2 w-full">
          
          {/* Main Navigation Buttons Always Visible */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {mainNavItems.map((page) => {
              const Icon = page.icon;
              return (
                <Button
                  key={page.key}
                  variant={location === page.path ? "default" : "outline"}
                  onClick={() => handleNavClick(page.path)}
                  data-testid={`button-nav-desktop-${page.key}`}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                    border-2 flex-1 min-w-0
                    ${location === page.path 
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                      : "border-white dark:border-black bg-transparent hover:bg-muted"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium truncate">{page.name}</span>
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
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                  border-2 border-white dark:border-black bg-transparent hover:bg-muted flex-shrink-0
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