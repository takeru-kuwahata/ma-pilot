import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { Clinic, ClinicFormData } from '../../types';

interface ClinicResponse {
  data: Clinic;
  message?: string;
}

export const clinicService = {
  async getClinic(clinicId: string): Promise<Clinic> {
    const response = await fetch(`${API_BASE_URL}/api/clinics/${clinicId}`, {
      headers: getAuthHeaders()
    });
    const result = await handleResponse<ClinicResponse>(response);
    return result.data;
  },

  async updateClinic(clinicId: string, data: ClinicFormData): Promise<Clinic> {
    const response = await fetch(`${API_BASE_URL}/api/clinics/${clinicId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await handleResponse<ClinicResponse>(response);
    return result.data;
  }
};
