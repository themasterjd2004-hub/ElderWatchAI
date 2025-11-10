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
  type Hospital,
  type InsertHospital,
  type Ambulance,
  type InsertAmbulance,
  type VitalsLog,
  type InsertVitalsLog,
  type Camera,
  type InsertCamera,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Parent methods
  getParent(id: string): Promise<Parent | undefined>;
  getParentsByUserId(userId: string): Promise<Parent[]>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: string, updates: Partial<InsertParent>): Promise<Parent | undefined>;

  // Camera methods
  getCamera(id: string): Promise<Camera | undefined>;
  getCamerasByParentId(parentId: string): Promise<Camera[]>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: string, updates: Partial<InsertCamera>): Promise<Camera | undefined>;
  deleteCamera(id: string): Promise<boolean>;

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

  // Hospital methods
  getHospital(id: string): Promise<Hospital | undefined>;
  getAllHospitals(): Promise<Hospital[]>;
  getNearestHospitals(lat: number, lng: number, limit?: number): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital | undefined>;

  // Ambulance methods
  getAmbulance(id: string): Promise<Ambulance | undefined>;
  getAmbulancesByHospitalId(hospitalId: string): Promise<Ambulance[]>;
  getAmbulanceByFallEventId(fallEventId: string): Promise<Ambulance | undefined>;
  createAmbulance(ambulance: InsertAmbulance): Promise<Ambulance>;
  updateAmbulance(id: string, updates: Partial<Ambulance>): Promise<Ambulance | undefined>;
  dispatchAmbulance(ambulanceId: string, fallEventId: string, destination: { lat: number; lng: number }): Promise<Ambulance | undefined>;

  // Vitals methods
  createVitalsLog(vitals: InsertVitalsLog): Promise<VitalsLog>;
  getLatestVitals(parentId: string): Promise<VitalsLog | undefined>;
  getVitalsByParentId(parentId: string, limit?: number): Promise<VitalsLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private parents: Map<string, Parent>;
  private cameras: Map<string, Camera>;
  private fallEvents: Map<string, FallEvent>;
  private alerts: Map<string, Alert>;
  private monitoringSessions: Map<string, MonitoringSession>;
  private hospitals: Map<string, Hospital>;
  private ambulances: Map<string, Ambulance>;
  private vitalsLogs: Map<string, VitalsLog>;

  constructor() {
    this.users = new Map();
    this.parents = new Map();
    this.cameras = new Map();
    this.fallEvents = new Map();
    this.alerts = new Map();
    this.monitoringSessions = new Map();
    this.hospitals = new Map();
    this.ambulances = new Map();
    this.vitalsLogs = new Map();
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.toLowerCase();
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
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

  // Camera methods
  async getCamera(id: string): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async getCamerasByParentId(parentId: string): Promise<Camera[]> {
    return Array.from(this.cameras.values()).filter(
      (camera) => camera.parentId === parentId
    );
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = randomUUID();
    const camera: Camera = {
      id,
      parentId: insertCamera.parentId,
      roomName: insertCamera.roomName,
      location: insertCamera.location ?? null,
      deviceId: insertCamera.deviceId ?? null,
      isActive: insertCamera.isActive ?? true,
      isPrimary: insertCamera.isPrimary ?? false,
      createdAt: new Date(),
    };
    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: string, updates: Partial<InsertCamera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) return undefined;

    const updated = { ...camera, ...updates };
    this.cameras.set(id, updated);
    return updated;
  }

  async deleteCamera(id: string): Promise<boolean> {
    return this.cameras.delete(id);
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

  // Hospital methods
  async getHospital(id: string): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  // AI-based nearest hospital detection using Haversine formula
  async getNearestHospitals(lat: number, lng: number, limit = 5): Promise<Hospital[]> {
    const hospitals = Array.from(this.hospitals.values());
    
    // Calculate distance for each hospital
    const hospitalsWithDistance = hospitals.map(hospital => {
      const distance = this.calculateDistance(lat, lng, hospital.gpsCoordinates.lat, hospital.gpsCoordinates.lng);
      return { ...hospital, distanceKm: distance };
    });

    // Sort by distance and return top N
    return hospitalsWithDistance
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, limit);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async createHospital(insertHospital: InsertHospital): Promise<Hospital> {
    const id = randomUUID();
    const hospital: Hospital = {
      id,
      name: insertHospital.name,
      address: insertHospital.address,
      phone: insertHospital.phone,
      emergencyPhone: insertHospital.emergencyPhone ?? null,
      gpsCoordinates: insertHospital.gpsCoordinates,
      specializations: insertHospital.specializations ?? null,
      availability: insertHospital.availability ?? "24/7",
      rating: insertHospital.rating ?? null,
      distanceKm: insertHospital.distanceKm ?? null,
      estimatedArrivalMin: insertHospital.estimatedArrivalMin ?? null,
      createdAt: new Date(),
    };
    this.hospitals.set(id, hospital);
    return hospital;
  }

  async updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital | undefined> {
    const hospital = this.hospitals.get(id);
    if (!hospital) return undefined;

    const updated = { ...hospital, ...updates };
    this.hospitals.set(id, updated);
    return updated;
  }

  // Ambulance methods
  async getAmbulance(id: string): Promise<Ambulance | undefined> {
    return this.ambulances.get(id);
  }

  async getAmbulancesByHospitalId(hospitalId: string): Promise<Ambulance[]> {
    return Array.from(this.ambulances.values())
      .filter(ambulance => ambulance.hospitalId === hospitalId);
  }

  async getAmbulanceByFallEventId(fallEventId: string): Promise<Ambulance | undefined> {
    return Array.from(this.ambulances.values())
      .find(ambulance => ambulance.fallEventId === fallEventId);
  }

  async createAmbulance(insertAmbulance: InsertAmbulance): Promise<Ambulance> {
    const id = randomUUID();
    const ambulance: Ambulance = {
      id,
      hospitalId: insertAmbulance.hospitalId,
      fallEventId: insertAmbulance.fallEventId ?? null,
      vehicleNumber: insertAmbulance.vehicleNumber,
      driverName: insertAmbulance.driverName ?? null,
      driverPhone: insertAmbulance.driverPhone ?? null,
      status: insertAmbulance.status ?? "available",
      currentLocation: insertAmbulance.currentLocation ?? null,
      destinationLocation: insertAmbulance.destinationLocation ?? null,
      dispatchedAt: null,
      arrivedAt: null,
      estimatedArrival: null,
      speed: null,
      distanceRemaining: null,
      route: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ambulances.set(id, ambulance);
    return ambulance;
  }

  async updateAmbulance(id: string, updates: Partial<Ambulance>): Promise<Ambulance | undefined> {
    const ambulance = this.ambulances.get(id);
    if (!ambulance) return undefined;

    const updated = { ...ambulance, ...updates, updatedAt: new Date() };
    this.ambulances.set(id, updated);
    return updated;
  }

  async dispatchAmbulance(ambulanceId: string, fallEventId: string, destination: { lat: number; lng: number }): Promise<Ambulance | undefined> {
    const ambulance = this.ambulances.get(ambulanceId);
    if (!ambulance) return undefined;

    const now = new Date();
    const estimatedArrival = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    const updated: Ambulance = {
      ...ambulance,
      fallEventId,
      status: "dispatched",
      destinationLocation: destination,
      dispatchedAt: now,
      estimatedArrival,
      updatedAt: now,
    };

    this.ambulances.set(ambulanceId, updated);
    return updated;
  }

  // Vitals methods
  async createVitalsLog(insertVitals: InsertVitalsLog): Promise<VitalsLog> {
    const id = randomUUID();
    const vitals: VitalsLog = {
      id,
      parentId: insertVitals.parentId,
      fallEventId: insertVitals.fallEventId ?? null,
      timestamp: new Date(),
      heartRate: insertVitals.heartRate ?? null,
      bloodPressureSystolic: insertVitals.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: insertVitals.bloodPressureDiastolic ?? null,
      oxygenSaturation: insertVitals.oxygenSaturation ?? null,
      respiratoryRate: insertVitals.respiratoryRate ?? null,
      temperature: insertVitals.temperature ?? null,
      glucoseLevel: insertVitals.glucoseLevel ?? null,
      status: insertVitals.status ?? "normal",
    };
    this.vitalsLogs.set(id, vitals);
    return vitals;
  }

  async getLatestVitals(parentId: string): Promise<VitalsLog | undefined> {
    const vitals = Array.from(this.vitalsLogs.values())
      .filter(v => v.parentId === parentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return vitals[0];
  }

  async getVitalsByParentId(parentId: string, limit = 50): Promise<VitalsLog[]> {
    return Array.from(this.vitalsLogs.values())
      .filter(v => v.parentId === parentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

import { DatabaseStorage } from "./db-storage";

// Use database storage for production-ready emergency response system
export const storage = new DatabaseStorage();

// MemStorage is kept for reference/testing but not used
export const memStorage = new MemStorage();
