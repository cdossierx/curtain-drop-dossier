import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./connection";
import { aliases } from "@db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";

export const aliasesRouter = createRouter({
  create: authedQuery
    .input(z.object({
      personId: z.number().optional(),
      alias: z.string().min(1),
      platformId: z.number().optional(),
      suspectedOperator: z.string().optional(),
      confidence: z.enum(["confirmed", "strong_evidence", "moderate_evidence", "unverified", "disputed"]),
      evidenceDescription: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(aliases).values({
        userId: ctx.user.id,
        personId: input.personId || null,
        alias: input.alias,
        platformId: input.platformId || null,
        suspectedOperator: input.suspectedOperator || null,
        confidence: input.confidence,
        evidenceDescription: input.evidenceDescription || null,
        notes: input.notes || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(aliases)
      .where(and(eq(aliases.userId, ctx.user.id), isNull(aliases.deletedAt)))
      .orderBy(desc(aliases.createdAt));
  }),

  update: authedQuery
    .input(z.object({
      id: z.number(), personId: z.number().optional(), alias: z.string().optional(),
      platformId: z.number().optional(), suspectedOperator: z.string().optional(),
      confidence: z.enum(["confirmed", "strong_evidence", "moderate_evidence", "unverified", "disputed"]).optional(),
      evidenceDescription: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateValues: Record<string, unknown> = {};
      if (data.personId !== undefined) updateValues.personId = data.personId || null;
      if (data.alias) updateValues.alias = data.alias;
      if (data.platformId !== undefined) updateValues.platformId = data.platformId || null;
      if (data.suspectedOperator !== undefined) updateValues.suspectedOperator = data.suspectedOperator || null;
      if (data.confidence) updateValues.confidence = data.confidence;
      if (data.evidenceDescription !== undefined) updateValues.evidenceDescription = data.evidenceDescription || null;
      if (data.notes !== undefined) updateValues.notes = data.notes || null;
      await db.update(aliases).set(updateValues).where(eq(aliases.id, id));
      return { success: true };
    }),

  // SOFT DELETE
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(aliases).set({ deletedAt: new Date() }).where(eq(aliases.id, input.id));
      return { success: true };
    }),

  restore: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(aliases).set({ deletedAt: null }).where(eq(aliases.id, input.id));
      return { success: true };
    }),
});
