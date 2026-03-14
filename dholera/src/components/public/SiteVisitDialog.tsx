import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Parcel, PublicUser } from '../../lib/types';
import { siteVisitApi, ApiError } from '../../lib/api';
import { toast } from 'sonner';
import { Calendar, Phone, User, MapPin, Loader2 } from 'lucide-react';

interface SiteVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: Parcel;
  publicUser: PublicUser;
}

type DialogState = 'form' | 'submitting' | 'success';

export function SiteVisitDialog({ isOpen, onClose, parcel, publicUser }: SiteVisitDialogProps) {
  const [state, setState] = useState<DialogState>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [requirements, setRequirements] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');

    try {
      await siteVisitApi.create({
        user_id: publicUser.id,
        parcel_id: parcel.parcel_id,
        name,
        phone,
        requirements: requirements || undefined,
      });
      setState('success');
    } catch (err) {
      setState('form');
      const msg = err instanceof ApiError ? err.message : 'Failed to submit request. Please try again.';
      toast.error(msg);
    }
  };

  const handleClose = () => {
    setState('form');
    setName('');
    setPhone('');
    setRequirements('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:!max-w-md overflow-hidden">
        {state === 'success' ? (
          <div className="relative py-8 text-center">
            {/* Animated background glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg">
              <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-[0.08]"
                style={{
                  background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            </div>

            {/* Success icon with animated rings */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-emerald-200"
                style={{ animation: 'ring-expand 0.6s ease-out forwards' }}
              />
              {/* Inner ring */}
              <div
                className="absolute inset-2 rounded-full border-2 border-emerald-300"
                style={{ animation: 'ring-expand 0.6s ease-out 0.1s forwards', opacity: 0 }}
              />
              {/* Checkmark circle */}
              <div
                className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
                style={{ animation: 'scale-bounce 0.5s ease-out 0.2s forwards', opacity: 0 }}
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  style={{ animation: 'draw-check 0.4s ease-out 0.5s forwards' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    strokeDasharray="24"
                    strokeDashoffset="24"
                    style={{ animation: 'draw-check 0.4s ease-out 0.5s forwards' }}
                  />
                </svg>
              </div>
            </div>

            {/* Text content */}
            <div
              className="space-y-2 mb-6"
              style={{ animation: 'fade-up 0.5s ease-out 0.4s forwards', opacity: 0 }}
            >
              <h2 className="text-xl font-semibold tracking-tight">
                Request Received!
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Our team will reach out within 24 hours to schedule your visit to parcel{' '}
                <span className="font-semibold text-foreground">{parcel.parcel_id}</span>.
              </p>
            </div>

            {/* Info card */}
            <div
              className="mb-6"
              style={{ animation: 'fade-up 0.5s ease-out 0.55s forwards', opacity: 0 }}
            >
              <div className="inline-block bg-muted/60 rounded-xl px-5 py-3 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Dholera Smart City, Gujarat</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>We'll confirm a date that works for you</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Expect a call from our site coordinator</span>
                </div>
              </div>
            </div>

            {/* Done button */}
            <div style={{ animation: 'fade-up 0.5s ease-out 0.65s forwards', opacity: 0 }}>
              <Button onClick={handleClose} className="w-full" size="lg">
                Done
              </Button>
            </div>

            {/* Inline keyframe styles */}
            <style>{`
              @keyframes ring-expand {
                from { transform: scale(0.5); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
              @keyframes scale-bounce {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes draw-check {
                to { stroke-dashoffset: 0; }
              }
              @keyframes fade-up {
                from { transform: translateY(10px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes pulse-glow {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.2); }
              }
            `}</style>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                Request Site Visit
              </DialogTitle>
              <DialogDescription>
                Share your details and we'll coordinate a visit to parcel {parcel.parcel_id}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="sv-name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="sv-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-10"
                    required
                    disabled={state === 'submitting'}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sv-phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="sv-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="pl-10"
                    required
                    disabled={state === 'submitting'}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sv-requirements">
                  Requirements <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="sv-requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Any specific requirements or questions about the property..."
                  rows={3}
                  className="resize-none"
                  disabled={state === 'submitting'}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={state === 'submitting'}>
                {state === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
