import { Card } from "@/components/ui/card";
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
  Navigation
} from "lucide-react";

interface EmergencyResponseDetailsProps {
  hospital: {
    id: number;
    name: string;
    address: string;
    phone: string;
    distance?: number;
  };
  ambulance: {
    id: number;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    currentLocation?: {
      lat: number;
      lng: number;
    };
  };
  etaMinutes: number;
  dispatchTime?: Date;
}

export default function EmergencyResponseDetails({ 
  hospital, 
  ambulance, 
  etaMinutes,
  dispatchTime = new Date()
}: EmergencyResponseDetailsProps) {
  const estimatedArrival = new Date(dispatchTime.getTime() + etaMinutes * 60000);

  return (
    <Card className="p-6 border-medical-stable bg-medical-stable/5" data-testid="card-emergency-response">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-medical-stable/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-medical-stable" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-medical-stable" data-testid="text-emergency-status">
              Emergency Response Active
            </h3>
            <p className="text-sm text-muted-foreground">
              Help is on the way
            </p>
          </div>
        </div>
        <Badge className="bg-medical-stable text-white hover:bg-medical-stable" data-testid="badge-status">
          DISPATCHED
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hospital Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Hospital className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">Hospital Contacted</h4>
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
                <span className="text-sm font-mono" data-testid="text-hospital-distance">
                  {hospital.distance.toFixed(1)} km away
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ambulance & Driver Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Ambulance className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">Ambulance En Route</h4>
          </div>
          
          <div className="space-y-3 pl-7">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Vehicle Number
              </p>
              <p className="font-mono font-semibold text-lg" data-testid="text-vehicle-number">
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

      {/* ETA Section - Prominent Display */}
      <div className="mt-6 pt-6 border-t">
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Estimated Time of Arrival
                </p>
                <p className="text-3xl font-bold font-mono" data-testid="text-eta-minutes">
                  {etaMinutes} minutes
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Expected Arrival
              </p>
              <p className="text-lg font-semibold" data-testid="text-arrival-time">
                {estimatedArrival.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          data-testid="button-track-ambulance"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Track Live Location
        </Button>
        <Button 
          variant="default"
          className="flex-1"
          data-testid="button-call-emergency"
          onClick={() => window.open(`tel:${ambulance.driverPhone}`)}
        >
          <Phone className="h-4 w-4 mr-2" />
          Call Driver Now
        </Button>
      </div>

      {/* Timeline Indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-medical-stable animate-pulse" />
          <span>Dispatched {dispatchTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <span>•</span>
        <span>Paramedic team onboard</span>
        <span>•</span>
        <span>Medical equipment ready</span>
      </div>
    </Card>
  );
}
