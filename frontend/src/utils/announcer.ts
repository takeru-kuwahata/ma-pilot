/**
 * Screen Reader Announcer Utility
 * Provides utilities for announcing dynamic content to screen readers
 */

type AnnounceLevel = 'polite' | 'assertive';

/**
 * Announces a message to screen readers
 * @param message - The message to announce
 * @param priority - The announcement priority ('polite' or 'assertive')
 */
export const announce = (message: string, priority: AnnounceLevel = 'polite'): void => {
  const announcer = document.getElementById('a11y-announcer');

  if (!announcer) {
    console.warn('Accessibility announcer element not found. Message:', message);
    return;
  }

  // Clear previous message
  announcer.textContent = '';

  // Set the priority
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');

  // Use setTimeout to ensure screen readers pick up the change
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
};

/**
 * Announces a success message to screen readers
 * @param message - The success message to announce
 */
export const announceSuccess = (message: string): void => {
  announce(message, 'polite');
};

/**
 * Announces an error message to screen readers
 * @param message - The error message to announce
 */
export const announceError = (message: string): void => {
  announce(message, 'assertive');
};

/**
 * Clears the announcer
 */
export const clearAnnouncer = (): void => {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = '';
  }
};

/**
 * Creates the announcer element and adds it to the DOM
 * Should be called once when the app initializes
 */
export const initializeAnnouncer = (): void => {
  // Check if announcer already exists
  if (document.getElementById('a11y-announcer')) {
    return;
  }

  const announcer = document.createElement('div');
  announcer.id = 'a11y-announcer';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');

  // Visually hide the announcer but keep it accessible to screen readers
  announcer.style.position = 'absolute';
  announcer.style.left = '-10000px';
  announcer.style.width = '1px';
  announcer.style.height = '1px';
  announcer.style.overflow = 'hidden';

  document.body.appendChild(announcer);
};
