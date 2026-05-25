import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { LoadScript } from '@react-google-maps/api';
import { marketAnalysisService, clinicService } from '../services/api';
import { GoogleMap } from '../components/GoogleMap';
import type { MarketAnalysis as MarketAnalysisType, Clinic, CompetitorClinic } from '../types';

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

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function searchByKeyword(
  service: google.maps.places.PlacesService,
  location: google.maps.LatLng,
  clinicLat: number,
  clinicLng: number,
  radiusKm: number,
  keyword: string
): Promise<{ place: google.maps.places.PlaceResult; lat: number; lng: number; distance: number }[]> {
  return new Promise((resolve) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location,
      rankBy: window.google.maps.places.RankBy.DISTANCE,
      keyword,
    };
    service.nearbySearch(request, (results, status) => {
      if (
        (status !== window.google.maps.places.PlacesServiceStatus.OK &&
          status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) ||
        !results
      ) {
        resolve([]);
        return;
      }
      resolve(
        results
          .map((place) => {
            const lat = place.geometry?.location?.lat() ?? 0;
            const lng = place.geometry?.location?.lng() ?? 0;
            return { place, lat, lng, distance: calcDistance(clinicLat, clinicLng, lat, lng) };
          })
          .filter((c) => c.distance > 0 && c.distance <= radiusKm)
      );
    });
  });
}

function getDetails(
  service: google.maps.places.PlacesService,
  place: google.maps.places.PlaceResult,
  lat: number,
  lng: number,
  distance: number
): Promise<CompetitorClinic> {
  return new Promise((res) => {
    if (!place.place_id) {
      res({ name: place.name ?? 'Unknown', address: place.vicinity ?? '', latitude: lat, longitude: lng, distance: Math.round(distance * 100) / 100 });
      return;
    }
    service.getDetails(
      { placeId: place.place_id, fields: ['website'] },
      (detail, detailStatus) => {
        res({
          name: place.name ?? 'Unknown',
          address: place.vicinity ?? '',
          latitude: lat,
          longitude: lng,
          distance: Math.round(distance * 100) / 100,
          website: detailStatus === window.google.maps.places.PlacesServiceStatus.OK ? (detail?.website ?? undefined) : undefined,
        });
      }
    );
  });
}

async function searchNearbyByDistance(
  service: google.maps.places.PlacesService,
  location: google.maps.LatLng,
  clinicLat: number,
  clinicLng: number,
  radiusKm: number
): Promise<CompetitorClinic[]> {
  // 複数キーワードで並列検索して結果を統合（place_idで重複排除）
  const keywords = ['歯科', 'dental clinic', 'デンタルクリニック'];

  const allResults = await Promise.all(
    keywords.map((kw) => searchByKeyword(service, location, clinicLat, clinicLng, radiusKm, kw))
  );

  const seen = new Set<string>();
  const merged = allResults.flat().filter(({ place, lat, lng }) => {
    const key = place.place_id ?? `${lat},${lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.distance - b.distance);

  // getDetails でホームページURLを順番に取得（API制限対策で50ms間隔）
  const competitors: CompetitorClinic[] = [];
  for (const { place, lat, lng, distance } of merged) {
    await new Promise<void>((res) => setTimeout(res, 50));
    const competitor = await getDetails(service, place, lat, lng, distance);
    competitors.push(competitor);
  }
  return competitors;
}

function fetchCompetitorsViaSdk(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<CompetitorClinic[]> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places) {
      resolve([]);
      return;
    }

    const mapDiv = document.createElement('div');
    const map = new window.google.maps.Map(mapDiv);
    const service = new window.google.maps.places.PlacesService(map);
    const location = new window.google.maps.LatLng(latitude, longitude);

    // rankBy: DISTANCE で近い順に取得し、radiusKm以内でフィルタ
    searchNearbyByDistance(service, location, latitude, longitude, radiusKm).then(resolve);
  });
}

export const MarketAnalysis = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [analysis, setAnalysis] = useState<MarketAnalysisType | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // track whether Maps JS SDK is ready
  const mapsReadyRef = useRef(false);

  useEffect(() => {
    loadMarketAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  // Poll until google.maps.places is available (LoadScript loads it asynchronously)
  useEffect(() => {
    const check = setInterval(() => {
      if (window.google?.maps?.places) {
        mapsReadyRef.current = true;
        clearInterval(check);
      }
    }, 200);
    return () => clearInterval(check);
  }, []);

  const loadMarketAnalysis = async () => {
    try {
      if (!clinicId) {
        setLoading(false);
        return;
      }

      const clinicData = await clinicService.getClinic(clinicId);
      setClinic(clinicData);

      try {
        const analysisData = await marketAnalysisService.getMarketAnalysis(clinicData.id);
        setAnalysis(analysisData);
        setError(null);
      } catch (analysisError: unknown) {
        const msg = analysisError instanceof Error ? analysisError.message : '';
        if (msg.includes('404') || msg.includes('not found')) {
          setAnalysis(null);
          setError(null);
        } else {
          throw analysisError;
        }
      }
    } catch (err) {
      console.error('Failed to load market analysis:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!clinic) return;

    try {
      setAnalyzing(true);
      setError(null);

      // Wait up to 5 seconds for Maps SDK to be ready
      let waited = 0;
      while (!mapsReadyRef.current && waited < 5000) {
        await new Promise((r) => setTimeout(r, 200));
        waited += 200;
      }

      const competitors = await fetchCompetitorsViaSdk(clinic.latitude, clinic.longitude, 2);

      const analysisData = await marketAnalysisService.createMarketAnalysis(
        clinic.id,
        2,
        competitors
      );
      setAnalysis(analysisData);
    } catch (err) {
      console.error('Failed to run analysis:', err);
      setError('分析の実行に失敗しました');
    } finally {
      setAnalyzing(false);
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
      <Box sx={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
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
        {!loading && clinic && (
          <Button
            variant="contained"
            onClick={handleRunAnalysis}
            disabled={analyzing}
            startIcon={analyzing ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : <RefreshIcon />}
            sx={{
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#E55A2B' },
              minWidth: '160px',
            }}
          >
            {analyzing ? '分析中...' : analysis ? '再分析' : '分析を実行'}
          </Button>
        )}
      </Box>

      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ marginBottom: '24px' }}>
          {error}
        </Alert>
      )}

      {/* 分析データがない場合のメッセージ */}
      {!loading && !analysis && !error && (
        <Alert severity="info" sx={{ marginBottom: '24px' }}>
          診療圏分析データがまだ作成されていません。右上の「分析を実行」ボタンをクリックして分析を開始してください。
        </Alert>
      )}

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
            <Typography component="span" sx={{ fontSize: '11px', color: '#9e9e9e', display: 'block' }}>
              ※65歳以上
            </Typography>
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
            <Typography component="span" sx={{ fontSize: '11px', color: '#9e9e9e', display: 'block' }}>
              ※100÷競合院数（高いほど有利）
            </Typography>
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
          <>
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}
              libraries={['places']}
            >
              <GoogleMap
                clinicLatitude={clinic.latitude}
                clinicLongitude={clinic.longitude}
                clinicName={clinic.name}
                competitors={analysis.competitors}
                radiusKm={analysis.radius_km}
              />
            </LoadScript>
            <Typography sx={{ fontSize: '12px', color: '#d32f2f', marginTop: '8px' }}>
              ※ 競合医院の表示はGoogleマップのデータに基づいています。登録状況によっては一部の医院が表示されない場合があります。表示件数・位置情報の完全な正確性は保証できません。
            </Typography>
          </>
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
                    padding: '10px 12px',
                    borderBottom:
                      index < analysis.competitors.length - 1 ? '1px solid #e0e0e0' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                      {competitor.name}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#616161', whiteSpace: 'nowrap', ml: 1 }}>
                      {competitor.distance.toFixed(1)}km
                    </Typography>
                  </Box>
                  {competitor.address && (
                    <Typography sx={{ fontSize: '12px', color: '#9e9e9e', mt: 0.25 }}>
                      {competitor.address}
                    </Typography>
                  )}
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
                  {demo.count.toLocaleString()}人 ({Number(demo.percentage).toFixed(1)}%)
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </>
  );
};
