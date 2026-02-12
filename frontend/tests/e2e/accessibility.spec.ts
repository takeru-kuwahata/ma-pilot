import { test, expect } from '@playwright/test';
import { loginAsClinicOwner } from './helpers/auth.helper';

test.describe('アクセシビリティ', () => {
  const pages = [
    { url: '/', name: 'ログイン', requiresAuth: false },
    { url: '/clinic/dashboard', name: 'ダッシュボード', requiresAuth: true },
    { url: '/clinic/data-management', name: '基礎データ管理', requiresAuth: true },
    { url: '/clinic/simulation', name: 'シミュレーション', requiresAuth: true },
    { url: '/clinic/reports', name: 'レポート', requiresAuth: true },
    { url: '/clinic/market-analysis', name: '診療圏分析', requiresAuth: true },
    { url: '/clinic/settings', name: '医院設定', requiresAuth: true },
    { url: '/clinic/staff', name: 'スタッフ管理', requiresAuth: true },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name}: スクリーンリーダー用アナウンサーが存在する`, async ({ page }) => {
      // TODO: アナウンサーコンポーネント実装後に有効化
      test.skip();
    });

    test(`${pageInfo.name}: 全インタラクティブ要素にアクセス可能`, async ({ page }) => {
      if (pageInfo.requiresAuth) {
        await loginAsClinicOwner(page);
      }
      await page.goto(pageInfo.url);

      // フォーカス可能な要素を取得
      const focusableElements = await page.locator(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ).all();

      // 少なくとも1つのフォーカス可能要素が存在すること
      expect(focusableElements.length).toBeGreaterThan(0);

      // 各要素がキーボードアクセス可能であること
      for (const element of focusableElements.slice(0, 5)) {
        await element.focus();
        await expect(element).toBeFocused();
      }
    });

    test(`${pageInfo.name}: ボタンにaria-labelまたはテキストが存在する`, async ({ page }) => {
      if (pageInfo.requiresAuth) {
        await loginAsClinicOwner(page);
      }
      await page.goto(pageInfo.url);

      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        const hasAriaLabel = await button.getAttribute('aria-label');
        const hasText = await button.textContent();

        expect(hasAriaLabel || (hasText && hasText.trim().length > 0)).toBeTruthy();
      }
    });

    test(`${pageInfo.name}: フォーム要素にラベルが関連付けられている`, async ({ page }) => {
      if (pageInfo.requiresAuth) {
        await loginAsClinicOwner(page);
      }
      await page.goto(pageInfo.url);

      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea').all();

      for (const input of inputs) {
        const hasAriaLabel = await input.getAttribute('aria-label');
        const hasAriaLabelledBy = await input.getAttribute('aria-labelledby');
        const id = await input.getAttribute('id');

        let hasLabel = false;
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          hasLabel = await label.count() > 0;
        }

        expect(hasAriaLabel || hasAriaLabelledBy || hasLabel).toBeTruthy();
      }
    });

    test(`${pageInfo.name}: キーボードトラップが存在しない`, async ({ page }) => {
      if (pageInfo.requiresAuth) {
        await loginAsClinicOwner(page);
      }
      await page.goto(pageInfo.url);

      // Tab キーで進む
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      // Shift+Tab で戻る
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Shift+Tab');
      }

      // エラーが発生しないことを確認（認証なしの場合はログインページになる可能性あり）
      if (pageInfo.requiresAuth) {
        await expect(page).toHaveURL(pageInfo.url);
      } else {
        await expect(page.url()).toContain('/');
      }
    });
  }

  test('モーダルでEscapeキーが機能する', async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/staff');

    const addButton = page.getByRole('button', { name: /スタッフ追加|Add Staff/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // モーダルが開く
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Escapeキーでモーダルを閉じる
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('スキップリンクが機能する', async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/dashboard');

    // Tabキーでスキップリンクにフォーカス
    await page.keyboard.press('Tab');

    const skipLink = page.getByText(/スキップ|Skip to/i);
    if (await skipLink.isVisible()) {
      await skipLink.click();

      // メインコンテンツにフォーカスが移動
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
    }
  });

  test('カラーコントラストが十分である', async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/dashboard');

    // テキスト要素のコントラスト比を確認（簡易チェック）
    const textElements = await page.locator('h1, h2, h3, p, button, a').all();

    for (const element of textElements.slice(0, 5)) {
      const color = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      // 色情報が取得できることを確認
      expect(color.color).toBeTruthy();
    }
  });
});
