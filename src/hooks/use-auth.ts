
"use client";

import type { User as AppUser, UserRole } from '@/types'; // Renamed to AppUser to avoid conflict
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import type { User as SupabaseAuthUser, AuthChangeEvent, Session } from '@supabase/supabase-js';

// Combine Supabase user data with our application-specific profile data
export interface AuthenticatedUser extends SupabaseAuthUser {
  app_role: UserRole; // Our application-specific role
  user_name: string; // Our application-specific name
  store_name?: string; // Our application-specific store/vendor name
}

interface UseAuthReturn {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<AuthenticatedUser | null>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; message: string; }>;
}

// Helper function to fetch user profile data from Supabase
async function fetchUserProfile(userId: string): Promise<{ app_role: UserRole; user_name: string; store_name?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles') // Assuming you have a 'profiles' table
      .select('role, name, store_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    if (data) {
      return { app_role: data.role as UserRole, user_name: data.name, store_name: data.store_name };
    }
    return null;
  } catch (e) {
    console.error('Exception fetching user profile:', e);
    return null;
  }
}


export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const getInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setUser({ ...session.user, ...profile });
        } else {
          // Profile not found, might indicate an issue or incomplete signup
          // For now, treat as logged out to force re-auth or profile creation flow
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    getInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setIsLoading(true);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUser({ ...session.user, ...profile });
          } else {
            // If profile is missing after auth event, sign out to prevent partial login state
            await supabase.auth.signOut();
            setUser(null);
            console.warn("User signed in but profile not found. Signing out.");
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<AuthenticatedUser | null> => {
    if (!password) {
      console.error("Password is required for login with Supabase Auth.");
      return null;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Supabase login error:', error.message);
        setIsLoading(false);
        return null;
      }
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          const authenticatedUser = { ...data.user, ...profile };
          setUser(authenticatedUser);
          setIsLoading(false);
          return authenticatedUser;
        } else {
          // User signed in but no profile, this is an issue. Sign them out.
          await supabase.auth.signOut();
          console.error('Login successful but profile not found for user:', data.user.id);
          setIsLoading(false);
          return null;
        }
      }
      setIsLoading(false);
      return null;
    } catch (e) {
      console.error('Exception during login:', e);
      setIsLoading(false);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null); // setUser is already handled by onAuthStateChange, but this is for immediate UI update
    setIsLoading(false);
  }, []);

  const changePassword = useCallback(async (newPassword: string): Promise<{ success: boolean; message: string; }> => {
    // Supabase requires the user to be logged in to change their password.
    // The old password is not required for the updateUser method if using a secure session.
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error('Supabase change password error:', error.message);
      return { success: false, message: error.message || "Erro ao alterar senha." };
    }
    // The user object in state will be updated by onAuthStateChange if successful,
    // or if any metadata changed that we'd care about.
    // For password change, Supabase handles the session update.
    return { success: true, message: "Senha alterada com sucesso!" };
  }, []);

  return { user, isLoading, login, logout, changePassword };
}
