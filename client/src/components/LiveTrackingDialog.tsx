import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Ambulance, 
  Hospital, 
  Phone, 
  User, 
  Clock, 
  MapPin,
  CheckCircle2,
  Navigation,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

interface LiveTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospital: {
    id: number;
    name: string;
    address: string;
    phone: string;
    distance?: number;
    latitude?: number;
    longitude?: number;
  };
  ambulance: {
    id: number;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    status?: string;
    distanceRemaining?: number;
    speed?: number;
    currentLocation?: {
      lat: number;
      lng: number;
      timestamp?: string;
    };
  };
  destination: {
    lat: number;
    lng: number;
  };
  etaMinutes: number;
  dispatchTime?: Date;
}

export default function LiveTrackingDialog({
  open,
  onOpenChange,
  hospital,
  ambulance: initialAmbulance,
  destination,
  etaMinutes: initialEta,
  dispatchTime = new Date(),
}: LiveTrackingDialogProps) {
  const [ambulance, setAmbulance] = useState(initialAmbulance);
  const [etaMinutes, setEtaMinutes] = useState(initialEta);

  // Simulate GPS updates every 5 seconds for demo
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      if (ambulance.status === "en_route" && (ambulance.distanceRemaining || 0) > 0) {
        const newDistance = Math.max(0, (ambulance.distanceRemaining || 5) - 0.5);
        const newSpeed = 45 + Math.random() * 20; // 45-65 km/h

        setAmbulance((prev) => ({
          ...prev,
          distanceRemaining: newDistance,
          speed: newSpeed,
          currentLocation: {
            lat: destination.lat + (Math.random() - 0.5) * 0.01,
            lng: destination.lng + (Math.random() - 0.5) * 0.01,
            timestamp: new Date().toISOString(),
          },
        }));

        // Recalculate ETA
        const hours = newDistance / newSpeed;
        const minutes = Math.ceil(hours * 60);
        setEtaMinutes(minutes);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [open, ambulance.status, ambulance.distanceRemaining, destination]);

  const estimatedArrival = new Date(dispatchTime.getTime() + etaMinutes * 60000);
  const progress = Math.min(100, 100 - ((ambulance.distanceRemaining || 0) / (hospital.distance || 5)) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "dispatched":
        return "bg-warning text-white";
      case "en_route":
        return "bg-primary text-white";
      case "arrived":
        return "bg-success text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-success" data-testid="dialog-live-tracking">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-heading text-success" data-testid="text-dialog-title">
                  Emergency Response Active
                </DialogTitle>
                <DialogDescription className="text-base">
                  Live ambulance tracking - Help is on the way
                </DialogDescription>
              </div>
            </div>
            <Badge className={getStatusColor(ambulance.status || "en_route")} data-testid="badge-ambulance-status">
              {(ambulance.status || "en_route").replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hospital and Ambulance Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hospital Details */}
            <div className="space-y-4 p-5 bg-card border-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Hospital className="h-5 w-5 text-primary" />
                <h4 className="font-heading font-semibold text-lg">Hospital Contacted</h4>
              </div>
              
              <div className="space-y-3 pl-7">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Hospital Name
                  </p>
                  <p className="font-medium" data-testid="text-hospital-name">{hospital.name}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="text-sm" data-testid="text-hospital-address">{hospital.address}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${hospital.phone}`}
                    className="text-primary font-medium hover:underline"
                    data-testid="button-call-hospital"
                  >
                    {hospital.phone}
                  </a>
                </div>

                {hospital.distance && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm mono-number" data-testid="text-hospital-distance">
                      {hospital.distance.toFixed(1)} km away
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ambulance Details */}
            <div className="space-y-4 p-5 bg-card border-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Ambulance className="h-5 w-5 text-primary" />
                <h4 className="font-heading font-semibold text-lg">Ambulance En Route</h4>
              </div>
              
              <div className="space-y-3 pl-7">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Vehicle Number
                  </p>
                  <p className="mono-number font-semibold text-lg" data-testid="text-vehicle-number">
                    {ambulance.vehicleNumber}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Driver Name
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium" data-testid="text-driver-name">{ambulance.driverName}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Driver Contact
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${ambulance.driverPhone}`}
                      className="text-primary font-medium hover:underline"
                      data-testid="button-call-driver"
                    >
                      {ambulance.driverPhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live GPS Tracking Section */}
          <div className="p-5 bg-primary/5 border-2 border-primary rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Ambulance className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <h4 className="font-heading font-semibold text-lg">Live GPS Tracking</h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Distance</p>
                </div>
                <p className="mono-number font-semibold text-2xl" data-testid="text-distance">
                  {(ambulance.distanceRemaining || 0).toFixed(1)} km
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">ETA</p>
                </div>
                <p className="mono-number font-semibold text-2xl" data-testid="text-eta">
                  {etaMinutes} min
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Ambulance className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Speed</p>
                </div>
                <p className="mono-number font-semibold text-2xl" data-testid="text-speed">
                  {(ambulance.speed || 0).toFixed(0)} km/h
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Arrival</p>
                </div>
                <p className="mono-number font-semibold text-lg" data-testid="text-arrival-time">
                  {estimatedArrival.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>

            {/* GPS Coordinates */}
            {ambulance.currentLocation && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">GPS Coordinates</span>
                </div>
                <div className="text-xs mono-number text-muted-foreground">
                  Lat: {ambulance.currentLocation.lat.toFixed(6)}, Lng: {ambulance.currentLocation.lng.toFixed(6)}
                </div>
                {ambulance.currentLocation.timestamp && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated: {new Date(ambulance.currentLocation.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Progress to Destination</span>
                <span className="text-xs mono-number font-semibold">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-1000 animate-fade-in"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Dispatched {dispatchTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span>•</span>
            <span>Paramedic team onboard</span>
            <span>•</span>
            <span>Medical equipment ready</span>
            <span>•</span>
            <span>AES-256 encrypted</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(`tel:${ambulance.driverPhone}`)}
              data-testid="button-call-driver-action"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Driver
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`tel:${hospital.phone}`)}
              data-testid="button-call-hospital-action"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Hospital
            </Button>
            <Button 
              variant="default"
              onClick={() => onOpenChange(false)}
              data-testid="button-minimize-tracking"
            >
              <X className="h-4 w-4 mr-2" />
              Minimize
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
