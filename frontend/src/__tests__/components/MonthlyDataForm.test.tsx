import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonthlyDataForm } from '../../components/MonthlyDataForm';

describe('MonthlyDataForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('フォームが正しく表示される', () => {
    render(<MonthlyDataForm {...defaultProps} />);

    expect(screen.getByLabelText(/対象年月/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/総売上/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/新患数/i)).toBeInTheDocument();
  });

  it('数値入力が動作する', async () => {
    render(<MonthlyDataForm {...defaultProps} />);

    const insuranceInput = screen.getByLabelText(/保険診療収入/i);
    fireEvent.change(insuranceInput, { target: { value: '3000000' } });

    await waitFor(() => {
      expect(insuranceInput).toHaveValue('3000000');
    });
  });

  it('自動計算が動作する', async () => {
    render(<MonthlyDataForm {...defaultProps} />);

    const insuranceInput = screen.getByLabelText(/保険診療収入/i);
    const selfPayInput = screen.getByLabelText(/自由診療収入/i);
    const retailInput = screen.getByLabelText(/物販/i);

    fireEvent.change(insuranceInput, { target: { value: '3000000' } });
    fireEvent.change(selfPayInput, { target: { value: '2000000' } });
    fireEvent.change(retailInput, { target: { value: '0' } });

    await waitFor(() => {
      const totalRevenue = screen.getByLabelText(/総売上/i);
      expect(totalRevenue).toHaveValue('5,000,000');
    });
  });

  it('バリデーションが動作する', async () => {
    render(<MonthlyDataForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /保存|Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/必須|required/i)).toBeInTheDocument();
    });
  });

  it('フォーム送信が動作する', async () => {
    render(<MonthlyDataForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/対象年月/i), { target: { value: '2025-01' } });
    fireEvent.change(screen.getByLabelText(/保険診療収入/i), { target: { value: '3000000' } });
    fireEvent.change(screen.getByLabelText(/自由診療収入/i), { target: { value: '2000000' } });
    fireEvent.change(screen.getByLabelText(/物販/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/変動費/i), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText(/固定費/i), { target: { value: '1500000' } });
    fireEvent.change(screen.getByLabelText(/新患数/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/再診患者数/i), { target: { value: '100' } });

    const submitButton = screen.getByRole('button', { name: /保存/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          yearMonth: '2025-01',
          totalRevenue: 5000000,
          newPatients: 25,
        })
      );
    });
  });

  it('キャンセルボタンが動作する', () => {
    render(<MonthlyDataForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /キャンセル|Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('初期値が正しく設定される', () => {
    const initialData = {
      yearMonth: '2025-01',
      totalRevenue: 5000000,
      insuranceRevenue: 3000000,
      selfPayRevenue: 2000000,
      retailRevenue: 0,
      variableCost: 1000000,
      fixedCost: 1500000,
      newPatients: 25,
      returningPatients: 100,
      totalPatients: 125,
    };

    render(<MonthlyDataForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByLabelText(/対象年月/i)).toHaveValue('2025-01');
    expect(screen.getByLabelText(/総売上/i)).toHaveValue('5,000,000');
    expect(screen.getByLabelText(/新患数/i)).toHaveValue('25');
  });
});
