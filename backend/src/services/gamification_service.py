from supabase import Client
from typing import Optional
from ..models.gamification import GamificationData, RadarParameter, MilestoneEvent

RANK_CONFIG = [
    ('diamond',  85, 'ダイヤモンド院長', None,           0),
    ('platinum', 75, 'プラチナ院長',     'ダイヤモンド院長', 85),
    ('gold',     60, 'ゴールド院長',     'プラチナ院長',    75),
    ('silver',   40, 'シルバー院長',     'ゴールド院長',    60),
    ('bronze',    0, 'ブロンズ院長',     'シルバー院長',    40),
]

CHARACTER_MESSAGES = {
    'rank_up': {
        'happy': [
            'ランクアップおめでとうございます！あなたの努力が数字に表れています！',
            'すごい！また一段階上のステージへ。この調子で続けましょう！',
        ],
        'celebrate': [
            '🎉 ランクアップ達成！全国上位の仲間入りです！',
        ],
    },
    'score_up': {
        'happy': [
            '{score}点を達成しました。前月より着実に改善しています！',
            '経営健診スコアが上がりました。この調子です！',
        ],
    },
    'good_profit': {
        'happy': [
            '利益率が{value}%です。業界平均（30%）を上回っています！',
            '素晴らしい利益率ですね。しっかりとコスト管理ができています。',
        ],
    },
    'good_self_pay': {
        'happy': [
            '自費率が{value}%です。患者さんへの提案力が高まっています！',
        ],
    },
    'needs_improvement': {
        'encouraging': [
            '今月のデータを確認しました。改善の余地があります。提案を参考に一歩ずつ進めましょう！',
            'まだ伸びしろがあります。改善提案を見て、できることから始めてみてください。',
        ],
    },
    'neutral': {
        'neutral': [
            '今月のデータを受け取りました。経営健診レポートをご確認ください。',
            'データ入力ありがとうございます。先月との変化を確認してみましょう。',
        ],
    },
    'first_input': {
        'happy': [
            'はじめての経営健診が完了しました！これが経営改善の第一歩です。数字を見える化することで、次のアクションが見えてきます。',
        ],
    },
    'consecutive': {
        'happy': [
            '{n}ヶ月連続でデータを入力いただいています。継続は力なりです！経営データが蓄積されるほど、分析の精度が上がります。',
        ],
    },
}


class GamificationService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def get_gamification_data(self, clinic_id: str) -> GamificationData:
        monthly_list = self.supabase.table('monthly_data') \
            .select('*') \
            .eq('clinic_id', clinic_id) \
            .order('year_month', desc=True) \
            .limit(13) \
            .execute().data

        # ゲーミフィケーション状態を取得または初期化
        gm_row = self._get_or_init_gamification(clinic_id)

        if not monthly_list:
            return self._empty_gamification(clinic_id, gm_row)

        current = monthly_list[0]
        previous = monthly_list[1] if len(monthly_list) > 1 else None

        # メトリクス計算
        metrics = self._calc_metrics(current, previous, monthly_list)

        # パラメーター算出
        parameters = self._calc_parameters(metrics, gm_row)

        # 総合スコア
        total_score = self._calc_total_score(parameters)

        # ランク
        rank, rank_label, next_rank_label, points_to_next = self._calc_rank(total_score)
        percentile = self._calc_percentile(total_score)

        # 継続記録の更新（月次データから直接計算）
        consecutive, total_months, streak_start = self._update_consecutive(
            clinic_id, current['year_month'], gm_row
        )

        # 節目イベント検出
        prev_score = gm_row.get('total_score', 0)
        prev_rank = gm_row.get('current_rank', 'bronze')
        new_milestones = self._detect_milestones(
            clinic_id, total_score, prev_score, rank, prev_rank,
            consecutive, total_months, gm_row
        )

        # キャラクターメッセージ
        mood, message = self._generate_message(
            metrics, total_score, prev_score, rank, prev_rank,
            consecutive, total_months, new_milestones
        )

        # DB更新（非同期で最新状態を保存）
        self._save_gamification(clinic_id, rank, total_score, parameters, consecutive, total_months, current['year_month'])

        character_type = gm_row.get('character_type', 'advanbi')

        return GamificationData(
            clinic_id=clinic_id,
            current_rank=rank,
            rank_label=rank_label,
            total_score=total_score,
            percentile=percentile,
            next_rank_label=next_rank_label,
            points_to_next_rank=points_to_next,
            parameters=parameters,
            consecutive_months=consecutive,
            total_input_months=total_months,
            streak_start_month=streak_start,
            new_milestones=new_milestones,
            character_type=character_type,
            character_message=message,
            character_mood=mood,
        )

    # --------------------------------------------------------
    # メトリクス計算（consulting_serviceと同じロジック）
    # --------------------------------------------------------
    def _calc_metrics(self, current: dict, previous: dict | None, history: list) -> dict:
        rev = current.get('total_revenue') or 1
        total_cost = (
            (current.get('personnel_cost') or 0)
            + (current.get('material_cost') or 0)
            + (current.get('fixed_cost') or 0)
            + (current.get('other_cost') or 0)
        )
        variable_cost = (current.get('material_cost') or 0) + (current.get('other_cost') or 0)
        profit = rev - total_cost
        total_patients = current.get('total_patients') or 1

        m = {
            'profit_rate': profit / rev * 100,
            'self_pay_rate': (current.get('self_pay_revenue') or 0) / rev * 100,
            'expense_rate': total_cost / rev * 100,
            'variable_cost_rate': variable_cost / rev * 100,
            'new_patient_rate': (current.get('first_visit_patients') or 0) / total_patients * 100,
            'revenue_growth': 0,
            'patient_growth': 0,
        }

        if previous:
            prev_rev = previous.get('total_revenue') or 1
            m['revenue_growth'] = (rev - prev_rev) / prev_rev * 100
            prev_patients = previous.get('total_patients') or 1
            m['patient_growth'] = (total_patients - prev_patients) / prev_patients * 100

        if len(history) >= 13:
            ly_rev = history[12].get('total_revenue') or 1
            m['revenue_growth_yoy'] = (rev - ly_rev) / ly_rev * 100
        else:
            m['revenue_growth_yoy'] = m['revenue_growth']

        return m

    # --------------------------------------------------------
    # 5つの能力パラメーター（0-100）
    # --------------------------------------------------------
    def _calc_parameters(self, metrics: dict, gm_row: dict) -> list[RadarParameter]:
        def clamp(v):
            return max(0, min(100, int(v)))

        # 集患力: 新患比率ベース（12%以上で100点）
        acquisition = clamp(metrics['new_patient_rate'] / 12 * 100)

        # 収益力: 自費率ベース（30%以上で100点）
        revenue = clamp(metrics['self_pay_rate'] / 30 * 100)

        # 経営安定性: 利益率ベース（40%以上で100点）
        stability = clamp(metrics['profit_rate'] / 40 * 100)

        # 成長性: 売上成長率ベース（前月比、10%成長で100点）
        growth_val = metrics.get('revenue_growth', 0)
        growth = clamp((growth_val + 10) / 20 * 100)  # -10%〜+10% → 0〜100

        # 診療圏競争力: 暫定（市場分析データ連動前は50固定）
        market = 50

        prev = {
            'param_acquisition': gm_row.get('param_acquisition', 0),
            'param_revenue': gm_row.get('param_revenue', 0),
            'param_stability': gm_row.get('param_stability', 0),
            'param_growth': gm_row.get('param_growth', 0),
            'param_market': gm_row.get('param_market', 50),
        }

        return [
            RadarParameter(key='acquisition', label='集患力',      value=acquisition, previous=prev['param_acquisition']),
            RadarParameter(key='revenue',     label='収益力',      value=revenue,     previous=prev['param_revenue']),
            RadarParameter(key='stability',   label='経営安定性',   value=stability,   previous=prev['param_stability']),
            RadarParameter(key='growth',      label='成長性',      value=growth,      previous=prev['param_growth']),
            RadarParameter(key='market',      label='競争力',      value=market,      previous=prev['param_market']),
        ]

    def _calc_total_score(self, parameters: list[RadarParameter]) -> int:
        weights = {'acquisition': 0.25, 'revenue': 0.25, 'stability': 0.25, 'growth': 0.15, 'market': 0.10}
        total = sum(p.value * weights.get(p.key, 0) for p in parameters)
        return min(100, int(total))

    # --------------------------------------------------------
    # ランク計算
    # --------------------------------------------------------
    def _calc_rank(self, score: int) -> tuple[str, str, Optional[str], int]:
        for rank_id, threshold, label, next_label, next_threshold in RANK_CONFIG:
            if score >= threshold:
                pts_to_next = max(0, next_threshold - score) if next_threshold else 0
                return rank_id, label, next_label, pts_to_next
        return 'bronze', 'ブロンズ院長', 'シルバー院長', 40 - score

    def _calc_percentile(self, score: int) -> int:
        if score >= 90: return 5
        elif score >= 80: return 10
        elif score >= 70: return 20
        elif score >= 60: return 35
        elif score >= 50: return 50
        elif score >= 40: return 65
        elif score >= 30: return 80
        return 90

    # --------------------------------------------------------
    # 継続記録
    # --------------------------------------------------------
    def _update_consecutive(self, clinic_id: str, current_month: str, gm_row: dict) -> tuple[int, int, str | None]:
        '''月次データから連続入力月数・累計・起点月を直接計算する'''
        all_months_res = self.supabase.table('monthly_data') \
            .select('year_month') \
            .eq('clinic_id', clinic_id) \
            .order('year_month', desc=False) \
            .execute()
        months = sorted({r['year_month'] for r in (all_months_res.data or [])})
        total = len(months)
        if total == 0:
            return 0, 0, None

        # 直近の連続月数を計算（最新月から遡る）
        consecutive = 1
        streak_start = months[-1]
        for i in range(len(months) - 1, 0, -1):
            y1, m1 = map(int, months[i - 1].split('-'))
            y2, m2 = map(int, months[i].split('-'))
            if y2 * 12 + m2 - (y1 * 12 + m1) == 1:
                consecutive += 1
                streak_start = months[i - 1]
            else:
                break

        return consecutive, total, streak_start

    # --------------------------------------------------------
    # 節目イベント検出
    # --------------------------------------------------------
    def _detect_milestones(
        self, clinic_id, score, prev_score, rank, prev_rank,
        consecutive, total_months, gm_row
    ) -> list[MilestoneEvent]:
        flags = gm_row.get('milestone_flags') or {}
        milestones = []

        # 初回入力
        if not flags.get('first_input'):
            milestones.append(MilestoneEvent(
                key='first_input',
                label='はじめての経営健診',
                message='はじめての経営健診が完了しました！これが経営改善の第一歩です。',
                is_new=True,
            ))
            flags['first_input'] = True

        # ランクアップ
        rank_order = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
        if rank_order.index(rank) > rank_order.index(prev_rank):
            milestones.append(MilestoneEvent(
                key=f'rank_{rank}',
                label=f'ランクアップ！',
                message=f'おめでとうございます！ランクアップして{self._rank_label(rank)}になりました！',
                is_new=True,
            ))

        # 連続入力マイルストーン
        for n in [3, 6, 12]:
            key = f'consecutive_{n}'
            if consecutive >= n and not flags.get(key):
                milestones.append(MilestoneEvent(
                    key=key,
                    label=f'{n}ヶ月連続入力達成！',
                    message=f'{n}ヶ月連続でデータを入力しています。継続は力なりです！',
                    is_new=True,
                ))
                flags[key] = True

        # スコア節目
        for threshold in [50, 60, 70, 80, 90]:
            key = f'score_{threshold}'
            if score >= threshold and prev_score < threshold and not flags.get(key):
                milestones.append(MilestoneEvent(
                    key=key,
                    label=f'経営健診スコア{threshold}点達成！',
                    message=f'経営健診スコアが{threshold}点を超えました！全国上位{self._calc_percentile(threshold)}%です。',
                    is_new=True,
                ))
                flags[key] = True

        # フラグを保存（次回以降に重複しない）
        try:
            self.supabase.table('clinic_gamification') \
                .update({'milestone_flags': flags}) \
                .eq('clinic_id', clinic_id) \
                .execute()
        except Exception:
            pass

        return milestones

    def _rank_label(self, rank: str) -> str:
        labels = {'bronze': 'ブロンズ院長', 'silver': 'シルバー院長',
                  'gold': 'ゴールド院長', 'platinum': 'プラチナ院長', 'diamond': 'ダイヤモンド院長'}
        return labels.get(rank, rank)

    # --------------------------------------------------------
    # キャラクターメッセージ生成
    # --------------------------------------------------------
    def _generate_message(
        self, metrics, score, prev_score, rank, prev_rank,
        consecutive, total_months, new_milestones
    ) -> tuple[str, str]:
        import random

        # 節目があれば節目メッセージを優先
        if new_milestones:
            m = new_milestones[0]
            return 'celebrate', m.message

        # ランクアップ
        rank_order = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
        if rank_order.index(rank) > rank_order.index(prev_rank):
            msgs = CHARACTER_MESSAGES['rank_up']['happy']
            return 'celebrate', random.choice(msgs)

        # スコア大幅上昇
        if score - prev_score >= 5:
            msgs = CHARACTER_MESSAGES['score_up']['happy']
            return 'happy', random.choice(msgs).format(score=score)

        # 具体的な好指標を褒める
        if metrics['profit_rate'] >= 40:
            msgs = CHARACTER_MESSAGES['good_profit']['happy']
            return 'happy', random.choice(msgs).format(value=round(metrics['profit_rate'], 1))

        if metrics['self_pay_rate'] >= 25:
            msgs = CHARACTER_MESSAGES['good_self_pay']['happy']
            return 'happy', random.choice(msgs).format(value=round(metrics['self_pay_rate'], 1))

        # 改善が必要な場合
        if score < 40:
            msgs = CHARACTER_MESSAGES['needs_improvement']['encouraging']
            return 'encouraging', random.choice(msgs)

        # デフォルト
        msgs = CHARACTER_MESSAGES['neutral']['neutral']
        return 'neutral', random.choice(msgs)

    # --------------------------------------------------------
    # DB操作
    # --------------------------------------------------------
    def _get_or_init_gamification(self, clinic_id: str) -> dict:
        try:
            res = self.supabase.table('clinic_gamification') \
                .select('*') \
                .eq('clinic_id', clinic_id) \
                .single() \
                .execute()
            if res.data:
                return res.data
        except Exception:
            pass
        # 初期レコード作成
        try:
            res = self.supabase.table('clinic_gamification') \
                .insert({'clinic_id': clinic_id}) \
                .execute()
            return res.data[0] if res.data else {}
        except Exception:
            return {}

    def _save_gamification(self, clinic_id, rank, score, parameters, consecutive, total_months, last_month):
        param_dict = {p.key: p.value for p in parameters}
        try:
            self.supabase.table('clinic_gamification').upsert({
                'clinic_id': clinic_id,
                'current_rank': rank,
                'total_score': score,
                'param_acquisition': param_dict.get('acquisition', 0),
                'param_revenue': param_dict.get('revenue', 0),
                'param_stability': param_dict.get('stability', 0),
                'param_growth': param_dict.get('growth', 0),
                'param_market': param_dict.get('market', 50),
                'consecutive_months': consecutive,
                'total_input_months': total_months,
                'last_input_month': last_month,
            }, on_conflict='clinic_id').execute()
        except Exception:
            pass

    def _empty_gamification(self, clinic_id: str, gm_row: dict) -> GamificationData:
        return GamificationData(
            clinic_id=clinic_id,
            current_rank='bronze',
            rank_label='ブロンズ院長',
            total_score=0,
            percentile=100,
            next_rank_label='シルバー院長',
            points_to_next_rank=40,
            parameters=[
                RadarParameter(key='acquisition', label='集患力',      value=0, previous=0),
                RadarParameter(key='revenue',     label='収益力',      value=0, previous=0),
                RadarParameter(key='stability',   label='経営安定性',   value=0, previous=0),
                RadarParameter(key='growth',      label='成長性',      value=0, previous=0),
                RadarParameter(key='market',      label='診療圏競争力', value=50, previous=50),
            ],
            consecutive_months=0,
            total_input_months=0,
            streak_start_month=None,
            new_milestones=[],
            character_type=gm_row.get('character_type', 'advanbi'),
            character_message='データを入力すると経営健診が始まります。まずは今月のデータを入力しましょう！',
            character_mood='neutral',
        )
