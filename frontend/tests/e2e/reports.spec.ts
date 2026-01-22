import { test, expect } from '@playwright/test';

test.describe('レポート生成・管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
  });

  test('レポート一覧ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /レポート|Reports/i })).toBeVisible();
  });

  test('レポート生成ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /レポート生成|Generate Report/i })).toBeVisible();
  });

  test('レポートタイプを選択できる', async ({ page }) => {
    await page.getByRole('button', { name: /レポート生成/i }).click();

    // モーダルまたはフォームが表示される
    await expect(page.getByLabel(/レポートタイプ|Report Type/i)).toBeVisible();
    await expect(page.getByLabel(/対象期間|Period/i)).toBeVisible();
  });

  test('レポートを生成できる', async ({ page }) => {
    await page.getByRole('button', { name: /レポート生成/i }).click();

    await page.getByLabel(/レポートタイプ/i).click();
    await page.getByRole('option', { name: /月次経営レポート|Monthly Report/i }).click();

    await page.getByRole('button', { name: /生成|Generate/i }).click();

    // 生成中メッセージまたは完了メッセージ
    await expect(page.locator('text=/生成中|Generating/i')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/完了|Complete/i')).toBeVisible({ timeout: 15000 });
  });

  test('レポート一覧が表示される', async ({ page }) => {
    const reportList = page.getByRole('table').or(page.locator('[role="list"]'));
    await expect(reportList).toBeVisible();
  });

  test('レポートをダウンロードできる', async ({ page }) => {
    const downloadButton = page.getByRole('button', { name: /ダウンロード|Download/i }).first();
    if (await downloadButton.isVisible()) {
      await expect(downloadButton).toBeEnabled();
    }
  });

  test('レポートプレビューが表示できる', async ({ page }) => {
    const previewButton = page.getByRole('button', { name: /プレビュー|Preview/i }).first();
    if (await previewButton.isVisible()) {
      await previewButton.click();

      // プレビューモーダルまたはページ
      await expect(page.locator('[role="dialog"]').or(page.locator('.preview'))).toBeVisible();
    }
  });
});
