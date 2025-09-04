import { Moon, Sun, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { NavigationMenu } from "@/components/NavigationMenu";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDarkMode = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <header className="relative">
      {/* Glassmorphism Background */}
      <div className="backdrop-blur-lg bg-black/80 dark:bg-gray-200/20 border-b border-white/10 dark:border-gray-600/30 shadow-2xl">
        {/* 3D Shadow Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/5 dark:from-gray-300/5 dark:to-gray-700/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: App Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold tracking-wide" data-testid="app-title">
                <span className="relative inline-block">
                  {/* Outer glow effect */}
                  <span className="absolute inset-0 text-white blur-md opacity-30">
                    Visbal Gym Tracker
                  </span>
                  {/* Inner glow effect */}
                  <span className="absolute inset-0 text-white blur-sm opacity-40">
                    Visbal Gym Tracker
                  </span>
                  {/* Main Text with subtle glow */}
                  <span className="relative text-white font-extrabold drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">
                    Visbal Gym Tracker
                  </span>
                </span>
              </h1>
            </div>

            {/* Center: Navigation Home Button */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Button 
                variant="ghost"
                onClick={() => setIsMenuOpen(true)}
                data-testid="button-home-menu"
                className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 px-4 py-2"
              >
                {/* Button 3D Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                <div className="flex items-center gap-2 relative z-10">
                  <Home className="h-5 w-5 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
                  <span className="font-medium text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">
                    Home
                  </span>
                  <Menu className="h-4 w-4 text-white/70 drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
                </div>
              </Button>
            </div>
            
            {/* Right: Theme Toggle and Home Icon */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Button 3D Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                {isDark ? 
                  <Sun className="h-5 w-5 relative z-10 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" /> : 
                  <Moon className="h-5 w-5 relative z-10 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
                }
              </Button>
              
              {/* Home Icon Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMenuOpen(true)}
                data-testid="button-home-icon"
                className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Button 3D Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                <Home className="h-5 w-5 relative z-10 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom highlight line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-gray-400/20 to-transparent"></div>
      </div>

      {/* Navigation Menu Overlay */}
      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </header>
  );
}
