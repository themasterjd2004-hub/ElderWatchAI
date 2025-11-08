import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Navigation, MapPin, Clock } from "lucide-react";

interface HospitalCardProps {
  name?: string;
  address?: string;
  distance?: string;
  eta?: string;
  phone?: string;
  status?: "dispatched" | "en-route" | "arrived";
}

export default function HospitalCard({
  name = "St. Mary's Medical Center",
  address = "1234 Healthcare Ave, City, ST 12345",
  distance = "2.3 miles",
  eta = "8 minutes",
  phone = "(555) 123-4567",
  status = "en-route",
}: HospitalCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "arrived":
        return "bg-medical-stable text-white";
      case "en-route":
        return "bg-medical-monitoring text-white";
      case "dispatched":
        return "bg-medical-warning text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "arrived":
        return "Arrived";
      case "en-route":
        return "En Route";
      case "dispatched":
        return "Dispatched";
      default:
        return status;
    }
  };

  return (
    <Card className="p-6" data-testid="card-hospital">
      <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-hospital-name">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {address}
          </p>
        </div>
        <Badge className={getStatusColor()} data-testid="badge-hospital-status">
          {getStatusLabel()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Navigation className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Distance</span>
          </div>
          <p className="text-lg font-semibold">{distance}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-medium">ETA</span>
          </div>
          <p className="text-lg font-semibold">{eta}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => console.log("Calling hospital:", phone)}
          data-testid="button-call-hospital"
        >
          <Phone className="h-4 w-4 mr-2" />
          Call Hospital
        </Button>
        <Button
          variant="outline"
          onClick={() => console.log("Tracking ambulance")}
          data-testid="button-track-ambulance"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Track Ambulance
        </Button>
      </div>
    </Card>
  );
}
