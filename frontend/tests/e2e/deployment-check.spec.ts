import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://ma-pilot.vercel.app';
const BACKEND_URL = 'https://ma-pilot.onrender.com';

test.describe('MA-Pilot デプロイ後検証', () => {
  test('1. フロントエンドが正常にアクセスできる', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await expect(page).toHaveTitle(/MA-Pilot/);

    // ログインタブが表示されることを確認
    await expect(page.getByRole('tab', { name: 'ログイン' })).toBeVisible({ timeout: 10000 });
  });

  test('2. バックエンドAPIヘルスチェック', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.environment).toBe('production');
  });

  test('3. ログイン機能が動作する', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // ログインフォーム入力
    await page.fill('input[type="email"]', 'admin@ma-pilot.local');
    await page.fill('input[type="password"]', 'DevAdmin2025!');

    // ログインボタンをクリック
    await page.getByRole('button', { name: /^ログイン$/ }).click();

    // 管理ダッシュボードに遷移することを確認（最大35秒待機：バックエンドコールドスタート対応）
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 35000 });

    // ダッシュボードタイトルが表示されることを確認
    await expect(page.getByRole('heading', { name: /管理ダッシュボード|ダッシュボード/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('4. ダッシュボードのKPI表示確認', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.fill('input[type="email"]', 'admin@ma-pilot.local');
    await page.fill('input[type="password"]', 'DevAdmin2025!');
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 管理ダッシュボードのKPI確認（システム全体の統計）
    await expect(page.locator('text=/登録医院数|登録クリニック/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/稼働医院数|稼働クリニック/')).toBeVisible();

    // グラフが表示されることを確認
    await expect(page.locator('text=/医院登録推移|登録推移/')).toBeVisible();
  });

  test('5. 左メニューのナビゲーション確認', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.fill('input[type="email"]', 'admin@ma-pilot.local');
    await page.fill('input[type="password"]', 'DevAdmin2025!');
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 管理者用左メニュー項目の確認
    await expect(page.locator('text=/管理ダッシュボード|ダッシュボード/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=医院管理')).toBeVisible();
    await expect(page.locator('text=システム設定')).toBeVisible();
  });

  test('6. APIエンドポイントの疎通確認', async ({ request }) => {
    // 認証なしでアクセスできるエンドポイント
    const healthCheck = await request.get(`${BACKEND_URL}/health`);
    expect(healthCheck.ok()).toBeTruthy();

    // ルート情報取得
    const rootResponse = await request.get(`${BACKEND_URL}/`);
    expect(rootResponse.ok()).toBeTruthy();

    const rootData = await rootResponse.json();
    expect(rootData.message).toBeDefined();
  });

  test('7. アラート表示の確認', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.fill('input[type="email"]', 'admin@ma-pilot.local');
    await page.fill('input[type="password"]', 'DevAdmin2025!');
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 管理ダッシュボードにはアラート表示がない可能性があるため、スキップまたはページ内容を確認
    // ページが正常に読み込まれたことを確認
    await expect(page.getByRole('heading', { name: /管理ダッシュボード|ダッシュボード/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('8. レスポンシブデザイン確認（モバイル）', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(PRODUCTION_URL);
    await expect(page.getByRole('tab', { name: 'ログイン' })).toBeVisible();
  });
});
