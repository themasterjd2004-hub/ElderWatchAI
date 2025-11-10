import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Mic, MicOff, Settings, Eye, EyeOff, AlertTriangle, Hand } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { DetectorService, DetectorState, DetectorEvent, FallAlert } from "@/modules/fall-detection";
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { SignLanguageOverlay } from "./SignLanguageOverlay";
import { DistressDetector } from "@/modules/distress-detection/distressDetector";
import { formatCategory, getSeverityVariant } from "@/modules/distress-detection/distressKeywords";
import { ActivityPatternAnalyzer } from "@/modules/movement-analysis/activityPatternAnalyzer";

interface LiveMonitoringFeedProps {
  parentId?: string;
  cameraId?: string;
  cameraLabel?: string;
  deviceId?: string | null;
  isPrimary?: boolean;
  onFallDetected?: (alert: FallAlert) => void;
  onCountdownComplete?: (alert: FallAlert, hospital: any, etaMinutes: number) => void;
  mode?: "skeletal" | "normal";
}

export default function LiveMonitoringFeed({
  parentId,
  cameraId,
  cameraLabel,
  deviceId = null,
  isPrimary = false,
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
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en-US");
  const [signLanguageEnabled, setSignLanguageEnabled] = useState(false);
  const [signLanguageActive, setSignLanguageActive] = useState(false); // Tracks if sign detector is actually running
  const distressDetectorRef = useRef<DistressDetector>(new DistressDetector());
  const activityAnalyzerRef = useRef<ActivityPatternAnalyzer>(new ActivityPatternAnalyzer());
  const [availableLanguages] = useState([
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "hi-IN", name: "Hindi" },
    { code: "kn-IN", name: "Kannada" },
    { code: "ta-IN", name: "Tamil" },
    { code: "te-IN", name: "Telugu" },
    { code: "ml-IN", name: "Malayalam" },
    { code: "mr-IN", name: "Marathi" },
    { code: "bn-IN", name: "Bengali" },
    { code: "es-ES", name: "Spanish" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "zh-CN", name: "Chinese (Mandarin)" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ar-SA", name: "Arabic" },
  ]);

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

        // Subscribe to activity pattern alerts
        activityAnalyzerRef.current?.onActivityAlert((alert) => {
          const { result, shouldNotifyFamily, shouldLog } = alert;
          
          // Show toast notification for abnormal patterns
          const title = `${result.severity.toUpperCase()} - ${result.patternType.replace('_', ' ').toUpperCase()}`;
          
          toast({
            variant: result.severity === 'critical' || result.severity === 'high' ? 'destructive' : 'default',
            title,
            description: result.description,
            duration: result.severity === 'critical' ? 10000 : 8000,
          });
          
          console.warn('[ACTIVITY PATTERN DETECTED]', {
            pattern: result.patternType,
            severity: result.severity,
            confidence: result.confidence,
            metadata: result.metadata,
            shouldNotifyFamily,
            shouldLog,
          });
          
          // TODO: Implement emergency response based on severity
          // Critical patterns might trigger auto-dispatch in the future
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
      // Build video constraints with device selection if available
      const videoConstraints: MediaTrackConstraints = {
        width: 640,
        height: 480,
      };

      // Try to use specific deviceId if provided
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
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
      console.error(`Error accessing camera${deviceId ? ` (device: ${deviceId})` : ""}:`, error);
      
      // Only show fallback if we actually failed to get a specific device
      // (deviceId was explicitly set and failed)
      if (deviceId) {
        console.log("Specific device failed, retrying with default camera...");
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
            
            if (audioEnabled) {
              startSpeechRecognition();
            }
            
            toast({
              title: "Using Default Camera",
              description: `Could not access ${cameraLabel || "selected camera"}. Using default camera instead.`,
            });
          }
        } catch (fallbackError) {
          console.error("Fallback camera access failed:", fallbackError);
          alert("Unable to access camera. Please grant camera permissions.");
        }
      } else {
        // No deviceId specified, this is a genuine camera access error
        alert("Unable to access camera. Please grant camera permissions.");
      }
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

  const detectLanguageFromText = (text: string): string | null => {
    const trimmed = text.trim();
    
    // Devanagari script (Hindi, Marathi)
    if (/[\u0900-\u097F]/.test(trimmed)) return 'hi-IN';
    // Kannada script
    if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn-IN';
    // Tamil script
    if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta-IN';
    // Telugu script
    if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te-IN';
    // Malayalam script
    if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml-IN';
    // Bengali script
    if (/[\u0980-\u09FF]/.test(trimmed)) return 'bn-IN';
    // Arabic script
    if (/[\u0600-\u06FF]/.test(trimmed)) return 'ar-SA';
    // Chinese characters
    if (/[\u4E00-\u9FFF]/.test(trimmed)) return 'zh-CN';
    // Japanese (Hiragana/Katakana)
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) return 'ja-JP';
    
    return null; // Keep current language
  };

  const stopAndRestartWithLanguage = (lang: string) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    // Restart with new language
    setTimeout(() => {
      if (cameraActive && audioEnabled) {
        startSpeechRecognition();
      }
    }, 500);
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
    recognition.lang = detectedLanguage;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        // Detect language from final transcripts
        if (result.isFinal && result.length > 0) {
          for (let j = 0; j < Math.min(result.length, 3); j++) {
            const alternative = result[j];
            if (alternative.transcript.trim()) {
              const lang = detectLanguageFromText(alternative.transcript);
              if (lang && lang !== detectedLanguage) {
                setDetectedLanguage(lang);
                stopAndRestartWithLanguage(lang);
                return;
              }
            }
          }
        }

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript.trim()) {
        // ANALYZE FOR DISTRESS KEYWORDS
        const distressResult = distressDetectorRef.current?.analyze(finalTranscript);
        if (distressResult?.detected && distressResult.keyword) {
          const severity = distressResult.keyword.severity;
          const category = formatCategory(distressResult.keyword.category);
          
          toast({
            variant: getSeverityVariant(severity),
            title: `${severity === 'critical' ? 'CRITICAL ALERT' : severity === 'high' ? 'URGENT ALERT' : 'ATTENTION NEEDED'}`,
            description: `Voice distress detected: "${distressResult.matchedText}" - ${category}`,
            duration: severity === 'critical' ? 10000 : 8000,
          });

          // Log distress detection for monitoring
          console.warn('[DISTRESS DETECTED]', {
            text: finalTranscript,
            keyword: distressResult.keyword.phrase,
            severity: severity,
            category: category,
            language: distressResult.keyword.language,
            timestamp: distressResult.timestamp,
          });
          
          // TODO: Trigger appropriate emergency response based on severity
          // Critical -> Auto-dispatch ambulance
          // High -> Alert family members
          // Medium -> Log for review
        }
        
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
        return; // Silently handle no-speech errors
      }
      if (event.error === 'language-not-supported') {
        console.warn(`Language ${detectedLanguage} not supported, falling back to en-US`);
        setDetectedLanguage('en-US');
        stopAndRestartWithLanguage('en-US');
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
          
          // ANALYZE FOR ABNORMAL MOVEMENT PATTERNS (stumbling, freezing, etc.)
          if (activityAnalyzerRef.current) {
            const patterns = activityAnalyzerRef.current.analyzeFrame(results.landmarks[0]);
            // Patterns are handled via callbacks registered in initialization
          }
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

      // Step 1: Create fall event in database (include camera info)
      const fallEventRes = await apiRequest("POST", "/api/fall-events", {
        parentId: parentId,
        type: "fall",
        timestamp: alert.timestamp,
        confidence: alert.confidence,
        location: cameraLabel || alert.location || "Unknown location",
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
          {cameraLabel && (
            <Badge variant="outline" className="bg-black/70 text-white border-white/30">
              <Camera className="h-3 w-3 mr-1" />
              {cameraLabel}
              {isPrimary && <span className="ml-1 text-xs">★</span>}
            </Badge>
          )}
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

        {/* Control Buttons - Vertical Stack on Right Side */}
        {cameraActive && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
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
              className={`${signLanguageEnabled ? "bg-primary text-primary-foreground border-primary" : "bg-black/50 text-white border-white/20"} hover:bg-black/70`}
              onClick={() => setSignLanguageEnabled(!signLanguageEnabled)}
              data-testid="button-toggle-sign-language"
              title="Toggle Sign Language Detection"
            >
              <Hand className="h-4 w-4" />
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

        {/* Live Transcription Display - Small Scrollable Box at Bottom */}
        {cameraActive && audioEnabled && transcript && !signLanguageEnabled && (
          <div className="absolute bottom-4 right-4 w-80" data-testid="div-transcript">
            <div className="bg-black/90 backdrop-blur-md rounded-md border border-white/20">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                <span className="text-xs text-white/70 font-medium">Live Transcription</span>
                <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-primary/40 text-xs px-2 py-0.5">
                  {availableLanguages.find(l => l.code === detectedLanguage)?.name || detectedLanguage}
                </Badge>
              </div>
              <div className="px-3 py-2 max-h-24 overflow-y-auto">
                <p className="text-white text-xs leading-relaxed">
                  {transcript}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign Language Detection Overlay */}
        <SignLanguageOverlay
          videoElement={videoRef.current}
          canvasElement={canvasRef.current}
          isActive={cameraActive && signLanguageEnabled}
        />
      </div>
    </Card>
  );
}
