/**
 * 全局状态管理 (Zustand)
 */

import { create } from 'zustand';
import type { User } from 'protohub-shared';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) =>
    set({ user, token }, false, 'login'),
  logout: () =>
    set({ user: null, token: null }, false, 'logout'),
}));

/**
 * 应用状态
 */
interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
}));
