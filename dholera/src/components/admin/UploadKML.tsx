import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Play, Palette } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Parcel, UploadHistory } from '../../lib/types';
import { uploadApi, parcelApi, ApiError } from '../../lib/api';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#22C55E', '#16A34A', '#15803D',
  '#3B82F6', '#2563EB', '#1D4ED8',
  '#EF4444', '#DC2626', '#B91C1C',
  '#F97316', '#EA580C', '#C2410C',
  '#FACC15', '#EAB308', '#CA8A04',
  '#A855F7', '#9333EA', '#7E22CE',
  '#EC4899', '#DB2777', '#BE185D',
  '#6B7280', '#4B5563', '#374151',
];

function ColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
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
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
        <span className="text-xs text-muted-foreground font-mono">{color}</span>
      </div>
    </div>
  );
}

interface UploadKMLProps {
  uploadHistory: UploadHistory[];
  onUploadSuccess?: () => void;
}

export function UploadKML({ uploadHistory, onUploadSuccess }: UploadKMLProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadedParcels, setUploadedParcels] = useState<Parcel[]>([]);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [parcelColor, setParcelColor] = useState('#22C55E');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.kml') && !file.name.endsWith('.kmz')) {
      toast.error('Please upload a valid KML or KMZ file');
      return;
    }

    setUploadedFile(file.name);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedParcels([]);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadApi.uploadKML(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);

      setUploadedParcels(result.parcels);
      toast.success(`File validated! ${result.parcel_count} parcels found.`);
    } catch (err) {
      setIsUploading(false);
      const errorMessage = err instanceof ApiError
        ? `Upload failed: ${err.message}`
        : 'Failed to upload file. Please try again.';
      toast.error(errorMessage);
      setUploadedFile(null);
      setUploadProgress(0);
    }
  };

  const handlePreview = () => {
    toast.success('Opening map preview...');
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      // Apply color to all uploaded parcels
      let updated = 0;
      for (const parcel of uploadedParcels) {
        try {
          await parcelApi.update(parcel.id, { color: parcelColor });
          updated++;
        } catch {
          // continue with remaining parcels
        }
      }

      if (updated < uploadedParcels.length) {
        toast.error(`Failed to set color on ${uploadedParcels.length - updated} parcels`);
      }

      toast.success(`Published ${uploadedParcels.length} parcels with selected color!`);
      setUploadedParcels([]);
      setUploadedFile(null);
      setUploadProgress(0);
      setParcelColor('#22C55E');

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch {
      toast.error('Failed to publish. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2">Upload KML / KMZ</h1>
        <p className="text-muted-foreground">
          Import parcel data from KML or KMZ files
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Upload File</h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 md:p-12 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="mb-2">Drop KML/KMZ file here</h4>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse your files
              </p>
              <input
                type="file"
                accept=".kml,.kmz"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>

            {uploadedFile && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{uploadedFile}</span>
                  </div>
                  {!isUploading && uploadProgress === 100 && (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                </div>
                {isUploading && (
                  <>
                    <Progress value={uploadProgress} className="mb-2" />
                    <div className="text-xs text-muted-foreground">{uploadProgress}% uploaded</div>
                  </>
                )}
              </div>
            )}
          </Card>

          {uploadedParcels.length > 0 && (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3>Validation Results</h3>
                  <Badge variant="secondary">
                    {uploadedParcels.length} parcels found
                  </Badge>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcel ID</TableHead>
                        <TableHead>Area (sq.m)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadedParcels.map((parcel) => (
                        <TableRow key={parcel.id}>
                          <TableCell className="font-medium">{parcel.parcel_id}</TableCell>
                          <TableCell>{parcel.area_sq_m ? parcel.area_sq_m.toLocaleString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{parcel.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Valid</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Color picker card */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <h3>Map Color</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a color for all {uploadedParcels.length} parcels in this upload. This color will be shown on the map.
                </p>
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Select color</Label>
                    <ColorPicker color={parcelColor} onChange={setParcelColor} />
                  </div>
                  <div className="flex-shrink-0">
                    <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                    <div
                      className="w-20 h-20 rounded-lg border-2 border-gray-200 shadow-inner"
                      style={{ backgroundColor: parcelColor, opacity: 0.6 }}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePreview} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview on Map
                </Button>
                <Button onClick={handlePublish} disabled={isPublishing} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  {isPublishing ? 'Publishing...' : 'Convert & Publish'}
                </Button>
              </div>
            </>
          )}
        </div>

        <div>
          <Card className="p-6">
            <h3 className="mb-4">Upload History</h3>
            <div className="space-y-3">
              {uploadHistory.map((upload) => (
                <div key={upload.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium truncate flex-1">
                      {upload.filename}
                    </div>
                    <Badge
                      variant={upload.status === 'success' ? 'default' : 'destructive'}
                      className="text-xs ml-2"
                    >
                      {upload.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{upload.timestamp}</div>
                    <div>{upload.user}</div>
                    {upload.status === 'success' && (
                      <div className="text-foreground font-medium">
                        {upload.parcel_count} parcels
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
