import React, { useEffect, useRef } from 'react';
import { MapMarkerData } from '../types';

// Declare Leaflet in the global scope to avoid TypeScript errors
declare var L: any;

interface InteractiveMapProps {
  centerLat: number;
  centerLng: number;
  zoom: number;
  markers: MapMarkerData[];
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ centerLat, centerLng, zoom, markers }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof L === 'undefined' || !mapContainerRef.current) return;

    // Clean up previous instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const tileUrl = isDarkTheme 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
    }).setView([centerLat, centerLng], zoom);

    L.tileLayer(tileUrl, {
      attribution: attribution,
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
    const customIconHtml = `<div style="background-color: ${accentColor}; width: 2rem; height: 2rem; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; justify-content: center; align-items: center; box-shadow: 0 0 10px ${accentColor}"><div style="background-color: white; width: 0.75rem; height: 0.75rem; border-radius: 50%;"></div></div>`;
    
    const customIcon = L.divIcon({
      html: customIconHtml,
      className: 'leaflet-pulsing-icon',
      iconSize: [32, 32],
      iconAnchor: [0, 16],
      popupAnchor: [16, -16]
    });
    
    const markerInstances: any[] = [];
    markers.forEach(markerData => {
      const marker = L.marker([markerData.lat, markerData.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(markerData.popupContent);
      markerInstances.push(marker);
    });

    if (markerInstances.length === 1) {
        markerInstances[0].openPopup();
    }

    mapInstanceRef.current = map;

    // Cleanup function to remove map on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, zoom, markers]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-96 md:h-[500px] w-full rounded-xl border z-0"
      style={{ borderColor: 'var(--border-color)'}}
    />
  );
};

export default InteractiveMap;
