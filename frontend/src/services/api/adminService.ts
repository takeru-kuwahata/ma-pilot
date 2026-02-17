import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import { authService } from './authService';
import type { Clinic } from '../../types';

interface AdminDashboard {
  total_clinics: number;
  active_clinics: number;
  total_users: number;
  recent_data_entries: number;
}

interface ClinicResponse {
  data: Clinic;
  message?: string;
}

interface CreateClinicRequest {
  name: string;
  postal_code: string;
  address: string;
  phone_number: string;
  owner_id?: string;
  latitude?: number;
  longitude?: number;
}

interface AdminSettings {
  settings: {
    maintenance_mode: boolean;
    max_clinics: number;
    data_retention_days: number;
  };
}

export const adminService = {
  async getDashboard(): Promise<AdminDashboard> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/dashboard`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<AdminDashboard>(response);
  },

  async getClinics(): Promise<Clinic[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/clinics`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Clinic[]>(response);
  },

  async createClinic(request: CreateClinicRequest): Promise<Clinic> {
    const currentUser = authService.getCurrentUser();
    const ownerId = (request.owner_id && request.owner_id.trim() !== '')
      ? request.owner_id.trim()
      : currentUser?.id ?? '';
    const body: Record<string, unknown> = {
      name: request.name,
      postal_code: request.postal_code,
      address: request.address,
      phone_number: request.phone_number,
      latitude: request.latitude ?? 35.6762,
      longitude: request.longitude ?? 139.6503,
      owner_id: ownerId,
    };
    const response = await fetch(`${API_BASE_URL}/api/admin/clinics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const result = await handleResponse<ClinicResponse>(response);
    return result.data;
  },

  async deleteClinic(clinicId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/clinics/${clinicId}`,
      { method: 'DELETE', headers: getAuthHeaders() }
    );
    await handleResponse<{ message: string }>(response);
  },

  async activateClinic(clinicId: string): Promise<Clinic> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/clinics/${clinicId}/activate`,
      {
        method: 'PUT',
        headers: getAuthHeaders()
      }
    );
    const result = await handleResponse<ClinicResponse>(response);
    return result.data;
  },

  async deactivateClinic(clinicId: string): Promise<Clinic> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/clinics/${clinicId}/deactivate`,
      {
        method: 'PUT',
        headers: getAuthHeaders()
      }
    );
    const result = await handleResponse<ClinicResponse>(response);
    return result.data;
  },

  async getSettings(): Promise<AdminSettings> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/settings`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<AdminSettings>(response);
  },

  async updateSettings(settings: AdminSettings['settings']): Promise<{ message: string; settings: AdminSettings['settings'] }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse<{ message: string; settings: AdminSettings['settings'] }>(response);
  }
};
