
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
    await new Promise(resolve => setTimeout(resolve, 500));

    const allSystemUsers = loadUsers();
    const foundUser = allSystemUsers.find(u => u.email === email);

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
      setIsLoading(false);
      return foundUser;
    }
    setIsLoading(false);
    return null;
  }, []); // Adicionado setUser como dependência se fosse modificar o estado aqui, mas login define externamente.

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []); // Adicionado setUser como dependência

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !user.id) { // `user` é o estado do hook useAuth
        return { success: false, message: "Usuário não autenticado." };
    }

    const allSystemUsers = loadUsers(); // Carrega a lista mais atual de TODOS os usuários
    const userFromSystemList = allSystemUsers.find(u => u.id === user.id); // Encontra o usuário logado na lista do sistema

    if (!userFromSystemList) {
      return { success: false, message: "Usuário não encontrado no sistema para atualização de senha." };
    }

    // A senha para verificação é a do userFromSystemList, que é a mais atualizada da lista geral.
    // Garante que mesmo que a senha seja undefined (legado ou erro), a comparação não falhe inesperadamente.
    const systemPassword = userFromSystemList.password || ""; 
    if (systemPassword !== oldPassword) {
      return { success: false, message: "Senha atual incorreta." };
    }

    // Se a verificação passar, atualize a senha na lista geral de usuários
    const updatedSystemUsers = allSystemUsers.map(u =>
      u.id === userFromSystemList.id ? { ...u, password: newPassword } : u
    );
    saveUsers(updatedSystemUsers); // Salva a lista geral atualizada

    // Atualize o estado do usuário no hook e no AUTH_STORAGE_KEY
    // Use userFromSystemList como base e apenas atualize sua senha.
    const updatedAuthUser = { ...userFromSystemList, password: newPassword };
    setUser(updatedAuthUser); // Atualiza o estado do hook useAuth
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedAuthUser)); // Atualiza o usuário autenticado no localStorage

    return { success: true, message: "Senha alterada com sucesso!" };
  }, [user, setUser]);

  return { user, isLoading, login, logout, changePassword };
}
