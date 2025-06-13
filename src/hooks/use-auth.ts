
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
  // systemUsers state no hook useAuth é apenas para o login inicial.
  // A alteração de senha deve buscar os dados mais recentes do localStorage.
  // const [systemUsers, setSystemUsers] = useState<User[]>([]); 

  useEffect(() => {
    // setSystemUsers(loadUsers()); // Carrega todos os usuários para o processo de login
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
    
    const allSystemUsers = loadUsers(); // Carrega usuários no momento do login
    
    // NOTE: In a real app, password check would happen here against a backend.
    // For this mock, we only check email. The mock password is used for the change password feature.
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

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    // Recarregar o usuário ATUAL do localStorage para garantir que temos a senha mais recente para ele.
    // E recarregar TODOS os usuários para atualizar a senha na lista geral.
    const currentAuthUserJson = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!currentAuthUserJson) {
         return { success: false, message: "Nenhum usuário autenticado encontrado no armazenamento local." };
    }
    const currentAuthUser = JSON.parse(currentAuthUserJson) as User;


    const allSystemUsers = loadUsers(); // Carrega a lista mais atual de TODOS os usuários
    const userToUpdateInSystem = allSystemUsers.find(u => u.id === currentAuthUser.id);

    if (!userToUpdateInSystem) {
      return { success: false, message: "Usuário não encontrado no sistema para atualização de senha." };
    }

    // MOCK PASSWORD CHECK:
    // Comparar a 'oldPassword' com a senha do 'userToUpdateInSystem' (que é a mais recente do localStorage)
    if (userToUpdateInSystem.password !== oldPassword) {
      return { success: false, message: "Senha atual incorreta." };
    }

    // Atualizar a senha na lista de todos os usuários
    const updatedSystemUsers = allSystemUsers.map(u => 
      u.id === userToUpdateInSystem.id ? { ...u, password: newPassword } : u
    );
    saveUsers(updatedSystemUsers); // Salva a lista completa e atualizada no localStorage

    // Atualizar a senha para o estado do usuário logado (user) e no AUTH_STORAGE_KEY
    const updatedLoggedInUser = { ...userToUpdateInSystem, password: newPassword };
    setUser(updatedLoggedInUser); // Atualiza o estado do hook
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedLoggedInUser)); // Atualiza o usuário autenticado no localStorage

    return { success: true, message: "Senha alterada com sucesso!" };
  }, []); // user (o estado do hook) não é mais estritamente necessário como dependência aqui,
          // pois estamos sempre pegando a versão mais fresca do localStorage. Mas mantê-lo não prejudica.

  return { user, isLoading, login, logout, changePassword };
}
