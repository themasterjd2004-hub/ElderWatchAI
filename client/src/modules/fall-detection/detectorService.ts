import { PoseDetector, PoseLandmark } from "./poseDetector";
import { FallHeuristics, FallAnalysis } from "./fallHeuristics";
import { MotionMonitor, MotionCheckResult } from "./motionMonitor";
import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export type DetectorState = "idle" | "monitoring" | "fall_detected" | "motion_check" | "alert_triggered";

export interface DetectorEvent {
  type: "state_change" | "fall_detected" | "motion_check_update" | "alert_triggered" | "false_alarm";
  state: DetectorState;
  data?: any;
}

export interface FallAlert {
  timestamp: Date;
  confidence: number;
  type: "fall";
  location?: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  vitals?: {
    heartRate?: number;
    breathing?: number;
    motion?: string;
  };
  keypointMetrics: {
    verticalVelocity: number;
    bodyAngle: number;
    aspectRatio: number;
    headToHipDistance: number;
  };
  motionWindow: {
    startTime: string;
    endTime: string;
    movementDetected: boolean;
    avgMovement: number;
  };
  snapshot?: string; // Base64 encoded image of skeletal overlay at fall moment
}

export class DetectorService {
  private poseDetector: PoseDetector;
  private fallHeuristics: FallHeuristics;
  private motionMonitor: MotionMonitor;
  private state: DetectorState = "idle";
  private listeners: ((event: DetectorEvent) => void)[] = [];
  private previousLandmarks: PoseLandmark[] | null = null;
  private fallAnalysis: FallAnalysis | null = null;
  private consecutiveFallFrames = 0;
  private readonly FALL_FRAME_THRESHOLD = 3; // Require 3 consecutive frames to confirm fall
  private currentCanvas: HTMLCanvasElement | null = null;
  private currentVideo: HTMLVideoElement | null = null;
  private noDetectionStartTime: number | null = null;
  private readonly NO_DETECTION_TIMEOUT = 10000; // 10 seconds
  private noDetectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.poseDetector = new PoseDetector();
    this.fallHeuristics = new FallHeuristics();
    this.motionMonitor = new MotionMonitor();
  }

  setVideoCanvas(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    this.currentVideo = video;
    this.currentCanvas = canvas;
  }

  async initialize(): Promise<void> {
    await this.poseDetector.initialize();
    this.setState("monitoring");
  }

  async processFrame(video: HTMLVideoElement): Promise<PoseLandmarkerResult | null> {
    const results = await this.poseDetector.detectPose(video);

    if (!results || !results.landmarks || results.landmarks.length === 0) {
      // No person detected - start countdown if not already started
      this.handleNoDetection();
      return null;
    }

    // Person detected - stop countdown if running
    this.stopNoDetectionCountdown();

    const landmarks = results.landmarks[0];

    // State machine
    switch (this.state) {
      case "monitoring":
        this.handleMonitoringState(landmarks);
        break;

      case "fall_detected":
        // Wait for motion monitor to start
        break;

      case "motion_check":
        this.handleMotionCheckState(landmarks);
        break;

      default:
        break;
    }

    this.previousLandmarks = landmarks;
    return results;
  }

  private handleMonitoringState(landmarks: PoseLandmark[]): void {
    // Analyze for fall
    const analysis = this.fallHeuristics.analyzeFall(landmarks, this.previousLandmarks);

    if (analysis.isFall) {
      this.consecutiveFallFrames++;

      if (this.consecutiveFallFrames >= this.FALL_FRAME_THRESHOLD) {
        this.fallAnalysis = analysis;
        this.setState("fall_detected");
        this.emit({
          type: "fall_detected",
          state: this.state,
          data: analysis,
        });

        // Start 10-second motion monitoring
        this.motionMonitor.startMonitoring(landmarks);
        this.setState("motion_check");
      }
    } else {
      this.consecutiveFallFrames = Math.max(0, this.consecutiveFallFrames - 1);
    }
  }

  private handleMotionCheckState(landmarks: PoseLandmark[]): void {
    const motionResult = this.motionMonitor.checkMotion(landmarks);

    this.emit({
      type: "motion_check_update",
      state: this.state,
      data: motionResult,
    });

    if (motionResult.isComplete) {
      if (motionResult.shouldTriggerAlert) {
        this.triggerAlert(motionResult);
      } else {
        this.handleFalseAlarm();
      }
    }
  }

  private async triggerAlert(motionResult: MotionCheckResult): Promise<void> {
    this.setState("alert_triggered");

    // Capture snapshot of skeletal overlay
    const snapshot = this.captureSnapshot();

    // Attempt to get GPS coordinates
    const gpsCoordinates = await this.captureGPSLocation();

    const alert: FallAlert = {
      timestamp: new Date(),
      confidence: this.fallAnalysis?.confidence || 0,
      type: "fall",
      keypointMetrics: this.fallAnalysis?.metrics || {
        verticalVelocity: 0,
        bodyAngle: 0,
        aspectRatio: 0,
        headToHipDistance: 0,
      },
      motionWindow: {
        startTime: new Date(Date.now() - 10000).toISOString(),
        endTime: new Date().toISOString(),
        movementDetected: motionResult.movementDetected,
        avgMovement: motionResult.avgMovement,
      },
      snapshot,
      gpsCoordinates,
    };

    this.emit({
      type: "alert_triggered",
      state: this.state,
      data: alert,
    });

    console.log("FALL ALERT TRIGGERED with snapshot and GPS:", {
      ...alert,
      snapshot: snapshot ? "Captured" : "Not available",
    });

    // Reset to monitoring after a delay
    setTimeout(() => {
      this.reset();
    }, 5000);
  }

  private captureSnapshot(): string | undefined {
    if (!this.currentCanvas) {
      console.warn("Cannot capture snapshot - canvas not set");
      return undefined;
    }

    try {
      // Capture current canvas as base64 image (skeletal overlay)
      const dataUrl = this.currentCanvas.toDataURL("image/png");
      console.log("Snapshot captured:", dataUrl.substring(0, 50) + "...");
      return dataUrl;
    } catch (error) {
      console.error("Failed to capture snapshot:", error);
      return undefined;
    }
  }

  private async captureGPSLocation(): Promise<{ lat: number; lng: number; accuracy?: number } | undefined> {
    if (!("geolocation" in navigator)) {
      console.log("GPS not available in this browser");
      return undefined;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          console.log("GPS coordinates captured:", coords);
          resolve(coords);
        },
        (error) => {
          console.warn("Could not get GPS location:", error.message);
          resolve(undefined);
        },
        {
          timeout: 3000, // 3 second timeout
          enableHighAccuracy: true,
        }
      );
    });
  }

  private handleFalseAlarm(): void {
    console.log("False alarm - movement detected during motion check");
    
    this.emit({
      type: "false_alarm",
      state: "monitoring",
      data: { reason: "Movement detected during 10-second check" },
    });

    this.reset();
  }

  private setState(newState: DetectorState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit({
        type: "state_change",
        state: newState,
      });
    }
  }

  on(listener: (event: DetectorEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: DetectorEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  drawLandmarks(canvasCtx: CanvasRenderingContext2D, results: PoseLandmarkerResult): void {
    if (results && results.landmarks && results.landmarks.length > 0) {
      this.poseDetector.drawLandmarks(canvasCtx, results);
    }
  }

  reset(): void {
    this.consecutiveFallFrames = 0;
    this.fallAnalysis = null;
    this.previousLandmarks = null;
    this.fallHeuristics.reset();
    this.motionMonitor.reset();
    this.setState("monitoring");
  }

  getState(): DetectorState {
    return this.state;
  }

  getMotionTimeRemaining(): number {
    return this.motionMonitor.getTimeRemaining();
  }

  private handleNoDetection(): void {
    if (this.noDetectionStartTime === null) {
      // Start the countdown
      this.noDetectionStartTime = Date.now();
      this.startNoDetectionCountdown();
    }
  }

  private startNoDetectionCountdown(): void {
    if (this.noDetectionInterval) {
      return; // Already running
    }

    this.noDetectionInterval = setInterval(() => {
      if (this.noDetectionStartTime === null) {
        this.stopNoDetectionCountdown();
        return;
      }

      const elapsed = Date.now() - this.noDetectionStartTime;
      const remaining = Math.max(0, this.NO_DETECTION_TIMEOUT - elapsed);
      const timeRemaining = Math.ceil(remaining / 1000);

      this.emit({
        type: "motion_check_update",
        state: this.state,
        data: {
          timeRemaining,
          isComplete: remaining === 0,
          shouldTriggerAlert: remaining === 0,
        },
      });

      if (remaining === 0) {
        this.stopNoDetectionCountdown();
        this.triggerNoDetectionAlert();
      }
    }, 100);
  }

  private stopNoDetectionCountdown(): void {
    if (this.noDetectionInterval) {
      clearInterval(this.noDetectionInterval);
      this.noDetectionInterval = null;
    }
    if (this.noDetectionStartTime !== null) {
      this.noDetectionStartTime = null;
      // Emit update to show monitoring state
      this.emit({
        type: "motion_check_update",
        state: this.state,
        data: {
          timeRemaining: null,
          isComplete: false,
          shouldTriggerAlert: false,
        },
      });
    }
  }

  private async triggerNoDetectionAlert(): Promise<void> {
    const gpsCoordinates = await this.captureGPSLocation();

    const alert: FallAlert = {
      timestamp: new Date(),
      confidence: 0.95,
      type: "fall",
      keypointMetrics: {
        verticalVelocity: 0,
        bodyAngle: 0,
        aspectRatio: 0,
        headToHipDistance: 0,
      },
      motionWindow: {
        startTime: new Date(Date.now() - 10000).toISOString(),
        endTime: new Date().toISOString(),
        movementDetected: false,
        avgMovement: 0,
      },
      gpsCoordinates,
    };

    this.emit({
      type: "motion_check_update",
      state: this.state,
      data: {
        timeRemaining: 0,
        isComplete: true,
        shouldTriggerAlert: true,
        fallAlert: alert,
      },
    });
  }

  destroy(): void {
    this.stopNoDetectionCountdown();
    this.poseDetector.destroy();
    this.listeners = [];
  }
}
