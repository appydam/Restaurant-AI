import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: jsonb("address").notNull(),
  cuisineTypes: text("cuisine_types").array().notNull().default([]),
  contactInfo: jsonb("contact_info").notNull(),
  ratings: jsonb("ratings").notNull(),
  operatingHours: jsonb("operating_hours").notNull(),
  priceRange: text("price_range").notNull(),
  amenities: text("amenities").array().notNull().default([]),
  dataSources: jsonb("data_sources").notNull(),
  status: text("status").notNull().default("pending"),
  completeness: decimal("completeness", { precision: 5, scale: 2 }).default("0.00"),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).default("0.00"),
  extractedAt: timestamp("extracted_at").notNull().defaultNow(),
  validatedAt: timestamp("validated_at"),
  website: text("website"),
  description: text("description"),
});

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("idle"),
  config: jsonb("config").notNull(),
  metrics: jsonb("metrics").notNull(),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  config: jsonb("config").notNull(),
  status: text("status").notNull().default("active"),
  lastSync: timestamp("last_sync"),
  totalRecords: integer("total_records").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const processingQueue = pgTable("processing_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantName: text("restaurant_name").notNull(),
  sourceUrl: text("source_url"),
  location: text("location"),
  status: text("status").notNull().default("queued"),
  agentId: varchar("agent_id").references(() => agents.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const extractionLogs = pgTable("extraction_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id),
  agentId: varchar("agent_id").references(() => agents.id),
  action: text("action").notNull(),
  status: text("status").notNull(),
  duration: integer("duration"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalRestaurants: integer("total_restaurants").notNull().default(0),
  activeAgents: integer("active_agents").notNull().default(0),
  processingRate: integer("processing_rate").notNull().default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0.00"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  extractedAt: true,
  validatedAt: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  lastActivity: true,
  createdAt: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  lastSync: true,
  createdAt: true,
});

export const insertProcessingQueueSchema = createInsertSchema(processingQueue).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
});

// Types
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

export type ProcessingQueue = typeof processingQueue.$inferSelect;
export type InsertProcessingQueue = z.infer<typeof insertProcessingQueueSchema>;

export type ExtractionLog = typeof extractionLogs.$inferSelect;
export type SystemMetrics = typeof systemMetrics.$inferSelect;

// Utility types for API responses
export interface RestaurantData {
  restaurantId: string;
  name: string;
  address: {
    street?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  cuisineTypes: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  ratings: {
    average?: number;
    total?: number;
    sources: Record<string, { rating: number; count: number }>;
  };
  operatingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  priceRange: "budget" | "mid-range" | "fine-dining" | "luxury";
  amenities: string[];
  dataSources: Array<{
    source: string;
    url?: string;
    extractedAt: string;
    reliability: number;
  }>;
}

export interface AgentStatus {
  id: string;
  name: string;
  type: "web-scraper" | "data-extractor" | "schema-validator" | "gemini-llm";
  status: "idle" | "active" | "processing" | "error";
  metrics: {
    requestsToday?: number;
    successRate?: number;
    avgResponseTime?: number;
    totalProcessed?: number;
  };
  lastActivity?: string;
}

export interface PipelineMetrics {
  totalRestaurants: number;
  activeAgents: number;
  processingRate: number;
  successRate: number;
  lastUpdate: string;
}
