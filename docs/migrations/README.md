# データベースマイグレーション

Supabase PostgreSQLのスキーマ変更履歴とSQLスクリプトをまとめています。

## 実行済みマイグレーション

| # | ファイル名 | 実行日 | 説明 | 状態 |
|---|-----------|--------|------|------|
| 001 | print_order_migration_fixed.sql | 2026-01-15 | 印刷物注文テーブル作成（修正版） | ✅ 完了 |
| 002 | add_print_order_items.sql | 2026-01-16 | 注文アイテムテーブル追加 | ✅ 完了 |
| 003 | recreate_print_orders_table.sql | 2026-01-18 | 注文テーブル再作成 | ✅ 完了 |
| 004 | insert_all_product_types.sql | 2026-01-20 | 全商品タイプマスタ投入 | ✅ 完了 |
| 005 | insert_new_product_types.sql | 2026-01-22 | 新商品タイプ追加 | ✅ 完了 |
| 006 | fix_price_tables_rls.sql | 2026-02-01 | 価格テーブルRLS修正 | ✅ 完了 |
| 007 | create_system_settings.sql | 2026-02-10 | システム設定テーブル作成 | ✅ 完了 |
| 008 | add_clinic_id_to_print_orders.sql | 2026-03-06 | 注文テーブルにclinic_id追加 | ✅ 完了 |

## マイグレーション実行手順

### 1. Supabase SQL Editorで実行

1. Supabaseダッシュボードにログイン
2. 対象プロジェクトを選択
3. 左メニュー「SQL Editor」をクリック
4. 「New Query」をクリック
5. SQLファイルの内容をコピー＆ペースト
6. 「Run」をクリック
7. 実行結果を確認

### 2. ローカル開発環境での確認

```bash
# SupabaseのDatabase URLを使用
psql $DATABASE_URL < migrations/00X_migration_name.sql
```

### 3. マイグレーション後の確認

各SQLファイル末尾の確認クエリを実行して、正しく反映されたことを確認してください。

## 注意事項

- **実行順序を厳守**: 番号順に実行すること
- **バックアップ**: 本番環境では事前にバックアップを取得
- **ロールバック**: 問題発生時はSupabase管理画面からバックアップ復元
- **テスト**: 開発環境で十分にテストしてから本番実行

## アーカイブ

`archive/` ディレクトリには古い・使用されなくなったマイグレーションファイルが保管されています。

## 関連リソース

- [Supabase Documentation](https://supabase.com/docs)
- [開発ステータス](../DEV_STATUS.md)
- [データベーススキーマ](../../backend/docs/database_schema.md)（存在する場合）
