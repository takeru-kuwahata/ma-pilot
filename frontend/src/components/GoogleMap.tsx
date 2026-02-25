import { useState, useEffect } from 'react';
import { GoogleMap as GoogleMapComponent, LoadScript, Marker, Circle } from '@react-google-maps/api';
import { Box, Typography } from '@mui/material';
import type { CompetitorClinic } from '../types';

interface GoogleMapProps {
  clinicLatitude: number;
  clinicLongitude: number;
  clinicName: string;
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
  clinicName,
  competitors,
  radiusKm
}: GoogleMapProps) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setError('Google Maps APIキーが設定されていません');
    } else {
      setApiKey(key);
    }
  }, []);

  const center = {
    lat: clinicLatitude,
    lng: clinicLongitude
  };

  const circleOptions = {
    strokeColor: '#1976d2',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#1976d2',
    fillOpacity: 0.1,
    radius: radiusKm * 1000 // Convert km to meters
  };

  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '400px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography sx={{ color: '#d32f2f', fontSize: '14px' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!apiKey) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '400px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography sx={{ color: '#616161', fontSize: '14px' }}>
          地図を読み込み中...
        </Typography>
      </Box>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMapComponent
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        }}
      >
        {/* Clinic marker (blue) */}
        <Marker
          position={center}
          title={clinicName}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }}
        />

        {/* Radius circle */}
        <Circle
          center={center}
          options={circleOptions}
        />

        {/* Competitor markers (red) */}
        {competitors.map((competitor, index) => (
          <Marker
            key={index}
            position={{
              lat: competitor.latitude,
              lng: competitor.longitude
            }}
            title={competitor.name}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }}
          />
        ))}
      </GoogleMapComponent>
    </LoadScript>
  );
};
