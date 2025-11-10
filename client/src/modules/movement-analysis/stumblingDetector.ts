/**
 * Stumbling pattern detector
 * Detects loss of balance, irregular gait, near-falls
 */

import { BasePatternDetector, PatternDetectionResult } from './patternDetector';
import { KinematicFeatures, MovementHistory, getAverageVelocity } from './kinematicFeatures';

export class StumblingDetector extends BasePatternDetector {
  private stumblingFrames: number = 0;
  private readonly STUMBLING_FRAME_THRESHOLD = 5; // 5 frames (~150ms at 30fps)
  
  constructor() {
    super('stumbling', 20000); // 20 second cooldown
  }
  
  analyze(
    features: KinematicFeatures,
    history: MovementHistory
  ): PatternDetectionResult | null {
    // Skip if in cooldown
    if (this.isInCooldown()) {
      return null;
    }
    
    // Need at least 10 frames of history for reliable detection
    if (history.features.length < 10) {
      return null;
    }
    
    // Stumbling indicators:
    // 1. Lateral COM oscillation (swaying side to side)
    // 2. Low stability score
    // 3. Partial loss of verticality (body angle increasing but not falling)
    // 4. Movement is active (not standing still)
    
    const { velocity, posture, quality } = features;
    const avgVelocity = getAverageVelocity(history, 10);
    
    // Must be moving (not just standing)
    const isMoving = avgVelocity > 0.01;
    
    // Check for lateral movement (swaying)
    const hasLateralMovement = velocity.lateral > velocity.forward * 1.5;
    
    // Check for low stability
    const isUnstable = quality.stability < 0.4;
    
    // Check for partial loss of verticality (leaning but not fallen)
    const isLeaning = posture.bodyAngle > 15 && posture.bodyAngle < 50;
    
    // Check for asymmetry (one side compensating)
    const isAsymmetric = quality.symmetry < 0.6;
    
    // Stumbling score (multiple indicators increase confidence)
    let score = 0;
    if (isMoving) score += 0.2;
    if (hasLateralMovement) score += 0.3;
    if (isUnstable) score += 0.25;
    if (isLeaning) score += 0.15;
    if (isAsymmetric) score += 0.1;
    
    const confidence = score;
    const isStumbling = confidence > 0.6; // Need at least 3-4 indicators
    
    if (isStumbling) {
      this.stumblingFrames++;
      
      // Require consecutive frames to confirm (reduce false positives)
      if (this.stumblingFrames >= this.STUMBLING_FRAME_THRESHOLD) {
        this.markDetection();
        this.stumblingFrames = 0; // Reset counter
        
        return this.createResult(
          true,
          confidence,
          'high', // Stumbling is high priority (might lead to fall)
          {
            lateralVelocity: velocity.lateral,
            stability: quality.stability,
            bodyAngle: posture.bodyAngle,
            symmetry: quality.symmetry,
          },
          `Stumbling detected: lateral movement ${velocity.lateral.toFixed(2)}, stability ${(quality.stability * 100).toFixed(0)}%`
        );
      }
    } else {
      // Reset counter if not stumbling
      this.stumblingFrames = 0;
    }
    
    return null;
  }
  
  reset(): void {
    super.reset();
    this.stumblingFrames = 0;
  }
}
