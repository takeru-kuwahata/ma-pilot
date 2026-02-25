import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { marketAnalysisService, authService, clinicService } from '../services/api';
import { GoogleMap } from '../components/GoogleMap';
import type { MarketAnalysis as MarketAnalysisType, Clinic } from '../types';

interface MarketStats {
  population: number;
  agingRate: number;
  competitorCount: number;
  marketPotential: number;
}

interface DemographicData {
  ageGroup: string;
  count: number;
  percentage: number;
}

export const MarketAnalysis = () => {
  const [analysis, setAnalysis] = useState<MarketAnalysisType | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketAnalysis();
  }, []);

  const loadMarketAnalysis = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        setLoading(false);
        return;
      }

      const [analysisData, clinicData] = await Promise.all([
        marketAnalysisService.getMarketAnalysis(user.clinic_id),
        clinicService.getClinic(user.clinic_id)
      ]);

      setAnalysis(analysisData);
      setClinic(clinicData);
    } catch (error) {
      console.error('Failed to load market analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats: MarketStats = analysis ? {
    population: analysis.population_data.total_population,
    agingRate: (analysis.population_data.age_groups.age65Plus / analysis.population_data.total_population) * 100,
    competitorCount: analysis.competitors.length,
    marketPotential: Math.round(analysis.market_share * 100)
  } : {
    population: 0,
    agingRate: 0,
    competitorCount: 0,
    marketPotential: 0
  };

  const demographics: DemographicData[] = analysis ? [
    {
      ageGroup: '0-14歳',
      count: analysis.population_data.age_groups.age0_14,
      percentage: (analysis.population_data.age_groups.age0_14 / analysis.population_data.total_population) * 100
    },
    {
      ageGroup: '15-64歳',
      count: analysis.population_data.age_groups.age15_64,
      percentage: (analysis.population_data.age_groups.age15_64 / analysis.population_data.total_population) * 100
    },
    {
      ageGroup: '65歳以上',
      count: analysis.population_data.age_groups.age65Plus,
      percentage: (analysis.population_data.age_groups.age65Plus / analysis.population_data.total_population) * 100
    }
  ] : [];
  return (
    <>
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
            {loading ? '...' : stats.population.toLocaleString()}
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
            {loading ? '...' : stats.agingRate.toFixed(1)}
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
            {loading ? '...' : stats.competitorCount}
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
            {loading ? '...' : stats.marketPotential}
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
        {loading ? (
          <Box
            sx={{
              width: '100%',
              height: '400px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '14px', color: '#616161' }}>
              地図を読み込み中...
            </Typography>
          </Box>
        ) : clinic && analysis ? (
          <GoogleMap
            clinicLatitude={clinic.latitude}
            clinicLongitude={clinic.longitude}
            clinicName={clinic.name}
            competitors={analysis.competitors}
            radiusKm={analysis.radius_km}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '400px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '14px', color: '#616161' }}>
              データがありません
            </Typography>
          </Box>
        )}
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
            {loading ? (
              <Box sx={{ textAlign: 'center', padding: '24px' }}>読み込み中...</Box>
            ) : analysis && analysis.competitors.length > 0 ? (
              analysis.competitors.map((competitor, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderBottom:
                      index < analysis.competitors.length - 1 ? '1px solid #e0e0e0' : 'none',
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
                    {competitor.distance.toFixed(1)}km
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', padding: '24px', color: '#757575' }}>
                データがありません
              </Box>
            )}
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
          <Box
            sx={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            {demographics.map((demo, index) => (
              <Box
                key={demo.ageGroup}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom:
                    index < demographics.length - 1 ? '1px solid #e0e0e0' : 'none',
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
    </>
  );
};
