import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon, Menu } from "lucide-react";
import { NavigationMenu } from "@/components/NavigationMenu";
import { useLocation } from "wouter";

export function UniversalNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, navigate] = useLocation();

  const handleHomeClick = () => {
    if (location === "/") {
      // Already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home page
      navigate("/");
    }
  };

  return (
    <>
      {/* Full-width Navigation button */}
      <div className="w-full bg-background/50 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-full relative backdrop-blur-sm bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 py-3 flex items-center justify-between">
            {/* Home Navigation - left side */}
            <Button 
              variant="ghost"
              onClick={handleHomeClick}
              data-testid="button-home-nav"
              className="flex-1 h-full flex items-center justify-center gap-2 hover:bg-primary/10 rounded-l-lg"
            >
              <HomeIcon className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </Button>
            
            {/* Divider */}
            <div className="w-px h-6 bg-primary/30"></div>
            
            {/* Menu Dropdown - right side */}
            <Button 
              variant="ghost"
              onClick={() => setIsMenuOpen(true)}
              data-testid="button-menu-dropdown"
              className="px-4 h-full flex items-center justify-center hover:bg-primary/10 rounded-r-lg"
            >
              <Menu className="h-4 w-4 opacity-70" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu Overlay */}
      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </>
  );
}