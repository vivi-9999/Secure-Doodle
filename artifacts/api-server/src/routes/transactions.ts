import { Router } from "express";
import { eq, sql, and, desc } from "drizzle-orm";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { DepositBody, WithdrawBody, TransferBody, GetTransactionHistoryQueryParams } from "@workspace/api-zod";
import { verifyPin } from "../lib/pinHash";
import { encryptTransactionData, decryptTransactionData } from "../lib/crypto";

const router = Router();

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

async function formatTransaction(tx: any): Promise<any> {
  let decrypted: any = {};
  try {
    decrypted = await decryptTransactionData(tx.encryptedData);
  } catch {
    decrypted = {};
  }
  return {
    id: tx.id,
    type: tx.type,
    amount: parseFloat(tx.amount),
    fromAccountNumber: decrypted.fromAccountNumber ?? null,
    toAccountNumber: decrypted.toAccountNumber ?? null,
    fromName: decrypted.fromName ?? null,
    toName: decrypted.toName ?? null,
    status: tx.status,
    lockExpiresAt: tx.lockExpiresAt ? tx.lockExpiresAt.toISOString() : null,
    createdAt: tx.createdAt.toISOString(),
  };
}

// Lazy-execute any expired pending_locked transactions for a user
async function executeExpiredLocks(userId: number): Promise<void> {
  const lockedTxs = await db.select().from(transactionsTable).where(
    and(eq(transactionsTable.userId, userId), eq(transactionsTable.status, "pending_locked"))
  );
  const now = new Date();
  for (const tx of lockedTxs) {
    if (!tx.lockExpiresAt || tx.lockExpiresAt > now) continue;
    // Time is up — execute: credit the recipient
    let decrypted: any = {};
    try { decrypted = await decryptTransactionData(tx.encryptedData); } catch { continue; }
    const { toAccountNumber } = decrypted;
    if (!toAccountNumber) continue;
    const recipients = await db.select().from(usersTable).where(eq(usersTable.accountNumber, toAccountNumber));
    const recipient = recipients[0];
    if (!recipient) continue;
    const newRecipientBalance = parseFloat(recipient.balance) + parseFloat(tx.amount);
    await db.update(usersTable).set({ balance: newRecipientBalance.toFixed(2) }).where(eq(usersTable.id, recipient.id));
    await db.update(transactionsTable).set({ status: "success", lockExpiresAt: null }).where(eq(transactionsTable.id, tx.id));
    // Add incoming transaction record for recipient
    await db.insert(transactionsTable).values({
      userId: recipient.id,
      type: "transfer",
      amount: tx.amount,
      encryptedData: tx.encryptedData,
      status: "success",
    });
  }
}

router.post("/deposit", requireAuth, async (req: any, res) => {
  if (req.session.duressMode) {
    const { amount } = req.body;
    res.json({ message: "Deposit successful", transaction: { id: 0, type: "deposit", amount: Number(amount) || 0, status: "success", lockExpiresAt: null, createdAt: new Date().toISOString() }, newBalance: 500 + (Number(amount) || 0) });
    return;
  }
  const parsed = DepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { amount, pin } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const user = users[0];
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!verifyPin(pin, user.pinHash)) {
    res.status(400).json({ error: "Invalid PIN" });
    return;
  }

  const newBalance = parseFloat(user.balance) + amount;
  await db.update(usersTable).set({ balance: newBalance.toFixed(2) }).where(eq(usersTable.id, user.id));

  const encryptedData = await encryptTransactionData({
    toAccountNumber: user.accountNumber,
    toName: `${user.firstName} ${user.lastName}`,
    fromAccountNumber: null,
    fromName: null,
    transactionTime: new Date().toISOString(),
    type: "deposit",
    status: "success",
  });

  const [inserted] = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "deposit",
    amount: amount.toFixed(2),
    encryptedData,
    status: "success",
  }).returning();

  res.json({
    message: "Deposit successful",
    transaction: await formatTransaction(inserted),
    newBalance,
  });
});

router.post("/withdraw", requireAuth, async (req: any, res) => {
  if (req.session.duressMode) {
    const { amount } = req.body;
    if ((Number(amount) || 0) > 500) { res.status(400).json({ error: "Insufficient funds" }); return; }
    res.json({ message: "Withdrawal successful", transaction: { id: 0, type: "withdrawal", amount: Number(amount) || 0, status: "success", lockExpiresAt: null, createdAt: new Date().toISOString() }, newBalance: 500 - (Number(amount) || 0) });
    return;
  }
  const parsed = WithdrawBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { amount, pin } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const user = users[0];
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!verifyPin(pin, user.pinHash)) {
    res.status(400).json({ error: "Invalid PIN" });
    return;
  }
  if (parseFloat(user.balance) < amount) {
    res.status(400).json({ error: "Insufficient funds" });
    return;
  }

  const newBalance = parseFloat(user.balance) - amount;
  await db.update(usersTable).set({ balance: newBalance.toFixed(2) }).where(eq(usersTable.id, user.id));

  const encryptedData = await encryptTransactionData({
    fromAccountNumber: user.accountNumber,
    fromName: `${user.firstName} ${user.lastName}`,
    toAccountNumber: null,
    toName: null,
    transactionTime: new Date().toISOString(),
    type: "withdrawal",
    status: "success",
  });

  const [inserted] = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "withdrawal",
    amount: amount.toFixed(2),
    encryptedData,
    status: "success",
  }).returning();

  res.json({
    message: "Withdrawal successful",
    transaction: await formatTransaction(inserted),
    newBalance,
  });
});

router.post("/transfer", requireAuth, async (req: any, res) => {
  if (req.session.duressMode) {
    const { amount, toAccountNumber } = req.body;
    if ((Number(amount) || 0) > 500) { res.status(400).json({ error: "Insufficient funds" }); return; }
    res.json({ message: `Transfer of ₹${amount} successful`, transaction: { id: 0, type: "transfer", amount: Number(amount) || 0, toAccountNumber, status: "success", lockExpiresAt: null, createdAt: new Date().toISOString() }, newBalance: 500 - (Number(amount) || 0) });
    return;
  }
  const parsed = TransferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { toAccountNumber, amount, pin } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const sender = users[0];
  if (!sender) { res.status(404).json({ error: "User not found" }); return; }
  if (!verifyPin(pin, sender.pinHash)) {
    res.status(400).json({ error: "Invalid PIN" });
    return;
  }
  if (sender.accountNumber === toAccountNumber) {
    res.status(400).json({ error: "Cannot transfer to your own account" });
    return;
  }

  const recipients = await db.select().from(usersTable).where(eq(usersTable.accountNumber, toAccountNumber));
  const recipient = recipients[0];
  if (!recipient || recipient.status !== "active") {
    res.status(400).json({ error: "Recipient account not found or inactive" });
    return;
  }
  if (parseFloat(sender.balance) < amount) {
    res.status(400).json({ error: "Insufficient funds" });
    return;
  }

  const encryptedData = await encryptTransactionData({
    fromAccountNumber: sender.accountNumber,
    fromName: `${sender.firstName} ${sender.lastName}`,
    toAccountNumber: recipient.accountNumber,
    toName: `${recipient.firstName} ${recipient.lastName}`,
    transactionTime: new Date().toISOString(),
    type: "transfer",
    status: "success",
  });

  // Check time-lock threshold
  const threshold = sender.lockThreshold ? parseFloat(sender.lockThreshold) : null;
  const shouldLock = threshold !== null && amount > threshold;

  // Deduct sender balance immediately (reserve funds)
  const newSenderBalance = parseFloat(sender.balance) - amount;
  await db.update(usersTable).set({ balance: newSenderBalance.toFixed(2) }).where(eq(usersTable.id, sender.id));

  if (shouldLock) {
    const lockExpiresAt = new Date(Date.now() + LOCK_DURATION_MS);
    const [senderTx] = await db.insert(transactionsTable).values({
      userId: sender.id,
      type: "transfer",
      amount: amount.toFixed(2),
      encryptedData,
      status: "pending_locked",
      lockExpiresAt,
    }).returning();

    res.json({
      message: `Transfer of ₹${amount.toLocaleString('en-IN')} to ${recipient.firstName} ${recipient.lastName} is held for 5 minutes. Cancel anytime before the timer expires.`,
      transaction: await formatTransaction(senderTx),
      newBalance: newSenderBalance,
      timeLocked: true,
      lockExpiresAt: lockExpiresAt.toISOString(),
    });
    return;
  }

  // Immediate transfer
  const newRecipientBalance = parseFloat(recipient.balance) + amount;
  await db.update(usersTable).set({ balance: newRecipientBalance.toFixed(2) }).where(eq(usersTable.id, recipient.id));

  const [senderTx] = await db.insert(transactionsTable).values({
    userId: sender.id,
    type: "transfer",
    amount: amount.toFixed(2),
    encryptedData,
    status: "success",
  }).returning();

  await db.insert(transactionsTable).values({
    userId: recipient.id,
    type: "transfer",
    amount: amount.toFixed(2),
    encryptedData,
    status: "success",
  });

  res.json({
    message: `Transfer of ₹${amount} to ${recipient.firstName} ${recipient.lastName} successful`,
    transaction: await formatTransaction(senderTx),
    newBalance: newSenderBalance,
    timeLocked: false,
  });
});

router.delete("/:id/cancel-lock", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const txs = await db.select().from(transactionsTable).where(
    and(eq(transactionsTable.id, id), eq(transactionsTable.userId, req.session.userId))
  );
  const tx = txs[0];
  if (!tx || tx.status !== "pending_locked") {
    res.status(404).json({ error: "Transaction not found or not cancellable" });
    return;
  }
  if (tx.lockExpiresAt && tx.lockExpiresAt < new Date()) {
    res.status(400).json({ error: "Lock period has expired — transfer already executed" });
    return;
  }
  // Restore sender balance
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const user = users[0];
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const restoredBalance = parseFloat(user.balance) + parseFloat(tx.amount);
  await db.update(usersTable).set({ balance: restoredBalance.toFixed(2) }).where(eq(usersTable.id, user.id));
  await db.update(transactionsTable).set({ status: "failed" }).where(eq(transactionsTable.id, id));

  res.json({ message: `Transfer cancelled. ₹${parseFloat(tx.amount).toLocaleString('en-IN')} has been returned to your account.` });
});

router.get("/history", requireAuth, async (req: any, res) => {
  if (req.session.duressMode) {
    res.json({ transactions: [], total: 0 });
    return;
  }
  // Auto-execute expired locks before loading history
  await executeExpiredLocks(req.session.userId);

  const parsed = GetTransactionHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, req.session.userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const total = await db.execute(sql`SELECT COUNT(*) as cnt FROM transactions WHERE user_id = ${req.session.userId}`);
  const totalCount = parseInt((total.rows[0] as any)?.cnt ?? "0");

  const formatted = await Promise.all(txs.map(formatTransaction));
  res.json({ transactions: formatted, total: totalCount });
});

router.get("/summary", requireAuth, async (req: any, res) => {
  if (req.session.duressMode) {
    res.json({ totalDeposits: 0, totalWithdrawals: 0, totalTransfersSent: 0, totalTransfersReceived: 0, transactionCount: 0, currentBalance: 500 });
    return;
  }
  const userId = req.session.userId;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const user = users[0];

  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId));

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalTransfersSent = 0;
  let totalTransfersReceived = 0;

  for (const tx of txs) {
    if (tx.status !== "success") continue;
    const amt = parseFloat(tx.amount);
    if (tx.type === "deposit") totalDeposits += amt;
    else if (tx.type === "withdrawal") totalWithdrawals += amt;
    else if (tx.type === "transfer") {
      const dec = await decryptTransactionData(tx.encryptedData).catch(() => ({})) as any;
      if (dec.fromAccountNumber === user?.accountNumber) totalTransfersSent += amt;
      else totalTransfersReceived += amt;
    }
  }

  res.json({
    totalDeposits,
    totalWithdrawals,
    totalTransfersSent,
    totalTransfersReceived,
    transactionCount: txs.length,
    currentBalance: parseFloat(user?.balance ?? "0"),
  });
});

export default router;
