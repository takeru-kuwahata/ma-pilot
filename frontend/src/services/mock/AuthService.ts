import {
  LoginFormData,
  SignupFormData,
  PasswordResetFormData,
  User,
  ApiResponse,
} from '../../types';

export class AuthService {
  // モックユーザーデータ
  private mockUsers: User[] = [
    {
      id: 'user-1',
      email: 'admin@ma-lstep.local',
      role: 'system_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      email: 'owner@test-clinic.local',
      role: 'clinic_owner',
      clinicId: 'clinic-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-3',
      email: 'editor@test-clinic.local',
      role: 'clinic_editor',
      clinicId: 'clinic-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private mockPasswords: Record<string, string> = {
    'admin@ma-lstep.local': 'DevAdmin2025!',
    'owner@test-clinic.local': 'TestOwner2025!',
    'editor@test-clinic.local': 'TestEditor2025!',
  };

  async login(data: LoginFormData): Promise<ApiResponse<User>> {
    // @MOCK_TO_API: POST {API_PATHS.AUTH.LOGIN}
    // Request: LoginFormData
    // Response: ApiResponse<User>

    // モックログイン処理
    await this.delay(500); // ネットワーク遅延をシミュレート

    const user = this.mockUsers.find((u) => u.email === data.email);
    const password = this.mockPasswords[data.email];

    if (!user || password !== data.password) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // セッションストレージにユーザー情報を保存（実装時はSupabase Authが管理）
    sessionStorage.setItem('currentUser', JSON.stringify(user));

    return {
      data: user,
      message: 'ログインに成功しました',
    };
  }

  async signup(data: SignupFormData): Promise<ApiResponse<User>> {
    // @MOCK_TO_API: POST {API_PATHS.AUTH.SIGNUP}
    // Request: SignupFormData
    // Response: ApiResponse<User>

    await this.delay(500);

    // 招待トークン検証（モック）
    if (data.inviteToken !== 'INVITE-MOCK-TOKEN-123') {
      throw new Error('招待トークンが無効です');
    }

    // パスワード確認
    if (data.password !== data.passwordConfirm) {
      throw new Error('パスワードが一致しません');
    }

    // パスワードポリシーチェック
    if (data.password.length < 8) {
      throw new Error('パスワードは8文字以上で設定してください');
    }

    // 新規ユーザー作成（モック）
    const newUser: User = {
      id: 'user-' + Date.now(),
      email: 'newuser@example.com', // 実装時は招待トークンから取得
      role: 'clinic_viewer',
      clinicId: 'clinic-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockUsers.push(newUser);
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));

    return {
      data: newUser,
      message: 'アカウント作成が完了しました',
    };
  }

  async resetPassword(data: PasswordResetFormData): Promise<ApiResponse<void>> {
    // @MOCK_TO_API: POST {API_PATHS.AUTH.RESET_PASSWORD}
    // Request: PasswordResetFormData
    // Response: ApiResponse<void>

    await this.delay(500);

    // メールアドレス検証（モック）
    const user = this.mockUsers.find((u) => u.email === data.email);
    if (!user) {
      throw new Error('登録されていないメールアドレスです');
    }

    return {
      data: undefined,
      message: 'パスワードリセット用のメールを送信しました',
    };
  }

  async logout(): Promise<void> {
    // @MOCK_TO_API: POST {API_PATHS.AUTH.LOGOUT}
    // Response: void

    await this.delay(200);
    sessionStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
