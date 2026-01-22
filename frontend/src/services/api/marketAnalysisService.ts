import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { MarketAnalysis } from '../../types';

interface MarketAnalysisResponse {
  data: MarketAnalysis;
  message?: string;
}

export const marketAnalysisService = {
  async getMarketAnalysis(clinicId: string): Promise<MarketAnalysis> {
    const response = await fetch(
      `${API_BASE_URL}/api/market-analysis/${clinicId}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<MarketAnalysisResponse>(response);
    return result.data;
  },

  async createMarketAnalysis(
    clinicId: string,
    radiusKm: number
  ): Promise<MarketAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/market-analysis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        clinic_id: clinicId,
        radius_km: radiusKm
      })
    });
    const result = await handleResponse<MarketAnalysisResponse>(response);
    return result.data;
  }
};
