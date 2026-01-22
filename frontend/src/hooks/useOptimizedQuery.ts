import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * React Query最適化設定
 * - キャッシュ戦略による不要なリクエスト削減
 * - パフォーマンス向上のための設定
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5分間はキャッシュを利用（stale状態にならない）
      staleTime: 1000 * 60 * 5,
      // 10分間キャッシュを保持
      gcTime: 1000 * 60 * 10,
      // ウィンドウフォーカス時の自動再取得を無効化
      refetchOnWindowFocus: false,
      // 再試行は1回まで
      retry: 1,
      // マウント時の自動再取得を無効化
      refetchOnMount: false,
    },
    mutations: {
      // エラー時は再試行しない
      retry: false,
    },
  },
});

/**
 * 頻繁に更新されるデータ用の設定（リアルタイム性重視）
 */
export const realtimeQueryOptions = {
  staleTime: 1000 * 30, // 30秒
  gcTime: 1000 * 60 * 2, // 2分
  refetchOnWindowFocus: true,
};

/**
 * あまり更新されないデータ用の設定（キャッシュ重視）
 */
export const staticQueryOptions = {
  staleTime: 1000 * 60 * 30, // 30分
  gcTime: 1000 * 60 * 60, // 1時間
  refetchOnWindowFocus: false,
};

// ==================== カスタムフック ====================

/**
 * 医院データ取得
 */
export const useClinicData = (clinicId: string) => {
  return useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => {
      const response = await fetch(`/api/clinics/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch clinic data');
      return response.json();
    },
    enabled: !!clinicId,
    ...staticQueryOptions, // 医院基本情報は変更頻度が低い
  });
};

/**
 * ダッシュボードデータ取得
 */
export const useDashboardData = (clinicId: string) => {
  return useQuery({
    queryKey: ['dashboard', clinicId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?clinic_id=${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!clinicId,
    staleTime: 1000 * 60 * 2, // 2分（ダッシュボードは定期的に更新）
  });
};

/**
 * 月次データ取得
 */
export const useMonthlyData = (clinicId: string, yearMonth?: string) => {
  return useQuery({
    queryKey: ['monthlyData', clinicId, yearMonth],
    queryFn: async () => {
      const params = new URLSearchParams({ clinic_id: clinicId });
      if (yearMonth) params.append('year_month', yearMonth);
      const response = await fetch(`/api/monthly-data?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch monthly data');
      return response.json();
    },
    enabled: !!clinicId,
  });
};

/**
 * シミュレーションデータ取得
 */
export const useSimulations = (clinicId: string) => {
  return useQuery({
    queryKey: ['simulations', clinicId],
    queryFn: async () => {
      const response = await fetch(`/api/simulations?clinic_id=${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch simulations');
      return response.json();
    },
    enabled: !!clinicId,
  });
};

/**
 * 診療圏分析データ取得
 */
export const useMarketAnalysis = (clinicId: string) => {
  return useQuery({
    queryKey: ['marketAnalysis', clinicId],
    queryFn: async () => {
      const response = await fetch(`/api/market-analysis/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch market analysis');
      return response.json();
    },
    enabled: !!clinicId,
    ...staticQueryOptions, // 診療圏分析は変更頻度が低い
  });
};

/**
 * レポート一覧取得
 */
export const useReports = (clinicId: string) => {
  return useQuery({
    queryKey: ['reports', clinicId],
    queryFn: async () => {
      const response = await fetch(`/api/reports?clinic_id=${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
    enabled: !!clinicId,
  });
};

/**
 * スタッフ一覧取得
 */
export const useStaffList = (clinicId: string) => {
  return useQuery({
    queryKey: ['staff', clinicId],
    queryFn: async () => {
      const response = await fetch(`/api/staff?clinic_id=${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch staff list');
      return response.json();
    },
    enabled: !!clinicId,
  });
};

// ==================== Mutation フック ====================

/**
 * 月次データ更新
 */
export const useUpdateMonthlyData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch('/api/monthly-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update monthly data');
      return response.json();
    },
    onSuccess: (_data, variables) => {
      // 関連するクエリを無効化して再フェッチ
      queryClient.invalidateQueries({ queryKey: ['monthlyData', variables.clinic_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.clinic_id] });
    },
  });
};

/**
 * シミュレーション作成
 */
export const useCreateSimulation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create simulation');
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['simulations', variables.clinic_id] });
    },
  });
};

/**
 * レポート生成
 */
export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.clinic_id] });
    },
  });
};

/**
 * 医院設定更新
 */
export const useUpdateClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clinicId, data }: { clinicId: string; data: Record<string, unknown> }) => {
      const response = await fetch(`/api/clinics/${clinicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update clinic');
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clinic', variables.clinicId] });
    },
  });
};

/**
 * スタッフ追加・更新
 */
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { clinicId: string; data: Record<string, unknown> }) => {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id ? `/api/staff/${data.id}` : '/api/staff';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update staff');
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff', variables.clinicId] });
    },
  });
};
