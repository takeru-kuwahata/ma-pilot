"""WordPressアカウント作成サービス"""
import logging
import secrets
import string
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def _generate_password(length: int = 12) -> str:
    """ランダムパスワード生成（英大文字・小文字・数字）"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


class WordPressService:
    """WordPressアカウント作成サービス"""

    def __init__(self, api_url: str, username: str, password: str):
        """
        Args:
            api_url: WordPress REST API URL (e.g., https://si-college.net/wp-json/wp/v2)
            username: Basic認証ユーザー名
            password: Basic認証パスワード（アプリケーションパスワード）
        """
        self.api_url = api_url
        self.username = username
        self.password = password

    async def create_user(
        self,
        email: str,
        full_name: str,
        form_data: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        WordPressアカウントを作成

        Args:
            email: メールアドレス
            full_name: ユーザー表示名
            form_data: Lstepフォームデータ全体（metaとして保存）

        Returns:
            作成されたユーザー情報（id, username, password）、失敗時はNone
        """
        if not email:
            logger.warning('WordPressアカウント作成スキップ: emailが空です')
            return None

        # ユーザー名生成（emailのローカルパート）
        username_base = email.split('@')[0]
        username = await self._generate_unique_username(username_base)

        # パスワード生成
        password = _generate_password(12)

        # WordPressユーザー作成リクエスト
        payload = {
            'username': username,
            'email': email,
            'password': password,
            'roles': ['subscriber'],
            'name': full_name or username,  # display_name相当
            'meta': form_data,  # フォームデータ全体をmetaに保存
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f'{self.api_url}/users',
                    auth=(self.username, self.password),
                    json=payload,
                    headers={'Content-Type': 'application/json'},
                )

                if response.status_code in (200, 201):
                    user_data = response.json()
                    logger.info(f'WordPressアカウント作成成功: username={username}, email={email}')
                    return {
                        'id': user_data.get('id'),
                        'username': username,
                        'password': password,
                        'email': email,
                        'login_url': self.api_url.replace('/wp-json/wp/v2', '/wp-login.php'),
                    }
                else:
                    logger.error(
                        f'WordPressアカウント作成失敗: status={response.status_code}, '
                        f'email={email}, response={response.text}'
                    )
                    return None

        except Exception as e:
            logger.error(f'WordPressアカウント作成エラー: email={email}, error={e}')
            return None

    async def _generate_unique_username(self, base: str) -> str:
        """
        ユニークなユーザー名を生成（重複時は4桁乱数を付加）

        Args:
            base: ベースとなるユーザー名

        Returns:
            ユニークなユーザー名
        """
        username = base

        # 既存ユーザー名チェック（最大5回試行）
        for attempt in range(5):
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(
                        f'{self.api_url}/users',
                        auth=(self.username, self.password),
                        params={'search': username},
                    )

                    if response.status_code == 200:
                        users = response.json()
                        # 完全一致するユーザー名が存在するか確認
                        if not any(u.get('slug') == username for u in users):
                            return username

                    # 重複している場合は4桁乱数を付加
                    random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
                    username = f'{base}{random_suffix}'

            except Exception as e:
                logger.warning(f'WordPress username重複チェック失敗（試行{attempt+1}/5）: {e}')
                # エラー時も4桁乱数を付加して続行
                random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
                username = f'{base}{random_suffix}'

        return username
