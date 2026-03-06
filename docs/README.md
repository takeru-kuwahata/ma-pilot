# MA-Pilot ドキュメント

歯科医院経営分析システム「MA-Pilot」のドキュメント索引です。

## 📋 目次

### 1. プロジェクト概要
- **[CLAUDE.md](../CLAUDE.md)** - プロジェクト設定・コーディング規約
- **[requirements.md](requirements.md)** - 要件定義書
- **[SCOPE_PROGRESS.md](SCOPE_PROGRESS.md)** - 開発進捗管理

### 2. 最新情報
- **[RECENT_UPDATES.md](RECENT_UPDATES.md)** - 最近の更新履歴（2026-03-06）
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - 次のステップ
- **[DEV_STATUS.md](DEV_STATUS.md)** - 開発ステータス

### 3. 運用ガイド
- **[operations/](operations/)** - システム運用ガイド
  - [OPERATIONS_GUIDE.md](operations/OPERATIONS_GUIDE.md) - 運用手順
  - [USER_MANUAL.md](operations/USER_MANUAL.md) - ユーザーマニュアル
  - [FAQ.md](operations/FAQ.md) - よくある質問
  - [GLOSSARY.md](operations/GLOSSARY.md) - 用語集

### 4. トラブルシューティング
- **[troubleshooting/](troubleshooting/)** - 問題解決ガイド
  - [TROUBLESHOOTING.md](troubleshooting/TROUBLESHOOTING.md) - 一般的なトラブル
  - [DEPLOYMENT_GUIDE.md](troubleshooting/DEPLOYMENT_GUIDE.md) - デプロイ手順
  - [PASSWORD_RESET_GUIDE.md](troubleshooting/PASSWORD_RESET_GUIDE.md) - パスワードリセット
  - [FIX_INFINITE_RECURSION.md](troubleshooting/FIX_INFINITE_RECURSION.md) - 無限ループ修正

### 5. チェックリスト
- **[checklists/](checklists/)** - 各種チェックリスト
  - [PRODUCTION_CHECKLIST.md](checklists/PRODUCTION_CHECKLIST.md) - 本番リリース
  - [SECURITY_CHECKLIST.md](checklists/SECURITY_CHECKLIST.md) - セキュリティ
  - [CLIENT_CHECKLIST.md](checklists/CLIENT_CHECKLIST.md) - クライアント確認
  - [CLIENT_ACTION_ITEMS.md](checklists/CLIENT_ACTION_ITEMS.md) - クライアント作業

### 6. データベース
- **[migrations/](migrations/)** - SQLマイグレーション
  - [README.md](migrations/README.md) - マイグレーション履歴
  - 001〜008: 実行済みマイグレーション

### 7. 設計資料
- **[印刷物複数注文_UI設計案.md](印刷物複数注文_UI設計案.md)** - 印刷注文UI設計
- **[PHASE1-5_DELIVERY_REPORT.md](PHASE1-5_DELIVERY_REPORT.md)** - Phase 1-5納品レポート

### 8. アーカイブ（ローカルのみ、Git管理外）
- **archive/status/** - 実装完了済み機能のステータス
- **archive/phase6/** - Phase 6未実装機能の設計
- **archive/temp/** - 一時ファイル

## 🚀 クイックスタート

### 開発者向け
1. [CLAUDE.md](../CLAUDE.md) - 開発環境設定を確認
2. [DEV_STATUS.md](DEV_STATUS.md) - 現在の開発状況を確認
3. [RECENT_UPDATES.md](RECENT_UPDATES.md) - 最近の変更を確認

### 運用担当者向け
1. [operations/OPERATIONS_GUIDE.md](operations/OPERATIONS_GUIDE.md) - 運用手順を確認
2. [troubleshooting/](troubleshooting/) - トラブル時の対処法を確認

### クライアント向け
1. [operations/USER_MANUAL.md](operations/USER_MANUAL.md) - 使い方を確認
2. [operations/FAQ.md](operations/FAQ.md) - よくある質問を確認

## 📞 サポート

問題が発生した場合：
1. [troubleshooting/TROUBLESHOOTING.md](troubleshooting/TROUBLESHOOTING.md) を確認
2. [operations/FAQ.md](operations/FAQ.md) を確認
3. GitHub Issuesで報告: https://github.com/takeru-kuwahata/ma-pilot/issues

## 🔄 ドキュメント更新ルール

1. **実装完了後**: コードが真実源となるため、詳細設計は `archive/` へ移動
2. **新機能追加時**: `RECENT_UPDATES.md` に追記
3. **トラブル解決時**: `troubleshooting/` に追加
4. **運用手順変更時**: `operations/OPERATIONS_GUIDE.md` を更新

## 📝 関連リンク

- **本番環境**: https://ma-pilot.vercel.app
- **バックエンドAPI**: https://ma-pilot.onrender.com
- **GitHubリポジトリ**: https://github.com/takeru-kuwahata/ma-pilot
- **Supabaseプロジェクト**: https://supabase.com/dashboard/project/[project-id]
