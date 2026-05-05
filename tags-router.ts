import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tags, incidentTags } from "@db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";

export const tagsRouter = createRouter({
  create: authedQuery
    .input(z.object({ name: z.string().min(1), color: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(tags).values({
        userId: ctx.user.id, name: input.name, color: input.color || "#3b82f6", description: input.description || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(tags)
      .where(and(eq(tags.userId, ctx.user.id), isNull(tags.deletedAt)))
      .orderBy(desc(tags.createdAt));
  }),

  update: authedQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), color: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateValues: Record<string, unknown> = {};
      if (data.name) updateValues.name = data.name;
      if (data.color) updateValues.color = data.color;
      if (data.description !== undefined) updateValues.description = data.description || null;
      await db.update(tags).set(updateValues).where(eq(tags.id, id));
      return { success: true };
    }),

  // SOFT DELETE
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(tags).set({ deletedAt: new Date() }).where(eq(tags.id, input.id));
      return { success: true };
    }),

  restore: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(tags).set({ deletedAt: null }).where(eq(tags.id, input.id));
      return { success: true };
    }),

  // Get all tags applied to user's incidents
  forUserIncidents: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    // Join incident_tags with tags to get tag names/colors for all user's incidents
    const result = await db.select({
      incidentId: incidentTags.incidentId,
      tagId: incidentTags.tagId,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(incidentTags)
    .innerJoin(tags, eq(incidentTags.tagId, tags.id))
    .where(and(eq(tags.userId, ctx.user.id), isNull(tags.deletedAt)));
    return result;
  }),

  tagIncident: authedQuery
    .input(z.object({ incidentId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(incidentTags).values({ incidentId: input.incidentId, tagId: input.tagId });
      return { success: true };
    }),

  untagIncident: authedQuery
    .input(z.object({ incidentId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(incidentTags)
        .where(and(eq(incidentTags.incidentId, input.incidentId), eq(incidentTags.tagId, input.tagId)));
      return { success: true };
    }),
});
