import { RotateCcw, Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { DataVersion, UploadHistory } from '../../lib/types';
import { toast } from 'sonner';

interface VersionHistoryProps {
  versions: DataVersion[];
  uploadHistory: UploadHistory[];
  onDeleteUpload: (uploadId: string, filename: string) => void;
}

export function VersionHistory({ versions, uploadHistory, onDeleteUpload }: VersionHistoryProps) {
  const handleRollback = (version: DataVersion) => {
    toast.success(`Rolling back to version ${version.version_id}...`);
  };

  const handlePreview = (version: DataVersion) => {
    toast.success(`Loading preview for version ${version.version_id}...`);
  };

  const handleDownload = (version: DataVersion) => {
    toast.success(`Downloading version ${version.version_id}...`);
  };

  const handleDelete = (upload: UploadHistory) => {
    if (confirm(`Delete "${upload.filename}" and all ${upload.parcel_count} associated parcels?`)) {
      onDeleteUpload(upload.id, upload.filename);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2">Version History</h1>
        <p className="text-muted-foreground">
          View and manage previous dataset versions and KML/KMZ uploads
        </p>
      </div>

      {/* Upload History Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload History</h2>
        <div className="space-y-3">
          {uploadHistory.map((upload) => (
            <Card key={upload.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold break-all">{upload.filename}</span>
                    <Badge className={
                      upload.status === 'success' ? 'bg-green-500 text-white' :
                      upload.status === 'error' ? 'bg-red-500 text-white' :
                      'bg-yellow-500 text-white'
                    }>
                      {upload.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Uploaded: {new Date(upload.timestamp).toLocaleString()}</div>
                    <div className="break-all">By: {upload.user}</div>
                    <div>Parcels: {upload.parcel_count}</div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(upload)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
          {uploadHistory.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              <div className="text-sm">No upload history available</div>
            </Card>
          )}
        </div>
      </div>

      {/* Version History Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Data Versions</h2>
        <div className="space-y-4">
          {versions.map((version, index) => (
          <Card key={version.id} className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* Thumbnail */}
                <div className="w-full sm:w-32 h-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="text-center text-muted-foreground">
                    <div className="text-xs">Map Preview</div>
                    <div className="text-2xl font-bold mt-2">{version.version_id}</div>
                  </div>
                </div>

                {/* Version Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3>{version.version_id}</h3>
                    {index === 0 && (
                      <Badge className="bg-primary text-white">Current</Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Published:</span>
                      <span>{version.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Publisher:</span>
                      <span className="truncate">{version.publisher}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Changes:</span>
                      <Badge variant="secondary">{version.parcels_changed} parcels</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(version)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(version)}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {index !== 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRollback(version)}
                        className="flex-1 sm:flex-none"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {versions.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="mb-2">No Version History</h3>
              <p className="text-sm">
                Version history will appear here as you publish updates
              </p>
            </div>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
