# レポート管理ページ実装状況

**最終更新**: 2026-02-04

## 📊 実装状況サマリー

| 機能 | UI | バックエンド | 実装状態 |
|------|----|-----------|------------|
| ページ表示 | ✅ | ✅ | 完了 |
| レポートテンプレート表示 | ✅ | - | 完了 |
| レポート生成履歴表示 | ✅ | ✅ | 完了 |
| カスタムレポート作成ボタン | ⚠️ | ✅ | **未実装**（TODOコメント） |
| テンプレートダウンロードボタン | ⚠️ | ✅ | **未実装**（onClick未設定） |
| 履歴ダウンロードボタン | ✅ | ✅ | 完了（データがあれば動作） |
| 削除ボタン | ⚠️ | ✅ | **未実装**（TODOコメント） |

---

## 🐛 問題1: カスタムレポート作成ボタンが動作しない

### 現象
- 「カスタムレポート作成」ボタンをクリックしても何も起きない

### 原因（Reports.tsx:99-101）
```typescript
const handleCreateCustomReport = () => {
  // TODO: Phase 4でカスタムレポート作成ダイアログ実装
};
```

**完全に未実装**: TODOコメントのみで処理が空

### 必要な実装
1. カスタムレポート作成ダイアログの表示
2. レポートタイプ・対象期間の選択
3. API呼び出し（`POST /api/reports/generate`）
4. 生成完了後、履歴リストを更新

---

## 🐛 問題2: テンプレートのダウンロードボタンが動作しない

### 現象
- 3つのテンプレートカード（月次経営レポート、診療圏分析レポート、シミュレーション結果レポート）のダウンロードボタンをクリックしても何も起きない

### 原因（Reports.tsx:230-240）
```typescript
<IconButton
  size="small"
  sx={{ ... }}
>
  <DownloadIcon />
</IconButton>
```

**onClick未設定**: ボタンに`onClick`ハンドラーが設定されていない

### 必要な実装
```typescript
<IconButton
  size="small"
  onClick={() => handleGenerateReport(template.id)}
  sx={{ ... }}
>
  <DownloadIcon />
</IconButton>
```

**新規関数**:
```typescript
const handleGenerateReport = async (templateId: string) => {
  try {
    const user = authService.getCurrentUser();
    if (!user?.clinicId) return;

    // テンプレートIDに応じたレポートタイプを決定
    const reportType = templateId === '1' ? 'monthly' :
                      templateId === '2' ? 'market_analysis' :
                      'simulation';

    // レポート生成API呼び出し
    const report = await reportService.generateReport(
      user.clinicId,
      reportType,
      { /* パラメータ */ }
    );

    // 生成完了後、ダウンロード
    await handleDownload(report.id);

    // 履歴リスト更新
    await loadReports();
  } catch (error) {
    console.error('Failed to generate report:', error);
  }
};
```

---

## 🐛 問題3: 削除ボタンが動作しない

### 現象
- レポート生成履歴の削除ボタンをクリックしても何も起きない

### 原因（Reports.tsx:95-97）
```typescript
const handleDelete = () => {
  // TODO: Phase 4でAPI呼び出し実装
};
```

**完全に未実装**: TODOコメントのみで処理が空

### 必要な実装
```typescript
const handleDelete = async (reportId: string) => {
  try {
    if (!confirm('このレポートを削除しますか？')) return;

    await reportService.deleteReport(reportId);
    await loadReports(); // リスト更新
  } catch (error) {
    console.error('Failed to delete report:', error);
  }
};
```

**onClick修正**（370行目）:
```typescript
<IconButton
  size="small"
  onClick={() => handleDelete(report.id)} // reportIdを渡す
  sx={{ ... }}
>
  <DeleteIcon />
</IconButton>
```

---

## ✅ 動作する機能（データがあれば）

### 履歴のダウンロードボタン（Reports.tsx:86-93）
```typescript
const handleDownload = async (reportId: string) => {
  try {
    const fileUrl = await reportService.downloadReport(reportId);
    window.open(fileUrl, '_blank');
  } catch (error) {
    console.error('Failed to download report:', error);
  }
};
```

**実装済み**: レポート生成履歴がある場合、ダウンロードボタンは正常に動作

---

## 📝 検証結果

### 質問: 「医院データ入力していないから動かないのか？実装されていないからなのか？」

**回答: 実装されていないから動かない**

| ボタン | 原因 | 医院データの影響 |
|--------|------|----------------|
| カスタムレポート作成 | ❌ 未実装（TODO） | 関係なし |
| テンプレートダウンロード | ❌ onClick未設定 | 関係なし |
| 履歴ダウンロード | ✅ 実装済み | データがあれば動作 |
| 削除 | ❌ 未実装（TODO） | 関係なし |

**結論**: 医院データの有無に関わらず、実装されていないため動作しない

---

## 🔧 修正方針

### 🔴 優先度: 高（クライアントテスト前に必要）

#### 修正1: テンプレートダウンロード機能の実装
**工数**: 0.5-1日

**実装内容**:
1. `handleGenerateReport()` 関数を追加
2. テンプレートカードのダウンロードボタンに `onClick` 設定
3. レポート生成API呼び出し
4. エラーハンドリング（Toast通知）
5. ローディング状態表示

### 🟡 優先度: 中（運用開始後）

#### 修正2: カスタムレポート作成機能
**工数**: 1-2日

**実装内容**:
1. レポート作成ダイアログ実装
2. レポートタイプ選択（月次/四半期/年次/シミュレーション/診療圏）
3. 対象期間選択（DatePicker）
4. API呼び出し
5. 生成完了後の通知

#### 修正3: 削除機能
**工数**: 0.5日

**実装内容**:
1. 確認ダイアログ実装
2. API呼び出し（`DELETE /api/reports/{id}`）
3. リスト更新

---

## 📋 バックエンドAPI実装状況

| エンドポイント | メソッド | 状態 | 備考 |
|-------------|---------|------|------|
| `/api/reports/generate` | POST | ✅ 実装済み | レポート生成 |
| `/api/reports` | GET | ✅ 実装済み | レポート一覧取得 |
| `/api/reports/{id}/download` | GET | ✅ 実装済み | レポートダウンロード |
| `/api/reports/{id}` | DELETE | ❌ 未実装 | レポート削除 |

**結論**: バックエンドAPIは主要機能が実装済み。フロントエンドのUI接続のみ未実装。

---

## 📝 クライアント向け説明

### 現状
「レポート管理ページは表示されますが、以下の問題があります：

1. **カスタムレポート作成ボタンが動作しない**
   - フロントエンド実装が未完了（TODOコメント）

2. **テンプレートダウンロードボタンが動作しない**
   - onClick未設定（実装漏れ）

3. **削除ボタンが動作しない**
   - フロントエンド実装が未完了（TODOコメント）

**これは医院データの有無とは無関係で、単純に実装されていないためです。**

### クライアントのタスク
- **なし**（開発者側の実装不足）

### 開発者のタスク
1. テンプレートダウンロード機能実装（0.5-1日）
2. カスタムレポート作成機能実装（1-2日、運用開始後）
3. 削除機能実装（0.5日、運用開始後）

---

## 検証結果（チェックリスト 3.5）

| # | 項目 | 手順 | 期待結果 | 結果 | 備考 |
|---|------|------|----------|------|------|
| 3.5.1 | ページ表示 | 左メニュー「レポート管理」クリック | ページが表示される | [✅] | UI完成 |
| 3.5.2 | テンプレート表示 | 3つのテンプレートカード確認 | カードが表示される | [✅] | 表示正常 |
| 3.5.3 | テンプレートダウンロード | ダウンロードボタンクリック | レポート生成・ダウンロード | [❌] | **未実装** |
| 3.5.4 | カスタムレポート作成 | 作成ボタンクリック | ダイアログが表示される | [❌] | **未実装** |
| 3.5.5 | 履歴表示 | レポート生成履歴テーブル確認 | 履歴が表示される | [✅] | 現在は「レポートがありません」 |
| 3.5.6 | 履歴ダウンロード | ダウンロードボタンクリック | PDFダウンロード | [⚠️] | 実装済みだがデータなし |
| 3.5.7 | 履歴削除 | 削除ボタンクリック | 確認後削除される | [❌] | **未実装** |

**結論**: ページUIは完成しているが、主要なボタン（テンプレートダウンロード、カスタム作成、削除）が未実装。クライアントテスト前に修正必須。
