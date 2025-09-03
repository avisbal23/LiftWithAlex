import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Dumbbell } from 'lucide-react';

export function PasswordGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Listen for authentication success and trigger dissolve
  useEffect(() => {
    if (isAuthenticated && !isDissolving) {
      setIsDissolving(true);
      // After dissolve animation completes, hide component completely
      setTimeout(() => {
        setShouldHide(true);
      }, 1000); // Match the animation duration
    }
  }, [isAuthenticated, isDissolving]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a small delay for better UX
    setTimeout(() => {
      const success = login(password);
      if (!success) {
        setError('Incorrect password. Please try again.');
        setPassword('');
        setIsLoading(false);
      }
      // If success, isLoading will stay true while dissolving
    }, 500);
  };

  // Don't render anything if should hide
  if (shouldHide) {
    return null;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4 transition-all duration-1000 ${
      isDissolving ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-none'
    }`}>
      {/* Glassmorphism Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
      
      <Card className={`w-full max-w-md relative backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl shadow-primary/20 transition-all duration-1000 ${
        isDissolving ? 'opacity-0 scale-90 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
      }`}>
        {/* Glass effect overlay */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/20 to-transparent dark:from-gray-400/20 pointer-events-none"></div>
        
        <CardHeader className="text-center space-y-4 relative z-10">
          {/* 3D Glass Icon */}
          <div className="mx-auto w-16 h-16 relative">
            <div className="absolute inset-0 backdrop-blur-sm bg-primary/20 dark:bg-primary/30 rounded-full border border-white/30 dark:border-gray-400/30 shadow-lg">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent dark:from-gray-400/30"></div>
            </div>
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              Visbal Gym Tracker
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Enter your password to access your personal gym tracker
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 backdrop-blur-sm bg-white/20 dark:bg-gray-600/25 border border-white/30 dark:border-gray-500/40 placeholder:text-muted-foreground/60"
                  required
                  disabled={isLoading}
                  data-testid="input-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 dark:text-red-400" data-testid="text-error">
                  {error}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/30 disabled:opacity-50"
              disabled={isLoading || isDissolving}
              data-testid="button-login"
            >
              {isDissolving ? 'Success! Loading...' : isLoading ? 'Verifying...' : 'Access Tracker'}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground/60">
              Your session will remain active for 24 hours
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}