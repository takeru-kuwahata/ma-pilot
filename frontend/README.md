# MA-Lstep フロントエンド

歯科医院経営分析システム - フロントエンド

## 技術スタック

- **React** 18.2
- **TypeScript** 5.3
- **Vite** 5.0
- **MUI (Material-UI)** v6
- **React Router** v6
- **Zustand** (状態管理)
- **React Query** (サーバー状態管理)
- **Supabase** (認証・データベース)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env.local`にコピーして、実際の値を設定してください。

```bash
cp .env.example .env.local
```

`.env.local`を編集：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_BACKEND_URL=http://localhost:8432
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3247 が自動的に開きます。

## スクリプト

- `npm run dev` - 開発サーバーを起動 (ポート3247)
- `npm run build` - 本番用ビルド
- `npm run preview` - ビルド結果のプレビュー
- `npm run lint` - ESLintによるコードチェック
- `npm run type-check` - TypeScriptの型チェック

## プロジェクト構造

```
frontend/
├── public/           # 静的ファイル
├── src/
│   ├── assets/      # 画像、アイコンなどのアセット
│   ├── components/  # 再利用可能なコンポーネント
│   ├── pages/       # ページコンポーネント
│   ├── services/    # API通信、Supabase設定
│   ├── stores/      # Zustand状態管理
│   ├── types/       # TypeScript型定義
│   ├── utils/       # ユーティリティ関数
│   ├── theme/       # MUIテーマ設定
│   ├── App.tsx      # ルートコンポーネント
│   └── main.tsx     # エントリーポイント
├── .env.local       # 環境変数（Gitに含めない）
├── .env.example     # 環境変数のサンプル
├── index.html       # HTMLテンプレート
├── package.json
├── tsconfig.json    # TypeScript設定
└── vite.config.ts   # Vite設定
```

## 開発ガイド

### コーディング規約

- **ファイル名**: PascalCase (例: `DashboardCard.tsx`)
- **変数・関数**: camelCase (例: `fetchClinicData`)
- **定数**: UPPER_SNAKE_CASE (例: `MAX_FILE_SIZE`)
- **型/インターフェース**: PascalCase (例: `Clinic`, `UserRole`)
- **インデント**: スペース2つ
- **クォート**: シングルクォート

### 型定義

型定義は `src/types/index.ts` で一元管理されています。
バックエンドの型定義と常に同期させてください。

## Phase 3 完了内容

✅ React + TypeScript + Vite環境構築
✅ MUI v6テーマ設定
✅ React Router v6設定
✅ Zustand状態管理セットアップ
✅ Supabase接続設定
✅ 環境変数設定

## 次のステップ

Phase 4でページ実装を行います：

- P-001: ログイン/アカウント作成
- P-002: 経営ダッシュボード
- P-003: 基礎データ管理
- P-004: 診療圏分析
- P-005: 経営シミュレーション
- P-006: レポート生成・管理
- P-007: 医院設定・スタッフ管理
