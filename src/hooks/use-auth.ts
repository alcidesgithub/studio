
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
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  useEffect(() => {
    setSystemUsers(loadUsers());
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // NOTE: In a real app, password check would happen here against a backend.
    // For this mock, we only check email. The mock password is used for the change password feature.
    const foundUser = systemUsers.find(u => u.email === email);

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
      setIsLoading(false);
      return foundUser;
    }
    setIsLoading(false);
    return null;
  }, [systemUsers]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: "Nenhum usuário logado." };
    }

    // MOCK PASSWORD CHECK: In a real app, this check would be against a hashed password on the backend.
    // Here we compare against the plaintext mock password.
    if (user.password !== oldPassword) {
      return { success: false, message: "Senha atual incorreta." };
    }

    // Update password in the systemUsers list (our mock "database")
    const updatedSystemUsers = systemUsers.map(u => 
      u.id === user.id ? { ...u, password: newPassword } : u
    );
    saveUsers(updatedSystemUsers); // Save to localStorage
    setSystemUsers(updatedSystemUsers); // Update local state of systemUsers

    // Update password for the currently logged-in user state
    const updatedUser = { ...user, password: newPassword };
    setUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

    return { success: true, message: "Senha alterada com sucesso!" };
  }, [user, systemUsers]);

  return { user, isLoading, login, logout, changePassword };
}
