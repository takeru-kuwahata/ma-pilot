import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Alert, CircularProgress,
  Chip, Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogContent, DialogTitle, IconButton, LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardKpi, ConsultingReport, GamificationData, Proposal, ProposalPriority, ScoreLevel } from '../types';
import { consultingService } from '../services/api/consultingService';
import { gamificationService } from '../services/api/gamificationService';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

// KPIカードコンポーネント
const KpiCard = ({ kpi }: { kpi: DashboardKpi }) => {
  const isPositive = kpi.comparison.trend === 'positive';
  const trendColor = isPositive ? '#388E3C' : '#D32F2F';
  const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon;
  const yoyValue = kpi.comparison.year_over_year;
  const yoyPositive = yoyValue >= 0;

  const formatValue = () => {
    if (kpi.unit === '¥') {
      return `¥${kpi.value.toLocaleString()}`;
    } else if (kpi.unit === '%') {
      return `${kpi.value.toFixed(1)}%`;
    } else {
      return `${kpi.value.toLocaleString()}${kpi.unit}`;
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 2 }}>
        {kpi.label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        {formatValue()}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
        <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600 }}>
          {isPositive ? '+' : ''}{kpi.comparison.month_over_month.toFixed(1)}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          前月比
        </Typography>
      </Box>
      {yoyValue !== 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: yoyPositive ? '#388E3C' : '#D32F2F', fontWeight: 600 }}>
            {yoyPositive ? '+' : ''}{yoyValue.toFixed(1)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            前年同月比
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// ---- ユーティリティ ----

const PRIORITY_COLOR: Record<ProposalPriority, string> = {
  critical: '#D32F2F',
  high: '#F57C00',
  medium: '#F9A825',
  low: '#1565C0',
};

const PRIORITY_LABEL: Record<ProposalPriority, string> = {
  critical: '緊急',
  high: '高',
  medium: '中',
  low: '良好',
};

const LEVEL_COLOR: Record<ScoreLevel, string> = {
  critical: '#D32F2F',
  poor: '#F57C00',
  average: '#F9A825',
  good: '#388E3C',
  excellent: '#1565C0',
};

const RANK_COLOR: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#A0A0A0',
  gold: '#FFD700',
  platinum: '#7B68EE',
  diamond: '#1565C0',
};

// ---- 提案カード ----
const ProposalCard = ({
  proposal, clinicId,
}: { proposal: Proposal; clinicId: string }) => {
  const handleServiceClick = async (serviceId: string) => {
    await consultingService.logRecommendationClick(clinicId, serviceId, proposal.problem_tag);
  };

  return (
    <Paper sx={{ mb: 2, border: `2px solid ${PRIORITY_COLOR[proposal.priority]}20` }}>
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Chip
              label={PRIORITY_LABEL[proposal.priority]}
              size="small"
              sx={{ bgcolor: PRIORITY_COLOR[proposal.priority], color: '#fff', fontWeight: 700, minWidth: 36 }}
            />
            <Chip label={proposal.category} size="small" variant="outlined" />
            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
              {proposal.title}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pb: 2 }}>
          {/* Why */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
            なぜ問題か
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
            {proposal.why}
          </Typography>

          {/* What */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
            目標
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {proposal.what}
          </Typography>

          {/* How */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
            具体的な施策
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 1.5 }}>
            {proposal.how.map((action, i) => (
              <Typography key={i} component="li" variant="body2" sx={{ mb: 0.25 }}>
                {action}
              </Typography>
            ))}
          </Box>

          {/* 期待効果 */}
          <Paper sx={{ p: 1.5, bgcolor: '#E8F5E9', mb: 2 }} elevation={0}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#388E3C' }}>期待効果</Typography>
            <Typography variant="body2">{proposal.expected_impact}</Typography>
          </Paper>

          {/* レコメンドサービス */}
          {proposal.recommended_services.length > 0 && (
            <Box>
              {/* セクションヘッダー */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1, mb: 1.5,
                px: 1.5, py: 1,
                bgcolor: '#FFF3E0',
                borderRadius: 1,
                border: '1px solid #FFB74D',
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#E65100', fontSize: '0.75rem' }}>
                  🏅 メディカルアドバンスのおすすめサービス
                </Typography>
                <Typography variant="caption" sx={{ color: '#BF360C', fontSize: '0.68rem' }}>
                  ※ シカレッジ掲載ページから申し込むと特典あり
                </Typography>
              </Box>
              <Grid container spacing={1.5}>
                {proposal.recommended_services.map((svc) => (
                  <Grid item xs={12} sm={6} md={4} key={svc.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: '1.5px solid #FFB74D',
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #FFFDE7 0%, #FFF8E1 100%)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#F57C00',
                          boxShadow: '0 4px 12px rgba(245, 124, 0, 0.2)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => {
                        handleServiceClick(svc.id);
                        if (svc.service_url) window.open(svc.service_url, '_blank');
                      }}
                    >
                      {/* MA推薦バッジ */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Chip
                          label="MA推薦"
                          size="small"
                          sx={{
                            bgcolor: '#E65100', color: '#fff', fontWeight: 700,
                            fontSize: '0.6rem', height: 'auto',
                            '& .MuiChip-label': { px: '8px', py: '3px' },
                          }}
                        />
                        <Chip
                          label="シカレッジ特典あり"
                          size="small"
                          sx={{
                            bgcolor: '#1565C0', color: '#fff', fontWeight: 600,
                            fontSize: '0.6rem', height: 'auto',
                            '& .MuiChip-label': { px: '8px', py: '3px' },
                          }}
                        />
                      </Box>
                      {/* サービス名 */}
                      {svc.company_name && (
                        <Typography variant="caption" sx={{ color: '#795548', fontWeight: 500, display: 'block' }}>
                          {svc.company_name}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#212121', mb: 0.5, lineHeight: 1.3 }}>
                        {svc.service_name}
                      </Typography>
                      {svc.catchcopy && (
                        <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 600, display: 'block', mb: 0.5 }}>
                          {svc.catchcopy}
                        </Typography>
                      )}
                      {svc.price_range && (
                        <Typography variant="caption" sx={{ color: '#555555', display: 'block', mb: 1 }}>
                          {svc.price_range}
                        </Typography>
                      )}
                      {/* CTA */}
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        pt: 1, borderTop: '1px solid #FFD54F',
                      }}>
                        <OpenInNewIcon sx={{ fontSize: 13, color: '#1565C0' }} />
                        <Typography variant="caption" sx={{ color: '#1565C0', fontWeight: 700 }}>
                          シカレッジで特典・詳細を確認する
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

// ---- ゲーミフィケーションカード ----
const GamificationCard = ({ data }: { data: GamificationData }) => {
  const radarData = data.parameters.map((p) => ({
    subject: p.label,
    value: p.value,
    prev: p.previous,
  }));

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TrophyIcon sx={{ color: RANK_COLOR[data.current_rank] || '#CD7F32', fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {data.rank_label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            全国上位 <strong>{data.percentile}%</strong>
            {data.next_rank_label && ` ／ ${data.next_rank_label}まであと ${data.points_to_next_rank}点`}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', textAlign: 'right' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: RANK_COLOR[data.current_rank] }}>
            {data.total_score}点
          </Typography>
          <Typography variant="caption" sx={{ color: '#555555' }}>経営健診スコア</Typography>
        </Box>
      </Box>

      {/* 次ランクまでのプログレスバー */}
      {data.next_rank_label && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, data.total_score)}
            sx={{ height: 8, borderRadius: 4, bgcolor: '#E0E0E0',
              '& .MuiLinearProgress-bar': { bgcolor: RANK_COLOR[data.current_rank] } }}
          />
        </Box>
      )}

      {/* レーダーチャート */}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>能力パラメーター</Typography>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: '13px' }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="前月" dataKey="prev" stroke="#BDBDBD" fill="#BDBDBD" fillOpacity={0.2} strokeDasharray="4 2" />
          <Radar name="今月" dataKey="value" stroke="#1976D2" fill="#1976D2" fillOpacity={0.35} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>

      {/* 連続入力記録 */}
      <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">連続入力</Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>{data.consecutive_months}ヶ月</Typography>
          {data.streak_start_month && (() => {
            const [y, m] = data.streak_start_month.split('-');
            return (
              <Typography variant="caption" color="text.secondary" display="block">
                {`${y}年${parseInt(m)}月〜`}
              </Typography>
            );
          })()}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">累計入力</Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>{data.total_input_months}ヶ月</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// ---- キャラクターポップアップ ----
const CharacterPopup = ({
  open, onClose, message, mood, characterType,
}: {
  open: boolean;
  onClose: () => void;
  message: string;
  mood: string;
  characterType: string;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: '50%', bgcolor: '#E3F2FD',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
      }}>
        {/* キャラクター画像プレースホルダー（後で差し替え） */}
        {characterType === 'advanbi' ? '🦌' : characterType === 'assistant' ? '👩‍⚕️' : '👨‍⚕️'}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
        {characterType === 'advanbi' ? 'アドバンビ' : characterType === 'assistant' ? '歯科助手' : '勤務医'}
      </Typography>
      <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
    </DialogTitle>
    <DialogContent>
      <Paper sx={{ p: 2, bgcolor: mood === 'celebrate' ? '#FFF8E1' : '#F5F5F5', borderRadius: 2 }} elevation={0}>
        <Typography variant="body1">{message}</Typography>
      </Paper>
    </DialogContent>
  </Dialog>
);

// ---- メインコンポーネント ----
export const Dashboard = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [consulting, setConsulting] = useState<ConsultingReport | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [consultingLoading, setConsultingLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const { data, loading, error } = useDashboardData(clinicId || null);

  useEffect(() => {
    if (!clinicId) return;
    // setConsultingLoading はPromise起動前に呼ぶ必要があるためタイマーで包む
    const timer = setTimeout(() => setConsultingLoading(true), 0);
    Promise.all([
      consultingService.getReport(clinicId).catch(() => null),
      gamificationService.getData(clinicId).catch(() => null),
    ] as const).then(([c, g]) => {
      setConsulting(c);
      setGamification(g);

      // 初回ウェルカムポップアップ（同じブラウザで1度のみ・localStorageで永続化）
      const welcomeKey = `welcome_shown_${clinicId}`;
      if (!localStorage.getItem(welcomeKey)) {
        setPopupOpen(true);
        localStorage.setItem(welcomeKey, '1');
        return;
      }
      // 新しい節目イベントがあればポップアップ表示（セッション内で1回のみ）
      if (g && g.new_milestones.length > 0) {
        const sessionKey = `milestone_shown_${clinicId}`;
        const shownKeys = sessionStorage.getItem(sessionKey) || '';
        const newKeys = g.new_milestones.map((m: { key: string }) => m.key).join(',');
        if (shownKeys !== newKeys) {
          setPopupOpen(true);
          sessionStorage.setItem(sessionKey, newKeys);
        }
      }
    }).finally(() => setConsultingLoading(false));
    return () => clearTimeout(timer);
  }, [clinicId]);

  // clinicIdが取得できない場合
  if (!clinicId && !loading) {
    return (
      <Alert severity="warning">
        表示する医院データがありません。医院を選択してください。
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert severity="error">
        データの取得に失敗しました。しばらくしてから再度お試しください。
      </Alert>
    );
  }


  // グラフデータのフォーマット（月次推移）
  let chartData: Array<{ month: string; 総売上: number; 営業利益: number }> = [];
  let patientChartData: Array<{ month: string; 新患: number; 既存患者: number }> = [];

  try {
    chartData = (data.trends || [])
      .map((trend) => {
        if (!trend?.year_month || trend.year_month.length < 7) {
          return null;
        }
        return {
          month: trend.year_month.substring(5, 7) + '月',
          総売上: Math.round(trend.total_revenue / 10000),
          営業利益: Math.round(trend.operating_profit / 10000),
        };
      })
      .filter((item): item is { month: string; 総売上: number; 営業利益: number } => item !== null);

    // 患者数推移データ
    patientChartData = (data.trends || [])
      .map((trend) => {
        if (!trend?.year_month || trend.year_month.length < 7) {
          return null;
        }
        return {
          month: trend.year_month.substring(5, 7) + '月',
          新患: trend.new_patients,
          既存患者: trend.returning_patients,
        };
      })
      .filter((item): item is { month: string; 新患: number; 既存患者: number } => item !== null);
  } catch (error) {
    console.error('[Dashboard] Error formatting chart data:', error);
  }

  return (
    <>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500, mb: 1 }}>
          経営ダッシュボード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.last_updated} のデータ（データソース: {data.data_source}）
        </Typography>
      </Box>

        {/* アラート */}
        {data.alerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {data.alerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.severity}
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {alert.title}
                </Typography>
                <Typography variant="caption">
                  {alert.message}
                </Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* KPIカードグリッド */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {data.kpis.map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.id}>
              <KpiCard kpi={kpi} />
            </Grid>
          ))}
        </Grid>


        {/* グラフセクション */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* 売上・利益推移グラフ */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                売上・利益推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: '13px' }} />
                  <YAxis tick={{ fontSize: '13px' }} />
                  <Tooltip formatter={(value: number) => [Number(value).toFixed(1), '']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="総売上"
                    stroke="#FF6B35"
                    strokeWidth={2}
                    name="総売上（万円）"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="営業利益"
                    stroke="#1976D2"
                    strokeWidth={2}
                    name="営業利益（万円）"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* 患者数推移グラフ */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                患者数推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={patientChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: '13px' }} />
                  <YAxis tick={{ fontSize: '13px' }} />
                  <Tooltip formatter={(value: number) => [Number(value).toFixed(1), '']} />
                  <Legend />
                  <Bar dataKey="新患" fill="#FF6B35" name="新患（人）" />
                  <Bar dataKey="既存患者" fill="#1976D2" name="既存患者（人）" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* 変動費率・自費率推移グラフ */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                変動費率推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={(data.trends || []).map((t) => ({
                    month: (t?.year_month || '0000-00').substring(5, 7) + '月',
                    変動費率: Math.round((t?.unit_utilization ?? 0) * 10) / 10,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: '13px' }} />
                  <YAxis tick={{ fontSize: '13px' }} unit="%" />
                  <Tooltip formatter={(value: number) => [`${Number(value).toFixed(1)}%`, '']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="変動費率"
                    stroke="#388E3C"
                    strokeWidth={2}
                    name="変動費率（%）"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                自費率推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={(data.trends || []).map((t) => ({
                    month: (t?.year_month || '0000-00').substring(5, 7) + '月',
                    自費率: t?.self_pay_rate ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: '13px' }} />
                  <YAxis tick={{ fontSize: '13px' }} />
                  <Tooltip formatter={(value: number) => [Number(value).toFixed(1), '']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="自費率"
                    stroke="#F57C00"
                    strokeWidth={2}
                    name="自費率（%）"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* ===== 経営健診・ゲーミフィケーションセクション ===== */}
        {consultingLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!consultingLoading && (gamification || consulting) && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              経営健診レポート
            </Typography>

            <Grid container spacing={3}>
              {/* 左: ゲーミフィケーション */}
              <Grid item xs={12} lg={4}>
                {gamification && <GamificationCard data={gamification} />}
              </Grid>

              {/* 右: KPIスコア一覧 */}
              <Grid item xs={12} lg={8}>
                {consulting && (
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>指標別スコア</Typography>
                      <Typography variant="caption" color="text.secondary">
                        診断月: {consulting.year_month}
                      </Typography>
                    </Box>
                    {!consulting.has_enough_data && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        3ヶ月以上のデータが揃うと、より精度の高い分析が可能になります。
                      </Alert>
                    )}
                    <Grid container spacing={1.5}>
                      {consulting.kpi_scores.map((ks) => (
                        <Grid item xs={12} sm={6} key={ks.key}>
                          <Paper variant="outlined" sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{ks.label}</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Box key={i} sx={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: '50%',
                                    bgcolor: i <= ks.score ? LEVEL_COLOR[ks.level] : '#E0E0E0',
                                  }} />
                                ))}
                              </Box>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                              {ks.value.toFixed(1)}{ks.unit}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{ks.benchmark_label}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}
              </Grid>
            </Grid>

            {/* 改善提案セクション */}
            {consulting && consulting.proposals.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  💡 経営改善提案（優先度順）
                </Typography>
                {consulting.proposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} clinicId={clinicId!} />
                ))}
              </Box>
            )}

            {consulting && consulting.proposals.length === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                現在、緊急性の高い改善提案はありません。引き続き現状を維持しましょう！
              </Alert>
            )}

          </Box>
        )}

        {/* キャラクターポップアップ */}
        <CharacterPopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          message={gamification?.character_message ?? 'MA-Pilotへようこそ！ ぼくはアドバンビ。経営データを一緒に分析して、医院の成長をサポートするよ。まずは今月のデータを入力してみてね！'}
          mood={gamification?.character_mood ?? 'happy'}
          characterType={gamification?.character_type ?? 'advanbi'}
        />
    </>
  );
};
