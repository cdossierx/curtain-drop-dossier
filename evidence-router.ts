import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { evidenceFiles } from "@db/schema";
import { eq, desc, count, isNull, and } from "drizzle-orm";

export const evidenceRouter = createRouter({
  create: authedQuery
    .input(z.object({
      incidentId: z.number().optional(), personId: z.number().optional(),
      fileName: z.string().min(1), fileUrl: z.string().optional(),
      filePath: z.string().optional(),
      storageType: z.enum(["url", "upload"]).optional(),
      evidenceType: z.enum(["screenshot", "video_clip", "full_video", "audio_recording", "transcript", "chat_log", "court_document", "social_media_post"]),
      sourceType: z.enum(["screenshot", "video_clip", "full_video", "audio_recording", "transcript", "chat_log", "court_document", "social_media_post", "eyewitness", "third_party"]).optional(),
      capturedBy: z.string().optional(), captureDate: z.string().optional(),
      originalPlatform: z.string().optional(), description: z.string().optional(),
      confidence: z.enum(["confirmed", "strong_evidence", "moderate_evidence", "unverified", "disputed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(evidenceFiles).values({
        userId: ctx.user.id, incidentId: input.incidentId || null, personId: input.personId || null,
        fileName: input.fileName, fileUrl: input.fileUrl || null, filePath: input.filePath || null,
        storageType: input.storageType || (input.filePath ? "upload" : "url"),
        evidenceType: input.evidenceType,
        sourceType: input.sourceType || null, capturedBy: input.capturedBy || null,
        captureDate: input.captureDate ? new Date(input.captureDate) : null,
        originalPlatform: input.originalPlatform || null, description: input.description || null,
        confidence: input.confidence || "unverified",
      });
      return { id: Number(result[0].insertId) };
    }),

  list: authedQuery
    .input(z.object({ incidentId: z.number().optional(), personId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(evidenceFiles.userId, ctx.user.id), isNull(evidenceFiles.deletedAt)];
      if (input?.incidentId) conditions.push(eq(evidenceFiles.incidentId, input.incidentId));
      if (input?.personId) conditions.push(eq(evidenceFiles.personId, input.personId));
      return db.select().from(evidenceFiles).where(and(...conditions)).orderBy(desc(evidenceFiles.createdAt));
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(), fileName: z.string().optional(), fileUrl: z.string().optional(),
      filePath: z.string().optional(),
      storageType: z.enum(["url", "upload"]).optional(),
      evidenceType: z.enum(["screenshot", "video_clip", "full_video", "audio_recording", "transcript", "chat_log", "court_document", "social_media_post"]).optional(),
      description: z.string().optional(),
      confidence: z.enum(["confirmed", "strong_evidence", "moderate_evidence", "unverified", "disputed"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateValues: Record<string, unknown> = {};
      if (data.fileName) updateValues.fileName = data.fileName;
      if (data.fileUrl !== undefined) updateValues.fileUrl = data.fileUrl || null;
      if (data.filePath !== undefined) updateValues.filePath = data.filePath || null;
      if (data.storageType) updateValues.storageType = data.storageType;
      if (data.evidenceType) updateValues.evidenceType = data.evidenceType;
      if (data.description !== undefined) updateValues.description = data.description || null;
      if (data.confidence) updateValues.confidence = data.confidence;
      await db.update(evidenceFiles).set(updateValues).where(eq(evidenceFiles.id, id));
      return { success: true };
    }),

  // SOFT DELETE
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(evidenceFiles).set({ deletedAt: new Date() }).where(eq(evidenceFiles.id, input.id));
      return { success: true };
    }),

  restore: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(evidenceFiles).set({ deletedAt: null }).where(eq(evidenceFiles.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const totalResult = await db.select({ count: count() }).from(evidenceFiles)
      .where(and(eq(evidenceFiles.userId, ctx.user.id), isNull(evidenceFiles.deletedAt)));
    const byType = await db.select({ evidenceType: evidenceFiles.evidenceType, count: count() })
      .from(evidenceFiles).where(and(eq(evidenceFiles.userId, ctx.user.id), isNull(evidenceFiles.deletedAt)))
      .groupBy(evidenceFiles.evidenceType);
    return { total: totalResult[0]?.count ?? 0, byType };
  }),
});
