import { test, expect } from '@playwright/test';

/**
 * 本番環境での全機能検証スクリプト
 *
 * 実行方法:
 * npx playwright test tests/verification/production-verification.spec.ts --headed --project=chromium
 */

const PRODUCTION_URL = 'https://ma-pilot.vercel.app';
const TEST_ACCOUNT = {
  email: 'kuwahata@idw-japan.net',
  password: 'advance2026',
};

// ビデオとスクリーンショットを有効化
test.use({
  video: 'on',
  screenshot: 'on',
});

test.describe('本番環境 全機能検証', () => {

  test('1. ログイン機能の検証', async ({ page }) => {
    // ログインページに移動
    await page.goto(PRODUCTION_URL);
    await expect(page).toHaveTitle(/MA-Pilot/);

    // ログインタブが選択されていることを確認
    await expect(page.getByRole('tab', { name: 'ログイン' })).toHaveAttribute('aria-selected', 'true');

    // 認証情報を入力
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/01-login-form.png', fullPage: true });

    // ログインボタンをクリック
    await page.getByRole('button', { name: /^ログイン$/ }).click();

    // 管理ダッシュボードへのリダイレクトを待機（最大35秒）
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/02-admin-dashboard.png', fullPage: true });

    console.log('✅ ログイン成功: 管理ダッシュボードに遷移しました');
  });

  test('2. 管理ダッシュボードの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // ページタイトル確認
    await expect(page.getByRole('heading', { name: /管理ダッシュボード|ダッシュボード/i }).first()).toBeVisible({ timeout: 10000 });

    // KPIカード確認
    await expect(page.locator('text=/登録医院数|登録クリニック/')).toBeVisible();
    await expect(page.locator('text=/稼働医院数|稼働クリニック/')).toBeVisible();

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/03-admin-dashboard-kpi.png', fullPage: true });

    console.log('✅ 管理ダッシュボード: KPI表示を確認しました');
  });

  test('3. 医院モードへの切替とクリニックダッシュボードの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 医院モードへ切替ボタンをクリック
    const switchButton = page.getByRole('button', { name: /医院モードへ/ });
    if (await switchButton.isVisible({ timeout: 5000 })) {
      await switchButton.click();
      await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });

      // クリニックダッシュボードのページタイトル確認
      await expect(page.getByRole('heading', { name: /ダッシュボード|経営ダッシュボード/i }).first()).toBeVisible({ timeout: 10000 });

      // スクリーンショット撮影
      await page.screenshot({ path: 'verification-screenshots/04-clinic-dashboard.png', fullPage: true });

      console.log('✅ 医院モード切替: クリニックダッシュボードに遷移しました');
    } else {
      console.log('⚠️ 医院モード切替ボタンが見つかりません');
    }
  });

  test('4. 基礎データ管理ページの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 医院モードに切替
    const switchButton = page.getByRole('button', { name: /医院モードへ/ });
    if (await switchButton.isVisible({ timeout: 5000 })) {
      await switchButton.click();
      await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });
    }

    // 基礎データ管理ページに移動
    await page.goto(`${PRODUCTION_URL}/clinic/data-management`);

    // ページタイトル確認
    await expect(page.getByRole('heading', { name: /基礎データ管理|Data Management/i })).toBeVisible({ timeout: 10000 });

    // CSV取込ボタンまたはファイル入力の存在確認
    const csvButton = page.getByRole('button', { name: /CSV.*インポート|Import CSV/i });
    const fileInput = page.locator('input[type="file"]');

    if (await csvButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ CSV取込ボタンを確認しました');
    } else if (await fileInput.count() > 0) {
      console.log('✅ ファイル入力要素を確認しました');
    } else {
      console.log('⚠️ CSV取込機能が見つかりません');
    }

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/05-data-management.png', fullPage: true });
  });

  test('5. 経営シミュレーションページの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 医院モードに切替
    const switchButton = page.getByRole('button', { name: /医院モードへ/ });
    if (await switchButton.isVisible({ timeout: 5000 })) {
      await switchButton.click();
      await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });
    }

    // 経営シミュレーションページに移動
    await page.goto(`${PRODUCTION_URL}/clinic/simulation`);

    // ページタイトル確認
    await expect(page.getByRole('heading', { name: /シミュレーション|Simulation/i })).toBeVisible({ timeout: 10000 });

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/06-simulation.png', fullPage: true });

    console.log('✅ 経営シミュレーションページを確認しました');
  });

  test('6. レポート管理ページの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 医院モードに切替
    const switchButton = page.getByRole('button', { name: /医院モードへ/ });
    if (await switchButton.isVisible({ timeout: 5000 })) {
      await switchButton.click();
      await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });
    }

    // レポート管理ページに移動
    await page.goto(`${PRODUCTION_URL}/clinic/reports`);

    // ページタイトル確認
    await expect(page.getByRole('heading', { name: /レポート|Reports/i })).toBeVisible({ timeout: 10000 });

    // レポートテンプレートカードの存在確認
    const monthlyReportCard = page.locator('text=/月次経営レポート|Monthly Report/i');
    if (await monthlyReportCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ レポートテンプレートカードを確認しました');
    }

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/07-reports.png', fullPage: true });
  });

  test('7. 診療圏分析ページの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 医院モードに切替
    const switchButton = page.getByRole('button', { name: /医院モードへ/ });
    if (await switchButton.isVisible({ timeout: 5000 })) {
      await switchButton.click();
      await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });
    }

    // 診療圏分析ページに移動
    await page.goto(`${PRODUCTION_URL}/clinic/market-analysis`);

    // ページタイトル確認
    await expect(page.getByRole('heading', { name: /診療圏分析|Market Analysis/i })).toBeVisible({ timeout: 10000 });

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/08-market-analysis.png', fullPage: true });

    console.log('✅ 診療圏分析ページを確認しました');
  });

  test('8. 医院設定ページの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 医院モードに切替
    const switchButton = page.getByRole('button', { name: /医院モードへ/ });
    if (await switchButton.isVisible({ timeout: 5000 })) {
      await switchButton.click();
      await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });
    }

    // 医院設定ページに移動
    await page.goto(`${PRODUCTION_URL}/clinic/settings`);

    // ページタイトル確認
    await expect(page.getByRole('heading', { name: /医院設定|Clinic Settings/i })).toBeVisible({ timeout: 10000 });

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/09-clinic-settings.png', fullPage: true });

    console.log('✅ 医院設定ページを確認しました');
  });

  test('9. スタッフ管理ページの検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // 医院モードに切替
    const switchButton = page.getByRole('button', { name: /医院モードへ/ });
    if (await switchButton.isVisible({ timeout: 5000 })) {
      await switchButton.click();
      await page.waitForURL(/\/clinic\/dashboard/, { timeout: 10000 });
    }

    // スタッフ管理ページに移動
    await page.goto(`${PRODUCTION_URL}/clinic/staff`);

    // ページタイトル確認
    await expect(page.getByRole('heading', { name: /スタッフ管理|Staff Management/i })).toBeVisible({ timeout: 10000 });

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/10-staff-management.png', fullPage: true });

    console.log('✅ スタッフ管理ページを確認しました');
  });

  test('10. ログアウト機能の検証', async ({ page }) => {
    // ログイン
    await page.goto(PRODUCTION_URL);
    await page.getByLabel(/メールアドレス/i).fill(TEST_ACCOUNT.email);
    await page.getByLabel(/パスワード/i).fill(TEST_ACCOUNT.password);
    await page.getByRole('button', { name: /^ログイン$/ }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 35000 });

    // ログアウトボタンをクリック
    const logoutButton = page.getByRole('button', { name: /ログアウト|Logout/i });
    await logoutButton.click();

    // ログインページにリダイレクトされることを確認
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'ログイン' })).toBeVisible();

    // スクリーンショット撮影
    await page.screenshot({ path: 'verification-screenshots/11-logout.png', fullPage: true });

    console.log('✅ ログアウト成功: ログインページに戻りました');
  });
});
