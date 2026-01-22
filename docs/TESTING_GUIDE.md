# MA-Pilot テストガイド

## 概要

MA-Pilotプロジェクトでは、バックエンド（Python/FastAPI）とフロントエンド（React/TypeScript）の両方で包括的なテストカバレッジを実装しています。

## テスト構成

### バックエンドテスト（Python/pytest）

#### 依存関係

```txt
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
pytest-cov==4.1.0
```

#### ディレクトリ構造

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # テスト設定・フィクスチャ
│   ├── test_auth.py             # 認証APIテスト
│   ├── test_clinics.py          # 医院データAPIテスト
│   ├── test_monthly_data.py     # 月次データAPIテスト
│   ├── test_dashboard.py        # ダッシュボードAPIテスト
│   ├── test_simulations.py      # シミュレーションAPIテスト
│   ├── test_reports.py          # レポートAPIテスト
│   ├── test_market_analysis.py  # 診療圏分析APIテスト
│   ├── test_staff.py            # スタッフ管理APIテスト
│   ├── test_admin.py            # 管理者APIテスト
│   └── test_print_orders.py     # 印刷物受注APIテスト
├── pytest.ini                   # pytest設定
└── run_tests.sh                 # テスト実行スクリプト
```

#### テスト実行方法

##### 全テスト実行（カバレッジ付き）

```bash
cd backend
./run_tests.sh
```

または

```bash
cd backend
pytest -v --cov=src --cov-report=term-missing --cov-report=html
```

##### 特定のテストファイル実行

```bash
./run_tests.sh -f print_orders
# または
pytest -v tests/test_print_orders.py
```

##### 特定のテストクラス実行

```bash
./run_tests.sh -c TestPriceTables
# または
pytest -v -k "TestPriceTables"
```

##### カバレッジなしで実行

```bash
./run_tests.sh --no-cov
```

#### カバレッジレポート

- ターミナル出力: テスト実行時に表示
- HTML形式: `backend/htmlcov/index.html`

### フロントエンドテスト（React/Vitest）

#### 依存関係

```json
{
  "@testing-library/react": "^14.1.2",
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/user-event": "^14.5.1",
  "vitest": "^1.0.4",
  "@vitest/ui": "^1.0.4",
  "@vitest/coverage-v8": "^1.0.4",
  "jsdom": "^23.0.1"
}
```

#### ディレクトリ構造

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── pages/
│   │   │   ├── Login.test.tsx
│   │   │   ├── Dashboard.test.tsx
│   │   │   ├── DataManagement.test.tsx
│   │   │   ├── MarketAnalysis.test.tsx
│   │   │   ├── Simulation.test.tsx
│   │   │   ├── Reports.test.tsx
│   │   │   ├── ClinicSettings.test.tsx
│   │   │   ├── StaffManagement.test.tsx
│   │   │   ├── PrintOrderForm.test.tsx
│   │   │   ├── PrintOrderHistory.test.tsx
│   │   │   └── PriceTableManagement.test.tsx
│   │   ├── services/
│   │   │   ├── authService.test.ts
│   │   │   ├── clinicService.test.ts
│   │   │   └── printOrderService.test.ts
│   │   └── utils/
│   │       ├── mockData.test.ts
│   │       └── formatters.test.ts
│   └── setupTests.ts            # テストセットアップ
└── vitest.config.ts             # Vitest設定
```

#### テスト実行方法

##### 全テスト実行

```bash
cd frontend
npm test
```

##### テストUI（インタラクティブ）

```bash
cd frontend
npm run test:ui
```

##### カバレッジ付きテスト

```bash
cd frontend
npm run test:coverage
```

##### ウォッチモード

```bash
cd frontend
npm test -- --watch
```

#### カバレッジレポート

- ターミナル出力: テスト実行時に表示
- HTML形式: `frontend/coverage/index.html`

## CI/CD統合

### GitHub Actions

`.github/workflows/test.yml`により、以下のタイミングで自動テストが実行されます：

- プルリクエスト作成時
- mainブランチへのプッシュ時
- developブランチへのプッシュ時

#### 実行内容

1. **バックエンドテスト**
   - Python 3.11環境セットアップ
   - 依存関係インストール
   - pytestによるテスト実行
   - カバレッジレポート生成・アップロード

2. **フロントエンドテスト**
   - Node.js 18環境セットアップ
   - 依存関係インストール
   - vitestによるテスト実行
   - カバレッジレポート生成・アップロード

3. **Lint & 型チェック**
   - ESLint実行
   - TypeScript型チェック

## テストコード記述ガイドライン

### バックエンド（pytest）

#### 基本構造

```python
import pytest
from httpx import AsyncClient
from fastapi import status

@pytest.mark.asyncio
class TestSomeFeature:
    '''機能のテストクラス'''

    async def test_success_case(self, async_client: AsyncClient):
        '''正常系テスト'''
        response = await async_client.get('/api/endpoint')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), dict)

    async def test_error_case(self, async_client: AsyncClient):
        '''異常系テスト'''
        response = await async_client.get('/api/nonexistent')
        assert response.status_code == status.HTTP_404_NOT_FOUND
```

#### フィクスチャ活用

`conftest.py`に定義されたフィクスチャを活用：

- `mock_supabase`: Supabaseクライアントモック
- `mock_auth_user`: 認証済みユーザーモック
- `async_client`: FastAPI AsyncClient
- `sample_print_order`: サンプル印刷物受注データ
- `sample_clinic_data`: サンプル医院データ
- `sample_monthly_data`: サンプル月次データ

### フロントエンド（Vitest + React Testing Library）

#### 基本構造

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from '../../pages/MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );
    expect(screen.getByText(/some text/i)).toBeDefined();
  });
});
```

#### ユーザーインタラクションテスト

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Form Component', () => {
  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<FormComponent />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    expect(input).toHaveValue('test value');
  });
});
```

## テストカバレッジ目標

- 全体: 70%以上
- 重要機能（印刷物受注、認証、決済）: 85%以上

## トラブルシューティング

### バックエンド

#### 問題: `ModuleNotFoundError`

```bash
# 仮想環境のアクティベート確認
cd backend
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 依存関係再インストール
pip install -r requirements.txt
```

#### 問題: テストデータベース接続エラー

```bash
# 環境変数設定確認
echo $DATABASE_URL
echo $SUPABASE_URL

# .env.localファイル確認
cat backend/.env.local
```

### フロントエンド

#### 問題: `Cannot find module`

```bash
# node_modules削除・再インストール
cd frontend
rm -rf node_modules
npm install
```

#### 問題: テストタイムアウト

```typescript
// vitest.config.tsでタイムアウト延長
export default defineConfig({
  test: {
    testTimeout: 10000, // 10秒に延長
  },
});
```

#### 問題: JSDOM関連エラー

```bash
# jsdom再インストール
npm install --save-dev jsdom@latest
```

## ベストプラクティス

### 1. テストの独立性

各テストは独立して実行可能である必要があります。

```python
# 良い例
@pytest.fixture
def clean_database():
    # テスト前にデータベースクリア
    yield
    # テスト後にクリーンアップ
```

### 2. モックの活用

外部APIやデータベースはモックを使用します。

```typescript
vi.mock('../../services/api', () => ({
  fetchData: vi.fn(() => Promise.resolve(mockData)),
}));
```

### 3. わかりやすいテスト名

テスト名は何をテストしているか明確にします。

```python
# 良い例
async def test_create_print_order_with_invalid_email_returns_400(self):
    pass

# 悪い例
async def test_order_creation(self):
    pass
```

### 4. AAA パターン

- **Arrange**: テストデータ準備
- **Act**: テスト対象実行
- **Assert**: 結果検証

```python
async def test_example(self):
    # Arrange
    data = {'name': 'test'}

    # Act
    response = await client.post('/api/endpoint', json=data)

    # Assert
    assert response.status_code == 200
```

## 今後の拡張

### Phase 11以降で追加予定

1. **E2Eテスト（Playwright）**
   - ユーザーフロー全体のテスト
   - ブラウザ自動操作

2. **パフォーマンステスト（Locust）**
   - 負荷テスト
   - スループット測定

3. **セキュリティテスト**
   - SQL Injection対策確認
   - XSS対策確認
   - CSRF対策確認

4. **アクセシビリティテスト**
   - WCAG 2.1準拠確認
   - スクリーンリーダー対応

## 参考資料

- [pytest公式ドキュメント](https://docs.pytest.org/)
- [Vitest公式ドキュメント](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## 更新履歴

- 2025-12-26: 初版作成（Phase 4完了時）
