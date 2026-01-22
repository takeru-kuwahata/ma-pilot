import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../../components/KPICard';

describe('KPICard', () => {
  it('タイトルと値が正しく表示される', () => {
    render(
      <KPICard
        title="総売上"
        value="¥5,000,000"
        icon={<div>Icon</div>}
      />
    );

    expect(screen.getByText('総売上')).toBeInTheDocument();
    expect(screen.getByText('¥5,000,000')).toBeInTheDocument();
  });

  it('増加率が正しく表示される（プラス）', () => {
    render(
      <KPICard
        title="総売上"
        value="¥5,000,000"
        growthRate={15.3}
        icon={<div>Icon</div>}
      />
    );

    expect(screen.getByText('+15.3%')).toBeInTheDocument();
  });

  it('減少率が正しく表示される（マイナス）', () => {
    render(
      <KPICard
        title="総売上"
        value="¥5,000,000"
        growthRate={-5.2}
        icon={<div>Icon</div>}
      />
    );

    expect(screen.getByText('-5.2%')).toBeInTheDocument();
  });

  it('アイコンが正しく表示される', () => {
    render(
      <KPICard
        title="総売上"
        value="¥5,000,000"
        icon={<div data-testid="test-icon">Icon</div>}
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('カードが正しく表示される', () => {
    const { container } = render(
      <KPICard
        title="総売上"
        value="¥5,000,000"
        icon={<div>Icon</div>}
      />
    );

    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('数値がフォーマットされて表示される', () => {
    render(
      <KPICard
        title="新患数"
        value="25人"
        icon={<div>Icon</div>}
      />
    );

    expect(screen.getByText('25人')).toBeInTheDocument();
  });
});
