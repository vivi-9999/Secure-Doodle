import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdatePinBody } from "@workspace/api-zod";
import { hashPin, verifyPin } from "../lib/pinHash";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/me", requireAuth, async (req: any, res) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const user = users[0];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    accountNumber: user.accountNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    balance: parseFloat(user.balance),
    status: user.status,
    address: user.address,
    city: user.city,
    state: user.state,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/pin", requireAuth, async (req: any, res) => {
  const parsed = UpdatePinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { currentPin, newPin } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const user = users[0];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (!verifyPin(currentPin, user.pinHash)) {
    res.status(400).json({ error: "Current PIN is incorrect" });
    return;
  }

  await db.update(usersTable).set({ pinHash: hashPin(newPin) }).where(eq(usersTable.id, user.id));
  res.json({ message: "PIN updated successfully" });
});

router.get("/account/:accountNumber", requireAuth, async (req, res) => {
  const { accountNumber } = req.params;
  const users = await db.select().from(usersTable).where(eq(usersTable.accountNumber, accountNumber));
  const user = users[0];
  if (!user || user.status !== "active") {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({
    accountNumber: user.accountNumber,
    fullName: `${user.firstName} ${user.lastName}`,
  });
});

export default router;
