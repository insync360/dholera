import { Download, Share2, Printer, Bookmark, Calendar, MapPin, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Parcel } from '../../lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';

interface ParcelDetailModalProps {
  parcel: Parcel | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ParcelDetailModal({ parcel, isOpen, onClose }: ParcelDetailModalProps) {
  const [showVisitForm, setShowVisitForm] = useState(false);

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

  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  const handleBookmark = () => {
    toast.success('Parcel bookmarked!');
  };

  const handleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Site visit request submitted successfully!');
    setShowVisitForm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Parcel {parcel.parcel_id}</span>
              <Badge className={getStatusColor(parcel.status)}>{parcel.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleBookmark}>
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">High-resolution image placeholder</div>
                  <div className="text-xs mt-1">3D render support coming soon</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-xs text-muted-foreground">View 2</div>
                </div>
                <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-xs text-muted-foreground">View 3</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-3">Property Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Area</div>
                    <div className="font-semibold">{parcel.area_sq_m.toLocaleString()} sq.m</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="font-semibold">₹{(parcel.price / 100000).toFixed(1)} Lakhs</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Price per sq.m</div>
                    <div className="font-semibold">₹{(parcel.price / parcel.area_sq_m).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="font-semibold">{parcel.size_category}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Location</div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-1" />
                  <div className="text-sm">{parcel.landmark_distance || 'Dholera Smart City'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Description</div>
                <p className="text-sm">{parcel.description}</p>
              </div>

              {parcel.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Additional Notes</div>
                  <p className="text-sm bg-muted p-3 rounded-lg">{parcel.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3">Available Documents</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {parcel.documents.map((doc, index) => (
                <a
                  key={index}
                  href={doc.url}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          {!showVisitForm ? (
            <div className="flex gap-2">
              <Button className="flex-1" size="lg" onClick={() => setShowVisitForm(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule a Site Visit
              </Button>
              <Button variant="outline" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download Brochure
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-4">
              <h4 className="mb-4">Schedule Site Visit</h4>
              <form onSubmit={handleVisitSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your name" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="Enter your phone" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email" required />
                </div>
                <div>
                  <Label htmlFor="date">Preferred Date</Label>
                  <Input id="date" type="date" required />
                </div>
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea id="message" placeholder="Any specific requirements..." rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Submit Request</Button>
                  <Button type="button" variant="outline" onClick={() => setShowVisitForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
