import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const children = sqliteTable("children", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  birthDate: text("birth_date").notNull(), sex: text("sex", { enum: ["male", "female"] }).notNull(),
  lastPeriodDate: text("last_period_date"), expectedBirthDate: text("expected_birth_date"), actualBirthDate: text("actual_birth_date"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const measurements = sqliteTable("measurements", {
  id: text("id").primaryKey(), childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(), measuredAt: text("measured_at").notNull(), weightGrams: integer("weight_grams"),
  heightMm: integer("height_mm"), headMm: integer("head_mm"), notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const leavePlans = sqliteTable("leave_plans", {
  childId: text("child_id").primaryKey().references(() => children.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(), periodsJson: text("periods_json").notNull(), holidaysJson: text("holidays_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const foodExposures = sqliteTable("food_exposures", {
  id: text("id").primaryKey(), childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(), allergenId: text("allergen_id").notNull(), dayIndex: integer("day_index").notNull(),
  exposedAt: text("exposed_at").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => ({ childAllergenDay: uniqueIndex("food_exposures_child_allergen_day").on(table.childId, table.allergenId, table.dayIndex) }));
