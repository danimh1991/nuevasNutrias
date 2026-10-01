import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const children = sqliteTable("children", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  birthDate: text("birth_date").notNull(), sex: text("sex", { enum: ["male", "female"] }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const measurements = sqliteTable("measurements", {
  id: text("id").primaryKey(), childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(), measuredAt: text("measured_at").notNull(), weightGrams: integer("weight_grams"),
  heightMm: integer("height_mm"), headMm: integer("head_mm"), notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
