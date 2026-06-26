# MA-Pilot 開発進捗状況

最終更新：2026-06-21

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
| Lstep Webhook連携 | ✅ | 4フォームタイプ対応・GAS経由 |
| コンサルティング診断 | ✅ | KPI・エンパワメントメッセージ連動 |
| ゲーミフィケーション | ✅ | ランク・レーダーチャート |
| パートナーサービス推薦 | ✅ | 課題タグ連携・カード高さ統一 |
| 用語解説モーダル | ✅ | 固定ラベルに?ボタン＋モーダル |
| Stripe決済（枠組み） | ⏸ | APIキー設定待ち |
| メール送信（Resend） | ✅ | Resend API経由 |

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

## 2026-06-19〜06-21 実施済み修正

| 内容 | 詳細 |
|------|------|
| Lステップ GAS連携 | 内覧会フォーム(710696)のGAS→MA-Pilot API連携を完成・テスト済み。残り2フォームの手順書・スクリプトをクライアントへ送付 |
| レーダーチャートラベル修正 | 「診療圏競争力」→「競争力」（幅の狭い画面での文字切れ解消） |
| 指標別スコアラベル統一 | レーダーチャート軸名とKPIスコアラベルを一致させ一貫性確保 |
| 優先度「低」バッジ変更 | 色: グレー→ブルー、ラベル: 「低」→「良好」 |
| スコア表示変更 | 分数（5/5）→5ドットインジケーター（9px円） |
| 月次レポートPDF改ページ | 収益内訳セクション前に意図的な改ページを追加 |
| バッジ余白追加 | MA推薦・シカレッジ特典ありChipのpadding調整（px:8px / py:3px） |
| パートナーカード高さ統一 | Grid item + Paper にflex設定で同行の高さを揃える |
| エンパワメントメッセージ | 解析カードの期待効果の下に優先度・カテゴリ連動の締め言葉を追加 |
| 用語解説モーダル | 専門用語（固定ラベルのみ）にオレンジ?ボタン＋モーダル解説を実装（glossary.ts・TermTooltip.tsx） |

## 2026-06-25〜06-26 実施済み修正

| 内容 | 詳細 |
|------|------|
| WordPress登録メール自動送信 | Lステップフォーム回答→WordPress自動登録時にログイン情報（URL・ユーザー名・初期パスワード）をメール自動送信するよう実装。全フォームタイプ（先生・スタッフ・勤務医・デンタルショー）共通で動作。背景: 従来はパスワードが誰にも見えない状態で手動LINEで対応していた |
| GASトリガー一時停止手順の確認 | クライアント（安堂さん）が自力で対応済み |

## 待ち事項

| 内容 | 担当 | 優先度 |
|------|------|--------|
| Stripeキー設定 | 理沙さん | 高 |
| Lstep GAS設定（残り2フォーム: 710762・710319） | クライアント | 高 |
| コンサルティング動作確認 | クライアント | 中 |
| DXヒアリングシート回答 | クライアント | 中 |
| 価格マスタ修正・追加（23件+19件） | クライアント | 低 |
