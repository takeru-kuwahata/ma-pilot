import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyData } from '../types';

interface RevenueChartProps {
  data: MonthlyData[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  // グラフ用にデータを整形
  const chartData = data.map((item) => ({
    month: item.yearMonth.substring(5), // "2024-10" → "10"
    売上: item.totalRevenue / 10000, // 万円単位に変換
    利益: (item.totalRevenue - item.personnelCost - item.materialCost - item.fixedCost - item.otherCost) / 10000,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          月次売上・利益推移
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                label={{ value: '月', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis label={{ value: '万円', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(0)}万円`}
                labelFormatter={(label) => `${label}月`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="売上"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="利益"
                stroke="#4caf50"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};
