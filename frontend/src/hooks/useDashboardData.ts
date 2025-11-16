import { useState, useEffect } from 'react';
import { DashboardService } from '../services/mock/dashboardService';
import { DashboardData } from '../types';

const service = new DashboardService();

export const useDashboardData = (clinicId: string) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await service.getDashboardData(clinicId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clinicId]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
