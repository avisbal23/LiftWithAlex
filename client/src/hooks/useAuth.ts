import { useState, useEffect } from 'react';

const AUTH_KEY = 'visbal_gym_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthState {
  isAuthenticated: boolean;
  timestamp: number;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const authData = localStorage.getItem(AUTH_KEY);
      if (authData) {
        const { isAuthenticated: storedAuth, timestamp }: AuthState = JSON.parse(authData);
        const now = Date.now();
        
        // Check if session is still valid (within 24 hours)
        if (storedAuth && (now - timestamp) < SESSION_DURATION) {
          setIsAuthenticated(true);
        } else {
          // Session expired, clear it
          logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      logout();
    }
  };

  const login = (password: string): boolean => {
    // Simple password check - you can change this password
    const correctPassword = 'visbal2025';
    
    if (password === correctPassword) {
      const authData: AuthState = {
        isAuthenticated: true,
        timestamp: Date.now()
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    login,
    logout
  };
}