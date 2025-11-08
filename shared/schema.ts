import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - supports both Replit Auth and traditional auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("user"), // 'admin' or 'user'
  username: text("username").unique(),
  password: text("password"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const parents = pgTable("parents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  age: integer("age"),
  address: text("address"),
  phoneNumber: text("phone_number"),
  emergencyContact: text("emergency_contact"),
  medicalConditions: text("medical_conditions").array(),
  monitoringMode: text("monitoring_mode").default("skeletal"), // 'skeletal' or 'normal'
  localOnly: boolean("local_only").default(true),
  autoDelete: boolean("auto_delete").default(true),
  hospitalApiEnabled: boolean("hospital_api_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fallEvents = pgTable("fall_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => parents.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(), // 'fall', 'distress', 'motion_alert'
  confidence: real("confidence").notNull(), // 0-100
  status: text("status").notNull().default("pending"), // 'pending', 'acknowledged', 'false_alarm', 'dispatched', 'resolved'
  location: text("location"),
  gpsCoordinates: jsonb("gps_coordinates").$type<{ lat: number; lng: number; accuracy?: number }>(),
  snapshot: text("snapshot"),
  vitals: jsonb("vitals").$type<{
    heartRate?: number;
    breathing?: number;
    motion?: string;
  }>(),
  keypointMetrics: jsonb("keypoint_metrics").$type<{
    verticalVelocity?: number;
    bodyAngle?: number;
    aspectRatio?: number;
    headToHipDistance?: number;
  }>(),
  motionWindow: jsonb("motion_window").$type<{
    startTime: string;
    endTime: string;
    movementDetected: boolean;
    avgMovement: number;
  }>(),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  responseTime: integer("response_time"), // seconds
  notes: text("notes"),
  autoDeletedAt: timestamp("auto_deleted_at"),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fallEventId: varchar("fall_event_id").notNull().references(() => fallEvents.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'push', 'sms', 'email'
  status: text("status").notNull().default("sent"), // 'sent', 'delivered', 'read'
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  message: text("message"),
});

export const monitoringSessions = pgTable("monitoring_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => parents.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // seconds
  fallsDetected: integer("falls_detected").default(0),
  averageConfidence: real("average_confidence"),
  status: text("status").default("active"), // 'active', 'paused', 'ended'
});

// Hospitals table for emergency dispatch
export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  emergencyPhone: text("emergency_phone"),
  gpsCoordinates: jsonb("gps_coordinates").$type<{ lat: number; lng: number }>().notNull(),
  specializations: text("specializations").array(), // 'cardiology', 'neurology', 'trauma', etc
  availability: text("availability").default("24/7"), // '24/7', 'limited', 'closed'
  rating: real("rating"), // 1-5 stars
  distanceKm: real("distance_km"), // calculated distance from patient
  estimatedArrivalMin: integer("estimated_arrival_min"), // estimated ambulance arrival time
  createdAt: timestamp("created_at").defaultNow(),
});

// Ambulances table for live tracking
export const ambulances = pgTable("ambulances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id),
  fallEventId: varchar("fall_event_id").references(() => fallEvents.id),
  vehicleNumber: text("vehicle_number").notNull(),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  status: text("status").notNull().default("available"), // 'available', 'dispatched', 'en_route', 'arrived', 'returning'
  currentLocation: jsonb("current_location").$type<{ lat: number; lng: number; timestamp: string }>(),
  destinationLocation: jsonb("destination_location").$type<{ lat: number; lng: number }>(),
  dispatchedAt: timestamp("dispatched_at"),
  arrivedAt: timestamp("arrived_at"),
  estimatedArrival: timestamp("estimated_arrival"),
  speed: real("speed"), // km/h
  distanceRemaining: real("distance_remaining"), // km
  route: jsonb("route").$type<Array<{ lat: number; lng: number }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vitals monitoring table for dynamic updates
export const vitalsLog = pgTable("vitals_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => parents.id),
  fallEventId: varchar("fall_event_id").references(() => fallEvents.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  heartRate: integer("heart_rate"), // bpm
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  oxygenSaturation: real("oxygen_saturation"), // SpO2 percentage
  respiratoryRate: integer("respiratory_rate"), // breaths per minute
  temperature: real("temperature"), // celsius
  glucoseLevel: integer("glucose_level"), // mg/dL
  status: text("status").default("normal"), // 'normal', 'warning', 'critical'
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  createdAt: true,
});

export const insertFallEventSchema = createInsertSchema(fallEvents).omit({
  id: true,
  timestamp: true,
  acknowledgedAt: true,
  autoDeletedAt: true,
}).extend({
  confidence: z.number().min(0).max(100),
  type: z.enum(["fall", "distress", "motion_alert"]),
  status: z.enum(["pending", "acknowledged", "false_alarm", "dispatched", "resolved"]).optional(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  readAt: true,
});

export const insertMonitoringSessionSchema = createInsertSchema(monitoringSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
});

export const insertAmbulanceSchema = createInsertSchema(ambulances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVitalsLogSchema = createInsertSchema(vitalsLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;

export type FallEvent = typeof fallEvents.$inferSelect;
export type InsertFallEvent = z.infer<typeof insertFallEventSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type MonitoringSession = typeof monitoringSessions.$inferSelect;
export type InsertMonitoringSession = z.infer<typeof insertMonitoringSessionSchema>;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export type Ambulance = typeof ambulances.$inferSelect;
export type InsertAmbulance = z.infer<typeof insertAmbulanceSchema>;

export type VitalsLog = typeof vitalsLog.$inferSelect;
export type InsertVitalsLog = z.infer<typeof insertVitalsLogSchema>;
