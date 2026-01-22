# アクセシビリティガイドライン

## 概要

MA-Pilotは、すべてのユーザーが平等にシステムを利用できるよう、WCAG 2.1 Level AA準拠を目指して開発されています。

## アクセシビリティ方針

### 準拠基準

- **WCAG 2.1 Level AA準拠**
  - 知覚可能（Perceivable）
  - 操作可能（Operable）
  - 理解可能（Understandable）
  - 堅牢（Robust）

### 対象ユーザー

- キーボードのみで操作するユーザー
- スクリーンリーダーを使用するユーザー
- 拡大表示を使用するユーザー
- 色覚障害のあるユーザー
- 認知障害のあるユーザー

## 実装ガイドライン

### 1. セマンティックHTML

適切なHTML要素を使用し、ドキュメント構造を明確にします。

```tsx
// Good
<header>
  <nav aria-label="メインナビゲーション">
    <ul>
      <li><a href="/dashboard">ダッシュボード</a></li>
    </ul>
  </nav>
</header>

<main id="main-content">
  <article>
    <h1>経営ダッシュボード</h1>
    <section>
      <h2>月次データ</h2>
    </section>
  </article>
</main>

// Bad
<div class="header">
  <div class="nav">
    <div class="link">ダッシュボード</div>
  </div>
</div>
```

### 2. ARIA属性の適切な使用

ARIA属性を使用してコンポーネントの役割と状態を明示します。

```tsx
// ボタン
<Button
  aria-label="ログイン"
  aria-describedby="login-help-text"
  disabled={isLoading}
  aria-disabled={isLoading}
>
  ログイン
</Button>

// フォーム
<TextField
  label="メールアドレス"
  required
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <FormHelperText id="email-error" error role="alert">
    {errors.email.message}
  </FormHelperText>
)}

// ダイアログ
<Dialog
  open={open}
  onClose={handleClose}
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <DialogTitle id="dialog-title">確認</DialogTitle>
  <DialogContent id="dialog-description">
    本当に削除しますか？
  </DialogContent>
</Dialog>
```

### 3. キーボードナビゲーション

すべての機能はキーボードのみで操作可能である必要があります。

#### スキップリンク

```tsx
<a href="#main-content" className="skip-link">
  メインコンテンツへスキップ
</a>
```

#### フォーカス管理

```tsx
import { trapFocus, saveFocus, restoreFocus } from '@/utils/focusManagement';

const Modal = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // 現在のフォーカスを保存
      previousFocus.current = saveFocus();

      // モーダル内にフォーカスをトラップ
      const cleanup = trapFocus(modalRef.current);

      return () => {
        cleanup();
        // モーダルを閉じたらフォーカスを復元
        restoreFocus(previousFocus.current);
      };
    }
  }, [isOpen]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* モーダルコンテンツ */}
    </div>
  );
};
```

### 4. カラーコントラスト

WCAG AA基準（4.5:1）以上のコントラスト比を確保します。

```typescript
// theme/index.ts
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // コントラスト比: 4.52:1（白背景）
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // コントラスト比: 4.56:1（白背景）
      contrastText: '#ffffff',
    },
  },
});
```

### 5. スクリーンリーダー対応

#### ライブリージョン

動的なコンテンツ変更をスクリーンリーダーに通知します。

```tsx
import { announceSuccess, announceError } from '@/utils/announcer';

const handleSubmit = async () => {
  try {
    await saveData();
    announceSuccess('データを保存しました');
  } catch (error) {
    announceError('データの保存に失敗しました');
  }
};
```

```tsx
// ステータスメッセージ
<div role="status" aria-live="polite" aria-atomic="true">
  {successMessage}
</div>

// エラーメッセージ
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### 6. フォーカス表示

フォーカス状態を明確に視覚化します。

```typescript
// theme/index.ts
MuiButton: {
  styleOverrides: {
    root: {
      '&:focus-visible': {
        outline: '2px solid currentColor',
        outlineOffset: '2px',
      },
    },
  },
},
```

## テスト方法

### 自動テスト

#### 1. axe-core（開発時）

開発環境でコンソールにアクセシビリティ問題を自動表示します。

```bash
npm run dev
# ブラウザのコンソールでアクセシビリティ問題を確認
```

#### 2. Lighthouse CI（CI/CD）

プルリクエスト時に自動的にアクセシビリティスコアを計測します。

```bash
npm run build
npm run preview
npx lighthouse http://localhost:4173 --only-categories=accessibility
```

#### 3. ESLint（静的解析）

コード内のアクセシビリティ問題を検出します。

```bash
npm run lint
```

### 手動テスト

#### 1. キーボードナビゲーション

- **Tab**: 次の要素へフォーカス移動
- **Shift + Tab**: 前の要素へフォーカス移動
- **Enter/Space**: ボタンやリンクを実行
- **Esc**: ダイアログやモーダルを閉じる
- **矢印キー**: リスト内の移動

チェック項目：
- すべてのインタラクティブ要素にフォーカス可能か
- フォーカス順序は論理的か
- フォーカス状態が視覚的に明確か
- モーダル内でフォーカスがトラップされているか

#### 2. スクリーンリーダー

**macOS + VoiceOver:**
```bash
Command + F5 # VoiceOver起動/停止
Control + Option + U # ローター表示
```

**Windows + NVDA:**
```
NVDA + N # メニュー表示
Insert + Down # 読み上げモード
```

チェック項目：
- 見出し構造が論理的か
- フォーム要素にラベルが設定されているか
- エラーメッセージが読み上げられるか
- ボタンの役割が明確か

#### 3. 拡大表示

ブラウザのズーム機能で200%まで拡大してテストします。

```
Command/Ctrl + +  # 拡大
Command/Ctrl + -  # 縮小
Command/Ctrl + 0  # リセット
```

チェック項目：
- テキストが切れていないか
- 横スクロールが発生していないか
- ボタンがクリック可能な範囲を維持しているか

#### 4. カラーコントラスト

Chrome DevToolsのContrast Ratioツールを使用します。

1. 要素を検査
2. Stylesパネルでカラーをクリック
3. Contrast Ratioを確認（AA: 4.5:1以上）

## ツール

### 開発時

- **axe DevTools**: ブラウザ拡張機能
- **Lighthouse**: Chrome DevTools
- **WAVE**: Webアクセシビリティ評価ツール

### CI/CD

- **Lighthouse CI**: 自動スコア計測
- **axe-core**: 自動テスト
- **eslint-plugin-jsx-a11y**: 静的解析

## リソース

- [WCAG 2.1 ガイドライン](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: アクセシビリティ](https://developer.mozilla.org/ja/docs/Web/Accessibility)
- [MUI Accessibility](https://mui.com/material-ui/guides/accessibility/)

## 既知の問題と対応計画

### Phase 11での対応予定

- [ ] より詳細なARIA属性の追加（aria-expanded、aria-controls等）
- [ ] カスタムコンポーネントのアクセシビリティ強化
- [ ] より包括的なキーボードショートカット
- [ ] ハイコントラストモードのサポート

## サポート

アクセシビリティに関する問題を発見した場合は、GitHubのIssueで報告してください。

```
タイトル: [A11y] 問題の簡潔な説明
内容:
- 発生場所（ページ、コンポーネント）
- 問題の詳細
- 使用している支援技術（あれば）
- スクリーンショット（可能であれば）
```
