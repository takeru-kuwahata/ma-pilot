# 価格マスタデータ投入手順

## 概要

印刷物受発注システムの「再注文」パターンで見積もり自動計算を有効にするため、価格マスタデータを投入します。

## 現状の問題

- 価格マスタテーブル (`price_tables`) が古いスキーマで作成されている
- サンプルデータが投入されていない
- 再注文パターンで商品を選択しても数量のドロップダウンが空

## 投入データ

`backend/seed_price_tables.sql` に以下の価格データが含まれています：

| 商品種類 | 数量オプション | 単価例 | デザイン料 |
|---------|---------------|--------|-----------|
| 診察券 | 500, 1000, 2000, 3000, 5000枚 | ¥19,500〜¥56,500 | 込み |
| 名刺 | 100, 200, 300枚 | ¥2,500〜¥6,000 | 別途¥4,500 |
| リコールハガキ | 100, 200, 300枚 | ¥7,500〜¥16,500 | 別途¥5,000 |
| A4三つ折りリーフレット | 300, 500, 1000枚 | ¥27,000〜¥50,000 | 込み |
| ネームプレート | 1, 5, 10名分 | ¥3,550〜¥14,000 | 別途¥850〜¥8,500 |

**合計**: 17レコード

## 投入手順

### 1. Supabaseにアクセス

https://supabase.com/dashboard

### 2. プロジェクトを選択

MA-Pilotのプロジェクトを選択

### 3. SQL Editorを開く

左メニュー → **SQL Editor** をクリック

### 4. SQLファイルの内容をコピー

`backend/seed_price_tables.sql` の全内容をコピー

### 5. SQL Editorに貼り付けて実行

1. 「New Query」ボタンをクリック
2. コピーしたSQLを貼り付け
3. 「Run」ボタン（または Cmd/Ctrl + Enter）をクリック

### 6. 実行結果を確認

以下のような出力が表示されれば成功：

```
商品種類ごとの数量オプション:
- 診察券: [500, 1000, 2000, 3000, 5000]
- 名刺: [100, 200, 300]
- リコールハガキ: [100, 200, 300]
- A4三つ折りリーフレット: [300, 500, 1000]
- ネームプレート: [1, 5, 10]
```

## 動作確認

### 1. 印刷物注文フォームにアクセス

https://ma-pilot.vercel.app/clinic/kanda-ekisoba/print-order

### 2. 再注文パターンを選択

「再注文（内容確定・見積もり自動計算）」を選択

### 3. 商品種類を選択

例: 「診察券」を選択

### 4. 数量ドロップダウンを確認

数量のドロップダウンに選択肢が表示されることを確認：
- 500
- 1,000
- 2,000
- 3,000
- 5,000

### 5. 数量を選択

例: 「1,000」を選択

### 6. 見積もり自動計算を確認

選択後、自動的に見積もり金額が表示されることを確認：
- **¥25,500** （診察券 1,000枚の場合）

## トラブルシューティング

### エラー: "relation price_tables already exists"

既存のテーブルをDROPできない場合は、SQL冒頭の `DROP TABLE IF EXISTS price_tables CASCADE;` を実行してから再度実行してください。

### エラー: "duplicate key value violates unique constraint"

データが既に投入されている場合は、以下のSQLで既存データを削除してから再実行：

```sql
TRUNCATE TABLE price_tables CASCADE;
```

### 数量ドロップダウンが空のまま

1. ブラウザのハードリロード（Cmd/Ctrl + Shift + R）
2. 開発者ツールのネットワークタブで `/api/price-tables` のレスポンスを確認
3. Supabase SQL Editorで以下を実行してデータを確認：

```sql
SELECT * FROM price_tables ORDER BY product_type, quantity;
```

## 価格データの編集

クライアントが価格を編集する場合は、以下の2つの方法があります：

### 方法1: Supabase Table Editorで直接編集

1. Supabase Dashboard → **Table Editor**
2. `price_tables` テーブルを選択
3. 各行をクリックして編集

### 方法2: SQLで一括更新

例: 診察券の価格を10%値上げ

```sql
UPDATE price_tables
SET price = price * 1.1
WHERE product_type = '診察券';
```

## 新商品の追加

```sql
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days)
VALUES
  ('新商品名', 100, 10000, 0, true, '{"key": "value"}'::jsonb, 14);
```

## 注意事項

- `product_type` と `quantity` の組み合わせは一意である必要があります（UNIQUE制約）
- `specifications` はJSONB型なので、JSON形式で記述する必要があります
- 価格は円単位の整数で記録します（¥25,500 → 25500）
- RLSが有効化されているため、system_adminのみが編集可能です

## 参考

- 価格マスタCSVファイル: `docs/price_table_sample.csv`
- バックエンドモデル: `backend/src/models/print_order.py`
- フロントエンドサービス: `frontend/src/services/printOrderService.ts`
