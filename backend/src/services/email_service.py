"""メール送信サービス（MVP版: ログ出力のみ）"""
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailService:
    """メール送信サービス"""

    def __init__(self):
        """初期化"""
        pass

    def send_order_confirmation_to_clinic(
        self,
        order_id: str,
        clinic_name: str,
        email: str,
        product_type: Optional[str],
        quantity: Optional[int],
        estimated_price: Optional[int],
    ) -> None:
        """
        クリニックへの注文受付メール送信（MVP: ログ出力のみ）

        Args:
            order_id: 注文ID
            clinic_name: クリニック名
            email: 送信先メールアドレス
            product_type: 商品種類
            quantity: 数量
            estimated_price: 見積金額
        """
        subject = "【MA-Pilot】印刷物ご注文を受け付けました"
        body = f"""
{clinic_name} 様

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
〒260-0013 千葉県千葉市中央区中央4-8-5
TEL: 043-123-4567
Email: info@keiyo-ad.co.jp
---
"""

        # MVP版: ログ出力のみ
        logger.info("=" * 80)
        logger.info(f"[メール送信 - クリニック宛] To: {email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body}")
        logger.info("=" * 80)

        # 本番実装時: SMTPサーバー経由でメール送信
        # import smtplib
        # from email.mime.text import MIMEText
        # msg = MIMEText(body)
        # msg['Subject'] = subject
        # msg['From'] = 'noreply@ma-pilot.com'
        # msg['To'] = email
        # with smtplib.SMTP('smtp.example.com', 587) as server:
        #     server.starttls()
        #     server.login(smtp_user, smtp_password)
        #     server.send_message(msg)

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
        """
        京葉広告スタッフへの受注通知メール送信（MVP: ログ出力のみ）

        Args:
            order_id: 注文ID
            clinic_name: クリニック名
            clinic_email: クリニックメールアドレス
            product_type: 商品種類
            quantity: 数量
            pattern: 注文パターン
            notes: 備考
        """
        subject = f"【新規注文】{clinic_name} 様から印刷物のご注文"
        body = f"""
新規注文が入りました。

■注文情報
注文番号: {order_id}
受付日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

■お客様情報
クリニック名: {clinic_name}
メールアドレス: {clinic_email}

■注文内容
注文パターン: {'再注文' if pattern == 'reorder' else '相談フォーム'}
商品種類: {product_type or '未定'}
数量: {quantity or '未定'}
備考: {notes or 'なし'}

早急にお見積りをご連絡ください。

---
MA-Pilot 印刷物受注システム
---
"""

        # MVP版: ログ出力のみ
        logger.info("=" * 80)
        logger.info("[メール送信 - 京葉広告スタッフ宛]")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body}")
        logger.info("=" * 80)

        # 本番実装時: SMTPサーバー経由でメール送信
        # staff_email = "orders@keiyo-ad.co.jp"
        # （実装は上記と同様）
