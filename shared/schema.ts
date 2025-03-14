import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for authentication if needed)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// DataSource table to save frequently used S3 buckets
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  type: text("type").notNull(), // 's3', 'azure_blob', 'minio'
  createdAt: text("created_at").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertDataSourceSchema = createInsertSchema(dataSources).pick({
  name: true,
  path: true,
  type: true,
  userId: true
}).extend({
  createdAt: z.string().optional(),
});

// Recently viewed tables
export const recentTables = pgTable("recent_tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  format: text("format").notNull(), // 'parquet', 'iceberg', 'delta', 'hudi'
  lastViewed: text("last_viewed").notNull(),
  metadata: jsonb("metadata"), // Store any additional metadata
  userId: integer("user_id").references(() => users.id),
});

export const insertRecentTableSchema = createInsertSchema(recentTables).pick({
  name: true,
  path: true,
  format: true,
  userId: true,
  metadata: true,
}).extend({
  lastViewed: z.string().optional(),
});

// Types for API responses
export const tableSchemaField = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  partitionKey: z.boolean(),
  description: z.string().optional(),
});

export const tableSchema = z.object({
  fields: z.array(tableSchemaField),
  formatVersion: z.string().optional(),
  lastModified: z.string().optional(),
});

export const tablePartition = z.object({
  name: z.string(),
  value: z.string(),
  size: z.number().optional(),
  fileCount: z.number().optional(),
  rowCount: z.number().optional(),
  children: z.array(z.lazy(() => tablePartition)).optional(),
});

export const tableVersion = z.object({
  id: z.string(),
  timestamp: z.string(),
  operation: z.string().optional(),
  author: z.string().optional(),
  changes: z.record(z.string(), z.any()).optional(),
  isLatest: z.boolean().optional(),
});

export const tableProperties = z.object({
  format: z.string(),
  formatVersion: z.string().optional(),
  location: z.string(),
  manifestFiles: z.array(z.object({
    path: z.string(),
    size: z.number(),
  })).optional(),
  snapshotInfo: z.record(z.string(), z.any()).optional(),
  formatConfig: z.record(z.string(), z.any()).optional(),
  metrics: z.record(z.string(), z.any()).optional(),
});

export const tableMetadata = z.object({
  name: z.string(),
  format: z.string(), // 'parquet', 'iceberg', 'delta', 'hudi'
  location: z.string(),
  lastModified: z.string(),
  size: z.number(),
  rowCount: z.number().optional(),
  fileCount: z.number().optional(),
  currentVersion: z.string().optional(),
  schema: tableSchema.optional(),
  partitions: z.array(tablePartition).optional(),
  versions: z.array(tableVersion).optional(),
  properties: tableProperties.optional(),
  sampleData: z.array(z.record(z.string(), z.any())).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;

export type InsertRecentTable = z.infer<typeof insertRecentTableSchema>;
export type RecentTable = typeof recentTables.$inferSelect;

export type TableSchemaField = z.infer<typeof tableSchemaField>;
export type TableSchema = z.infer<typeof tableSchema>;
export type TablePartition = z.infer<typeof tablePartition>;
export type TableVersion = z.infer<typeof tableVersion>;
export type TableProperties = z.infer<typeof tableProperties>;
export type TableMetadata = z.infer<typeof tableMetadata>;
