# 多言語化（i18n）ガイド

## 概要

MA-Pilotは、react-i18nextを使用して多言語化に対応しています。現在は日本語と英語をサポートしており、将来的に他の言語を追加することも容易です。

## アーキテクチャ

### ディレクトリ構造

```
frontend/src/i18n/
├── config.ts           # i18next設定
└── locales/
    ├── ja.json         # 日本語翻訳
    └── en.json         # 英語翻訳
```

### 設定ファイル

**frontend/src/i18n/config.ts**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: 'ja',                // デフォルト言語
    fallbackLng: 'ja',        // フォールバック言語
    interpolation: {
      escapeValue: false,      // Reactは自動的にエスケープ
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

## 使用方法

### 1. コンポーネントでの使用

```tsx
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <h1>{t('auth.login_title')}</h1>
      <TextField label={t('auth.email')} />
      <TextField label={t('auth.password')} />
      <Button>{t('common.login')}</Button>
    </Box>
  );
};
```

### 2. 変数の埋め込み

```tsx
// 翻訳ファイル
{
  "validation": {
    "required": "{{field}}は必須です",
    "min_length": "{{field}}は{{min}}文字以上で入力してください"
  }
}

// コンポーネント
const { t } = useTranslation();

const emailError = t('validation.required', { field: 'メールアドレス' });
// => "メールアドレスは必須です"

const passwordError = t('validation.min_length', {
  field: 'パスワード',
  min: 8
});
// => "パスワードは8文字以上で入力してください"
```

### 3. 複数形の処理

```tsx
// 翻訳ファイル
{
  "items": {
    "count_one": "{{count}}件のアイテム",
    "count_other": "{{count}}件のアイテム"
  }
}

// コンポーネント
const { t } = useTranslation();

const message = t('items.count', { count: 5 });
// => "5件のアイテム"
```

### 4. 言語切り替え

```tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // ローカルストレージに保存（オプション）
    localStorage.setItem('language', lng);
  };

  return (
    <Select value={i18n.language} onChange={(e) => changeLanguage(e.target.value)}>
      <MenuItem value="ja">日本語</MenuItem>
      <MenuItem value="en">English</MenuItem>
    </Select>
  );
};
```

## 翻訳ファイルの構造

### 命名規則

翻訳キーは、ドットで区切られた階層構造を使用します。

```json
{
  "カテゴリ": {
    "サブカテゴリ": {
      "キー": "翻訳テキスト"
    }
  }
}
```

### カテゴリ

- **common**: 共通の単語やフレーズ（ボタン、アクション等）
- **auth**: 認証関連
- **dashboard**: ダッシュボード関連
- **clinic**: 医院設定関連
- **staff**: スタッフ管理関連
- **simulation**: シミュレーション関連
- **report**: レポート関連
- **market**: 診療圏分析関連
- **validation**: バリデーションメッセージ
- **accessibility**: アクセシビリティ関連

### 例

**ja.json:**
```json
{
  "common": {
    "login": "ログイン",
    "logout": "ログアウト",
    "submit": "送信",
    "cancel": "キャンセル"
  },
  "auth": {
    "email": "メールアドレス",
    "password": "パスワード",
    "login_title": "ログイン"
  },
  "validation": {
    "required": "{{field}}は必須です",
    "email_invalid": "有効なメールアドレスを入力してください"
  }
}
```

**en.json:**
```json
{
  "common": {
    "login": "Login",
    "logout": "Logout",
    "submit": "Submit",
    "cancel": "Cancel"
  },
  "auth": {
    "email": "Email",
    "password": "Password",
    "login_title": "Login"
  },
  "validation": {
    "required": "{{field}} is required",
    "email_invalid": "Please enter a valid email address"
  }
}
```

## 新規言語の追加

### 1. 翻訳ファイルを作成

```bash
# 例: 中国語（簡体字）を追加
frontend/src/i18n/locales/zh-CN.json
```

### 2. config.tsに追加

```typescript
import zhCN from './locales/zh-CN.json';

i18n.init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  // ...
});
```

### 3. 翻訳を追加

既存の日本語または英語のJSONファイルをコピーして、すべてのキーを翻訳します。

## 日時・通貨のフォーマット

### 日時

```tsx
import { useTranslation } from 'react-i18next';

const DateDisplay = ({ date }: { date: Date }) => {
  const { i18n } = useTranslation();

  const formatted = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  return <span>{formatted}</span>;
};

// 日本語: 2025年1月15日
// 英語: January 15, 2025
```

### 通貨

```tsx
import { useTranslation } from 'react-i18next';

const PriceDisplay = ({ amount }: { amount: number }) => {
  const { i18n } = useTranslation();

  const formatted = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: i18n.language === 'ja' ? 'JPY' : 'USD',
  }).format(amount);

  return <span>{formatted}</span>;
};

// 日本語: ¥10,000
// 英語: $10,000.00
```

## ベストプラクティス

### 1. ハードコードしない

```tsx
// Bad
<Button>ログイン</Button>

// Good
<Button>{t('common.login')}</Button>
```

### 2. 意味のあるキー名

```tsx
// Bad
{t('text1')}
{t('btn2')}

// Good
{t('auth.login_button')}
{t('dashboard.title')}
```

### 3. コンテキストを含める

```tsx
// Bad（曖昧）
{t('save')}

// Good（明確）
{t('clinic.save_settings')}
{t('staff.save_member')}
```

### 4. 変数名は明確に

```tsx
// Bad
{t('error', { x: value })}

// Good
{t('validation.min_length', { field: 'パスワード', min: 8 })}
```

### 5. フォールバックを設定

```tsx
// デフォルトテキストを設定（翻訳が見つからない場合）
{t('some.missing.key', { defaultValue: 'Default text' })}
```

## テスト

### 1. 翻訳の完全性チェック

すべての翻訳ファイルが同じキーを持っているか確認します。

```typescript
// scripts/check-translations.ts
import ja from '../frontend/src/i18n/locales/ja.json';
import en from '../frontend/src/i18n/locales/en.json';

const jaKeys = Object.keys(flattenObject(ja));
const enKeys = Object.keys(flattenObject(en));

const missingInEn = jaKeys.filter(key => !enKeys.includes(key));
const missingInJa = enKeys.filter(key => !jaKeys.includes(key));

if (missingInEn.length > 0) {
  console.error('Missing in en.json:', missingInEn);
}

if (missingInJa.length > 0) {
  console.error('Missing in ja.json:', missingInJa);
}
```

### 2. コンポーネントテスト

```tsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

test('renders login button', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <LoginPage />
    </I18nextProvider>
  );

  expect(screen.getByText('ログイン')).toBeInTheDocument();
});
```

## トラブルシューティング

### 翻訳が表示されない

1. キーが正しいか確認
2. 翻訳ファイルに該当のキーが存在するか確認
3. i18n設定が正しくインポートされているか確認

```tsx
// デバッグ用
console.log('Current language:', i18n.language);
console.log('Available languages:', i18n.languages);
console.log('Translation:', t('your.key'));
```

### 言語切り替えが反映されない

コンポーネントがuseTranslationフックを使用していることを確認します。

```tsx
// Bad（再レンダリングされない）
import i18n from '@/i18n/config';
const text = i18n.t('common.login');

// Good（言語変更時に再レンダリング）
const { t } = useTranslation();
const text = t('common.login');
```

## 将来の拡張

### Phase 11での対応予定

- [ ] 言語設定の永続化（ユーザープロファイル）
- [ ] 地域別の日時・通貨フォーマット
- [ ] 右から左への言語サポート（RTL）
- [ ] 翻訳管理システムの導入
- [ ] 自動翻訳ツールの統合

## リソース

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Intl API (MDN)](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Intl)

## サポート

翻訳に関する問題や新しい言語の追加リクエストは、GitHubのIssueで報告してください。
