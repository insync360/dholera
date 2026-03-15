import { useState, useMemo, useRef } from 'react';
import { Save, Undo, MapPin, Palette } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Parcel, ParcelStatus } from '../../lib/types';
import { toast } from 'sonner';

// Mini Map Preview Component
function ParcelMapPreview({ parcel, allParcels }: { parcel: Parcel | null; allParcels: Parcel[] }) {
  const bounds = useMemo(() => {
    const parcelsToUse = parcel ? [parcel] : allParcels;
    if (parcelsToUse.length === 0 || parcelsToUse.every(p => !p.coordinates?.length)) {
      return { north: 22.254, south: 22.244, east: 72.185, west: 72.173 };
    }

    let north = -90, south = 90, east = -180, west = 180;
    parcelsToUse.forEach(p => {
      p.coordinates?.forEach(coord => {
        if (coord.lat > north) north = coord.lat;
        if (coord.lat < south) south = coord.lat;
        if (coord.lng > east) east = coord.lng;
        if (coord.lng < west) west = coord.lng;
      });
    });

    const latPad = (north - south) * 0.15 || 0.002;
    const lngPad = (east - west) * 0.15 || 0.002;
    return { north: north + latPad, south: south - latPad, east: east + lngPad, west: west - lngPad };
  }, [parcel, allParcels]);

  const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 };

  const latLngToSVG = (lat: number, lng: number) => ({
    x: ((lng - bounds.west) / (bounds.east - bounds.west)) * 100,
    y: ((bounds.north - lat) / (bounds.north - bounds.south)) * 100,
  });

  const getParcelPath = (coords: { lat: number; lng: number }[]) => {
    if (!coords?.length) return '';
    return coords.map((c, i) => {
      const p = latLngToSVG(c.lat, c.lng);
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }).join(' ') + ' Z';
  };

  const getStatusColor = (status: string, customColor?: string) => {
    if (customColor) {
      return { fill: customColor, stroke: customColor };
    }
    switch (status) {
      case 'Available': return { fill: '#22C55E', stroke: '#16A34A' };
      case 'Reserved': return { fill: '#FACC15', stroke: '#EAB308' };
      case 'Sold': return { fill: '#6B7280', stroke: '#4B5563' };
      default: return { fill: '#0B64D6', stroke: '#0847A6' };
    }
  };

  const mapUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d${parcel ? 500 : 5000}!2d${center.lng}!3d${center.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin`;

  const parcelsToRender = parcel ? [parcel] : allParcels;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <iframe
        src={mapUrl}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ pointerEvents: 'none' }}
      />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {parcelsToRender.map((p) => {
          if (!p.coordinates?.length) return null;
          const colors = getStatusColor(p.status, p.color);
          const isSelected = parcel?.id === p.id;
          return (
            <path
              key={p.id}
              d={getParcelPath(p.coordinates)}
              fill={colors.fill}
              fillOpacity={isSelected ? 0.7 : 0.4}
              stroke={colors.stroke}
              strokeWidth={isSelected ? 0.5 : 0.2}
            />
          );
        })}
      </svg>
      {parcel && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{parcel.parcel_id}</span>
            <Badge className={`text-xs ${
              parcel.status === 'Available' ? 'bg-green-500' :
              parcel.status === 'Reserved' ? 'bg-yellow-500' : 'bg-gray-500'
            } text-white`}>
              {parcel.status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {parcel.area_sq_m.toLocaleString()} sq.m • ₹{(parcel.price / 100000).toFixed(1)}L
          </div>
        </div>
      )}
      {!parcel && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2">
          <div className="text-xs font-semibold mb-1">Legend</div>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span>Sold</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PRESET_COLORS = [
  '#22C55E', '#16A34A', '#15803D',  // greens
  '#3B82F6', '#2563EB', '#1D4ED8',  // blues
  '#EF4444', '#DC2626', '#B91C1C',  // reds
  '#F97316', '#EA580C', '#C2410C',  // oranges
  '#FACC15', '#EAB308', '#CA8A04',  // yellows
  '#A855F7', '#9333EA', '#7E22CE',  // purples
  '#EC4899', '#DB2777', '#BE185D',  // pinks
  '#6B7280', '#4B5563', '#374151',  // grays
];

function ParcelColorPicker({ color, onChange }: { color?: string; onChange: (color: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 mt-1">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
              color === c ? 'border-foreground ring-1 ring-foreground scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
        {/* Custom color button */}
        <button
          type="button"
          className={`w-7 h-7 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors ${
            color && !PRESET_COLORS.includes(color) ? 'ring-1 ring-foreground' : ''
          }`}
          style={color && !PRESET_COLORS.includes(color) ? { backgroundColor: color, borderStyle: 'solid' } : {}}
          onClick={() => inputRef.current?.click()}
          title="Custom color"
        >
          {(!color || PRESET_COLORS.includes(color)) && <Palette className="h-3.5 w-3.5 text-gray-400" />}
        </button>
        <input
          ref={inputRef}
          type="color"
          className="sr-only"
          value={color || '#22C55E'}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {color && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
          <span className="text-xs text-muted-foreground font-mono">{color}</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
            onClick={() => onChange('')}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}

interface ParcelEditorProps {
  parcels: Parcel[];
  onParcelUpdate: (parcel: Parcel) => void;
}

export function ParcelEditor({ parcels, onParcelUpdate }: ParcelEditorProps) {
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [editedParcel, setEditedParcel] = useState<Parcel | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleParcelSelect = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setEditedParcel({ ...parcel });
    setHasChanges(false);
  };

  const handleFieldChange = (field: keyof Parcel, value: any) => {
    if (editedParcel) {
      setEditedParcel({ ...editedParcel, [field]: value });
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (editedParcel) {
      onParcelUpdate(editedParcel);
      setSelectedParcel(editedParcel);
      setHasChanges(false);
      toast.success('Parcel updated successfully!');
    }
  };

  const handleReset = () => {
    if (selectedParcel) {
      setEditedParcel({ ...selectedParcel });
      setHasChanges(false);
      toast.info('Changes reset');
    }
  };

  const handleBulkStatusChange = (status: ParcelStatus) => {
    toast.success(`Status updated for selected parcels to ${status}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-success text-white';
      case 'Reserved':
        return 'bg-warning text-foreground';
      case 'Sold':
        return 'bg-muted-foreground text-white';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Map Preview - Left Side (Top on mobile) */}
      <div className="h-64 md:h-full md:flex-1 border-b md:border-b-0 md:border-r border-border shrink-0">
        <ParcelMapPreview parcel={selectedParcel} allParcels={parcels} />
      </div>

      {/* Editor Panel - Right Side (Bottom on mobile) */}
      <div className="flex-1 md:w-2/5 overflow-y-auto bg-muted/20 md:bg-transparent">
        <div className="p-4 md:p-6 border-b border-border bg-white sticky top-0 z-10">
          <h2 className="mb-2">Parcel Editor</h2>
          <p className="text-sm text-muted-foreground">
            Select and edit parcel details
          </p>
        </div>

        <div className="p-6">
          {!selectedParcel ? (
            <Card className="p-6">
              <h3 className="mb-4">All Parcels</h3>
              <div className="mb-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange('Sold')}
                >
                  Mark Selected as Sold
                </Button>
                <Button variant="outline" size="sm">
                  Adjust Pricing by %
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcel ID</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcels.map((parcel) => (
                      <TableRow key={parcel.id}>
                        <TableCell className="font-medium">{parcel.parcel_id}</TableCell>
                        <TableCell>{parcel.area_sq_m.toLocaleString()}</TableCell>
                        <TableCell>₹{(parcel.price / 100000).toFixed(1)}L</TableCell>
                        <TableCell>
                          <div
                            className="w-5 h-5 rounded border border-gray-200"
                            style={{ backgroundColor: parcel.color || '#22C55E' }}
                            title={parcel.color || 'Default (status-based)'}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(parcel.status)}>
                            {parcel.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleParcelSelect(parcel)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setSelectedParcel(null)}>
                  ← Back to List
                </Button>
                {hasChanges && (
                  <Badge variant="secondary">Unsaved Changes</Badge>
                )}
              </div>

              <Card className="p-6">
                <h3 className="mb-4">Edit Parcel: {editedParcel?.parcel_id}</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="parcel_id">Parcel ID</Label>
                    <Input
                      id="parcel_id"
                      value={editedParcel?.parcel_id || ''}
                      onChange={(e) => handleFieldChange('parcel_id', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">Area (sq.m)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={editedParcel?.area_sq_m || 0}
                      onChange={(e) => handleFieldChange('area_sq_m', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editedParcel?.price || 0}
                      onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      ₹{((editedParcel?.price || 0) / 100000).toFixed(2)} Lakhs
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editedParcel?.status}
                      onValueChange={(value) => handleFieldChange('status', value as ParcelStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Reserved">Reserved</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Map Color</Label>
                    <ParcelColorPicker
                      color={editedParcel?.color}
                      onChange={(color) => handleFieldChange('color', color)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="size_category">Size Category</Label>
                    <Select
                      value={editedParcel?.size_category}
                      onValueChange={(value) => handleFieldChange('size_category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Small">Small</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editedParcel?.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedParcel?.description || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Attach Images</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                      Click to upload images
                    </div>
                  </div>

                  <div>
                    <Label>Documents</Label>
                    <div className="space-y-2">
                      {editedParcel?.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{doc.name}</span>
                          <Button variant="ghost" size="sm">Remove</Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        + Add Document
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2 sticky bottom-0 bg-background py-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="flex-1"
                >
                  <Undo className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
