import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Hospital } from "@shared/schema";

export default function HospitalManagement() {
  const { data: hospitals, isLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  if (isLoading) {
    return <div>Loading hospitals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Hospital Network</h2>
          <p className="text-sm text-muted-foreground">
            Manage partnered healthcare facilities
          </p>
        </div>
        <Button data-testid="button-add-hospital">
          <Plus className="h-4 w-4 mr-2" />
          Add Hospital
        </Button>
      </div>

      <div className="grid gap-4">
        {hospitals && hospitals.length > 0 ? (
          hospitals.map((hospital) => (
            <Card key={hospital.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{hospital.name}</h3>
                    {hospital.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{hospital.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{hospital.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{hospital.phone}</span>
                      {hospital.emergencyPhone && (
                        <Badge variant="destructive" className="ml-2">
                          Emergency: {hospital.emergencyPhone}
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">GPS:</span> {hospital.gpsCoordinates.lat.toFixed(4)}, {hospital.gpsCoordinates.lng.toFixed(4)}
                    </div>
                    {hospital.specializations && hospital.specializations.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {hospital.specializations.map((spec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{hospital.availability}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid={`button-edit-hospital-${hospital.id}`}>
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No hospitals found</p>
            <p className="text-sm mt-2">Click "Add Hospital" to add a healthcare facility</p>
          </Card>
        )}
      </div>
    </div>
  );
}
