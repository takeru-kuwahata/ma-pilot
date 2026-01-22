"""PDF生成サービス（WeasyPrint）"""
from datetime import datetime
from pathlib import Path
from typing import Optional
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import tempfile


class PdfService:
    """PDF生成サービス"""

    def __init__(self):
        """初期化"""
        # テンプレートディレクトリ
        template_dir = Path(__file__).parent.parent.parent / "templates"
        self.env = Environment(loader=FileSystemLoader(str(template_dir)))

    def generate_estimate_pdf(
        self,
        order_id: str,
        clinic_name: str,
        email: str,
        product_type: str,
        quantity: int,
        unit_price: int,
        design_fee: int,
        design_required: bool,
        total_price: int,
        delivery_date: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> bytes:
        """
        見積書PDF生成

        Args:
            order_id: 注文ID
            clinic_name: クリニック名
            email: メールアドレス
            product_type: 商品種類
            quantity: 数量
            unit_price: 単価
            design_fee: デザイン費
            design_required: デザイン作成要否
            total_price: 合計金額
            delivery_date: 納期希望日
            notes: 備考

        Returns:
            bytes: PDF生成バイナリ
        """
        # テンプレート取得
        template = self.env.get_template("estimate.html")

        # データ準備
        context = {
            "issue_date": datetime.now().strftime("%Y年%m月%d日"),
            "order_id": order_id,
            "clinic_name": clinic_name,
            "email": email,
            "product_type": product_type,
            "quantity": f"{quantity:,}",
            "unit_price": f"{unit_price:,}",
            "subtotal": f"{unit_price * quantity:,}",
            "design_required": design_required,
            "design_fee": f"{design_fee:,}" if design_required else "0",
            "total_price": f"{total_price:,}",
            "delivery_date": delivery_date,
            "notes": notes,
        }

        # HTML生成
        html_content = template.render(context)

        # PDF生成
        pdf_bytes = HTML(string=html_content).write_pdf()

        return pdf_bytes

    def save_pdf_to_file(self, pdf_bytes: bytes, file_path: str) -> None:
        """
        PDFをファイルに保存

        Args:
            pdf_bytes: PDFバイナリ
            file_path: 保存先パス
        """
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
