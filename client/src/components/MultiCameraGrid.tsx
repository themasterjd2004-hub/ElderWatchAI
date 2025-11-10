import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LiveMonitoringFeed from "@/components/LiveMonitoringFeed";
import { Camera, Eye } from "lucide-react";
import type { Camera as CameraType } from "@shared/schema";
import type { FallAlert } from "@/modules/fall-detection";

interface MultiCameraGridProps {
  parentId: string;
  cameras: CameraType[];
  onFallDetected?: (alert: FallAlert) => void;
  onCountdownComplete?: (alert: FallAlert, hospital: any, etaMinutes: number) => void;
}

export default function MultiCameraGrid({
  parentId,
  cameras,
  onFallDetected,
  onCountdownComplete,
}: MultiCameraGridProps) {
  const activeCameras = cameras.filter((c) => c.isActive);

  if (activeCameras.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No active cameras</p>
          <p className="text-sm mt-1">Enable cameras in Settings to start monitoring</p>
        </div>
      </Card>
    );
  }

  const gridClass = activeCameras.length === 1
    ? "grid-cols-1"
    : activeCameras.length === 2
    ? "grid-cols-1 lg:grid-cols-2"
    : activeCameras.length === 3
    ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
    : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/5 border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Multi-Camera View</h3>
          </div>
          <Badge variant="outline" className="bg-medical-stable text-white border-medical-stable">
            {activeCameras.length} {activeCameras.length === 1 ? "Camera" : "Cameras"} Active
          </Badge>
        </div>
      </Card>

      <div className={`grid ${gridClass} gap-4`}>
        {activeCameras.map((camera) => (
          <Card key={camera.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">{camera.roomName}</h4>
              </div>
              <div className="flex items-center gap-2">
                {camera.isPrimary && (
                  <Badge variant="outline" className="text-xs">Primary</Badge>
                )}
                <Badge className="bg-medical-stable text-white text-xs">Live</Badge>
              </div>
            </div>
            {camera.location && (
              <p className="text-xs text-muted-foreground">{camera.location}</p>
            )}
            <div className="aspect-video bg-black rounded-md overflow-hidden">
              <LiveMonitoringFeed
                parentId={parentId}
                onFallDetected={onFallDetected}
                onCountdownComplete={onCountdownComplete}
                mode="skeletal"
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-3 bg-amber/5 border-amber">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Each camera feed runs independent fall detection. Alerts will show the camera room name where the fall was detected.
        </p>
      </Card>
    </div>
  );
}
