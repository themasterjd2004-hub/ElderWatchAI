import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
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
  gpsCoordinates: jsonb("gps_coordinates").$type<{ lat: number; lng: number }>(),
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

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;

export type FallEvent = typeof fallEvents.$inferSelect;
export type InsertFallEvent = z.infer<typeof insertFallEventSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type MonitoringSession = typeof monitoringSessions.$inferSelect;
export type InsertMonitoringSession = z.infer<typeof insertMonitoringSessionSchema>;
