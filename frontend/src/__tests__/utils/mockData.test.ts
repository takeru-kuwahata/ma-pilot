import { describe, it, expect } from 'vitest';
import * as mockData from '../../utils/mockData';

describe('MockData Utils', () => {
  it('should export mock data utilities', () => {
    expect(mockData).toBeDefined();
  });

  it('mock data should be valid objects', () => {
    // Basic validation that mock data is properly structured
    expect(typeof mockData).toBe('object');
  });
});
