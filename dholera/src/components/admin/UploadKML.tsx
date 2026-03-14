import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { UploadHistory } from '../../lib/types';
import { uploadApi, ApiError } from '../../lib/api';
import { toast } from 'sonner';

interface UploadKMLProps {
  uploadHistory: UploadHistory[];
  onUploadSuccess?: () => void;
}

export function UploadKML({ uploadHistory, onUploadSuccess }: UploadKMLProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

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

    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadApi.uploadKML(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      
      // Convert result to validation format
      const validationData = result.parcels.map(p => ({
        parcel_id: p.parcel_id,
        area: p.area_sq_m,
        status: p.status,
        errors: null,
      }));
      
      setValidationResults(validationData);
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

  const handlePublish = () => {
    toast.success('Dataset published successfully!');
    setValidationResults([]);
    setUploadedFile(null);
    setUploadProgress(0);
    
    // Trigger reload of parcels in parent component
    if (onUploadSuccess) {
      onUploadSuccess();
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

          {validationResults.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3>Validation Results</h3>
                <Badge variant="secondary">
                  {validationResults.length} parcels found
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
                    {validationResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.parcel_id}</TableCell>
                        <TableCell>{result.area ? result.area.toLocaleString() : '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{result.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {result.errors ? (
                            <div className="flex items-center gap-2 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">{result.errors}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Valid</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handlePreview} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview on Map
                </Button>
                <Button onClick={handlePublish} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Convert & Publish
                </Button>
              </div>
            </Card>
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
