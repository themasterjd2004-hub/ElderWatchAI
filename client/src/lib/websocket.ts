import { io, Socket } from "socket.io-client";
import type { FallEvent, Parent } from "@shared/schema";

let socket: Socket | null = null;

export function initializeWebSocket(): Socket {
  if (socket) return socket;

  // Use the current window location for WebSocket connection
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const url = `${protocol}//${host}`;

  socket = io(url, {
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("WebSocket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error);
  });

  return socket;
}

export function joinUserRoom(userId: string): void {
  if (!socket) {
    initializeWebSocket();
  }
  socket?.emit("join", userId);
}

export function onFallAlert(
  callback: (data: { fallEvent: FallEvent; parent: Parent }) => void
): () => void {
  if (!socket) {
    initializeWebSocket();
  }

  socket?.on("fall_alert", callback);

  return () => {
    socket?.off("fall_alert", callback);
  };
}

export function onFallAcknowledged(
  callback: (fallEvent: FallEvent) => void
): () => void {
  if (!socket) {
    initializeWebSocket();
  }

  socket?.on("fall_acknowledged", callback);

  return () => {
    socket?.off("fall_acknowledged", callback);
  };
}

export function onFallUpdated(callback: (fallEvent: FallEvent) => void): () => void {
  if (!socket) {
    initializeWebSocket();
  }

  socket?.on("fall_updated", callback);

  return () => {
    socket?.off("fall_updated", callback);
  };
}

export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
