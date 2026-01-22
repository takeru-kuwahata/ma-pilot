import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../../components/RevenueChart';

describe('RevenueChart', () => {
  const mockData = [
    {
      id: '1',
      clinicId: 'clinic-1',
      yearMonth: '2025-01',
      totalRevenue: 5000000,
      insuranceRevenue: 3000000,
      selfPayRevenue: 2000000,
      personnelCost: 2000000,
      materialCost: 1000000,
      fixedCost: 500000,
      otherCost: 500000,
      newPatients: 25,
      returningPatients: 100,
      totalPatients: 125,
      treatmentCount: 150,
      averageRevenuePerPatient: 40000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      clinicId: 'clinic-1',
      yearMonth: '2025-02',
      totalRevenue: 5500000,
      insuranceRevenue: 3300000,
      selfPayRevenue: 2200000,
      personnelCost: 2000000,
      materialCost: 1000000,
      fixedCost: 500000,
      otherCost: 800000,
      newPatients: 30,
      returningPatients: 110,
      totalPatients: 140,
      treatmentCount: 160,
      averageRevenuePerPatient: 39285,
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
    },
    {
      id: '3',
      clinicId: 'clinic-1',
      yearMonth: '2025-03',
      totalRevenue: 6000000,
      insuranceRevenue: 3600000,
      selfPayRevenue: 2400000,
      personnelCost: 2000000,
      materialCost: 1000000,
      fixedCost: 500000,
      otherCost: 1000000,
      newPatients: 35,
      returningPatients: 120,
      totalPatients: 155,
      treatmentCount: 170,
      averageRevenuePerPatient: 38709,
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z',
    },
  ];

  it('グラフコンポーネントが描画される', () => {
    const { container } = render(<RevenueChart data={mockData} />);

    // Rechartsは内部でSVG要素を生成する
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('グラフタイトルが表示される', () => {
    render(<RevenueChart data={mockData} />);

    expect(screen.getByText('月次売上・利益推移')).toBeInTheDocument();
  });

  it('凡例が表示される', () => {
    const { container } = render(<RevenueChart data={mockData} />);

    // Recharts Legend
    expect(container.querySelector('.recharts-legend-wrapper')).toBeInTheDocument();
  });

  it('X軸とY軸が表示される', () => {
    const { container } = render(<RevenueChart data={mockData} />);

    expect(container.querySelector('.recharts-xAxis')).toBeInTheDocument();
    expect(container.querySelector('.recharts-yAxis')).toBeInTheDocument();
  });
});
