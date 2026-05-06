import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, complaintsTable } from "@workspace/db";
import { CreateComplaintBody } from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.post("/", requireAuth, async (req: any, res) => {
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { description } = parsed.data;

  const [complaint] = await db.insert(complaintsTable).values({
    userId: req.session.userId,
    description,
  }).returning();

  res.status(201).json({
    id: complaint.id,
    description: complaint.description,
    status: complaint.status,
    createdAt: complaint.createdAt.toISOString(),
  });
});

router.get("/", requireAuth, async (req: any, res) => {
  const complaints = await db.select().from(complaintsTable).where(eq(complaintsTable.userId, req.session.userId));
  res.json(complaints.map(c => ({
    id: c.id,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  })));
});

export default router;
