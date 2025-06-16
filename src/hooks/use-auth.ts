
// src/hooks/use-auth.ts
"use client";

import type { User } from '@/types';
import { loadUsers, saveUsers } from '@/lib/localStorageUtils';
import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'hiperfarma_auth_user';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User | null>; // Made password optional for now
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string; }>;
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

  const login = useCallback(async (email: string, password?: string): Promise<User | null> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    const allSystemUsers = loadUsers();
    const foundUser = allSystemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser) {
      // If password is provided, check it. Otherwise, for now, allow login (maintaining old behavior if password not sent from form)
      // In a real app, password would always be required and checked.
      if (password && foundUser.password !== password) {
        setIsLoading(false);
        return null; // Password incorrect
      }
      // If no password provided by login form, or if password matches
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

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
    if (!user) {
      return { success: false, message: "Nenhum usuário logado." };
    }

    const allUsers = loadUsers();
    const userIndex = allUsers.findIndex(u => u.email === user.email);

    if (userIndex === -1) {
      return { success: false, message: "Usuário não encontrado no sistema." };
    }

    const userToUpdate = allUsers[userIndex];

    if (userToUpdate.password !== oldPassword) {
      return { success: false, message: "Senha atual incorreta." };
    }

    allUsers[userIndex] = { ...userToUpdate, password: newPassword };
    saveUsers(allUsers);
    setUser(allUsers[userIndex]); // Update user in state with new password potentially
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(allUsers[userIndex]));

    return { success: true, message: "Senha alterada com sucesso!" };
  }, [user]);

  return { user, isLoading, login, logout, changePassword };
}
