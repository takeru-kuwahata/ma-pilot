import { test, expect } from '@playwright/test';

test.describe('印刷物注文フォーム - API Debug', () => {
  test('再注文パターンのAPIリクエスト/レスポンスを確認', async ({ page }) => {
    const consoleMessages: string[] = [];
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];

    // コンソールログを収集
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // ネットワークリクエストを収集
    page.on('request', (request) => {
      if (request.url().includes('/api/print-orders')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
          headers: request.headers(),
        });
      }
    });

    // ネットワークレスポンスを収集
    page.on('response', async (response) => {
      if (response.url().includes('/api/print-orders')) {
        let body;
        try {
          body = await response.text();
        } catch (e) {
          body = 'Could not read response body';
        }
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          body: body,
        });
      }
    });

    // ログインページに移動
    await page.goto('https://ma-pilot.vercel.app/login');
    await page.waitForLoadState('networkidle');

    // ログイン
    await page.fill('input[type="email"]', 'kuwahata@idw-japan.net');
    await page.fill('input[type="password"]', 'advance2026');
    await page.click('button[type="submit"]');

    // ダッシュボードに遷移するまで待機（バックエンドコールドスタート対応）
    await page.waitForURL(/\/clinic\/dashboard/, { timeout: 60000 });

    // 印刷物注文フォームに移動
    await page.goto('https://ma-pilot.vercel.app/print-order');
    await page.waitForLoadState('networkidle');

    // 再注文パターンを選択
    await page.getByRole('radio', { name: '再注文' }).click();
    await page.waitForTimeout(500);

    // 商品種類を選択
    const productTypeSelect = page.locator('div[role="combobox"]').first();
    await productTypeSelect.click();
    await page.getByRole('option', { name: 'A4三つ折りリーフレット' }).click();
    await page.waitForTimeout(300);

    // 数量を入力
    await page.fill('input[type="number"]', '500');
    await page.waitForTimeout(300);

    // 必須フィールドを入力
    await page.fill('input[name="email"]', 'kuwahata@idw-japan.net');
    await page.fill('textarea[name="delivery_address"]', '東京都千代田区神田1-1-1');
    await page.fill('input[name="daytime_contact"]', '03-1234-5678');

    // 利用規約に同意
    await page.check('input[type="checkbox"][name="terms_agreed"]');

    // フォームを送信
    await page.click('button[type="submit"]');

    // レスポンスを待機
    await page.waitForTimeout(3000);

    // 収集したデータをログファイルに出力
    const fs = require('fs');
    const path = require('path');

    const logDir = path.join(process.cwd(), 'verification-screenshots');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // コンソールログ
    fs.writeFileSync(
      path.join(logDir, 'api-debug-console.log'),
      consoleMessages.join('\n')
    );

    // ネットワークリクエスト
    fs.writeFileSync(
      path.join(logDir, 'api-debug-requests.json'),
      JSON.stringify(networkRequests, null, 2)
    );

    // ネットワークレスポンス
    fs.writeFileSync(
      path.join(logDir, 'api-debug-responses.json'),
      JSON.stringify(networkResponses, null, 2)
    );

    console.log('=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== Network Requests ===');
    networkRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
      console.log('Post Data:', req.postData);
    });

    console.log('\n=== Network Responses ===');
    networkResponses.forEach(res => {
      console.log(`${res.status} ${res.url}`);
      console.log('Body:', res.body);
    });

    // スクリーンショットを撮影
    await page.screenshot({
      path: path.join(logDir, 'api-debug-result.png'),
      fullPage: true
    });
  });
});
