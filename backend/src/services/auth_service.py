from supabase import Client
from typing import Optional
from ..models.user import User, UserRole


class AuthService:
    '''Authentication service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def login(self, email: str, password: str) -> dict:
        '''Login user'''
        try:
            # Supabase auth login
            credentials = {
                'email': email,
                'password': password
            }
            auth_response = self.supabase.auth.sign_in_with_password(credentials)

            if not auth_response.user:
                raise ValueError('Invalid credentials')

            # Get user metadata
            user_metadata = self.supabase.table('user_metadata').select('*').eq('user_id', auth_response.user.id).single().execute()

            auth_user_meta = auth_response.user.user_metadata or {}
            user = User(
                id=auth_response.user.id,
                email=auth_response.user.email,
                role=user_metadata.data.get('role', 'clinic_viewer'),
                clinic_id=user_metadata.data.get('clinic_id'),
                display_name=auth_user_meta.get('display_name'),
                created_at=user_metadata.data.get('created_at'),
                updated_at=user_metadata.data.get('updated_at')
            )

            return {
                'access_token': auth_response.session.access_token,
                'token_type': 'bearer',
                'user': user
            }

        except Exception as e:
            raise ValueError(f'Login failed: {str(e)}')

    async def logout(self, access_token: str) -> dict:
        '''Logout user'''
        try:
            self.supabase.auth.sign_out()
            return {'message': 'Logged out successfully'}
        except Exception as e:
            raise ValueError(f'Logout failed: {str(e)}')

    async def reset_password(self, email: str) -> dict:
        '''Send password reset email'''
        try:
            self.supabase.auth.reset_password_for_email(email)
            return {'message': 'Password reset email sent'}
        except Exception as e:
            raise ValueError(f'Password reset failed: {str(e)}')

    async def register(self, email: str, password: str, clinic_name: str, postal_code: str, address: str, phone_number: str, slug: Optional[str] = None) -> dict:
        '''Self-register a new clinic owner with email confirmation'''
        try:
            # 1. slugの重複チェック
            if slug:
                existing = self.supabase.table('clinics').select('id').eq('slug', slug).execute()
                if existing.data:
                    raise ValueError('このスラッグはすでに使用されています')

            # 2. Supabase Authでユーザー作成（メール確認あり）
            auth_response = self.supabase.auth.sign_up({
                'email': email,
                'password': password,
            })

            if not auth_response.user:
                raise ValueError('ユーザー登録に失敗しました')

            user_id = auth_response.user.id

            # 3. clinicsテーブルにクリニック作成
            clinic_data: dict = {
                'name': clinic_name,
                'postal_code': postal_code,
                'address': address,
                'phone_number': phone_number,
                'latitude': 35.6762,
                'longitude': 139.6503,
                'owner_id': user_id,
            }
            if slug:
                clinic_data['slug'] = slug

            clinic_response = self.supabase.table('clinics').insert(clinic_data).execute()

            if not clinic_response.data:
                raise ValueError('クリニック情報の登録に失敗しました')

            clinic_id = clinic_response.data[0]['id']

            # 4. user_metadataにrole=clinic_ownerで登録
            self.supabase.table('user_metadata').insert({
                'user_id': user_id,
                'role': 'clinic_owner',
                'clinic_id': clinic_id,
            }).execute()

            return {'message': '登録完了メールを送信しました。メールを確認してアカウントを有効化してください。'}

        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f'登録に失敗しました: {str(e)}')

    async def invite_user(self, email: str, role: UserRole, clinic_id: Optional[str] = None) -> dict:
        '''Invite a new user'''
        try:
            # Create user via Supabase Admin API
            auth_response = self.supabase.auth.admin.invite_user_by_email(email)

            # Create user metadata
            self.supabase.table('user_metadata').insert({
                'user_id': auth_response.user.id,
                'role': role,
                'clinic_id': clinic_id
            }).execute()

            return {
                'message': 'User invited successfully',
                'invite_token': auth_response.user.id
            }

        except Exception as e:
            raise ValueError(f'User invitation failed: {str(e)}')

    async def update_user_role(self, user_id: str, role: UserRole) -> dict:
        '''Update user role'''
        try:
            self.supabase.table('user_metadata').update({
                'role': role
            }).eq('user_id', user_id).execute()

            return {'message': 'User role updated successfully'}

        except Exception as e:
            raise ValueError(f'Role update failed: {str(e)}')

    async def delete_user(self, user_id: str) -> dict:
        '''Delete user'''
        try:
            # Delete user metadata first
            self.supabase.table('user_metadata').delete().eq('user_id', user_id).execute()

            # Delete user from auth
            self.supabase.auth.admin.delete_user(user_id)

            return {'message': 'User deleted successfully'}

        except Exception as e:
            raise ValueError(f'User deletion failed: {str(e)}')

    async def get_current_user(self, access_token: str) -> User:
        '''Get current user from access token'''
        try:
            # Get user from Supabase
            user_response = self.supabase.auth.get_user(access_token)

            if not user_response.user:
                raise ValueError('Invalid token')

            # Get user metadata
            user_metadata = self.supabase.table('user_metadata').select('*').eq('user_id', user_response.user.id).single().execute()

            return User(
                id=user_response.user.id,
                email=user_response.user.email,
                role=user_metadata.data.get('role', 'clinic_viewer'),
                clinic_id=user_metadata.data.get('clinic_id'),
                created_at=user_metadata.data.get('created_at'),
                updated_at=user_metadata.data.get('updated_at')
            )

        except Exception as e:
            raise ValueError(f'Failed to get current user: {str(e)}')
