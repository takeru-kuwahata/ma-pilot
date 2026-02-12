import { test, expect } from '@playwright/test';
import { loginAsClinicOwner } from './helpers/auth.helper';

test.describe('スタッフ管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/clinic/staff');
  });

  test('スタッフ管理ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /スタッフ管理|Staff Management/i })).toBeVisible();
  });

  test('スタッフ追加ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /スタッフ追加|Add Staff/i })).toBeVisible();
  });

  test('スタッフ一覧が表示される', async ({ page }) => {
    const staffTable = page.getByRole('table').or(page.locator('[role="grid"]'));
    await expect(staffTable).toBeVisible();
  });

  test('スタッフを追加できる', async ({ page }) => {
    await page.getByRole('button', { name: /スタッフ追加/i }).click();

    // モーダルまたはフォームが表示される
    await expect(page.getByLabel(/氏名|Name/i)).toBeVisible();
    await expect(page.getByLabel(/メールアドレス|Email/i)).toBeVisible();
    await expect(page.getByLabel(/権限|Role/i)).toBeVisible();

    await page.getByLabel(/氏名/i).fill('山田太郎');
    await page.getByLabel(/メールアドレス/i).fill('yamada@example.com');
    await page.getByLabel(/権限/i).click();
    await page.getByRole('option', { name: /編集者|Editor/i }).click();

    await page.getByRole('button', { name: /登録|Register/i }).click();

    await expect(page.locator('text=/登録.*成功|Registered successfully/i')).toBeVisible({ timeout: 5000 });
  });

  test('スタッフ情報を編集できる', async ({ page }) => {
    const editButton = page.getByRole('button', { name: /編集|Edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      await expect(page.getByLabel(/氏名/i)).toBeVisible();
      await page.getByLabel(/氏名/i).fill('山田次郎');

      await page.getByRole('button', { name: /保存|Save/i }).click();
      await expect(page.locator('text=/更新.*成功|Updated successfully/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('スタッフを削除できる', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: /削除|Delete/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 確認ダイアログ
      const confirmButton = page.getByRole('button', { name: /はい|Yes|確認|Confirm/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await expect(page.locator('text=/削除.*成功|Deleted successfully/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('権限を変更できる', async ({ page }) => {
    const roleSelect = page.getByRole('combobox', { name: /権限|Role/i }).first();
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      await page.getByRole('option', { name: /閲覧者|Viewer/i }).click();

      await expect(page.locator('text=/更新|Updated/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
