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

    try {
      // Use performance.now() for monotonic timestamps
      const timestamp = performance.now();
      const results = this.poseLandmarker.detectForVideo(video, timestamp);
      return results;
    } catch (error) {
      // Silently ignore timestamp errors (they're common when processing frames)
      return null;
    }
  }

  drawLandmarks(
    ctx: CanvasRenderingContext2D,
    results: PoseLandmarkerResult
  ): void {
    if (!results.landmarks || results.landmarks.length === 0) return;

    const landmarks = results.landmarks[0];
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Define color-coded regions for enhanced skeletal visualization
    const colors = {
      upperLimbs: "rgba(255, 69, 58, 0.85)",      // Red for arms, shoulders, neck
      lowerLimbs: "rgba(10, 132, 255, 0.85)",     // Blue for legs, hips
      torsoSpine: "rgba(255, 204, 0, 0.85)",      // Yellow for torso and spine
      face: "rgba(48, 209, 88, 0.85)"             // Green for facial features
    };

    // Define landmark connection groups based on MediaPipe Pose indices
    const upperLimbConnections = [
      [11, 13], [13, 15], // Left arm: shoulder → elbow → wrist
      [12, 14], [14, 16], // Right arm: shoulder → elbow → wrist
      [11, 12] // Shoulder connection
    ];

    const lowerLimbConnections = [
      [23, 25], [25, 27], [27, 29], [27, 31], [29, 31], // Left leg
      [24, 26], [26, 28], [28, 30], [28, 32], [30, 32], // Right leg
      [23, 24] // Hip connection
    ];

    const torsoSpineConnections = [
      [11, 23], [12, 24], // Torso sides (shoulder to hip)
      [11, 12], [23, 24]  // Shoulder and hip bars
    ];

    const faceConnections = [
      [0, 1], [1, 2], [2, 3], [3, 7], // Left face outline
      [0, 4], [4, 5], [5, 6], [6, 8], // Right face outline
      [9, 10] // Mouth area
    ];

    // Helper function to draw connections with color coding
    const drawConnections = (connections: number[][], color: string, lineWidth = 3) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      
      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];

        if (startPoint && endPoint && startPoint.visibility && endPoint.visibility) {
          ctx.beginPath();
          ctx.moveTo(startPoint.x * width, startPoint.y * height);
          ctx.lineTo(endPoint.x * width, endPoint.y * height);
          ctx.stroke();
        }
      });
    };

    // Draw semi-transparent background for humanoid overlay effect
    ctx.globalAlpha = 0.75;

    // Draw color-coded skeletal regions
    drawConnections(torsoSpineConnections, colors.torsoSpine, 5); // Thickest for spine/torso
    drawConnections(upperLimbConnections, colors.upperLimbs, 4);
    drawConnections(lowerLimbConnections, colors.lowerLimbs, 4);
    drawConnections(faceConnections, colors.face, 2); // Thinner for facial features

    // Reset alpha for joint markers
    ctx.globalAlpha = 0.9;

    // Draw landmarks (joints) with color coding and glow effect
    const drawLandmarkPoint = (index: number, color: string, size = 6) => {
      const landmark = landmarks[index];
      if (landmark && landmark.visibility && landmark.visibility > 0.5) {
        // Draw glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        // Draw joint marker
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          landmark.x * width,
          landmark.y * height,
          size,
          0,
          2 * Math.PI
        );
        ctx.fill();
        
        // Add bright center
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(
          landmark.x * width,
          landmark.y * height,
          size * 0.4,
          0,
          2 * Math.PI
        );
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }
    };

    // Draw upper limb joints (red): shoulders, elbows, wrists
    [11, 12, 13, 14, 15, 16].forEach(idx => drawLandmarkPoint(idx, colors.upperLimbs, 6));
    
    // Draw lower limb joints (blue): hips, knees, ankles
    [23, 24, 25, 26, 27, 28].forEach(idx => drawLandmarkPoint(idx, colors.lowerLimbs, 6));
    
    // Draw feet markers (blue, smaller)
    [29, 30, 31, 32].forEach(idx => drawLandmarkPoint(idx, colors.lowerLimbs, 4));
    
    // Draw facial keypoints (green): eyes, nose, mouth
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(idx => drawLandmarkPoint(idx, colors.face, 4));

    // Reset global alpha
    ctx.globalAlpha = 1.0;
  }

  destroy(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isInitialized = false;
  }
}
