import { pgTable, serial, text, numeric, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  accountNumber: varchar("account_number", { length: 20 }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  pinHash: text("pin_hash").notNull(),
  duressPinHash: text("duress_pin_hash"),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  panCard: text("pan_card").notNull(),
  aadhaar: text("aadhaar").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, accountNumber: true, balance: true, status: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
