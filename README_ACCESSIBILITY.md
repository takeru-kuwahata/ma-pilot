# MA-Pilot アクセシビリティ・多言語化実装

## 🎯 概要

MA-Pilotは、すべてのユーザーが平等にシステムを利用できるよう、**WCAG 2.1 Level AA準拠**を目指して開発されています。また、**多言語化（i18n）**にも対応し、グローバルな展開を見据えた設計となっています。

## ✅ 実装完了事項

### アクセシビリティ基盤

- [x] ESLintアクセシビリティプラグイン（jsx-a11y）導入
- [x] axe-core自動テスト統合（開発環境）
- [x] WCAG AA準拠のカラーコントラスト
- [x] キーボードナビゲーション対応
- [x] スクリーンリーダー対応（ARIA属性）
- [x] フォーカス管理ユーティリティ
- [x] スクリーンリーダーアナウンサー
- [x] スキップリンク実装
- [x] セマンティックHTML
- [x] Lighthouse CI統合

### 多言語化基盤

- [x] react-i18next設定
- [x] 日本語翻訳ファイル
- [x] 英語翻訳ファイル
- [x] 変数埋め込み対応
- [x] カテゴリ別翻訳キー管理

### ドキュメント

- [x] アクセシビリティガイドライン
- [x] 多言語化ガイド
- [x] アクセシビリティチェックリスト
- [x] クイックリファレンス
- [x] 実装サマリー

## 📁 ファイル構成

```
MA-Pilot/
├── frontend/
│   ├── .eslintrc.json                    # ESLint設定（jsx-a11y統合）
│   ├── lighthouserc.json                 # Lighthouse CI設定
│   ├── package.json                      # 依存関係（更新済み）
│   └── src/
│       ├── App.tsx                       # スキップリンク、アナウンサー初期化
│       ├── main.tsx                      # axe-core統合、CSS読み込み
│       ├── i18n/
│       │   ├── config.ts                 # i18next設定
│       │   └── locales/
│       │       ├── ja.json               # 日本語翻訳
│       │       └── en.json               # 英語翻訳
│       ├── utils/
│       │   ├── announcer.ts              # スクリーンリーダー通知
│       │   └── focusManagement.ts        # フォーカス管理
│       ├── styles/
│       │   └── accessibility.css         # アクセシビリティスタイル
│       ├── components/
│       │   └── AccessibleFormExample.tsx # リファレンス実装
│       └── theme/
│           └── index.ts                  # WCAGカラー、フォーカススタイル
├── .github/
│   └── workflows/
│       └── accessibility.yml             # Lighthouse CI自動実行
└── docs/
    ├── ACCESSIBILITY.md                  # アクセシビリティガイドライン
    ├── I18N_GUIDE.md                     # 多言語化ガイド
    ├── ACCESSIBILITY_CHECKLIST.md        # チェックリスト
    ├── ACCESSIBILITY_QUICK_REFERENCE.md  # クイックリファレンス
    └── ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md  # 実装サマリー
```

## 🚀 使い方

### 開発者向けクイックスタート

#### 1. アクセシビリティチェック

```bash
# 開発サーバー起動（axe-coreが自動で動作し、コンソールに問題を表示）
cd frontend
npm run dev

# ブラウザのコンソールでアクセシビリティ違反を確認
```

#### 2. 静的解析

```bash
# ESLintでアクセシビリティ問題をチェック
npm run lint
```

#### 3. Lighthouse監査

```bash
# ビルドしてLighthouseでスコア計測
npm run build
npm run preview
npx lighthouse http://localhost:4173 --only-categories=accessibility
```

### 多言語化の使用

#### コンポーネントで翻訳を使用

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <Button>{t('common.submit')}</Button>
      <p>{t('validation.required', { field: 'メールアドレス' })}</p>
    </div>
  );
};
```

#### 言語切り替え

```tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <MenuItem value="ja">日本語</MenuItem>
      <MenuItem value="en">English</MenuItem>
    </Select>
  );
};
```

### スクリーンリーダー通知

```tsx
import { announceSuccess, announceError } from '@/utils/announcer';

const handleSave = async () => {
  try {
    await saveData();
    announceSuccess('データを保存しました');
  } catch (error) {
    announceError('保存に失敗しました');
  }
};
```

### フォーカス管理

```tsx
import { trapFocus, saveFocus, restoreFocus } from '@/utils/focusManagement';

const Modal = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const previousFocus = saveFocus();
      const cleanup = trapFocus(modalRef.current);

      return () => {
        cleanup();
        restoreFocus(previousFocus);
      };
    }
  }, [isOpen]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* コンテンツ */}
    </div>
  );
};
```

## 🧪 テスト

### 自動テスト

| ツール | 実行タイミング | 目的 |
|--------|--------------|------|
| **axe-core** | 開発中（リアルタイム） | ブラウザコンソールに問題を表示 |
| **ESLint** | コード保存時、コミット前 | 静的解析でARIA属性漏れ等を検出 |
| **Lighthouse CI** | プルリクエスト時 | アクセシビリティスコア計測 |

### 手動テスト

#### キーボードナビゲーション

```
Tab           - 次の要素へ
Shift + Tab   - 前の要素へ
Enter/Space   - ボタン実行
Escape        - モーダルを閉じる
矢印キー      - リスト/メニュー内移動
```

チェック項目：
- すべてのインタラクティブ要素にフォーカス可能か
- フォーカス順序は論理的か
- フォーカスが視覚的に明確か

#### スクリーンリーダー

**macOS（VoiceOver）:**
```bash
Command + F5  # VoiceOver起動/停止
```

**Windows（NVDA）:**
- [NVDA公式サイト](https://www.nvda.jp/)からダウンロード

チェック項目：
- 見出し構造が論理的か
- フォーム要素が理解できるか
- エラーメッセージが読み上げられるか

#### 拡大表示

ブラウザのズーム機能で200%まで拡大

```
Command/Ctrl + +  # 拡大
```

チェック項目：
- テキストが切れていないか
- 横スクロールが発生していないか

## 📊 成功基準

### Lighthouseスコア

| カテゴリ | 最小スコア | 重要度 |
|---------|-----------|--------|
| **Accessibility** | 90 | 必須（エラー） |
| Performance | 80 | 推奨（警告） |
| SEO | 80 | 推奨（警告） |
| Best Practices | 80 | 推奨（警告） |

### WCAGコントラスト比

- **通常テキスト**: 4.5:1以上
- **大きいテキスト（18pt以上）**: 3:1以上
- **UIコンポーネント**: 3:1以上

## 📚 ドキュメント

| ドキュメント | 内容 | 対象者 |
|-------------|------|--------|
| [ACCESSIBILITY.md](./docs/ACCESSIBILITY.md) | 完全なガイドライン、実装方法、テスト方法 | すべての開発者 |
| [I18N_GUIDE.md](./docs/I18N_GUIDE.md) | 多言語化の実装方法、翻訳ファイル管理 | すべての開発者 |
| [ACCESSIBILITY_CHECKLIST.md](./docs/ACCESSIBILITY_CHECKLIST.md) | 実装時のチェックリスト | 実装担当者 |
| [ACCESSIBILITY_QUICK_REFERENCE.md](./docs/ACCESSIBILITY_QUICK_REFERENCE.md) | よく使うパターンのチートシート | すべての開発者 |
| [ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md](./docs/ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md) | 実装の詳細サマリー | プロジェクトマネージャー |

## 🔧 トラブルシューティング

### アクセシビリティ違反が検出される

1. **ブラウザコンソールを確認**
   - axe-coreが具体的な問題を表示
   - 修正方法へのリンクも提供される

2. **ESLintの警告を確認**
   ```bash
   npm run lint
   ```

3. **チェックリストで確認**
   - [ACCESSIBILITY_CHECKLIST.md](./docs/ACCESSIBILITY_CHECKLIST.md)参照

### 翻訳が表示されない

1. **キーが正しいか確認**
   ```tsx
   console.log(t('your.key')); // 翻訳が取得できるか確認
   ```

2. **翻訳ファイルに該当キーがあるか確認**
   - `/frontend/src/i18n/locales/ja.json`

3. **i18n設定がインポートされているか確認**
   - `App.tsx`で`import './i18n/config'`があるか

## 🎯 ベストプラクティス

### ✅ DO（推奨）

- セマンティックHTMLを使用（`<button>`, `<nav>`, `<main>`等）
- すべてのフォーム要素にラベルを設定
- エラーメッセージを`aria-describedby`で関連付け
- モーダルにフォーカストラップを実装
- 翻訳キーは意味のある名前を使用
- 重要な通知はスクリーンリーダーに通知

### ❌ DON'T（非推奨）

- `<div>`にonClickイベント（`<button>`を使用）
- プレースホルダーだけをラベルとして使用
- 色だけで情報を伝える
- `outline: none`の使用（代替スタイルなしで）
- テキストのハードコード（翻訳を使用）
- 自動再生メディア

## 🚧 今後の拡張（Phase 11）

### アクセシビリティ

- [ ] より詳細なARIA属性（aria-expanded、aria-controls等）
- [ ] カスタムコンポーネントの強化
- [ ] キーボードショートカットの追加
- [ ] ハイコントラストモードのサポート
- [ ] 音声入力対応

### 多言語化

- [ ] ユーザープロファイルへの言語設定保存
- [ ] 地域別の日時・通貨フォーマット
- [ ] RTL（右から左）言語のサポート
- [ ] 翻訳管理システムの導入
- [ ] 中国語、韓国語等の追加

## 📞 サポート

### 質問・問題報告

GitHubのIssueで報告してください：

```
タイトル: [A11y] 問題の簡潔な説明

内容:
- 発生場所（ページ、コンポーネント）
- 問題の詳細
- 使用している支援技術（あれば）
- 再現手順
- スクリーンショット（可能であれば）
```

### リソース

- [WCAG 2.1 ガイドライン](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MUI Accessibility](https://mui.com/material-ui/guides/accessibility/)
- [react-i18next Documentation](https://react.i18next.com/)

## 📝 ライセンス

このプロジェクトは、アクセシビリティとインクルーシブデザインを重視して開発されています。

---

**最終更新:** 2025-12-26
**バージョン:** 1.0.0
**ステータス:** ✅ 基盤実装完了
