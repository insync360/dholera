import { useState } from 'react';
import { RotateCcw, Download, Eye, Trash2, FileUp, Calendar, User, Layers, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { DataVersion, UploadHistory } from '../../lib/types';
import { toast } from 'sonner';

interface VersionHistoryProps {
  versions: DataVersion[];
  uploadHistory: UploadHistory[];
  onDeleteUpload: (uploadId: string, filename: string) => void;
  onBulkDeleteUploads: (uploadIds: string[]) => void;
}

export function VersionHistory({ versions, uploadHistory, onDeleteUpload, onBulkDeleteUploads }: VersionHistoryProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === uploadHistory.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(uploadHistory.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    const count = selected.size;
    const totalParcels = uploadHistory
      .filter(u => selected.has(u.id))
      .reduce((sum, u) => sum + u.parcel_count, 0);

    if (!confirm(`Delete ${count} upload${count > 1 ? 's' : ''} and ${totalParcels} associated parcels?`)) return;

    setDeleting(true);
    await onBulkDeleteUploads(Array.from(selected));
    setSelected(new Set());
    setDeleting(false);
  };

  const allSelected = uploadHistory.length > 0 && selected.size === uploadHistory.length;
  const someSelected = selected.size > 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold mb-1">Version History</h1>
        <p className="text-sm text-muted-foreground">
          View and manage previous dataset versions and KML/KMZ uploads
        </p>
      </div>

      {/* Upload History Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upload History</h2>
          {uploadHistory.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs text-muted-foreground"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </Button>
          )}
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center justify-between gap-3 mb-3 p-3 rounded-lg bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-sm font-medium text-red-800">
              {selected.size} upload{selected.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
                className="h-7 text-xs text-red-700 hover:text-red-800 hover:bg-red-100"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {deleting ? 'Deleting...' : `Delete ${selected.size}`}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {uploadHistory.map((upload) => {
            const isSelected = selected.has(upload.id);
            return (
              <Card
                key={upload.id}
                className={`overflow-hidden transition-colors cursor-pointer ${
                  isSelected ? 'ring-2 ring-red-300 bg-red-50/50' : ''
                }`}
                onClick={() => toggleSelect(upload.id)}
              >
                <div className="flex items-stretch">
                  {/* Color accent bar */}
                  <div className={`w-1 flex-shrink-0 ${
                    isSelected ? 'bg-red-500' :
                    upload.status === 'success' ? 'bg-emerald-500' :
                    upload.status === 'error' ? 'bg-red-500' :
                    'bg-amber-500'
                  }`} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 flex-1 min-w-0">
                    {/* Checkbox + File info */}
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Checkbox */}
                      <div
                        className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleSelect(upload.id); }}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      <div className={`hidden sm:flex h-10 w-10 rounded-lg items-center justify-center flex-shrink-0 ${
                        upload.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        upload.status === 'error' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        <FileUp className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{upload.filename}</span>
                          <Badge variant="secondary" className={`text-xs flex-shrink-0 ${
                            upload.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            upload.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {upload.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(upload.timestamp).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{upload.user}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {upload.parcel_count} parcels
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button (single) */}
                    {!someSelected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(upload); }}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 flex-shrink-0 self-start sm:self-center"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1.5" />
                        <span className="sm:inline hidden">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {uploadHistory.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              <FileUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <div className="text-sm">No upload history available</div>
            </Card>
          )}
        </div>
      </div>

      {/* Version History Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Data Versions</h2>
        <div className="space-y-3">
          {versions.map((version, index) => (
          <Card key={version.id} className="overflow-hidden">
            <div className="flex items-stretch">
              {/* Accent bar */}
              <div className={`w-1 flex-shrink-0 ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />

              <div className="p-4 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Version badge */}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      index === 0
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {version.version_id}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">Version {version.version_id}</h3>
                        {index === 0 && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {version.date}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{version.publisher}</span>
                        </span>
                        <span>
                          <Badge variant="secondary" className="text-xs">{version.parcels_changed} parcels changed</Badge>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePreview(version)} className="h-7 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(version)} className="h-7 text-xs">
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </Button>
                        {index !== 0 && (
                          <Button variant="default" size="sm" onClick={() => handleRollback(version)} className="h-7 text-xs">
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {versions.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <h3 className="font-medium mb-1">No Version History</h3>
            <p className="text-sm">
              Version history will appear here as you publish updates
            </p>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
