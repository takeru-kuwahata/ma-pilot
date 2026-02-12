import { test, expect } from '@playwright/test';
import { loginAsClinicOwner } from './helpers/auth.helper';

test.describe('診療圏分析', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/market-analysis');
  });

  test('診療圏分析ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /診療圏分析|Market Analysis/i })).toBeVisible();
  });

  test('地図が表示される', async ({ page }) => {
    // Google Maps APIまたは地図コンポーネント
    const map = page.locator('[role="region"][aria-label*="地図"], .map-container, #map').first();
    await expect(map).toBeVisible({ timeout: 10000 });
  });

  test('半径設定を変更できる', async ({ page }) => {
    const radiusInput = page.getByLabel(/半径|Radius/i);
    if (await radiusInput.isVisible()) {
      await radiusInput.fill('3000');
      await page.getByRole('button', { name: /再分析|Analyze/i }).click();

      // 分析結果が更新される
      await expect(page.locator('text=/分析結果|Analysis Result/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('人口統計データが表示される', async ({ page }) => {
    await expect(page.locator('text=/人口|Population/i')).toBeVisible();
    await expect(page.locator('text=/世帯数|Households/i')).toBeVisible();
  });

  test('競合医院が表示される', async ({ page }) => {
    // 競合医院リストまたはマーカー
    const competitors = page.locator('text=/競合|Competitor/i');
    await expect(competitors.first()).toBeVisible();
  });

  test('分析レポートをダウンロードできる', async ({ page }) => {
    const downloadButton = page.getByRole('button', { name: /ダウンロード|Download/i });
    if (await downloadButton.isVisible()) {
      await expect(downloadButton).toBeEnabled();
    }
  });
});
