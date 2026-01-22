/**
 * Focus Management Utilities for Accessibility
 * Provides utilities for managing keyboard focus and focus trapping
 */

/**
 * Traps focus within a given element (useful for modals/dialogs)
 * @param element - The element to trap focus within
 * @returns Cleanup function to remove event listeners
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = Array.from(
    element.querySelectorAll<HTMLElement>(focusableSelectors)
  );

  if (focusableElements.length === 0) {
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element initially
  firstElement.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Gets all focusable elements within a container
 * @param container - The container element
 * @returns Array of focusable elements
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
};

/**
 * Restores focus to a previously focused element
 * @param element - The element to restore focus to
 */
export const restoreFocus = (element: HTMLElement | null) => {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
};

/**
 * Saves the currently focused element
 * @returns The currently focused element
 */
export const saveFocus = (): HTMLElement | null => {
  return document.activeElement as HTMLElement;
};
