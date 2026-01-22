import { test, expect } from '@playwright/test';

test.describe('基礎データ管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/data-management');
  });

  test('基礎データ管理ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /基礎データ管理|Data Management/i })).toBeVisible();
  });

  test('月次データ入力フォームが表示される', async ({ page }) => {
    await expect(page.getByLabel(/総売上|Total Revenue/i)).toBeVisible();
    await expect(page.getByLabel(/新患数|New Patients/i)).toBeVisible();
  });

  test('月次データを登録できる', async ({ page }) => {
    await page.getByLabel(/総売上/i).fill('5000000');
    await page.getByLabel(/新患数/i).fill('25');
    await page.getByLabel(/再診患者数/i).fill('120');

    await page.getByRole('button', { name: /保存|Save/i }).click();

    // 成功メッセージまたは確認
    await expect(page.locator('text=/成功|Success/i')).toBeVisible({ timeout: 5000 });
  });

  test('CSVインポート機能が動作する', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // CSV選択ボタンまたはドロップゾーン
    await expect(page.getByRole('button', { name: /CSV.*インポート|Import CSV/i })).toBeVisible();
  });

  test('データテーブルでソートができる', async ({ page }) => {
    // 年月カラムヘッダーをクリック
    const header = page.getByRole('columnheader', { name: /年月|Month/i });
    if (await header.isVisible()) {
      await header.click();

      // ソートアイコンや順序が変更されることを確認
      await expect(header).toHaveAttribute('aria-sort', /.+/);
    }
  });

  test('フォームバリデーションが動作する', async ({ page }) => {
    // 数値項目に不正な値を入力
    await page.getByLabel(/総売上/i).fill('-1000');
    await page.getByRole('button', { name: /保存/i }).click();

    await expect(page.locator('text=/0以上|positive/i')).toBeVisible();
  });

  test('自動計算が動作する', async ({ page }) => {
    await page.getByLabel(/保険診療売上/i).fill('3000000');
    await page.getByLabel(/自費診療売上/i).fill('2000000');

    // 総売上が自動計算される
    const totalRevenue = page.getByLabel(/総売上/i);
    await expect(totalRevenue).toHaveValue(/5,?000,?000/);
  });
});
