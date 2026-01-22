import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { Simulation, SimulationInput } from '../../types';

interface SimulationResponse {
  data: Simulation;
  message?: string;
}

interface SimulationListResponse {
  data: Simulation[];
  message?: string;
}

export const simulationService = {
  async createSimulation(
    clinicId: string,
    title: string,
    input: SimulationInput
  ): Promise<Simulation> {
    const response = await fetch(`${API_BASE_URL}/api/simulations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        clinic_id: clinicId,
        title,
        input
      })
    });
    const result = await handleResponse<SimulationResponse>(response);
    return result.data;
  },

  async getSimulations(clinicId: string): Promise<Simulation[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/simulations?clinic_id=${clinicId}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<SimulationListResponse>(response);
    return result.data;
  },

  async getSimulation(simulationId: string): Promise<Simulation> {
    const response = await fetch(
      `${API_BASE_URL}/api/simulations/${simulationId}`,
      { headers: getAuthHeaders() }
    );
    const result = await handleResponse<SimulationResponse>(response);
    return result.data;
  }
};
