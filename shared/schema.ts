import { pgTable, text, serial, integer, boolean, date, timestamp, time, numeric, uniqueIndex, foreignKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with role-based system
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  workId: text("work_id").notNull().unique(),
  nationalId: text("national_id"),
  phoneNumber: text("phone_number"),
  password: text("password").notNull(),
  role: text("role", { enum: ["Admin", "Manager", "SalesStaff", "TeamLeader", "Agent"] }).notNull(),
  managerId: integer("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Groups for team-based agents
export const agentGroups = pgTable("agent_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  salesStaffId: integer("sales_staff_id").references(() => users.id).notNull(),
  leaderId: integer("leader_id").references(() => users.id), // Must have role = TeamLeader
  isActive: boolean("is_active").default(true),
});

// Join table for agents in groups
export const agentGroupMembers = pgTable("agent_group_members", {
  groupId: integer("group_id").references(() => agentGroups.id).notNull(),
  agentId: integer("agent_id").references(() => users.id).notNull(),
}, (t) => ({
  pk: uniqueIndex("agent_group_members_pk").on(t.groupId, t.agentId),
}));

// Clients managed by agents
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nationalId: text("national_id"),
  phone: text("phone"),
  insuranceProduct: text("insurance_product"),
  paymentMethod: text("payment_method"),
  feePaid: numeric("fee_paid"),
  location: text("location"),
  agentId: integer("agent_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent attendance tracking
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  sector: text("sector"),
  location: text("location"),
  checkInTime: timestamp("check_in_time").defaultNow(),
});

// Attendance time frames set by managers
export const attendanceTimeFrames = pgTable("attendance_time_frames", {
  id: serial("id").primaryKey(),
  managerId: integer("manager_id").references(() => users.id).notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily reports from agents
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  comment: text("comment"),
  clientsData: json("clients_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Help requests
export const helpRequests = pgTable("help_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .partial({ nationalId: true, phoneNumber: true, managerId: true });

export const insertClientSchema = createInsertSchema(clients)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ nationalId: true, phone: true, insuranceProduct: true, paymentMethod: true, feePaid: true, location: true });

export const insertAgentGroupSchema = createInsertSchema(agentGroups)
  .omit({ id: true })
  .partial({ leaderId: true });

export const insertAgentGroupMemberSchema = createInsertSchema(agentGroupMembers);

export const insertAttendanceSchema = createInsertSchema(attendance)
  .omit({ id: true, checkInTime: true })
  .partial({ sector: true, location: true });

export const insertAttendanceTimeFrameSchema = createInsertSchema(attendanceTimeFrames)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertDailyReportSchema = createInsertSchema(dailyReports)
  .omit({ id: true, createdAt: true })
  .partial({ comment: true, clientsData: true });

export const insertHelpRequestSchema = createInsertSchema(helpRequests)
  .omit({ id: true, resolved: true, createdAt: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, read: true, sentAt: true });

// Login schema
export const loginSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type AgentGroup = typeof agentGroups.$inferSelect;
export type InsertAgentGroup = z.infer<typeof insertAgentGroupSchema>;
export type AgentGroupMember = typeof agentGroupMembers.$inferSelect;
export type InsertAgentGroupMember = z.infer<typeof insertAgentGroupMemberSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceTimeFrame = typeof attendanceTimeFrames.$inferSelect;
export type InsertAttendanceTimeFrame = z.infer<typeof insertAttendanceTimeFrameSchema>;

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;

export type HelpRequest = typeof helpRequests.$inferSelect;
export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
