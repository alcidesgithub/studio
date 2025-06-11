
// src/hooks/use-auth.ts
"use client";

import type { User, UserRole } from '@/types';
// import { MOCK_USERS } from '@/lib/constants'; // No longer directly use MOCK_USERS for login
import { loadUsers } from '@/lib/localStorageUtils'; // Import loadUsers
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

  const login = useCallback(async (email: string, roleHint?: UserRole): Promise<User | null> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use systemUsers (loaded from local storage) for validation
    let foundUser = systemUsers.find(u => u.email === email);
    if (foundUser && roleHint && foundUser.role !== roleHint) {
        foundUser = systemUsers.find(u => u.email === email && u.role === roleHint) || foundUser;
    }

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
    // Optionally redirect here or in consuming components
    // router.push('/login'); 
  }, []);

  return { user, isLoading, login, logout };
}
