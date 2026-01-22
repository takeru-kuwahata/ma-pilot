import { test, expect } from '@playwright/test';

test.describe('ログインフロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ログインページが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/MA-Pilot/i);
    await expect(page.getByRole('heading', { name: /ログイン/i })).toBeVisible();
    await expect(page.getByLabel(/メールアドレス/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /ログイン/i })).toBeVisible();
  });

  test('空のフォーム送信でバリデーションエラーが表示される', async ({ page }) => {
    await page.getByRole('button', { name: /ログイン/i }).click();

    // バリデーションエラーメッセージが表示される
    await expect(page.locator('text=/メールアドレス.*必須/i')).toBeVisible();
    await expect(page.locator('text=/パスワード.*必須/i')).toBeVisible();
  });

  test('不正な認証情報でログイン失敗', async ({ page }) => {
    await page.getByLabel(/メールアドレス/i).fill('invalid@example.com');
    await page.getByLabel(/パスワード/i).fill('wrongpassword');
    await page.getByRole('button', { name: /ログイン/i }).click();

    // エラーメッセージが表示される
    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();
  });

  test('正常なログイン（モック）', async ({ page }) => {
    // テスト用アカウント
    await page.getByLabel(/メールアドレス/i).fill('owner@test-clinic.local');
    await page.getByLabel(/パスワード/i).fill('TestOwner2025!');
    await page.getByRole('button', { name: /ログイン/i }).click();

    // ダッシュボードへリダイレクト
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /ダッシュボード/i })).toBeVisible();
  });

  test('キーボードナビゲーションが機能する', async ({ page }) => {
    // Tabキーでフォーカス移動
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/メールアドレス/i)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/パスワード/i)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /ログイン/i })).toBeFocused();
  });

  test('ARIA属性が正しく設定されている', async ({ page }) => {
    const emailInput = page.getByLabel(/メールアドレス/i);
    await expect(emailInput).toHaveAttribute('aria-label', /.+/);

    const passwordInput = page.getByLabel(/パスワード/i);
    await expect(passwordInput).toHaveAttribute('aria-label', /.+/);

    const loginButton = page.getByRole('button', { name: /ログイン/i });
    await expect(loginButton).toHaveAttribute('aria-label', /.+/);
  });
});
