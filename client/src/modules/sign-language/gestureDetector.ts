import { GestureRecognizer, FilesetResolver, GestureRecognizerResult } from "@mediapipe/tasks-vision";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface DetectedGesture {
  categoryName: string;
  score: number;
  handedness: string; // "Left" or "Right"
}

export class GestureDetector {
  private gestureRecognizer: GestureRecognizer | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitialized = true;
      console.log("✅ MediaPipe Gesture Detector initialized");
    } catch (error) {
      console.error("Failed to initialize gesture detector:", error);
      throw error;
    }
  }

  async detectGesture(video: HTMLVideoElement): Promise<GestureRecognizerResult | null> {
    if (!this.gestureRecognizer || !this.isInitialized) {
      throw new Error("Gesture detector not initialized. Call initialize() first.");
    }

    try {
      const timestamp = performance.now();
      const results = this.gestureRecognizer.recognizeForVideo(video, timestamp);
      return results;
    } catch (error) {
      return null;
    }
  }

  getDetectedGestures(results: GestureRecognizerResult): DetectedGesture[] {
    if (!results.gestures || results.gestures.length === 0) {
      return [];
    }

    const detectedGestures: DetectedGesture[] = [];

    results.gestures.forEach((gestureList, handIndex) => {
      if (gestureList.length > 0) {
        const topGesture = gestureList[0];
        const handedness = results.handedness && results.handedness[handIndex]
          ? results.handedness[handIndex][0].categoryName
          : "Unknown";

        detectedGestures.push({
          categoryName: topGesture.categoryName,
          score: topGesture.score,
          handedness
        });
      }
    });

    return detectedGestures;
  }

  drawLandmarks(
    ctx: CanvasRenderingContext2D,
    results: GestureRecognizerResult
  ): void {
    if (!results.landmarks || results.landmarks.length === 0) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw each hand's landmarks
    results.landmarks.forEach((hand, handIndex) => {
      const color = handIndex === 0 ? "rgba(10, 132, 255, 0.85)" : "rgba(255, 69, 58, 0.85)";
      
      // Draw landmarks as circles
      hand.forEach((landmark, i) => {
        const x = landmark.x * width;
        const y = landmark.y * height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw connections between landmarks
      this.drawHandConnections(ctx, hand, width, height, color);
    });
  }

  private drawHandConnections(
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    width: number,
    height: number,
    color: string
  ): void {
    // MediaPipe hand connections
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });
  }

  close(): void {
    if (this.gestureRecognizer) {
      this.gestureRecognizer.close();
      this.gestureRecognizer = null;
      this.isInitialized = false;
      console.log("✅ Gesture Detector closed");
    }
  }
}
