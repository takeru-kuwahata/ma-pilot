import { useState } from 'react';
import { GoogleMap as GoogleMapComponent, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Box, Typography } from '@mui/material';
import type { CompetitorClinic } from '../types';

interface GoogleMapProps {
  clinicLatitude: number;
  clinicLongitude: number;

  competitors: CompetitorClinic[];
  radiusKm: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

export const GoogleMap = ({
  clinicLatitude,
  clinicLongitude,
  competitors,
  radiusKm
}: GoogleMapProps) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorClinic | null>(null);

  const center = { lat: clinicLatitude, lng: clinicLongitude };

  const circleOptions = {
    strokeColor: '#1976d2',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#1976d2',
    fillOpacity: 0.1,
    radius: radiusKm * 1000,
  };

  return (
    <GoogleMapComponent
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={14}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {/* 商圏サークル */}
      <Circle center={center} options={circleOptions} />

      {/* 競合マーカー（赤）- クリックでクリニック名表示 */}
      {competitors.map((competitor, index) => (
        <Marker
          key={index}
          position={{ lat: competitor.latitude, lng: competitor.longitude }}
          title={competitor.name}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
          onClick={() => setSelectedCompetitor(competitor)}
        />
      ))}

      {/* クリック時のInfoWindow */}
      {selectedCompetitor && (
        <InfoWindow
          position={{ lat: selectedCompetitor.latitude, lng: selectedCompetitor.longitude }}
          onCloseClick={() => setSelectedCompetitor(null)}
        >
          <Box sx={{ maxWidth: '200px', padding: '4px' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              {selectedCompetitor.name}
            </Typography>
            {selectedCompetitor.website && (
              <a
                href={selectedCompetitor.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#1976d2', wordBreak: 'break-all' }}
              >
                ホームページを見る
              </a>
            )}
          </Box>
        </InfoWindow>
      )}
    </GoogleMapComponent>
  );
};
