"""メール送信サービス"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
from supabase import Client

logger = logging.getLogger(__name__)


def _get_smtp_config():
    """SMTP設定を取得（循環インポート回避のため遅延import）"""
    from src.core.config import get_settings
    s = get_settings()
    return s.smtp_host, s.smtp_port, s.smtp_user, s.smtp_password, s.smtp_from


def _send_email(to_email: str, subject: str, body: str) -> None:
    """SMTPでメール送信。設定が不完全な場合はログ出力のみ。"""
    smtp_host, smtp_port, smtp_user, smtp_password, smtp_from = _get_smtp_config()

    if not smtp_host or not smtp_user or not smtp_password:
        logger.warning('SMTP設定が未完了のためメール送信をスキップします（SMTP_HOST/SMTP_USER/SMTP_PASSWORDを設定してください）')
        logger.info(f'[未送信メール] To: {to_email} | Subject: {subject}')
        return

    from_addr = smtp_from or smtp_user

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_email
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_addr, [to_email], msg.as_string())
        logger.info(f'メール送信成功: To={to_email}, Subject={subject}')
    except Exception as e:
        logger.error(f'メール送信失敗: To={to_email}, Error={e}')
        raise


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
    ) -> None:
        """クリニックへの注文受付メール送信"""
        subject = '【MA-Pilot】印刷物ご注文を受け付けました'
        body = f"""{clinic_name} 様

この度は、印刷物のご注文をいただきありがとうございます。
以下の内容で受付いたしました。

■ご注文内容
注文番号: {order_id}
商品種類: {product_type or '未定'}
数量: {quantity or '未定'}
見積金額: {f'¥{estimated_price:,}' if estimated_price else '未算出'}

担当者より正式なお見積りをメールにてご連絡させていただきます。
今しばらくお待ちくださいませ。

何かご不明点がございましたら、お気軽にお問い合わせください。

---
株式会社京葉広告
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
商品種類: {product_type or '（明細参照）'}
数量: {quantity if quantity is not None else '（明細参照）'}
備考: {notes or 'なし'}

早急にお見積りをご連絡ください。

---
MA-Pilot 印刷物受注システム
---
"""
        staff_email = self.get_print_order_email()
        _send_email(staff_email, subject, body)

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
