
// src/hooks/use-auth.ts
"use client";

import type { User } from '@/types';
import { loadUsers } from '@/lib/localStorageUtils'; 
import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'hiperfarma_auth_user';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<User | null>; // Role hint removed
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load users for login validation
    setSystemUsers(loadUsers());

    // Load authenticated user from session
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

  const login = useCallback(async (email: string): Promise<User | null> => { // roleHint parameter removed
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use systemUsers (loaded from local storage) for validation
    // Find user based on email only
    const foundUser = systemUsers.find(u => u.email === email);
    // The password check would happen here in a real app, e.g., by sending email and password to a backend.
    // For this mock, we assume if email matches, login is successful.

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
      setIsLoading(false);
      return foundUser;
    }
    setIsLoading(false);
    return null;
  }, [systemUsers]); // Depend on systemUsers

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return { user, isLoading, login, logout };
}
