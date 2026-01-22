import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { DashboardData } from '../../types';

interface DashboardResponse {
  data: DashboardData;
  message?: string;
}

export const dashboardService = {
  async getDashboard(clinicId: string): Promise<DashboardData> {
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard?clinic_id=${clinicId}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<DashboardResponse>(response);
    return result.data;
  }
};
