import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Search, Route, Clock, ArrowRight, X, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { getLocationFromCompany, defaultMapCenter, geocodeAddress } from '../../../../../utils/locationUtils';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
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

const startIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Map Control Component
const MapControls = ({ onZoomIn, onZoomOut, onToggleFullscreen, isFullscreen }) => {
  return (
    <div className={`absolute top-4 right-4 flex flex-col gap-2 ${isFullscreen ? 'z-[10001]' : 'z-[1000]'}`}>
      {/* Zoom Controls */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 flex flex-col gap-1">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
      </div>
      
      {/* Fullscreen Toggle */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2">
        <button
          onClick={onToggleFullscreen}
          className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>
    </div>
  );
};

// Custom hook for map instance
const MapController = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
};

const CourtMapWithCustomRoute = ({ court, showRoute = false, onToggleRoute }) => {
  const [courtCoordinates, setCourtCoordinates] = useState(defaultMapCenter.tunisia);
  const [startCoordinates, setStartCoordinates] = useState(null);
  const [startAddress, setStartAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [hasValidCourtLocation, setHasValidCourtLocation] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const mapRef = useRef(null);

  // Handle keyboard events for fullscreen
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };  }, [isFullscreen]);

  // Handle map resize when fullscreen changes
  useEffect(() => {
    if (mapInstance) {
      // Force map to recalculate its size
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 100);
    }
  }, [isFullscreen, mapInstance]);

  // Load court coordinates
  useEffect(() => {
    const loadCourtCoordinates = async () => {
      setLoading(true);
      
      if (court?.company) {
        try {
          const location = await getLocationFromCompany(court.company);
          if (location) {
            setCourtCoordinates([location.lat, location.lng]);
            setHasValidCourtLocation(true);
          } else {
            setCourtCoordinates(defaultMapCenter.tunisia);
            setHasValidCourtLocation(false);
          }
        } catch (error) {
          console.error('Error getting court location:', error);
          setCourtCoordinates(defaultMapCenter.tunisia);
          setHasValidCourtLocation(false);
        }
      }
      
      setLoading(false);
    };

    loadCourtCoordinates();
  }, [court]);

  // Search for address suggestions
  const searchAddresses = async (query) => {
    if (query.length < 3) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=tn,ma,dz`
      );
      const data = await response.json();
      setSearchSuggestions(data);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSearchSuggestions([]);
    }
  };

  // Handle address input change
  const handleAddressChange = (value) => {
    setStartAddress(value);
    setShowSuggestions(true);
    searchAddresses(value);
  };

  // Select an address suggestion
  const selectAddress = (suggestion) => {
    setStartAddress(suggestion.display_name);
    setStartCoordinates([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setUseCurrentLocation(true);
    setRouteLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setStartCoordinates(coords);
          setStartAddress('Your Current Location');
          setUseCurrentLocation(false);
          setRouteLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enter an address manually.');
          setUseCurrentLocation(false);
          setRouteLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setUseCurrentLocation(false);
      setRouteLoading(false);
    }
  };

  // Calculate route using OSRM
  const calculateRoute = async () => {
    if (!startCoordinates || !hasValidCourtLocation) return;

    setRouteLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startCoordinates[1]},${startCoordinates[0]};${courtCoordinates[1]},${courtCoordinates[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        setRouteData(coordinates);
        setRouteInfo({
          distance: (route.distance / 1000).toFixed(1), // Convert to km
          duration: Math.round(route.duration / 60) // Convert to minutes
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setRouteLoading(false);
    }
  };

  // Calculate route when start coordinates change
  useEffect(() => {
    if (startCoordinates && hasValidCourtLocation && showRoute) {
      calculateRoute();
    }
  }, [startCoordinates, hasValidCourtLocation, showRoute]);
  // Clear route
  const clearRoute = () => {
    setStartCoordinates(null);
    setStartAddress('');
    setRouteData(null);
    setRouteInfo(null);
  };

  // Map control handlers
  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {      mapInstance.zoomOut();
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Force map resize after fullscreen toggle with longer delay
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();      }
    }, 300);
  };

  const handleMapReady = (map) => {
    setMapInstance(map);
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
  }  return (
    <div 
      className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen 
          ? 'map-fullscreen' 
          : ''
      }`}
    >      {/* Route Controls */}
      {showRoute && (
        <div className={`absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur-sm rounded-xl p-4 space-y-3 ${
          isFullscreen ? 'max-w-md w-full sm:w-auto' : 'max-w-xs sm:max-w-sm w-full sm:w-auto'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Route size={20} className="text-blue-400" />
              <h3 className="text-white font-medium text-sm sm:text-base">Get Directions</h3>
            </div>
            <button
              onClick={onToggleRoute}
              className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
              title="Close directions"
            >
              <X size={18} />
            </button>
          </div>

          {/* Address Search */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Enter starting location..."
                  value={startAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
                
                {/* Search Suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/20 rounded-lg max-h-40 overflow-y-auto z-50">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectAddress(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 border-b border-white/10 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                          <span className="truncate">{suggestion.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}              </div>
              
              <button
                onClick={getCurrentLocation}
                disabled={useCurrentLocation}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm flex-shrink-0"
              >
                <Navigation size={16} />
                <span className="hidden sm:inline">{useCurrentLocation ? 'Getting...' : 'My Location'}</span>
                <span className="sm:hidden">{useCurrentLocation ? '...' : 'GPS'}</span>
              </button>
            </div>
          </div>          {/* Route Information */}
          {routeInfo && (
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-blue-400" />
                    <span className="text-white text-sm font-medium">{routeInfo.distance} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-green-400" />
                    <span className="text-white text-sm">{routeInfo.duration} min</span>
                  </div>
                </div>
                <button
                  onClick={clearRoute}
                  className="text-white/60 hover:text-white text-sm px-2 py-1 rounded transition-colors flex-shrink-0"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {routeLoading && (
            <div className="text-center py-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
              <p className="text-white/60 text-xs">Calculating route...</p>
            </div>
          )}
        </div>
      )}      {/* Map */}
      <MapContainer
        center={startCoordinates || courtCoordinates}
        zoom={hasValidCourtLocation && startCoordinates ? 12 : (hasValidCourtLocation ? 15 : 10)}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
        zoomControl={false}
      >
        <MapController onMapReady={handleMapReady} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Court Marker */}
        {hasValidCourtLocation && (
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

        {/* Start Location Marker */}
        {startCoordinates && (
          <Marker position={startCoordinates} icon={startIcon}>
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800">Starting Point</h3>
                <p className="text-sm text-gray-600">{startAddress}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeData && (
          <Polyline
            positions={routeData}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
          />        )}
      </MapContainer>
      
      {/* Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />
      
      {/* Location Status Overlay */}
      {!hasValidCourtLocation && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20 pointer-events-none">
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

export default CourtMapWithCustomRoute;
