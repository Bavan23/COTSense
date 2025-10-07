import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Component schema for COTS parts
export const components = pgTable("components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partNumber: text("part_number").notNull(),
  manufacturer: text("manufacturer").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  specMatch: real("spec_match"),
  totalScore: real("total_score"),
  price: real("price"),
  stock: text("stock"),
  specifications: text("specifications"),
});

export const insertComponentSchema = createInsertSchema(components).omit({
  id: true,
});

export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type Component = typeof components.$inferSelect;

// Search history schema
export const searches = pgTable("searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  timestamp: text("timestamp").notNull(),
  resultsCount: integer("results_count"),
});

export const insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
});

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;

// API types for FastAPI backend integration
export interface RecommendRequest {
  query: string;
  top_k?: number;
}

export interface RecommendResponse {
  components: Component[];
  query: string;
  total: number;
}

export interface ExplainRequest {
  component_id: string;
  query: string;
}

export interface ExplainResponse {
  explanation: string;
  component_id: string;
}
