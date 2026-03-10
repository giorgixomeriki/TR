import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { TOKEN_KEY } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verify stored token on app mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data.user);
        setIsAuthenticated(true);
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback((userData, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
