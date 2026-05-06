import { pgTable, serial, integer, numeric, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  encryptedData: text("encrypted_data").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("success"),
  lockExpiresAt: timestamp("lock_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Transaction = typeof transactionsTable.$inferSelect;
