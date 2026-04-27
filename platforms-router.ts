import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { platforms } from "@db/schema";
import { eq, desc, count, isNull, and } from "drizzle-orm";

export const platformsRouter = createRouter({
  create: authedQuery
    .input(z.object({ name: z.string().min(1), urlPattern: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(platforms).values({
        userId: ctx.user.id, name: input.name, urlPattern: input.urlPattern || null, notes: input.notes || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(platforms)
      .where(and(eq(platforms.userId, ctx.user.id), isNull(platforms.deletedAt)))
      .orderBy(desc(platforms.createdAt));
  }),

  update: authedQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), urlPattern: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateValues: Record<string, unknown> = {};
      if (data.name) updateValues.name = data.name;
      if (data.urlPattern !== undefined) updateValues.urlPattern = data.urlPattern || null;
      if (data.notes !== undefined) updateValues.notes = data.notes || null;
      await db.update(platforms).set(updateValues).where(eq(platforms.id, id));
      return { success: true };
    }),

  // SOFT DELETE
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(platforms).set({ deletedAt: new Date() }).where(eq(platforms.id, input.id));
      return { success: true };
    }),

  restore: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(platforms).set({ deletedAt: null }).where(eq(platforms.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db.select({ count: count() }).from(platforms)
      .where(and(eq(platforms.userId, ctx.user.id), isNull(platforms.deletedAt)));
    return { total: result[0]?.count ?? 0 };
  }),
});
