import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Mic, MicOff, Settings, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import skeletalView from "@assets/generated_images/Skeletal_motion_tracking_visualization_7906f96d.png";

interface MonitoringFeedProps {
  mode?: "skeletal" | "normal";
  isRecording?: boolean;
}

export default function MonitoringFeed({
  mode = "skeletal",
  isRecording = true,
}: MonitoringFeedProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(mode === "skeletal");

  return (
    <Card className="overflow-hidden" data-testid="card-monitoring-feed">
      <div className="relative aspect-video bg-black">
        {privacyMode ? (
          <img
            src={skeletalView}
            alt="Skeletal tracking view"
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60">
            <Camera className="h-16 w-16" />
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {isRecording && (
            <Badge className="bg-medical-critical text-white" data-testid="badge-recording">
              <span className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
              RECORDING
            </Badge>
          )}
          <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
            {new Date().toLocaleTimeString()}
          </Badge>
          {privacyMode && (
            <Badge className="bg-primary text-primary-foreground" data-testid="badge-privacy-mode">
              <Eye className="h-3 w-3 mr-1" />
              Skeletal Mode
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
            onClick={() => setAudioEnabled(!audioEnabled)}
            data-testid="button-toggle-audio"
          >
            {audioEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
            onClick={() => setPrivacyMode(!privacyMode)}
            data-testid="button-toggle-privacy"
          >
            {privacyMode ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
            data-testid="button-camera-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
