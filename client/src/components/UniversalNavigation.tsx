import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon, Menu, ChevronDown } from "lucide-react";
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

  // Fetch visible tab settings from the API
  const { data: visibleTabSettings = [] } = useQuery<TabSettings[]>({
    queryKey: ["/api/tab-settings/visible"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  // Always include Home page as it's always visible
  const homePage = { name: "Home", path: "/", key: "home", tabKey: "home" };
  
  // Map tab settings to page format and filter by visibility
  const visiblePages = [
    homePage,
    ...visibleTabSettings
      .filter(tab => tab.tabKey !== "home") // Exclude home since we already added it
      .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order
      .map(tab => ({
        name: tab.tabName,
        path: tab.routePath,
        key: tab.tabKey,
        tabKey: tab.tabKey,
      }))
  ];

  // Admin page is always accessible but not controlled by tab settings
  const adminPage = { name: "Admin", path: "/admin", key: "admin", tabKey: "admin" };
  
  // Split visible pages: first 6 as buttons, rest in dropdown
  const navbarPages = visiblePages.slice(0, 6); // Home + next 5 visible
  const dropdownPages = visiblePages.slice(6); // Remaining visible pages

  // Admin is ALWAYS available in dropdown menu (regardless of database state)
  // Admin should never be in navbar buttons, always in dropdown
  if (!dropdownPages.some(p => p.key === "admin")) {
    dropdownPages.push(adminPage);
  }

  // For mobile navigation and current page display, include all pages including admin
  const allPagesForCurrentDisplay = [...visiblePages];
  if (!allPagesForCurrentDisplay.some(p => p.path === "/admin")) {
    allPagesForCurrentDisplay.push(adminPage);
  }

  const handleHomeClick = () => {
    if (location === "/") {
      // Already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log("Home button clicked - scrolling to top");
    } else {
      // Navigate to home page
      navigate("/");
      console.log("Home button clicked - navigating to home");
    }
  };

  const handlePageClick = (path: string) => {
    navigate(path);
    console.log(`Navigating to: ${path}`);
  };

  return (
    <div className="w-full bg-background/50 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Mobile Navigation (screens < md) */}
        <nav className="flex md:hidden items-center justify-between gap-2 w-full">
          {/* Home Button - Mobile */}
          <Button 
            variant={location === "/" ? "default" : "outline"}
            onClick={handleHomeClick}
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
              {allPagesForCurrentDisplay.find(page => page.path === location)?.name || "Home"}
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
              {allPagesForCurrentDisplay.filter(page => page.path !== "/").map((page) => (
                <DropdownMenuItem
                  key={page.key}
                  onClick={() => handlePageClick(page.path)}
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
          
          {/* Home Button - Desktop */}
          <Button 
            variant={location === "/" ? "default" : "outline"}
            onClick={handleHomeClick}
            data-testid="button-home-nav-desktop"
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
              border-2 flex-shrink-0
              ${location === "/" 
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                : "border-white dark:border-black bg-transparent hover:bg-muted"
              }
            `}
          >
            <HomeIcon className="h-4 w-4" />
            <span className="font-medium">Home</span>
          </Button>

          {/* Main Navigation Pages (next 5 pages) - Desktop */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {navbarPages.slice(1).map((page) => (
              <Button
                key={page.key}
                variant={location === page.path ? "default" : "outline"}
                onClick={() => handlePageClick(page.path)}
                data-testid={`button-nav-desktop-${page.key}`}
                className={`
                  px-4 py-2 rounded-lg transition-all duration-200
                  border-2 flex-1 min-w-0
                  ${location === page.path 
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                    : "border-white dark:border-black bg-transparent hover:bg-muted"
                  }
                `}
              >
                <span className="font-medium truncate">{page.name}</span>
              </Button>
            ))}
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
                  onClick={() => handlePageClick(page.path)}
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