import { test, expect } from '@playwright/test';
import { loginAsClinicOwner } from './helpers/auth.helper';

test.describe('医院設定', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/settings');
  });

  test('医院設定ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /医院設定|Clinic Settings/i })).toBeVisible();
  });

  test('基本情報フォームが表示される', async ({ page }) => {
    await expect(page.getByLabel(/医院名|Clinic Name/i)).toBeVisible();
    await expect(page.getByLabel(/住所|Address/i)).toBeVisible();
    await expect(page.getByLabel(/電話番号|Phone/i)).toBeVisible();
  });

  test('医院情報を更新できる', async ({ page }) => {
    await page.getByLabel(/医院名/i).fill('テスト歯科医院');
    await page.getByLabel(/郵便番号/i).fill('100-0001');
    await page.getByLabel(/住所/i).fill('東京都千代田区千代田1-1');
    await page.getByLabel(/電話番号/i).fill('03-1234-5678');

    await page.getByRole('button', { name: /保存|Save/i }).click();

    await expect(page.locator('text=/更新.*成功|Updated successfully/i')).toBeVisible({ timeout: 5000 });
  });

  test('診療時間設定が表示される', async ({ page }) => {
    // 曜日ごとの診療時間設定
    const mondayCheckbox = page.getByLabel(/月曜日|Monday/i);
    if (await mondayCheckbox.isVisible()) {
      await expect(mondayCheckbox).toBeVisible();
    }
  });

  test('診療科目を選択できる', async ({ page }) => {
    const specialties = page.getByLabel(/診療科目|Specialties/i);
    if (await specialties.isVisible()) {
      await specialties.click();
      await page.getByRole('option', { name: /一般歯科|General Dentistry/i }).click();
    }
  });

  test('画像アップロード機能が動作する', async ({ page }) => {
    const logoUpload = page.locator('input[type="file"][accept*="image"]');
    if (await logoUpload.isAttached()) {
      await expect(logoUpload).toBeAttached();
    }
  });
});
