import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://ma-pilot.vercel.app';
const BACKEND_URL = 'https://ma-pilot.onrender.com';

test.describe('MA-Pilot デプロイ後検証', () => {
  test('1. フロントエンドが正常にアクセスできる', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await expect(page).toHaveTitle(/MA-Pilot/);

    // ログインページが表示されることを確認
    await expect(page.locator('text=ログイン')).toBeVisible({ timeout: 10000 });
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
    await page.click('button[type="submit"]');

    // ダッシュボードに遷移することを確認（最大30秒待機）
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    // ダッシュボードタイトルが表示されることを確認
    await expect(page.locator('text=経営ダッシュボード')).toBeVisible();
  });

  test('4. ダッシュボードのKPI表示確認', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.fill('input[type="email"]', 'admin@ma-pilot.local');
    await page.fill('input[type="password"]', 'DevAdmin2025!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    // KPIカードが表示されることを確認
    await expect(page.locator('text=総売上')).toBeVisible();
    await expect(page.locator('text=営業利益')).toBeVisible();
    await expect(page.locator('text=粗利率')).toBeVisible();
    await expect(page.locator('text=総患者数')).toBeVisible();

    // グラフが表示されることを確認
    await expect(page.locator('text=売上・利益推移')).toBeVisible();
    await expect(page.locator('text=患者数推移')).toBeVisible();
  });

  test('5. 左メニューのナビゲーション確認', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.fill('input[type="email"]', 'admin@ma-pilot.local');
    await page.fill('input[type="password"]', 'DevAdmin2025!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    // 左メニュー項目の確認
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
    await expect(page.locator('text=基礎データ管理')).toBeVisible();
    await expect(page.locator('text=診療圏分析')).toBeVisible();
    await expect(page.locator('text=経営シミュレーション')).toBeVisible();
    await expect(page.locator('text=レポート管理')).toBeVisible();
    await expect(page.locator('text=医院設定')).toBeVisible();
    await expect(page.locator('text=スタッフ管理')).toBeVisible();
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
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    // アラートが表示されることを確認（スクリーンショットに表示されている）
    await expect(page.locator('text=目標率が低下しています')).toBeVisible();
    await expect(page.locator('text=粗利率が目標を下回っています')).toBeVisible();
  });

  test('8. レスポンシブデザイン確認（モバイル）', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(PRODUCTION_URL);
    await expect(page.locator('text=ログイン')).toBeVisible();
  });
});
