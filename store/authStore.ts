/**
 * Auth Store - Gestión de autenticación con JWT
 */

import { create } from 'zustand';
import { authService, type User } from '@/services/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  // Cargar sesión guardada
  loadSession: async () => {
    set({ isLoading: true });
    try {
      const session = await authService.getSession();
      
      if (session) {
        set({ 
          user: session.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading session:', error);
      set({ isLoading: false });
    }
  },

  // Login
  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.login(username, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Registro
  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.register(username, email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  // Establecer usuario manualmente
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));
