from pydantic import BaseModel
from typing import List, Optional, Literal

ScoreLevel = Literal['critical', 'poor', 'average', 'good', 'excellent']
ProposalPriority = Literal['critical', 'high', 'medium', 'low']
ProposalCategory = Literal['集患', '収益性', 'コスト最適化', '成長性']


class KpiScore(BaseModel):
    key: str
    label: str
    value: float
    unit: str
    score: int          # 1-5
    level: ScoreLevel
    benchmark_avg: float
    benchmark_good: float
    benchmark_label: str


class CategoryScore(BaseModel):
    category: ProposalCategory
    score: int          # 0-100
    level: ScoreLevel


class PartnerService(BaseModel):
    id: str
    company_name: str
    service_name: str
    catchcopy: Optional[str]
    description: Optional[str]
    price_range: Optional[str]
    service_url: Optional[str]
    coupon_code: Optional[str]
    logo_url: Optional[str]
    display_priority: int


class Proposal(BaseModel):
    id: str
    priority: ProposalPriority
    category: ProposalCategory
    pattern_id: str             # 例: "B-01"
    title: str
    why: str                    # なぜ問題か
    what: str                   # 何を目標にすべきか
    how: List[str]              # 具体的施策リスト
    expected_impact: str        # 期待効果
    problem_tag: str            # レコメンド用タグ
    recommended_services: List[PartnerService]


class ConsultingReport(BaseModel):
    total_score: int            # 0-100
    total_level: ScoreLevel
    percentile: int             # 全国パーセンタイル（暫定計算）
    category_scores: List[CategoryScore]
    kpi_scores: List[KpiScore]
    proposals: List[Proposal]   # 優先度順
    year_month: str             # 診断対象月
    has_enough_data: bool       # 3ヶ月以上データがあるか
