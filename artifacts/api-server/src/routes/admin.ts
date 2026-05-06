import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, transactionsTable, complaintsTable } from "@workspace/db";
import { AdminGetUsersQueryParams, AdminGetTransactionsQueryParams, AdminActivateUserParams, AdminRejectUserParams, AdminGetFirewallEventsQueryParams } from "@workspace/api-zod";
import { decryptTransactionData } from "../lib/crypto";
import { desc } from "drizzle-orm";
import { getDuressEvents } from "../lib/duressEvents";

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

router.get("/firewall", requireAdmin, async (req, res) => {
  const parsed = AdminGetFirewallEventsQueryParams.safeParse(req.query);
  const severityFilter = parsed.success ? parsed.data.severity : undefined;
  const limit = parsed.success ? (parsed.data.limit ?? 100) : 100;

  const txs = await db.select().from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(500);

  // Enrich transactions with AES-decrypted data and compute risk scores
  const events = await Promise.all(txs.map(async (tx) => {
    let dec: any = {};
    try { dec = await decryptTransactionData(tx.encryptedData); } catch {}

    const amount = parseFloat(tx.amount);
    const hour = new Date(tx.createdAt).getHours();
    const riskFlags: string[] = [];
    let riskScore = 0;

    // Amount-based risk
    if (amount >= 50000) { riskFlags.push("LARGE_TRANSACTION_50K+"); riskScore += 50; }
    else if (amount >= 20000) { riskFlags.push("HIGH_VALUE_TRANSACTION_20K+"); riskScore += 30; }
    else if (amount >= 5000) { riskFlags.push("ELEVATED_TRANSACTION_5K+"); riskScore += 15; }

    // Time-based risk (unusual hours: 11pm–5am)
    if (hour >= 23 || hour <= 5) { riskFlags.push("ODD_HOUR_TRANSACTION"); riskScore += 20; }

    // Transfer-specific risk
    if (tx.type === "transfer") { riskFlags.push("OUTBOUND_TRANSFER"); riskScore += 10; }

    // Failed tx risk
    if (tx.status === "failed") { riskFlags.push("FAILED_TRANSACTION"); riskScore += 40; }

    if (riskScore === 0) riskFlags.push("NORMAL_ACTIVITY");

    let severity: "critical" | "high" | "medium" | "low" | "info";
    if (riskScore >= 70) severity = "critical";
    else if (riskScore >= 45) severity = "high";
    else if (riskScore >= 25) severity = "medium";
    else if (riskScore >= 10) severity = "low";
    else severity = "info";

    const descriptions: Record<string, string> = {
      critical: "Critical risk — potential fraud or large suspicious transfer",
      high: "High risk — significant financial activity requiring review",
      medium: "Medium risk — unusual pattern detected",
      low: "Low risk — minor anomaly observed",
      info: "Normal transaction logged",
    };

    return {
      id: tx.id,
      eventId: `EVT-${String(tx.id).padStart(6, "0")}`,
      timestamp: tx.createdAt.toISOString(),
      severity,
      riskScore,
      type: tx.type,
      amount,
      fromAccount: dec.fromAccountNumber ?? null,
      toAccount: dec.toAccountNumber ?? null,
      fromName: dec.fromName ?? null,
      toName: dec.toName ?? null,
      status: tx.status,
      riskFlags,
      description: descriptions[severity],
    };
  }));

  // Inject duress login events as CRITICAL synthetic events
  const duressEvts = getDuressEvents().map((de, i) => ({
    id: -(i + 1),
    eventId: `DURESS-${String(i + 1).padStart(4, "0")}`,
    timestamp: de.timestamp.toISOString(),
    severity: "critical" as const,
    riskScore: 100,
    type: "transfer" as const,
    amount: 0,
    fromAccount: de.accountNumber,
    toAccount: null,
    fromName: de.userName,
    toName: null,
    status: "success",
    riskFlags: ["DURESS_ACCESS_DETECTED", "EMERGENCY_PIN_USED", "POSSIBLE_COERCION"],
    description: `⚠️ DURESS ACCESS — ${de.userName} logged in using Emergency PIN from IP ${de.ip}`,
  }));

  const allEvents = [...duressEvts, ...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filtered = severityFilter ? allEvents.filter(e => e.severity === severityFilter) : allEvents;
  const paginated = filtered.slice(0, limit);

  const stats = {
    total: allEvents.length,
    critical: allEvents.filter(e => e.severity === "critical").length,
    high: allEvents.filter(e => e.severity === "high").length,
    medium: allEvents.filter(e => e.severity === "medium").length,
    low: allEvents.filter(e => e.severity === "low").length,
    info: allEvents.filter(e => e.severity === "info").length,
  };

  res.json({ events: paginated, stats });
});

export default router;
