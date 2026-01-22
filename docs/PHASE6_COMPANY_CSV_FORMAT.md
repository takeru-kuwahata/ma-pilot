# Phase 6: ヒアリングシート機能 - 企業マスタCSVフォーマット定義書

**作成日**: 2025-12-26
**バージョン**: 1.0
**対象**: 企業マスタ一括登録用CSVファイル

---

## 1. CSVファイル仕様

### 1.1 基本仕様

| 項目 | 仕様 |
|------|------|
| 文字コード | UTF-8 BOM付き（Excel互換） |
| 改行コード | CRLF（Windows）またはLF（Mac/Linux） |
| 区切り文字 | カンマ（,） |
| クォート | ダブルクォート（"）、カンマ・改行を含む場合は必須 |
| 最大行数 | 1,000行（ヘッダー除く） |
| 最大ファイルサイズ | 1MB |

### 1.2 ヘッダー行

**必須**: 1行目にヘッダー行を含める

**ヘッダー行の内容**:
```csv
name,category,service_description,contact_email,website_url,tags,is_active
```

---

## 2. カラム定義

### 2.1 カラム一覧

| No | カラム名 | 型 | 必須 | 最大長 | 説明 |
|----|---------|-----|------|--------|------|
| 1 | name | String | ○ | 255 | 企業名 |
| 2 | category | String | ○ | 100 | カテゴリ |
| 3 | service_description | String | - | - | サービス説明 |
| 4 | contact_email | String | - | 255 | 連絡先メールアドレス |
| 5 | website_url | String | - | 500 | WebサイトURL |
| 6 | tags | String | - | - | タグ（カンマ区切り） |
| 7 | is_active | Boolean | ○ | - | 有効フラグ（true/false） |

### 2.2 各カラムの詳細

#### 2.2.1 name（企業名）

- **型**: String
- **必須**: ○
- **最大長**: 255文字
- **バリデーション**:
  - 空文字不可
  - 重複チェック（同名企業が既に存在する場合はエラー）
- **例**:
  - `デンタルハッピー`
  - `歯科求人ナビ`

#### 2.2.2 category（カテゴリ）

- **型**: String
- **必須**: ○
- **最大長**: 100文字
- **バリデーション**:
  - 空文字不可
  - 推奨カテゴリ（下記参照）
- **推奨カテゴリ**:
  - `スタッフ採用`
  - `Webマーケティング`
  - `SNS運用`
  - `診療効率化`
  - `設備導入`
  - `会計・税務`
  - `研修・セミナー`
  - `その他`
- **例**:
  - `スタッフ採用`
  - `Webマーケティング`

#### 2.2.3 service_description（サービス説明）

- **型**: String
- **必須**: -
- **最大長**: 制限なし（推奨: 500文字以内）
- **バリデーション**:
  - 空文字OK（NULLとして扱う）
- **例**:
  - `歯科医院特化の求人広告サービス。成果報酬型で応募が来るまで無料。`
  - `SNS運用代行・コンサルティング。Instagram、X（旧Twitter）に対応。`

#### 2.2.4 contact_email（連絡先メールアドレス）

- **型**: String
- **必須**: -
- **最大長**: 255文字
- **バリデーション**:
  - 空文字OK（NULLとして扱う）
  - メール形式チェック（RFC 5322準拠）
- **例**:
  - `contact@dental-happy.co.jp`
  - `info@sns-dental.com`

#### 2.2.5 website_url（WebサイトURL）

- **型**: String
- **必須**: -
- **最大長**: 500文字
- **バリデーション**:
  - 空文字OK（NULLとして扱う）
  - URL形式チェック（http:// または https:// で始まる）
  - https://推奨
- **例**:
  - `https://dental-happy.co.jp`
  - `https://sns-dental.com`

#### 2.2.6 tags（タグ）

- **型**: String（カンマ区切り）
- **必須**: -
- **最大長**: 制限なし（推奨: 10タグ以内）
- **バリデーション**:
  - 空文字OK（NULLまたは空配列として扱う）
  - カンマ区切りで複数タグ指定可能
  - 各タグの前後の空白は自動削除
- **例**:
  - `求人広告,歯科特化,成果報酬型`
  - `SNS,Instagram,運用代行`
  - `設備,ユニット,分割払い`

#### 2.2.7 is_active（有効フラグ）

- **型**: Boolean
- **必須**: ○
- **許容値**: `true`, `false`, `1`, `0`, `TRUE`, `FALSE`（大文字小文字区別なし）
- **バリデーション**:
  - 空文字不可
  - true/false以外はエラー
- **例**:
  - `true`
  - `false`

---

## 3. サンプルCSV

### 3.1 基本サンプル

```csv
name,category,service_description,contact_email,website_url,tags,is_active
デンタルハッピー,スタッフ採用,歯科医院特化の求人広告サービス。成果報酬型で応募が来るまで無料。,contact@dental-happy.co.jp,https://dental-happy.co.jp,"求人広告,歯科特化,成果報酬型",true
SNSデンタル,SNS運用,SNS運用代行・コンサルティング。Instagram、X（旧Twitter）に対応。,info@sns-dental.com,https://sns-dental.com,"SNS,Instagram,運用代行",true
デンタルマーケ,Webマーケティング,歯科医院向けWebマーケティング支援。SEO、MEO、リスティング広告に対応。,support@dental-marke.jp,https://dental-marke.jp,"SEO,MEO,リスティング広告",true
```

### 3.2 タグなしサンプル

```csv
name,category,service_description,contact_email,website_url,tags,is_active
税理士法人ABC,会計・税務,歯科医院特化の税務・会計サポート。,info@abc-tax.jp,https://abc-tax.jp,,true
```

### 3.3 サービス説明が長いサンプル

```csv
name,category,service_description,contact_email,website_url,tags,is_active
ユニット販売株式会社,設備導入,"歯科ユニットの販売・メンテナンス。国内外の主要メーカーを取り扱い、分割払い・リースにも対応。最短1週間で納品可能。",sales@unit-dental.co.jp,https://unit-dental.co.jp,"設備,ユニット,分割払い,リース",true
```

---

## 4. バリデーションルール

### 4.1 必須チェック

| カラム | 必須 | エラーメッセージ |
|--------|------|----------------|
| name | ○ | 「企業名は必須です」 |
| category | ○ | 「カテゴリは必須です」 |
| is_active | ○ | 「有効フラグは必須です」 |

### 4.2 フォーマットチェック

| カラム | チェック内容 | エラーメッセージ |
|--------|------------|----------------|
| contact_email | メール形式 | 「連絡先メールアドレスの形式が不正です」 |
| website_url | URL形式（http/https） | 「WebサイトURLの形式が不正です」 |
| is_active | true/false/1/0 | 「有効フラグはtrue/falseで指定してください」 |

### 4.3 重複チェック

| カラム | チェック内容 | エラーメッセージ |
|--------|------------|----------------|
| name | 既存企業との重複 | 「同名の企業が既に存在します」 |

### 4.4 文字数チェック

| カラム | 最大長 | エラーメッセージ |
|--------|--------|----------------|
| name | 255文字 | 「企業名は255文字以内で指定してください」 |
| category | 100文字 | 「カテゴリは100文字以内で指定してください」 |
| contact_email | 255文字 | 「連絡先メールアドレスは255文字以内で指定してください」 |
| website_url | 500文字 | 「WebサイトURLは500文字以内で指定してください」 |

---

## 5. エラーハンドリング

### 5.1 エラー時の挙動

**方針**: エラー行はスキップ、成功行のみInsert/Update

**エラーレスポンス**:
```json
{
  "data": {
    "success": 48,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "error": "企業名は必須です"
      },
      {
        "row": 15,
        "error": "同名の企業が既に存在します"
      }
    ]
  },
  "message": "CSV一括読込が完了しました（成功: 48件、失敗: 2件）"
}
```

### 5.2 部分的成功の扱い

- **成功件数 > 0**: HTTPステータス200（一部成功）
- **成功件数 = 0**: HTTPステータス400（全件失敗）

---

## 6. CSV作成ガイド

### 6.1 Excelでの作成手順

1. Excelを開く
2. A1セルから以下のヘッダーを入力:
   ```
   name | category | service_description | contact_email | website_url | tags | is_active
   ```
3. A2セル以降にデータを入力
4. **ファイル → 名前を付けて保存 → CSV UTF-8（カンマ区切り）** を選択
5. ファイル名を入力して保存

### 6.2 注意事項

**カンマ・改行を含む場合**:
- セル内にカンマや改行がある場合、自動的にダブルクォートで囲まれます
- 手動でダブルクォートを入力する必要はありません

**tagsカラムの入力方法**:
- Excel上では通常通り入力（例: `求人広告,歯科特化,成果報酬型`）
- CSV保存時に自動的にクォート処理されます

**is_activeカラムの入力方法**:
- Excel上では `TRUE` または `FALSE` を入力
- CSV保存時に自動的に小文字化されます

---

## 7. 初期データサンプル（50件）

**提供方法**: `docs/company_master_sample.csv`（別ファイル）

**内容**:
- スタッフ採用: 15社
- Webマーケティング: 10社
- SNS運用: 8社
- 診療効率化: 7社
- 設備導入: 5社
- 会計・税務: 3社
- 研修・セミナー: 2社

**ファイルパス**: `/Users/kuwahatatakeru/医療DW Dropbox/21_AI/MA-Lstep/docs/company_master_sample.csv`

---

## 8. 一括読込API仕様（再掲）

**エンドポイント**: `POST /api/companies/import-csv`

**権限**: `system_admin`

**リクエスト（multipart/form-data）**:
- `file`: CSV file

**レスポンス**:
```json
{
  "data": {
    "success": 50,
    "failed": 0,
    "errors": []
  },
  "message": "CSV一括読込が完了しました（成功: 50件、失敗: 0件）"
}
```

---

## 9. CSV更新フロー

### 9.1 新規企業追加

1. 既存CSVを取得（または新規作成）
2. 新規行を追加
3. CSV一括読込APIでアップロード

### 9.2 既存企業の更新

**方針**: 同名企業が存在する場合はエラー（更新ではなく個別にPUT APIを使用）

**理由**: 一括更新は誤操作のリスクが高いため、個別更新を推奨

---

## 10. テンプレートファイル

**提供ファイル**: `docs/company_master_template.csv`

**内容**:
```csv
name,category,service_description,contact_email,website_url,tags,is_active
サンプル企業,スタッフ採用,サンプル説明,sample@example.com,https://example.com,"タグ1,タグ2",true
```

**使用方法**:
1. テンプレートファイルをダウンロード
2. サンプル行を削除
3. 実際のデータを入力
4. CSV一括読込APIでアップロード

---

**作成者**: Claude Code
**最終更新日**: 2025-12-26
