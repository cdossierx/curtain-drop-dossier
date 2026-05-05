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

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
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
