import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  type: 'HOUSE' | 'COLLECTOR' | 'USER' | 'REPORT';
  status?: string;
  onClick?: () => void;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routePolyline?: [number, number][];
  height?: string;
  className?: string;
  interactive?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 15,
  markers = [],
  routePolyline,
  height = '320px',
  className = '',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        touchZoom: interactive,
      });

      // OpenStreetMap Tiles with eco-friendly styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Invalidate size after render to fix Leaflet gray tile issues
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }

    return () => {
      // Do not destroy map on simple rerenders, handled on full unmount
    };
  }, [center, zoom, interactive]);

  // Update Markers and Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    markers.forEach((m) => {
      let iconHtml = '';

      if (m.type === 'COLLECTOR') {
        iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 radar-ping"></div>
            <div class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
              🚚
            </div>
          </div>
        `;
      } else if (m.type === 'HOUSE') {
        const isCompleted = m.status === 'COMPLETED';
        const bgClass = isCompleted ? 'bg-emerald-600' : 'bg-amber-500';
        iconHtml = `
          <div class="w-8 h-8 rounded-full ${bgClass} text-white flex items-center justify-center shadow-md border-2 border-white text-xs font-semibold">
            🏡
          </div>
        `;
      } else if (m.type === 'REPORT') {
        iconHtml = `
          <div class="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md border-2 border-white text-xs font-semibold animate-bounce">
            ⚠️
          </div>
        `;
      } else {
        // Current User GPS
        iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 rounded-full bg-blue-500/40 animate-ping"></div>
            <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: system-ui; min-width: 140px; padding: 4px;">
          <div style="font-weight: 700; color: #064E3B; font-size: 13px;">${m.title}</div>
          ${m.subtitle ? `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">${m.subtitle}</div>` : ''}
          ${m.status ? `<div style="display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 999px; margin-top: 4px; background: ${m.status === 'COMPLETED' ? '#d1fae5' : '#fef3c7'}; color: ${m.status === 'COMPLETED' ? '#065f46' : '#92400e'}">${m.status}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      if (m.onClick) {
        marker.on('click', () => {
          m.onClick!();
        });
      }

      marker.addTo(layerGroup);
    });

    // Draw route polyline if present
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (routePolyline && routePolyline.length > 1) {
      polylineRef.current = L.polyline(routePolyline, {
        color: '#00A86B',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8',
      }).addTo(map);
    }
  }, [markers, routePolyline]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ height }}
      className={`w-full overflow-hidden rounded-2xl border border-emerald-100 shadow-sm relative ${className}`}
    />
  );
};
