import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Helper to create a Leaflet divIcon with the Heroicons solid map-pin SVG
const createMapPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<svg xmlns="http://www.w3.org/2000/svg" fill="#ef4444" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ef4444" width="36" height="36"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z"/></svg>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36], // bottom center of the SVG
    popupAnchor: [0, -36],
  });
};

const LocationMarker = ({ position, onLocationChange, readOnly }) => {
  useMapEvents({
    click(e) {
      if (!readOnly && onLocationChange) {
        onLocationChange([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return position === null ? null : (
    <Marker 
      position={position} 
      icon={createMapPinIcon()} 
      draggable={!readOnly} 
      eventHandlers={{
        dragend: (e) => {
          if (!readOnly && onLocationChange) {
            const { lat, lng } = e.target.getLatLng();
            onLocationChange([lat, lng]);
          }
        },
      }}
    >
      <Popup>
        Company Location<br />
        Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}
        {!readOnly && <br />}
        {!readOnly && <small>Click on map or drag pin to change location</small>}
      </Popup>
    </Marker>
  );
};

const CompanyMap = ({ position, onLocationChange, readOnly = false }) => {
  const [mapPosition, setMapPosition] = useState(position || [36.8065, 10.1815]);

  const handleLocationChange = (newPosition) => {
    setMapPosition(newPosition);
    if (onLocationChange) {
      onLocationChange(newPosition);
    }
  };

  // Update map position when prop changes
  useEffect(() => {
    if (position) {
      setMapPosition(position);
    }
  }, [position]);

  const handleMapCreated = useCallback((map) => {
    // Force invalidation when map is created
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, []);

  return (
    <div 
      className="w-full border border-gray-300 rounded-lg overflow-hidden"
      style={{ 
        height: '300px'
      }}
    >
      <MapContainer 
        center={mapPosition} 
        zoom={13} 
        style={{ 
          height: '100%', 
          width: '100%'
        }}
        scrollWheelZoom={!readOnly}
        doubleClickZoom={!readOnly}
        dragging={!readOnly}
        zoomControl={!readOnly}
        attributionControl={true}
        whenCreated={handleMapCreated}
      >        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />
        <LocationMarker 
          position={mapPosition} 
          onLocationChange={handleLocationChange} 
          readOnly={readOnly}
        />
      </MapContainer>
    </div>
  );
};

export default CompanyMap;
