'use client';

import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { useState, useCallback } from 'react';

interface MapViewProps {
  center: {
    lat: number;
    lng: number;
  };
  markers?: Array<{
    lat: number;
    lng: number;
    label?: string;
    icon?: string;
  }>;
  polyline?: Array<{ lat: number; lng: number }>;
  zoom?: number;
  height?: string;
  width?: string;
  className?: string;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

export function MapView({
  center,
  markers = [],
  polyline,
  zoom = 13,
  height = '400px',
  width = '100%',
  className = '',
}: MapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Graceful fallback when API key is not configured
  if (!apiKey) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          height,
          width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>📍</div>
          <div>Map view unavailable</div>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height, width }}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height, width }}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Markers */}
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
              label={marker.label}
              icon={marker.icon}
            />
          ))}

          {/* Polyline (route) */}
          {polyline && polyline.length > 0 && (
            <Polyline
              path={polyline}
              options={{
                strokeColor: '#FF7A00',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
