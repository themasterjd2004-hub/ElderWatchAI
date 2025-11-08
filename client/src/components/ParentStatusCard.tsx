import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Video, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import parentPhoto from "@assets/generated_images/Elderly_parent_profile_photo_50154e6f.png";

interface ParentStatusCardProps {
  name?: string;
  age?: number;
  lastActive?: string;
  status?: "active" | "inactive" | "alert";
  photoUrl?: string;
}

export default function ParentStatusCard({
  name = "Margaret Wilson",
  age = 76,
  lastActive = "2 minutes ago",
  status = "active",
  photoUrl = parentPhoto,
}: ParentStatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "alert":
        return "bg-medical-critical text-white";
      case "inactive":
        return "bg-muted text-muted-foreground";
      case "active":
        return "bg-medical-stable text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "alert":
        return "Alert";
      case "inactive":
        return "Inactive";
      case "active":
        return "Monitoring";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="p-6" data-testid="card-parent-status">
      <div className="flex items-start gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={photoUrl} alt={name} />
          <AvatarFallback className="text-2xl">
            {name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold" data-testid="text-parent-name">
                {name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Age {age}
              </p>
            </div>
            <Badge className={getStatusColor()} data-testid="badge-status">
              <span className="h-2 w-2 rounded-full bg-current mr-2 animate-pulse" />
              {getStatusLabel()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2" data-testid="text-last-active">
            Last active: {lastActive}
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button size="sm" data-testid="button-call-parent">
              <Phone className="h-4 w-4 mr-2" />
              Call Parent
            </Button>
            <Button size="sm" variant="outline" data-testid="button-view-camera">
              <Video className="h-4 w-4 mr-2" />
              View Camera
            </Button>
            <Button size="sm" variant="outline" data-testid="button-emergency-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
