import { useState } from "react";
import { Menu, X, Scale, Droplet, Camera, MessageCircle, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HamburgerMenu() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Force a page refresh to ensure clean state
    window.location.href = "/";
  };

  const menuItems = [
    { name: "Weight Tracking", path: "/weight", icon: Scale },
    { name: "Blood Tracking", path: "/blood-tracking", icon: Droplet },
    { name: "Photo Progress", path: "/photo-progress", icon: Camera },
    { name: "Thoughts & Reflections", path: "/thoughts", icon: MessageCircle },
    { name: "Admin", path: "/admin", icon: Settings },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          data-testid="button-hamburger-menu"
          className="relative backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30 rounded-lg text-white dark:text-gray-700 hover:bg-white/20 dark:hover:bg-gray-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          {/* Button 3D Effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent dark:from-gray-400/10"></div>
          <Menu className="h-5 w-5 relative z-10" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56 backdrop-blur-lg bg-black/80 dark:bg-gray-200/20 border border-white/20 dark:border-gray-600/30 shadow-2xl"
        data-testid="dropdown-hamburger-menu"
      >
        {/* 3D Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/5 dark:from-gray-300/5 dark:to-gray-700/5 rounded-md"></div>
        
        <div className="relative">
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.path} asChild className="relative">
              <Link 
                to={item.path}
                className="flex items-center space-x-3 px-3 py-2 text-white dark:text-gray-800 hover:bg-white/10 dark:hover:bg-gray-500/20 transition-all duration-200 rounded-sm cursor-pointer"
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator className="bg-white/20 dark:bg-gray-600/30" />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 text-white dark:text-gray-800 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all duration-200 rounded-sm cursor-pointer"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}