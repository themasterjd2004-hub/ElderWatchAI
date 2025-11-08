import { useState, useEffect, useCallback } from "react";
import { FallAlert } from "@/modules/fall-detection";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FallEvent, Parent } from "@shared/schema";

export function useFallDetection(parentId: string | undefined) {
  const [currentAlert, setCurrentAlert] = useState<FallEvent | null>(null);
  const { toast } = useToast();

  const handleFallDetected = useCallback(
    async (alert: FallAlert) => {
      if (!parentId) return;

      try {
        // Send fall event to backend
        const fallEvent = await apiRequest<FallEvent>("/api/fall-events", {
          method: "POST",
          body: JSON.stringify({
            parentId,
            type: alert.type,
            confidence: alert.confidence,
            location: alert.location || "Unknown",
            vitals: alert.vitals,
            keypointMetrics: alert.keypointMetrics,
            motionWindow: alert.motionWindow,
          }),
        });

        setCurrentAlert(fallEvent);

        // Show toast notification
        toast({
          title: "Fall Detected",
          description: `Confidence: ${alert.confidence}% - Motion check completed`,
          variant: "destructive",
        });

        // Invalidate fall events cache
        queryClient.invalidateQueries({ queryKey: ["/api/fall-events", parentId] });
      } catch (error) {
        console.error("Failed to report fall event:", error);
        toast({
          title: "Error",
          description: "Failed to report fall event to server",
          variant: "destructive",
        });
      }
    },
    [parentId, toast]
  );

  const acknowledgeFall = useCallback(
    async (fallEventId: string, userId: string) => {
      try {
        await apiRequest(`/api/fall-events/${fallEventId}/acknowledge`, {
          method: "POST",
          body: JSON.stringify({ userId }),
        });

        setCurrentAlert(null);

        toast({
          title: "Alert Acknowledged",
          description: "Fall event has been acknowledged",
        });

        // Invalidate cache
        if (parentId) {
          queryClient.invalidateQueries({ queryKey: ["/api/fall-events", parentId] });
        }
      } catch (error) {
        console.error("Failed to acknowledge fall:", error);
        toast({
          title: "Error",
          description: "Failed to acknowledge fall event",
          variant: "destructive",
        });
      }
    },
    [parentId, toast]
  );

  const markAsFalseAlarm = useCallback(
    async (fallEventId: string) => {
      try {
        await apiRequest(`/api/fall-events/${fallEventId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "false_alarm" }),
        });

        setCurrentAlert(null);

        toast({
          title: "Marked as False Alarm",
          description: "This incident has been marked as a false alarm",
        });

        // Invalidate cache
        if (parentId) {
          queryClient.invalidateQueries({ queryKey: ["/api/fall-events", parentId] });
        }
      } catch (error) {
        console.error("Failed to mark as false alarm:", error);
        toast({
          title: "Error",
          description: "Failed to update fall event",
          variant: "destructive",
        });
      }
    },
    [parentId, toast]
  );

  return {
    currentAlert,
    handleFallDetected,
    acknowledgeFall,
    markAsFalseAlarm,
  };
}
