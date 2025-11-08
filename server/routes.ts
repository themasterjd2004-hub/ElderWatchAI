import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertFallEventSchema, insertParentSchema, insertAlertSchema } from "@shared/schema";
import { z } from "zod";
import { seedDemoData } from "./demo-data";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Seed demo data for testing
  await seedDemoData();

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join user's room for targeted alerts
    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Store io instance for use in routes
  (app as any).io = io;

  // === Demo Data Route ===
  app.get("/api/demo-ids", async (req, res) => {
    try {
      const demoUser = await storage.getUserByUsername("demo");
      if (!demoUser) {
        return res.status(404).json({ error: "Demo user not found" });
      }

      const parents = await storage.getParentsByUserId(demoUser.id);
      if (parents.length === 0) {
        return res.status(404).json({ error: "Demo parent not found" });
      }

      res.json({
        userId: demoUser.id,
        parentId: parents[0].id,
      });
    } catch (error) {
      console.error("Error fetching demo IDs:", error);
      res.status(500).json({ error: "Failed to fetch demo IDs" });
    }
  });

  // === Parent Routes ===
  app.post("/api/parents", async (req, res) => {
    try {
      const data = insertParentSchema.parse(req.body);
      const parent = await storage.createParent(data);
      res.json(parent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating parent:", error);
      res.status(500).json({ error: "Failed to create parent" });
    }
  });

  app.get("/api/parents/:userId", async (req, res) => {
    try {
      const parents = await storage.getParentsByUserId(req.params.userId);
      res.json(parents);
    } catch (error) {
      console.error("Error fetching parents:", error);
      res.status(500).json({ error: "Failed to fetch parents" });
    }
  });

  app.patch("/api/parents/:id", async (req, res) => {
    try {
      const parent = await storage.updateParent(req.params.id, req.body);
      if (!parent) {
        return res.status(404).json({ error: "Parent not found" });
      }
      res.json(parent);
    } catch (error) {
      console.error("Error updating parent:", error);
      res.status(500).json({ error: "Failed to update parent" });
    }
  });

  // === Fall Event Routes ===
  app.post("/api/fall-events", async (req, res) => {
    try {
      const data = insertFallEventSchema.parse(req.body);
      const fallEvent = await storage.createFallEvent(data);

      // Emit real-time alert via WebSocket
      const parent = await storage.getParent(fallEvent.parentId);
      if (parent) {
        io.to(`user:${parent.userId}`).emit("fall_alert", {
          fallEvent,
          parent,
        });
        console.log(`🚨 Fall alert sent to user ${parent.userId}`);
      }

      res.json(fallEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating fall event:", error);
      res.status(500).json({ error: "Failed to create fall event" });
    }
  });

  app.get("/api/fall-events/:parentId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await storage.getFallEventsByParentId(req.params.parentId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching fall events:", error);
      res.status(500).json({ error: "Failed to fetch fall events" });
    }
  });

  app.post("/api/fall-events/:id/acknowledge", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const event = await storage.acknowledgeFallEvent(req.params.id, userId);
      if (!event) {
        return res.status(404).json({ error: "Fall event not found" });
      }

      // Notify via WebSocket
      const parent = await storage.getParent(event.parentId);
      if (parent) {
        io.to(`user:${parent.userId}`).emit("fall_acknowledged", event);
      }

      res.json(event);
    } catch (error) {
      console.error("Error acknowledging fall event:", error);
      res.status(500).json({ error: "Failed to acknowledge fall event" });
    }
  });

  app.patch("/api/fall-events/:id", async (req, res) => {
    try {
      const event = await storage.updateFallEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Fall event not found" });
      }

      // Notify via WebSocket
      const parent = await storage.getParent(event.parentId);
      if (parent) {
        io.to(`user:${parent.userId}`).emit("fall_updated", event);
      }

      res.json(event);
    } catch (error) {
      console.error("Error updating fall event:", error);
      res.status(500).json({ error: "Failed to update fall event" });
    }
  });

  // === Alert Routes ===
  app.post("/api/alerts", async (req, res) => {
    try {
      const data = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(data);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.get("/api/alerts/:userId", async (req, res) => {
    try {
      const alerts = await storage.getAlertsByUserId(req.params.userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts/:id/read", async (req, res) => {
    try {
      const alert = await storage.markAlertAsRead(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // === Monitoring Session Routes ===
  app.post("/api/monitoring/start", async (req, res) => {
    try {
      const { parentId } = req.body;
      if (!parentId) {
        return res.status(400).json({ error: "parentId is required" });
      }

      // Check if there's already an active session
      const activeSession = await storage.getActiveSession(parentId);
      if (activeSession) {
        return res.json(activeSession);
      }

      const session = await storage.createMonitoringSession({ parentId });
      res.json(session);
    } catch (error) {
      console.error("Error starting monitoring session:", error);
      res.status(500).json({ error: "Failed to start monitoring session" });
    }
  });

  app.post("/api/monitoring/:id/end", async (req, res) => {
    try {
      const session = await storage.endMonitoringSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Monitoring session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error ending monitoring session:", error);
      res.status(500).json({ error: "Failed to end monitoring session" });
    }
  });

  return httpServer;
}
