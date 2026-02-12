import { test, expect } from '@playwright/test';
import { loginAsClinicOwner } from './helpers/auth.helper';

test.describe('印刷物発注', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/print-orders');
  });

  test('印刷物発注ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /印刷物発注|Print Order/i })).toBeVisible();
  });

  test('価格表が表示される', async ({ page }) => {
    await expect(page.locator('text=/価格表|Price Table/i')).toBeVisible();
  });

  test('商品を選択できる', async ({ page }) => {
    await page.getByLabel(/商品|Product/i).click();
    await page.getByRole('option', { name: /診察券|Patient Card/i }).click();

    await expect(page.getByLabel(/数量|Quantity/i)).toBeVisible();
  });

  test('見積もりを計算できる', async ({ page }) => {
    await page.getByLabel(/商品/i).click();
    await page.getByRole('option', { name: /診察券/i }).click();

    await page.getByLabel(/数量/i).fill('500');

    await page.getByRole('button', { name: /見積|Estimate/i }).click();

    await expect(page.locator('text=/合計.*円|Total.*¥/i')).toBeVisible({ timeout: 5000 });
  });

  test('発注を送信できる', async ({ page }) => {
    await page.getByLabel(/商品/i).click();
    await page.getByRole('option', { name: /診察券/i }).click();

    await page.getByLabel(/数量/i).fill('500');
    await page.getByLabel(/配送先|Delivery Address/i).fill('東京都千代田区千代田1-1');

    await page.getByRole('button', { name: /発注|Order/i }).click();

    await expect(page.locator('text=/発注.*完了|Order completed/i')).toBeVisible({ timeout: 5000 });
  });

  test('発注履歴が表示される', async ({ page }) => {
    await page.goto('/print-orders/history');

    await expect(page.getByRole('heading', { name: /発注履歴|Order History/i })).toBeVisible();
    const historyTable = page.getByRole('table').or(page.locator('[role="grid"]'));
    await expect(historyTable).toBeVisible();
  });

  test('発注詳細を確認できる', async ({ page }) => {
    await page.goto('/print-orders/history');

    const detailButton = page.getByRole('button', { name: /詳細|Detail/i }).first();
    if (await detailButton.isVisible()) {
      await detailButton.click();

      await expect(page.locator('[role="dialog"]').or(page.locator('.detail-modal'))).toBeVisible();
    }
  });
});
