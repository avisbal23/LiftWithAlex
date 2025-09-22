import { Moon, Sun, Home, Menu, Dumbbell, Activity, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { NavigationMenu } from "@/components/NavigationMenu";
import MiniStopwatch from "@/components/mini-stopwatch";
import { useQuery } from "@tanstack/react-query";
import { type UserSettings } from "@shared/schema";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  // Fetch user settings for dynamic app title
  const { data: userSettings } = useQuery<UserSettings[]>({
    queryKey: ["/api/user-settings"],
  });

  // Get app title from settings or use default
  const appTitle = userSettings?.[0]?.appTitle || "Visbal Gym Tracker";

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
              <h1 className="text-lg font-bold tracking-wide hidden sm:block" data-testid="app-title">
                <span className="relative inline-block">
                  {/* Outer glow effect */}
                  <span className="absolute inset-0 text-white blur-md opacity-30">
                    {appTitle}
                  </span>
                  {/* Inner glow effect */}
                  <span className="absolute inset-0 text-white blur-sm opacity-40">
                    {appTitle}
                  </span>
                  {/* Main Text with subtle glow */}
                  <span className="relative text-white font-extrabold drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">
                    {appTitle}
                  </span>
                </span>
              </h1>
            </div>

            {/* Center: Main Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {[
                { path: "/", icon: Home, label: "Home" },
                { path: "/push", icon: Dumbbell, label: "Push" },
                { path: "/pull", icon: Dumbbell, label: "Pull" },
                { path: "/legs", icon: Dumbbell, label: "Legs" },
                { path: "/cardio", icon: Activity, label: "Cardio" }
              ].map(({ path, icon: Icon, label }) => {
                const isActive = location === path;
                return (
                  <Link key={path} href={path}>
                    <a
                      className={`
                        relative backdrop-blur-sm border border-white/20 dark:border-gray-500/30 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 px-2 py-1.5 sm:px-3 sm:py-2
                        ${isActive 
                          ? 'bg-white/20 dark:bg-gray-500/30 text-white' 
                          : 'bg-white/10 dark:bg-gray-600/20 text-white hover:bg-white/20 dark:hover:bg-gray-500/30'
                        }
                      `}
                      data-testid={`nav-${label.toLowerCase()}`}
                    >
                      {/* Button 3D Effect */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                      <div className="relative z-10 flex items-center space-x-1 sm:space-x-2">
                        <Icon className="h-4 w-4 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
                        <span className="text-xs sm:text-sm font-medium text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">
                          {label}
                        </span>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
            
            {/* Right: Mini Stopwatch, Hamburger Menu, Theme Toggle */}
            <div className="flex items-center space-x-2">
              {/* Mini Stopwatch - hidden on mobile */}
              <div className="hidden md:block">
                <MiniStopwatch />
              </div>

              {/* Hamburger Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMenuOpen(true)}
                data-testid="button-hamburger-menu"
                className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Button 3D Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                <Menu className="h-5 w-5 relative z-10 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
              </Button>

              {/* Theme Toggle */}
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
