import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, transactionsTable, complaintsTable } from "@workspace/db";
import { AdminGetUsersQueryParams, AdminGetTransactionsQueryParams, AdminActivateUserParams, AdminRejectUserParams } from "@workspace/api-zod";
import { decryptTransactionData } from "../lib/crypto";
import { desc } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.adminId || req.session?.role !== "admin") {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/users", requireAdmin, async (req, res) => {
  const parsed = AdminGetUsersQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  let users;
  if (status) {
    users = await db.select().from(usersTable).where(eq(usersTable.status, status));
  } else {
    users = await db.select().from(usersTable);
  }

  res.json(users.map(u => ({
    id: u.id,
    accountNumber: u.accountNumber,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    balance: parseFloat(u.balance),
    status: u.status,
    panCard: u.panCard,
    aadhaar: u.aadhaar,
    address: u.address,
    city: u.city,
    state: u.state,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.put("/users/:id/activate", requireAdmin, async (req, res) => {
  const parsed = AdminActivateUserParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const { id } = parsed.data;
  await db.update(usersTable).set({ status: "active", balance: "1000.00" }).where(eq(usersTable.id, id));
  res.json({ message: "User activated successfully" });
});

router.put("/users/:id/reject", requireAdmin, async (req, res) => {
  const parsed = AdminRejectUserParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const { id } = parsed.data;
  await db.update(usersTable).set({ status: "rejected" }).where(eq(usersTable.id, id));
  res.json({ message: "User rejected successfully" });
});

router.get("/transactions", requireAdmin, async (req, res) => {
  const parsed = AdminGetTransactionsQueryParams.safeParse(req.query);
  const type = parsed.success ? parsed.data.type : undefined;
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  let txs;
  if (type) {
    txs = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.type, type))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit).offset(offset);
  } else {
    txs = await db.select().from(transactionsTable)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit).offset(offset);
  }

  const totalResult = await db.execute(sql`SELECT COUNT(*) as cnt FROM transactions`);
  const total = parseInt((totalResult.rows[0] as any)?.cnt ?? "0");

  const formatted = await Promise.all(txs.map(async (tx) => {
    let dec: any = {};
    try { dec = await decryptTransactionData(tx.encryptedData); } catch {}
    return {
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      fromAccountNumber: dec.fromAccountNumber ?? null,
      toAccountNumber: dec.toAccountNumber ?? null,
      fromName: dec.fromName ?? null,
      toName: dec.toName ?? null,
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
    };
  }));

  res.json({ transactions: formatted, total });
});

router.get("/complaints", requireAdmin, async (req, res) => {
  const result = await db.execute(sql`
    SELECT c.id, c.user_id, c.description, c.status, c.created_at,
           u.account_number, u.first_name, u.last_name
    FROM complaints c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
  `);

  res.json(result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userAccountNumber: row.account_number,
    userName: `${row.first_name} ${row.last_name}`,
    description: row.description,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  })));
});

router.get("/stats", requireAdmin, async (req, res) => {
  const usersResult = await db.execute(sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected
    FROM users
  `);

  const txResult = await db.execute(sql`
    SELECT
      COUNT(*) as total_count,
      COALESCE(SUM(amount) FILTER (WHERE type = 'deposit'), 0) as total_deposits,
      COALESCE(SUM(amount) FILTER (WHERE type = 'withdrawal'), 0) as total_withdrawals,
      COALESCE(SUM(amount) FILTER (WHERE type = 'transfer'), 0) as total_transfers
    FROM transactions
  `);

  const complaintsResult = await db.execute(sql`
    SELECT COUNT(*) as open_count FROM complaints WHERE status = 'open'
  `);

  const u = usersResult.rows[0] as any;
  const t = txResult.rows[0] as any;
  const c = complaintsResult.rows[0] as any;

  res.json({
    totalUsers: parseInt(u.total),
    pendingUsers: parseInt(u.pending),
    activeUsers: parseInt(u.active),
    rejectedUsers: parseInt(u.rejected),
    totalTransactions: parseInt(t.total_count),
    totalDeposits: parseFloat(t.total_deposits),
    totalWithdrawals: parseFloat(t.total_withdrawals),
    totalTransfers: parseFloat(t.total_transfers),
    openComplaints: parseInt(c.open_count),
  });
});

export default router;
