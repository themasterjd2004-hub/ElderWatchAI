import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { 
  insertFallEventSchema, 
  insertParentSchema, 
  insertAlertSchema,
  insertHospitalSchema,
  insertAmbulanceSchema,
  insertVitalsLogSchema,
  insertCameraSchema,
} from "@shared/schema";
import { z } from "zod";
import { seedDemoData } from "./demo-data";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { signup, signin, signout, isAuthenticatedTraditional } from "./traditionalAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication
  await setupAuth(app);

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

  // === Traditional Auth Routes ===
  // Signup disabled - only authorized users can access the system
  // app.post('/api/auth/signup', signup);
  app.post('/api/auth/signin', signin);
  app.post('/api/auth/signout', signout);
  
  app.get('/api/auth/user', isAuthenticatedTraditional, async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.error(`User not found in storage: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // === Replit Auth Routes ===
  app.get('/api/replit/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.error(`User not found in storage: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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
  app.post("/api/parents", isAuthenticatedTraditional, async (req, res) => {
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

  app.get("/api/parents/:userId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const parents = await storage.getParentsByUserId(req.params.userId);
      res.json(parents);
    } catch (error) {
      console.error("Error fetching parents:", error);
      res.status(500).json({ error: "Failed to fetch parents" });
    }
  });

  app.patch("/api/parents/:id", isAuthenticatedTraditional, async (req, res) => {
    try {
      const updates = insertParentSchema.partial().parse(req.body);
      const parent = await storage.updateParent(req.params.id, updates);
      if (!parent) {
        return res.status(404).json({ error: "Parent not found" });
      }
      res.json(parent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating parent:", error);
      res.status(500).json({ error: "Failed to update parent" });
    }
  });

  // === Camera Routes ===
  app.post("/api/cameras", isAuthenticatedTraditional, async (req, res) => {
    try {
      const data = insertCameraSchema.parse(req.body);
      const camera = await storage.createCamera(data);
      res.json(camera);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating camera:", error);
      res.status(500).json({ error: "Failed to create camera" });
    }
  });

  app.get("/api/cameras/:parentId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const cameras = await storage.getCamerasByParentId(req.params.parentId);
      res.json(cameras);
    } catch (error) {
      console.error("Error fetching cameras:", error);
      res.status(500).json({ error: "Failed to fetch cameras" });
    }
  });

  app.patch("/api/cameras/:id", isAuthenticatedTraditional, async (req, res) => {
    try {
      const updates = insertCameraSchema.partial().parse(req.body);
      const camera = await storage.updateCamera(req.params.id, updates);
      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }
      res.json(camera);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating camera:", error);
      res.status(500).json({ error: "Failed to update camera" });
    }
  });

  app.delete("/api/cameras/:id", isAuthenticatedTraditional, async (req, res) => {
    try {
      const success = await storage.deleteCamera(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Camera not found" });
      }
      res.json({ message: "Camera deleted successfully" });
    } catch (error) {
      console.error("Error deleting camera:", error);
      res.status(500).json({ error: "Failed to delete camera" });
    }
  });

  // === Fall Event Routes ===
  app.post("/api/fall-events", isAuthenticatedTraditional, async (req, res) => {
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

  app.get("/api/fall-events/:parentId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await storage.getFallEventsByParentId(req.params.parentId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching fall events:", error);
      res.status(500).json({ error: "Failed to fetch fall events" });
    }
  });

  app.post("/api/fall-events/:id/acknowledge", isAuthenticatedTraditional, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
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

  app.patch("/api/fall-events/:id", isAuthenticatedTraditional, async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["pending", "acknowledged", "false_alarm", "dispatched", "resolved"]).optional(),
        notes: z.string().optional(),
        location: z.string().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const event = await storage.updateFallEvent(req.params.id, updates);
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating fall event:", error);
      res.status(500).json({ error: "Failed to update fall event" });
    }
  });

  // === Alert Routes ===
  app.post("/api/alerts", isAuthenticatedTraditional, async (req, res) => {
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

  app.get("/api/alerts/:userId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const alerts = await storage.getAlertsByUserId(req.params.userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts/:id/read", isAuthenticatedTraditional, async (req, res) => {
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

  // === Hospital Routes ===
  app.get("/api/hospitals", isAuthenticatedTraditional, async (req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ error: "Failed to fetch hospitals" });
    }
  });

  app.get("/api/hospitals/nearest", isAuthenticatedTraditional, async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng parameters are required" });
      }
      
      const hospitals = await storage.getNearestHospitals(
        parseFloat(lat as string),
        parseFloat(lng as string)
      );
      res.json(hospitals);
    } catch (error) {
      console.error("Error finding nearest hospitals:", error);
      res.status(500).json({ error: "Failed to find nearest hospitals" });
    }
  });

  app.get("/api/hospitals/:id", isAuthenticatedTraditional, async (req, res) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      console.error("Error fetching hospital:", error);
      res.status(500).json({ error: "Failed to fetch hospital" });
    }
  });

  app.post("/api/hospitals", isAuthenticatedTraditional, isAdmin, async (req, res) => {
    try {
      const data = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(data);
      res.json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating hospital:", error);
      res.status(500).json({ error: "Failed to create hospital" });
    }
  });

  app.patch("/api/hospitals/:id", isAuthenticatedTraditional, isAdmin, async (req, res) => {
    try {
      const updateSchema = z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        emergencyPhone: z.string().optional(),
        gpsCoordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
        specializations: z.array(z.string()).optional(),
        availability: z.string().optional(),
        rating: z.number().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const hospital = await storage.updateHospital(req.params.id, updates);
      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating hospital:", error);
      res.status(500).json({ error: "Failed to update hospital" });
    }
  });

  app.delete("/api/hospitals/:id", isAuthenticatedTraditional, isAdmin, async (req, res) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      // Note: Delete implementation requires adding deleteHospital to storage interface
      res.status(501).json({ error: "Delete operation not yet implemented" });
    } catch (error) {
      console.error("Error deleting hospital:", error);
      res.status(500).json({ error: "Failed to delete hospital" });
    }
  });

  // === Ambulance Routes ===
  app.get("/api/ambulances/hospital/:hospitalId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const ambulances = await storage.getAmbulancesByHospitalId(req.params.hospitalId);
      res.json(ambulances);
    } catch (error) {
      console.error("Error fetching ambulances:", error);
      res.status(500).json({ error: "Failed to fetch ambulances" });
    }
  });

  app.get("/api/ambulances/fall-event/:fallEventId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const ambulance = await storage.getAmbulanceByFallEventId(req.params.fallEventId);
      if (!ambulance) {
        return res.status(404).json({ error: "No ambulance found for this fall event" });
      }
      res.json(ambulance);
    } catch (error) {
      console.error("Error fetching ambulance:", error);
      res.status(500).json({ error: "Failed to fetch ambulance" });
    }
  });

  app.get("/api/ambulances/:id", isAuthenticatedTraditional, async (req, res) => {
    try {
      const ambulance = await storage.getAmbulance(req.params.id);
      if (!ambulance) {
        return res.status(404).json({ error: "Ambulance not found" });
      }
      res.json(ambulance);
    } catch (error) {
      console.error("Error fetching ambulance:", error);
      res.status(500).json({ error: "Failed to fetch ambulance" });
    }
  });

  app.post("/api/ambulances", isAuthenticatedTraditional, isAdmin, async (req, res) => {
    try {
      const data = insertAmbulanceSchema.parse(req.body);
      const ambulance = await storage.createAmbulance(data);
      res.json(ambulance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating ambulance:", error);
      res.status(500).json({ error: "Failed to create ambulance" });
    }
  });

  app.post("/api/ambulances/dispatch", isAuthenticatedTraditional, async (req, res) => {
    try {
      const dispatchSchema = z.object({
        ambulanceId: z.string(),
        fallEventId: z.string(),
        destination: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      });

      const { ambulanceId, fallEventId, destination } = dispatchSchema.parse(req.body);

      const ambulance = await storage.dispatchAmbulance(ambulanceId, fallEventId, destination);
      if (!ambulance) {
        return res.status(404).json({ error: "Ambulance not found" });
      }

      // Emit WebSocket event for live tracking
      io.emit("ambulance_dispatched", ambulance);
      
      res.json(ambulance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error dispatching ambulance:", error);
      res.status(500).json({ error: "Failed to dispatch ambulance" });
    }
  });

  app.patch("/api/ambulances/:id", isAuthenticatedTraditional, async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["available", "dispatched", "en_route", "arrived", "completed"]).optional(),
        currentLocation: z.object({ 
          lat: z.number(), 
          lng: z.number(), 
          timestamp: z.string() 
        }).optional(),
        speed: z.number().optional(),
        distanceRemaining: z.number().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const ambulance = await storage.updateAmbulance(req.params.id, updates);
      if (!ambulance) {
        return res.status(404).json({ error: "Ambulance not found" });
      }

      // Emit WebSocket event for live tracking updates
      io.emit("ambulance_updated", ambulance);
      
      res.json(ambulance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating ambulance:", error);
      res.status(500).json({ error: "Failed to update ambulance" });
    }
  });

  app.delete("/api/ambulances/:id", isAuthenticatedTraditional, isAdmin, async (req, res) => {
    try {
      const ambulance = await storage.getAmbulance(req.params.id);
      if (!ambulance) {
        return res.status(404).json({ error: "Ambulance not found" });
      }
      // Note: Delete implementation requires adding deleteAmbulance to storage interface
      res.status(501).json({ error: "Delete operation not yet implemented" });
    } catch (error) {
      console.error("Error deleting ambulance:", error);
      res.status(500).json({ error: "Failed to delete ambulance" });
    }
  });

  // === Vitals Routes ===
  app.post("/api/vitals", isAuthenticatedTraditional, async (req, res) => {
    try {
      const data = insertVitalsLogSchema.parse(req.body);
      const vitals = await storage.createVitalsLog(data);
      
      // Get parent to find the associated user for WebSocket notification
      const parent = await storage.getParent(vitals.parentId);
      if (parent) {
        io.to(`user:${parent.userId}`).emit("vitals_updated", vitals);
      }
      
      res.json(vitals);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating vitals log:", error);
      res.status(500).json({ error: "Failed to create vitals log" });
    }
  });

  app.get("/api/vitals/latest/:parentId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const vitals = await storage.getLatestVitals(req.params.parentId);
      res.json(vitals || null);
    } catch (error) {
      console.error("Error fetching latest vitals:", error);
      res.status(500).json({ error: "Failed to fetch latest vitals" });
    }
  });

  app.get("/api/vitals/:parentId", isAuthenticatedTraditional, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const vitals = await storage.getVitalsByParentId(req.params.parentId, limit);
      res.json(vitals);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      res.status(500).json({ error: "Failed to fetch vitals" });
    }
  });

  app.delete("/api/vitals/:id", isAuthenticatedTraditional, isAdmin, async (req, res) => {
    try {
      // Note: Delete implementation requires adding deleteVitalsLog to storage interface
      res.status(501).json({ error: "Delete operation not yet implemented" });
    } catch (error) {
      console.error("Error deleting vitals log:", error);
      res.status(500).json({ error: "Failed to delete vitals log" });
    }
  });

  // === Monitoring Session Routes ===
  app.post("/api/monitoring/start", isAuthenticatedTraditional, async (req, res) => {
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

  app.post("/api/monitoring/:id/end", isAuthenticatedTraditional, async (req, res) => {
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
