from supabase import Client
from typing import List, Optional
import uuid
from ..models.consulting import (
    ConsultingReport, KpiScore, CategoryScore, Proposal, PartnerService,
    ScoreLevel, ProposalPriority, ProposalCategory
)


# ============================================================
# ベンチマーク定義（業界調査値）
# ============================================================
BENCHMARKS = {
    'profit_rate': {
        'label': '収益力（利益率）',
        'unit': '%',
        'avg': 30.0,
        'good': 40.0,
        'thresholds': [(40, 5), (30, 4), (20, 3), (10, 2), (0, 1)],
        'points': 25,
    },
    'self_pay_rate': {
        'label': '収益力（自費率）',
        'unit': '%',
        'avg': 17.6,
        'good': 30.0,
        'thresholds': [(30, 5), (20, 4), (14, 3), (8, 2), (0, 1)],
        'points': 20,
    },
    'expense_rate': {
        'label': '経営安定性（経費率）',
        'unit': '%',
        'avg': 67.0,
        'good': 60.0,
        # 経費率は低いほど良い → 反転スコア
        'thresholds': [(0, 5), (60, 4), (65, 3), (70, 2), (75, 1)],
        'points': 20,
        'inverted': True,
    },
    'new_patient_rate': {
        'label': '集患力（新患比率）',
        'unit': '%',
        'avg': 7.5,
        'good': 10.0,
        'thresholds': [(12, 5), (9, 4), (6, 3), (3, 2), (0, 1)],
        'points': 20,
    },
    'revenue_growth': {
        'label': '成長性（売上成長率）',
        'unit': '%',
        'avg': 3.0,
        'good': 10.0,
        'thresholds': [(10, 5), (3, 4), (-3, 3), (-10, 2), (-100, 1)],
        'points': 15,
    },
}

LEVEL_MAP = {5: 'excellent', 4: 'good', 3: 'average', 2: 'poor', 1: 'critical'}

# ============================================================
# 診断パターン定義（設計書の20パターン）
# ============================================================
DIAGNOSIS_PATTERNS = [
    # ---- カテゴリA: 集患・患者フロー ----
    {
        'id': 'A-01',
        'category': '集患',
        'priority': 'critical',
        'problem_tag': '集患_Web',
        'condition': lambda m: m['new_patient_rate'] < 5 and m['patient_trend'] < 0,
        'title': '新患獲得が深刻に不足しています',
        'why': '新患比率が5%未満かつ患者数が減少しています。このまま放置すると既存患者の自然減により、数ヶ月以内に売上が大きく落ち込むリスクがあります。歯科医院の経営は「新患獲得」と「既存患者の定着」の両輪で成り立ちますが、現在その両方が機能していない状態です。',
        'what': '目標：新患比率を8%以上（3ヶ月以内）→ 10%以上（6ヶ月以内）に改善。',
        'how': [
            'Googleビジネスプロフィール（MEO）の最適化・写真・口コミ返信を徹底する',
            'ホームページのSEO対策（地域名＋歯科でのGoogle上位表示）',
            'SNS（Instagram/LINE公式アカウント）での地域向け情報発信',
            '既存患者への紹介カード配布・紹介特典の設定',
            '近隣企業・施設への挨拶・連携（企業健診・老人ホーム）',
        ],
        'expected_impact': '新患比率が5%→10%になると、総患者数が月次+5〜10%増加し、売上改善につながります。',
    },
    {
        'id': 'A-02',
        'category': '集患',
        'priority': 'high',
        'problem_tag': '自費_カウンセリング',
        'condition': lambda m: m['new_patient_rate'] >= 10 and m['self_pay_rate'] < 10,
        'title': '新患は来ているが収益につながっていません',
        'why': '新患は十分来院しているにもかかわらず、自費率が10%未満です。患者は来ているのに、その患者に対して自費診療の提案ができていない状態です。新患獲得コストをかけているのに収益化できておらず、非常にもったいない状況です。',
        'what': '目標：自費率を10%→20%以上（12ヶ月以内）に改善。',
        'how': [
            'カウンセリングの場（個室・時間確保）を整備する',
            '初診時のカウンセリングフローを標準化する（問診票改善含む）',
            '小額自費メニュー（ホワイトニング・フッ素・精密検査）を追加する',
            'タブレット・写真・模型を使った治療説明ツールを導入する',
            'スタッフへの自費提案トークスクリプト研修を実施する',
        ],
        'expected_impact': '自費率が10%→20%になると、患者数が同じでも月間収益が最大+15%改善する試算です。',
    },
    {
        'id': 'A-03',
        'category': '集患',
        'priority': 'medium',
        'problem_tag': '集患_Web',
        'condition': lambda m: m['new_patient_rate'] < 5 and m['profit_rate'] >= 30,
        'title': '既存患者への依存度が高い状態です',
        'why': '現在は利益率が高く安定していますが、新患比率が5%未満であり、既存患者の自然減（転居・死亡等）が続けば、3〜5年で患者基盤が縮小するリスクがあります。今のうちに新患獲得の仕組みを整えておくことが中長期的な安定につながります。',
        'what': '目標：新患比率を7%以上（12ヶ月以内）に改善。',
        'how': [
            'Googleビジネスプロフィールの定期更新・口コミ促進',
            '既存患者への紹介制度の整備',
            'ホームページのコンテンツ充実（症例・スタッフ紹介）',
        ],
        'expected_impact': '新患比率が5%→7%になることで、患者基盤の長期安定性が大幅に向上します。',
    },
    # ---- カテゴリB: 収益性 ----
    {
        'id': 'B-01',
        'category': '収益性',
        'priority': 'critical',
        'problem_tag': '自費_カウンセリング',
        'condition': lambda m: m['self_pay_rate'] < 10 and m['profit_rate'] < 20,
        'title': '保険診療依存・低収益の状態です',
        'why': '自費率10%未満・利益率20%未満の組み合わせは、歯科経営において最も危険な状態の一つです。保険診療だけでは診療報酬改定のたびに収益が直撃し、利益率を上げる手段が限られます。自費率を10%→30%に改善するだけで、利益率は約2倍になる試算です。',
        'what': '目標：自費率→20%（6ヶ月）→30%（12ヶ月）、利益率→25%（6ヶ月）→35%（12ヶ月）。',
        'how': [
            '小額自費メニュー（1〜3万円）を3種類以上追加する',
            'カウンセリング専用スペースを確保し、個室で説明できる環境を作る',
            '全スタッフ共通の自費提案トークスクリプトを作成・研修する',
            '治療計画書を可視化（費用・期間・期待効果）して患者の同意率を上げる',
            'トリートメントコーディネーター（TC）の育成または採用を検討する',
        ],
        'expected_impact': '現状売上で自費率が17%→30%になった場合、利益率は約10〜15ポイント改善する試算です。',
    },
    {
        'id': 'B-02',
        'category': '収益性',
        'priority': 'critical',
        'problem_tag': 'コスト_材料費',
        'condition': lambda m: m['self_pay_rate'] >= 20 and m['profit_rate'] < 15,
        'title': '自費診療をしているのに利益が出ていません',
        'why': '自費率は高いにもかかわらず利益率が15%未満です。これはコスト構造に深刻な問題がある状態です。材料費・技工費の過大、または人件費の過大が主な原因として考えられます。売上があっても利益が出ないのは、経営の持続可能性に直結します。',
        'what': '目標：利益率→20%（3ヶ月）→30%（6ヶ月）に改善。まずコスト構造を診断することが先決です。',
        'how': [
            '材料費・技工費比率を計算し、業界平均（20%以内）と比較する',
            '技工所の見直し・複数社の相見積もりを取る',
            '材料の仕入先を統合・ボリュームディスカウントを交渉する',
            '固定費（家賃・リース料）の適正性を再確認する',
            '人員配置とシフト設計を見直し、アイドルタイムを削減する',
        ],
        'expected_impact': '変動費を5%削減できた場合、月間利益が数十万円単位で改善します。',
    },
    {
        'id': 'B-03',
        'category': '収益性',
        'priority': 'high',
        'problem_tag': '自費_メニュー設計',
        'condition': lambda m: m['self_pay_rate'] < 17 and m['expense_rate'] < 65,
        'title': '自費率を伸ばすことで大きな利益改善が見込めます',
        'why': '経費率はすでに良好な水準ですが、自費率が業界平均（17.6%）未満です。コスト管理はできているので、あとは自費率を上げるだけで利益率が大きく改善します。今が最も投資対効果の高いフェーズです。',
        'what': '目標：自費率を→20%（6ヶ月）→25%（12ヶ月）に引き上げる。',
        'how': [
            '現在の自費メニュー構成を見直し、患者が選びやすい価格帯を追加する',
            '審美・予防系の自費メニュー（ホワイトニング・マウスガード等）を拡充する',
            'カウンセリングの質を向上させる（提案率・成約率の向上）',
            '既存患者への自費提案強化（定期検診時の声かけフロー整備）',
        ],
        'expected_impact': '自費率が3〜5%上がるだけで、月間利益が15〜25万円改善する試算です。',
    },
    # ---- カテゴリC: コスト最適化 ----
    {
        'id': 'C-01',
        'category': 'コスト最適化',
        'priority': 'critical',
        'problem_tag': 'コスト_固定費',
        'condition': lambda m: m['expense_rate'] >= 75 and m['revenue_growth'] < 0,
        'title': '経費率が危険水準・売上も減少しています',
        'why': '経費率75%以上かつ売上減少は、経営存続リスクの高い状態です。このまま推移すると半年以内に赤字転落の可能性があります。「売上を増やす」と「コストを削る」の両面を同時に対策する必要があります。',
        'what': '目標：経費率→70%以下（3ヶ月以内）の緊急改善。',
        'how': [
            '固定費（家賃・リース・保険料）を全項目洗い出し、削減交渉を始める',
            '変動費（材料・技工費）の仕入先を見直し、即時コスト削減を図る',
            'スタッフのシフト・人員配置を最適化し、残業・アイドルタイムを削減する',
            '集患施策を並行して進め、分母（売上）を増やす',
            '税理士・経営コンサルタントへの相談を早期に検討する',
        ],
        'expected_impact': '経費率を5%削減できた場合、月間利益が売上の5%分改善します。',
    },
    {
        'id': 'C-02',
        'category': 'コスト最適化',
        'priority': 'critical',
        'problem_tag': 'コスト_材料費',
        'condition': lambda m: m['variable_cost_rate'] >= 25 and m['profit_rate'] < 20,
        'title': '変動費（材料費等）が過大です',
        'why': '変動費率25%超は業界適正水準（20%以内）を大きく超えています。材料費・技工費の管理が最優先課題です。自費診療を増やしながら変動費を適正化することで、収益構造が根本的に改善します。',
        'what': '目標：変動費率→20%以内（6ヶ月以内）に改善。',
        'how': [
            '材料費の項目別分析を行い、過大な品目を特定する',
            '複数の材料メーカー・商社から相見積もりを取る',
            '技工所の単価・品質を再評価し、必要であれば変更を検討する',
            '院内技工の範囲拡大（技工士採用）を費用対効果で検討する',
            '材料在庫の適正化（過剰在庫・廃棄ロスの削減）を行う',
        ],
        'expected_impact': '変動費率が25%→20%になると、売上同じで月間利益が5%分（数十万円）改善します。',
    },
    {
        'id': 'C-03',
        'category': 'コスト最適化',
        'priority': 'high',
        'problem_tag': 'コスト_固定費',
        'condition': lambda m: m['fixed_cost_rate'] >= 50 and m['profit_rate'] < 25,
        'title': '固定費の負担が利益を圧迫しています',
        'why': '固定費率50%以上は、売上が少し落ちただけで赤字に転落するリスクを高めます。固定費は売上に関わらず発生するため、売上が伸びなくても固定費を適正化すれば利益率が改善します。',
        'what': '目標：固定費率→45%以下（12ヶ月以内）に改善。',
        'how': [
            '家賃・リース料の更新時に交渉またはダウンサイジングを検討する',
            '保険料（火災・賠償・生命保険）を見直し、過剰カバレッジを削減する',
            '設備のリース vs 購入の見直し（金利負担の最適化）',
            '固定費の支払いスケジュールを整理し、資金繰りを可視化する',
        ],
        'expected_impact': '固定費率が5%改善すると、月間利益が数十万円単位で増加します。',
    },
    # ---- カテゴリD: トレンド（時系列） ----
    {
        'id': 'D-01',
        'category': '成長性',
        'priority': 'critical',
        'problem_tag': '自費_カウンセリング',
        'condition': lambda m: m.get('profit_trend_3m', 0) <= -2,
        'title': '3ヶ月連続で利益率が低下しています',
        'why': '3ヶ月連続の利益率低下は、一時的な要因ではなく構造的な問題が進行しているサインです。早期に原因を特定し対策を打たないと、半年後には深刻な経営悪化に陥るリスクがあります。',
        'what': '目標：来月中に利益率の低下トレンドを止める。原因特定が最優先。',
        'how': [
            '売上の変化（患者数・単価）と費用の変化を分けて分析する',
            '固定費に変化があれば即座にその内容を確認する',
            '新患数・自費率・経費率の各月推移を比較し、悪化項目を特定する',
            '原因が売上なら集患施策、コストなら経費削減を即時開始する',
        ],
        'expected_impact': '原因特定と早期対処で、3ヶ月以内にトレンドを反転させることが目標です。',
    },
    {
        'id': 'D-02',
        'category': '集患',
        'priority': 'high',
        'problem_tag': '集患_Web',
        'condition': lambda m: m.get('patient_trend_3m', 0) <= -2,
        'title': '3ヶ月連続で患者数が減少しています',
        'why': '患者数の3ヶ月連続減少は、既存患者の離脱または新患獲得の失速を示しています。患者数は売上の基盤であり、放置すると売上・利益の両方が悪化します。',
        'what': '目標：1ヶ月以内に減少の原因を特定し、対策を開始する。',
        'how': [
            '新患数と再診数のどちらが減っているかを確認する',
            '新患減少なら集患施策（MEO・SNS・紹介制度）を強化する',
            '再診減少ならリコール管理（連絡・予約促進）を強化する',
            '院内の患者満足度を確認する（口コミ・スタッフ対応）',
        ],
        'expected_impact': '原因対策で患者数の減少が止まると、売上安定化・成長軌道への回帰が見込まれます。',
    },
    {
        'id': 'D-03',
        'category': '成長性',
        'priority': 'high',
        'problem_tag': 'コスト_材料費',
        'condition': lambda m: m['revenue_growth'] > 3 and m.get('profit_trend_3m', 0) < 0,
        'title': '売上は増えているのに利益が減っています',
        'why': '売上増加と利益減少の組み合わせは「薄利多売化」が進んでいるサインです。患者数や売上が増えても、それ以上のペースでコストが増えている状態です。このまま放置すると、忙しいのに儲からない経営になります。',
        'what': '目標：コスト増加の原因を特定し、利益率の低下を止める。',
        'how': [
            '売上増加に伴うコスト増加の内訳を確認する（人件費・材料費のどちらか）',
            '人件費が増えている場合、生産性（患者数/スタッフ数）を計算する',
            '材料費が増えている場合、調達の効率化・仕入先見直しを検討する',
            '自費率の向上で単価を上げ、コスト比率を下げる施策を並行する',
        ],
        'expected_impact': 'コスト管理の適正化で、売上増加分が利益に反映される体制を作ります。',
    },
    {
        'id': 'D-06',
        'category': '成長性',
        'priority': 'low',
        'problem_tag': '自費_メニュー設計',
        'condition': lambda m: (
            m['revenue_growth'] > 5
            and m['profit_rate'] >= 30
            and m['self_pay_rate'] >= 20
        ),
        'title': '全指標が好調です。さらなる成長戦略を検討しましょう',
        'why': '売上成長・利益率・自費率のすべてが良好水準です。現状維持だけでなく、次のステージへの投資を検討する絶好のタイミングです。',
        'what': '目標：現状維持＋次の成長施策の設計。',
        'how': [
            '高付加価値な自費メニュー（インプラント・矯正・審美）の拡充を検討する',
            '設備投資（新型機器・ユニット増設）を計画的に行う',
            '分院展開・グループ化の可能性を検討する',
            '採用・スタッフ育成に投資し、組織の底上げを図る',
        ],
        'expected_impact': '好調な経営基盤を活かした戦略投資で、さらなる成長が見込めます。',
    },
    # ---- カテゴリE: リコール・予約 ----
    {
        'id': 'E-01',
        'category': '集患',
        'priority': 'high',
        'problem_tag': 'リコール_システム',
        'condition': lambda m: (
            m['new_patient_rate'] >= 7
            and m.get('patient_trend_3m', 0) <= -1
            and m['self_pay_rate'] < 20
        ),
        'title': '新患は来ているが再診患者の定着率が低い可能性があります',
        'why': '新患比率は一定水準を保っているにもかかわらず、患者数が減少しています。これは新患獲得よりも既存患者の離脱（リコール未実施・予約忘れ）が上回っている状態です。患者を獲得するコストは、既存患者を維持するコストの5〜7倍と言われており、リコール強化が最も費用対効果の高い施策です。',
        'what': '目標：3ヶ月以内に再診率・リコール率を5%以上改善する。',
        'how': [
            'リコールハガキ・SMS・LINEでの自動リマインド体制を整備する',
            '定期検診の次回予約を来院時に必ず取る「予約完結率」を指標化する',
            '長期未来院患者（6ヶ月以上）への掘り起こし連絡を実施する',
            '定期検診のメリット（早期発見・費用削減）を患者に説明するトークを整備する',
            '予約キャンセル後のフォロー連絡フローを標準化する',
        ],
        'expected_impact': 'リコール率が10%改善すると、既存患者からの月間来院数が増加し、売上が安定・増加します。',
    },
    {
        'id': 'E-02',
        'category': '集患',
        'priority': 'medium',
        'problem_tag': '予約_自動化',
        'condition': lambda m: (
            m['new_patient_rate'] >= 5
            and m['profit_rate'] >= 20
            and m.get('patient_trend_3m', 0) <= 0
        ),
        'title': '予約管理の効率化で機会損失を減らせます',
        'why': '経営指標は安定していますが、患者数の伸びが止まっています。電話対応・予約管理の非効率（電話が繋がらない・キャンセル管理不足）が新患獲得や再診率の足かせになっている可能性があります。予約の利便性向上は患者満足度と来院率に直結します。',
        'what': '目標：予約関連の機会損失（取りこぼし・キャンセル未フォロー）を半減させる。',
        'how': [
            'Web予約システムを導入し、24時間予約受付を可能にする',
            '予約リマインド（前日SMS/LINE）を自動化してキャンセル率を下げる',
            'キャンセル発生時のキャンセル待ちフローを整備する',
            '予約台帳をデジタル化し、ユニット稼働率を可視化する',
            '初診電話応対マニュアルを整備し、予約転換率を高める',
        ],
        'expected_impact': '予約取りこぼしとキャンセルを各5%削減できれば、月間来院数が数%増加します。',
    },
    # ---- カテゴリF: スタッフ・組織 ----
    {
        'id': 'F-01',
        'category': 'コスト最適化',
        'priority': 'high',
        'problem_tag': 'スタッフ研修',
        'condition': lambda m: (
            m['self_pay_rate'] < 15
            and m['new_patient_rate'] >= 7
            and m['profit_rate'] < 30
        ),
        'title': 'スタッフの提案力強化で自費率を改善できます',
        'why': '新患は十分来院しているにもかかわらず、自費率が15%未満にとどまっています。患者への治療説明・自費提案がスタッフ任せになっており、提案スキルにばらつきがある可能性があります。スタッフ全員が一定水準の提案ができるようになるだけで、自費率は大きく改善します。',
        'what': '目標：自費提案率（提案した患者数/来院患者数）を6ヶ月で20%以上に引き上げる。',
        'how': [
            'トリートメントコーディネーター（TC）を育成または専任配置する',
            '自費メニュー別の提案トークスクリプトを作成・ロールプレイ研修を実施する',
            '患者の口腔写真・口腔内カメラを活用した視覚的説明を標準化する',
            '自費提案数・成約率をスタッフ別に可視化し、改善PDCAを回す',
            '外部の自費提案研修・セミナーへのスタッフ参加を検討する',
        ],
        'expected_impact': '自費提案率が改善すると、同じ患者数でも月間売上が10〜20%増加する試算です。',
    },
    {
        'id': 'F-02',
        'category': '成長性',
        'priority': 'medium',
        'problem_tag': 'スタッフ研修',
        'condition': lambda m: (
            m['profit_rate'] >= 25
            and m['revenue_growth'] <= 2
            and m['self_pay_rate'] >= 15
        ),
        'title': 'スタッフ力の底上げで次の成長段階へ進めます',
        'why': '経営指標は安定していますが、売上の伸びが鈍化しています。この段階でスタッフのスキル・モチベーションに投資することで、サービス品質の向上・患者満足度の向上・口コミ増加という好循環を作れます。採用競争力の強化にもつながります。',
        'what': '目標：スタッフ研修を体系化し、6ヶ月以内に患者満足度指標（口コミ評点等）を改善する。',
        'how': [
            '接遇・コミュニケーション研修を定期的に実施する',
            '各職種（歯科衛生士・助手・受付）の目標とスキルマップを設計する',
            '勉強会・外部セミナーへの参加を支援する（費用補助制度）',
            '患者アンケートを実施し、スタッフ対応の満足度を定量把握する',
            'スタッフが提案できる予防メニューを増やし、患者単価を高める',
        ],
        'expected_impact': 'スタッフ力向上による患者満足度・リコール率・自費提案力の向上で、安定した成長が見込めます。',
    },
    # ---- カテゴリG: SNS・地域集患 ----
    {
        'id': 'G-01',
        'category': '集患',
        'priority': 'medium',
        'problem_tag': '集患_SNS',
        'condition': lambda m: (
            m['new_patient_rate'] < 8
            and m['profit_rate'] >= 20
            and m['revenue_growth'] <= 3
        ),
        'title': 'SNS・地域集患で新患の間口を広げましょう',
        'why': '新患比率が8%未満で、売上成長も鈍化しています。Webからの集患は既に一定水準ありますが、SNSや地域コミュニティとのつながりをまだ活かしきれていない可能性があります。特にInstagram・LINE公式アカウントは歯科医院との相性が高く、費用対効果の高い集患チャネルです。',
        'what': '目標：SNS・地域施策経由の新患を月3〜5人増やす（6ヶ月以内）。',
        'how': [
            'Instagram公式アカウントを開設・週2〜3回投稿（症例・スタッフ・院内紹介）',
            'LINE公式アカウントを活用し、既存患者へのリコール・お知らせ配信を自動化する',
            '地域のイベント（お祭り・健康フェア）への参加・協賛でブランド認知を高める',
            '近隣小学校・幼稚園への歯科健康教室を実施し、子育て世代への接点を作る',
            'Googleクチコミの促進（来院後に丁寧に依頼するフローを整備）',
        ],
        'expected_impact': 'SNS・地域接点の強化で、月3〜5人の新患増加が見込まれ、年間売上が数百万円単位で改善します。',
    },
]


class ConsultingService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    # --------------------------------------------------------
    # メイン: 経営健診レポート生成
    # --------------------------------------------------------
    async def get_consulting_report(self, clinic_id: str) -> ConsultingReport:
        monthly_list = self.supabase.table('monthly_data') \
            .select('*') \
            .eq('clinic_id', clinic_id) \
            .order('year_month', desc=True) \
            .limit(13) \
            .execute().data

        if not monthly_list:
            return self._empty_report()

        # 院長メモを取得（メモ連動アドバイス用）
        try:
            memo_res = self.supabase.table('clinics').select('clinic_memo').eq('id', clinic_id).single().execute()
            clinic_memo = (memo_res.data or {}).get('clinic_memo') or ''
        except Exception:
            clinic_memo = ''

        current = monthly_list[0]
        previous = monthly_list[1] if len(monthly_list) > 1 else None
        has_enough = len(monthly_list) >= 3

        metrics = self._calc_metrics(current, previous, monthly_list)
        kpi_scores = self._score_kpis(metrics)
        total_score = self._calc_total_score(kpi_scores)
        category_scores = self._calc_category_scores(metrics)
        proposals = await self._generate_proposals(metrics, clinic_memo)
        percentile = self._calc_percentile(total_score)

        return ConsultingReport(
            total_score=total_score,
            total_level=self._score_to_level(total_score / 20),  # 100点を5段階に変換
            percentile=percentile,
            category_scores=category_scores,
            kpi_scores=kpi_scores,
            proposals=proposals,
            year_month=current['year_month'],
            has_enough_data=has_enough,
        )

    # --------------------------------------------------------
    # メトリクス計算
    # --------------------------------------------------------
    def _calc_metrics(self, current: dict, previous: dict | None, history: list) -> dict:
        rev = current['total_revenue'] or 1  # ゼロ除算防止
        total_cost = (
            (current.get('personnel_cost') or 0)
            + (current.get('material_cost') or 0)
            + (current.get('fixed_cost') or 0)
            + (current.get('other_cost') or 0)
        )
        variable_cost = (current.get('material_cost') or 0) + (current.get('other_cost') or 0)
        fixed_cost = (current.get('personnel_cost') or 0) + (current.get('fixed_cost') or 0)
        profit = rev - total_cost
        total_patients = current.get('total_patients') or 1

        m = {
            'profit_rate': profit / rev * 100,
            'self_pay_rate': (current.get('self_pay_revenue') or 0) / rev * 100,
            'expense_rate': total_cost / rev * 100,
            'variable_cost_rate': variable_cost / rev * 100,
            'fixed_cost_rate': fixed_cost / rev * 100,
            'new_patient_rate': (current.get('first_visit_patients') or 0) / total_patients * 100,
            'patient_trend': 0,
            'revenue_growth': 0,
        }

        if previous:
            prev_patients = previous.get('total_patients') or 1
            m['patient_trend'] = ((total_patients - prev_patients) / prev_patients) * 100

        # 前年比売上成長率
        if len(history) >= 13:
            last_year = history[12]
            ly_rev = last_year.get('total_revenue') or 1
            m['revenue_growth'] = (rev - ly_rev) / ly_rev * 100
        elif previous:
            prev_rev = previous.get('total_revenue') or 1
            m['revenue_growth'] = (rev - prev_rev) / prev_rev * 100

        # 3ヶ月トレンド（利益率）
        if len(history) >= 3:
            scores_3m = []
            for d in history[:3]:
                r = d.get('total_revenue') or 1
                c = (
                    (d.get('personnel_cost') or 0)
                    + (d.get('material_cost') or 0)
                    + (d.get('fixed_cost') or 0)
                    + (d.get('other_cost') or 0)
                )
                scores_3m.append((r - c) / r * 100)
            # 単純な傾き（最新 - 3ヶ月前）
            m['profit_trend_3m'] = scores_3m[0] - scores_3m[2]

        # 3ヶ月患者数トレンド
        if len(history) >= 3:
            p0 = history[0].get('total_patients') or 0
            p2 = history[2].get('total_patients') or 1
            m['patient_trend_3m'] = ((p0 - p2) / p2) * 100

        return m

    # --------------------------------------------------------
    # KPIスコアリング
    # --------------------------------------------------------
    def _score_kpis(self, metrics: dict) -> list[KpiScore]:
        scores = []
        for key, cfg in BENCHMARKS.items():
            val = metrics.get(key, 0)
            score = self._calc_score(val, cfg)
            scores.append(KpiScore(
                key=key,
                label=cfg['label'],
                value=round(val, 1),
                unit=cfg['unit'],
                score=score,
                level=self._score_to_level(score),
                benchmark_avg=cfg['avg'],
                benchmark_good=cfg['good'],
                benchmark_label=f"業界平均 {cfg['avg']}{cfg['unit']} / 優良水準 {cfg['good']}{cfg['unit']}",
            ))
        return scores

    def _calc_score(self, value: float, cfg: dict) -> int:
        inverted = cfg.get('inverted', False)
        for threshold, score in cfg['thresholds']:
            if inverted:
                if value <= threshold:
                    return score
            else:
                if value >= threshold:
                    return score
        return 1

    def _calc_total_score(self, kpi_scores: list[KpiScore]) -> int:
        total = 0
        for ks in kpi_scores:
            cfg = BENCHMARKS[ks.key]
            ratio = (ks.score - 1) / 4  # 1-5 → 0-1
            total += int(ratio * cfg['points'])
        return min(100, total)

    def _score_to_level(self, score: float) -> str:
        if score >= 4.5:
            return 'excellent'
        elif score >= 3.5:
            return 'good'
        elif score >= 2.5:
            return 'average'
        elif score >= 1.5:
            return 'poor'
        return 'critical'

    # --------------------------------------------------------
    # カテゴリスコア
    # --------------------------------------------------------
    def _calc_category_scores(self, metrics: dict) -> list[CategoryScore]:
        def pct_score(val, low, mid, high):
            if val >= high:
                return 90
            elif val >= mid:
                return 65
            elif val >= low:
                return 40
            return 20

        acquisition = pct_score(metrics['new_patient_rate'], 3, 6, 10)
        revenue = pct_score(metrics['self_pay_rate'], 10, 17, 30)
        stability = max(0, 100 - int(metrics['expense_rate']))
        growth = pct_score(metrics['revenue_growth'], -3, 3, 10)

        return [
            CategoryScore(category='集患', score=acquisition, level=self._score_to_level(acquisition / 20)),
            CategoryScore(category='収益性', score=revenue, level=self._score_to_level(revenue / 20)),
            CategoryScore(category='コスト最適化', score=stability, level=self._score_to_level(stability / 20)),
            CategoryScore(category='成長性', score=growth, level=self._score_to_level(growth / 20)),
        ]

    # --------------------------------------------------------
    # 提案生成（パターンマッチング）
    # --------------------------------------------------------
    # メモキーワード → 提案パターン（院長メモ連動アドバイス）
    MEMO_KEYWORD_PATTERNS = [
        {
            'keywords': ['スタッフ', '採用', '求人', '人材', '人手不足', '離職', '退職', '定着'],
            'problem_tag': 'スタッフ_採用',
            'priority': 'high',
            'category': '成長性',
            'title': '【院長メモより】スタッフ採用・定着の課題に対応しましょう',
            'why': '院長メモにスタッフ採用・定着に関するご相談が記入されています。歯科業界はスタッフ採用難が続いており、早期の対策が重要です。',
            'what': '目標：スタッフの採用力・定着率を高め、安定した診療体制を整備する。',
            'how': [
                '歯科専門の求人媒体への掲載と求人票の見直し（給与・福利厚生の明確化）',
                'スタッフ評価制度・キャリアパスの整備で定着率を向上',
                '研修制度・資格支援制度の導入で職場の魅力を高める',
                '退職理由の把握と職場環境の改善（ヒアリング実施）',
            ],
            'expected_impact': 'スタッフ体制の安定化により、患者サービス品質の向上と診療効率の改善が見込まれます。',
        },
        {
            'keywords': ['自費', '自費率', '自費診療', 'インプラント', '矯正', 'ホワイトニング', '審美'],
            'problem_tag': '収益_自費',
            'priority': 'high',
            'category': '収益性',
            'title': '【院長メモより】自費診療の拡大に向けた取り組みを強化しましょう',
            'why': '院長メモに自費診療に関するご意向が記入されています。自費率の向上は収益性改善に直結します。',
            'what': '目標：自費診療メニューの拡充とカウンセリング強化で自費率を高める。',
            'how': [
                'スタッフへの自費提案トレーニングを実施する',
                'カウンセリングルームの整備・カウンセリングスキルを磨く',
                '自費メニューのパンフレット・院内POPを整備する',
                'インプラント・矯正の説明会・症例展示を充実させる',
            ],
            'expected_impact': '自費率が5%向上すると、月次売上が数百万円単位で改善します。',
        },
        {
            'keywords': ['患者', '新患', '集患', '予約', '口コミ', 'Google', 'HP', 'ホームページ', 'Web', 'SNS'],
            'problem_tag': '集患_Web_メモ',
            'priority': 'high',
            'category': '集患',
            'title': '【院長メモより】集患・新患獲得の強化を検討しましょう',
            'why': '院長メモに集患・患者獲得に関するご相談が記入されています。Web集患の強化は費用対効果の高い施策です。',
            'what': '目標：Web経由の新患数を月5人以上増やす（3ヶ月以内）。',
            'how': [
                'Googleビジネスプロフィールの最適化（写真・投稿・クチコミ対応）',
                'ホームページのSEO改善と問診票オンライン化による利便性向上',
                'LINEでの予約・リコール自動化でリピート率を高める',
                'InstagramなどSNSでの症例・院内紹介コンテンツの発信',
            ],
            'expected_impact': '新患獲得数が月5人増えると年間で数百万円の売上増加につながります。',
        },
        {
            'keywords': ['経費', 'コスト', '削減', '節約', '固定費', '材料費', '光熱費'],
            'problem_tag': 'コスト_経費_メモ',
            'priority': 'medium',
            'category': 'コスト最適化',
            'title': '【院長メモより】コスト削減・経費最適化に取り組みましょう',
            'why': '院長メモにコスト・経費に関するご相談が記入されています。経費率の改善は利益率向上に直結します。',
            'what': '目標：主要経費を見直し、利益率を3〜5%改善する。',
            'how': [
                '材料費の仕入先・発注量を見直し、ボリュームディスカウントを交渉する',
                '光熱費の削減（省エネ設備・電力会社の見直し）',
                'デジタル化による間接コスト削減（予約・会計・書類管理）',
                '業務効率化ツールの導入でスタッフ残業を削減する',
            ],
            'expected_impact': '経費率を3%改善すると、月次利益が数十万円単位で向上します。',
        },
        {
            'keywords': ['リコール', '予防', 'メンテナンス', '定期健診', '衛生士', '歯科衛生士'],
            'problem_tag': '予防_リコール_メモ',
            'priority': 'medium',
            'category': '集患',
            'title': '【院長メモより】リコール・予防歯科の体制を強化しましょう',
            'why': '院長メモにリコール・予防に関するご相談が記入されています。リコール率の向上は安定収益の基盤となります。',
            'what': '目標：リコール率を現状から10%向上させ、定期来院患者を増やす。',
            'how': [
                'リコール通知の自動化（LINE・SMS・はがき）で来院促進',
                '歯科衛生士主導の予防プログラムを整備・強化する',
                'リコール患者へのメンテナンスメニュー充実と価値訴求',
                '定期健診の重要性を患者に伝えるコミュニケーション改善',
            ],
            'expected_impact': 'リコール率10%向上で、既存患者からの安定収益が大きく改善します。',
        },
        {
            'keywords': ['設備', '機器', 'レントゲン', 'CT', '歯科用', '老朽化', '更新', '投資'],
            'problem_tag': '設備_投資_メモ',
            'priority': 'medium',
            'category': '成長性',
            'title': '【院長メモより】設備投資・機器更新の計画を立てましょう',
            'why': '院長メモに設備・機器に関するご相談が記入されています。適切な設備投資は診療品質と患者満足度を高めます。',
            'what': '目標：設備投資計画を策定し、ROI（投資対効果）を最大化する。',
            'how': [
                '現行設備の稼働率・老朽化状況を把握し、優先順位を整理する',
                '補助金・リース活用で初期投資を抑える方法を検討する',
                '設備投資後の増収見込みを試算し、回収期間を明確にする',
                'メーカー比較・デモ機体験で最適な機器を選定する',
            ],
            'expected_impact': '適切な設備投資により、診療効率・患者満足度・自費率の向上が見込まれます。',
        },
    ]

    async def _generate_proposals(self, metrics: dict, clinic_memo: str = '') -> list[Proposal]:
        matched = []
        used_tags: set[str] = set()

        for pattern in DIAGNOSIS_PATTERNS:
            try:
                if pattern['condition'](metrics):
                    services = await self._get_services_for_tag(pattern['problem_tag'])
                    used_tags.add(pattern['problem_tag'])
                    matched.append(Proposal(
                        id=str(uuid.uuid4()),
                        priority=pattern['priority'],
                        category=pattern['category'],
                        pattern_id=pattern['id'],
                        title=pattern['title'],
                        why=pattern['why'],
                        what=pattern['what'],
                        how=pattern['how'],
                        expected_impact=pattern['expected_impact'],
                        problem_tag=pattern['problem_tag'],
                        recommended_services=services,
                    ))
            except Exception:
                continue

        # 院長メモのキーワードマッチングで追加提案（KPIベースと重複しないタグのみ）
        if clinic_memo:
            for mp in self.MEMO_KEYWORD_PATTERNS:
                if mp['problem_tag'] in used_tags:
                    continue
                if any(kw in clinic_memo for kw in mp['keywords']):
                    services = await self._get_services_for_tag(mp['problem_tag'])
                    used_tags.add(mp['problem_tag'])
                    matched.append(Proposal(
                        id=str(uuid.uuid4()),
                        priority=mp['priority'],
                        category=mp['category'],
                        pattern_id=f"MEMO_{mp['problem_tag']}",
                        title=mp['title'],
                        why=mp['why'],
                        what=mp['what'],
                        how=mp['how'],
                        expected_impact=mp['expected_impact'],
                        problem_tag=mp['problem_tag'],
                        recommended_services=services,
                    ))

        # メモ連動提案を先頭、KPIベース提案を優先度順で後続
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        memo_proposals = [p for p in matched if p.pattern_id.startswith('MEMO_')]
        kpi_proposals = [p for p in matched if not p.pattern_id.startswith('MEMO_')]
        memo_proposals.sort(key=lambda p: priority_order[p.priority])
        kpi_proposals.sort(key=lambda p: priority_order[p.priority])
        return (memo_proposals + kpi_proposals)[:7]

    async def _get_services_for_tag(self, tag: str) -> list[PartnerService]:
        try:
            tag_rows = self.supabase.table('service_problem_tags') \
                .select('service_id') \
                .eq('problem_tag', tag) \
                .execute().data
            service_ids = [r['service_id'] for r in tag_rows]
            if not service_ids:
                return []

            rows = self.supabase.table('partner_services') \
                .select('*, partner_companies(name, logo_url)') \
                .in_('id', service_ids) \
                .eq('is_active', True) \
                .order('display_priority', desc=True) \
                .limit(3) \
                .execute().data

            return [
                PartnerService(
                    id=r['id'],
                    company_name=(r.get('partner_companies') or {}).get('name', ''),
                    service_name=r['service_name'],
                    catchcopy=r.get('catchcopy'),
                    description=r.get('description'),
                    price_range=r.get('price_range'),
                    service_url=r.get('service_url'),
                    coupon_code=r.get('coupon_code'),
                    logo_url=(r.get('partner_companies') or {}).get('logo_url'),
                    display_priority=r.get('display_priority', 0),
                )
                for r in rows
            ]
        except Exception:
            return []

    # --------------------------------------------------------
    # 全国パーセンタイル（暫定：スコアベース近似）
    # --------------------------------------------------------
    def _calc_percentile(self, score: int) -> int:
        # DB蓄積前の暫定計算（業界ベンチマークからの正規分布近似）
        # score 50 = 平均 → 全国50%
        # score 75 → 全国上位20%
        # score 85 → 全国上位10%
        if score >= 90:
            return 5
        elif score >= 80:
            return 10
        elif score >= 70:
            return 20
        elif score >= 60:
            return 35
        elif score >= 50:
            return 50
        elif score >= 40:
            return 65
        elif score >= 30:
            return 80
        return 90

    def _empty_report(self) -> ConsultingReport:
        return ConsultingReport(
            total_score=0,
            total_level='critical',
            percentile=100,
            category_scores=[],
            kpi_scores=[],
            proposals=[],
            year_month='',
            has_enough_data=False,
        )
