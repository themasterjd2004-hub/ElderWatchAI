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

  constructor() {
    this.poseDetector = new PoseDetector();
    this.fallHeuristics = new FallHeuristics();
    this.motionMonitor = new MotionMonitor();
  }

  async initialize(): Promise<void> {
    await this.poseDetector.initialize();
    this.setState("monitoring");
  }

  async processFrame(video: HTMLVideoElement): Promise<PoseLandmarkerResult | null> {
    const results = await this.poseDetector.detectPose(video);

    if (!results || !results.landmarks || results.landmarks.length === 0) {
      return null;
    }

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

  private triggerAlert(motionResult: MotionCheckResult): void {
    this.setState("alert_triggered");

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
    };

    this.emit({
      type: "alert_triggered",
      state: this.state,
      data: alert,
    });

    console.log("🚨 FALL ALERT TRIGGERED:", alert);

    // Reset to monitoring after a delay
    setTimeout(() => {
      this.reset();
    }, 5000);
  }

  private handleFalseAlarm(): void {
    console.log("✅ False alarm - movement detected during motion check");
    
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
    if (results.landmarks && results.landmarks.length > 0) {
      // Import PoseLandmarker for connections
      this.poseDetector.drawLandmarks(
        canvasCtx,
        results.landmarks[0],
        (window as any).MPTasks?.vision?.PoseLandmarker?.POSE_CONNECTIONS
      );
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

  destroy(): void {
    this.poseDetector.destroy();
    this.listeners = [];
  }
}
