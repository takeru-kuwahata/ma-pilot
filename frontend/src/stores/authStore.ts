import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedClinicId: string | null; // system_admin用クリニック選択
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSelectedClinic: (clinicId: string) => void;
  clearSelectedClinic: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedClinicId: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setSelectedClinic: (clinicId) =>
    set({
      selectedClinicId: clinicId,
    }),

  clearSelectedClinic: () =>
    set({
      selectedClinicId: null,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      selectedClinicId: null,
    }),
}));
