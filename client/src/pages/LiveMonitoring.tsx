import LiveMonitoringFeed from "@/components/LiveMonitoringFeed";
import VitalsPanel from "@/components/VitalsPanel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, AlertTriangle, Camera } from "lucide-react";
import { useFallDetection } from "@/hooks/useFallDetection";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import { getDemoIds } from "@/lib/demoIds";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { FallAlert } from "@/modules/fall-detection";
import type { Camera as CameraType } from "@shared/schema";

export default function LiveMonitoring() {
  const [userId, setUserId] = useState<string | undefined>();
  const [parentId, setParentId] = useState<string | undefined>();
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    getDemoIds().then(({ userId, parentId }) => {
      setUserId(userId);
      setParentId(parentId);
      console.log("Using IDs:", { userId, parentId });
    });
  }, []);

  // Fetch cameras for this parent
  const { data: cameras } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras", parentId],
    enabled: !!parentId,
  });

  // Auto-select primary camera or first camera when cameras load
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCamera) {
      const primary = cameras.find((c) => c.isPrimary);
      setSelectedCamera(primary?.id || cameras[0].id);
    }
  }, [cameras, selectedCamera]);

  const { currentAlert, handleFallDetected, acknowledgeFall, markAsFalseAlarm } = useFallDetection(parentId);
  useWebSocket(userId);

  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (currentAlert) {
      setShowAlert(true);
    }
  }, [currentAlert]);

  const handleCountdownComplete = (alert: FallAlert, hospital: any, etaMinutes: number) => {
    // Store emergency data in sessionStorage and navigate to Dashboard
    const emergencyData = {
      fallAlert: alert,
      hospital,
      etaMinutes,
      confidence: alert.confidence,
      destination: alert.gpsCoordinates || { lat: 0, lng: 0 },
    };
    sessionStorage.setItem('emergencyDispatch', JSON.stringify(emergencyData));
    navigate("/");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Live Monitoring</h1>
        <p className="text-muted-foreground mt-1">
          Real-time AI-powered safety monitoring with fall detection
        </p>
      </div>

      {showAlert && currentAlert && (
        <Card className="p-6 border-destructive border-2 bg-destructive/5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <h3 className="text-lg font-semibold">Fall Alert - Action Required</h3>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {new Date(currentAlert.timestamp).toLocaleTimeString()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Alert details */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    A fall has been detected with {currentAlert.confidence}% confidence. No movement was detected during the 10-second motion check.
                  </p>
                  {currentAlert.gpsCoordinates && (
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5" />
                      <div className="text-xs">
                        <div className="font-semibold">GPS Location</div>
                        <div className="text-muted-foreground">
                          {currentAlert.gpsCoordinates.lat.toFixed(6)}, {currentAlert.gpsCoordinates.lng.toFixed(6)}
                        </div>
                        <div className="text-muted-foreground">
                          Accuracy: {currentAlert.gpsCoordinates.accuracy?.toFixed(0)}m
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Snapshot preview */}
                {currentAlert.snapshot && (
                  <div className="bg-black rounded-md overflow-hidden">
                    <img 
                      src={currentAlert.snapshot} 
                      alt="Fall detection snapshot"
                      className="w-full h-auto"
                      data-testid="img-fall-snapshot"
                    />
                    <p className="text-xs text-white/70 p-2 text-center">
                      Skeletal overlay at fall moment
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="destructive"
                  onClick={() => {
                    console.log("Dispatching emergency");
                    userId && acknowledgeFall(currentAlert.id, userId);
                  }}
                  data-testid="button-dispatch-emergency"
                >
                  Dispatch Emergency
                </Button>
                <Button
                  variant="outline"
                  onClick={() => markAsFalseAlarm(currentAlert.id)}
                  data-testid="button-false-alarm"
                >
                  False Alarm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => userId && acknowledgeFall(currentAlert.id, userId)}
                  data-testid="button-acknowledge"
                >
                  Acknowledge
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {cameras && cameras.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Camera className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Label htmlFor="camera-select" className="text-sm font-medium mb-1 block">
                Select Camera
              </Label>
              <Select
                value={selectedCamera}
                onValueChange={setSelectedCamera}
              >
                <SelectTrigger className="w-full md:w-80" data-testid="select-camera">
                  <SelectValue placeholder="Choose a camera..." />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{camera.roomName}</span>
                        {camera.location && <span className="text-xs text-muted-foreground">({camera.location})</span>}
                        {camera.isPrimary && <Badge variant="outline" className="ml-1 text-xs">Primary</Badge>}
                        {!camera.isActive && <Badge variant="secondary" className="ml-1 text-xs">Inactive</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cameras.length > 1 && (
              <Badge variant="outline" className="text-xs">
                {cameras.length} cameras available
              </Badge>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <LiveMonitoringFeed
            parentId={parentId}
            onFallDetected={handleFallDetected}
            onCountdownComplete={handleCountdownComplete}
          />
          
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Current Location</h3>
                <p className="text-sm text-muted-foreground">
                  123 Oak Street, Springfield, IL 62701
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">Home</Badge>
                  <Badge variant="outline">GPS: High Accuracy</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Live Vitals</h3>
            <VitalsPanel />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">AI Detection Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Skeletal Tracking</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fall Detection</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Motion Monitoring</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">10s Motion Check</span>
                <Badge className="bg-medical-stable text-white">Ready</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary">
            <h4 className="font-semibold mb-2 text-sm">Privacy Protected</h4>
            <p className="text-xs text-muted-foreground">
              All monitoring uses MediaPipe skeletal tracking. No raw video is stored. Fall detection uses pose keypoint analysis with 10-second motion verification.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
