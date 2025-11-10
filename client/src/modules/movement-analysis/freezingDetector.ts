/**
 * Freezing pattern detector
 * Detects sudden stops in movement (Parkinson's symptom, stroke indicator)
 */

import { BasePatternDetector, PatternDetectionResult } from './patternDetector';
import { KinematicFeatures, MovementHistory, getAverageVelocity } from './kinematicFeatures';

export class FreezingDetector extends BasePatternDetector {
  private wasMoving: boolean = false;
  private freezeStartTime: number | null = null;
  private readonly FREEZE_DURATION_THRESHOLD_MS = 2000; // 2 seconds of frozen state
  
  constructor() {
    super('freezing', 30000); // 30 second cooldown
  }
  
  analyze(
    features: KinematicFeatures,
    history: MovementHistory
  ): PatternDetectionResult | null {
    // Skip if in cooldown
    if (this.isInCooldown()) {
      return null;
    }
    
    // Need history to detect velocity collapse
    if (history.features.length < 15) {
      return null;
    }
    
    const currentVelocity = features.velocity.overall;
    const avgVelocityBefore = getAverageVelocity(history, 15);
    
    // Define movement thresholds
    const MOVING_THRESHOLD = 0.02;
    const STOPPED_THRESHOLD = 0.005;
    
    const isCurrentlyMoving = currentVelocity > MOVING_THRESHOLD;
    const isCurrentlyStopped = currentVelocity < STOPPED_THRESHOLD;
    const wasActivelyMoving = avgVelocityBefore > MOVING_THRESHOLD;
    
    // Detect velocity collapse: was moving, now stopped
    if (wasActivelyMoving && isCurrentlyStopped) {
      if (!this.freezeStartTime) {
        // Start tracking freeze duration
        this.freezeStartTime = Date.now();
        this.wasMoving = true;
      }
      
      const freezeDuration = Date.now() - this.freezeStartTime;
      
      // Alert if frozen for threshold duration
      if (freezeDuration >= this.FREEZE_DURATION_THRESHOLD_MS) {
        this.markDetection();
        const frozenSeconds = (freezeDuration / 1000).toFixed(1);
        
        const result = this.createResult(
          true,
          0.8, // High confidence if sustained freeze
          'high', // Freezing is high priority (medical indicator)
          {
            freezeDuration,
            previousVelocity: avgVelocityBefore,
            currentVelocity,
            posture: features.posture.bodyAngle,
          },
          `Freezing detected: Sudden stop after movement (${frozenSeconds}s frozen)`
        );
        
        // Reset freeze tracking after detection
        this.freezeStartTime = null;
        this.wasMoving = false;
        
        return result;
      }
    } else {
      // Person moved again, reset freeze tracking
      if (isCurrentlyMoving) {
        this.freezeStartTime = null;
        this.wasMoving = false;
      }
    }
    
    return null;
  }
  
  reset(): void {
    super.reset();
    this.freezeStartTime = null;
    this.wasMoving = false;
  }
}
