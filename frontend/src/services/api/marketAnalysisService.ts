import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';
import type { MarketAnalysis, CompetitorClinic } from '../../types';

interface MarketAnalysisResponse {
  data: MarketAnalysis;
  message?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

async function fetchCompetitorsFromGooglePlaces(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<CompetitorClinic[]> {
  if (!GOOGLE_MAPS_API_KEY) return [];

  try {
    const radiusM = Math.round(radiusKm * 1000);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusM}&type=dentist&keyword=歯科&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') return [];

    return (data.results as any[])
      .map((place: any) => {
        const lat = place.geometry.location.lat as number;
        const lng = place.geometry.location.lng as number;
        const distance = calcDistance(latitude, longitude, lat, lng);
        return {
          name: place.name as string,
          address: (place.vicinity || '') as string,
          latitude: lat,
          longitude: lng,
          distance: Math.round(distance * 100) / 100,
        };
      })
      .filter((c) => c.distance > 0 && c.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  } catch {
    return [];
  }
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    radiusKm: number,
    clinicLatitude: number,
    clinicLongitude: number
  ): Promise<MarketAnalysis> {
    const competitors = await fetchCompetitorsFromGooglePlaces(clinicLatitude, clinicLongitude, radiusKm);

    const response = await fetch(`${API_BASE_URL}/api/market-analysis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        clinic_id: clinicId,
        radius_km: radiusKm,
        ...(competitors.length > 0 && { competitors }),
      })
    });
    const result = await handleResponse<MarketAnalysisResponse>(response);
    return result.data;
  }
};
