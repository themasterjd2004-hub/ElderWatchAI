import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ambulance, MapPin, Clock, Phone, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { initializeWebSocket } from "@/lib/websocket";

interface AmbulanceTrackerProps {
  ambulance: any;
  hospital: any;
  destination: { lat: number; lng: number };
}

export default function AmbulanceTracker({ ambulance: initialAmbulance, hospital, destination }: AmbulanceTrackerProps) {
  const [ambulance, setAmbulance] = useState(initialAmbulance);

  // Listen for real-time ambulance updates
  useEffect(() => {
    const socket = initializeWebSocket();

    const handleAmbulanceUpdate = (data: any) => {
      if (data.id === ambulance.id) {
        setAmbulance((prev: any) => ({ ...prev, ...data }));
      }
    };

    socket?.on("ambulance_updated", handleAmbulanceUpdate);

    return () => {
      socket?.off("ambulance_updated", handleAmbulanceUpdate);
    };
  }, [ambulance.id]);

  // Simulate GPS updates every 5 seconds for demo
  useEffect(() => {
    const interval = setInterval(async () => {
      // In production, this would come from the ambulance's GPS tracker
      if (ambulance.status === "en_route" && ambulance.distanceRemaining > 0) {
        const newDistance = Math.max(0, (ambulance.distanceRemaining || 5) - 0.5);
        const newSpeed = 45 + Math.random() * 20; // 45-65 km/h

        setAmbulance((prev: any) => ({
          ...prev,
          distanceRemaining: newDistance,
          speed: newSpeed,
          currentLocation: {
            lat: destination.lat + (Math.random() - 0.5) * 0.01,
            lng: destination.lng + (Math.random() - 0.5) * 0.01,
            timestamp: new Date().toISOString(),
          },
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ambulance.status, ambulance.distanceRemaining, destination]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "dispatched":
        return "bg-medical-warning text-white";
      case "en_route":
        return "bg-primary text-white";
      case "arrived":
        return "bg-medical-stable text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getETA = () => {
    if (!ambulance.distanceRemaining || !ambulance.speed) return "Calculating...";
    const hours = ambulance.distanceRemaining / ambulance.speed;
    const minutes = Math.ceil(hours * 60);
    return `${minutes} min`;
  };

  return (
    <Card className="border-primary border-2 bg-primary/5" data-testid="card-ambulance-tracker">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Ambulance className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold" data-testid="text-tracker-title">
                  Ambulance Dispatched
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hospital.name}
                </p>
              </div>
              <Badge className={getStatusColor(ambulance.status)} data-testid="badge-ambulance-status">
                {ambulance.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Distance</p>
                </div>
                <p className="font-mono font-semibold text-lg" data-testid="text-distance">
                  {ambulance.distanceRemaining?.toFixed(1) || "0.0"} km
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">ETA</p>
                </div>
                <p className="font-mono font-semibold text-lg" data-testid="text-eta">
                  {getETA()}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Ambulance className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                </div>
                <p className="font-mono font-semibold text-lg" data-testid="text-vehicle">
                  {ambulance.vehicleNumber}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Driver</p>
                </div>
                <p className="font-semibold text-sm" data-testid="text-driver">
                  {ambulance.driverName || "Not assigned"}
                </p>
                {ambulance.driverPhone && (
                  <p className="text-xs text-muted-foreground">{ambulance.driverPhone}</p>
                )}
              </div>
            </div>

            {ambulance.speed && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Live GPS Tracking</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {ambulance.speed?.toFixed(0)} km/h
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Current Location: {ambulance.currentLocation?.lat.toFixed(4)}, {ambulance.currentLocation?.lng.toFixed(4)}
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${100 - ((ambulance.distanceRemaining || 0) / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
