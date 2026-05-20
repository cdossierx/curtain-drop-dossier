import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./connection";
import { incidents, persons, aliases, evidenceFiles, tags, intakeQueue } from "@db/schema";
import { eq, isNull, sql, and } from "drizzle-orm";

export const searchRouter = createRouter({
  global: publicQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user?.id ?? 1;
      const term = `%${input.query}%`;

      // Search incidents: title, description, transcript, attackerName, lieTopic, context, notes
      const incidentResults = await db
        .select({
          id: incidents.id,
          title: incidents.title,
          description: incidents.description,
          eventType: incidents.eventType,
          incidentDate: incidents.incidentDate,
          attackerName: incidents.attackerName,
        })
        .from(incidents)
        .where(
          and(
            eq(incidents.userId, userId),
            isNull(incidents.deletedAt),
            sql`(
              ${incidents.title} LIKE ${term} OR
              ${incidents.description} LIKE ${term} OR
              ${incidents.transcript} LIKE ${term} OR
              ${incidents.attackerName} LIKE ${term} OR
              ${incidents.lieTopic} LIKE ${term} OR
              ${incidents.context} LIKE ${term} OR
              ${incidents.notes} LIKE ${term}
            )`
          )
        )
        .orderBy(sql`${incidents.incidentDate} DESC`)
        .limit(10);

      // Search persons: displayName, notes
      const personResults = await db
        .select({
          id: persons.id,
          displayName: persons.displayName,
          firstSeenDate: persons.firstSeenDate,
          notes: persons.notes,
        })
        .from(persons)
        .where(
          and(
            eq(persons.userId, userId),
            isNull(persons.deletedAt),
            sql`(
              ${persons.displayName} LIKE ${term} OR
              ${persons.notes} LIKE ${term}
            )`
          )
        )
        .limit(10);

      // Search aliases: alias, suspectedOperator, evidenceDescription, notes
      const aliasResults = await db
        .select({
          id: aliases.id,
          alias: aliases.alias,
          suspectedOperator: aliases.suspectedOperator,
          confidence: aliases.confidence,
          notes: aliases.notes,
        })
        .from(aliases)
        .where(
          and(
            eq(aliases.userId, userId),
            isNull(aliases.deletedAt),
            sql`(
              ${aliases.alias} LIKE ${term} OR
              ${aliases.suspectedOperator} LIKE ${term} OR
              ${aliases.evidenceDescription} LIKE ${term} OR
              ${aliases.notes} LIKE ${term}
            )`
          )
        )
        .limit(10);

      // Search evidence: fileName, description, originalPlatform
      const evidenceResults = await db
        .select({
          id: evidenceFiles.id,
          fileName: evidenceFiles.fileName,
          description: evidenceFiles.description,
          evidenceType: evidenceFiles.evidenceType,
          storageType: evidenceFiles.storageType,
          filePath: evidenceFiles.filePath,
          fileUrl: evidenceFiles.fileUrl,
        })
        .from(evidenceFiles)
        .where(
          and(
            eq(evidenceFiles.userId, userId),
            isNull(evidenceFiles.deletedAt),
            sql`(
              ${evidenceFiles.fileName} LIKE ${term} OR
              ${evidenceFiles.description} LIKE ${term} OR
              ${evidenceFiles.originalPlatform} LIKE ${term}
            )`
          )
        )
        .limit(10);

      // Search tags: name, description
      const tagResults = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
          description: tags.description,
        })
        .from(tags)
        .where(
          and(
            eq(tags.userId, userId),
            isNull(tags.deletedAt),
            sql`(
              ${tags.name} LIKE ${term} OR
              ${tags.description} LIKE ${term}
            )`
          )
        )
        .limit(10);

      // Search intake queue: extractedText, transcriptText, originalFilename, description
      const intakeResults = await db
        .select({
          id: intakeQueue.id,
          originalFilename: intakeQueue.originalFilename,
          extractedText: intakeQueue.extractedText,
          transcriptText: intakeQueue.transcriptText,
          description: intakeQueue.description,
          mimeType: intakeQueue.mimeType,
          filePath: intakeQueue.filePath,
        })
        .from(intakeQueue)
        .where(
          and(
            eq(intakeQueue.userId, userId),
            sql`(
              ${intakeQueue.originalFilename} LIKE ${term} OR
              ${intakeQueue.extractedText} LIKE ${term} OR
              ${intakeQueue.transcriptText} LIKE ${term} OR
              ${intakeQueue.description} LIKE ${term} OR
              ${intakeQueue.notes} LIKE ${term}
            )`
          )
        )
        .limit(10);

      return {
        incidents: incidentResults,
        persons: personResults,
        aliases: aliasResults,
        evidence: evidenceResults,
        tags: tagResults,
        intake: intakeResults,
      };
    }),
});
