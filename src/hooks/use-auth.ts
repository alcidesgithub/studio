
"use client";

import type { User, UserRole } from '@/types';
import { loadUsers, saveUsers } from '@/lib/localStorageUtils';
import { useState, useEffect, useCallback } from 'react';

// This is our application's representation of an authenticated user.
// It might differ from what a backend auth system like Supabase provides directly.
export interface AuthenticatedUser extends User {
  // For localStorage auth, User already has what we need.
  // If switching to Supabase, this might combine Supabase user with profile data.
}

interface UseAuthReturn {
  user: AuthenticatedUser | null;
  isLoading: boolean; // Added to reflect that auth state might be loading
  login: (email: string, password?: string) => Promise<AuthenticatedUser | null>; // Password optional if not always needed (e.g. magic link)
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  useEffect(() => {
    setIsLoading(true);
    const storedUserJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson) as AuthenticatedUser;
        // Re-validate against the "DB" (localStorage users) to ensure consistency, e.g., if role changed
        const users = loadUsers();
        const validatedUser = users.find(u => u.id === storedUser.id);
        if (validatedUser) {
          setUser(validatedUser as AuthenticatedUser);
        } else {
          // User in session storage doesn't exist in "DB", clear it
          localStorage.removeItem('currentUser');
          setUser(null);
        }
      } catch (e) {
        console.error("Failed to parse current user from localStorage", e);
        localStorage.removeItem('currentUser');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<AuthenticatedUser | null> => {
    setIsLoading(true);
    const users = loadUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (foundUser) {
      const authenticatedUser = { ...foundUser } as AuthenticatedUser;
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
      }
      setUser(authenticatedUser);
      setIsLoading(false);
      return authenticatedUser;
    }
    setIsLoading(false);
    return null;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    setUser(null);
    setIsLoading(false);
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
    if (!user) {
      return { success: false, message: "Nenhum usuário logado." };
    }
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      return { success: false, message: "Usuário não encontrado." };
    }

    if (users[userIndex].password !== oldPassword) {
      return { success: false, message: "Senha antiga incorreta." };
    }

    users[userIndex].password = newPassword;
    saveUsers(users);

    // Update user in state and localStorage
    const updatedUser = { ...users[userIndex] } as AuthenticatedUser;
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    setUser(updatedUser);

    return { success: true, message: "Senha alterada com sucesso!" };
  }, [user]);

  return { user, isLoading, login, logout, changePassword };
}
