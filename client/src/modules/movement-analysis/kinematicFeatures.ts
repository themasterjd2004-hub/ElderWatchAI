/**
 * Shared kinematic feature extraction
 * Computed once per frame and shared across all pattern detectors
 */

import { PoseLandmark } from "../fall-detection/poseDetector";

export interface KinematicFeatures {
  // Velocity metrics
  velocity: {
    overall: number;  // Overall movement speed (pixels/second)
    vertical: number; // Vertical velocity (falling/rising)
    lateral: number;  // Side-to-side movement
    forward: number;  // Front-back movement
  };
  
  // Posture metrics
  posture: {
    bodyAngle: number;      // Angle from vertical (0 = upright, 90 = horizontal)
    isHorizontal: boolean;  // True if lying down
    isVertical: boolean;    // True if standing/sitting upright
    centerOfMass: { x: number; y: number }; // Body center point
  };
  
  // Movement quality
  quality: {
    smoothness: number;     // How smooth the movement is (0-1)
    stability: number;      // Balance/stability metric (0-1)
    symmetry: number;       // Left-right symmetry (0-1)
    cadence: number;        // Steps per minute (for gait analysis)
  };
  
  // Temporal context
  temporal: {
    timestamp: number;
    deltaTime: number;  // Time since last frame (ms)
  };
}

export interface MovementHistory {
  features: KinematicFeatures[];
  maxLength: number;
}

/**
 * Extract kinematic features from pose landmarks
 */
export function extractKinematicFeatures(
  landmarks: PoseLandmark[],
  previousLandmarks: PoseLandmark[] | null,
  deltaTime: number
): KinematicFeatures {
  const centerOfMass = calculateCenterOfMass(landmarks);
  const bodyAngle = calculateBodyAngle(landmarks);
  
  // Velocity calculation (requires previous frame)
  let velocity = { overall: 0, vertical: 0, lateral: 0, forward: 0 };
  if (previousLandmarks && deltaTime > 0) {
    velocity = calculateVelocity(landmarks, previousLandmarks, deltaTime);
  }
  
  // Posture analysis
  const posture = {
    bodyAngle,
    isHorizontal: bodyAngle > 60,  // Lying down if angle > 60 degrees
    isVertical: bodyAngle < 30,    // Standing/sitting if angle < 30 degrees
    centerOfMass,
  };
  
  // Movement quality metrics
  const quality = {
    smoothness: calculateSmoothness(landmarks, previousLandmarks),
    stability: calculateStability(landmarks),
    symmetry: calculateSymmetry(landmarks),
    cadence: 0, // TODO: Implement gait cadence detection
  };
  
  return {
    velocity,
    posture,
    quality,
    temporal: {
      timestamp: Date.now(),
      deltaTime,
    },
  };
}

/**
 * Calculate center of mass (approximate using key joints)
 */
function calculateCenterOfMass(landmarks: PoseLandmark[]): { x: number; y: number } {
  // Use hips and shoulders as primary mass points
  const keyPoints = [11, 12, 23, 24]; // Left/right shoulders, left/right hips
  
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  
  for (const idx of keyPoints) {
    if (landmarks[idx]) {
      sumX += landmarks[idx].x;
      sumY += landmarks[idx].y;
      count++;
    }
  }
  
  return count > 0 ? { x: sumX / count, y: sumY / count } : { x: 0, y: 0 };
}

/**
 * Calculate body angle from vertical (0 = upright, 90 = horizontal)
 */
function calculateBodyAngle(landmarks: PoseLandmark[]): number {
  // Use shoulder-to-hip line
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return 0;
  }
  
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };
  
  const dx = hipMid.x - shoulderMid.x;
  const dy = hipMid.y - shoulderMid.y;
  
  // Angle from vertical
  const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
  return (angleRad * 180) / Math.PI;
}

/**
 * Calculate velocity in different directions
 */
function calculateVelocity(
  landmarks: PoseLandmark[],
  previousLandmarks: PoseLandmark[],
  deltaTime: number
): { overall: number; vertical: number; lateral: number; forward: number } {
  const current = calculateCenterOfMass(landmarks);
  const previous = calculateCenterOfMass(previousLandmarks);
  
  const dx = current.x - previous.x;
  const dy = current.y - previous.y;
  
  // Convert to velocity (pixels per second)
  const timeFactor = 1000 / deltaTime; // Convert deltaTime from ms to seconds
  
  const overall = Math.sqrt(dx * dx + dy * dy) * timeFactor;
  const vertical = Math.abs(dy) * timeFactor;
  const lateral = Math.abs(dx) * timeFactor;
  const forward = 0; // Z-axis not available in 2D pose estimation
  
  return { overall, vertical, lateral, forward };
}

/**
 * Calculate movement smoothness (0 = jerky, 1 = smooth)
 */
function calculateSmoothness(landmarks: PoseLandmark[], previousLandmarks: PoseLandmark[] | null): number {
  if (!previousLandmarks) return 1.0;
  
  // Calculate average positional change across all joints
  let totalChange = 0;
  let count = 0;
  
  for (let i = 0; i < landmarks.length; i++) {
    if (landmarks[i] && previousLandmarks[i]) {
      const dx = landmarks[i].x - previousLandmarks[i].x;
      const dy = landmarks[i].y - previousLandmarks[i].y;
      const change = Math.sqrt(dx * dx + dy * dy);
      totalChange += change;
      count++;
    }
  }
  
  const avgChange = count > 0 ? totalChange / count : 0;
  
  // Map to 0-1 scale (smaller changes = smoother)
  // Threshold of 0.05 for very smooth movement
  return Math.max(0, 1 - (avgChange / 0.05));
}

/**
 * Calculate stability/balance (0 = unstable, 1 = stable)
 */
function calculateStability(landmarks: PoseLandmark[]): number {
  // Check if feet are visible and grounded
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
    return 0.5; // Unknown stability
  }
  
  // Wide stance = more stable
  const feetWidth = Math.abs(leftAnkle.x - rightAnkle.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);
  const stanceRatio = feetWidth / (hipWidth + 0.001); // Avoid division by zero
  
  // Ratio > 1 means feet wider than hips (stable)
  // Ratio < 1 means feet closer than hips (less stable)
  return Math.min(1, stanceRatio);
}

/**
 * Calculate left-right symmetry (0 = asymmetric, 1 = symmetric)
 */
function calculateSymmetry(landmarks: PoseLandmark[]): number {
  // Compare left and right joint positions
  const pairs = [
    [11, 12], // Shoulders
    [13, 14], // Elbows
    [15, 16], // Wrists
    [23, 24], // Hips
    [25, 26], // Knees
    [27, 28], // Ankles
  ];
  
  let totalSymmetry = 0;
  let count = 0;
  
  for (const [leftIdx, rightIdx] of pairs) {
    const left = landmarks[leftIdx];
    const right = landmarks[rightIdx];
    
    if (left && right) {
      // Compare heights (y-coordinates should be similar for symmetry)
      const heightDiff = Math.abs(left.y - right.y);
      const symmetry = Math.max(0, 1 - heightDiff * 10); // Scale factor
      totalSymmetry += symmetry;
      count++;
    }
  }
  
  return count > 0 ? totalSymmetry / count : 0.5;
}

/**
 * Create a rolling history buffer for temporal analysis
 */
export function createMovementHistory(maxLength: number = 30): MovementHistory {
  return {
    features: [],
    maxLength,
  };
}

/**
 * Add feature to history buffer
 */
export function addToHistory(history: MovementHistory, features: KinematicFeatures): void {
  history.features.push(features);
  
  // Keep only recent history
  if (history.features.length > history.maxLength) {
    history.features.shift();
  }
}

/**
 * Get average velocity over recent history
 */
export function getAverageVelocity(history: MovementHistory, windowSize: number = 10): number {
  const recent = history.features.slice(-windowSize);
  if (recent.length === 0) return 0;
  
  const sum = recent.reduce((acc, f) => acc + f.velocity.overall, 0);
  return sum / recent.length;
}

/**
 * Get velocity variance (for detecting erratic movement)
 */
export function getVelocityVariance(history: MovementHistory, windowSize: number = 10): number {
  const recent = history.features.slice(-windowSize);
  if (recent.length < 2) return 0;
  
  const velocities = recent.map(f => f.velocity.overall);
  const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const variance = velocities.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / velocities.length;
  
  return variance;
}
