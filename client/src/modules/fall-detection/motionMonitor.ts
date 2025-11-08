import { PoseLandmark } from "./poseDetector";

export interface MotionCheckResult {
  isComplete: boolean;
  timeRemaining: number;
  movementDetected: boolean;
  avgMovement: number;
  shouldTriggerAlert: boolean;
}

export class MotionMonitor {
  private isMonitoring = false;
  private startTime: number | null = null;
  private previousLandmarks: PoseLandmark[] | null = null;
  private movementSamples: number[] = [];
  private readonly MONITORING_DURATION = 10000; // 10 seconds in milliseconds
  private readonly MOVEMENT_THRESHOLD = 0.02; // Normalized coordinate threshold
  private readonly MIN_MOVEMENT_SAMPLES = 5; // Minimum samples needed

  startMonitoring(initialLandmarks: PoseLandmark[]): void {
    this.isMonitoring = true;
    this.startTime = Date.now();
    this.previousLandmarks = initialLandmarks;
    this.movementSamples = [];
    console.log("🔍 Starting 10-second motion monitoring...");
  }

  checkMotion(currentLandmarks: PoseLandmark[]): MotionCheckResult {
    if (!this.isMonitoring || !this.startTime) {
      return {
        isComplete: false,
        timeRemaining: 10,
        movementDetected: false,
        avgMovement: 0,
        shouldTriggerAlert: false,
      };
    }

    const elapsed = Date.now() - this.startTime;
    const timeRemaining = Math.max(0, (this.MONITORING_DURATION - elapsed) / 1000);

    // Calculate movement
    let movement = 0;
    if (this.previousLandmarks) {
      movement = this.calculateMovement(currentLandmarks, this.previousLandmarks);
      this.movementSamples.push(movement);
    }

    this.previousLandmarks = currentLandmarks;

    // Check if monitoring period is complete
    const isComplete = elapsed >= this.MONITORING_DURATION;

    if (isComplete) {
      const avgMovement = this.movementSamples.length > 0
        ? this.movementSamples.reduce((a, b) => a + b, 0) / this.movementSamples.length
        : 0;

      const movementDetected = avgMovement > this.MOVEMENT_THRESHOLD;
      const shouldTriggerAlert = !movementDetected && this.movementSamples.length >= this.MIN_MOVEMENT_SAMPLES;

      console.log(`📊 Motion check complete: avgMovement=${avgMovement.toFixed(4)}, trigger=${shouldTriggerAlert}`);

      this.reset();

      return {
        isComplete: true,
        timeRemaining: 0,
        movementDetected,
        avgMovement,
        shouldTriggerAlert,
      };
    }

    return {
      isComplete: false,
      timeRemaining,
      movementDetected: movement > this.MOVEMENT_THRESHOLD,
      avgMovement: movement,
      shouldTriggerAlert: false,
    };
  }

  private calculateMovement(current: PoseLandmark[], previous: PoseLandmark[]): number {
    if (current.length !== previous.length) return 0;

    let totalMovement = 0;
    let validPoints = 0;

    // Calculate movement for key body points (not all 33 landmarks)
    const keyIndices = [0, 11, 12, 23, 24, 27, 28]; // nose, shoulders, hips, ankles

    for (const idx of keyIndices) {
      if (idx >= current.length) continue;

      const curr = current[idx];
      const prev = previous[idx];

      // Skip if visibility is too low
      if (curr.visibility !== undefined && curr.visibility < 0.5) continue;

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dz = curr.z - prev.z;

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      totalMovement += distance;
      validPoints++;
    }

    return validPoints > 0 ? totalMovement / validPoints : 0;
  }

  reset(): void {
    this.isMonitoring = false;
    this.startTime = null;
    this.previousLandmarks = null;
    this.movementSamples = [];
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  getTimeRemaining(): number {
    if (!this.isMonitoring || !this.startTime) return 10;
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, (this.MONITORING_DURATION - elapsed) / 1000);
  }
}
