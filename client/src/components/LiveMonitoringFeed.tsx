import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Mic, MicOff, Settings, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { DetectorService, DetectorState, DetectorEvent, FallAlert } from "@/modules/fall-detection";
import { PoseLandmarker } from "@mediapipe/tasks-vision";

interface LiveMonitoringFeedProps {
  parentId?: string;
  onFallDetected?: (alert: FallAlert) => void;
  mode?: "skeletal" | "normal";
}

export default function LiveMonitoringFeed({
  parentId,
  onFallDetected,
  mode = "skeletal",
}: LiveMonitoringFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(mode === "skeletal");
  const [detectorState, setDetectorState] = useState<DetectorState>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fallConfidence, setFallConfidence] = useState<number | null>(null);
  const detectorRef = useRef<DetectorService | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let detector: DetectorService | null = null;

    const initializeDetector = async () => {
      try {
        detector = new DetectorService();
        detectorRef.current = detector;

        // Subscribe to detector events
        detector.on((event: DetectorEvent) => {
          console.log("Detector event:", event);

          if (event.type === "state_change") {
            setDetectorState(event.state);
          }

          if (event.type === "fall_detected") {
            setFallConfidence(event.data?.confidence || 0);
          }

          if (event.type === "motion_check_update") {
            setCountdown(Math.ceil(event.data?.timeRemaining || 0));
          }

          if (event.type === "alert_triggered") {
            onFallDetected?.(event.data as FallAlert);
            setCountdown(null);
            setFallConfidence(null);
          }

          if (event.type === "false_alarm") {
            setCountdown(null);
            setFallConfidence(null);
          }
        });

        await detector.initialize();
        setIsInitialized(true);
        setInitError(null);
      } catch (error) {
        console.error("Failed to initialize detector:", error);
        setInitError("MediaPipe requires WebGL 2.0. Please use a modern browser with GPU acceleration.");
        setIsInitialized(false);
      }
    };

    initializeDetector();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (detector) {
        detector.destroy();
      }
    };
  }, [onFallDetected]);

  const startCamera = async () => {
    if (!isInitialized) {
      console.warn("Cannot start camera - detector not initialized yet");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startDetection();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please grant camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const startDetection = () => {
    if (!isInitialized || !detectorRef.current) {
      console.warn("Cannot start detection - detector not ready");
      return;
    }

    const detectFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !detectorRef.current || !isInitialized) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Process frame
      try {
        const results = await detectorRef.current.processFrame(video);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw skeletal overlay
        if (privacyMode && results) {
          detectorRef.current.drawLandmarks(ctx, results);
        } else if (!privacyMode) {
          // Show video feed
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error("Error processing frame:", error);
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  };

  const getStateBadge = () => {
    switch (detectorState) {
      case "monitoring":
        return (
          <Badge className="bg-medical-stable text-white">
            <span className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
            Monitoring
          </Badge>
        );
      case "fall_detected":
        return (
          <Badge className="bg-medical-warning text-white">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Fall Detected - {fallConfidence}%
          </Badge>
        );
      case "motion_check":
        return (
          <Badge className="bg-medical-critical text-white">
            <span className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
            Motion Check: {countdown}s
          </Badge>
        );
      case "alert_triggered":
        return (
          <Badge className="bg-medical-critical text-white">
            🚨 Alert Triggered
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Idle
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden" data-testid="card-monitoring-feed">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: privacyMode || !cameraActive ? "none" : "block" }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: cameraActive ? "block" : "none" }}
        />

        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <Camera className="h-16 w-16 text-white/60 mx-auto mb-4" />
              {initError ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{initError}</p>
                  <p className="text-xs text-muted-foreground">
                    Tip: Use Chrome, Edge, or Firefox with hardware acceleration enabled
                  </p>
                </div>
              ) : (
                <Button
                  onClick={startCamera}
                  variant="secondary"
                  className="bg-primary text-primary-foreground"
                  disabled={!isInitialized}
                  data-testid="button-start-camera"
                >
                  {isInitialized ? "Start Monitoring" : "Initializing AI..."}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {cameraActive && getStateBadge()}
          <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
            {new Date().toLocaleTimeString()}
          </Badge>
          {privacyMode && cameraActive && (
            <Badge className="bg-primary text-primary-foreground">
              <Eye className="h-3 w-3 mr-1" />
              Skeletal Mode
            </Badge>
          )}
        </div>

        {cameraActive && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 text-white border-white/20"
              onClick={() => setAudioEnabled(!audioEnabled)}
              data-testid="button-toggle-audio"
            >
              {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 text-white border-white/20"
              onClick={() => setPrivacyMode(!privacyMode)}
              data-testid="button-toggle-privacy"
            >
              {privacyMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 text-white border-white/20"
              onClick={stopCamera}
              data-testid="button-stop-camera"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
