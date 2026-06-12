import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useTheme } from '../context/ThemeContext';

const VisitorMap = ({ visits = [] }) => {
  const { theme } = useTheme();

  // Aggregate visits by unique coordinate keys
  const locationMap = {};
  
  visits.forEach(v => {
    if (v.latitude !== null && v.longitude !== null && v.latitude !== undefined && v.longitude !== undefined) {
      const key = `${v.latitude.toFixed(3)},${v.longitude.toFixed(3)}`;
      if (!locationMap[key]) {
        locationMap[key] = {
          lat: v.latitude,
          lng: v.longitude,
          city: v.city || 'Unknown City',
          country: v.country || 'Unknown',
          count: 0
        };
      }
      locationMap[key].count += 1;
    }
  });

  const markers = Object.values(locationMap);

  // Default center: US geographic center if no markers, otherwise first marker
  const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [39.8283, -98.5795];
  const zoom = markers.length > 0 ? 3 : 2;

  // Use elegant SaaS map styling (CartoDB Light for light mode, CartoDB Dark Matter for dark mode)
  const mapTileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="w-full relative h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-md">
      {markers.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-xs text-slate-400">
          No location logs available for rendering.
        </div>
      ) : (
        <MapContainer 
          center={center} 
          zoom={zoom} 
          scrollWheelZoom={false}
          className="h-full w-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={mapTileUrl}
          />
          {markers.map((m, index) => {
            // Radius scales dynamically based on click intensity
            const radius = Math.min(25, 8 + Math.sqrt(m.count) * 2);
            
            return (
              <CircleMarker
                key={index}
                center={[m.lat, m.lng]}
                radius={radius}
                fillColor="#2563EB"
                color="#6366F1"
                weight={1.5}
                fillOpacity={0.65}
              >
                <Popup>
                  <div className="text-xs font-sans text-slate-900 font-semibold p-1">
                    <p className="font-extrabold text-sm mb-1">{m.city}, {m.country}</p>
                    <p className="text-indigo-600">Total Visits: <span className="text-slate-800 font-bold">{m.count}</span></p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
};

export default VisitorMap;
