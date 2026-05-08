import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { ConsultingReport } from '../../types';

interface ConsultingResponse {
  data: ConsultingReport;
}

export const consultingService = {
  async getReport(clinicId: string): Promise<ConsultingReport> {
    const response = await fetch(
      `${API_BASE_URL}/api/consulting/${clinicId}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<ConsultingResponse>(response);
    return result.data;
  },

  async logRecommendationClick(clinicId: string, serviceId: string, problemTag?: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/partners/recommendation-log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ clinic_id: clinicId, service_id: serviceId, problem_tag: problemTag }),
    });
  },

  async getMemo(clinicId: string): Promise<string | null> {
    const response = await fetch(`${API_BASE_URL}/api/consulting/${clinicId}/memo`, { headers: getAuthHeaders() });
    const result = await handleResponse<{ memo: string | null }>(response);
    return result.memo;
  },

  async saveMemo(clinicId: string, memo: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/consulting/${clinicId}/memo`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ memo }),
    });
  },
};
