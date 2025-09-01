import { Moon, Sun, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const { isAuthenticated, user } = useAuth();

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
            <div className="flex items-center space-x-4">
              {/* 3D Modern Title */}
              <h1 className="text-xl font-bold text-white dark:text-gray-800 tracking-wide" data-testid="app-title">
                <span className="relative inline-block">
                  {/* Text Shadow for 3D Effect */}
                  <span className="absolute inset-0 text-white/20 dark:text-gray-600/30 transform translate-x-0.5 translate-y-0.5 blur-sm">
                    Visbal Gym Tracker
                  </span>
                  {/* Main Text */}
                  <span className="relative bg-gradient-to-b from-white to-gray-200 dark:from-gray-800 dark:to-gray-600 bg-clip-text text-transparent font-extrabold">
                    Visbal Gym Tracker
                  </span>
                  {/* Top highlight */}
                  <span className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-gray-400/40 bg-clip-text text-transparent transform -translate-y-px">
                    Visbal Gym Tracker
                  </span>
                </span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* User Authentication Controls */}
              {isAuthenticated && (
                <>
                  {/* User Info */}
                  {user && (
                    <div className="flex items-center space-x-2 text-white dark:text-gray-700 text-sm">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {user.firstName || user.email || 'User'}
                      </span>
                    </div>
                  )}
                  
                  {/* Admin Button */}
                  <Link to="/admin">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      data-testid="button-admin"
                      className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white dark:text-gray-700 hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      {/* Button 3D Effect */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                      <Settings className="h-5 w-5 relative z-10" />
                    </Button>
                  </Link>
                  
                  {/* Logout Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="button-logout"
                    className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white dark:text-gray-700 hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {/* Button 3D Effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                    <LogOut className="h-5 w-5 relative z-10" />
                  </Button>
                </>
              )}
              
              {/* Theme Toggle - Always Visible */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white dark:text-gray-700 hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Button 3D Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
                {isDark ? <Sun className="h-5 w-5 relative z-10" /> : <Moon className="h-5 w-5 relative z-10" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom highlight line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-gray-400/20 to-transparent"></div>
      </div>
    </header>
  );
}
