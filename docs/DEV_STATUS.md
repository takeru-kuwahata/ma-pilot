# MA-Pilot 開発状況メモ（開発者向け）

最終更新：2026-05-27（夕）

---

## 現在の構成

| 項目 | 内容 |
|------|------|
| フロントエンド | Vercel（GitHub push で自動デプロイ） |
| バックエンド | Render.com 無料プラン（GitHub push → GitHub Actions → Deploy Hook で自動デプロイ） |
| DB / Auth | Supabase（PostgreSQL 15 + Auth + Storage） |
| フロントURL | https://ma-pilot.vercel.app |
| バックエンドURL | https://ma-pilot.onrender.com |

**注意：Render 無料プランは15分間アクセスがないとスリープする。初回リクエストに最大50秒かかる。**

---

## 実装済み機能（本番稼働中）

| カテゴリ | 内容 |
|---------|------|
| 認証 | ログイン・ログアウト・パスワードリセット・自己登録・パスワード変更 |
| 経営ダッシュボード | KPI表示・グラフ・コンサルティング診断・ゲーミフィケーション |
| 基礎データ管理 | 月次データ入力・CSV取込・院長メモ |
| 診療圏分析 | 地図・競合検索（Google Maps APIキーなし時はモックデータ） |
| 経営シミュレーション | 目標設定・逆算計算・戦略提案 |
| レポート生成 | PDF/CSV生成（WeasyPrint） |
| 医院設定 | 医院情報編集・スタッフ招待・権限管理・内覧会ステータス |
| 管理画面 | 医院一覧・有効化/無効化・パスワード変更・価格マスタCRUD |
| 印刷物受注 | 発注フォーム・履歴・見積もりPDF・添付ファイル |
| Lstep Webhook | 4フォームタイプ自動処理（MA-Pilot + WordPress + ウェルカムメール） |
| Stripe決済 | 枠組み実装済み（APIキー設定待ち） |
| コンサルティング | 月次データ診断→KPI・院長メモ連動・パートナー推薦カード |
| ゲーミフィケーション | ランク・スコア・レーダーチャート・パーセンタイル |
| メール送信 | Resend API（`RESEND_API_KEY` / `RESEND_FROM_EMAIL` 環境変数で設定） |

---

## 既知の問題・未解決事項

### 高優先度

| # | 内容 | 場所 |
|---|------|------|
| B-2 | Supabase Python SDK の `auth.admin.get_user_by_id()` が Render 環境で動作しないため、admin エンドポイントは httpx で直接 REST API を叩いている。原因未特定 | `backend/src/api/admin.py` |

### 中優先度

| # | 内容 | 場所 |
|---|------|------|
| M-1 | 診療圏分析の実データ未接続（e-Stat / RESAS API キーが未設定のためモックデータで動作中） | `MarketAnalysis.tsx` |
| M-2 | AdminSettings ページの設定保存がプレースホルダー実装（DBに保存されない） | `backend/src/api/admin.py` |
| M-3 | レポートPDF生成が実環境で動作するか未確認（WeasyPrint の Render 環境要確認） | `backend/src/api/reports.py` |

### 低優先度

| # | 内容 |
|---|------|
| L-1 | GitHub Actions の `VERCEL_TOKEN` 等が未設定（Vercel は GitHub App 連携で動いているため現状問題なし） |
| L-3 | Lstep Webhook エンドツーエンド動作確認未実施（実フォーム送信テストは未実施） |
| L-4 | 診療圏分析の青ピン → 自院ピン表示を廃止（座標精度問題）。サークル中心が自院位置を示す |
| M-3 | レポートPDF生成（ダウンロード）が本番で失敗する報告あり（2026-05-26 本多）。未調査 |

---

## 【棚上げ】診療圏分析の青ピン座標更新（2026-05-25）

### 状況
- ジオコーダーをCSIS（精度低）→ Google Maps Geocoding API に切り替え済み
- 切り替えに伴い、**フロントエンド（ClinicSettings）で住所保存時にブラウザからGeocoding APIを呼んで座標を取得し、バックエンドに送る**実装に変更済み
- コード自体は完成しているが、実際に座標が更新されることの動作確認が取れていない

### 未確認の原因候補
- `ClinicSettings.tsx` の `geocodeAddress()` 関数がGeocoding APIを呼んでいるが、レスポンスが正しく座標を返しているか未確認
- デバッグ用 `console.log('[geocode] ...')` を仕込んだコミット（`af3cfef`）があるので、ブラウザのF12コンソールで「保存する」を押したときのログを確認すれば原因が特定できる

### 確認手順（再開時）
1. ブラウザでF12→コンソールを開く
2. 医院設定（/clinic/kanda-ekisoba/settings）を開く
3. 「保存する」を押す
4. `[geocode] apiKey: SET/NOT SET` `[geocode] status: OK/...` のログを確認
5. statusがOKなら座標はDBに保存されているはず → `/api/admin/clinics` でlatitude/longitudeを確認

### 関連ファイル
- `frontend/src/pages/ClinicSettings.tsx` — `geocodeAddress()` 関数（L.130〜）
- `backend/src/services/clinic_service.py` — `update_clinic()` でlatitude/longitudeをそのまま保存

---

## クライアント対応待ち事項

| 内容 | 担当 |
|------|------|
| Stripe本番キー設定（`STRIPE_SECRET_KEY` / `VITE_STRIPE_PUBLIC_KEY`） | 理沙さん確認中 |
| コンサルティング診断ロジックの動作確認（Googleドキュメント送付済み 2026-04-30） | クライアント |
| DXヒアリングシート回答（送付済み） | クライアント |
| 価格マスタ修正23件・新規追加19件（管理画面から自身で対応可能） | クライアント |

---

## 本番環境テスト済みアカウント一覧

| 氏名 | メール | 初期PW |
|------|--------|--------|
| 桑畑健 | kuwahata@idw-japan.net | advance2026 |
| 本多裕樹 | honda_hiroki@medical-advance.com | advance2026 |
| 本多理沙 | honda_risa@medical-advance.com | advance2026 |
| 安堂由香 | ando_yuka@medical-advance.com | advance2026 |
| 松井 | matsui@medical-advance.com | advance2026 |
| 畑中 | hatanaka@medical-advance.com | advance2026 |
| 横田 | yokota@medical-advance.com | advance2026 |

---

## 主な変更履歴（直近）

| 日付 | 内容 |
|------|------|
| 2026-05-25 | フロントエンドサービステスト強化・Lstep Webhookユニットテスト実装（計+59テスト） |
| 2026-05-24 | 本番運用診断フェーズ3: テストカバレッジ改善（50スキップ→106パス） |
| 2026-05-24 | 本番運用診断フェーズ2: CSP修正・トランザクション補償実装・セキュリティヘッダー追加 |
| 2026-05-24 | 本番運用診断フェーズ1: セキュリティ・パフォーマンス・運用性の修正 |
| 2026-05-27 | メール送信をResend APIに切り替え（email_service.py全面改修） |
| 2026-05-20 | SMTPリレー切り替え（Xserver → Google Workspace、IPアドレス認証） |
| 2026-04-30 | コンサルティング・ゲーミフィケーション・パートナー推薦 本番デプロイ済み |
| 2026-04-30 | Stripe決済枠組み実装（APIキー設定で稼働可能） |
| 2026-04-16 | 価格マスタ管理画面CRUD実装（/admin/price-tables） |
| 2026-04-02 | Lstep Webhook連携デプロイ済み（POST /api/webhooks/lstep） |
| 2026-03-26 | クリニック自己登録・内覧会ステータス管理・パスワード変更機能 |
