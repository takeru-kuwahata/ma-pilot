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
  isLoading: false, // 一時的にfalseに変更（認証初期化処理が未実装のため）
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

  setSelectedClinic: (clinicId) => {
    localStorage.setItem('selectedClinicId', clinicId);
    set({ selectedClinicId: clinicId });
  },

  clearSelectedClinic: () => {
    localStorage.removeItem('selectedClinicId');
    set({ selectedClinicId: null });
  },

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      selectedClinicId: null,
    }),
}));
