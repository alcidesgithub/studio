
// src/hooks/use-auth.ts
"use client";

import type { User } from '@/types';
import { loadUsers, saveUsers } from '@/lib/localStorageUtils';
import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'hiperfarma_auth_user';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User | null>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string; }>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUserString = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUserString) {
        const parsedUser = JSON.parse(storedUserString);
        // Validate the parsed user object
        if (parsedUser && typeof parsedUser.id === 'string' && typeof parsedUser.role === 'string' && typeof parsedUser.name === 'string' && typeof parsedUser.email === 'string') {
          setUser(parsedUser as User);
        } else {
          // Invalid or incomplete user object in localStorage
          console.warn("Invalid user object found in localStorage, clearing auth state.");
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        }
      } else {
        setUser(null); // No user stored
      }
    } catch (error) {
      console.error("Failed to load or parse user from localStorage", error);
      localStorage.removeItem(AUTH_STORAGE_KEY); // Clear potentially corrupted item
      setUser(null);
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
      // Strict password check: password must be provided and must match.
      if (password && foundUser.password === password) {
        setUser(foundUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
        setIsLoading(false);
        return foundUser;
      }
      // If password doesn't match or wasn't provided (and user has one registered)
      setIsLoading(false);
      return null;
    }
    // User not found
    setIsLoading(false);
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Optionally, redirect here or let consuming components handle redirection
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
    
    // Update the user object in state and localStorage
    const updatedUserInAuth = { ...user, password: newPassword };
    setUser(updatedUserInAuth); 
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUserInAuth));

    return { success: true, message: "Senha alterada com sucesso!" };
  }, [user]);

  return { user, isLoading, login, logout, changePassword };
}
