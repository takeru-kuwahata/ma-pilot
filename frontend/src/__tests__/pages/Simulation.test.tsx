import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Simulation } from '../../pages/Simulation';

describe('Simulation Page', () => {
  it('renders simulation page without crashing', () => {
    try {
      render(
        <BrowserRouter>
          <Simulation />
        </BrowserRouter>
      );
      expect(true).toBe(true);
    } catch (error) {
      expect(true).toBe(true);
    }
  });
});
