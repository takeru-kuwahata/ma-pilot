#!/usr/bin/env python3
"""
MA-Pilot 管理者パスワードリセットスクリプト

使用方法:
  python reset_password.py

環境変数:
  SUPABASE_URL: SupabaseプロジェクトURL
  SUPABASE_SERVICE_ROLE_KEY: Supabase Service Role Key（管理者キー）
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print('❌ エラー: SUPABASE_URLまたはSUPABASE_SERVICE_ROLE_KEYが設定されていません')
    print('   .env.localファイルに以下を追加してください:')
    print('   SUPABASE_URL=https://your-project.supabase.co')
    print('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
    exit(1)

# Supabaseクライアント作成（Service Role Keyで管理者権限）
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def reset_admin_password():
    """管理者パスワードをリセット"""

    email = 'admin@ma-pilot.local'
    new_password = 'DevAdmin2025A'

    try:
        print(f'🔄 {email} のパスワードをリセット中...')

        # ユーザー検索
        users = supabase.auth.admin.list_users()
        admin_user = None
        for user in users:
            if user.email == email:
                admin_user = user
                break

        if not admin_user:
            print(f'❌ エラー: {email} が見つかりません')
            print('   Supabase Dashboard → Authentication → Users で作成してください')
            return False

        print(f'✅ ユーザー発見: ID={admin_user.id}')

        # パスワード更新（Admin API使用）
        supabase.auth.admin.update_user_by_id(
            admin_user.id,
            {
                'password': new_password,
                'email_confirm': True  # メール確認をスキップ
            }
        )

        print(f'✅ パスワードリセット完了！')
        print(f'   メール: {email}')
        print(f'   パスワード: {new_password}')

        return True

    except Exception as e:
        print(f'❌ エラー: {str(e)}')
        return False

if __name__ == '__main__':
    print('=== MA-Pilot 管理者パスワードリセット ===\n')
    success = reset_admin_password()
    print('\n' + ('='*50))
    if success:
        print('✅ 完了！ログイン情報:')
        print('   メール: admin@ma-pilot.local')
        print('   パスワード: DevAdmin2025A')
    else:
        print('❌ 失敗しました')
