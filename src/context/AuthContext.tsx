import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (userData: { name: string; email: string; password: string; phone?: string; address?: string }) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (email?: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default sample users for quick demo testing
const DEMO_USERS: Record<UserRole, User> = {
  RESIDENT: {
    id: 'USR-RES-001',
    name: 'Ananya Sharma',
    email: 'resident@ecoscan.org',
    role: 'RESIDENT',
    phone: '+91 98765 43210',
    houseId: 'H-101',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  COLLECTOR: {
    id: 'USR-COL-001',
    name: 'Rajesh Kumar',
    email: 'collector@ecoscan.org',
    role: 'COLLECTOR',
    phone: '+91 94221 88765',
    status: 'ACTIVE',
    createdAt: '2026-01-10T06:00:00.000Z',
  },
  ADMIN: {
    id: 'USR-ADM-001',
    name: 'EcoScan Admin',
    email: 'admin@ecoscan.org',
    role: 'ADMIN',
    phone: '+91 80000 11223',
    status: 'ACTIVE',
    createdAt: '2025-12-01T00:00:00.000Z',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage for persisted session
    try {
      const savedUser = localStorage.getItem('ecoscan_user');
      const savedToken = localStorage.getItem('ecoscan_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } else {
        // Default to resident demo for immediate convenience if desired
      }
    } catch (e) {
      console.error('Failed to load stored auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('ecoscan_user', JSON.stringify(newUser));
    localStorage.setItem('ecoscan_token', newToken);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user, data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error occurred while connecting to server.' };
    }
  };

  const signup = async (userData: { name: string; email: string; password: string; phone?: string; address?: string }) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user, data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error occurred during sign up.' };
    }
  };

  const loginWithGoogle = async (googleEmail?: string, googleName?: string) => {
    try {
      // Use provided email or fallback to selected/prompted Google account
      const email = googleEmail || 'hiteshmishra2810@gmail.com';
      const name = googleName || 'Hitesh Mishra';

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user, data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Google sign in failed.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to authenticate with Google.' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to send reset link.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ecoscan_user');
    localStorage.removeItem('ecoscan_token');
  };

  const switchDemoRole = (role: UserRole) => {
    const demo = DEMO_USERS[role];
    saveSession(demo, `eco_demo_token_${role}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        forgotPassword,
        logout,
        switchDemoRole,
      }}
    >
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
