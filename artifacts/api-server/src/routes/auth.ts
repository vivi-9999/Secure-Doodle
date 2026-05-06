import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, adminsTable } from "@workspace/db";
import { RegisterBody, LoginBody, AdminLoginBody } from "@workspace/api-zod";
import { hashPin, verifyPin } from "../lib/pinHash";
import { generateAccountNumber } from "../lib/accountNumber";
import { createHash } from "crypto";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const data = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, data.email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const accountNumber = await generateAccountNumber();
  const pinHash = hashPin(data.pin);

  await db.insert(usersTable).values({
    accountNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    pinHash,
    panCard: data.panCard,
    aadhaar: data.aadhaar,
    address: data.address,
    city: data.city,
    state: data.state,
  });

  res.status(201).json({
    message: "Registration submitted. Awaiting admin approval.",
  });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { accountNumber, pin } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.accountNumber, accountNumber));
  const user = users[0];

  if (!user) {
    res.status(401).json({ error: "Invalid account number or PIN" });
    return;
  }
  if (user.status !== "active") {
    res.status(401).json({ error: user.status === "pending" ? "Account pending activation" : "Account rejected" });
    return;
  }
  if (!verifyPin(pin, user.pinHash)) {
    res.status(401).json({ error: "Invalid account number or PIN" });
    return;
  }

  (req.session as any).userId = user.id;
  (req.session as any).role = "user";

  res.json({
    message: "Login successful",
    role: "user",
    user: {
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
    },
  });
});

router.post("/admin/login", async (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { username, password } = parsed.data;

  const admins = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  const admin = admins[0];

  const passwordHash = createHash("sha256").update(password + "admin-salt").digest("hex");
  if (!admin || admin.passwordHash !== passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req.session as any).adminId = admin.id;
  (req.session as any).role = "admin";

  res.json({ message: "Admin login successful", role: "admin" });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

export default router;
