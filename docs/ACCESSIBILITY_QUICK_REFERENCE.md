# アクセシビリティクイックリファレンス

開発時にすぐ参照できるアクセシビリティのチートシートです。

## 基本原則

### 1. セマンティックHTML優先

```tsx
// ✅ Good
<button onClick={handleClick}>送信</button>
<nav aria-label="メインナビゲーション">...</nav>
<main>...</main>

// ❌ Bad
<div onClick={handleClick}>送信</div>
<div className="nav">...</div>
<div className="main">...</div>
```

### 2. すべての機能をキーボードで操作可能に

```tsx
// ✅ Good - ネイティブボタンは自動的にキーボード対応
<button onClick={handleClick}>クリック</button>

// ❌ Bad - divはキーボードでフォーカスできない
<div onClick={handleClick}>クリック</div>

// 🟡 許容可能だが推奨しない - role, tabindex, keydown handler が必要
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  クリック
</div>
```

### 3. 代替テキスト必須

```tsx
// ✅ Good
<img src="logo.png" alt="MA-Pilot ロゴ" />
<img src="decorative.png" alt="" /> {/* 装飾的画像は空文字 */}

// ❌ Bad
<img src="logo.png" />
<img src="logo.png" alt="画像" /> {/* 汎用的すぎる */}
```

## よく使うARIA属性

### ボタン

```tsx
// 基本
<Button aria-label="ログイン">ログイン</Button>

// アイコンのみボタン
<IconButton aria-label="メニューを開く">
  <MenuIcon />
</IconButton>

// トグルボタン
<Button
  aria-pressed={isActive}
  onClick={() => setIsActive(!isActive)}
>
  フィルター
</Button>

// 無効化
<Button disabled aria-disabled="true">
  送信
</Button>
```

### フォーム

```tsx
// テキストフィールド
<TextField
  label="メールアドレス"
  required
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : "email-help"}
/>

// ヘルプテキスト
<FormHelperText id="email-help">
  example@clinic.com の形式で入力してください
</FormHelperText>

// エラーメッセージ
<FormHelperText id="email-error" error role="alert">
  有効なメールアドレスを入力してください
</FormHelperText>
```

### モーダル/ダイアログ

```tsx
<Dialog
  open={open}
  onClose={handleClose}
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <DialogTitle id="dialog-title">確認</DialogTitle>
  <DialogContent id="dialog-description">
    本当に削除しますか？
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>キャンセル</Button>
    <Button onClick={handleDelete}>削除</Button>
  </DialogActions>
</Dialog>
```

### アラート/通知

```tsx
// 成功メッセージ
<Alert severity="success" role="status" aria-live="polite">
  データを保存しました
</Alert>

// エラーメッセージ
<Alert severity="error" role="alert" aria-live="assertive">
  保存に失敗しました
</Alert>

// スクリーンリーダー専用（視覚的に非表示）
import { announce, announceSuccess, announceError } from '@/utils/announcer';

announceSuccess('データを保存しました');
announceError('保存に失敗しました');
```

### ローディング状態

```tsx
// ローディングインジケーター
<CircularProgress aria-label="読み込み中" />

// コンテナ
<Box
  role="status"
  aria-live="polite"
  aria-busy={isLoading}
>
  {isLoading ? <CircularProgress /> : <Content />}
</Box>

// ボタン
<Button
  disabled={isLoading}
  aria-disabled={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? '送信中...' : '送信'}
</Button>
```

### リスト

```tsx
// 基本
<ul role="list">
  <li>項目1</li>
  <li>項目2</li>
</ul>

// 説明付きリスト
<List aria-label="医院一覧">
  <ListItem>医院A</ListItem>
  <ListItem>医院B</ListItem>
</List>
```

### ナビゲーション

```tsx
// メインナビゲーション
<nav aria-label="メインナビゲーション">
  <List>
    <ListItem>
      <Link href="/dashboard">ダッシュボード</Link>
    </ListItem>
  </List>
</nav>

// パンくずリスト
<nav aria-label="パンくずリスト">
  <Breadcrumbs>
    <Link href="/">ホーム</Link>
    <Link href="/dashboard">ダッシュボード</Link>
    <Typography>月次データ</Typography>
  </Breadcrumbs>
</nav>
```

## ユーティリティ使用例

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
      {/* モーダルコンテンツ */}
    </div>
  );
};
```

### スクリーンリーダー通知

```tsx
import { announce, announceSuccess, announceError } from '@/utils/announcer';

// 成功
const handleSave = async () => {
  try {
    await saveData();
    announceSuccess('データを保存しました');
  } catch (error) {
    announceError('保存に失敗しました');
  }
};

// カスタムメッセージ
announce('10件の新着通知があります', 'polite');
```

### 多言語化

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('validation.required', { field: 'メールアドレス' })}</p>

      {/* 言語切り替え */}
      <Button onClick={() => i18n.changeLanguage('en')}>
        English
      </Button>
    </div>
  );
};
```

## カラーコントラスト

### 最小要件

- **通常テキスト**: 4.5:1以上
- **大きいテキスト（18pt以上）**: 3:1以上
- **UIコンポーネント**: 3:1以上

### テーマで定義された色（すべてWCAG AA準拠）

```typescript
primary.main: '#FF6B35'     // コントラスト比: 4.52:1
secondary.main: '#FF9800'   // コントラスト比: 4.63:1
error.main: '#d32f2f'       // コントラスト比: 4.56:1
```

## 見出しレベル

```tsx
// ✅ Good - 階層的な構造
<h1>ページタイトル</h1>
  <h2>セクション1</h2>
    <h3>サブセクション1-1</h3>
  <h2>セクション2</h2>

// ❌ Bad - レベルをスキップ
<h1>ページタイトル</h1>
  <h3>セクション1</h3>  // h2をスキップ
```

## キーボードショートカット

実装時に考慮すべき標準的なキー操作：

- **Tab**: 次の要素へ
- **Shift + Tab**: 前の要素へ
- **Enter**: ボタン/リンクを実行
- **Space**: ボタンを実行、チェックボックスをトグル
- **Escape**: モーダル/ダイアログを閉じる
- **矢印キー**: リスト/メニュー内の移動

## テストコマンド

```bash
# ESLintでアクセシビリティチェック
npm run lint

# 開発サーバー起動（axe-coreが自動実行）
npm run dev

# Lighthouse監査
npm run build
npm run preview
npx lighthouse http://localhost:4173 --only-categories=accessibility
```

## よくある間違い

### ❌ 間違い1: クリック可能な要素にdivを使用

```tsx
// ❌ Bad
<div onClick={handleClick}>クリック</div>

// ✅ Good
<button onClick={handleClick}>クリック</button>
```

### ❌ 間違い2: プレースホルダーをラベルとして使用

```tsx
// ❌ Bad
<input placeholder="メールアドレス" />

// ✅ Good
<TextField
  label="メールアドレス"
  placeholder="example@clinic.com"
/>
```

### ❌ 間違い3: 色だけで情報を伝える

```tsx
// ❌ Bad
<span style={{ color: 'red' }}>必須</span>

// ✅ Good
<span style={{ color: 'red' }}>* 必須</span>
// または
<TextField
  label="メールアドレス"
  required
  aria-required="true"
/>
```

### ❌ 間違い4: フォーカスアウトラインを削除

```css
/* ❌ Bad */
*:focus {
  outline: none;
}

/* ✅ Good - カスタムフォーカススタイルを提供 */
*:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}
```

### ❌ 間違い5: 自動再生メディア

```tsx
// ❌ Bad
<video autoplay />

// ✅ Good
<video controls>
  <track kind="captions" src="captions.vtt" />
</video>
```

## リソース

- [MUI Accessibility](https://mui.com/material-ui/guides/accessibility/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

## 質問がある場合

詳細は以下のドキュメントを参照：
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - 完全なガイドライン
- [ACCESSIBILITY_CHECKLIST.md](./ACCESSIBILITY_CHECKLIST.md) - チェックリスト
- [I18N_GUIDE.md](./I18N_GUIDE.md) - 多言語化ガイド
