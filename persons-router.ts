import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { persons, aliases, incidents, evidenceFiles } from "@db/schema";
import { eq, desc, count, isNull, sql, and } from "drizzle-orm";

export const personsRouter = createRouter({
  create: authedQuery
    .input(z.object({
      displayName: z.string().min(1),
      firstSeenDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(persons).values({
        userId: ctx.user.id,
        displayName: input.displayName,
        firstSeenDate: input.firstSeenDate ? new Date(input.firstSeenDate) : null,
        notes: input.notes || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(persons)
      .where(and(eq(persons.userId, ctx.user.id), isNull(persons.deletedAt)))
      .orderBy(desc(persons.createdAt));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const personResult = await db.select().from(persons).where(eq(persons.id, input.id));
      if (!personResult[0] || personResult[0].userId !== ctx.user.id) return null;

      const personAliases = await db.select().from(aliases)
        .where(and(eq(aliases.personId, input.id), isNull(aliases.deletedAt)));
      const personIncidents = await db.select().from(incidents)
        .where(and(eq(incidents.personId, input.id), isNull(incidents.deletedAt)))
        .orderBy(desc(incidents.incidentDate));
      const personEvidence = await db.select().from(evidenceFiles)
        .where(and(eq(evidenceFiles.personId, input.id), isNull(evidenceFiles.deletedAt)));

      const tacticCounts: Record<string, number> = {};
      personIncidents.forEach((inc) => { tacticCounts[inc.eventType] = (tacticCounts[inc.eventType] || 0) + 1; });
      const commonTactics = Object.entries(tacticCounts).sort((a, b) => b[1] - a[1]).map(([tactic, count]) => ({ tactic, count }));
      const platformsUsed = [...new Set(personIncidents.map((i) => i.platform || "Unknown").filter(Boolean))];

      return {
        ...personResult[0],
        aliases: personAliases,
        incidents: personIncidents,
        evidenceCount: personEvidence.length,
        totalIncidents: personIncidents.length,
        commonTactics,
        platformsUsed,
      };
    }),

  update: authedQuery
    .input(z.object({ id: z.number(), displayName: z.string().optional(), firstSeenDate: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateValues: Record<string, unknown> = {};
      if (data.displayName !== undefined) updateValues.displayName = data.displayName;
      if (data.firstSeenDate !== undefined) updateValues.firstSeenDate = data.firstSeenDate ? new Date(data.firstSeenDate) : null;
      if (data.notes !== undefined) updateValues.notes = data.notes || null;
      await db.update(persons).set(updateValues).where(eq(persons.id, id));
      return { success: true };
    }),

  // SOFT DELETE
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(persons).set({ deletedAt: new Date() }).where(eq(persons.id, input.id));
      return { success: true };
    }),

  restore: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(persons).set({ deletedAt: null }).where(eq(persons.id, input.id));
      return { success: true };
    }),

  deleted: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(persons)
      .where(and(eq(persons.userId, ctx.user.id), sql`${persons.deletedAt} IS NOT NULL`))
      .orderBy(desc(persons.deletedAt));
  }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const totalPersons = await db.select({ count: count() })
      .from(persons).where(and(eq(persons.userId, ctx.user.id), isNull(persons.deletedAt)));
    const topPersons = await db
      .select({ personId: incidents.personId, count: count() })
      .from(incidents).where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)))
      .groupBy(incidents.personId).orderBy(desc(count())).limit(10);
    return { total: totalPersons[0]?.count ?? 0, topPersons };
  }),
});


