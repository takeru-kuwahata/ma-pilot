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
        # テンプレートディレクトリ (backend/src/templates)
        template_dir = Path(__file__).parent.parent / "templates"
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

    def generate_monthly_report_pdf(
        self,
        title: str,
        clinic_name: str,
        total_revenue: int,
        operating_profit: int,
        profit_margin: float,
        total_patients: int,
        new_patients: int,
        revenue_per_patient: int,
        insurance_revenue: int,
        self_pay_revenue: int,
        retail_revenue: int,
        variable_cost: int,
        fixed_cost: int,
        total_cost: int,
        revenue_change: Optional[float] = None,
        profit_change: Optional[float] = None,
        patient_change: Optional[float] = None,
    ) -> bytes:
        """
        月次経営レポートPDF生成

        Args:
            title: レポートタイトル
            clinic_name: クリニック名
            total_revenue: 総売上
            operating_profit: 営業利益
            profit_margin: 利益率
            total_patients: 総患者数
            new_patients: 新患数
            revenue_per_patient: 患者単価
            insurance_revenue: 保険診療収入
            self_pay_revenue: 自由診療収入
            retail_revenue: 物販収入
            variable_cost: 変動費
            fixed_cost: 固定費
            total_cost: 総コスト
            revenue_change: 売上前月比
            profit_change: 利益前月比
            patient_change: 患者数前月比

        Returns:
            bytes: PDF生成バイナリ
        """
        template = self.env.get_template("monthly_report.html")

        context = {
            "title": title,
            "clinic_name": clinic_name,
            "generated_at": datetime.now().strftime("%Y年%m月%d日 %H:%M"),
            "total_revenue": total_revenue,
            "operating_profit": operating_profit,
            "profit_margin": profit_margin,
            "total_patients": total_patients,
            "new_patients": new_patients,
            "revenue_per_patient": revenue_per_patient,
            "insurance_revenue": insurance_revenue,
            "self_pay_revenue": self_pay_revenue,
            "retail_revenue": retail_revenue,
            "variable_cost": variable_cost,
            "fixed_cost": fixed_cost,
            "total_cost": total_cost,
            "revenue_change": revenue_change,
            "profit_change": profit_change,
            "patient_change": patient_change,
        }

        html_content = template.render(context)
        pdf_bytes = HTML(string=html_content).write_pdf()

        return pdf_bytes

    def generate_simulation_report_pdf(
        self,
        title: str,
        clinic_name: str,
        target_revenue: int,
        target_profit: int,
        profit_margin: float,
        current_revenue: int,
        current_profit: int,
        revenue_change_amount: int,
        revenue_change_rate: float,
        profit_change_amount: int,
        profit_change_rate: float,
        avg_revenue_per_patient: int,
        personnel_cost_rate: float,
        material_cost_rate: float,
        fixed_cost: int,
    ) -> bytes:
        """
        シミュレーション結果レポートPDF生成

        Args:
            title: レポートタイトル
            clinic_name: クリニック名
            target_revenue: 予測総売上
            target_profit: 予測営業利益
            profit_margin: 予測利益率
            current_revenue: 現在売上
            current_profit: 現在利益
            revenue_change_amount: 売上変動額
            revenue_change_rate: 売上変動率
            profit_change_amount: 利益変動額
            profit_change_rate: 利益変動率
            avg_revenue_per_patient: 平均患者単価
            personnel_cost_rate: 人件費率
            material_cost_rate: 材料費率
            fixed_cost: 固定費

        Returns:
            bytes: PDF生成バイナリ
        """
        template = self.env.get_template("simulation_report.html")

        context = {
            "title": title,
            "clinic_name": clinic_name,
            "generated_at": datetime.now().strftime("%Y年%m月%d日 %H:%M"),
            "target_revenue": target_revenue,
            "target_profit": target_profit,
            "profit_margin": profit_margin,
            "current_revenue": current_revenue,
            "current_profit": current_profit,
            "revenue_change_amount": revenue_change_amount,
            "revenue_change_rate": revenue_change_rate,
            "profit_change_amount": profit_change_amount,
            "profit_change_rate": profit_change_rate,
            "avg_revenue_per_patient": avg_revenue_per_patient,
            "personnel_cost_rate": personnel_cost_rate,
            "material_cost_rate": material_cost_rate,
            "fixed_cost": fixed_cost,
        }

        html_content = template.render(context)
        pdf_bytes = HTML(string=html_content).write_pdf()

        return pdf_bytes
