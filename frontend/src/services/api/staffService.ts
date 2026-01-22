import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { User, UserRole } from '../../types';

interface InviteUserRequest {
  email: string;
  role: UserRole;
  clinic_id: string;
}

interface InviteUserResponse {
  message: string;
  invite_token: string;
}

interface UpdateUserRoleRequest {
  role: UserRole;
}

interface DeleteUserResponse {
  message: string;
}

export const staffService = {
  async getStaff(clinicId: string): Promise<User[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/staff?clinic_id=${clinicId}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<User[]>(response);
  },

  async inviteStaff(request: InviteUserRequest): Promise<InviteUserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/staff/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });
    return handleResponse<InviteUserResponse>(response);
  },

  async updateStaffRole(userId: string, role: UserRole): Promise<{ message: string }> {
    const request: UpdateUserRoleRequest = { role };
    const response = await fetch(`${API_BASE_URL}/api/staff/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });
    return handleResponse<{ message: string }>(response);
  },

  async deleteStaff(userId: string): Promise<DeleteUserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/staff/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<DeleteUserResponse>(response);
  }
};
