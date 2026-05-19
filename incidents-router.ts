import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./connection";
import { incidents, evidenceFiles, incidentTags, relatedIncidents } from "@db/schema";
import { eq, desc, sql, gte, lte, and, count, isNull } from "drizzle-orm";

export const incidentsRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        incidentDate: z.string(),
        incidentTime: z.string().optional(),
        title: z.string().optional(),
        description: z.string().min(1),
        transcript: z.string().optional(),
        personId: z.number().optional(),
        aliasId: z.number().optional(),
        platformId: z.number().optional(),
        attackerName: z.string().optional(),
        platform: z.string().optional(),
        eventType: z.enum([
          "harassment", "defamation", "doxxing", "threat", "narrative_seeding",
          "dogpiling", "coordinated_live", "evidence_leak", "false_allegation",
          "account_creation", "account_deletion",
        ]),
        severity: z.number().int().min(1).max(5),
        mentalHealthImpact: z.number().int().min(1).max(10),
        status: z.enum(["unreviewed", "logged", "verified", "archived", "included_in_report"]).optional(),
        confidenceLevel: z.enum(["confirmed", "strong_evidence", "moderate_evidence", "unverified", "disputed"]).optional(),
        sourceType: z.enum([
          "screenshot", "video_clip", "full_video", "audio_recording", "transcript",
          "chat_log", "court_document", "social_media_post", "eyewitness", "third_party",
        ]).optional(),
        capturedBy: z.string().optional(),
        captureDate: z.string().optional(),
        lieTopic: z.string().optional(),
        notes: z.string().optional(),
        context: z.string().optional(),
        tagIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(incidents).values({
        userId: ctx.user.id,
        incidentDate: new Date(input.incidentDate),
        incidentTime: input.incidentTime || null,
        title: input.title || null,
        description: input.description,
        transcript: input.transcript || null,
        personId: input.personId || null,
        aliasId: input.aliasId || null,
        platformId: input.platformId || null,
        attackerName: input.attackerName || null,
        platform: input.platform || null,
        eventType: input.eventType,
        severity: input.severity,
        mentalHealthImpact: input.mentalHealthImpact,
        status: input.status || "unreviewed",
        confidenceLevel: input.confidenceLevel || "unverified",
        sourceType: input.sourceType || null,
        capturedBy: input.capturedBy || null,
        captureDate: input.captureDate ? new Date(input.captureDate) : null,
        lieTopic: input.lieTopic || null,
        notes: input.notes || null,
        context: input.context || null,
      });

      const incidentId = Number(result[0].insertId);

      if (input.tagIds && input.tagIds.length > 0) {
        for (const tagId of input.tagIds) {
          await db.insert(incidentTags).values({ incidentId, tagId });
        }
      }

      return { id: incidentId };
    }),

  list: authedQuery
    .input(
      z.object({
        eventType: z.string().optional(),
        personId: z.number().optional(),
        aliasId: z.number().optional(),
        platformId: z.number().optional(),
        status: z.string().optional(),
        confidenceLevel: z.string().optional(),
        tagId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)];

      if (input?.eventType) {
        conditions.push(eq(incidents.eventType, input.eventType as any));
      }
      if (input?.personId) {
        conditions.push(eq(incidents.personId, input.personId));
      }
      if (input?.aliasId) {
        conditions.push(eq(incidents.aliasId, input.aliasId));
      }
      if (input?.platformId) {
        conditions.push(eq(incidents.platformId, input.platformId));
      }
      if (input?.status) {
        conditions.push(eq(incidents.status, input.status as any));
      }
      if (input?.confidenceLevel) {
        conditions.push(eq(incidents.confidenceLevel, input.confidenceLevel as any));
      }
      if (input?.startDate) {
        conditions.push(gte(incidents.incidentDate, new Date(input.startDate)));
      }
      if (input?.endDate) {
        conditions.push(lte(incidents.incidentDate, new Date(input.endDate)));
      }

      const results = await db
        .select()
        .from(incidents)
        .where(and(...conditions))
        .orderBy(desc(incidents.incidentDate));

      if (input?.tagId) {
        const tagged = await db
          .select({ incidentId: incidentTags.incidentId })
          .from(incidentTags)
          .where(eq(incidentTags.tagId, input.tagId));
        const taggedIds = new Set(tagged.map((t) => t.incidentId));
        return results.filter((r) => taggedIds.has(r.id));
      }

      if (input?.search) {
        const q = input.search.toLowerCase();
        return results.filter((r) =>
          (r.title?.toLowerCase().includes(q) || false) ||
          r.description.toLowerCase().includes(q) ||
          (r.transcript?.toLowerCase().includes(q) || false) ||
          (r.attackerName?.toLowerCase().includes(q) || false) ||
          (r.context?.toLowerCase().includes(q) || false)
        );
      }

      return results;
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(incidents)
        .where(and(eq(incidents.id, input.id), eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)));

      if (!result[0]) return null;

      const evidence = await db
        .select()
        .from(evidenceFiles)
        .where(and(eq(evidenceFiles.incidentId, input.id), isNull(evidenceFiles.deletedAt)));

      const tags = await db
        .select()
        .from(incidentTags)
        .where(eq(incidentTags.incidentId, input.id));

      const related = await db
        .select()
        .from(relatedIncidents)
        .where(eq(relatedIncidents.incidentId, input.id));

      return { ...result[0], evidence, tags, relatedIncidents: related };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        incidentDate: z.string().optional(),
        incidentTime: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        transcript: z.string().optional(),
        personId: z.number().optional(),
        aliasId: z.number().optional(),
        platformId: z.number().optional(),
        attackerName: z.string().optional(),
        platform: z.string().optional(),
        eventType: z.enum([
          "harassment", "defamation", "doxxing", "threat", "narrative_seeding",
          "dogpiling", "coordinated_live", "evidence_leak", "false_allegation",
          "account_creation", "account_deletion",
        ]).optional(),
        severity: z.number().int().min(1).max(5).optional(),
        mentalHealthImpact: z.number().int().min(1).max(10).optional(),
        status: z.enum(["unreviewed", "logged", "verified", "archived", "included_in_report"]).optional(),
        confidenceLevel: z.enum(["confirmed", "strong_evidence", "moderate_evidence", "unverified", "disputed"]).optional(),
        lieTopic: z.string().optional(),
        notes: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateValues: Record<string, unknown> = {};

      if (data.incidentDate !== undefined) updateValues.incidentDate = new Date(data.incidentDate);
      if (data.incidentTime !== undefined) updateValues.incidentTime = data.incidentTime || null;
      if (data.title !== undefined) updateValues.title = data.title || null;
      if (data.description !== undefined) updateValues.description = data.description;
      if (data.transcript !== undefined) updateValues.transcript = data.transcript || null;
      if (data.personId !== undefined) updateValues.personId = data.personId || null;
      if (data.aliasId !== undefined) updateValues.aliasId = data.aliasId || null;
      if (data.platformId !== undefined) updateValues.platformId = data.platformId || null;
      if (data.attackerName !== undefined) updateValues.attackerName = data.attackerName || null;
      if (data.platform !== undefined) updateValues.platform = data.platform || null;
      if (data.eventType) updateValues.eventType = data.eventType;
      if (data.severity) updateValues.severity = data.severity;
      if (data.mentalHealthImpact) updateValues.mentalHealthImpact = data.mentalHealthImpact;
      if (data.status) updateValues.status = data.status;
      if (data.confidenceLevel) updateValues.confidenceLevel = data.confidenceLevel;
      if (data.lieTopic !== undefined) updateValues.lieTopic = data.lieTopic || null;
      if (data.notes !== undefined) updateValues.notes = data.notes || null;
      if (data.context !== undefined) updateValues.context = data.context || null;

      await db.update(incidents).set(updateValues).where(eq(incidents.id, id));
      return { success: true };
    }),

  // SOFT DELETE: sets deletedAt instead of actually deleting
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(incidents).set({ deletedAt: new Date() }).where(eq(incidents.id, input.id));
      return { success: true };
    }),

  // Restore a soft-deleted incident
  restore: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(incidents).set({ deletedAt: null }).where(eq(incidents.id, input.id));
      return { success: true };
    }),

  // List deleted (trash) incidents
  deleted: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), sql`${incidents.deletedAt} IS NOT NULL`))
      .orderBy(desc(incidents.deletedAt));
  }),

  addRelated: authedQuery
    .input(z.object({
      incidentId: z.number(),
      relatedIncidentId: z.number(),
      relationshipType: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(relatedIncidents).values({
        incidentId: input.incidentId,
        relatedIncidentId: input.relatedIncidentId,
        relationshipType: input.relationshipType || null,
        notes: input.notes || null,
      });
      return { success: true };
    }),

  removeRelated: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(relatedIncidents).where(eq(relatedIncidents.id, input.id));
      return { success: true };
    }),

  getRelated: authedQuery
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const links = await db
        .select()
        .from(relatedIncidents)
        .where(eq(relatedIncidents.incidentId, input.incidentId));

      const results = [];
      for (const link of links) {
        const related = await db
          .select()
          .from(incidents)
          .where(and(eq(incidents.id, link.relatedIncidentId), eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)));
        if (related[0]) {
          results.push({ linkId: link.id, relationshipType: link.relationshipType, notes: link.notes, incident: related[0] });
        }
      }
      return results;
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const totalResult = await db
      .select({ count: count() })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)));

    const deletedResult = await db
      .select({ count: count() })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), sql`${incidents.deletedAt} IS NOT NULL`));

    const byEventType = await db
      .select({ eventType: incidents.eventType, count: count() })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)))
      .groupBy(incidents.eventType);

    const byStatus = await db
      .select({ status: incidents.status, count: count() })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)))
      .groupBy(incidents.status);

    const byPerson = await db
      .select({ personId: incidents.personId, count: count() })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)))
      .groupBy(incidents.personId)
      .orderBy(desc(count()));

    const byPlatform = await db
      .select({ platform: incidents.platform, count: count() })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)))
      .groupBy(incidents.platform)
      .orderBy(desc(count()));

    const timelineResult = await db
      .select({
        month: sql<string>`DATE_FORMAT(${incidents.incidentDate}, '%Y-%m')`,
        count: count(),
        avgMentalHealth: sql<number>`AVG(${incidents.mentalHealthImpact})`,
        avgSeverity: sql<number>`AVG(${incidents.severity})`,
      })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)))
      .groupBy(sql`DATE_FORMAT(${incidents.incidentDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${incidents.incidentDate}, '%Y-%m')`);

    const avgMentalHealth = await db
      .select({ avg: sql<number>`AVG(${incidents.mentalHealthImpact})`, max: sql<number>`MAX(${incidents.mentalHealthImpact})` })
      .from(incidents)
      .where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)));

    return {
      total: totalResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
      byEventType,
      byStatus,
      byPerson,
      byPlatform,
      timeline: timelineResult,
      avgMentalHealth: Math.round((avgMentalHealth[0]?.avg ?? 0) * 10) / 10,
      maxMentalHealth: avgMentalHealth[0]?.max ?? 0,
    };
  }),

  filterOptions: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const eventTypes = await db.selectDistinct({ eventType: incidents.eventType })
      .from(incidents).where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)));
    const statuses = await db.selectDistinct({ status: incidents.status })
      .from(incidents).where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)));
    const platforms = await db.selectDistinct({ platform: incidents.platform })
      .from(incidents).where(and(eq(incidents.userId, ctx.user.id), isNull(incidents.deletedAt)));
    return {
      eventTypes: eventTypes.map((e) => e.eventType).filter(Boolean),
      statuses: statuses.map((s) => s.status).filter(Boolean),
      platforms: platforms.map((p) => p.platform).filter(Boolean),
    };
  }),
});
