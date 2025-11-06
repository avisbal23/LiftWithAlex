import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { X, Home, Dumbbell, Activity, Scale, Heart, Camera, BookOpen, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { TabSettings } from '@shared/schema';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const [location] = useLocation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Fetch visible tab settings to populate menu
  const { data: tabSettings = [] } = useQuery<TabSettings[]>({
    queryKey: ["/api/tab-settings/visible"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  // Focus management and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when menu opens
      closeButtonRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Handle keyboard navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Tab') {
          // Focus trapping - keep focus within menu
          const focusableElements = overlayRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
            
            if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            } else if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  // Close on outside click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on link click
  const handleLinkClick = () => {
    onClose();
  };

  // Map tab settings to navigation items with icons (excluding main nav items)
  const getNavigationItems = () => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      home: Home,
      push: Dumbbell,
      pull: Dumbbell,
      legs: Dumbbell,
      push2: Dumbbell,
      pull2: Dumbbell,
      legs2: Dumbbell,
      arms: Dumbbell,
      core: Dumbbell,
      cardio: Activity,
      weight: Scale,
      blood: Heart,
      photos: Camera,
      thoughts: BookOpen,
      admin: Settings
    };

    // Filter out main navigation items that are now in the header
    const mainNavItems = ['home', 'push', 'pull', 'legs', 'cardio'];
    
    return tabSettings
      .filter(tab => !mainNavItems.includes(tab.tabKey))
      .map(tab => ({
        ...tab,
        icon: iconMap[tab.tabKey] || Dumbbell
      }));
  };

  const navigationItems = getNavigationItems();

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="navigation-menu-title"
    >
      {/* Main menu content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg mx-auto bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <h2 id="navigation-menu-title" className="text-xl font-semibold">
              More Options
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Close navigation menu"
              data-testid="button-close-menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-6">
            <nav role="navigation" aria-label="Main navigation">
              <ul className="space-y-2">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location === item.routePath;
                  
                  return (
                    <li key={item.tabKey}>
                      <Link href={item.routePath}>
                        <a
                          ref={index === 0 ? firstLinkRef : undefined}
                          onClick={handleLinkClick}
                          className={`
                            flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                            hover:bg-muted/50 hover:scale-[1.02] hover:shadow-md
                            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                            ${isActive 
                              ? 'bg-primary/10 text-primary border-2 border-primary/20' 
                              : 'text-foreground border-2 border-transparent'
                            }
                          `}
                          data-testid={`link-${item.tabKey}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <div className={`
                            p-2 rounded-lg transition-colors
                            ${isActive 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted/50 text-muted-foreground'
                            }
                          `}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.tabName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.routePath}
                            </div>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="text-center text-sm text-muted-foreground">
              Use arrow keys or Tab to navigate • ESC to close
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-in {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}