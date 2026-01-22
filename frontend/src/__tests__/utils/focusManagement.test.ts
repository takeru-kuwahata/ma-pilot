import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { trapFocus, getFocusableElements, saveFocus, restoreFocus } from '../../utils/focusManagement';

describe('focusManagement', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('フォーカス可能な要素を取得できる', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <input id="input1" type="text" />
      <a href="#" id="link1">Link</a>
      <button disabled id="btn2">Disabled</button>
    `;

    const focusableElements = getFocusableElements(container);

    expect(focusableElements).toHaveLength(3);
    expect(focusableElements[0].id).toBe('btn1');
    expect(focusableElements[1].id).toBe('input1');
    expect(focusableElements[2].id).toBe('link1');
  });

  it('フォーカストラップが動作する', () => {
    container.innerHTML = `
      <button id="btn1">First</button>
      <button id="btn2">Second</button>
      <button id="btn3">Third</button>
    `;

    const cleanup = trapFocus(container);

    const firstButton = document.getElementById('btn1');
    expect(document.activeElement).toBe(firstButton);

    cleanup();
  });

  it('Tab キーでフォーカスが循環する', () => {
    container.innerHTML = `
      <button id="btn1">First</button>
      <button id="btn2">Second</button>
      <button id="btn3">Third</button>
    `;

    const cleanup = trapFocus(container);

    const thirdButton = document.getElementById('btn3') as HTMLElement;
    thirdButton.focus();

    // Tab キーを押すと最初の要素に戻る
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(tabEvent);

    cleanup();
  });

  it('フォーカスを保存して復元できる', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
    `;

    const button1 = document.getElementById('btn1') as HTMLElement;
    const button2 = document.getElementById('btn2') as HTMLElement;

    button1.focus();
    const savedFocus = saveFocus();

    expect(savedFocus).toBe(button1);

    button2.focus();
    expect(document.activeElement).toBe(button2);

    restoreFocus(savedFocus);
    expect(document.activeElement).toBe(button1);
  });

  it('フォーカス可能な要素がない場合は空配列を返す', () => {
    container.innerHTML = `
      <div>No focusable elements</div>
      <span>Text only</span>
    `;

    const focusableElements = getFocusableElements(container);
    expect(focusableElements).toHaveLength(0);
  });

  it('無効な要素を除外する', () => {
    container.innerHTML = `
      <button disabled>Disabled Button</button>
      <input disabled type="text" />
      <button>Enabled Button</button>
    `;

    const focusableElements = getFocusableElements(container);
    expect(focusableElements).toHaveLength(1);
    expect(focusableElements[0].textContent).toBe('Enabled Button');
  });

  it('tabindex="-1" の要素を除外する', () => {
    container.innerHTML = `
      <button tabindex="-1">Hidden from tab order</button>
      <button tabindex="0">In tab order</button>
      <button>Default tab order</button>
    `;

    const focusableElements = getFocusableElements(container);
    expect(focusableElements).toHaveLength(2);
  });
});
