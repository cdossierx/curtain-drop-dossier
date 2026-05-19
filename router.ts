import { authRouter } from "./auth-router";
import { incidentsRouter } from "./incidents-router";
import { personsRouter } from "./persons-router";
import { aliasesRouter } from "./aliases-router";
import { tagsRouter } from "./tags-router";
import { evidenceRouter } from "./evidence-router";
import { platformsRouter } from "./platforms-router";
import { exportRouter } from "./export-router";
import { searchRouter } from "./search-router";
import { intakeRouter } from "./intake-router";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./connection";
import { env } from "./env";
import { sql } from "drizzle-orm";

export const appRouter = createRouter({
  ping: publicQuery.query(async () => {
    if (!env.databaseUrl) {
      return { ok: false, database: false, error: "DATABASE_URL is not configured.", ts: Date.now() };
    }

    await getDb().execute(sql`select 1`);
    return { ok: true, database: true, ts: Date.now() };
  }),
  auth: authRouter,
  incidents: incidentsRouter,
  persons: personsRouter,
  aliases: aliasesRouter,
  tags: tagsRouter,
  evidence: evidenceRouter,
  platforms: platformsRouter,
  export: exportRouter,
  search: searchRouter,
  intake: intakeRouter,
});

export type AppRouter = typeof appRouter;
