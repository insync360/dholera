import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { MapPin, CheckCircle, Clock, XCircle, Upload, TrendingUp } from 'lucide-react';
import { Parcel, UploadHistory } from '../../lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface DashboardProps {
  parcels: Parcel[];
  uploadHistory: UploadHistory[];
}

export function Dashboard({ parcels, uploadHistory }: DashboardProps) {
  const totalParcels = parcels.length;
  const availableParcels = parcels.filter((p) => p.status === 'Available').length;
  const reservedParcels = parcels.filter((p) => p.status === 'Reserved').length;
  const soldParcels = parcels.filter((p) => p.status === 'Sold').length;
  
  const latestVersion = 'v1.3.2';
  const lastPublished = '2025-10-10';

  const stats = [
    {
      label: 'Total Parcels',
      value: totalParcels,
      icon: MapPin,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Available',
      value: availableParcels,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Reserved',
      value: reservedParcels,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Sold',
      value: soldParcels,
      icon: XCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of parcel data and recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Updated today</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4">Current Version</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version ID</span>
              <Badge variant="secondary">{latestVersion}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Published</span>
              <span className="text-sm">{lastPublished}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Parcels</span>
              <span className="text-sm font-semibold">{totalParcels}</span>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Status Distribution</div>
              <div className="flex gap-2">
                <div className="flex-1 h-2 rounded-full bg-success" style={{ width: `${(availableParcels / totalParcels) * 100}%` }}></div>
                <div className="flex-1 h-2 rounded-full bg-warning" style={{ width: `${(reservedParcels / totalParcels) * 100}%` }}></div>
                <div className="flex-1 h-2 rounded-full bg-muted-foreground" style={{ width: `${(soldParcels / totalParcels) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Upload Activity</h3>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {uploadHistory.slice(0, 5).map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{upload.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {upload.timestamp} • {upload.user}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={upload.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                    {upload.parcel_count} parcels
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <h3 className="mb-4">Recent Parcels</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcel ID</TableHead>
              <TableHead>Area (sq.m)</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcels.slice(0, 10).map((parcel) => (
              <TableRow key={parcel.id}>
                <TableCell className="font-medium">{parcel.parcel_id}</TableCell>
                <TableCell>{parcel.area_sq_m.toLocaleString()}</TableCell>
                <TableCell>₹{(parcel.price / 100000).toFixed(1)}L</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      parcel.status === 'Available'
                        ? 'default'
                        : parcel.status === 'Reserved'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {parcel.status}
                  </Badge>
                </TableCell>
                <TableCell>{parcel.size_category}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
