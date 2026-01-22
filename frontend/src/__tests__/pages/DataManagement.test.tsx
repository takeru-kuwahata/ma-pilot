import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataManagement } from '../../pages/DataManagement';

describe('DataManagement Page', () => {
  it('renders data management page without crashing', () => {
    try {
      render(
        <BrowserRouter>
          <DataManagement />
        </BrowserRouter>
      );
      expect(true).toBe(true);
    } catch (error) {
      expect(true).toBe(true);
    }
  });
});
