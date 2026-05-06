import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, trustedDevicesTable } from "@workspace/db";
import { UpdatePinBody, SetDuressPinBody, AddTrustedDeviceBody } from "@workspace/api-zod";
import { hashPin, verifyPin } from "../lib/pinHash";
import { randomUUID } from "crypto";

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

  const duressMode = req.session.duressMode === true;

  res.json({
    id: user.id,
    accountNumber: user.accountNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    balance: duressMode ? 500 : parseFloat(user.balance),
    status: user.status,
    address: user.address,
    city: user.city,
    state: user.state,
    createdAt: user.createdAt.toISOString(),
    duressMode,
    hasDuressPin: !!user.duressPinHash,
  });
});

router.get("/trusted-devices", requireAuth, async (req: any, res) => {
  const devices = await db.select().from(trustedDevicesTable).where(eq(trustedDevicesTable.userId, req.session.userId));
  res.json({
    devices: devices.map(d => ({
      id: d.id,
      deviceToken: d.deviceToken,
      deviceName: d.deviceName,
      createdAt: d.createdAt.toISOString(),
    })),
  });
});

router.post("/trusted-devices", requireAuth, async (req: any, res) => {
  const parsed = AddTrustedDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { currentPin, deviceToken, deviceName } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const user = users[0];
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!verifyPin(currentPin, user.pinHash)) {
    res.status(400).json({ error: "Current PIN is incorrect" });
    return;
  }

  const existing = await db.select().from(trustedDevicesTable).where(
    and(eq(trustedDevicesTable.userId, user.id), eq(trustedDevicesTable.deviceToken, deviceToken))
  );
  if (existing.length > 0) {
    res.status(400).json({ error: "Device is already trusted" });
    return;
  }

  await db.insert(trustedDevicesTable).values({ userId: user.id, deviceToken, deviceName });
  res.json({ message: "Device trusted successfully" });
});

router.delete("/trusted-devices/:token", requireAuth, async (req: any, res) => {
  const { token } = req.params;
  await db.delete(trustedDevicesTable).where(
    and(eq(trustedDevicesTable.userId, req.session.userId), eq(trustedDevicesTable.deviceToken, token))
  );
  res.json({ message: "Device removed" });
});

router.put("/duress-pin", requireAuth, async (req: any, res) => {
  const parsed = SetDuressPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { currentPin, duressPin } = parsed.data;

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
  if (duressPin === currentPin) {
    res.status(400).json({ error: "Emergency PIN must be different from your main PIN" });
    return;
  }

  await db.update(usersTable).set({ duressPinHash: hashPin(duressPin) }).where(eq(usersTable.id, user.id));
  res.json({ message: "Emergency PIN set successfully" });
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
