import { memo, useMemo } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  growthRate?: number;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const KPICard = memo<KPICardProps>(({
  title,
  value,
  unit = '',
  growthRate,
  icon,
  color = 'primary',
}) => {
  // メモ化: 成長率の計算結果をキャッシュ
  const { isPositiveGrowth, hasGrowth } = useMemo(() => ({
    isPositiveGrowth: growthRate !== undefined && growthRate >= 0,
    hasGrowth: growthRate !== undefined && growthRate !== 0,
  }), [growthRate]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: `${color}.main` }}>
              {icon}
            </Box>
          )}
        </Box>

        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && (
            <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
              {unit}
            </Typography>
          )}
        </Typography>

        {hasGrowth && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositiveGrowth ? (
              <TrendingUpIcon fontSize="small" color="success" />
            ) : (
              <TrendingDownIcon fontSize="small" color="error" />
            )}
            <Typography
              variant="body2"
              sx={{
                color: isPositiveGrowth ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {isPositiveGrowth ? '+' : ''}{growthRate?.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              前月比
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

KPICard.displayName = 'KPICard';
