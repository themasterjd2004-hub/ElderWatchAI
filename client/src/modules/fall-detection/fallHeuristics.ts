import { PoseLandmark } from "./poseDetector";

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

export interface FallAnalysis {
  isFall: boolean;
  confidence: number;
  reason: string[];
  metrics: {
    verticalVelocity: number;
    bodyAngle: number;
    aspectRatio: number;
    headToHipDistance: number;
    verticalPosition: number;
  };
}

export class FallHeuristics {
  private previousNoseY: number | null = null;
  private previousTimestamp: number = Date.now();

  analyzeFall(landmarks: PoseLandmark[], previousLandmarks: PoseLandmark[] | null): FallAnalysis {
    const reasons: string[] = [];
    let confidence = 0;

    // Get key landmarks
    const nose = landmarks[POSE_LANDMARKS.NOSE];
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    // Calculate metrics
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;

    // Metric 1: Vertical velocity (sudden drop)
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.previousTimestamp) / 1000; // Convert to seconds
    let verticalVelocity = 0;

    if (this.previousNoseY !== null && deltaTime > 0) {
      verticalVelocity = (nose.y - this.previousNoseY) / deltaTime;
      
      // Downward motion threshold (normalized coordinates per second)
      if (verticalVelocity > 0.5) {
        reasons.push("Rapid downward motion detected");
        confidence += 30;
      }
    }

    this.previousNoseY = nose.y;
    this.previousTimestamp = currentTime;

    // Metric 2: Body angle (horizontal orientation)
    const bodyAngle = this.calculateBodyAngle(leftShoulder, rightShoulder, leftHip, rightHip);
    
    if (Math.abs(bodyAngle) < 30 || Math.abs(bodyAngle) > 150) {
      reasons.push("Body in horizontal orientation");
      confidence += 25;
    }

    // Metric 3: Aspect ratio (width vs height)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const bodyHeight = Math.abs(avgShoulderY - avgAnkleY);
    const aspectRatio = bodyHeight / (shoulderWidth || 0.01); // Avoid division by zero

    if (aspectRatio < 1.5) {
      reasons.push("Body wider than tall");
      confidence += 20;
    }

    // Metric 4: Head below hips
    const headToHipDistance = avgHipY - nose.y; // Negative if head is below hips

    if (headToHipDistance < -0.1) {
      reasons.push("Head positioned below hips");
      confidence += 15;
    }

    // Metric 5: Vertical position (person in lower part of frame)
    const verticalPosition = (nose.y + avgHipY) / 2; // Body center

    if (verticalPosition > 0.6) {
      reasons.push("Person in lower part of frame");
      confidence += 10;
    }

    const isFall = confidence >= 50;

    return {
      isFall,
      confidence: Math.min(confidence, 100),
      reason: reasons,
      metrics: {
        verticalVelocity,
        bodyAngle,
        aspectRatio,
        headToHipDistance,
        verticalPosition,
      },
    };
  }

  private calculateBodyAngle(
    leftShoulder: PoseLandmark,
    rightShoulder: PoseLandmark,
    leftHip: PoseLandmark,
    rightHip: PoseLandmark
  ): number {
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;

    const angle = Math.atan2(hipMidY - shoulderMidY, hipMidX - shoulderMidX) * (180 / Math.PI);
    return angle;
  }

  reset(): void {
    this.previousNoseY = null;
    this.previousTimestamp = Date.now();
  }
}
