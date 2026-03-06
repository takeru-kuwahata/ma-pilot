# 外部APIキー取得TODO

## 📋 取得が必要なAPIキー

### 1. e-Stat API キー

**目的**: 人口統計データ取得（診療圏分析で使用）

**取得手順**:
1. https://www.e-stat.go.jp/api/ にアクセス
2. 「利用登録」をクリック
3. メールアドレスを登録
4. 届いたメールからAPIキーを取得

**料金**: 完全無料

**設定先**:
- ローカル環境: `backend/.env` に `E_STAT_API_KEY=取得したキー` を追加
- 本番環境: Render.com ダッシュボード → Environment Variables に追加

---

### 2. RESAS API キー

**目的**: 商圏データ・産業構造データ取得（診療圏分析で使用）

**取得手順**:
1. https://opendata.resas-portal.go.jp/ にアクセス
2. 「利用登録」をクリック
3. メールアドレスを登録
4. 届いたメールからAPIキーを取得

**料金**: 完全無料

**設定先**:
- ローカル環境: `backend/.env` に `RESAS_API_KEY=取得したキー` を追加
- 本番環境: Render.com ダッシュボード → Environment Variables に追加

---

## ✅ 設定完了後の確認

### ローカル環境

```bash
# backend/.env の確認
cat backend/.env | grep -E "(E_STAT|RESAS)"

# 出力例:
# E_STAT_API_KEY=your-e-stat-key
# RESAS_API_KEY=your-resas-key
```

### 本番環境（Render.com）

1. Render.com ダッシュボードにログイン
2. ma-pilot バックエンドサービスを選択
3. Environment タブを開く
4. 以下の環境変数が設定されていることを確認:
   - `E_STAT_API_KEY`
   - `RESAS_API_KEY`

---

## 🚀 設定後の動作

APIキーを設定すると、以下の機能が自動的に有効化されます：

1. **診療圏分析ページ**:
   - 実際の人口統計データが表示される（e-Stat API）
   - 商圏データが表示される（RESAS API）
   - モックデータから実データに自動切替

2. **データ精度**:
   - 現在: ランダム生成されたダミーデータ
   - 設定後: 政府統計に基づく正確なデータ

---

## 📝 注意事項

- APIキーは機密情報です。Gitにコミットしないでください（.gitignoreで保護済み）
- 無料枠のレート制限に注意してください
- テスト時は過度なAPI呼び出しを避けてください

---

**作成日**: 2026-02-26
**ステータス**: 未完了
