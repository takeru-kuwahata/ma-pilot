"""メール送信サービス"""
import logging
import os
import base64
from typing import Optional, List, Dict
from datetime import datetime
from supabase import Client
logger = logging.getLogger(__name__)


def _send_email(
    to_email: str,
    subject: str,
    body: str,
    attachments: Optional[List[Dict]] = None,
) -> None:
    """Resend経由でメール送信。APIキー未設定の場合はログ出力のみ。
    attachments: [{'filename': 'foo.pdf', 'content': <base64文字列>}, ...]
    """
    api_key = os.environ.get('RESEND_API_KEY', '')
    from_email = os.environ.get('RESEND_FROM_EMAIL', 'dr@medical-advance.com')

    if not api_key:
        logger.warning('RESEND_API_KEYが未設定のためメール送信をスキップします')
        logger.info(f'[未送信メール] To: {to_email} | Subject: {subject}')
        return

    try:
        # SDK非依存のREST APIで送信（添付ファイルの互換性が最も確実）
        _send_email_with_resend_api(api_key, from_email, to_email, subject, body, attachments)
        logger.info(f'メール送信成功: To={to_email}, Subject={subject}')
    except Exception as e:
        logger.error(f'メール送信失敗: To={to_email}, Subject={subject}, Error={e}')
        raise


def _make_attachment(file_bytes: bytes, filename: str) -> Dict:
    """ファイルbytesからResend用添付データを作成する。
    Resend Python SDK v2: content はbase64文字列。
    """
    content_b64 = base64.b64encode(file_bytes).decode('utf-8')
    return {'filename': filename, 'content': content_b64}


def _send_email_with_resend_api(
    api_key: str,
    from_email: str,
    to_email: str,
    subject: str,
    body: str,
    attachments: Optional[List[Dict]] = None,
) -> None:
    """Resend REST APIに直接POSTしてメール送信（SDK非依存・確実な方法）。"""
    import httpx
    payload: Dict = {
        'from': f'株式会社メディカルアドバンス <{from_email}>',
        'to': [to_email],
        'subject': subject,
        'text': body,
    }
    if attachments:
        payload['attachments'] = attachments

    resp = httpx.post(
        'https://api.resend.com/emails',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    logger.info(f'Resend API送信成功: status={resp.status_code}, id={resp.json().get("id")}')


class EmailService:
    """メール送信サービス"""

    def __init__(self, supabase: Optional[Client] = None):
        self.supabase = supabase
        self._cached_email = None

    def get_print_order_email(self) -> str:
        """印刷物注文メール受信先アドレスを取得"""
        if self._cached_email:
            return self._cached_email

        if not self.supabase:
            return 'dr@medical-advance.com'

        try:
            response = (
                self.supabase.table('system_settings')
                .select('value')
                .eq('key', 'print_order_email')
                .single()
                .execute()
            )
            if response.data:
                self._cached_email = response.data['value']
                return self._cached_email
        except Exception as e:
            logger.warning(f'Failed to fetch print_order_email from system_settings: {e}')

        return 'dr@medical-advance.com'

    def send_order_confirmation_to_clinic(
        self,
        order_id: str,
        clinic_name: str,
        email: str,
        product_type: Optional[str],
        quantity: Optional[int],
        estimated_price: Optional[int],
        items_text: Optional[str] = None,
        pattern: Optional[str] = None,
    ) -> None:
        """クリニックへの注文受付メール送信"""
        subject = '【MA-Pilot】印刷物ご注文を受け付けました'
        if items_text:
            items_section = f"\n{items_text}"
        elif product_type:
            items_section = f"\n{product_type}"
        else:
            items_section = ''

        # patternに応じてメッセージを変更
        # reorder（再注文）: その場で完結→見積り不要
        # consultation（相談）・new_order（新規）: 改めてお見積りを送る
        if pattern == 'reorder':
            followup_msg = '内容を確認の上、製作を進めさせていただきます。'
        else:
            followup_msg = '新規作成・修正がある場合は、改めてお見積りをお送りいたします。'

        body = f"""{clinic_name} 様

この度は、印刷物のご注文をいただきありがとうございます。
以下の内容で受付いたしました。

■ご注文内容
注文番号: {order_id}{items_section}
見積金額: {f'¥{estimated_price:,}' if estimated_price else '未算出'}

{followup_msg}

何かご不明点がございましたら、お気軽にお問い合わせください。

---
株式会社メディカルアドバンス
---
"""
        _send_email(email, subject, body)

    def send_order_notification_to_staff(
        self,
        order_id: str,
        clinic_name: str,
        clinic_email: str,
        product_type: Optional[str],
        quantity: Optional[int],
        pattern: str,
        notes: Optional[str],
    ) -> None:
        """京葉広告スタッフへの受注通知メール送信"""
        pattern_str = pattern.value if hasattr(pattern, 'value') else str(pattern)
        if pattern_str == 'reorder':
            pattern_label = '再注文'
            subject_prefix = '再注文'
        elif pattern_str == 'consultation':
            pattern_label = '相談フォーム'
            subject_prefix = '相談フォーム'
        elif pattern_str == 'new_order':
            pattern_label = '新規注文'
            subject_prefix = '新規注文'
        else:
            pattern_label = pattern_str
            subject_prefix = pattern_str
        subject = f'【{subject_prefix}】{clinic_name} 様から印刷物のご注文'
        body = f"""{pattern_label}が入りました。

■注文情報
注文番号: {order_id}
受付日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

■お客様情報
クリニック名: {clinic_name}
メールアドレス: {clinic_email}

■注文内容
注文パターン: {pattern_label}
{product_type or '（商品明細なし）'}
備考: {notes or 'なし'}

早急にお見積りをご連絡ください。

---
MA-Pilot 印刷物受注システム
---
"""
        staff_email = self.get_print_order_email()
        _send_email(staff_email, subject, body)

    def send_attachment_notification(
        self,
        order_id: str,
        clinic_name: str,
        clinic_email: str,
        filename: str,
        file_url: str,
        file_bytes: Optional[bytes] = None,
    ) -> None:
        """添付ファイルアップロード後に注文者・スタッフ両方へファイルを添付して通知"""
        # アップロード済みbytesがあればそのまま使用（URL経由ダウンロード不要）
        if file_bytes:
            attachments = [_make_attachment(file_bytes, filename)]
        else:
            attachments = None

        # 注文者への通知
        clinic_subject = '【MA-Pilot】添付ファイルを受け付けました'
        clinic_body = f"""{clinic_name} 様

ご注文（注文番号: {order_id}）に添付いただいたファイルを受け付けました。

■添付ファイル
ファイル名: {filename}

担当者が確認次第ご連絡いたします。

---
株式会社メディカルアドバンス
---
"""
        _send_email(clinic_email, clinic_subject, clinic_body, attachments=attachments)

        # スタッフへの通知
        staff_subject = f'【添付ファイル】{clinic_name} 様 注文番号: {order_id}'
        staff_body = f"""注文に添付ファイルが追加されました。

■注文情報
注文番号: {order_id}
クリニック名: {clinic_name}
メールアドレス: {clinic_email}

■添付ファイル
ファイル名: {filename}

---
MA-Pilot 印刷物受注システム
---
"""
        staff_email = self.get_print_order_email()
        _send_email(staff_email, staff_subject, staff_body, attachments=attachments)

    async def send_welcome_email(
        self,
        to_email: str,
        clinic_name: str,
        password: str,
    ) -> None:
        """
        ウェルカムメール送信（MA-Pilotアカウント作成時）

        Args:
            to_email: 送信先メールアドレス
            clinic_name: クリニック名
            password: 初期パスワード
        """
        # system_settingsからテンプレート取得
        subject_template = self._get_email_template('welcome_email_subject')
        body_template = self._get_email_template('welcome_email_body')

        # プレースホルダー置換
        login_url = 'https://ma-pilot.vercel.app'
        subject = subject_template.replace('{clinic_name}', clinic_name)
        body = (
            body_template
            .replace('{clinic_name}', clinic_name)
            .replace('{email}', to_email)
            .replace('{password}', password)
            .replace('{login_url}', login_url)
        )

        _send_email(to_email, subject, body)

    def _get_email_template(self, key: str) -> str:
        """
        system_settingsからメールテンプレートを取得

        Args:
            key: テンプレートキー（welcome_email_subject または welcome_email_body）

        Returns:
            テンプレート文字列、取得失敗時はデフォルト文面
        """
        default_templates = {
            'welcome_email_subject': '【シカレッジ/MA-Pilot】アカウント登録が完了しました',
            'welcome_email_body': """{clinic_name} 院長 様

この度は内覧会のお申し込みをいただき、誠にありがとうございます。
MA-Pilotのアカウントを発行いたしました。

■ログイン情報
URL: {login_url}
メールアドレス: {email}
初期パスワード: {password}

ログイン後、パスワードの変更をお勧めいたします。

ご不明な点はお気軽にお問い合わせください。

---
メディカルアドバンス
---""",
        }

        if not self.supabase:
            return default_templates.get(key, '')

        try:
            response = (
                self.supabase.table('system_settings')
                .select('value')
                .eq('key', key)
                .single()
                .execute()
            )
            if response.data:
                return response.data['value']
        except Exception as e:
            logger.warning(f'Failed to fetch {key} from system_settings: {e}')

        return default_templates.get(key, '')
