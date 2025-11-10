import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hand, Volume2, VolumeX } from "lucide-react";
import { GestureDetector } from "@/modules/sign-language/gestureDetector";
import { formatGestureForDisplay, getSignMeaning } from "@/modules/sign-language/signVocabulary";

interface SignLanguageOverlayProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  isActive: boolean;
  onDetectionChange?: (active: boolean) => void; // Notify parent when detection starts/stops
}

export function SignLanguageOverlay({ videoElement, canvasElement, isActive, onDetectionChange }: SignLanguageOverlayProps) {
  const [currentSign, setCurrentSign] = useState<string>("");
  const [handedness, setHandedness] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const detectorRef = useRef<GestureDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionBuffer = useRef<string[]>([]);
  const lastSpokenSign = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      onDetectionChange?.(false);
      return;
    }

    const initializeDetector = async () => {
      onDetectionChange?.(true); // Notify parent that sign language detection is starting
      detectorRef.current = new GestureDetector();
      await detectorRef.current.initialize();
      startDetection();
    };

    initializeDetector();

    return () => {
      stopDetection();
      if (detectorRef.current) {
        detectorRef.current.close();
        detectorRef.current = null;
      }
      onDetectionChange?.(false); // Notify parent that sign language detection stopped
    };
  }, [isActive, onDetectionChange]);

  const startDetection = () => {
    if (!videoElement || !detectorRef.current) return;

    const processFrame = async () => {
      if (!videoElement || !detectorRef.current || !isActive) return;

      const results = await detectorRef.current.detectGesture(videoElement);

      if (results && results.gestures && results.gestures.length > 0) {
        const detected = detectorRef.current.getDetectedGestures(results);

        if (detected.length > 0) {
          const topGesture = detected[0];

          if (topGesture.score > 0.7) {
            detectionBuffer.current.push(topGesture.categoryName);

            if (detectionBuffer.current.length > 5) {
              detectionBuffer.current.shift();
            }

            const mostCommon = getMostFrequent(detectionBuffer.current);

            if (mostCommon && mostCommon !== currentSign) {
              setCurrentSign(mostCommon);
              setHandedness(topGesture.handedness);
              setConfidence(topGesture.score);

              // Speak the sign meaning
              if (speechEnabled && mostCommon !== lastSpokenSign.current) {
                speakSign(mostCommon);
                lastSpokenSign.current = mostCommon;
              }
            }
          }
        }

        // Draw hand landmarks on overlay canvas if available
        if (canvasElement && results.landmarks) {
          const ctx = canvasElement.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            detectorRef.current.drawLandmarks(ctx, results);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  const stopDetection = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const getMostFrequent = (arr: string[]): string | null => {
    if (arr.length === 0) return null;

    const frequency: Record<string, number> = {};
    arr.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    let maxCount = 0;
    let mostFrequent: string | null = null;

    Object.entries(frequency).forEach(([key, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = key;
      }
    });

    return mostFrequent;
  };

  const speakSign = (gesture: string) => {
    const meaning = getSignMeaning(gesture);
    const utterance = new SpeechSynthesisUtterance(meaning);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  if (!isActive || !currentSign) return null;

  return (
    <div className="absolute bottom-4 left-4 w-96" data-testid="div-sign-language">
      <div className="bg-black/90 backdrop-blur-md rounded-md border-2 border-primary/50">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Hand className="h-4 w-4 text-primary" />
            <span className="text-sm text-white font-medium">Sign Language Detection</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-primary/40 text-xs px-2 py-0.5">
              {Math.round(confidence * 100)}% confidence
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white hover:text-primary"
              onClick={() => setSpeechEnabled(!speechEnabled)}
            >
              {speechEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1">
              {handedness} Hand
            </Badge>
            <p className="text-white text-lg font-medium">
              {formatGestureForDisplay(currentSign, handedness)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
