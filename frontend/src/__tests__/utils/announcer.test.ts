import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  announce,
  announceSuccess,
  announceError,
  clearAnnouncer,
  initializeAnnouncer,
} from '../../utils/announcer';

describe('announcer', () => {
  beforeEach(() => {
    // テスト前にアナウンサーを初期化
    initializeAnnouncer();
  });

  afterEach(() => {
    // テスト後にアナウンサーを削除
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
      announcer.remove();
    }
  });

  it('アナウンサー要素が作成される', () => {
    const announcer = document.getElementById('a11y-announcer');

    expect(announcer).not.toBeNull();
    expect(announcer?.getAttribute('role')).toBe('status');
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
    expect(announcer?.getAttribute('aria-atomic')).toBe('true');
  });

  it('メッセージをアナウンスできる', async () => {
    announce('テストメッセージ', 'polite');

    // setTimeoutがあるため少し待つ
    await new Promise((resolve) => setTimeout(resolve, 150));

    const announcer = document.getElementById('a11y-announcer');
    expect(announcer?.textContent).toBe('テストメッセージ');
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
  });

  it('成功メッセージをアナウンスできる', async () => {
    announceSuccess('保存しました');

    await new Promise((resolve) => setTimeout(resolve, 150));

    const announcer = document.getElementById('a11y-announcer');
    expect(announcer?.textContent).toBe('保存しました');
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
  });

  it('エラーメッセージをアナウンスできる', async () => {
    announceError('エラーが発生しました');

    await new Promise((resolve) => setTimeout(resolve, 150));

    const announcer = document.getElementById('a11y-announcer');
    expect(announcer?.textContent).toBe('エラーが発生しました');
    expect(announcer?.getAttribute('aria-live')).toBe('assertive');
  });

  it('アナウンサーをクリアできる', () => {
    announce('テストメッセージ', 'polite');
    clearAnnouncer();

    const announcer = document.getElementById('a11y-announcer');
    expect(announcer?.textContent).toBe('');
  });

  it('アナウンサーが既に存在する場合は再作成しない', () => {
    initializeAnnouncer();
    const firstAnnouncer = document.getElementById('a11y-announcer');

    initializeAnnouncer();
    const secondAnnouncer = document.getElementById('a11y-announcer');

    expect(firstAnnouncer).toBe(secondAnnouncer);
  });

  it('アナウンサーが視覚的に隠されている', () => {
    const announcer = document.getElementById('a11y-announcer');

    expect(announcer?.style.position).toBe('absolute');
    expect(announcer?.style.left).toBe('-10000px');
    expect(announcer?.style.width).toBe('1px');
    expect(announcer?.style.height).toBe('1px');
    expect(announcer?.style.overflow).toBe('hidden');
  });
});
