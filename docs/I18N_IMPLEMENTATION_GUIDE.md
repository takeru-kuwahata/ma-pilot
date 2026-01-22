# 国際化（i18n）実装ガイド

## 概要

MA-Pilotでは`react-i18next`を使用して多言語対応を実現しています。現在は日本語と英語に対応しており、将来的には他の言語にも拡張可能な設計となっています。

## 技術スタック

- **react-i18next**: ^13.5.0
- **i18next**: ^23.7.0

## ディレクトリ構造

```
frontend/src/i18n/
├── config.ts                # i18n初期化設定
├── locales/
│   ├── ja.json             # 日本語翻訳ファイル
│   └── en.json             # 英語翻訳ファイル
```

## 設定ファイル

### config.ts

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
    lng: 'ja',                    // デフォルト言語
    fallbackLng: 'ja',            // フォールバック言語
    interpolation: {
      escapeValue: false,         // React側でエスケープされるため不要
    },
    react: {
      useSuspense: false,         // Suspenseを使用しない
    },
  });

export default i18n;
```

## 翻訳ファイルの構造

### ja.json（日本語）

```json
{
  "common": {
    "login": "ログイン",
    "logout": "ログアウト",
    "save": "保存",
    "cancel": "キャンセル"
  },
  "auth": {
    "email": "メールアドレス",
    "password": "パスワード",
    "login_title": "ログイン"
  },
  "dashboard": {
    "title": "経営ダッシュボード",
    "overview": "概要"
  },
  "validation": {
    "required": "{{field}}は必須です",
    "email_invalid": "有効なメールアドレスを入力してください"
  }
}
```

### 翻訳キーの命名規則

1. **カテゴリ別に分類**
   - `common`: 共通で使用される単語・フレーズ
   - `auth`: 認証関連
   - `dashboard`: ダッシュボード関連
   - `clinic`: 医院設定関連
   - `validation`: バリデーションメッセージ

2. **スネークケースを使用**
   - 例: `login_title`, `email_invalid`, `update_success`

3. **動詞_名詞の形式**
   - 例: `generate_report`, `download_file`, `delete_item`

## コンポーネントでの使用方法

### 基本的な使用

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <Button>{t('common.save')}</Button>
    </div>
  );
};
```

### 変数を含む翻訳

```typescript
// 翻訳ファイル
{
  "validation": {
    "required": "{{field}}は必須です"
  }
}

// コンポーネント
const ErrorMessage = ({ fieldName }) => {
  const { t } = useTranslation();

  return <p>{t('validation.required', { field: fieldName })}</p>;
  // 出力: "メールアドレスは必須です"
};
```

### 複数形対応

```typescript
// 翻訳ファイル
{
  "items": {
    "count_one": "{{count}}件のアイテム",
    "count_other": "{{count}}件のアイテム"
  }
}

// コンポーネント
const ItemCount = ({ count }) => {
  const { t } = useTranslation();

  return <p>{t('items.count', { count })}</p>;
};
```

### ARIA属性での使用

```typescript
import { useTranslation } from 'react-i18next';

const AccessibleButton = () => {
  const { t } = useTranslation();

  return (
    <Button
      aria-label={t('common.save')}
      onClick={handleSave}
    >
      {t('common.save')}
    </Button>
  );
};
```

## 言語切り替え

### 実装例

```typescript
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box>
      <Button onClick={() => changeLanguage('ja')}>日本語</Button>
      <Button onClick={() => changeLanguage('en')}>English</Button>
    </Box>
  );
};
```

### 現在の言語を取得

```typescript
const { i18n } = useTranslation();
const currentLanguage = i18n.language; // 'ja' or 'en'
```

## 翻訳ファイルの追加手順

### 1. 新しい翻訳ファイルを作成

```bash
touch frontend/src/i18n/locales/zh.json  # 中国語の例
```

### 2. config.tsに登録

```typescript
import zh from './locales/zh.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      zh: { translation: zh },  // 追加
    },
    // ...
  });
```

### 3. 翻訳ファイルを記述

```json
{
  "common": {
    "login": "登录",
    "logout": "登出",
    "save": "保存",
    "cancel": "取消"
  }
}
```

## ベストプラクティス

### 1. 翻訳キーは明確に

❌ 悪い例:
```json
{
  "btn1": "ログイン",
  "msg": "エラー"
}
```

✅ 良い例:
```json
{
  "auth": {
    "login_button": "ログイン",
    "error_message": "認証エラーが発生しました"
  }
}
```

### 2. 文脈を含める

❌ 悪い例:
```json
{
  "delete": "削除"
}
```

✅ 良い例:
```json
{
  "clinic": {
    "delete_clinic": "医院を削除",
    "delete_confirmation": "本当に削除しますか？"
  }
}
```

### 3. 日本語と英語を同期

翻訳ファイルは常に同じ構造を保ちます。

**ja.json**:
```json
{
  "dashboard": {
    "title": "経営ダッシュボード",
    "revenue": "総売上"
  }
}
```

**en.json**:
```json
{
  "dashboard": {
    "title": "Management Dashboard",
    "revenue": "Total Revenue"
  }
}
```

### 4. TypeScript型定義

```typescript
// types/i18n.d.ts
import 'react-i18next';
import ja from '../i18n/locales/ja.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ja;
    };
  }
}
```

## デバッグ

### 翻訳キーが見つからない場合

```typescript
// config.tsにdebugオプションを追加
i18n.init({
  debug: true,  // 開発環境でのみ有効化
  // ...
});
```

### 翻訳ファイルの検証

```bash
# JSONファイルのバリデーション
npm install -D jsonlint
npx jsonlint frontend/src/i18n/locales/ja.json
```

## パフォーマンス最適化

### 1. 名前空間を使用（大規模プロジェクト向け）

```typescript
// 現在は1つの翻訳ファイルで管理
// 将来的に分割が必要な場合:

i18n.init({
  resources: {
    ja: {
      common: jaCommon,
      dashboard: jaDashboard,
      admin: jaAdmin,
    },
  },
  ns: ['common', 'dashboard', 'admin'],
  defaultNS: 'common',
});
```

### 2. 遅延読み込み（必要に応じて）

```typescript
import i18nextBackend from 'i18next-http-backend';

i18n
  .use(i18nextBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });
```

## テスト

### 翻訳が正しく適用されるかのテスト

```typescript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

describe('Login Component', () => {
  it('日本語で表示される', () => {
    i18n.changeLanguage('ja');

    render(
      <I18nextProvider i18n={i18n}>
        <Login />
      </I18nextProvider>
    );

    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });

  it('英語で表示される', () => {
    i18n.changeLanguage('en');

    render(
      <I18nextProvider i18n={i18n}>
        <Login />
      </I18nextProvider>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
```

## トラブルシューティング

### 問題: 翻訳が表示されない

**原因1**: i18nが初期化されていない
```typescript
// App.tsxで必ずimport
import './i18n/config';
```

**原因2**: 翻訳キーが間違っている
```typescript
// コンソールでキーを確認
console.log(t('dashboard.title')); // デバッグ用
```

**原因3**: JSONファイルのシンタックスエラー
```bash
# JSONを検証
npx jsonlint frontend/src/i18n/locales/ja.json
```

## まとめ

- `useTranslation()`フックを使用して翻訳を取得
- 翻訳ファイルはカテゴリ別に整理
- 日本語と英語のファイル構造を同期
- ARIA属性にも翻訳を適用してアクセシビリティを確保
- デバッグモードで未定義キーを検出

## 参考リンク

- [react-i18next公式ドキュメント](https://react.i18next.com/)
- [i18next公式ドキュメント](https://www.i18next.com/)
