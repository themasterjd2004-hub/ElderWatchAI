/**
 * Activity Pattern Analyzer
 * Coordinates multiple pattern detectors and manages unified alert pipeline
 */

import { IPatternDetector, PatternDetectionResult, PatternSeverity } from './patternDetector';
import { 
  KinematicFeatures, 
  MovementHistory, 
  createMovementHistory, 
  addToHistory,
  extractKinematicFeatures 
} from './kinematicFeatures';
import { StumblingDetector } from './stumblingDetector';
import { FreezingDetector } from './freezingDetector';
import { ProlongedLyingDetector } from './prolongedLyingDetector';
import { PoseLandmark } from '../fall-detection/poseDetector';

export interface ActivityAlert {
  result: PatternDetectionResult;
  shouldDispatch: boolean;  // Should trigger emergency dispatch?
  shouldNotifyFamily: boolean;  // Should alert family members?
  shouldLog: boolean;  // Should log for review?
}

export type ActivityAlertCallback = (alert: ActivityAlert) => void;

export class ActivityPatternAnalyzer {
  private detectors: IPatternDetector[] = [];
  private movementHistory: MovementHistory;
  private previousLandmarks: PoseLandmark[] | null = null;
  private lastFrameTime: number = Date.now();
  private callbacks: ActivityAlertCallback[] = [];
  
  constructor() {
    // Initialize all pattern detectors
    this.detectors = [
      new StumblingDetector(),
      new FreezingDetector(),
      new ProlongedLyingDetector(),
      // Add more detectors here as needed
    ];
    
    // Create movement history buffer (30 frames = ~1 second at 30fps)
    this.movementHistory = createMovementHistory(30);
  }
  
  /**
   * Analyze frame for abnormal movement patterns
   * @param landmarks - Current pose landmarks
   * @returns Array of detected patterns (can be multiple)
   */
  analyzeFrame(landmarks: PoseLandmark[]): PatternDetectionResult[] {
    const now = Date.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Extract kinematic features (computed once, shared across all detectors)
    const features = extractKinematicFeatures(landmarks, this.previousLandmarks, deltaTime);
    
    // Add to history buffer
    addToHistory(this.movementHistory, features);
    
    // Run all pattern detectors
    const detectedPatterns: PatternDetectionResult[] = [];
    
    for (const detector of this.detectors) {
      const result = detector.analyze(features, this.movementHistory);
      
      if (result && result.detected) {
        console.log(`[ActivityPatternAnalyzer] Pattern detected by ${detector.getName()}:`, result);
        detectedPatterns.push(result);
        
        // Route alert based on severity
        const alert = this.routeAlert(result);
        this.triggerCallbacks(alert);
      }
    }
    
    // Update previous landmarks for next frame
    this.previousLandmarks = landmarks;
    
    return detectedPatterns;
  }
  
  /**
   * Route detection result to appropriate alert level
   */
  private routeAlert(result: PatternDetectionResult): ActivityAlert {
    const { severity } = result;
    
    // Determine actions based on severity
    let shouldDispatch = false;
    let shouldNotifyFamily = false;
    let shouldLog = false;
    
    switch (severity) {
      case 'critical':
        // Critical -> Auto-dispatch ambulance + notify family + log
        shouldDispatch = true;
        shouldNotifyFamily = true;
        shouldLog = true;
        break;
        
      case 'high':
        // High -> Notify family + log (no auto-dispatch yet)
        shouldDispatch = false;
        shouldNotifyFamily = true;
        shouldLog = true;
        break;
        
      case 'medium':
        // Medium -> Log only (monitor situation)
        shouldDispatch = false;
        shouldNotifyFamily = false;
        shouldLog = true;
        break;
        
      case 'low':
        // Low -> Log only
        shouldDispatch = false;
        shouldNotifyFamily = false;
        shouldLog = true;
        break;
    }
    
    return {
      result,
      shouldDispatch,
      shouldNotifyFamily,
      shouldLog,
    };
  }
  
  /**
   * Subscribe to activity alerts
   */
  onActivityAlert(callback: ActivityAlertCallback): void {
    this.callbacks.push(callback);
  }
  
  /**
   * Unsubscribe from activity alerts
   */
  offActivityAlert(callback: ActivityAlertCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }
  
  /**
   * Trigger all registered callbacks
   */
  private triggerCallbacks(alert: ActivityAlert): void {
    this.callbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[ActivityPatternAnalyzer] Error in callback:', error);
      }
    });
  }
  
  /**
   * Reset all detectors (e.g., after alert handled)
   */
  resetAll(): void {
    this.detectors.forEach(detector => detector.reset());
  }
  
  /**
   * Reset specific detector by type
   */
  resetDetector(type: string): void {
    const detector = this.detectors.find(d => d.getName() === type);
    if (detector) {
      detector.reset();
    }
  }
  
  /**
   * Get movement history for debugging/analysis
   */
  getHistory(): MovementHistory {
    return this.movementHistory;
  }
}
