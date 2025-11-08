import {
  type User,
  type InsertUser,
  type UpsertUser,
  type Parent,
  type InsertParent,
  type FallEvent,
  type InsertFallEvent,
  type Alert,
  type InsertAlert,
  type MonitoringSession,
  type InsertMonitoringSession,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Parent methods
  getParent(id: string): Promise<Parent | undefined>;
  getParentsByUserId(userId: string): Promise<Parent[]>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: string, updates: Partial<InsertParent>): Promise<Parent | undefined>;

  // Fall Event methods
  getFallEvent(id: string): Promise<FallEvent | undefined>;
  getFallEventsByParentId(parentId: string, limit?: number): Promise<FallEvent[]>;
  createFallEvent(fallEvent: InsertFallEvent): Promise<FallEvent>;
  updateFallEvent(id: string, updates: Partial<FallEvent>): Promise<FallEvent | undefined>;
  acknowledgeFallEvent(id: string, userId: string): Promise<FallEvent | undefined>;

  // Alert methods
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlertsByUserId(userId: string): Promise<Alert[]>;
  markAlertAsRead(id: string): Promise<Alert | undefined>;

  // Monitoring Session methods
  getActiveSession(parentId: string): Promise<MonitoringSession | undefined>;
  createMonitoringSession(session: InsertMonitoringSession): Promise<MonitoringSession>;
  endMonitoringSession(id: string): Promise<MonitoringSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private parents: Map<string, Parent>;
  private fallEvents: Map<string, FallEvent>;
  private alerts: Map<string, Alert>;
  private monitoringSessions: Map<string, MonitoringSession>;

  constructor() {
    this.users = new Map();
    this.parents = new Map();
    this.fallEvents = new Map();
    this.alerts = new Map();
    this.monitoringSessions = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id, 
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      role: insertUser.role ?? "user",
      username: insertUser.username ?? null,
      password: insertUser.password ?? null,
      phone: insertUser.phone ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(upsertData: UpsertUser): Promise<User> {
    const existingId = upsertData.id ?? "";
    const existing = this.users.get(existingId);
    
    if (existing) {
      const updated: User = {
        ...existing,
        email: upsertData.email !== undefined ? (upsertData.email ?? null) : existing.email,
        firstName: upsertData.firstName !== undefined ? (upsertData.firstName ?? null) : existing.firstName,
        lastName: upsertData.lastName !== undefined ? (upsertData.lastName ?? null) : existing.lastName,
        profileImageUrl: upsertData.profileImageUrl !== undefined ? (upsertData.profileImageUrl ?? null) : existing.profileImageUrl,
        updatedAt: new Date(),
      };
      this.users.set(existingId, updated);
      return updated;
    } else {
      const newUser: User = {
        id: existingId,
        email: upsertData.email ?? null,
        firstName: upsertData.firstName ?? null,
        lastName: upsertData.lastName ?? null,
        profileImageUrl: upsertData.profileImageUrl ?? null,
        role: "user",
        username: null,
        password: null,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(existingId, newUser);
      return newUser;
    }
  }

  // Parent methods
  async getParent(id: string): Promise<Parent | undefined> {
    return this.parents.get(id);
  }

  async getParentsByUserId(userId: string): Promise<Parent[]> {
    return Array.from(this.parents.values()).filter(
      (parent) => parent.userId === userId
    );
  }

  async createParent(insertParent: InsertParent): Promise<Parent> {
    const id = randomUUID();
    const parent: Parent = {
      id,
      userId: insertParent.userId,
      name: insertParent.name,
      age: insertParent.age ?? null,
      address: insertParent.address ?? null,
      phoneNumber: insertParent.phoneNumber ?? null,
      emergencyContact: insertParent.emergencyContact ?? null,
      medicalConditions: insertParent.medicalConditions ?? null,
      monitoringMode: insertParent.monitoringMode ?? "skeletal",
      localOnly: insertParent.localOnly ?? true,
      autoDelete: insertParent.autoDelete ?? true,
      hospitalApiEnabled: insertParent.hospitalApiEnabled ?? true,
      createdAt: new Date(),
    };
    this.parents.set(id, parent);
    return parent;
  }

  async updateParent(id: string, updates: Partial<InsertParent>): Promise<Parent | undefined> {
    const parent = this.parents.get(id);
    if (!parent) return undefined;

    const updated = { ...parent, ...updates };
    this.parents.set(id, updated);
    return updated;
  }

  // Fall Event methods
  async getFallEvent(id: string): Promise<FallEvent | undefined> {
    return this.fallEvents.get(id);
  }

  async getFallEventsByParentId(parentId: string, limit = 50): Promise<FallEvent[]> {
    return Array.from(this.fallEvents.values())
      .filter((event) => event.parentId === parentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createFallEvent(insertEvent: InsertFallEvent): Promise<FallEvent> {
    const id = randomUUID();
    const fallEvent: FallEvent = {
      id,
      parentId: insertEvent.parentId,
      timestamp: new Date(),
      type: insertEvent.type,
      confidence: insertEvent.confidence,
      status: insertEvent.status ?? "pending",
      location: insertEvent.location ?? null,
      gpsCoordinates: (insertEvent.gpsCoordinates ?? null) as { lat: number; lng: number; accuracy?: number } | null,
      snapshot: insertEvent.snapshot ?? null,
      vitals: (insertEvent.vitals ?? null) as { heartRate?: number; breathing?: number; motion?: string } | null,
      keypointMetrics: (insertEvent.keypointMetrics ?? null) as { verticalVelocity?: number; bodyAngle?: number; aspectRatio?: number; headToHipDistance?: number } | null,
      motionWindow: (insertEvent.motionWindow ?? null) as { startTime: string; endTime: string; movementDetected: boolean; avgMovement: number } | null,
      acknowledgedAt: null,
      acknowledgedBy: null,
      responseTime: null,
      notes: null,
      autoDeletedAt: null,
    };
    this.fallEvents.set(id, fallEvent);
    return fallEvent;
  }

  async updateFallEvent(id: string, updates: Partial<FallEvent>): Promise<FallEvent | undefined> {
    const event = this.fallEvents.get(id);
    if (!event) return undefined;

    const updated = { ...event, ...updates };
    this.fallEvents.set(id, updated);
    return updated;
  }

  async acknowledgeFallEvent(id: string, userId: string): Promise<FallEvent | undefined> {
    const event = this.fallEvents.get(id);
    if (!event) return undefined;

    const responseTime = Math.floor((Date.now() - event.timestamp.getTime()) / 1000);
    const updated = {
      ...event,
      status: "acknowledged" as const,
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
      responseTime,
    };
    this.fallEvents.set(id, updated);
    return updated;
  }

  // Alert methods
  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      ...insertAlert,
      id,
      status: insertAlert.status || "sent",
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
      message: insertAlert.message || null,
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getAlertsByUserId(userId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter((alert) => alert.userId === userId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;

    const updated = { ...alert, status: "read" as const, readAt: new Date() };
    this.alerts.set(id, updated);
    return updated;
  }

  // Monitoring Session methods
  async getActiveSession(parentId: string): Promise<MonitoringSession | undefined> {
    return Array.from(this.monitoringSessions.values()).find(
      (session) => session.parentId === parentId && session.status === "active"
    );
  }

  async createMonitoringSession(insertSession: InsertMonitoringSession): Promise<MonitoringSession> {
    const id = randomUUID();
    const session: MonitoringSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      endedAt: null,
      duration: null,
      fallsDetected: 0,
      averageConfidence: null,
      status: "active",
    };
    this.monitoringSessions.set(id, session);
    return session;
  }

  async endMonitoringSession(id: string): Promise<MonitoringSession | undefined> {
    const session = this.monitoringSessions.get(id);
    if (!session) return undefined;

    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);
    
    const updated = {
      ...session,
      endedAt,
      duration,
      status: "ended" as const,
    };
    this.monitoringSessions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
