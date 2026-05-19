import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./connection";
import { intakeQueue, evidenceFiles, incidents, incidentTags } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const intakeRouter = createRouter({
  // ── List intake items ─────────────────────────────────────────
  list: publicQuery
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(intakeQueue.userId, 1)];
      if (input?.status) {
        conditions.push(eq(intakeQueue.status, input.status as any));
      }
      return db.select().from(intakeQueue)
        .where(and(...conditions))
        .orderBy(desc(intakeQueue.createdAt));
    }),

  // ── Get single item ───────────────────────────────────────────
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [item] = await db.select().from(intakeQueue)
        .where(and(eq(intakeQueue.id, input.id), eq(intakeQueue.userId, 1)));
      return item || null;
    }),

  // ── Update item (review edits) ────────────────────────────────
  update: publicQuery
    .input(z.object({
      id: z.number(),
      suggestedTitle: z.string().optional(),
      suggestedDate: z.string().optional(),
      suggestedPlatform: z.string().optional(),
      suggestedPersonIds: z.string().optional(),
      suggestedTagIds: z.string().optional(),
      evidenceType: z.string().optional(),
      confidence: z.string().optional(),
      notes: z.string().optional(),
      description: z.string().optional(),
      transcriptText: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, suggestedDate, ...rest } = input;
      const updateData: Record<string, any> = { ...rest };
      if (suggestedDate !== undefined) {
        updateData.suggestedDate = suggestedDate || null;
      }
      await db.update(intakeQueue).set(updateData)
        .where(and(eq(intakeQueue.id, id), eq(intakeQueue.userId, 1)));
      return { success: true };
    }),

  // ── Convert to evidence (standalone) ──────────────────────────
  convertToEvidence: publicQuery
    .input(z.object({
      id: z.number(),
      fileName: z.string(),
      evidenceType: z.string(),
      description: z.string().optional(),
      confidence: z.string().optional(),
      personId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [item] = await db.select().from(intakeQueue)
        .where(and(eq(intakeQueue.id, input.id), eq(intakeQueue.userId, 1)));
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });

      // Create evidence file record
      const [evidence] = await db.insert(evidenceFiles).values({
        userId: 1,
        fileName: input.fileName,
        filePath: item.filePath,
        storageType: "upload",
        evidenceType: input.evidenceType as any,
        description: input.description || item.description,
        confidence: (input.confidence || "unverified") as any,
        personId: input.personId,
      });

      // Mark as converted
      await db.update(intakeQueue).set({
        status: "converted",
        linkedEvidenceId: Number(evidence.insertId),
      }).where(eq(intakeQueue.id, input.id));

      return { success: true, evidenceId: Number(evidence.insertId) };
    }),

  // ── Link to existing incident ─────────────────────────────────
  linkToIncident: publicQuery
    .input(z.object({
      id: z.number(),
      incidentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [item] = await db.select().from(intakeQueue)
        .where(and(eq(intakeQueue.id, input.id), eq(intakeQueue.userId, 1)));
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });

      // Create evidence record linked to incident
      const [evidence] = await db.insert(evidenceFiles).values({
        userId: 1,
        incidentId: input.incidentId,
        fileName: item.originalFilename,
        filePath: item.filePath,
        storageType: "upload",
        evidenceType: item.evidenceType || "screenshot",
        description: item.description,
      });

      // Mark as converted
      await db.update(intakeQueue).set({
        status: "converted",
        linkedIncidentId: input.incidentId,
        linkedEvidenceId: Number(evidence.insertId),
      }).where(eq(intakeQueue.id, input.id));

      return { success: true };
    }),

  // ── Create incident draft from intake ─────────────────────────
  createIncidentDraft: publicQuery
    .input(z.object({
      intakeIds: z.array(z.number()),
      title: z.string(),
      description: z.string(),
      incidentDate: z.string(),
      eventType: z.string(),
      attackerName: z.string().optional(),
      platform: z.string().optional(),
      severity: z.number().default(1),
      mentalHealthImpact: z.number().default(1),
      confidenceLevel: z.string().default("unverified"),
      transcript: z.string().optional(),
      personId: z.number().optional(),
      tagIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Create incident
      const [incident] = await db.insert(incidents).values({
        userId: 1,
        title: input.title,
        description: input.description,
        incidentDate: input.incidentDate as any,
        eventType: input.eventType as any,
        attackerName: input.attackerName,
        platform: input.platform,
        severity: input.severity,
        mentalHealthImpact: input.mentalHealthImpact,
        confidenceLevel: input.confidenceLevel as any,
        transcript: input.transcript,
        personId: input.personId,
        status: "logged",
      });

      const incidentId = Number(incident.insertId);

      // Add tags
      if (input.tagIds && input.tagIds.length > 0) {
        for (const tagId of input.tagIds) {
          await db.insert(incidentTags).values({ incidentId, tagId });
        }
      }

      // Convert all intake items to evidence linked to this incident
      for (const intakeId of input.intakeIds) {
        const [item] = await db.select().from(intakeQueue)
          .where(and(eq(intakeQueue.id, intakeId), eq(intakeQueue.userId, 1)));
        if (!item) continue;

        await db.insert(evidenceFiles).values({
          userId: 1,
          incidentId,
          personId: input.personId,
          fileName: item.originalFilename,
          filePath: item.filePath,
          storageType: "upload",
          evidenceType: item.evidenceType || "screenshot",
          description: item.description,
        });

        await db.update(intakeQueue).set({
          status: "converted",
          linkedIncidentId: incidentId,
        }).where(eq(intakeQueue.id, intakeId));
      }

      return { success: true, incidentId };
    }),

  // ── Discard item ──────────────────────────────────────────────
  discard: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(intakeQueue).set({ status: "discarded" })
        .where(and(eq(intakeQueue.id, input.id), eq(intakeQueue.userId, 1)));
      return { success: true };
    }),

  // ── Restore discarded ─────────────────────────────────────────
  restore: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(intakeQueue).set({ status: "pending" })
        .where(and(eq(intakeQueue.id, input.id), eq(intakeQueue.userId, 1)));
      return { success: true };
    }),

  // ── Stats ─────────────────────────────────────────────────────
  stats: publicQuery.query(async () => {
    const db = getDb();
    const allItems = await db.select({ status: intakeQueue.status })
      .from(intakeQueue).where(eq(intakeQueue.userId, 1));
    return {
      pending: allItems.filter(i => i.status === "pending").length,
      reviewed: allItems.filter(i => i.status === "reviewed").length,
      converted: allItems.filter(i => i.status === "converted").length,
      discarded: allItems.filter(i => i.status === "discarded").length,
      total: allItems.length,
    };
  }),
});
