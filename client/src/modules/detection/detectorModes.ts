import { DetectorService, FallAlert } from "@/modules/fall-detection";
import { GestureDetector } from "@/modules/sign-language/gestureDetector";
import { formatGestureForDisplay } from "@/modules/sign-language/signVocabulary";
import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export type DetectorMode = "fall_detection" | "sign_language";

export interface TranscriptEntry {
  timestamp: number;
  source: "speech" | "sign";
  content: string;
  metadata?: {
    handedness?: string;
    confidence?: number;
    language?: string;
  };
}

export interface DetectorStrategy {
  initialize(): Promise<void>;
  processFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<TranscriptEntry | null>;
  drawOverlay(canvas: HTMLCanvasElement, results: any): void;
  tearDown(): void;
  getStatus(): string;
}

export class FallDetectionStrategy implements DetectorStrategy {
  private detector: DetectorService | null = null;
  private onFallDetected?: (alert: FallAlert) => void;

  constructor(onFallDetected?: (alert: FallAlert) => void) {
    this.onFallDetected = onFallDetected;
  }

  async initialize(): Promise<void> {
    this.detector = new DetectorService();
    
    // Subscribe to fall events
    this.detector.on((event) => {
      if (event.type === "fall_detected" && this.onFallDetected) {
        this.onFallDetected(event.data as FallAlert);
      }
    });
  }

  async processFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<TranscriptEntry | null> {
    if (!this.detector) return null;

    await this.detector.processFrame(video, canvas);
    
    // Fall detection doesn't produce transcript entries
    // (handled separately via fall alerts)
    return null;
  }

  drawOverlay(canvas: HTMLCanvasElement, results: PoseLandmarkerResult): void {
    if (!this.detector) return;
    // Drawing is handled internally by DetectorService
  }

  tearDown(): void {
    if (this.detector) {
      this.detector.cleanup();
      this.detector = null;
    }
  }

  getStatus(): string {
    return this.detector?.getState() || "idle";
  }
}

export class SignLanguageStrategy implements DetectorStrategy {
  private detector: GestureDetector | null = null;
  private lastDetectedSign: string | null = null;
  private detectionBuffer: string[] = [];
  private readonly BUFFER_SIZE = 5; // Smooth detection over 5 frames
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  async initialize(): Promise<void> {
    this.detector = new GestureDetector();
    await this.detector.initialize();
  }

  async processFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<TranscriptEntry | null> {
    if (!this.detector) return null;

    const results = await this.detector.detectGesture(video);
    
    if (!results || !results.gestures || results.gestures.length === 0) {
      return null;
    }

    // Draw hand landmarks on canvas
    const ctx = canvas.getContext("2d");
    if (ctx && results.landmarks) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.detector.drawLandmarks(ctx, results);
    }

    // Get detected gestures
    const detected = this.detector.getDetectedGestures(results);
    
    if (detected.length > 0) {
      const topGesture = detected[0];
      
      // Only process high-confidence gestures
      if (topGesture.score > this.CONFIDENCE_THRESHOLD) {
        this.detectionBuffer.push(topGesture.categoryName);
        
        // Keep buffer size limited
        if (this.detectionBuffer.length > this.BUFFER_SIZE) {
          this.detectionBuffer.shift();
        }
        
        // Get most frequent gesture in buffer (smoothing)
        const mostCommon = this.getMostFrequent(this.detectionBuffer);
        
        // Only emit transcript entry if gesture changed
        if (mostCommon && mostCommon !== this.lastDetectedSign) {
          this.lastDetectedSign = mostCommon;
          
          return {
            timestamp: Date.now(),
            source: "sign",
            content: formatGestureForDisplay(mostCommon, topGesture.handedness),
            metadata: {
              handedness: topGesture.handedness,
              confidence: topGesture.score
            }
          };
        }
      }
    }

    return null;
  }

  private getMostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;
    
    const frequency: Record<string, number> = {};
    arr.forEach(item => {
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
  }

  drawOverlay(canvas: HTMLCanvasElement, results: any): void {
    if (!this.detector) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      this.detector.drawLandmarks(ctx, results);
    }
  }

  tearDown(): void {
    if (this.detector) {
      this.detector.close();
      this.detector = null;
    }
    this.lastDetectedSign = null;
    this.detectionBuffer = [];
  }

  getStatus(): string {
    return this.detector ? "monitoring" : "idle";
  }
}
