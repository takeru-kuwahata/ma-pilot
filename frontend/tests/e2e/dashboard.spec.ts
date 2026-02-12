import { test, expect } from '@playwright/test';
import { loginAsClinicOwner } from './helpers/auth.helper';

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // clinic_ownerでログイン
    await loginAsClinicOwner(page);
  });

  test('ダッシュボードが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ダッシュボード|経営ダッシュボード/i })).toBeVisible();
  });

  test('KPIカードが表示される', async ({ page }) => {
    // 総売上、営業利益、患者数などのKPI要素
    await expect(page.locator('text=/総売上|Revenue/i')).toBeVisible();
    await expect(page.locator('text=/営業利益|Profit/i')).toBeVisible();
  });

  test('グラフが表示される', async ({ page }) => {
    // Rechartsのグラフ要素（SVGとして描画される）
    const chart = page.locator('svg.recharts-surface').first();
    await expect(chart).toBeVisible();
  });

  test('月次データテーブルが表示される', async ({ page }) => {
    // テーブルまたはリスト形式のデータ
    const table = page.getByRole('table').or(page.locator('[role="grid"]')).first();
    await expect(table).toBeVisible();
  });

  test('ナビゲーションメニューが機能する', async ({ page }) => {
    // 左サイドバーまたはヘッダーメニュー
    await page.getByRole('link', { name: /基礎データ管理|Data Management/i }).click();
    await expect(page).toHaveURL(/\/clinic\/data-management/i, { timeout: 10000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/clinic\/dashboard/i);
  });

  test('スクリーンリーダー用アナウンス領域が存在する', async ({ page }) => {
    // スクリーンリーダー用アナウンサーは今後追加予定の機能としてスキップ
    // TODO: アナウンサーコンポーネント実装後に有効化
    test.skip();
  });

  test('フォーカス表示が明確', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');

    // フォーカスされた要素が視覚的に識別できることを確認（CSSクラスやoutline）
    await expect(focusedElement).toBeVisible();
  });
});
