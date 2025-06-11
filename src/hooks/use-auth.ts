// src/hooks/use-auth.ts
"use client";

import type { User, UserRole } from '@/types';
import { MOCK_USERS } from '@/lib/constants';
import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'hiperfarma_auth_user';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string, roleHint?: UserRole) => Promise<User | null>; // Role hint for mock
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, roleHint?: UserRole): Promise<User | null> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser && roleHint && foundUser.role !== roleHint) {
        // If role hint provided and doesn't match, try to find one that does (for easier mocking in login form)
        foundUser = MOCK_USERS.find(u => u.email === email && u.role === roleHint) || foundUser;
    }


    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
      setIsLoading(false);
      return foundUser;
    }
    setIsLoading(false);
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return { user, isLoading, login, logout };
}
