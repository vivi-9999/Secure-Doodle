import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Complaint = typeof complaintsTable.$inferSelect;
