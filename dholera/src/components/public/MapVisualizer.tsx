import { useEffect, useRef, useState, useCallback } from 'react';
import { Parcel } from '../../lib/types';
import { Crosshair, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { Button } from '../ui/button';

interface PolygonEntry {
  polygon: any;
  label: any;
  parcel: Parcel;
}

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
  const [polygonEntries, setPolygonEntries] = useState<PolygonEntry[]>([]);
  const [opacity, setOpacity] = useState(0.35);
  const opacityRef = useRef(0.35);
  const onParcelClickRef = useRef(onParcelClick);
  onParcelClickRef.current = onParcelClick;

  const handleOpacityChange = useCallback((newOpacity: number) => {
    setOpacity(newOpacity);
    opacityRef.current = newOpacity;
    polygonEntries.forEach(({ polygon }) => {
      const isSelected = polygon.get('isSelected');
      polygon.setOptions({
        fillOpacity: isSelected ? Math.min(newOpacity + 0.15, 1) : newOpacity,
      });
    });
  }, [polygonEntries]);

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
  }, []);

  // Parcels effect: create polygons and fit bounds when parcel data changes
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // Clear old polygons and labels
    polygonEntries.forEach(entry => {
      entry.polygon.setMap(null);
      if (entry.label) entry.label.setMap(null);
    });

    // Fit map to all parcel bounds
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

    const getColor = (status: string, customColor?: string) => {
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

    const newEntries = parcels.map((parcel) => {
      const colors = getColor(parcel.status, parcel.color);

      const polygon = new window.google.maps.Polygon({
        paths: parcel.coordinates,
        strokeColor: colors.stroke,
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: colors.fill,
        fillOpacity: opacityRef.current,
        map: map,
      });

      polygon.addListener('click', () => {
        onParcelClickRef.current(parcel);
      });

      polygon.addListener('mouseover', () => {
        polygon.setOptions({
          fillOpacity: Math.min(opacityRef.current + 0.25, 1),
          strokeWeight: 3,
        });
      });

      polygon.addListener('mouseout', () => {
        const isCurrentlySelected = polygon.get('isSelected');
        if (!isCurrentlySelected) {
          polygon.setOptions({
            fillOpacity: opacityRef.current,
            strokeWeight: 2,
          });
        }
      });

      // Create label at polygon center
      let label: any = null;
      if (parcel.coordinates && parcel.coordinates.length > 0) {
        const avgLat = parcel.coordinates.reduce((s, c) => s + c.lat, 0) / parcel.coordinates.length;
        const avgLng = parcel.coordinates.reduce((s, c) => s + c.lng, 0) / parcel.coordinates.length;

        label = new window.google.maps.Marker({
          position: { lat: avgLat, lng: avgLng },
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 0,
          },
          label: {
            text: parcel.parcel_id,
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 'bold',
            className: 'parcel-label',
          },
          clickable: false,
        });
      }

      return { polygon, label, parcel };
    });

    setPolygonEntries(newEntries);
  }, [map, parcels]);

  // Selection effect: update styling and zoom to selected parcel
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // Update polygon styling based on selection
    polygonEntries.forEach(({ polygon, parcel }) => {
      const isSelected = selectedParcel?.id === parcel.id;
      polygon.set('isSelected', isSelected);
      polygon.setOptions({
        strokeWeight: isSelected ? 3 : 2,
        fillOpacity: isSelected ? Math.min(opacityRef.current + 0.15, 1) : opacityRef.current,
      });
    });

    if (selectedParcel && selectedParcel.coordinates?.length > 0) {
      // Zoom to selected parcel
      const bounds = new window.google.maps.LatLngBounds();
      selectedParcel.coordinates.forEach(coord => {
        bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
      });
      map.fitBounds(bounds, { padding: 100 });
    } else if (!selectedParcel && polygonEntries.length > 0) {
      // Selection cleared — fit all parcels
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;
      polygonEntries.forEach(({ parcel }) => {
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
  }, [map, selectedParcel, polygonEntries]);

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

      {/* Map Legend + Opacity */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Legend</div>
        <div className="space-y-1.5 mb-3">
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
        <div className="border-t pt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Opacity</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            style={{ accentColor: '#2563EB' }}
          />
        </div>
      </div>
    </div>
  );
}
