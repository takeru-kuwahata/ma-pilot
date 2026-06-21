export interface GlossaryEntry {
  term: string;
  description: string;
  formula?: string;
  example?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // KPIカード
  total_revenue: {
    term: '総売上',
    description: '保険診療・自由診療・物販など、医院で発生したすべての収入の合計です。',
    formula: '総売上 ＝ 保険診療収入 ＋ 自由診療収入 ＋ 物販収入',
  },
  operating_profit: {
    term: '営業利益',
    description: '総売上から人件費・材料費・家賃などのすべてのコストを差し引いた、本業の利益です。',
    formula: '営業利益 ＝ 総売上 － 変動費 － 固定費',
  },
  profit_rate: {
    term: '利益率',
    description: '売上のうち何%が利益として残るかを示す指標です。歯科医院の目安は15〜25%。高いほど経営効率が良い状態です。',
    formula: '利益率 ＝ 営業利益 ÷ 総売上 × 100',
    example: '例）売上500万円、利益75万円 → 利益率15%',
  },
  total_patients: {
    term: '総患者数',
    description: '当月に来院した患者数の合計です（新患＋既存患者）。',
    formula: '総患者数 ＝ 新患数 ＋ 再診患者数',
  },
  new_patients: {
    term: '新患数',
    description: '当月に初めて来院した新規の患者数です。集患力・広告効果を測る重要な指標です。',
  },
  revenue_per_patient: {
    term: '患者単価',
    description: '患者1人あたりの平均売上金額です。自由診療の比率が上がると単価も上がります。',
    formula: '患者単価 ＝ 総売上 ÷ 総患者数',
    example: '例）売上500万円、患者500人 → 単価1万円',
  },

  // 指標別スコア
  profit_rate_score: {
    term: '収益力（利益率）',
    description: '売上に対して利益がどれだけ出ているかを示します。歯科医院の全国平均は約20%。この数値が高いほど経営の余裕があります。',
    formula: '利益率 ＝ 営業利益 ÷ 総売上 × 100',
  },
  self_pay_rate_score: {
    term: '収益力（自費率）',
    description: '総売上のうち、保険外（自由診療）の収入が占める割合です。インプラント・ホワイトニング・矯正など。自費率が高いほど単価・利益率が向上します。',
    formula: '自費率 ＝ 自由診療収入 ÷ 総売上 × 100',
  },
  expense_rate_score: {
    term: '経営安定性（経費率）',
    description: '売上に対して経費（変動費＋固定費）が占める割合です。低いほどコスト管理ができている状態。歯科医院の目安は75〜85%以下。',
    formula: '経費率 ＝ 総経費 ÷ 総売上 × 100',
  },
  new_patient_rate_score: {
    term: '集患力（新患比率）',
    description: '来院患者全体のうち、新規患者の割合です。広告・口コミ・立地の集客力を示します。目安は月間来院患者の10〜15%。',
    formula: '新患比率 ＝ 新患数 ÷ 総患者数 × 100',
  },
  revenue_growth_score: {
    term: '成長性（売上成長率）',
    description: '前年同月と比べて売上がどれだけ成長しているかを示します。プラスであれば前年より売上が伸びています。',
    formula: '売上成長率 ＝ (今月売上 － 前年同月売上) ÷ 前年同月売上 × 100',
  },
  competition_score: {
    term: '競争力',
    description: '診療圏内の競合歯科医院数・人口・自費率などを総合的に評価したスコアです。高いほど地域での競争優位性があります。',
  },

  // グラフ・その他
  variable_cost_rate: {
    term: '変動費率',
    description: '売上の増減に連動して変わるコスト（材料費・技工費・消耗品など）が売上に占める割合です。低いほど効率的です。',
    formula: '変動費率 ＝ 変動費 ÷ 総売上 × 100',
  },
  self_pay_rate: {
    term: '自費率',
    description: '総売上のうち、保険外（自由診療）の収入が占める割合です。インプラント・ホワイトニング・矯正など。自費率が高いほど単価・利益率が向上します。',
    formula: '自費率 ＝ 自由診療収入 ÷ 総売上 × 100',
  },
  mom_comparison: {
    term: '前月比',
    description: '先月と比べた増減率です。プラスなら先月より改善、マイナスなら先月より悪化しています。',
    formula: '前月比 ＝ (今月値 － 先月値) ÷ 先月値 × 100',
  },
  yoy_comparison: {
    term: '前年同月比',
    description: '1年前の同じ月と比べた増減率です。季節変動の影響を除いた実力を測る指標です。',
    formula: '前年同月比 ＝ (今月値 － 前年同月値) ÷ 前年同月値 × 100',
  },
  health_score: {
    term: '経営健診スコア',
    description: '利益率・自費率・経費率・新患比率・成長率の5指標を総合したスコアです（最大500点）。データを継続的に入力するほど精度が上がります。',
  },
  ability_parameters: {
    term: '能力パラメーター',
    description: '経営の各側面（収益力・安定性・集患力・成長性・競争力）をレーダーチャートで可視化したものです。どの分野が強みで、どこに伸びしろがあるかが一目でわかります。',
  },
};
