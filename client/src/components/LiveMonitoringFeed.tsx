import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Mic, MicOff, Settings, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { DetectorService, DetectorState, DetectorEvent, FallAlert } from "@/modules/fall-detection";
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface LiveMonitoringFeedProps {
  parentId?: string;
  onFallDetected?: (alert: FallAlert) => void;
  onCountdownComplete?: (alert: FallAlert, hospital: any, etaMinutes: number) => void;
  mode?: "skeletal" | "normal";
}

export default function LiveMonitoringFeed({
  parentId,
  onFallDetected,
  onCountdownComplete,
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
  const [currentFallAlert, setCurrentFallAlert] = useState<FallAlert | null>(null);
  const detectorRef = useRef<DetectorService | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const autoDispatchTriggered = useRef(false);
  const navigationTriggered = useRef(false);
  const [transcript, setTranscript] = useState<string>("");
  const recognitionRef = useRef<any>(null);

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
            setCurrentFallAlert(event.data as FallAlert);
            autoDispatchTriggered.current = false;
          }

          if (event.type === "motion_check_update") {
            const timeRemaining = event.data?.timeRemaining;
            // Preserve null when person reappears, otherwise ceil the countdown value
            const countdownValue = timeRemaining === null || timeRemaining === undefined ? null : Math.ceil(timeRemaining);
            
            // Navigate to Dashboard immediately when no movement detected (countdown starts)
            if (countdownValue !== null && countdown === null && !navigationTriggered.current) {
              navigationTriggered.current = true;
              handleImmediateNavigation(event.data?.fallAlert || currentFallAlert);
              return;
            }
            
            // Reset navigation trigger when movement is detected again
            if (countdownValue === null) {
              navigationTriggered.current = false;
            }
            
            setCountdown(countdownValue);
          }

          if (event.type === "alert_triggered") {
            onFallDetected?.(event.data as FallAlert);
            setCountdown(null);
            setFallConfidence(null);
            setCurrentFallAlert(null);
          }

          if (event.type === "false_alarm") {
            setCountdown(null);
            setFallConfidence(null);
            setCurrentFallAlert(null);
            autoDispatchTriggered.current = false;
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
        
        // Start speech recognition if audio is enabled
        if (audioEnabled) {
          startSpeechRecognition();
        }
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
      
      stopSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript.trim()) {
        setTranscript((prev) => {
          const updated = (prev + ' ' + finalTranscript).trim();
          // Keep only last 200 characters for display
          return updated.slice(-200);
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Silently handle no-speech errors
        return;
      }
    };

    recognition.onend = () => {
      if (cameraActive && audioEnabled) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      recognitionRef.current = null;
      setTranscript("");
    }
  };

  const startDetection = () => {
    if (!isInitialized || !detectorRef.current) {
      console.warn("Cannot start detection - detector not ready");
      return;
    }

    // Pass video and canvas references to detector for snapshot capture
    if (videoRef.current && canvasRef.current) {
      detectorRef.current.setVideoCanvas(videoRef.current, canvasRef.current);
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

        // Always draw skeletal overlay when person detected
        if (results && results.landmarks && results.landmarks.length > 0) {
          // First draw video if not in privacy mode
          if (!privacyMode) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          
          // Then draw color-coded skeletal overlay on top
          detectorRef.current.drawLandmarks(ctx, results);
        } else if (!privacyMode) {
          // No person detected, just show video
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error("Error processing frame:", error);
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  };

  const handleImmediateNavigation = async (alert: FallAlert | null) => {
    if (!alert || !parentId) return;

    try {
      // Get destination from fall alert
      const destination = alert.gpsCoordinates || { lat: 12.9716, lng: 77.5946 };

      // Step 1: Create fall event in database
      const fallEventRes = await apiRequest("POST", "/api/fall-events", {
        parentId: parentId,
        type: "fall",
        timestamp: alert.timestamp,
        confidence: alert.confidence,
        location: alert.location || "Unknown location",
        gpsCoordinates: destination,
        keypointMetrics: alert.keypointMetrics || {},
        motionWindow: alert.motionWindow || {},
        snapshot: alert.snapshot || null,
        audioClip: null,
        speechTranscript: null,
        status: "pending",
      });
      const fallEvent = await fallEventRes.json();

      // Step 2: Find nearest hospital using Haversine formula
      const hospitalsRes = await apiRequest(
        "GET", 
        `/api/hospitals/nearest?lat=${destination.lat}&lng=${destination.lng}&limit=1`
      );
      const hospitals = await hospitalsRes.json();
      
      if (!hospitals || hospitals.length === 0) {
        toast({
          title: "Error",
          description: "No hospitals found nearby",
          variant: "destructive",
        });
        return;
      }

      const hospital = hospitals[0];

      // Calculate ETA (hospital.distance is in km, average ambulance speed ~40 km/h)
      const etaMinutes = Math.round((hospital.distance / 40) * 60);

      // Store emergency data with the created fall event ID
      const emergencyData = {
        fallAlert: alert,
        fallEventId: fallEvent.id,
        hospital,
        etaMinutes,
        confidence: alert.confidence,
        destination,
        showCountdown: true,
      };
      sessionStorage.setItem('emergencyDispatch', JSON.stringify(emergencyData));
      navigate("/");
    } catch (error: any) {
      console.error("Failed to prepare emergency navigation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare emergency dispatch",
        variant: "destructive",
      });
    }
  };

  const handleShowConfirmation = async (alert: FallAlert | null) => {
    if (!alert || !onCountdownComplete) return;

    try {
      // Get destination from fall alert
      const destination = alert.gpsCoordinates || { lat: 12.9716, lng: 77.5946 };

      // Find nearest hospital using Haversine formula
      const hospitalsRes = await apiRequest(
        "GET", 
        `/api/hospitals/nearest?lat=${destination.lat}&lng=${destination.lng}&limit=1`
      );
      const hospitals = await hospitalsRes.json();
      
      if (!hospitals || hospitals.length === 0) {
        toast({
          title: "Error",
          description: "No hospitals found nearby",
          variant: "destructive",
        });
        return;
      }

      const hospital = hospitals[0];

      // Calculate ETA (hospital.distance is in km, average ambulance speed ~40 km/h)
      const etaMinutes = Math.round((hospital.distance / 40) * 60);

      // Reset states
      setCountdown(null);
      setFallConfidence(null);
      setCurrentFallAlert(null);

      // Trigger parent callback to show dialog
      onCountdownComplete(alert, hospital, etaMinutes);
    } catch (error: any) {
      console.error("Failed to prepare confirmation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare emergency dispatch",
        variant: "destructive",
      });
    }
  };

  const getMonitoringStatus = () => {
    // When monitoring and body detected, show "Monitoring"
    // When no body detected (idle or motion_check without body), show "No movement found"
    if (detectorState === "monitoring") {
      return "Monitoring";
    } else if (detectorState === "idle") {
      return "No movement found";
    } else if (detectorState === "motion_check") {
      return "No movement found";
    } else if (detectorState === "fall_detected") {
      return `Fall Detected - ${Math.round((fallConfidence || 0.92) * 100)}%`;
    } else if (detectorState === "alert_triggered") {
      return "Alert Triggered";
    }
    return "Idle";
  };

  const getStateBadge = () => {
    const status = getMonitoringStatus();
    
    // Check for countdown first (no detection or motion check)
    if (countdown !== null && countdown >= 0) {
      return (
        <Badge className="bg-black/80 text-base px-4 py-2 border border-destructive">
          <span className="h-2 w-2 rounded-full bg-destructive mr-2 animate-pulse" />
          <div className="flex items-center gap-3">
            <span className="text-destructive font-bold text-2xl tabular-nums">{Math.ceil(countdown)}</span>
            <span className="text-destructive">No movement found.</span>
          </div>
        </Badge>
      );
    }

    switch (detectorState) {
      case "monitoring":
        return (
          <Badge className="bg-medical-stable text-white text-base px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
            {status}
          </Badge>
        );
      case "fall_detected":
        return (
          <Badge className="bg-medical-warning text-white text-base px-4 py-2">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      case "motion_check":
        return (
          <Badge className="bg-black/80 text-base px-4 py-2 border border-destructive">
            <span className="h-2 w-2 rounded-full bg-destructive mr-2 animate-pulse" />
            <div className="flex items-center gap-3">
              <span className="text-destructive font-bold text-2xl tabular-nums">{Math.ceil(countdown || 0)}</span>
              <span className="text-destructive">No movement found.</span>
            </div>
          </Badge>
        );
      case "alert_triggered":
        return (
          <Badge className="bg-medical-critical text-white text-base px-4 py-2">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
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
              onClick={() => {
                const newState = !audioEnabled;
                setAudioEnabled(newState);
                if (newState && cameraActive) {
                  startSpeechRecognition();
                } else {
                  stopSpeechRecognition();
                }
              }}
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

        {/* Live Transcription Display */}
        {cameraActive && audioEnabled && transcript && (
          <div className="absolute bottom-16 left-0 right-0 px-4" data-testid="div-transcript">
            <div className="bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg mx-auto max-w-3xl">
              <p className="text-white text-sm md:text-base leading-relaxed text-center">
                {transcript}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
