import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { apiClient } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('topkpi_token');
    const savedUser = localStorage.getItem('topkpi_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with server in background
        apiClient<User>('/auth/me')
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem('topkpi_user', JSON.stringify(freshUser));
          })
          .catch(() => {
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('topkpi_token', newToken);
    localStorage.setItem('topkpi_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('topkpi_token');
    localStorage.removeItem('topkpi_user');
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updated };
      setUser(merged);
      localStorage.setItem('topkpi_user', JSON.stringify(merged));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
