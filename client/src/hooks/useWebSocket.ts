import { useEffect } from "react";
import { initializeWebSocket, joinUserRoom, onFallAlert, onFallAcknowledged } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket(userId: string | undefined) {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const socket = initializeWebSocket();
    joinUserRoom(userId);

    // Listen for fall alerts
    const unsubscribeAlert = onFallAlert((data) => {
      console.log("Fall alert received:", data);

      // Show toast notification
      toast({
        title: "Possible Fall Detected",
        description: `${data.parent.name} may need assistance`,
        variant: "destructive",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/fall-events", data.parent.id] });
    });

    // Listen for acknowledgments
    const unsubscribeAck = onFallAcknowledged((fallEvent) => {
      console.log("Fall acknowledged:", fallEvent);
      queryClient.invalidateQueries({ queryKey: ["/api/fall-events", fallEvent.parentId] });
    });

    return () => {
      unsubscribeAlert();
      unsubscribeAck();
    };
  }, [userId, toast]);
}
