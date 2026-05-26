from supabase import Client
from typing import Optional
from ..models.user import User, UserRole
import httpx
import urllib.parse
import re
import os


class AuthService:
    '''Authentication service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def _geocode_address(self, address: str) -> Optional[tuple[float, float]]:
        '''住所から緯度経度を取得（Google Maps Geocoding API）'''
        try:
            api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
            encoded = urllib.parse.quote(address)
            url = f'https://maps.googleapis.com/maps/api/geocode/json?address={encoded}&key={api_key}'
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                data = resp.json()
                if data.get('status') == 'OK' and data.get('results'):
                    loc = data['results'][0]['geometry']['location']
                    return loc['lat'], loc['lng']
        except Exception:
            pass
        return None

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
        user_id: Optional[str] = None
        clinic_id: Optional[str] = None
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
            coords = await self._geocode_address(address)
            lat = coords[0] if coords else 35.6762
            lng = coords[1] if coords else 139.6503

            clinic_data: dict = {
                'name': clinic_name,
                'postal_code': postal_code,
                'address': address,
                'phone_number': phone_number,
                'latitude': lat,
                'longitude': lng,
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
            # 補償トランザクション: 途中失敗時に作成済みリソースを削除
            await self._rollback_registration(user_id, clinic_id)
            raise ValueError(f'登録に失敗しました: {str(e)}')

    async def _rollback_registration(self, user_id: Optional[str], clinic_id: Optional[str]) -> None:
        '''登録失敗時のロールバック: 作成済みのclinic/user_metadata/Authユーザーを削除'''
        import httpx
        import os
        import logging
        logger = logging.getLogger(__name__)
        try:
            if clinic_id:
                self.supabase.table('clinics').delete().eq('id', clinic_id).execute()
            if user_id:
                self.supabase.table('user_metadata').delete().eq('user_id', user_id).execute()
                supabase_url = os.environ.get('SUPABASE_URL', '')
                service_role_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '') or os.environ.get('SUPABASE_KEY', '')
                async with httpx.AsyncClient() as client:
                    await client.delete(
                        f'{supabase_url}/auth/v1/admin/users/{user_id}',
                        headers={
                            'apikey': service_role_key,
                            'Authorization': f'Bearer {service_role_key}',
                        },
                        timeout=10,
                    )
        except Exception as rollback_err:
            logger.error('Registration rollback failed for user_id=%s: %s', user_id, rollback_err)

    async def invite_user(self, email: str, role: UserRole, clinic_id: Optional[str] = None, password: Optional[str] = None) -> dict:
        '''Invite a new staff user: generate invite link via Supabase, send email via Resend'''
        import httpx
        import os
        try:
            supabase_url = os.environ.get('SUPABASE_URL', '')
            service_role_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '') or os.environ.get('SUPABASE_KEY', '')
            frontend_url = os.environ.get('FRONTEND_URL', 'https://ma-pilot.vercel.app')

            # クリニック名を取得
            clinic_name = 'クリニック'
            if clinic_id:
                try:
                    clinic_resp = self.supabase.table('clinics').select('name').eq('id', clinic_id).single().execute()
                    if clinic_resp.data:
                        clinic_name = clinic_resp.data['name']
                except Exception:
                    pass

            existing_user_id = None
            invite_link = None

            async with httpx.AsyncClient() as client:
                # generateLink でトークン生成（メール送信なし）
                gen_resp = await client.post(
                    f'{supabase_url}/auth/v1/admin/generate_link',
                    headers={
                        'apikey': service_role_key,
                        'Authorization': f'Bearer {service_role_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'type': 'invite',
                        'email': email,
                        'redirect_to': f'{frontend_url}/accept-invite',
                    },
                    timeout=15,
                )

                if gen_resp.status_code == 422:
                    err = gen_resp.json() if gen_resp.text else {}
                    # 既存ユーザーの場合はスタッフとして紐付けのみ行う
                    if 'already been registered' in str(err):
                        search_resp = await client.get(
                            f'{supabase_url}/auth/v1/admin/users',
                            headers={
                                'apikey': service_role_key,
                                'Authorization': f'Bearer {service_role_key}',
                            },
                            params={'search': email, 'per_page': 50},
                            timeout=15,
                        )
                        search_data = search_resp.json() if search_resp.status_code == 200 else {}
                        found = [u for u in search_data.get('users', []) if u.get('email') == email]
                        if not found:
                            raise ValueError(f'このメールアドレスはすでに登録されています: {email}')
                        existing_user_id = found[0]['id']
                    else:
                        raise ValueError(f'招待リンク生成に失敗しました: {err}')
                elif gen_resp.status_code not in (200, 201):
                    err = gen_resp.json() if gen_resp.text else {}
                    raise ValueError(f'招待リンク生成に失敗しました（{gen_resp.status_code}）: {err}')
                else:
                    gen_data = gen_resp.json()
                    user_id = gen_data.get('user', {}).get('id') or gen_data.get('id')
                    # action_link をそのまま使う（Supabase が正しいリダイレクト付きで生成）
                    invite_link = gen_data.get('action_link') or gen_data.get('hashed_token')

            user_id = existing_user_id if existing_user_id else user_id

            # user_metadataにclinic_idとroleを登録
            existing_meta = self.supabase.table('user_metadata').select('user_id,role').eq('user_id', user_id).execute()
            if existing_meta.data:
                current_role = existing_meta.data[0].get('role', '')
                if current_role == 'system_admin':
                    raise ValueError(f'このメールアドレスはシステム管理者アカウントのため、スタッフとして招待できません: {email}')
                self.supabase.table('user_metadata').update({
                    'role': role,
                    'clinic_id': clinic_id
                }).eq('user_id', user_id).execute()
            else:
                self.supabase.table('user_metadata').insert({
                    'user_id': user_id,
                    'role': role,
                    'clinic_id': clinic_id
                }).execute()

            if existing_user_id:
                return {
                    'message': f'既存アカウントをスタッフとして追加しました（{email}）',
                    'invite_token': user_id
                }

            # Resendで招待メール送信
            from ..services.email_service import _send_email
            subject = f'【MA-Pilot】{clinic_name}のスタッフ招待のご案内'
            body = f"""MA-Pilot（{clinic_name}）のスタッフとして招待されました。

以下のリンクをクリックしてパスワードを設定し、ログインしてください。

招待リンク: {invite_link}

※このリンクは24時間有効です。

---
株式会社メディカルアドバンス
---"""
            _send_email(email, subject, body)

            return {
                'message': f'招待メールを送信しました（{email}）',
                'invite_token': user_id
            }

        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f'招待に失敗しました: {str(e)}')

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
        import httpx
        import os
        try:
            # Delete user metadata first
            self.supabase.table('user_metadata').delete().eq('user_id', user_id).execute()

            # Delete user from auth via Admin REST API (requires service_role key)
            supabase_url = os.environ.get('SUPABASE_URL', '')
            service_role_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '') or os.environ.get('SUPABASE_KEY', '')
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f'{supabase_url}/auth/v1/admin/users/{user_id}',
                    headers={
                        'apikey': service_role_key,
                        'Authorization': f'Bearer {service_role_key}',
                    },
                    timeout=10,
                )

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
