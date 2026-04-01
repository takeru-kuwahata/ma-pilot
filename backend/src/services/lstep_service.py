"""Lstep Webhook処理サービス"""
import logging
import secrets
import string
import httpx
import os
from typing import Dict, Any, Optional
from supabase import Client
from .wordpress_service import WordPressService
from .email_service import EmailService

logger = logging.getLogger(__name__)


def _generate_password(length: int = 12) -> str:
    """ランダムパスワード生成（英大文字・小文字・数字）"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


class LstepService:
    """Lstep Webhook処理サービス"""

    def __init__(
        self,
        supabase: Client,
        wordpress_api_url: str,
        wordpress_username: str,
        wordpress_password: str,
    ):
        """
        Args:
            supabase: Supabaseクライアント
            wordpress_api_url: WordPress API URL
            wordpress_username: WordPress Basic認証ユーザー名
            wordpress_password: WordPress Basic認証パスワード
        """
        self.supabase = supabase
        self.wordpress = WordPressService(
            api_url=wordpress_api_url,
            username=wordpress_username,
            password=wordpress_password,
        )
        self.email_service = EmailService(supabase)

    async def process_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Lstep Webhookペイロードを処理

        Args:
            payload: Lstepから届いたWebhookペイロード

        Returns:
            処理結果（success, message, ma_pilot_created, wordpress_created, email_sent）
        """
        form_type = payload.get('form_type', '')
        email = payload.get('email', '')
        full_name = payload.get('full_name', '')
        clinic_name = payload.get('clinic_name', '')

        result = {
            'success': False,
            'message': '',
            'ma_pilot_created': False,
            'wordpress_created': False,
            'email_sent': False,
            'form_type': form_type,
        }

        # フォーム種別が不明な場合もWordPressアカウントのみ作成
        is_doctor_openhouse = form_type == 'doctor_openhouse'

        logger.info(
            f'Lstep Webhook処理開始: form_type={form_type}, email={email}, '
            f'full_name={full_name}, clinic_name={clinic_name}'
        )

        # ①MA-Pilotアカウント作成（先生フォームのみ）
        ma_pilot_password = None
        if is_doctor_openhouse:
            try:
                ma_pilot_password = await self._create_ma_pilot_account(payload)
                if ma_pilot_password:
                    result['ma_pilot_created'] = True
                    logger.info(f'MA-Pilotアカウント作成成功: email={email}')
                else:
                    logger.warning(f'MA-Pilotアカウント作成失敗: email={email}')
            except Exception as e:
                logger.error(f'MA-Pilotアカウント作成エラー: email={email}, error={e}')

        # ②WordPressアカウント作成（全フォーム共通）
        try:
            wp_user = await self.wordpress.create_user(
                email=email,
                full_name=full_name,
                form_data=payload,
            )
            if wp_user:
                result['wordpress_created'] = True
                logger.info(f'WordPressアカウント作成成功: email={email}')
            else:
                logger.warning(f'WordPressアカウント作成失敗: email={email}')
        except Exception as e:
            logger.error(f'WordPressアカウント作成エラー: email={email}, error={e}')

        # ③ウェルカムメール送信（MA-Pilotアカウント作成成功時のみ）
        if result['ma_pilot_created'] and ma_pilot_password:
            try:
                await self.email_service.send_welcome_email(
                    to_email=email,
                    clinic_name=clinic_name,
                    password=ma_pilot_password,
                )
                result['email_sent'] = True
                logger.info(f'ウェルカムメール送信成功: email={email}')
            except Exception as e:
                logger.error(f'ウェルカムメール送信エラー: email={email}, error={e}')

        # 処理結果の判定
        if is_doctor_openhouse:
            # 先生フォームの場合：MA-Pilot作成が必須
            if result['ma_pilot_created']:
                result['success'] = True
                result['message'] = 'MA-Pilotアカウント・WordPressアカウント作成完了'
            else:
                result['success'] = False
                result['message'] = 'MA-Pilotアカウント作成失敗'
        else:
            # その他フォームの場合：WordPress作成のみ
            if result['wordpress_created']:
                result['success'] = True
                result['message'] = 'WordPressアカウント作成完了'
            else:
                result['success'] = False
                result['message'] = 'WordPressアカウント作成失敗'

        logger.info(f'Lstep Webhook処理完了: {result}')
        return result

    async def _create_ma_pilot_account(self, payload: Dict[str, Any]) -> Optional[str]:
        """
        MA-Pilotアカウント作成（先生フォームのみ）

        Args:
            payload: Lstepペイロード

        Returns:
            生成されたパスワード、失敗時はNone
        """
        email = payload.get('email', '')
        full_name = payload.get('full_name', '')
        clinic_name = payload.get('clinic_name', '')
        home_postal_code = payload.get('home_postal_code', '')
        clinic_address = payload.get('clinic_address', '')
        clinic_address2 = payload.get('clinic_address2', '')
        phone = payload.get('phone', '')
        openhouse_start_date = payload.get('openhouse_start_date', '')

        if not email or not clinic_name:
            logger.error('MA-Pilotアカウント作成失敗: emailまたはclinic_nameが空です')
            return None

        # パスワード生成
        password = _generate_password(12)

        # Supabase Auth Admin APIでユーザー作成
        supabase_url = os.environ.get('SUPABASE_URL', '')
        supabase_key = os.environ.get('SUPABASE_KEY', '')

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f'{supabase_url}/auth/v1/admin/users',
                    headers={
                        'apikey': supabase_key,
                        'Authorization': f'Bearer {supabase_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'email': email,
                        'password': password,
                        'email_confirm': True,
                        'user_metadata': {'display_name': full_name or clinic_name},
                    },
                )

            if res.status_code not in (200, 201):
                logger.error(f'Supabase Auth ユーザー作成失敗: {res.status_code}, {res.text}')
                return None

            user_data = res.json()
            user_id = user_data['id']

            # clinicsテーブルにレコード作成
            address = clinic_address
            if clinic_address2:
                address = f'{clinic_address} {clinic_address2}'

            openhouse_status = 'scheduled' if openhouse_start_date else 'none'

            clinic_insert = self.supabase.table('clinics').insert({
                'name': clinic_name,
                'postal_code': home_postal_code or '',
                'address': address or '',
                'phone_number': phone or '',
                'owner_id': user_id,
                'is_active': True,
                'latitude': 35.6762,
                'longitude': 139.6503,
                'openhouse_status': openhouse_status,
            }).execute()

            clinic_id = clinic_insert.data[0]['id']

            # user_metadataテーブルにrole='clinic_owner'で登録
            self.supabase.table('user_metadata').insert({
                'user_id': user_id,
                'role': 'clinic_owner',
                'clinic_id': clinic_id,
            }).execute()

            logger.info(
                f'MA-Pilotアカウント作成成功: user_id={user_id}, clinic_id={clinic_id}, '
                f'email={email}'
            )
            return password

        except Exception as e:
            logger.error(f'MA-Pilotアカウント作成エラー: email={email}, error={e}')
            return None
