/**
 * Real-time distress detection service
 * Monitors transcription stream and triggers alerts on distress keywords
 */

import { detectDistressKeywords, DistressDetectionResult, DistressKeyword } from './distressKeywords';

export type DistressAlertCallback = (result: DistressDetectionResult) => void;

export class DistressDetector {
  private recentDetections: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 30000; // 30 seconds between same keyword alerts
  private callbacks: DistressAlertCallback[] = [];

  /**
   * Analyze text for distress keywords
   * @param text - Transcribed speech text
   * @param allowDuplicates - Allow same keyword to trigger multiple times (default: false)
   */
  analyze(text: string, allowDuplicates: boolean = false): DistressDetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        detected: false,
        keyword: null,
        matchedText: '',
        timestamp: new Date(),
      };
    }

    const result = detectDistressKeywords(text);

    if (result.detected && result.keyword) {
      const keywordId = `${result.keyword.phrase}_${result.keyword.severity}`;
      const lastDetection = this.recentDetections.get(keywordId);
      const now = Date.now();

      // Check cooldown to prevent spam alerts
      if (!allowDuplicates && lastDetection && (now - lastDetection) < this.COOLDOWN_MS) {
        console.log(`[DistressDetector] Cooldown active for "${result.keyword.phrase}" (${Math.ceil((this.COOLDOWN_MS - (now - lastDetection)) / 1000)}s remaining)`);
        return {
          ...result,
          detected: false, // Suppress duplicate alert
        };
      }

      // Update last detection time
      this.recentDetections.set(keywordId, now);

      // Trigger callbacks
      this.triggerCallbacks(result);

      console.log(`[DistressDetector] DISTRESS DETECTED:`, {
        keyword: result.keyword.phrase,
        severity: result.keyword.severity,
        category: result.keyword.category,
        language: result.keyword.language,
      });
    }

    return result;
  }

  /**
   * Subscribe to distress alerts
   */
  onDistressDetected(callback: DistressAlertCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Unsubscribe from distress alerts
   */
  offDistressDetected(callback: DistressAlertCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Trigger all registered callbacks
   */
  private triggerCallbacks(result: DistressDetectionResult): void {
    this.callbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('[DistressDetector] Error in callback:', error);
      }
    });
  }

  /**
   * Clear cooldown for a specific keyword (for testing)
   */
  clearCooldown(keyword: string): void {
    this.recentDetections.delete(keyword);
  }

  /**
   * Clear all cooldowns
   */
  clearAllCooldowns(): void {
    this.recentDetections.clear();
  }

  /**
   * Get severity-based emergency level
   */
  getEmergencyLevel(keyword: DistressKeyword | null): 'critical' | 'high' | 'medium' | 'none' {
    if (!keyword) return 'none';
    return keyword.severity;
  }
}
