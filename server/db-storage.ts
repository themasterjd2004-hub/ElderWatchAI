import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  parents,
  cameras,
  fallEvents,
  alerts,
  monitoringSessions,
  hospitals,
  ambulances,
  vitalsLog,
  type User,
  type InsertUser,
  type UpsertUser,
  type Parent,
  type InsertParent,
  type Camera,
  type InsertCamera,
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
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Case-insensitive email comparison
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(upsertData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(upsertData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: upsertData.email,
          firstName: upsertData.firstName,
          lastName: upsertData.lastName,
          profileImageUrl: upsertData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Parent methods
  async getParent(id: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent;
  }

  async getParentsByUserId(userId: string): Promise<Parent[]> {
    return db.select().from(parents).where(eq(parents.userId, userId));
  }

  async createParent(insertParent: InsertParent): Promise<Parent> {
    const [parent] = await db.insert(parents).values(insertParent).returning();
    return parent;
  }

  async updateParent(id: string, updates: Partial<InsertParent>): Promise<Parent | undefined> {
    const [updated] = await db
      .update(parents)
      .set(updates)
      .where(eq(parents.id, id))
      .returning();
    return updated;
  }

  // Camera methods
  async getCamera(id: string): Promise<Camera | undefined> {
    const [camera] = await db.select().from(cameras).where(eq(cameras.id, id));
    return camera;
  }

  async getCamerasByParentId(parentId: string): Promise<Camera[]> {
    return db.select().from(cameras).where(eq(cameras.parentId, parentId));
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const [camera] = await db.insert(cameras).values(insertCamera).returning();
    return camera;
  }

  async updateCamera(id: string, updates: Partial<InsertCamera>): Promise<Camera | undefined> {
    const [updated] = await db
      .update(cameras)
      .set(updates)
      .where(eq(cameras.id, id))
      .returning();
    return updated;
  }

  async deleteCamera(id: string): Promise<boolean> {
    const result = await db.delete(cameras).where(eq(cameras.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Fall Event methods
  async getFallEvent(id: string): Promise<FallEvent | undefined> {
    const [event] = await db.select().from(fallEvents).where(eq(fallEvents.id, id));
    return event;
  }

  async getFallEventsByParentId(parentId: string, limit = 50): Promise<FallEvent[]> {
    return db
      .select()
      .from(fallEvents)
      .where(eq(fallEvents.parentId, parentId))
      .orderBy(desc(fallEvents.timestamp))
      .limit(limit);
  }

  async createFallEvent(insertEvent: InsertFallEvent): Promise<FallEvent> {
    const [event] = await db.insert(fallEvents).values([insertEvent]).returning();
    return event;
  }

  async updateFallEvent(id: string, updates: Partial<FallEvent>): Promise<FallEvent | undefined> {
    const [updated] = await db
      .update(fallEvents)
      .set(updates)
      .where(eq(fallEvents.id, id))
      .returning();
    return updated;
  }

  async acknowledgeFallEvent(id: string, userId: string): Promise<FallEvent | undefined> {
    const event = await this.getFallEvent(id);
    if (!event) return undefined;

    const responseTime = Math.floor((Date.now() - event.timestamp.getTime()) / 1000);
    
    const [updated] = await db
      .update(fallEvents)
      .set({
        status: "acknowledged",
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        responseTime,
      })
      .where(eq(fallEvents.id, id))
      .returning();
    
    return updated;
  }

  // Alert methods
  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(insertAlert).returning();
    return alert;
  }

  async getAlertsByUserId(userId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.sentAt));
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    const [updated] = await db
      .update(alerts)
      .set({ status: "read", readAt: new Date() })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  // Monitoring Session methods
  async getActiveSession(parentId: string): Promise<MonitoringSession | undefined> {
    const [session] = await db
      .select()
      .from(monitoringSessions)
      .where(and(
        eq(monitoringSessions.parentId, parentId),
        eq(monitoringSessions.status, "active")
      ))
      .limit(1);
    return session;
  }

  async createMonitoringSession(insertSession: InsertMonitoringSession): Promise<MonitoringSession> {
    const [session] = await db
      .insert(monitoringSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async endMonitoringSession(id: string): Promise<MonitoringSession | undefined> {
    const session = await db.select().from(monitoringSessions).where(eq(monitoringSessions.id, id)).limit(1);
    if (!session[0]) return undefined;

    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - session[0].startedAt.getTime()) / 1000);
    
    const [updated] = await db
      .update(monitoringSessions)
      .set({
        endedAt,
        duration,
        status: "ended",
      })
      .where(eq(monitoringSessions.id, id))
      .returning();
    
    return updated;
  }

  // Hospital methods
  async getHospital(id: string): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return db.select().from(hospitals);
  }

  // AI-based nearest hospital detection using Haversine formula
  async getNearestHospitals(lat: number, lng: number, limit = 5): Promise<Hospital[]> {
    const allHospitals = await this.getAllHospitals();
    
    // Calculate distance for each hospital
    const hospitalsWithDistance = allHospitals.map(hospital => {
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
    const [hospital] = await db.insert(hospitals).values(insertHospital).returning();
    return hospital;
  }

  async updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital | undefined> {
    const [updated] = await db
      .update(hospitals)
      .set(updates)
      .where(eq(hospitals.id, id))
      .returning();
    return updated;
  }

  // Ambulance methods
  async getAmbulance(id: string): Promise<Ambulance | undefined> {
    const [ambulance] = await db.select().from(ambulances).where(eq(ambulances.id, id));
    return ambulance;
  }

  async getAmbulancesByHospitalId(hospitalId: string): Promise<Ambulance[]> {
    return db.select().from(ambulances).where(eq(ambulances.hospitalId, hospitalId));
  }

  async getAmbulanceByFallEventId(fallEventId: string): Promise<Ambulance | undefined> {
    const [ambulance] = await db
      .select()
      .from(ambulances)
      .where(eq(ambulances.fallEventId, fallEventId))
      .limit(1);
    return ambulance;
  }

  async createAmbulance(insertAmbulance: InsertAmbulance): Promise<Ambulance> {
    const [ambulance] = await db.insert(ambulances).values([insertAmbulance]).returning();
    return ambulance;
  }

  async updateAmbulance(id: string, updates: Partial<Ambulance>): Promise<Ambulance | undefined> {
    const [updated] = await db
      .update(ambulances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ambulances.id, id))
      .returning();
    return updated;
  }

  async dispatchAmbulance(ambulanceId: string, fallEventId: string, destination: { lat: number; lng: number }): Promise<Ambulance | undefined> {
    const now = new Date();
    const estimatedArrival = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    const [updated] = await db
      .update(ambulances)
      .set({
        fallEventId,
        status: "dispatched",
        destinationLocation: destination,
        dispatchedAt: now,
        estimatedArrival,
        updatedAt: now,
      })
      .where(eq(ambulances.id, ambulanceId))
      .returning();
    
    return updated;
  }

  // Vitals methods
  async createVitalsLog(insertVitals: InsertVitalsLog): Promise<VitalsLog> {
    const [vitals] = await db.insert(vitalsLog).values(insertVitals).returning();
    return vitals;
  }

  async getLatestVitals(parentId: string): Promise<VitalsLog | undefined> {
    const [vitals] = await db
      .select()
      .from(vitalsLog)
      .where(eq(vitalsLog.parentId, parentId))
      .orderBy(desc(vitalsLog.timestamp))
      .limit(1);
    return vitals;
  }

  async getVitalsByParentId(parentId: string, limit = 50): Promise<VitalsLog[]> {
    return db
      .select()
      .from(vitalsLog)
      .where(eq(vitalsLog.parentId, parentId))
      .orderBy(desc(vitalsLog.timestamp))
      .limit(limit);
  }
}
