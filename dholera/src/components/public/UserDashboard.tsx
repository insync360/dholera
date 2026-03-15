import { useState, useEffect } from 'react';
import { Calendar, Heart, MapPin, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Parcel, PublicUser, SiteVisitRequest, WishlistItem } from '../../lib/types';
import { siteVisitApi, wishlistApi } from '../../lib/api';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  publicUser: PublicUser;
  parcels: Parcel[];
  onViewParcel: (parcel: Parcel) => void;
  onRemoveWishlist: (parcelId: string) => void;
}

export function UserDashboard({ isOpen, onClose, publicUser, parcels, onViewParcel, onRemoveWishlist }: UserDashboardProps) {
  const [siteVisits, setSiteVisits] = useState<SiteVisitRequest[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && publicUser) {
      setLoading(true);
      Promise.all([
        siteVisitApi.getByUser(publicUser.id),
        wishlistApi.getByUser(publicUser.id),
      ])
        .then(([visits, wishlist]) => {
          setSiteVisits(visits);
          setWishlistItems(wishlist);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, publicUser]);

  const findParcel = (parcelId: string) => parcels.find(p => p.parcel_id === parcelId);

  const getVisitStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
    }
  };

  const getParcelStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Available</Badge>;
      case 'Reserved':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Reserved</Badge>;
      case 'Sold':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Sold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewOnMap = (parcelId: string) => {
    const parcel = findParcel(parcelId);
    if (parcel) {
      onClose();
      onViewParcel(parcel);
    }
  };

  const handleRemoveWishlist = (parcelId: string) => {
    onRemoveWishlist(parcelId);
    setWishlistItems(prev => prev.filter(w => w.parcel_id !== parcelId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>My Dashboard</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <Tabs defaultValue="visits" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visits" className="gap-2">
                <Calendar className="h-4 w-4" />
                Site Visits ({siteVisits.length})
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2">
                <Heart className="h-4 w-4" />
                Wishlist ({wishlistItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visits" className="mt-4 space-y-3">
              {siteVisits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No site visit requests yet</p>
                  <p className="text-sm mt-1">Request a site visit from any parcel detail page</p>
                </div>
              ) : (
                siteVisits.map((visit) => {
                  const parcel = findParcel(visit.parcel_id);
                  return (
                    <div
                      key={visit.id}
                      className="border border-amber-200 border-l-4 border-l-amber-400 rounded-lg p-4 bg-amber-50/50"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold break-all">{visit.parcel_id}</span>
                        {getVisitStatusBadge(visit.status)}
                      </div>
                      {parcel && (
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{parcel.area_sq_m.toLocaleString()} sq.m</span>
                          <span>₹{(parcel.price / 100000).toFixed(1)}L</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Requested {new Date(visit.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOnMap(visit.parcel_id)}
                        className="mt-3 w-full sm:w-auto"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View on Map
                      </Button>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="wishlist" className="mt-4 space-y-3">
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Your wishlist is empty</p>
                  <p className="text-sm mt-1">Add parcels to your wishlist from the detail page</p>
                </div>
              ) : (
                wishlistItems.map((item) => {
                  const parcel = findParcel(item.parcel_id);
                  return (
                    <div
                      key={item.id}
                      className="border border-rose-200 border-l-4 border-l-rose-400 rounded-lg p-4 bg-rose-50/50"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold break-all">{item.parcel_id}</span>
                        {parcel && getParcelStatusBadge(parcel.status)}
                      </div>
                      {parcel && (
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{parcel.area_sq_m.toLocaleString()} sq.m</span>
                          <span>₹{(parcel.price / 100000).toFixed(1)}L</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Added {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOnMap(item.parcel_id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View on Map
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWishlist(item.parcel_id)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
