import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, MapPin, Ambulance as AmbulanceIcon } from "lucide-react";
import { useQuery } from "@tantml:query";
import type { Hospital, Ambulance } from "@shared/schema";
import { useState } from "react";

export default function AmbulanceManagement() {
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: ambulances, isLoading } = useQuery<Ambulance[]>({
    queryKey: ["/api/ambulances/hospital", selectedHospital],
    enabled: !!selectedHospital,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "dispatched":
      case "en_route":
        return "bg-yellow-500";
      case "arrived":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Ambulance Fleet</h2>
          <p className="text-sm text-muted-foreground">
            Manage emergency response vehicles
          </p>
        </div>
        <Button data-testid="button-add-ambulance">
          <Plus className="h-4 w-4 mr-2" />
          Add Ambulance
        </Button>
      </div>

      {hospitals && hospitals.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {hospitals.map((hospital) => (
            <Button
              key={hospital.id}
              variant={selectedHospital === hospital.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedHospital(hospital.id)}
              data-testid={`button-select-hospital-${hospital.id}`}
            >
              {hospital.name}
            </Button>
          ))}
        </div>
      )}

      {selectedHospital && (
        <div className="grid gap-4">
          {isLoading ? (
            <div>Loading ambulances...</div>
          ) : ambulances && ambulances.length > 0 ? (
            ambulances.map((ambulance) => (
              <Card key={ambulance.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AmbulanceIcon className="h-5 w-5" />
                      <h3 className="font-semibold">{ambulance.vehicleNumber}</h3>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(ambulance.status)}`} />
                        <Badge variant={ambulance.status === "available" ? "secondary" : "default"}>
                          {ambulance.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {ambulance.driverName && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">Driver:</span> {ambulance.driverName}
                        </div>
                      )}
                      {ambulance.driverPhone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{ambulance.driverPhone}</span>
                        </div>
                      )}
                      {ambulance.currentLocation && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {ambulance.currentLocation.lat.toFixed(4)}, {ambulance.currentLocation.lng.toFixed(4)}
                          </span>
                        </div>
                      )}
                      {ambulance.speed && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">Speed:</span> {ambulance.speed} km/h
                        </div>
                      )}
                      {ambulance.distanceRemaining && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">Distance Remaining:</span> {ambulance.distanceRemaining} km
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" data-testid={`button-track-ambulance-${ambulance.id}`}>
                      Track
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No ambulances found for this hospital</p>
              <p className="text-sm mt-2">Click "Add Ambulance" to add a vehicle</p>
            </Card>
          )}
        </div>
      )}

      {!selectedHospital && hospitals && hospitals.length > 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Select a hospital to view its ambulance fleet</p>
        </Card>
      )}

      {!hospitals || hospitals.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No hospitals available</p>
          <p className="text-sm mt-2">Add hospitals first in the Hospitals tab</p>
        </Card>
      )}
    </div>
  );
}
