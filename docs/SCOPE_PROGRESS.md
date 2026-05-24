# MA-Pilot 開発進捗状況

最終更新：2026-05-25

---

## 本番環境ステータス

| 項目 | 状態 |
|------|------|
| フロントエンド（Vercel） | ✅ 正常稼働中 |
| バックエンド（Render） | ✅ 正常稼働中 |
| CI（GitHub Actions） | ✅ Test Suite グリーン（Backend 132件・Frontend 94件） |
| Supabase | ✅ 正常稼働中 |

---

## 実装済み全機能一覧

### コアシステム（全完了）

| 機能 | ルート | 状態 |
|------|--------|------|
| ログイン・認証 | `/login` | ✅ |
| 経営ダッシュボード | `/dashboard` | ✅ |
| 基礎データ管理（月次） | `/data` | ✅ |
| 診療圏分析 | `/market-analysis` | ✅ |
| 経営シミュレーション | `/simulation` | ✅ |
| レポート生成・管理 | `/reports` | ✅ |
| 医院設定・スタッフ管理 | `/settings` | ✅ |

### 管理者画面（全完了）

| 機能 | ルート | 状態 |
|------|--------|------|
| 管理ダッシュボード | `/admin/dashboard` | ✅ |
| 医院アカウント管理 | `/admin/clinics` | ✅ |
| 価格マスタ管理 | `/admin/price-tables` | ✅ |
| システム設定（一部プレースホルダー） | `/admin/settings` | ⚠️ |

### 拡張機能（全完了）

| 機能 | 状態 | 備考 |
|------|------|------|
| 印刷物受注システム | ✅ | 発注・履歴・PDF |
| Lstep Webhook連携 | ✅ | 4フォームタイプ対応 |
| コンサルティング診断 | ✅ | KPI・院長メモ連動 |
| ゲーミフィケーション | ✅ | ランク・レーダーチャート |
| パートナーサービス推薦 | ✅ | 課題タグ連携 |
| Stripe決済（枠組み） | ⏸ | APIキー設定待ち |
| メール送信（SMTP） | ✅ | Google Workspace IPアドレス認証 |

---

## APIエンドポイント（実装済み）

| ルーター | エンドポイント数 |
|---------|---------------|
| auth | 5（login/logout/register/reset-password/change-password） |
| clinics | 3（get/update/list） |
| monthly_data | 5（CRUD + list） |
| dashboard | 1 |
| simulations | 3（CRUD） |
| reports | 4（generate/list/get/download） |
| market_analysis | 2（get/create） |
| staff | 4（list/get/invite/delete） |
| admin | 9（clinics CRUD + openhouse + password + import） |
| print_orders | 6（CRUD + approve + attachment） |
| price_tables | 2（list/CRUD） |
| webhooks | 1（lstep） |
| stripe_payments | 2（payment-intent/confirm） |
| consulting | 2（diagnosis/partners） |
| gamification | 1（score） |
| my | 2（profile/update） |

**合計: 52エンドポイント**

---

## テスト状況

| 対象 | テスト数 | 状態 |
|------|---------|------|
| Backend（pytest） | 132件 | ✅ 全パス |
| Frontend（vitest） | 94件（22ファイル） | ✅ 全パス |

### Backendカバレッジ（サービス層）
- auth, clinics, dashboard, monthly_data, simulations, reports, market_analysis, staff, admin, lstep_webhook

### Frontend カバレッジ
- hooks: useAuth
- services: authService, clinicService, printOrderService
- components: RevenueChart, KPICard, MonthlyDataForm
- utils: formatters, focusManagement, announcer, mockData
- pages: 11ページ（スモークテスト）

---

## 本番運用診断結果（2026-05-24実施）

**診断スコア**: 69/100 → 改善作業実施済み

### 実施済み改善

| フェーズ | 内容 |
|---------|------|
| フェーズ1 | セキュリティヘッダー強化・print文/console.log除去・N+1問題修正・CORS制限 |
| フェーズ2 | CSP修正・トランザクション補償実装・グローバルエラーハンドラー追加 |
| フェーズ3 | テストカバレッジ改善（50スキップ→132パス）・Lstep Webhookテスト実装 |

### 未実施（低優先度）

| 内容 | 理由 |
|------|------|
| JWTをHttpOnly Cookieへ移行 | 既存ユーザーへの影響大・要調整 |
| /metricsエンドポイント | 現フェーズでは不要 |
| Redisキャッシュ導入 | 現規模では不要 |

---

## 待ち事項

| 内容 | 担当 | 優先度 |
|------|------|--------|
| Stripeキー設定 | 理沙さん | 高 |
| コンサルティング動作確認 | クライアント | 中 |
| DXヒアリングシート回答 | クライアント | 中 |
| 価格マスタ修正・追加（23件+19件） | クライアント | 低 |
| Lstep Webhook E2E確認（実フォーム送信） | 任意 | 低 |
