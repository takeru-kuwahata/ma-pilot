# アクセシビリティ・多言語化実装サマリー

## 実装完了日
2025-12-26

## 概要

MA-Pilotのアクセシビリティ（WCAG 2.1 Level AA準拠）と多言語化（i18n）の基盤を構築しました。

## 実装内容

### 1. 依存関係の追加

#### アクセシビリティ
- `@axe-core/react@^4.8.2` - 開発時の自動アクセシビリティチェック
- `eslint-plugin-jsx-a11y@^6.8.0` - 静的解析によるアクセシビリティチェック

#### 多言語化
- `i18next@^23.7.0` - 国際化フレームワーク
- `react-i18next@^13.5.0` - React用i18next統合

### 2. ESLint設定

**ファイル:** `/frontend/.eslintrc.json`

```json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"]
}
```

- jsx-a11yプラグインによる静的解析を有効化
- アクセシビリティ問題をLint時に自動検出

### 3. i18n基盤

#### 設定ファイル
- `/frontend/src/i18n/config.ts` - i18next設定
- `/frontend/src/i18n/locales/ja.json` - 日本語翻訳
- `/frontend/src/i18n/locales/en.json` - 英語翻訳

#### 特徴
- 日本語と英語をサポート
- 変数の埋め込み対応（バリデーションメッセージ等）
- カテゴリ別の翻訳キー管理
- フォールバック言語設定

### 4. アクセシビリティユーティリティ

#### フォーカス管理
**ファイル:** `/frontend/src/utils/focusManagement.ts`

- `trapFocus()` - モーダル/ダイアログ内でフォーカスをトラップ
- `getFocusableElements()` - フォーカス可能な要素を取得
- `saveFocus()` / `restoreFocus()` - フォーカスの保存と復元

#### スクリーンリーダーアナウンサー
**ファイル:** `/frontend/src/utils/announcer.ts`

- `announce()` - 任意のメッセージを通知
- `announceSuccess()` - 成功メッセージを通知（polite）
- `announceError()` - エラーメッセージを通知（assertive）
- `initializeAnnouncer()` - アナウンサー要素を初期化

### 5. テーマの改善

**ファイル:** `/frontend/src/theme/index.ts`

#### カラーコントラスト
- エラー色を`#d32f2f`に変更（WCAG AA準拠）
- すべての色でコントラスト比4.5:1以上を確保

#### フォーカススタイル
- ボタン: `:focus-visible`で2pxのアウトライン
- テキストフィールド: フォーカス時にボーダー幅2px
- リンク: フォーカス時にアウトラインとボーダーラディウス

### 6. App.tsxの更新

**ファイル:** `/frontend/src/App.tsx`

#### 追加機能
- スキップリンク実装（キーボードユーザー向け）
- セマンティックHTML（`<main id="main-content">`）
- スクリーンリーダーアナウンサーの自動初期化
- i18n設定のインポート

#### ローディングフォールバック
- `role="status"`と`aria-live="polite"`を追加
- `aria-label`でローディング状態を明示

### 7. main.tsxの更新

**ファイル:** `/frontend/src/main.tsx`

- 開発環境で自動的にaxe-coreを起動
- アクセシビリティ問題をコンソールに表示

### 8. Lighthouse CI設定

#### 設定ファイル
**ファイル:** `/frontend/lighthouserc.json`

- アクセシビリティスコア90以上を必須化
- パフォーマンス、SEO、ベストプラクティスも監視

#### GitHub Actions
**ファイル:** `/.github/workflows/accessibility.yml`

- プルリクエスト時に自動実行
- Lighthouseレポートをアーティファクトとして保存
- アクセシビリティスコアが基準未満の場合はエラー

### 9. ドキュメント

#### アクセシビリティガイドライン
**ファイル:** `/docs/ACCESSIBILITY.md`

- WCAG 2.1準拠方針
- 実装ガイドライン（ARIA、キーボード、カラー等）
- テスト方法（自動・手動）
- ツールの使い方
- 既知の問題と対応計画

#### 多言語化ガイド
**ファイル:** `/docs/I18N_GUIDE.md`

- i18nアーキテクチャ
- 使用方法とベストプラクティス
- 翻訳ファイルの構造
- 新規言語の追加手順
- 日時・通貨のフォーマット
- テスト方法

#### アクセシビリティチェックリスト
**ファイル:** `/docs/ACCESSIBILITY_CHECKLIST.md`

- 一般的なチェック項目
- フォーム、ボタン、リンク等の個別チェック項目
- テストチェック項目
- プルリクエスト前の確認事項

### 10. リファレンス実装

**ファイル:** `/frontend/src/components/AccessibleFormExample.tsx`

- アクセシビリティのベストプラクティスを示すサンプルコンポーネント
- 適切なARIA属性の使用例
- エラーハンドリング
- フォーカス管理
- スクリーンリーダー対応

## 使用方法

### 開発者向け

#### アクセシビリティチェック

```bash
# 開発サーバー起動（axe-coreが自動で動作）
cd frontend
npm run dev

# ESLintでチェック
npm run lint

# Lighthouseで監査
npm run build
npm run preview
npx lighthouse http://localhost:4173 --only-categories=accessibility
```

#### 多言語化の使用

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <Button>{t('common.submit')}</Button>
    </div>
  );
};
```

#### アナウンサーの使用

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

#### フォーカス管理

```tsx
import { trapFocus, saveFocus, restoreFocus } from '@/utils/focusManagement';

const Modal = ({ isOpen }) => {
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

  return <div ref={modalRef} role="dialog">...</div>;
};
```

## テスト環境

### 推奨ツール

#### ブラウザ拡張機能
- **axe DevTools** - Chrome/Firefox
- **WAVE** - Chrome/Firefox
- **Lighthouse** - Chrome DevTools内蔵

#### スクリーンリーダー
- **macOS:** VoiceOver（Command + F5）
- **Windows:** NVDA（無料）、JAWS
- **Chrome拡張:** ChromeVox

#### カラーコントラストチェッカー
- Chrome DevToolsのContrast Ratio機能
- WebAIM Contrast Checker
- Colour Contrast Analyser（アプリ）

## CI/CD統合

### GitHub Actions

プルリクエスト時に以下が自動実行されます：

1. **ESLint**: アクセシビリティ問題の静的解析
2. **Lighthouse CI**: アクセシビリティスコアの計測
3. **結果レポート**: アーティファクトとして保存

### 基準

- **アクセシビリティスコア**: 90以上（必須）
- **パフォーマンススコア**: 80以上（警告）
- **SEOスコア**: 80以上（警告）
- **ベストプラクティススコア**: 80以上（警告）

## 今後の拡張予定

### Phase 11での対応

#### アクセシビリティ
- [ ] より詳細なARIA属性（aria-expanded、aria-controls等）
- [ ] カスタムコンポーネントの強化
- [ ] キーボードショートカットの追加
- [ ] ハイコントラストモードのサポート
- [ ] フォーカスインジケーターのカスタマイズ

#### 多言語化
- [ ] 言語設定のユーザープロファイル保存
- [ ] 地域別の日時・通貨フォーマット
- [ ] RTL（右から左）言語のサポート
- [ ] 翻訳管理システムの導入
- [ ] 自動翻訳ツールの統合

## ファイル一覧

### 新規作成ファイル

```
frontend/
├── .eslintrc.json
├── lighthouserc.json
├── src/
│   ├── i18n/
│   │   ├── config.ts
│   │   └── locales/
│   │       ├── ja.json
│   │       └── en.json
│   ├── utils/
│   │   ├── announcer.ts
│   │   └── focusManagement.ts
│   └── components/
│       └── AccessibleFormExample.tsx

.github/
└── workflows/
    └── accessibility.yml

docs/
├── ACCESSIBILITY.md
├── I18N_GUIDE.md
├── ACCESSIBILITY_CHECKLIST.md
└── ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md
```

### 更新ファイル

```
frontend/
├── package.json (依存関係追加)
├── src/
│   ├── App.tsx (スキップリンク、アナウンサー初期化)
│   ├── main.tsx (axe-core統合)
│   └── theme/
│       └── index.ts (カラーコントラスト、フォーカススタイル)
```

## まとめ

この実装により、MA-Pilotは以下を達成しました：

✅ **WCAG 2.1 Level AA準拠の基盤**
✅ **多言語化対応（日本語・英語）**
✅ **自動アクセシビリティテスト環境**
✅ **包括的なドキュメント**
✅ **CI/CD統合**

すべてのコンポーネントは、このガイドラインに従って実装することで、一貫したアクセシビリティと国際化対応が可能です。

## サポート

質問や問題がある場合は、以下のドキュメントを参照してください：

- [ACCESSIBILITY.md](/docs/ACCESSIBILITY.md) - アクセシビリティガイドライン
- [I18N_GUIDE.md](/docs/I18N_GUIDE.md) - 多言語化ガイド
- [ACCESSIBILITY_CHECKLIST.md](/docs/ACCESSIBILITY_CHECKLIST.md) - チェックリスト
