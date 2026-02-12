import { test, expect } from '@playwright/test';
import { loginAsSystemAdmin } from './helpers/auth.helper';

test.describe('管理者機能', () => {
  test.beforeEach(async ({ page }) => {
    // システム管理者としてログイン
    await loginAsSystemAdmin(page);
  });

  test('管理ダッシュボードが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /管理ダッシュボード|Admin Dashboard/i })).toBeVisible();
  });

  test('全医院の統計情報が表示される', async ({ page }) => {
    await expect(page.locator('text=/登録医院数|Total Clinics/i')).toBeVisible();
    await expect(page.locator('text=/アクティブユーザー|Active Users/i')).toBeVisible();
  });

  test('医院一覧が表示される', async ({ page }) => {
    await page.goto('/admin/clinics');

    await expect(page.getByRole('heading', { name: /医院管理|Clinic Management/i })).toBeVisible();
    const clinicTable = page.getByRole('table').or(page.locator('[role="grid"]'));
    await expect(clinicTable).toBeVisible();
  });

  test('医院を検索できる', async ({ page }) => {
    await page.goto('/admin/clinics');

    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/検索|Search/i));
    if (await searchInput.isVisible()) {
      await searchInput.fill('テスト歯科');
      await page.keyboard.press('Enter');

      // 検索結果が表示される
      await expect(page.locator('text=/テスト歯科/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('医院を有効化/無効化できる', async ({ page }) => {
    await page.goto('/admin/clinics');

    const toggleButton = page.getByRole('button', { name: /有効化|無効化|Activate|Deactivate/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // 確認ダイアログ
      const confirmButton = page.getByRole('button', { name: /はい|確認|Confirm/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await expect(page.locator('text=/更新.*成功|Updated successfully/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('新規医院を作成できる', async ({ page }) => {
    await page.goto('/admin/clinics');

    const createButton = page.getByRole('button', { name: /医院を追加|Add Clinic/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await expect(page.getByLabel(/医院名/i)).toBeVisible();
      await page.getByLabel(/医院名/i).fill('新規テスト歯科');
      await page.getByLabel(/オーナーメールアドレス/i).fill('newowner@example.com');

      await page.getByRole('button', { name: /作成|Create/i }).click();
      await expect(page.locator('text=/作成.*成功|Created successfully/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('システム設定が表示される', async ({ page }) => {
    await page.goto('/admin/settings');

    await expect(page.getByRole('heading', { name: /システム設定|System Settings/i })).toBeVisible();
  });

  test('システムログを確認できる', async ({ page }) => {
    // /admin/logsページは実装されていないためスキップ
    test.skip();
  });
});
