# MA-Pilot 開発進捗状況

最終更新：2026-07-21

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
| WordPress登録メール自動送信 | Lステップフォーム回答→WordPress自動登録時にログイン情報（URL・ユーザー名・初期パスワード）をメール自動送信するよう実装。全フォームタイプ共通。変更: `wordpress_service.py` / `lstep_service.py` / `email_service.py`（`send_wordpress_welcome_email`追加）|
| WordPress既存アカウント対応 | 同メールアドレスで再登録した場合（existing_user_emailエラー）にパスワードリセット案内メールを自動送信するよう実装。変更: `wordpress_service.py`（`_send_password_reset`追加）/ `lstep_service.py`（is_existing分岐）/ `email_service.py`（`send_wordpress_password_reset_email`追加）|
| GASトリガー不達の調査・対応 | フォーム回答がGASトリガー無効によりWebhook未到達だった事象を特定。手動Webhook送信でアカウント作成・メール送信を完了。運用注意: GASトリガーの有効/無効状態がメール未到達の主因になりうる |
| メール署名を統一 | 全メールの署名「メディカルアドバンス」→「株式会社メディカルアドバンス」に修正（email_service.py 全箇所） |

## 2026-07-01 実施済み

| 内容 | 詳細 |
|------|------|
| レポート生成403エラー修正 | Supabase clientのJWT汚染によるreports INSERT 403エラーを修正。`get_db_client()`（毎回新規作成）を新設し、全APIのDB依存を切り替え。auth用の`get_supabase_client()`は`auth.py`のみ継続使用 |
| Googleドキュメント整理 | Webhook連携セクションを最新状態に更新（710696完了済み・710762/710319御社対応待ちに整理）。GASトリガー注意事項・WordPress登録メール追加実装を追記。旧手順書の重複ブロックを削除。「WordPressの設定変更のお願い」タイトルを「WordPress設定」に改題し対応完了を明記 |
| 院長メモ閲覧権限の調査 | 現状: clinic_editor（スタッフ編集者）も閲覧・編集可能、clinic_viewerは不可。フロントに権限制御なし。クライアントにスタッフへの表示可否の判断を仰ぐ中 |

## 2026-07-07 実施済み

| 内容 | 詳細 |
|------|------|
| パートナー企業の課題タグ7種追加 | LINE経由の依頼。企業サービス登録時の課題タグに「人材育成・増患・収益増加・診療業務サポート・福利厚生・サービス代行・節税/助成金/保険」を追加（`PartnerManagement.tsx` の `PROBLEM_TAGS` 定数のみで管理、DB・バックエンドに制約なし）。本番でタグ選択可能なことをPlaywrightで確認済み。注意: 新タグは登録・分類用であり、ダッシュボードの自動レコメンド（`consulting_service.py` の提案タグ）には紐付いていない。レコメンドにも載せたい場合は追加対応が必要 |

## 2026-07-17〜07-21 実施済み修正（Lステップ自動発行トラブル対応）

| 内容 | 詳細 |
|------|------|
| doctor_openhouseフォームのMA-Pilot発行を停止（A案・確定） | 先生フォーム（内覧会 710696）は当面WordPressのみ発行する方針が確定（2026-07-17 安堂様確認・A案）。`lstep_service.py` の `process_webhook` からMA-Pilot発行分岐を除去し、結果判定を全フォーム共通（WordPress作成の成否）に統一。`_create_ma_pilot_account` は将来のB案復帰用に休眠コードとして残置（コメントで明示）。`test_lstep_webhook.py` を新仕様に更新（25件全パス）。本番Webhookで `ma_pilot_created:false` を実証確認済み。ブランチ `fix/openhouse-wordpress-only` → main デプロイ完了 |
| 先生フォームGASの `checkNewRows` エラー修正 | 先生フォーム（710696）のGASトリガーが存在しない関数 `checkNewRows` を時間主導型で呼び続け、7/6以降ずっと失敗（フォーム回答がWebhook未到達→登録メール不達）していた不具合を特定。正しいスクリプト（`docs/lstep-gas/lstep_gas_openhouse.js` = 関数 `onNewFormResponse`）に差し替え、トリガーを「変更時／onNewFormResponse」に再設定してもらい解消（安堂様操作）。テスト回答がWebhookへ正常到達することを確認済み |
| 取りこぼし7名の手動発行 | 7/6以降GAS不発でWebhook未到達だった7名（大山豪・森田周・石塚元規・森本太輔・赤羽仁・五味俊英［先生6名］＋森本由香里［スタッフ］）を本番Webhookへ手動送信し、WordPress新規発行＋ウェルカムメール送信成功をRenderログで確認済み。全員 `ma_pilot_created:false`（A案どおり） |
| 氷見先生のMA-Pilotアカウントの方針確定 | 原因B（二重発行）により誤発行された氷見先生のMA-Pilotアカウントは「そのまま残す」で確定（2026-07-21 安堂様判断）。すでにご本人へ案内メール到達済みのため削除しない。以降のMA-Pilot発行は停止済みでOK |
| 残2フォーム（710762・710319）の健全性確認 | 既存ドクター・スタッフの2フォームは `onNewFormResponse` が「完了」しており、`checkNewRows` エラーは710696のみで発生と確認。貼り替え不要 |

## 2026-07-10〜07-13 実施済み修正

| 内容 | 詳細 |
|------|------|
| Lステップ GASトリガー方式の恒久修正（doctor_other） | 「フォーム回答では発動せず手動実行のみ動く」不具合の根本原因を特定。LステップはGoogleフォームを介さずスプレッドシートへ直接書き込むため、GASの「フォーム送信時」トリガーが原理的に発火しないことが判明。トリガー種別を「変更時」に変更し、二重処理防止のためScript Propertiesで処理済み行を記録するガードを追加（`docs/lstep-gas/lstep_gas_doctor_other.js` 他2スクリプト・手順書も同様に修正済み）。クライアント（安堂様）へ手順書送付、適用・動作確認完了の返信済み |
| パートナー企業の編集・削除機能を追加 | 企業一覧に編集・削除ボタンが存在せず修正不可だった不具合を修正。削除APIを新規実装（配下のサービス・課題タグも連鎖削除）。本番でテストデータを用いて編集・削除動作を確認済み。変更: `backend/src/api/partners.py`（`DELETE /admin/companies/{id}`追加）/ `frontend/src/pages/admin/PartnerManagement.tsx` |
| サービス保存ボタンの誤動作を修正 | 課題タグを1つも選択していないと保存ボタンが常に無効化される不具合を修正（サービス名のみ必須に変更）。本番でタグなし保存が成功することを確認済み |
| WordPressメール未達の調査手法を確立 | Resend APIを直接叩いて送信ログ（`last_event: delivered`等）を取得する方法で、メール未達か受信側の見落としかを即座に切り分け可能に。今回は配送成功が確認され、受信側の見落としと判明 |

## 未回答の仕様確認（クライアント待ち）

| 内容 | 詳細 |
|------|------|
| 院長メモの閲覧権限 | スタッフ（clinic_editor）に見せる／見せないの判断をクライアントに確認中。見せない場合はフロントエンドの修正で対応可能 |

## 待ち事項

| 内容 | 担当 | 優先度 |
|------|------|--------|
| Stripeキー設定 | 理沙さん | 高 |
| 院長メモ閲覧権限の判断 | クライアント | 中 |
| コンサルティング動作確認 | クライアント | 中 |
| DXヒアリングシート回答 | クライアント | 中 |
| 価格マスタ修正・追加（23件+19件） | クライアント | 低 |
