import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import React from 'react';

// Supabaseクライアントをモック
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// authServiceをモック
vi.mock('../../services/api', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    getCurrentUser: vi.fn(() => null),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, children);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態ではloadingがfalse', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ログイン処理が動作する', async () => {
    const { authService } = await import('../../services/api');
    (authService.login as Mock).mockResolvedValueOnce({
      user: { id: 'user-1', email: 'test@example.com', role: 'clinic_owner' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.login({ email: 'test@example.com', password: 'password' });

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('ログアウト処理が動作する', async () => {
    const { authService } = await import('../../services/api');
    (authService.logout as Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.logout();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('ログインエラーが正しく処理される', async () => {
    const { authService } = await import('../../services/api');
    (authService.login as Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'wrong@example.com', password: 'wrong' });
    });

    expect(result.current.error).toContain('Invalid credentials');
  });

  it('現在のユーザー情報を取得できる', async () => {
    const { authService } = await import('../../services/api');
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'clinic_owner' as const,
      clinicId: 'clinic-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    (authService.getCurrentUser as Mock).mockReturnValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const user = result.current.getCurrentUser();
    expect(user).toEqual(mockUser);
  });
});
