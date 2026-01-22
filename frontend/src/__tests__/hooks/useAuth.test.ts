import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';

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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態ではloadingがfalse', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ログイン処理が動作する', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    const { supabase } = await import('../../lib/supabase');
    (supabase.auth.signInWithPassword as Mock).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await result.current.login({ email: 'test@example.com', password: 'password' });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('ログアウト処理が動作する', async () => {
    const { supabase } = await import('../../lib/supabase');
    (supabase.auth.signOut as Mock).mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useAuth());

    await result.current.logout();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('ログインエラーが正しく処理される', async () => {
    const { supabase } = await import('../../lib/supabase');
    (supabase.auth.signInWithPassword as Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useAuth());

    await result.current.login({ email: 'wrong@example.com', password: 'wrong' });

    expect(result.current.error).toContain('Invalid credentials');
  });

  it('現在のユーザー情報を取得できる', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'clinic_owner' as const,
      clinicId: 'clinic-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    // authServiceをモック
    vi.doMock('../../services/api', () => ({
      authService: {
        getCurrentUser: vi.fn(() => mockUser),
      },
    }));

    const { result } = renderHook(() => useAuth());

    const user = result.current.getCurrentUser();
    expect(user).toEqual(mockUser);
  });
});
