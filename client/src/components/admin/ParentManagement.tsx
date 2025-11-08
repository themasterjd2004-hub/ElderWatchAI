import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, MapPin, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Parent } from "@shared/schema";

export default function ParentManagement() {
  const { user } = useAuth();
  
  const { data: parents, isLoading } = useQuery<Parent[]>({
    queryKey: ["/api/parents", user?.id],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div>Loading parents...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Parent Profiles</h2>
          <p className="text-sm text-muted-foreground">
            Manage monitored elder profiles
          </p>
        </div>
        <Button data-testid="button-add-parent">
          <Plus className="h-4 w-4 mr-2" />
          Add Parent
        </Button>
      </div>

      <div className="grid gap-4">
        {parents && parents.length > 0 ? (
          parents.map((parent) => (
            <Card key={parent.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{parent.name}</h3>
                    <Badge variant={parent.monitoringMode === "skeletal" ? "default" : "secondary"}>
                      {parent.monitoringMode}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span>Age: {parent.age} years</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{parent.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{parent.address}</span>
                    </div>
                    {parent.medicalConditions && parent.medicalConditions.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {parent.medicalConditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid={`button-edit-parent-${parent.id}`}>
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No parents found</p>
            <p className="text-sm mt-2">Click "Add Parent" to create a new profile</p>
          </Card>
        )}
      </div>
    </div>
  );
}
