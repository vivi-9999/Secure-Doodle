import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const trustedDevicesTable = pgTable("trusted_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  deviceToken: text("device_token").notNull().unique(),
  deviceName: text("device_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TrustedDevice = typeof trustedDevicesTable.$inferSelect;
