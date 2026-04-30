import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { GamificationData } from '../../types';

interface GamificationResponse {
  data: GamificationData;
}

export const gamificationService = {
  async getData(clinicId: string): Promise<GamificationData> {
    const response = await fetch(
      `${API_BASE_URL}/api/gamification/${clinicId}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<GamificationResponse>(response);
    return result.data;
  },

  async updateCharacter(clinicId: string, characterType: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/gamification/${clinicId}/character`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ character_type: characterType }),
    });
  },
};
