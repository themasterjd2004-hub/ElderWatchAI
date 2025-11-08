import { PoseLandmarker, FilesetResolver, DrawingUtils, PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized = false;
  private lastVideoTime = -1;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitialized = true;
      console.log("✅ MediaPipe Pose Detector initialized");
    } catch (error) {
      console.error("Failed to initialize pose detector:", error);
      throw error;
    }
  }

  async detectPose(video: HTMLVideoElement): Promise<PoseLandmarkerResult | null> {
    if (!this.poseLandmarker || !this.isInitialized) {
      throw new Error("Pose detector not initialized. Call initialize() first.");
    }

    // Skip if same video frame
    if (this.lastVideoTime === video.currentTime) {
      return null;
    }

    this.lastVideoTime = video.currentTime;

    try {
      const nowInMs = Date.now();
      const results = await this.poseLandmarker.detectForVideo(video, nowInMs);
      return results;
    } catch (error) {
      console.error("Error detecting pose:", error);
      return null;
    }
  }

  drawLandmarks(
    canvasCtx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    connections: any
  ): void {
    const drawingUtils = new DrawingUtils(canvasCtx);
    // Convert landmarks to expected format with visibility
    const normalizedLandmarks = landmarks.map(lm => ({
      ...lm,
      visibility: lm.visibility ?? 1.0
    }));
    
    drawingUtils.drawLandmarks(normalizedLandmarks, {
      radius: 3,
      color: "#00FF00",
      fillColor: "#FFFFFF",
    });
    drawingUtils.drawConnectors(normalizedLandmarks, connections, {
      color: "#00FF00",
      lineWidth: 2,
    });
  }

  destroy(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isInitialized = false;
  }
}
