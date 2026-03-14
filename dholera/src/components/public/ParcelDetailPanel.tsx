import { X, Share2, FileText, MapPin, Maximize2, Calendar, Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Parcel } from '../../lib/types';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';

interface ParcelDetailPanelProps {
  parcel: Parcel | null;
  onClose: () => void;
  onMoreDetails: () => void;
  onRequestVisit: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  wishlistLoading?: boolean;
}

export function ParcelDetailPanel({ parcel, onClose, onMoreDetails, onRequestVisit, onToggleWishlist, isWishlisted = false, wishlistLoading = false }: ParcelDetailPanelProps) {
  if (!parcel) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-success text-white';
      case 'Reserved':
        return 'bg-warning text-foreground';
      case 'Sold':
        return 'bg-muted-foreground text-white';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}?parcel=${parcel.parcel_id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 md:absolute md:top-[73px] md:right-0 md:bottom-0 md:left-auto md:w-96 bg-white shadow-2xl z-30 flex flex-col max-h-[75vh] md:max-h-full rounded-t-xl md:rounded-none transition-transform duration-300 ease-in-out">
      <div className="shrink-0 bg-white border-b border-border p-4 flex items-center justify-between z-10 rounded-t-xl md:rounded-none">
        <h3>Parcel Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Parcel ID</div>
            <div className="text-xl md:text-2xl font-bold break-all">{parcel.parcel_id}</div>
          </div>
          <Badge className={getStatusColor(parcel.status)}>{parcel.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Area</div>
            <div className="text-xl font-semibold">{parcel.area_sq_m.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">sq. meters</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Price</div>
            <div className="text-xl font-semibold">₹{(parcel.price / 100000).toFixed(1)}L</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </Card>
        </div>

        {parcel.images && parcel.images.length > 0 ? (
          <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Property Image</div>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No images available</div>
            </div>
          </div>
        )}

        <div>
          <div className="text-sm text-muted-foreground mb-2">Description</div>
          <p className="text-sm">{parcel.description}</p>
        </div>

        {parcel.landmark_distance && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{parcel.landmark_distance}</span>
          </div>
        )}

        {parcel.notes && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Notes</div>
            <p className="text-sm bg-muted p-3 rounded-lg">{parcel.notes}</p>
          </div>
        )}

        <Separator />

        <div>
          <div className="text-sm text-muted-foreground mb-3">Documents</div>
          <div className="space-y-2">
            {parcel.documents.map((doc, index) => (
              <a
                key={index}
                href={doc.url}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm flex-1">{doc.name}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button className="w-full" size="lg" onClick={onRequestVisit}>
            <Calendar className="h-4 w-4 mr-2" />
            Request Site Visit
          </Button>
          <Button
            variant="outline"
            className={`w-full ${isWishlisted ? 'text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-100' : ''}`}
            onClick={onToggleWishlist}
            disabled={wishlistLoading}
          >
            <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
            {wishlistLoading ? 'Updating...' : isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={onMoreDetails}>
              <Maximize2 className="h-4 w-4 mr-2" />
              More Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
