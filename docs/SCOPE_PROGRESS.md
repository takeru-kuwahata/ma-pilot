# MA-Pilot 開発進捗状況

最終更新：2026-08-24

---

## 本番環境ステータス

| 項目 | 状態 |
|------|------|
| フロントエンド（Vercel） | ✅ 正常稼働中 |
| バックエンド（Render） | ✅ 正常稼働中 |
| CI（GitHub Actions） | ✅ Test Suite グリーン（Backend 143件・Frontend 105件） |
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
| Backend（pytest） | 135件 | ✅ 全パス |
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

## 2026-08-06 実施済み修正（月次データの物販・変動費 構造修正）

| 内容 | 詳細 |
|------|------|
| 物販収入・変動費の専用DB列追加とデータ経路統一（PR #1） | 報告された4件の不具合（①物販の直接入力が反映されない ②CSV取込で物販・変動費が編集画面に出ない ③営業利益の計算誤り ④CSV出力の分かりづらさ）の根本原因が同一と特定。DBに物販・変動費の専用列がなく、旧4コスト列（personnel/material/fixed/other）を経路ごとに転用（手動保存: 変動費→personnel・物販→消失／CSV取込: 変動費→material・物販→other_cost=コスト扱い）していたため、営業利益で変動費が二重計上＋物販が減算されていた（例: 2026年6月 ¥-1,523,750 を数式で完全再現し実証）。`retail_revenue`・`variable_cost` 列を追加し、総売上=保険+自費+物販、営業利益=総売上−(変動費+固定費) に全経路（フォーム/CSV取込/CSVエクスポート/一覧/ダッシュボード/シミュレーション/PDFレポート）を統一。シミュレーション入力の人件費率・材料費率2レートも変動費率1本に統合（既存JSONBレコードも移行）。既存14行の移行を本番DBで実行・実データ検証済み（migration: `backend/migrations/20260806_retail_revenue_variable_cost.sql`）。CSVエクスポートに総売上・営業利益列を追加し、エクスポートCSVをそのまま再取込できるようヘッダー互換も確保。テスト: Backend 135件・Frontend 94件 全パス |
| 旧コスト列の削除完了（2026-08-07確認） | 新コードの本番デプロイ・旧列参照ゼロ（コード全域grep 0件）を確認後、本番DBから旧3列（personnel_cost/material_cost/other_cost）を削除（migration: `backend/migrations/20260806_drop_legacy_cost_columns.sql`）。削除後の列構成をinformation_schemaで確認済み（retail_revenue/variable_cost あり・旧3列なし）。削除後に本番実機確認済み（ログイン→ダッシュボード→基礎データ管理一覧→編集ダイアログで物販¥50,000・変動費¥300,000の読込と総売上¥4,350,000の自動計算一致を確認）。旧列データのバックアップは `docs_archive/backup_legacy_cost_columns_20260806.json` に保管。クライアント向けGoogleドキュメント（動作確認チェックリスト）の該当4項目にも修正完了を追記・報告済み（2026-08-07） |

## 2026-08-17 実施済み対応（Supabase自動一時停止によるログイン不能）

| 内容 | 詳細 |
|------|------|
| 本番ログイン不能の復旧（当日解決） | クライアント報告「メール・パスワードを入れても入力画面に戻る」。原因はSupabase無料プランの「7日間無アクセスで自動一時停止」（最終利用8/7→8/17で発動）。バックエンド `/api/auth/login` が401（SupabaseホストNXDOMAIN）になることを再現確認後、Supabase Management APIでプロジェクト（ma-cs）をrestore。約3分半でACTIVE_HEALTHY復旧、本番ログインAPI 200を実証確認。データ消失なし |
| 再発防止: keepaliveワークフロー追加（PR #2） | `.github/workflows/supabase-keepalive.yml` を追加。毎日6:00 JSTにSupabase REST APIへ1クエリ投げて停止条件を回避。非200ならワークフロー失敗（GitHubの失敗通知メールで検知）。公開リポの「60日間コミットなしでスケジュール無効化」対策として、実行毎に自身をre-enableするステップも同梱。merge後にworkflow_dispatchで本実行success確認済み |

## 2026-08-24 実施済み（経営シミュレーションの推移予測グラフ実装）

**クライアント報告**: クリニックモードの経営シミュレーション画面「推移予測グラフ（準備中）」はいつ外れるか、提示すべき項目があれば教えてほしい。

- **確認したこと**: 準備中は実装漏れではなく仕様未定のまま枠だけ置かれていた状態。既存シミュレーションは「目標達成時点の1点」を計算する仕組みで月次の時間軸を持っていなかった
- **クライアントへ4項目（表示期間／増減率の効き方／表示項目／過去実績との接続）を提示し、標準案で承認をもらって実装**（2026-08-24 安堂さん承認・期日9月中旬）
- **標準案**: 12ヶ月先まで表示／設定値へ線形に近づく／売上・利益・患者数の3項目／過去12ヶ月の実績とグラフをつなげて表示
- **実装方式**: 画面表示のみ（フロント完結、DB保存なし。画面を開くたびに再計算）。バックエンド・DB変更なし
- `frontend/src/utils/simulationForecast.ts` に純粋関数3つを新規実装（buildActualPoints / buildForecastPoints / buildChartRows）。`Simulation.tsx` は recharts の LineChart で実績（実線）と予測（破線）を1本の連続した線として描画。既存の Dashboard.tsx のグラフ実装パターンを踏襲し新規ライブラリ導入なし
- **テスト**: 純粋関数のユニットテスト11件新規（Frontend 94件→105件）
- **動作確認**: Playwright が本セッションで接続できず目視確認は未実施。代わりに検証用医院（検証用ダミー歯科_DO_NOT_USE）に本番相当の月次実績12ヶ月分を一時投入し、実データで結合確認（実績→予測の接続・月の並び・NaN混入なしを実証）。確認後、投入データは全て削除し検証前の0件状態に復元済み
- PR #5（squash merge → main → Vercel自動デプロイ済み、本番反映確認済み）
- **今後**: デプロイ後、クライアントの実医院データを使った目視確認を推奨（Playwright接続復旧後、または手動）

---

## 2026-08-24 実施済み修正（パートナー企業サービスの編集が保存できない不具合）

**クライアント報告**: 運営者モードのパートナー企業登録で、登録したサービスを編集しようとしても「保存に失敗しました」となる。

- **原因**: 企業一覧API `GET /api/partners/admin/companies` の select 句が `partner_services(id, service_name, price_range, display_priority, is_active, ...)` と列を限定しており、編集ダイアログに `company_id` が渡っていなかった。`PartnerServiceCreate` で必須のため `HTTP 422 Field required: company_id` で弾かれていた（本番APIで実証）。新規追加は正しいIDを渡すため発生せず、編集時のみ失敗していた
- **併発していた問題**（同時修正）:
  - 同 select 句は `catchcopy` / `description` / `service_url` / `coupon_code` / `coupon_detail` / `apply_method` も返しておらず、**保存可能になった途端に編集ダイアログが空欄でこれらを上書き消去する**状態だった（`company_id` のみの修正では新規事故になるため同時対応が必須）
  - 企業ダイアログの有効/無効スイッチが `PartnerCompanyCreate` に `is_active` を持たず、以前から**一切保存されていなかった**（Pydantic が未知キーとして破棄）
  - `coupon_detail` / `logo_url` は保存対象なのに入力欄が無く、保存のたび null 上書きされる状態だった（本番は全件空のため実害なし）→ 入力欄を追加
  - `res.data[0]` が対象不在時に IndexError → 500。404 を返すよう修正。サービス更新は課題タグの洗い替え**前**に判定し、タグのみ消失を防止
  - 保存失敗が一律「保存に失敗しました」で原因不明だった → サーバーの理由を表示（潔癖性）
- **修正**: select 句を `partner_services(*, service_problem_tags(problem_tag))` に変更（列追加時も自動追従）。フロントの payload は API 受け取り項目のみ明示構築
- **テスト**: `backend/tests/test_partners.py` を新規作成（8件）。パートナー機能はこれまでテストが存在せず、それが本件を本番まで見逃した原因。**修正前のコードでは5件が失敗することを確認**（トートロジーでないことの実証）
- **本番実機確認済み**（2026-08-24）: サービス編集の保存 HTTP 200 / 企業編集の保存 HTTP 200 / 有効・無効スイッチが実際に保存されることを false→true の往復で確認 / **検証前後で企業52社・サービス9件の全データが完全一致（消失・改変なし）**
- PR #3（squash merge → main → Render/Vercel 自動デプロイ済み）

---

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
| Stripeキー設定 | 設定済みとの報告あり（2026-08-06）・決済フローの本番動作確認は未実施 | 中 |
| 院長メモ閲覧権限の判断 | クライアント | 中 |
| コンサルティング動作確認 | クライアント | 中 |
| DXヒアリングシート回答 | クライアント | 中 |
| 価格マスタ修正・追加（23件+19件） | クライアント | 低 |
