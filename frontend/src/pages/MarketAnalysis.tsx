import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { Map as MapIcon } from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';

// @MOCK_TO_API: 診療圏分析データのモック
interface MarketStats {
  population: number;
  agingRate: number;
  competitorCount: number;
  marketPotential: number;
}

interface Competitor {
  id: string;
  name: string;
  distance: string;
}

interface DemographicData {
  ageGroup: string;
  count: number;
  percentage: number;
}

const mockStats: MarketStats = {
  population: 45230,
  agingRate: 28.5,
  competitorCount: 12,
  marketPotential: 87,
};

const mockCompetitors: Competitor[] = [
  { id: '1', name: 'やまだ歯科クリニック', distance: '徒歩5分 (400m)' },
  { id: '2', name: 'すずき歯科医院', distance: '徒歩8分 (650m)' },
  { id: '3', name: 'ひまわり歯科', distance: '徒歩12分 (950m)' },
  { id: '4', name: 'たなか歯科クリニック', distance: '徒歩15分 (1.2km)' },
];

const mockDemographics: DemographicData[] = [
  { ageGroup: '0-14歳', count: 5420, percentage: 12.0 },
  { ageGroup: '15-64歳', count: 27100, percentage: 59.9 },
  { ageGroup: '65歳以上', count: 12710, percentage: 28.1 },
];

export const MarketAnalysis = () => {
  return (
    <MainLayout>
      {/* ページヘッダー */}
      <Box sx={{ marginBottom: '24px' }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: '32px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          診療圏分析
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          人口統計、競合分析、市場ポテンシャル
        </Typography>
      </Box>

      {/* 統計サマリー */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              color: '#616161',
              marginBottom: '8px',
            }}
          >
            診療圏人口 (半径2km)
          </Typography>
          <Typography
            sx={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#424242',
            }}
          >
            {mockStats.population.toLocaleString()}
            <Typography
              component="span"
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginLeft: '4px',
              }}
            >
              人
            </Typography>
          </Typography>
        </Paper>

        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              color: '#616161',
              marginBottom: '8px',
            }}
          >
            高齢化率
          </Typography>
          <Typography
            sx={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#424242',
            }}
          >
            {mockStats.agingRate}
            <Typography
              component="span"
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginLeft: '4px',
              }}
            >
              %
            </Typography>
          </Typography>
        </Paper>

        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              color: '#616161',
              marginBottom: '8px',
            }}
          >
            競合歯科数 (半径2km)
          </Typography>
          <Typography
            sx={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#424242',
            }}
          >
            {mockStats.competitorCount}
            <Typography
              component="span"
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginLeft: '4px',
              }}
            >
              院
            </Typography>
          </Typography>
        </Paper>

        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              color: '#616161',
              marginBottom: '8px',
            }}
          >
            市場ポテンシャル
          </Typography>
          <Typography
            sx={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#424242',
            }}
          >
            {mockStats.marketPotential}
            <Typography
              component="span"
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginLeft: '4px',
              }}
            >
              点
            </Typography>
          </Typography>
        </Paper>
      </Box>

      {/* 地図エリア */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          marginBottom: '24px',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          診療圏マップ
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: '400px',
            backgroundColor: '#e0e0e0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#616161',
            fontSize: '16px',
            gap: '16px',
          }}
        >
          <MapIcon sx={{ fontSize: '48px', color: '#9e9e9e' }} />
          <Typography sx={{ fontSize: '16px', color: '#616161' }}>
            Google Maps統合（Phase 5以降）
          </Typography>
        </Box>
      </Paper>

      {/* 競合分析と人口統計を2列レイアウト */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
        }}
      >
        {/* 競合分析 */}
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            周辺競合歯科医院
          </Typography>
          <Box>
            {mockCompetitors.map((competitor, index) => (
              <Box
                key={competitor.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom:
                    index < mockCompetitors.length - 1 ? '1px solid #e0e0e0' : 'none',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {competitor.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: '#616161',
                  }}
                >
                  {competitor.distance}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 人口統計 */}
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            診療圏内人口統計
          </Typography>
          <Typography
            sx={{
              color: '#616161',
              fontSize: '14px',
              marginTop: '8px',
            }}
          >
            e-Stat APIを活用した詳細な人口統計データ（Phase 6以降で実装）
          </Typography>
          <Box
            sx={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            {mockDemographics.map((demo, index) => (
              <Box
                key={demo.ageGroup}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom:
                    index < mockDemographics.length - 1 ? '1px solid #e0e0e0' : 'none',
                }}
              >
                <Typography sx={{ fontSize: '14px' }}>{demo.ageGroup}</Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                  {demo.count.toLocaleString()}人 ({demo.percentage}%)
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
};
