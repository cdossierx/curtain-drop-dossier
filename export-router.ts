import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./connection";
import { incidents, persons, aliases, evidenceFiles, tags, platforms, incidentTags, relatedIncidents } from "@db/schema";
import { eq, isNull, sql, and } from "drizzle-orm";

export const exportRouter = createRouter({
  // Full data export — all user data as structured JSON
  full: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const userIncidents = await db
      .select()
      .from(incidents)
      .where(and(eq(incidents.userId, userId), isNull(incidents.deletedAt)));

    const userPersons = await db
      .select()
      .from(persons)
      .where(and(eq(persons.userId, userId), isNull(persons.deletedAt)));

    const userAliases = await db
      .select()
      .from(aliases)
      .where(and(eq(aliases.userId, userId), isNull(aliases.deletedAt)));

    const userEvidence = await db
      .select()
      .from(evidenceFiles)
      .where(and(eq(evidenceFiles.userId, userId), isNull(evidenceFiles.deletedAt)));

    const userTags = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), isNull(tags.deletedAt)));

    const userPlatforms = await db
      .select()
      .from(platforms)
      .where(and(eq(platforms.userId, userId), isNull(platforms.deletedAt)));

    const userIncidentTags = await db
      .select({ id: incidentTags.id, incidentId: incidentTags.incidentId, tagId: incidentTags.tagId })
      .from(incidentTags);

    // Filter to only user's data
    const incidentIds = new Set(userIncidents.map((i) => i.id));
    const tagIds = new Set(userTags.map((t) => t.id));
    const filteredIncidentTags = userIncidentTags.filter(
      (it) => incidentIds.has(it.incidentId) && tagIds.has(it.tagId)
    );

    const userRelatedIncidents = await db
      .select()
      .from(relatedIncidents);
    const filteredRelated = userRelatedIncidents.filter(
      (r) => incidentIds.has(r.incidentId) && incidentIds.has(r.relatedIncidentId)
    );

    // Also get soft-deleted (trash) data
    const deletedIncidents = await db
      .select()
      .from(incidents)
      .where(and(eq(incidents.userId, userId), sql`${incidents.deletedAt} IS NOT NULL`));
    const deletedPersons = await db
      .select()
      .from(persons)
      .where(and(eq(persons.userId, userId), sql`${persons.deletedAt} IS NOT NULL`));
    const deletedAliases = await db
      .select()
      .from(aliases)
      .where(and(eq(aliases.userId, userId), sql`${aliases.deletedAt} IS NOT NULL`));
    const deletedEvidence = await db
      .select()
      .from(evidenceFiles)
      .where(and(eq(evidenceFiles.userId, userId), sql`${evidenceFiles.deletedAt} IS NOT NULL`));
    const deletedTags = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), sql`${tags.deletedAt} IS NOT NULL`));

    return {
      exportDate: new Date().toISOString(),
      userId,
      summary: {
        incidents: userIncidents.length,
        persons: userPersons.length,
        aliases: userAliases.length,
        evidence: userEvidence.length,
        tags: userTags.length,
        platforms: userPlatforms.length,
        deletedInTrash: {
          incidents: deletedIncidents.length,
          persons: deletedPersons.length,
          aliases: deletedAliases.length,
          evidence: deletedEvidence.length,
          tags: deletedTags.length,
        },
      },
      data: {
        incidents: userIncidents,
        persons: userPersons,
        aliases: userAliases,
        evidence: userEvidence,
        tags: userTags,
        platforms: userPlatforms,
        incidentTags: filteredIncidentTags,
        relatedIncidents: filteredRelated,
        trash: {
          incidents: deletedIncidents,
          persons: deletedPersons,
          aliases: deletedAliases,
          evidence: deletedEvidence,
          tags: deletedTags,
        },
      },
    };
  }),
});

