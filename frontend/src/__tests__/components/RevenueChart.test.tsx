import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../../components/RevenueChart';

describe('RevenueChart', () => {
  const mockData = [
    {
      id: '1',
      clinic_id: 'clinic-1',
      year_month: '2025-01',
      total_revenue: 5000000,
      insurance_revenue: 3000000,
      self_pay_revenue: 2000000,
      personnel_cost: 2000000,
      material_cost: 1000000,
      fixed_cost: 500000,
      other_cost: 500000,
      new_patients: 25,
      returning_patients: 100,
      total_patients: 125,
      treatment_count: 150,
      average_revenue_per_patient: 40000,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      clinic_id: 'clinic-1',
      year_month: '2025-02',
      total_revenue: 5500000,
      insurance_revenue: 3300000,
      self_pay_revenue: 2200000,
      personnel_cost: 2000000,
      material_cost: 1000000,
      fixed_cost: 500000,
      other_cost: 800000,
      new_patients: 30,
      returning_patients: 110,
      total_patients: 140,
      treatment_count: 160,
      average_revenue_per_patient: 39285,
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z',
    },
    {
      id: '3',
      clinic_id: 'clinic-1',
      year_month: '2025-03',
      total_revenue: 6000000,
      insurance_revenue: 3600000,
      self_pay_revenue: 2400000,
      personnel_cost: 2000000,
      material_cost: 1000000,
      fixed_cost: 500000,
      other_cost: 1000000,
      new_patients: 35,
      returning_patients: 120,
      total_patients: 155,
      treatment_count: 170,
      average_revenue_per_patient: 38709,
      created_at: '2025-03-01T00:00:00Z',
      updated_at: '2025-03-01T00:00:00Z',
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
