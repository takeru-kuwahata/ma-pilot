import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { MonthlyData, MonthlyDataFormData, CsvImportResult } from '../../types';

interface MonthlyDataResponse {
  data: MonthlyData;
  message?: string;
}

interface MonthlyDataListResponse {
  data: MonthlyData[];
  message?: string;
}

export const monthlyDataService = {
  async getMonthlyData(clinicId: string, yearMonth?: string): Promise<MonthlyData[]> {
    const params = new URLSearchParams({ clinic_id: clinicId });
    if (yearMonth) {
      params.append('year_month', yearMonth);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/monthly-data?${params}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<MonthlyDataListResponse>(response);
    return result.data;
  },

  async createMonthlyData(data: MonthlyDataFormData & { clinicId: string }): Promise<MonthlyData> {
    const response = await fetch(`${API_BASE_URL}/api/monthly-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        clinic_id: data.clinicId,
        year_month: data.yearMonth,
        total_revenue: data.totalRevenue,
        insurance_revenue: data.insuranceRevenue,
        self_pay_revenue: data.selfPayRevenue,
        personnel_cost: data.variableCost,
        material_cost: 0,
        fixed_cost: data.fixedCost,
        other_cost: 0,
        new_patients: data.newPatients,
        returning_patients: data.returningPatients,
        total_patients: data.totalPatients,
        treatment_count: 0,
        average_revenue_per_patient: data.totalPatients > 0 ? data.totalRevenue / data.totalPatients : 0
      })
    });
    const result = await handleResponse<MonthlyDataResponse>(response);
    return result.data;
  },

  async updateMonthlyData(id: string, data: MonthlyDataFormData): Promise<MonthlyData> {
    const response = await fetch(`${API_BASE_URL}/api/monthly-data/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        year_month: data.yearMonth,
        total_revenue: data.totalRevenue,
        insurance_revenue: data.insuranceRevenue,
        self_pay_revenue: data.selfPayRevenue,
        personnel_cost: data.variableCost,
        fixed_cost: data.fixedCost,
        new_patients: data.newPatients,
        returning_patients: data.returningPatients,
        total_patients: data.totalPatients
      })
    });
    const result = await handleResponse<MonthlyDataResponse>(response);
    return result.data;
  },

  async deleteMonthlyData(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/monthly-data/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse<{ message: string }>(response);
  },

  async importCsv(clinicId: string, file: File): Promise<CsvImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `${API_BASE_URL}/api/monthly-data/import-csv?clinic_id=${clinicId}`,
      {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      }
    );
    return handleResponse<CsvImportResult>(response);
  }
};
