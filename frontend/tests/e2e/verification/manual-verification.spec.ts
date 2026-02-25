import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * 手動検証補助スクリプト
 * 各ページのスクリーンショットを取得して手動で確認
 */

const PRODUCTION_URL = 'https://ma-pilot.vercel.app';
const TEST_ACCOUNT = {
  email: 'kuwahata@idw-japan.net',
  password: 'advance2026',
};

test.use({
  video: 'on',
  screenshot: 'on',
});

test('全ページスクリーンショット取得', async ({ page }) => {
  // ログイン
  await page.goto(PRODUCTION_URL);
  await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
  await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
  await page.getByRole('button', { name: /^ログイン$/ }).click();

  // 管理ダッシュボードへの遷移を待機（最大60秒）
  try {
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 60000 });
    console.log('✅ 管理ダッシュボードにログイン成功');
  } catch (e) {
    console.log('⚠️ 管理ダッシュボードへのリダイレクトがタイムアウト');
    // 現在のURLを確認
    console.log('現在のURL:', page.url());
  }

  // 管理ダッシュボード
  await page.screenshot({ path: 'verification-screenshots/admin-dashboard-full.png', fullPage: true });
  console.log('📸 管理ダッシュボードのスクリーンショット取得');

  // 医院モードに切替
  const switchButton = page.getByRole('button', { name: /医院モードへ/ });
  if (await switchButton.isVisible({ timeout: 5000 })) {
    await switchButton.click();
    await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });
    console.log('✅ 医院モードに切替成功');
  }

  // クリニックダッシュボード
  await page.screenshot({ path: 'verification-screenshots/clinic-dashboard-full.png', fullPage: true });
  console.log('📸 クリニックダッシュボードのスクリーンショット取得');

  // 基礎データ管理
  await page.goto(`${PRODUCTION_URL}/clinic/data-management`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verification-screenshots/data-management-full.png', fullPage: true });
  console.log('📸 基礎データ管理のスクリーンショット取得');

  // 経営シミュレーション
  await page.goto(`${PRODUCTION_URL}/clinic/simulation`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verification-screenshots/simulation-full.png', fullPage: true });
  console.log('📸 経営シミュレーションのスクリーンショット取得');

  // レポート管理
  await page.goto(`${PRODUCTION_URL}/clinic/reports`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verification-screenshots/reports-full.png', fullPage: true });
  console.log('📸 レポート管理のスクリーンショット取得');

  // 診療圏分析
  await page.goto(`${PRODUCTION_URL}/clinic/market-analysis`);
  await page.waitForTimeout(5000); // 地図の読み込みを待つ
  await page.screenshot({ path: 'verification-screenshots/market-analysis-full.png', fullPage: true });
  console.log('📸 診療圏分析のスクリーンショット取得');

  // 医院設定
  await page.goto(`${PRODUCTION_URL}/clinic/settings`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verification-screenshots/clinic-settings-full.png', fullPage: true });
  console.log('📸 医院設定のスクリーンショット取得');

  // スタッフ管理
  await page.goto(`${PRODUCTION_URL}/clinic/staff`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verification-screenshots/staff-management-full.png', fullPage: true });
  console.log('📸 スタッフ管理のスクリーンショット取得');

  console.log('✅ 全ページのスクリーンショット取得完了');
});
