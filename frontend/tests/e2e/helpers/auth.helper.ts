import { Page } from '@playwright/test';

/**
 * clinic_ownerアカウントでログインする
 * @throws エラーが発生した場合（バックエンド未起動など）
 */
export async function loginAsClinicOwner(page: Page) {
  await page.goto('/');

  // エラーアラートが表示されたらスキップ
  const errorAlert = page.locator('[role="alert"]:has-text("Failed to fetch")');
  if (await errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
    throw new Error('Backend is not running');
  }

  await page.getByLabel(/メールアドレス/i).fill('owner@test-clinic.local');
  await page.getByLabel(/パスワード/i).fill('TestOwner2025!');
  await page.getByRole('button', { name: /^ログイン$/ }).click();

  // クリニックダッシュボードへのリダイレクトを待機（バックエンドコールドスタート対応）
  await page.waitForURL(/\/clinic\/dashboard/, { timeout: 35000 });
}

/**
 * system_adminアカウントでログインする
 * @throws エラーが発生した場合（バックエンド未起動など）
 */
export async function loginAsSystemAdmin(page: Page) {
  await page.goto('/');

  // エラーアラートが表示されたらスキップ
  const errorAlert = page.locator('[role="alert"]:has-text("Failed to fetch")');
  if (await errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
    throw new Error('Backend is not running');
  }

  await page.getByLabel(/メールアドレス/i).fill('admin@ma-pilot.local');
  await page.getByLabel(/パスワード/i).fill('DevAdmin2025!');
  await page.getByRole('button', { name: /^ログイン$/ }).click();

  // 管理ダッシュボードへのリダイレクトを待機（バックエンドコールドスタート対応）
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });
}
