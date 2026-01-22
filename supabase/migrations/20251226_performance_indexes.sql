-- ==========================================
-- パフォーマンス最適化のためのインデックス
-- 作成日: 2025-12-26
-- ==========================================

-- ==========================================
-- 1. clinicsテーブル
-- ==========================================

-- 医院IDでの検索（主キー）は自動でインデックスあり
-- 医院名での検索用インデックス
CREATE INDEX IF NOT EXISTS idx_clinics_name ON clinics(name);

-- ステータスでの絞り込み用（アクティブな医院のみ取得など）
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(is_active);

-- 作成日時でのソート用
CREATE INDEX IF NOT EXISTS idx_clinics_created_at ON clinics(created_at DESC);

-- ==========================================
-- 2. monthly_dataテーブル
-- ==========================================

-- 医院ID + 年月での検索（最も頻繁なクエリ）
CREATE INDEX IF NOT EXISTS idx_monthly_data_clinic_year_month
ON monthly_data(clinic_id, year_month);

-- 医院IDでの検索
CREATE INDEX IF NOT EXISTS idx_monthly_data_clinic_id ON monthly_data(clinic_id);

-- 年月でのソート用
CREATE INDEX IF NOT EXISTS idx_monthly_data_year_month ON monthly_data(year_month DESC);

-- 作成日時でのソート用
CREATE INDEX IF NOT EXISTS idx_monthly_data_created_at ON monthly_data(created_at DESC);

-- ==========================================
-- 3. simulationsテーブル
-- ==========================================

-- 医院ID + 作成日時での検索（最近のシミュレーション取得）
CREATE INDEX IF NOT EXISTS idx_simulations_clinic_created
ON simulations(clinic_id, created_at DESC);

-- 医院IDでの検索
CREATE INDEX IF NOT EXISTS idx_simulations_clinic_id ON simulations(clinic_id);

-- シミュレーション名での検索（LIKE検索対応）
CREATE INDEX IF NOT EXISTS idx_simulations_name ON simulations(name);

-- ==========================================
-- 4. reportsテーブル
-- ==========================================

-- 医院ID + 作成日時での検索（最近のレポート取得）
CREATE INDEX IF NOT EXISTS idx_reports_clinic_created
ON reports(clinic_id, created_at DESC);

-- 医院IDでの検索
CREATE INDEX IF NOT EXISTS idx_reports_clinic_id ON reports(clinic_id);

-- レポートタイプでの絞り込み
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- ==========================================
-- 5. print_ordersテーブル（印刷物受注）
-- ==========================================

-- メールアドレス + 作成日時での検索
CREATE INDEX IF NOT EXISTS idx_print_orders_email_created
ON print_orders(email, created_at DESC);

-- メールアドレスでの検索
CREATE INDEX IF NOT EXISTS idx_print_orders_email ON print_orders(email);

-- ステータスでの絞り込み
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON print_orders(status);

-- 作成日時でのソート
CREATE INDEX IF NOT EXISTS idx_print_orders_created_at ON print_orders(created_at DESC);

-- ==========================================
-- 6. staffテーブル（スタッフ管理）
-- ==========================================

-- 医院IDでの検索
CREATE INDEX IF NOT EXISTS idx_staff_clinic_id ON staff(clinic_id);

-- メールアドレスでの検索（ユニーク制約あれば不要だが念のため）
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- ロールでの絞り込み
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- ==========================================
-- 7. market_analysisテーブル（診療圏分析）
-- ==========================================

-- 医院ID + 作成日時での検索
CREATE INDEX IF NOT EXISTS idx_market_analysis_clinic_created
ON market_analysis(clinic_id, created_at DESC);

-- 医院IDでの検索
CREATE INDEX IF NOT EXISTS idx_market_analysis_clinic_id ON market_analysis(clinic_id);

-- ==========================================
-- 8. price_tablesテーブル（価格マスタ）
-- ==========================================

-- アクティブな価格表の取得
CREATE INDEX IF NOT EXISTS idx_price_tables_active ON price_tables(is_active);

-- 作成日時でのソート
CREATE INDEX IF NOT EXISTS idx_price_tables_created_at ON price_tables(created_at DESC);

-- ==========================================
-- パフォーマンス向上のためのその他設定
-- ==========================================

-- VACUUM ANALYZE をスケジュール実行（Supabaseコンソールで手動実行）
-- 定期的に実行することで、インデックスの効率を維持

-- ==========================================
-- 複合インデックスの説明
-- ==========================================

-- PostgreSQLの複合インデックスは、左から順に使用される
-- 例: (clinic_id, year_month) のインデックスは以下のクエリに有効
--   - WHERE clinic_id = X AND year_month = Y (最適)
--   - WHERE clinic_id = X (有効)
--   - WHERE year_month = Y (インデックス使用されない)

-- ==========================================
-- インデックスのメンテナンス
-- ==========================================

-- インデックスサイズ確認クエリ
-- SELECT
--     tablename,
--     indexname,
--     pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexname::regclass) DESC;

-- インデックス使用状況確認クエリ
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
