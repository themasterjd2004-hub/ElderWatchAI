/**
 * Prolonged Lying pattern detector
 * Detects person lying down for abnormally long time
 */

import { BasePatternDetector, PatternDetectionResult, PatternSeverity } from './patternDetector';
import { KinematicFeatures, MovementHistory } from './kinematicFeatures';

export class ProlongedLyingDetector extends BasePatternDetector {
  private lyingStartTime: number | null = null;
  private lastAlertLevel: PatternSeverity | null = null;
  
  // Duration thresholds (in milliseconds)
  private readonly MEDIUM_THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutes -> MEDIUM
  private readonly HIGH_THRESHOLD_MS = 15 * 60 * 1000;   // 15 minutes -> HIGH
  private readonly CRITICAL_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes -> CRITICAL
  
  constructor() {
    super('prolonged_lying', 60000); // 1 minute cooldown between escalations
  }
  
  analyze(
    features: KinematicFeatures,
    history: MovementHistory
  ): PatternDetectionResult | null {
    const { posture, velocity } = features;
    
    // Check if person is lying down (horizontal posture + low movement)
    const isLying = posture.isHorizontal && velocity.overall < 0.01;
    
    if (isLying) {
      if (!this.lyingStartTime) {
        // Start tracking lying duration
        this.lyingStartTime = Date.now();
        this.lastAlertLevel = null;
      }
      
      const lyingDuration = Date.now() - this.lyingStartTime;
      
      // Determine severity based on duration
      let severity: PatternSeverity;
      let shouldAlert = false;
      
      if (lyingDuration >= this.CRITICAL_THRESHOLD_MS) {
        severity = 'critical';
        // Alert if we haven't alerted at this level yet
        shouldAlert = this.lastAlertLevel !== 'critical' && !this.isInCooldown();
      } else if (lyingDuration >= this.HIGH_THRESHOLD_MS) {
        severity = 'high';
        shouldAlert = this.lastAlertLevel !== 'high' && this.lastAlertLevel !== 'critical' && !this.isInCooldown();
      } else if (lyingDuration >= this.MEDIUM_THRESHOLD_MS) {
        severity = 'medium';
        shouldAlert = !this.lastAlertLevel && !this.isInCooldown();
      } else {
        // Not lying long enough yet
        return null;
      }
      
      if (shouldAlert) {
        this.markDetection();
        this.lastAlertLevel = severity;
        
        const minutes = (lyingDuration / 60000).toFixed(1);
        
        return this.createResult(
          true,
          0.9, // High confidence (observable state)
          severity,
          {
            lyingDuration,
            lyingMinutes: parseFloat(minutes),
            bodyAngle: posture.bodyAngle,
            movement: velocity.overall,
          },
          `Person lying down for ${minutes} minutes - ${severity} alert`
        );
      }
    } else {
      // Person is no longer lying down, reset tracking
      this.lyingStartTime = null;
      this.lastAlertLevel = null;
    }
    
    return null;
  }
  
  reset(): void {
    super.reset();
    this.lyingStartTime = null;
    this.lastAlertLevel = null;
  }
}
