import { test } from '@playwright/test';

test('本番環境ログインテスト', async ({ page }) => {
  // 本番環境にアクセス
  await page.goto('https://ma-pilot.vercel.app/login');
  
  console.log('[TEST] ページロード完了');
  
  // フォーム入力
  await page.fill('input[type="email"]', 'kuwahata@idw-japan.net');
  await page.fill('input[type="password"]', 'advance2026');
  
  console.log('[TEST] フォーム入力完了');
  
  // ログインボタンクリック
  await page.click('button:has-text("ログイン")');
  
  console.log('[TEST] ログインボタンクリック');
  
  // ネットワークリクエストを監視
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log('[TEST] Login API Response:', response.status(), response.statusText());
    }
  });
  
  // 10秒待機してコンソールログを確認
  await page.waitForTimeout(10000);
  
  console.log('[TEST] 現在のURL:', page.url());
});
