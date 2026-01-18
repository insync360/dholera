import { useEffect, useRef, useState } from 'react';
import { Parcel } from '../../lib/types';
import { Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/button';

interface MapVisualizerProps {
  parcels: Parcel[];
  selectedParcel: Parcel | null;
  onParcelClick: (parcel: Parcel) => void;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
}

export function MapVisualizer({
  parcels,
  selectedParcel,
  onParcelClick,
  mapCenter = { lat: 22.2492, lng: 72.1793 },
  mapZoom = 15,
}: MapVisualizerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [polygons, setPolygons] = useState<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
    });

    setMap(googleMap);

    return () => {
      polygons.forEach(p => p.setMap(null));
    };
  }, []);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    polygons.forEach(p => p.setMap(null));

    // Auto-fit map to parcel bounds
    if (parcels.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;
      
      parcels.forEach(parcel => {
        if (parcel.coordinates && parcel.coordinates.length > 0) {
          parcel.coordinates.forEach(coord => {
            bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
            hasValidCoords = true;
          });
        }
      });
      
      if (hasValidCoords) {
        map.fitBounds(bounds, { padding: 50 });
      }
    }

    const newPolygons = parcels.map((parcel) => {
      const getColor = (status: string) => {
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

      const colors = getColor(parcel.status);
      const isSelected = selectedParcel?.id === parcel.id;

      const polygon = new window.google.maps.Polygon({
        paths: parcel.coordinates,
        strokeColor: colors.stroke,
        strokeOpacity: 1,
        strokeWeight: isSelected ? 3 : 2,
        fillColor: colors.fill,
        fillOpacity: isSelected ? 0.5 : 0.35,
        map: map,
      });

      polygon.addListener('click', () => {
        onParcelClick(parcel);
      });

      polygon.addListener('mouseover', () => {
        polygon.setOptions({
          fillOpacity: 0.6,
          strokeWeight: 3,
        });
      });

      polygon.addListener('mouseout', () => {
        if (!isSelected) {
          polygon.setOptions({
            fillOpacity: 0.35,
            strokeWeight: 2,
          });
        }
      });

      // Note: Parcel labels can be added using google.maps.marker.AdvancedMarkerElement
      // when a valid Maps API key is configured. For now, click parcels to view details.

      return polygon;
    });

    setPolygons(newPolygons);
  }, [map, parcels, selectedParcel]);

  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() || 15;
      map.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 15;
      map.setZoom(currentZoom - 1);
    }
  };

  const handleRecenter = () => {
    if (map) {
      map.setCenter(mapCenter);
      map.setZoom(mapZoom);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
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
    </div>
  );
}
