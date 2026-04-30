from pydantic import BaseModel
from typing import List, Optional, Dict


class RadarParameter(BaseModel):
    key: str
    label: str
    value: int      # 0-100
    previous: int   # 前月値（変化アニメーション用）


class MilestoneEvent(BaseModel):
    key: str
    label: str
    message: str    # キャラクターのセリフ
    is_new: bool    # 今回初めて達成したか


class GamificationData(BaseModel):
    clinic_id: str
    # ランク
    current_rank: str           # bronze/silver/gold/platinum/diamond
    rank_label: str             # "ゴールド院長"
    total_score: int            # 0-100
    percentile: int             # 全国上位X%
    next_rank_label: Optional[str]
    points_to_next_rank: int    # 次のランクまであと何点
    # 能力パラメーター
    parameters: List[RadarParameter]
    # 継続記録
    consecutive_months: int
    total_input_months: int
    # 節目イベント（今回新たに達成したもの）
    new_milestones: List[MilestoneEvent]
    # キャラクター
    character_type: str         # advanbi/assistant/doctor
    # 今月のキャラクターメッセージ
    character_message: str
    character_mood: str         # happy/encouraging/neutral/celebrate
