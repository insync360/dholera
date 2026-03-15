import { useState } from 'react';
import { Parcel } from '../../lib/types';
import { Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/button';

interface DemoMapVisualizerProps {
  parcels: Parcel[];
  selectedParcel: Parcel | null;
  onParcelClick: (parcel: Parcel) => void;
}

export function DemoMapVisualizer({
  parcels,
  selectedParcel,
  onParcelClick,
}: DemoMapVisualizerProps) {
  const [zoom, setZoom] = useState(15);

  // Calculate dynamic bounds from parcel coordinates
  const calculateBounds = () => {
    if (parcels.length === 0 || parcels.every(p => !p.coordinates || p.coordinates.length === 0)) {
      // Default Dholera bounds if no parcels
      return {
        north: 22.254,
        south: 22.244,
        east: 72.185,
        west: 72.173,
      };
    }

    let north = -90, south = 90, east = -180, west = 180;

    parcels.forEach(parcel => {
      if (parcel.coordinates && parcel.coordinates.length > 0) {
        parcel.coordinates.forEach(coord => {
          if (coord.lat > north) north = coord.lat;
          if (coord.lat < south) south = coord.lat;
          if (coord.lng > east) east = coord.lng;
          if (coord.lng < west) west = coord.lng;
        });
      }
    });

    // Add padding (10% on each side)
    const latPadding = (north - south) * 0.1 || 0.005;
    const lngPadding = (east - west) * 0.1 || 0.006;

    return {
      north: north + latPadding,
      south: south - latPadding,
      east: east + lngPadding,
      west: west - lngPadding,
    };
  };

  const bounds = calculateBounds();
  const center = {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };

  // Convert lat/lng to SVG coordinates
  const latLngToSVG = (lat: number, lng: number) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
    
    return { x, y };
  };

  const getParcelPath = (coordinates: { lat: number; lng: number }[]) => {
    const points = coordinates.map(coord => latLngToSVG(coord.lat, coord.lng));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  const getStatusColor = (status: string, customColor?: string) => {
    if (customColor) {
      return { fill: customColor, stroke: customColor };
    }
    switch (status) {
      case 'Available':
        return { fill: '#22C55E', stroke: '#16A34A' };
      case 'Reserved':
        return { fill: '#FACC15', stroke: '#EAB308' };
      case 'Sold':
        return { fill: '#6B7280', stroke: '#4B5563' };
      default:
        return { fill: '#0B64D6', stroke: '#0847A6' };
    }
  };

  const getParcelCenter = (coordinates: { lat: number; lng: number }[]) => {
    const avgLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
    const avgLng = coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
    return latLngToSVG(avgLat, avgLng);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 12));
  };

  const handleRecenter = () => {
    setZoom(15);
  };

  // Google Maps Embed URL centered on parcels (no API key needed for embed)
  const mapEmbedUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d${Math.pow(2, 21 - zoom)}!2d${center.lng}!3d${center.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1234567890123`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Embedded Google Map */}
      <iframe
        src={mapEmbedUrl}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ pointerEvents: 'none' }}
      />

      {/* SVG Overlay for Interactive Parcels */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {parcels.map((parcel) => {
          const colors = getStatusColor(parcel.status, parcel.color);
          const isSelected = selectedParcel?.id === parcel.id;
          const center = getParcelCenter(parcel.coordinates);

          return (
            <g key={parcel.id}>
              {/* Parcel Polygon */}
              <path
                d={getParcelPath(parcel.coordinates)}
                fill={colors.fill}
                fillOpacity={isSelected ? 0.6 : 0.4}
                stroke={colors.stroke}
                strokeWidth={isSelected ? 0.3 : 0.15}
                className="cursor-pointer transition-all hover:fill-opacity-60"
                onClick={() => onParcelClick(parcel)}
                onMouseEnter={(e) => {
                  e.currentTarget.setAttribute('fill-opacity', '0.6');
                  e.currentTarget.setAttribute('stroke-width', '0.3');
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.setAttribute('fill-opacity', '0.4');
                    e.currentTarget.setAttribute('stroke-width', '0.15');
                  }
                }}
              />
              
              {/* Parcel Label */}
              <text
                x={center.x}
                y={center.y}
                fontSize="1.5"
                fill="white"
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none font-bold"
                style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
              >
                {parcel.parcel_id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Demo Mode Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-primary text-white px-4 py-2 rounded-full text-sm shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-medium">Demo Mode - Interactive Preview</span>
        </div>
      </div>

      {/* Custom Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-white shadow-lg hover:bg-gray-50"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-white shadow-lg hover:bg-gray-50"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleRecenter}
          className="bg-white shadow-lg hover:bg-gray-50"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22C55E' }}></div>
            <span className="text-xs">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FACC15' }}></div>
            <span className="text-xs">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6B7280' }}></div>
            <span className="text-xs">Sold</span>
          </div>
        </div>
      </div>

      {/* Info Tooltip */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 max-w-xs">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Tip:</span> Click on any colored parcel to view details. This demo uses embedded maps - add your API key for full functionality.
        </div>
      </div>
    </div>
  );
}
