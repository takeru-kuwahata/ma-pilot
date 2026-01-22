# MA-Pilot 開発者ガイド

## 目次

- [開発環境構築](#開発環境構築)
- [コーディング規約](#コーディング規約)
- [Git Workflow](#git-workflow)
- [ブランチ戦略](#ブランチ戦略)
- [プルリクエストプロセス](#プルリクエストプロセス)
- [コードレビュー基準](#コードレビュー基準)
- [トラブルシューティング](#トラブルシューティング)

---

## 開発環境構築

### 必須ツール

- **Node.js**: 18.x以上
- **Python**: 3.11以上
- **Git**: 最新版
- **VSCode**: 推奨エディタ

### VSCode推奨拡張機能

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### 初回セットアップ

#### 1. リポジトリクローン

```bash
git clone https://github.com/takeru-kuwahata/ma-pilot.git
cd ma-pilot
```

#### 2. フロントエンド

```bash
cd frontend
npm install
cp .env.example .env.local
# .env.localを編集してSupabase情報を設定
npm run dev  # http://localhost:3247
```

#### 3. バックエンド

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .envを編集してSupabase情報を設定
python main.py  # http://localhost:8432
```

#### 4. Supabaseセットアップ

1. [Supabase](https://supabase.com)でプロジェクト作成
2. SQL Editorで`backend/supabase_schema.sql`を実行
3. 環境変数に`SUPABASE_URL`と`SUPABASE_KEY`を設定

---

## コーディング規約

### 命名規則

#### ファイル名

- **コンポーネント**: `PascalCase.tsx` (例: `DashboardCard.tsx`)
- **ページ**: `PascalCase.tsx` (例: `ClinicDashboard.tsx`)
- **ユーティリティ**: `camelCase.ts` (例: `formatCurrency.ts`)
- **定数**: `UPPER_SNAKE_CASE.ts` (例: `API_ENDPOINTS.ts`)

#### 変数・関数

- **変数**: `camelCase` (例: `clinicData`, `totalRevenue`)
- **関数**: `camelCase` (例: `calculateProfit`, `fetchClinicData`)
- **定数**: `UPPER_SNAKE_CASE` (例: `MAX_FILE_SIZE`)
- **型/インターフェース**: `PascalCase` (例: `Clinic`, `MonthlyData`)

#### データベーステーブル名

- **スネークケース、複数形**: `clinics`, `monthly_data`, `simulations`

### TypeScript

#### strict mode有効

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 型定義は必須

```typescript
// ✅ Good
const fetchClinic = async (id: string): Promise<Clinic> => {
  // ...
};

// ❌ Bad
const fetchClinic = async (id) => {
  // ...
};
```

### React

#### 関数コンポーネント使用

```tsx
// ✅ Good
export const DashboardCard: React.FC<Props> = ({ title, value }) => {
  return <div>{title}: {value}</div>;
};

// ❌ Bad（クラスコンポーネントは使用しない）
class DashboardCard extends React.Component {
  // ...
}
```

#### Hooks命名規則

```typescript
// カスタムフックは必ず`use`で開始
export const useClinicData = (clinicId: string) => {
  // ...
};
```

### Python

#### PEP 8準拠

- インデント: スペース4つ
- 行の長さ: 最大120文字
- 関数名: `snake_case`
- クラス名: `PascalCase`

#### 型ヒント必須

```python
# ✅ Good
def calculate_profit(revenue: float, cost: float) -> float:
    return revenue - cost

# ❌ Bad
def calculate_profit(revenue, cost):
    return revenue - cost
```

### フォーマット

#### JavaScript/TypeScript

- **ツール**: ESLint + Prettier
- **インデント**: スペース2つ
- **セミコロン**: あり
- **クォート**: シングル

#### Python

- **ツール**: Ruff（Linter + Formatter）
- **インデント**: スペース4つ
- **行の長さ**: 最大120文字

### コメント

#### JSDoc形式

```typescript
/**
 * 医院データを取得する
 * @param clinicId - 医院ID
 * @returns 医院データ
 * @throws {Error} 医院が見つからない場合
 */
export const fetchClinic = async (clinicId: string): Promise<Clinic> => {
  // ...
};
```

---

## Git Workflow

### ブランチ戦略

```
main (保護ブランチ)
  └─ feature/機能名
  └─ fix/バグ修正名
  └─ refactor/リファクタリング名
```

### ブランチ命名規則

- **機能追加**: `feature/add-dashboard-kpi`
- **バグ修正**: `fix/login-validation-error`
- **リファクタリング**: `refactor/extract-api-service`

### コミットメッセージ

#### Conventional Commits形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### タイプ

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル修正（動作に影響なし）
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

#### 例

```bash
git commit -m "feat(dashboard): KPI表示機能を追加"
git commit -m "fix(auth): ログイン時のバリデーションエラーを修正"
git commit -m "docs: README.mdにセットアップ手順を追加"
```

---

## プルリクエストプロセス

### 作成前チェックリスト

- [ ] Lint・型チェックパス
- [ ] テスト追加・実行
- [ ] 既存テストが全てパス
- [ ] ドキュメント更新（必要に応じて）
- [ ] コミットメッセージ整理

### PR作成

1. GitHubでプルリクエスト作成
2. タイトル: `[feat] KPI表示機能を追加`
3. 説明: 変更内容、テスト方法を記載

### PRテンプレート

```markdown
## 変更内容

- KPI表示機能を実装
- ダッシュボードにグラフ追加

## テスト方法

1. `npm run dev`でフロントエンド起動
2. `/dashboard`にアクセス
3. KPIカードが表示されることを確認

## スクリーンショット

（あれば添付）

## チェックリスト

- [x] Lintパス
- [x] 型チェックパス
- [x] テスト追加・実行
- [x] ドキュメント更新
```

---

## コードレビュー基準

### レビューポイント

#### 機能性

- [ ] 要件を満たしているか
- [ ] エッジケースを考慮しているか
- [ ] エラーハンドリングが適切か

#### コード品質

- [ ] 命名規則に準拠しているか
- [ ] 重複コードがないか
- [ ] 型定義が適切か

#### セキュリティ

- [ ] APIキーがハードコードされていないか
- [ ] SQLインジェクション対策があるか
- [ ] XSS対策があるか

#### パフォーマンス

- [ ] 不要な再レンダリングがないか
- [ ] N+1クエリがないか
- [ ] 適切なキャッシング戦略か

### レビューコメント例

```markdown
<!-- 良い例 -->
💡 Suggestion: `useMemo`を使ってパフォーマンス改善できそうです
🐛 Bug: ログアウト時に状態がクリアされていません
✅ LGTM: 完璧です！

<!-- 悪い例 -->
これ違う（具体的な指摘がない）
直して（何をどう直すか不明確）
```

---

## テスト

### フロントエンドテスト

```bash
npm run type-check  # TypeScript型チェック
npm run lint        # ESLint
```

### バックエンドテスト

```bash
pytest                    # 全テスト実行
pytest --cov=src         # カバレッジ付き
pytest tests/api/        # APIテストのみ
```

### テスト作成ガイドライン

- **ユニットテスト**: 関数・コンポーネント単位
- **統合テスト**: API・データベース連携
- **カバレッジ目標**: 80%以上

---

## デバッグ

### フロントエンド

- **React DevTools**: コンポーネント階層確認
- **Redux DevTools**: 状態確認（Zustand連携）
- **Network Tab**: API通信確認

### バックエンド

- **FastAPI Docs**: `/docs`でインタラクティブテスト
- **ログ出力**: `print()`ではなく`logging`使用
- **Supabase Logs**: SQL実行履歴確認

---

## トラブルシューティング

### ポート競合

```bash
# ポート3247が使用中の場合
lsof -ti:3247 | xargs kill -9

# ポート8432が使用中の場合
lsof -ti:8432 | xargs kill -9
```

### node_modules破損

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Python仮想環境問題

```bash
cd backend
deactivate  # 既存の仮想環境を無効化
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

**最終更新**: 2025年12月26日
