import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getLocationFromCompany, defaultMapCenter } from '../../../../../utils/locationUtils';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom court icon
const courtIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const CourtMap = ({ court }) => {
  const [coordinates, setCoordinates] = useState(defaultMapCenter.tunisia);
  const [loading, setLoading] = useState(true);
  const [hasValidLocation, setHasValidLocation] = useState(false);

  useEffect(() => {
    const loadCoordinates = async () => {
      setLoading(true);
      
      if (court?.company) {
        try {
          const location = await getLocationFromCompany(court.company);
          if (location) {
            setCoordinates([location.lat, location.lng]);
            setHasValidLocation(true);
          } else {
            // Fallback to default coordinates
            setCoordinates(defaultMapCenter.tunisia);
            setHasValidLocation(false);
          }
        } catch (error) {
          console.error('Error getting location:', error);
          setCoordinates(defaultMapCenter.tunisia);
          setHasValidLocation(false);
        }
      }
      
      setLoading(false);
    };

    loadCoordinates();
  }, [court]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-2xl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white/60 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">      <MapContainer
        center={coordinates}
        zoom={hasValidLocation ? 15 : 10}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {hasValidLocation && (
          <Marker position={coordinates} icon={courtIcon}>
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800">{court.name}</h3>
                <p className="text-sm text-gray-600">{court.company?.companyName}</p>
                <p className="text-xs text-gray-500">
                  {court.location?.address}, {court.location?.city}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {!hasValidLocation && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center">
            <p className="text-gray-800 font-medium">Approximate Location</p>
            <p className="text-gray-600 text-sm">
              {court?.location?.city || court?.company?.address?.city || 'Tunisia'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Exact coordinates not available
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtMap;
