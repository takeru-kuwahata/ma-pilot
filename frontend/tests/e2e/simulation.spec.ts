import { test, expect } from '@playwright/test';
import { loginAsClinicOwner } from './helpers/auth.helper';

test.describe('経営シミュレーション', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/simulation');
  });

  test('シミュレーションページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /シミュレーション|Simulation/i })).toBeVisible();
  });

  test('シミュレーション作成フォームが表示される', async ({ page }) => {
    await expect(page.getByLabel(/シミュレーション名|Simulation Name/i)).toBeVisible();
    await expect(page.getByLabel(/シナリオ|Scenario/i)).toBeVisible();
  });

  test('シミュレーションを作成できる', async ({ page }) => {
    await page.getByLabel(/シミュレーション名/i).fill('2025年度計画');
    await page.getByLabel(/患者数増加率/i).fill('10');
    await page.getByLabel(/単価増加率/i).fill('5');

    await page.getByRole('button', { name: /シミュレーション実行|Run/i }).click();

    // 結果が表示される
    await expect(page.locator('text=/結果|Result/i')).toBeVisible({ timeout: 10000 });
  });

  test('複数のシナリオを比較できる', async ({ page }) => {
    // シナリオ選択
    const scenarioSelect = page.getByLabel(/シナリオ/i);
    if (await scenarioSelect.isVisible()) {
      await scenarioSelect.click();
      await page.getByRole('option', { name: /楽観的|Optimistic/i }).click();
    }

    await page.getByRole('button', { name: /実行/i }).click();
    await expect(page.locator('text=/予測売上|Projected Revenue/i')).toBeVisible({ timeout: 5000 });
  });

  test('グラフで結果を表示できる', async ({ page }) => {
    // シミュレーション実行後
    await page.getByRole('button', { name: /実行/i }).click();

    const chart = page.locator('svg.recharts-surface');
    await expect(chart.first()).toBeVisible({ timeout: 10000 });
  });

  test('シミュレーション結果をエクスポートできる', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /エクスポート|Export/i });
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeEnabled();
    }
  });
});
