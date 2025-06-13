
// src/hooks/use-auth.ts
"use client";

import type { User } from '@/types';
import { loadUsers, saveUsers } from '@/lib/localStorageUtils';
import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'hiperfarma_auth_user';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<User | null>;
  logout: () => void;
  // changePassword function removed from interface
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

  const login = useCallback(async (email: string): Promise<User | null> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    const allSystemUsers = loadUsers();
    // For mock purposes, we are not checking password here.
    // In a real app, you would send email and password to a backend.
    const foundUser = allSystemUsers.find(u => u.email === email);

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

  // changePassword function implementation removed

  return { user, isLoading, login, logout }; // changePassword removed from returned object
}
