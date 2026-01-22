import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { Report, ReportType, ReportFormat } from '../../types';

interface ReportResponse {
  data: Report;
  message?: string;
}

interface ReportListResponse {
  data: Report[];
  message?: string;
}

interface GenerateReportRequest {
  clinic_id: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  year_month?: string;
  start_date?: string;
  end_date?: string;
}

export const reportService = {
  async generateReport(request: GenerateReportRequest): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/api/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });
    const result = await handleResponse<ReportResponse>(response);
    return result.data;
  },

  async getReports(clinicId: string): Promise<Report[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/reports?clinic_id=${clinicId}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<ReportListResponse>(response);
    return result.data;
  },

  async downloadReport(reportId: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/api/reports/${reportId}/download`,
      {
        headers: getAuthHeaders(),
        redirect: 'manual'
      }
    );

    if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 307) {
      const location = response.headers.get('Location');
      if (location) return location;
    }

    const result = await handleResponse<{ file_url: string }>(response);
    return result.file_url;
  }
};
