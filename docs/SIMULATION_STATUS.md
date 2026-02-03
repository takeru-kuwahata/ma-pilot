# 経営シミュレーションページ実装状況

**最終更新**: 2026-02-04

## 📊 実装状況サマリー

| 機能 | UI | バックエンド | 実装状態 |
|------|----|-----------|------------|
| ページ表示 | ✅ | ✅ | 完了 |
| 条件入力フォーム | ✅ | - | 完了 |
| シミュレーション実行 | ⚠️ | ✅ | **不具合あり** |
| 結果表示 | ✅ | ✅ | 完了 |
| 推移予測グラフ | ❌ | - | **未実装** |

---

## 🐛 問題1: シミュレーション実行ボタンが動作しない

### 現象
- 「シミュレーション実行」ボタンをクリックしても何も起きない
- 結果カードが表示されない
- エラーメッセージも表示されない

### 原因

#### 原因1: 入力パラメータとAPIの型不一致

**フロントエンド入力パラメータ（Simulation.tsx:44-53）**:
```typescript
interface SimulationParams {
  period: string;                    // シミュレーション期間
  insuranceRevenueChange: number;    // 保険診療収入の変動 (%)
  selfPayRevenueChange: number;      // 自費診療収入の変動 (%)
  retailRevenueChange: number;       // 物販収入の変動 (%)
  variableCostChange: number;        // 変動費の変動 (%)
  fixedCostChange: number;           // 固定費の変動 (%)
  newPatientChange: number;          // 新患数の変動 (%)
  returningPatientChange: number;    // 再診患者数の変動 (%)
}
```

**バックエンドAPIが期待するパラメータ（simulation.py:6-13）**:
```python
class SimulationInput(BaseModel):
    target_revenue: float                      # 目標売上
    target_profit: float                       # 目標利益
    assumed_average_revenue_per_patient: float # 患者単価
    assumed_personnel_cost_rate: float         # 人件費率
    assumed_material_cost_rate: float          # 材料費率
    assumed_fixed_cost: float                  # 固定費
```

**完全に型が異なる**: フロントエンドは「変動率ベース」、バックエンドは「目標値・前提条件ベース」

#### 原因2: 固定値を送信している（Simulation.tsx:88-99）

```typescript
const simulation = await simulationService.createSimulation(
  user.clinicId,
  `${params.period}ヶ月後のシミュレーション`,
  {
    targetRevenue: 0,  // ← 全て0で固定
    targetProfit: 0,
    assumedAverageRevenuePerPatient: 0,
    assumedPersonnelCostRate: 0,
    assumedMaterialCostRate: 0,
    assumedFixedCost: 0
  }
);
```

**入力した値（params）が全く使われていない**

#### 原因3: エラーハンドリングが不十分

```typescript
try {
  // ... API呼び出し
} catch (error) {
  console.error('Failed to create simulation:', error);
  // ユーザーへのエラー表示なし
}
```

**エラーが起きても何も表示されない**

---

## 🐛 問題2: 推移予測グラフが未実装

### 現状（Simulation.tsx:682-720）

```typescript
<Box sx={{ ... }}>
  <ShowChartIcon sx={{ fontSize: '48px', color: '#9e9e9e' }} />
  <Typography sx={{ fontSize: '16px', color: '#616161' }}>
    Rechartsでグラフ表示（Phase 4で実装）
  </Typography>
</Box>
```

**プレースホルダー表示のみ**: Rechartsグラフ未実装

### 必要な実装
1. シミュレーション結果から月次推移データ生成
2. Recharts LineChartで売上・利益推移を表示
3. 現状値 vs シミュレーション値の比較グラフ

---

## 🎨 問題3: UIの使いにくさ（%入力）

### 現状
```typescript
<TextField
  type="number"
  value={params.selfPayRevenueChange}
  onChange={(e) => handleParamChange('selfPayRevenueChange', Number(e.target.value))}
  placeholder="例: +20 または -10"
/>
```

**問題点**:
- `type="number"` で1%刻みの入力
- スピナーボタン（▲▼）で1%ずつしか変えられない
- 15%入力するのに15回クリックが必要

### 改善案

#### オプション1: スライダー + 数値入力（推奨）
```typescript
<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
  <Slider
    value={params.selfPayRevenueChange}
    onChange={(e, value) => handleParamChange('selfPayRevenueChange', value)}
    min={-50}
    max={50}
    step={5}
    marks
    valueLabelDisplay="auto"
    sx={{ flex: 1 }}
  />
  <TextField
    type="number"
    value={params.selfPayRevenueChange}
    onChange={(e) => handleParamChange('selfPayRevenueChange', Number(e.target.value))}
    sx={{ width: 100 }}
    InputProps={{ endAdornment: '%' }}
  />
</Box>
```

**メリット**: 視覚的に分かりやすく、素早く調整可能

#### オプション2: ステップボタン
```typescript
<Box sx={{ display: 'flex', gap: 1 }}>
  <Button onClick={() => handleParamChange('selfPayRevenueChange', params.selfPayRevenueChange - 5)}>-5%</Button>
  <TextField type="number" value={params.selfPayRevenueChange} />
  <Button onClick={() => handleParamChange('selfPayRevenueChange', params.selfPayRevenueChange + 5)}>+5%</Button>
</Box>
```

#### オプション3: 5%刻みのstep属性
```typescript
<TextField
  type="number"
  inputProps={{ step: 5, min: -50, max: 50 }}
  value={params.selfPayRevenueChange}
  onChange={(e) => handleParamChange('selfPayRevenueChange', Number(e.target.value))}
/>
```

**最小限の修正**: step属性を追加するだけ

---

## 🔧 修正方針

### 🔴 優先度: 高（クライアントテスト前に必要）

#### 修正1: シミュレーション実行機能の修正（必須）
**工数**: 1-2日

**ステップ1: 設計の見直し**
- フロントエンド入力（変動率ベース）とバックエンドAPI（目標値ベース）のギャップを解消
- オプションA: フロントエンドで変動率→目標値に変換して送信
- オプションB: バックエンドAPIを変動率ベースに変更（破壊的変更）

**ステップ2: 現在の月次データ取得**
- 最新の月次データを取得（総売上、営業利益、患者数等）
- 変動率を適用して目標値を計算

**ステップ3: API呼び出し修正**
- 計算した目標値をAPIに送信
- エラーハンドリング追加（Toast通知）

**ステップ4: 結果表示**
- シミュレーション結果を表示
- 変動額の計算（現状値との差分）

#### 修正2: UIの改善（推奨）
**工数**: 0.5日

- **最小限**: `step: 5` 属性を追加
- **推奨**: MUI Sliderを追加（視覚的に分かりやすい）

### 🟡 優先度: 中（運用開始後）

#### 修正3: 推移予測グラフ実装
**工数**: 1-2日

1. シミュレーション結果から月次推移データ生成
2. Recharts LineChartで表示
3. 現状値 vs シミュレーション値の比較

---

## 📝 クライアント向け説明

### 現状
「経営シミュレーションページは表示されますが、以下の問題があります：

1. **シミュレーション実行ボタンが動作しない**
   - フロントエンドとバックエンドのAPI仕様が不一致
   - 修正が必要

2. **推移予測グラフが未実装**
   - プレースホルダー表示のみ
   - 運用開始後に実装予定

3. **%入力が使いにくい**
   - スライダーUIへの改善を推奨

### クライアントのタスク
- **なし**（開発者側の実装不具合）

### 開発者のタスク
1. シミュレーション実行機能の修正（1-2日）
2. UIの改善（0.5日）
3. 推移予測グラフ実装（運用開始後、1-2日）

---

## 検証結果（チェックリスト 3.4）

| # | 項目 | 手順 | 期待結果 | 結果 | 備考 |
|---|------|------|----------|------|------|
| 3.4.1 | ページ表示 | 左メニュー「経営シミュレーション」クリック | ページが表示される | [✅] | UI完成 |
| 3.4.2 | 条件設定 | 各フィールドに値を入力 | 入力できる | [✅] | 入力可能 |
| 3.4.3 | シミュレーション実行 | 「シミュレーション実行」ボタンクリック | 結果が表示される | [❌] | **動作しない** |
| 3.4.4 | 推移予測グラフ表示 | 結果表示後、グラフ確認 | グラフが表示される | [❌] | **未実装** |

**結論**: ページUIは完成しているが、シミュレーション実行ロジックに不具合あり。クライアントテスト前に修正必須。
