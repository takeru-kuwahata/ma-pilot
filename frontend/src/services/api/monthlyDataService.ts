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

  async createMonthlyData(data: MonthlyDataFormData & { clinic_id: string }): Promise<MonthlyData> {
    const response = await fetch(`${API_BASE_URL}/api/monthly-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        clinic_id: data.clinic_id,
        year_month: data.year_month,
        total_revenue: data.total_revenue,
        insurance_revenue: data.insurance_revenue,
        self_pay_revenue: data.self_pay_revenue,
        personnel_cost: data.variable_cost,
        material_cost: 0,
        fixed_cost: data.fixed_cost,
        other_cost: 0,
        new_patients: data.new_patients,
        returning_patients: data.returning_patients,
        total_patients: data.total_patients,
        treatment_count: 0,
        average_revenue_per_patient: data.total_patients > 0 ? data.total_revenue / data.total_patients : 0
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
        year_month: data.year_month,
        total_revenue: data.total_revenue,
        insurance_revenue: data.insurance_revenue,
        self_pay_revenue: data.self_pay_revenue,
        personnel_cost: data.variable_cost,
        fixed_cost: data.fixed_cost,
        new_patients: data.new_patients,
        returning_patients: data.returning_patients,
        total_patients: data.total_patients
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

  async importCsv(clinicId: string, csvData: unknown[]): Promise<CsvImportResult> {
    const response = await fetch(
      `${API_BASE_URL}/api/monthly-data/import-csv?clinic_id=${clinicId}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data: csvData })
      }
    );
    return handleResponse<CsvImportResult>(response);
  },

  async importCsvFile(clinicId: string, file: File): Promise<CsvImportResult> {
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
