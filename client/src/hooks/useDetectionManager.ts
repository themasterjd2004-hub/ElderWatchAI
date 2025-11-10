import { useState, useRef, useCallback } from "react";
import {
  DetectorMode,
  DetectorStrategy,
  FallDetectionStrategy,
  SignLanguageStrategy,
  TranscriptEntry
} from "@/modules/detection/detectorModes";
import { FallAlert } from "@/modules/fall-detection";

export interface DetectionManagerState {
  mode: DetectorMode;
  isInitialized: boolean;
  isActive: boolean;
  status: string;
  transcriptEntries: TranscriptEntry[];
}

export function useDetectionManager(onFallDetected?: (alert: FallAlert) => void) {
  const [state, setState] = useState<DetectionManagerState>({
    mode: "fall_detection",
    isInitialized: false,
    isActive: false,
    status: "idle",
    transcriptEntries: []
  });

  const strategyRef = useRef<DetectorStrategy | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initialize = useCallback(async (mode: DetectorMode) => {
    // Clean up existing strategy
    if (strategyRef.current) {
      strategyRef.current.tearDown();
      strategyRef.current = null;
    }

    // Create new strategy
    if (mode === "fall_detection") {
      strategyRef.current = new FallDetectionStrategy(onFallDetected);
    } else {
      strategyRef.current = new SignLanguageStrategy();
    }

    await strategyRef.current.initialize();

    setState(prev => ({
      ...prev,
      mode,
      isInitialized: true,
      status: strategyRef.current?.getStatus() || "idle"
    }));
  }, [onFallDetected]);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !strategyRef.current || !state.isActive) {
      return;
    }

    const transcriptEntry = await strategyRef.current.processFrame(
      videoRef.current,
      canvasRef.current
    );

    // Add transcript entry if detected
    if (transcriptEntry) {
      setState(prev => ({
        ...prev,
        transcriptEntries: [...prev.transcriptEntries, transcriptEntry].slice(-20), // Keep last 20 entries
        status: strategyRef.current?.getStatus() || "idle"
      }));
    }

    // Continue animation loop
    if (state.isActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [state.isActive]);

  const start = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;

    setState(prev => ({ ...prev, isActive: true }));

    // Start processing loop
    processFrame();
  }, [processFrame]);

  const stop = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const setMode = useCallback(async (mode: DetectorMode) => {
    const wasActive = state.isActive;

    // Stop current detection
    if (wasActive) {
      stop();
    }

    // Reinitialize with new mode
    await initialize(mode);

    // Restart if it was active
    if (wasActive && videoRef.current && canvasRef.current) {
      start(videoRef.current, canvasRef.current);
    }

    // Clear transcript entries when switching modes
    setState(prev => ({ ...prev, transcriptEntries: [] }));
  }, [state.isActive, stop, initialize, start]);

  const cleanup = useCallback(() => {
    stop();
    if (strategyRef.current) {
      strategyRef.current.tearDown();
      strategyRef.current = null;
    }
    setState({
      mode: "fall_detection",
      isInitialized: false,
      isActive: false,
      status: "idle",
      transcriptEntries: []
    });
  }, [stop]);

  return {
    state,
    initialize,
    start,
    stop,
    setMode,
    cleanup
  };
}
