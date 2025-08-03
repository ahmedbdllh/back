import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Route, Clock, AlertCircle } from 'lucide-react';
import { getLocationFromCompany, defaultMapCenter } from '../../../../../utils/locationUtils';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons
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

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#10B981"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="#10B981"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const CourtMapWithRoute = ({ court, showRoute = false }) => {
  const [courtCoordinates, setCourtCoordinates] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [hasValidLocation, setHasValidLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // Get court location
  useEffect(() => {
    const loadCourtCoordinates = async () => {
      setLoading(true);
      
      if (court?.company) {
        try {
          const location = await getLocationFromCompany(court.company);
          if (location) {
            setCourtCoordinates([location.lat, location.lng]);
            setHasValidLocation(true);
          } else {
            setCourtCoordinates(defaultMapCenter.tunisia);
            setHasValidLocation(false);
          }
        } catch (error) {
          console.error('Error getting court location:', error);
          setCourtCoordinates(defaultMapCenter.tunisia);
          setHasValidLocation(false);
        }
      }
      
      setLoading(false);
    };

    loadCourtCoordinates();
  }, [court]);

  // Get user location
  const getUserLocation = () => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.error('Error getting user location:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('An unknown error occurred');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  };

  // Calculate route function
  const calculateRoute = useCallback(async () => {
    if (!userLocation || !courtCoordinates || !hasValidLocation) {
      return;
    }

    setRouteLoading(true);
    try {
      // Using OpenRouteService or OSRM for routing (free alternatives)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${courtCoordinates[1]},${courtCoordinates[0]}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const routeGeometry = data.routes[0].geometry.coordinates;
        const routePoints = routeGeometry.map(coord => [coord[1], coord[0]]); // Swap lat/lng
        
        setRoute(routePoints);
        setRouteInfo({
          distance: (data.routes[0].distance / 1000).toFixed(1), // Convert to km
          duration: Math.round(data.routes[0].duration / 60) // Convert to minutes
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setLocationError('Unable to calculate route');
    } finally {
      setRouteLoading(false);
    }
  }, [userLocation, courtCoordinates, hasValidLocation, setLocationError]);

  // Auto-calculate route when both locations are available
  useEffect(() => {
    if (showRoute && userLocation && courtCoordinates && hasValidLocation) {
      calculateRoute();
    }
  }, [showRoute, userLocation, courtCoordinates, hasValidLocation, calculateRoute]);

  // Get map center and zoom
  const getMapCenter = () => {
    if (userLocation && courtCoordinates && route) {
      // Calculate center between user and court
      const centerLat = (userLocation[0] + courtCoordinates[0]) / 2;
      const centerLng = (userLocation[1] + courtCoordinates[1]) / 2;
      return [centerLat, centerLng];
    }
    return courtCoordinates || defaultMapCenter.tunisia;
  };

  const getMapZoom = () => {
    if (route) return 12;
    if (hasValidLocation) return 15;
    return 10;
  };

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
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {/* Route Controls */}
      <div className="absolute top-4 right-4 z-20 space-y-2">
        {!userLocation && (
          <button
            onClick={getUserLocation}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors shadow-lg"
          >
            <Navigation size={16} />
            Get My Location
          </button>
        )}
        
        {userLocation && hasValidLocation && (
          <button
            onClick={calculateRoute}
            disabled={routeLoading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors shadow-lg"
          >
            {routeLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Route size={16} />
            )}
            {routeLoading ? 'Calculating...' : 'Get Directions'}
          </button>
        )}
      </div>

      {/* Route Info */}
      {routeInfo && (
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Route size={16} className="text-blue-600" />
              <span className="font-medium">{routeInfo.distance} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} className="text-green-600" />
              <span className="font-medium">{routeInfo.duration} min</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-red-500/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-white text-sm">
            <AlertCircle size={16} />
            <span>{locationError}</span>
          </div>
        </div>
      )}

      <MapContainer
        center={getMapCenter()}
        zoom={getMapZoom()}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Court Marker */}
        {hasValidLocation && courtCoordinates && (
          <Marker position={courtCoordinates} icon={courtIcon}>
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

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800">Your Location</h3>
                <p className="text-sm text-gray-600">Starting point</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        {route && (
          <Polyline
            positions={route}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
            pathOptions={{
              dashArray: '10, 10',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
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
              Exact coordinates not available for routing
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtMapWithRoute;
