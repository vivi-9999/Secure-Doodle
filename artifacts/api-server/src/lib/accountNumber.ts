import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function generateAccountNumber(): Promise<string> {
  const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM users`);
  const rows = result.rows as { cnt: string }[];
  const count = parseInt(rows[0]?.cnt ?? "0") + 1;
  const padded = String(count).padStart(6, "0");
  return `SB${new Date().getFullYear()}${padded}`;
}
