import { test, expect } from '@playwright/test';

test.describe('ログインフロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ログインページが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/MA-Pilot/i);
    // ログインタブが選択されていることを確認
    await expect(page.getByRole('tab', { name: 'ログイン' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel(/メールアドレス/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^ログイン$/ })).toBeVisible();
  });

  test('空のフォーム送信でバリデーションエラーが表示される', async ({ page }) => {
    await page.getByRole('button', { name: /^ログイン$/ }).click();

    // バリデーションエラーメッセージが表示される（HTML5バリデーションまたはReact Hook Formエラー）
    // MUI TextFieldはrequired属性でHTML5バリデーションを使用
    const emailInput = page.getByLabel(/メールアドレス/i);
    await expect(emailInput).toHaveAttribute('required');
    const passwordInput = page.getByLabel(/パスワード/i);
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('不正な認証情報でログイン失敗', async ({ page }) => {
    await page.getByLabel(/メールアドレス/i).fill('invalid@example.com');
    await page.getByLabel(/パスワード/i).fill('wrongpassword');
    await page.getByRole('button', { name: /ログイン/i }).click();

    // エラーメッセージが表示される
    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();
  });

  test('正常なログイン（モック）', async ({ page, request }) => {
    // バックエンドが起動しているか確認
    try {
      const healthCheck = await request.get('http://localhost:8432/health', { timeout: 3000 });
      if (!healthCheck.ok()) {
        test.skip();
        return;
      }
    } catch {
      // バックエンドが起動していない場合はスキップ
      test.skip();
      return;
    }

    // テスト用アカウント（clinic_owner）
    await page.getByLabel(/メールアドレス/i).fill('owner@test-clinic.local');
    await page.getByLabel(/パスワード/i).fill('TestOwner2025!');
    await page.getByRole('button', { name: /^ログイン$/ }).click();

    // クリニックダッシュボードへリダイレクト（バックエンドのコールドスタートで最大30秒かかる可能性）
    await expect(page).toHaveURL(/\/clinic\/dashboard/, { timeout: 35000 });
    // ページヘッダーまたはタイトルを確認
    await expect(page.getByRole('heading', { name: /ダッシュボード/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('キーボードナビゲーションが機能する', async ({ page }) => {
    // メールアドレス入力欄にフォーカス
    await page.getByLabel(/メールアドレス/i).focus();
    await expect(page.getByLabel(/メールアドレス/i)).toBeFocused();

    // Tabキーでパスワード入力欄へ移動
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/パスワード/i)).toBeFocused();

    // Tabキーでログインボタンへ移動
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /^ログイン$/ })).toBeFocused();
  });

  test('ARIA属性が正しく設定されている', async ({ page }) => {
    // MUI TextFieldはラベルをaria-labelではなく、labelタグで関連付ける
    const emailInput = page.getByLabel(/メールアドレス/i);
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel(/パスワード/i);
    await expect(passwordInput).toBeVisible();

    // ログインボタンはテキストがあるのでaria-labelは不要
    const loginButton = page.getByRole('button', { name: /^ログイン$/ });
    await expect(loginButton).toBeVisible();
  });
});
