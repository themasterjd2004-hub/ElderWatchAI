/**
 * Pattern detector interface for modular activity analysis
 */

import { KinematicFeatures, MovementHistory } from './kinematicFeatures';

export type PatternSeverity = 'critical' | 'high' | 'medium' | 'low';
export type PatternType = 'fall' | 'stumbling' | 'freezing' | 'erratic' | 'prolonged_lying';

export interface PatternDetectionResult {
  detected: boolean;
  patternType: PatternType;
  confidence: number;  // 0-1
  severity: PatternSeverity;
  timestamp: Date;
  metadata: Record<string, any>;  // Pattern-specific data
  description: string;
}

/**
 * Base interface for all pattern detectors
 */
export interface IPatternDetector {
  /**
   * Analyze current features and history to detect pattern
   */
  analyze(
    features: KinematicFeatures,
    history: MovementHistory
  ): PatternDetectionResult | null;
  
  /**
   * Reset detector state (e.g., after alert triggered)
   */
  reset(): void;
  
  /**
   * Get detector name for logging
   */
  getName(): string;
  
  /**
   * Get cooldown period in milliseconds
   */
  getCooldownMs(): number;
}

/**
 * Base class with common detector functionality
 */
export abstract class BasePatternDetector implements IPatternDetector {
  protected lastDetectionTime: number = 0;
  protected cooldownMs: number;
  protected patternType: PatternType;
  
  constructor(patternType: PatternType, cooldownMs: number = 30000) {
    this.patternType = patternType;
    this.cooldownMs = cooldownMs;
  }
  
  abstract analyze(
    features: KinematicFeatures,
    history: MovementHistory
  ): PatternDetectionResult | null;
  
  reset(): void {
    this.lastDetectionTime = 0;
  }
  
  getName(): string {
    return this.patternType;
  }
  
  getCooldownMs(): number {
    return this.cooldownMs;
  }
  
  /**
   * Check if detector is in cooldown period
   */
  protected isInCooldown(): boolean {
    const now = Date.now();
    return (now - this.lastDetectionTime) < this.cooldownMs;
  }
  
  /**
   * Mark detection time (starts cooldown)
   */
  protected markDetection(): void {
    this.lastDetectionTime = Date.now();
  }
  
  /**
   * Create detection result helper
   */
  protected createResult(
    detected: boolean,
    confidence: number,
    severity: PatternSeverity,
    metadata: Record<string, any>,
    description: string
  ): PatternDetectionResult {
    return {
      detected,
      patternType: this.patternType,
      confidence,
      severity,
      timestamp: new Date(),
      metadata,
      description,
    };
  }
}
