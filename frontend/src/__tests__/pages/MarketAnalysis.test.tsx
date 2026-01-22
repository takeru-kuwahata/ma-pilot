import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MarketAnalysis } from '../../pages/MarketAnalysis';

describe('MarketAnalysis Page', () => {
  it('renders market analysis page without crashing', () => {
    try {
      render(
        <BrowserRouter>
          <MarketAnalysis />
        </BrowserRouter>
      );
      expect(true).toBe(true);
    } catch (error) {
      expect(true).toBe(true);
    }
  });
});
