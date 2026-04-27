import { relations } from "drizzle-orm";
import {
  users,
  persons,
  aliases,
  platforms,
  tags,
  incidents,
  evidenceFiles,
  incidentTags,
  relatedIncidents,
} from "./schema";

// ─── User Relations ─────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  incidents: many(incidents),
  persons: many(persons),
  aliases: many(aliases),
  platforms: many(platforms),
  tags: many(tags),
  evidenceFiles: many(evidenceFiles),
}));

// ─── Person Relations ───────────────────────────────────────────
export const personsRelations = relations(persons, ({ one, many }) => ({
  user: one(users, {
    fields: [persons.userId],
    references: [users.id],
  }),
  aliases: many(aliases),
  incidents: many(incidents),
  evidenceFiles: many(evidenceFiles),
}));

// ─── Alias Relations ────────────────────────────────────────────
export const aliasesRelations = relations(aliases, ({ one, many }) => ({
  user: one(users, {
    fields: [aliases.userId],
    references: [users.id],
  }),
  person: one(persons, {
    fields: [aliases.personId],
    references: [persons.id],
  }),
  platform: one(platforms, {
    fields: [aliases.platformId],
    references: [platforms.id],
  }),
  incidents: many(incidents),
}));

// ─── Platform Relations ─────────────────────────────────────────
export const platformsRelations = relations(platforms, ({ one, many }) => ({
  user: one(users, {
    fields: [platforms.userId],
    references: [users.id],
  }),
  aliases: many(aliases),
  incidents: many(incidents),
}));

// ─── Tag Relations ──────────────────────────────────────────────
export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  incidentTags: many(incidentTags),
}));

// ─── Incident Relations ─────────────────────────────────────────
export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  user: one(users, {
    fields: [incidents.userId],
    references: [users.id],
  }),
  person: one(persons, {
    fields: [incidents.personId],
    references: [persons.id],
  }),
  alias: one(aliases, {
    fields: [incidents.aliasId],
    references: [aliases.id],
  }),
  platform: one(platforms, {
    fields: [incidents.platformId],
    references: [platforms.id],
  }),
  evidenceFiles: many(evidenceFiles),
  incidentTags: many(incidentTags),
  relatedIncidents: many(relatedIncidents),
}));

// ─── Evidence File Relations ────────────────────────────────────
export const evidenceFilesRelations = relations(evidenceFiles, ({ one }) => ({
  user: one(users, {
    fields: [evidenceFiles.userId],
    references: [users.id],
  }),
  incident: one(incidents, {
    fields: [evidenceFiles.incidentId],
    references: [incidents.id],
  }),
  person: one(persons, {
    fields: [evidenceFiles.personId],
    references: [persons.id],
  }),
}));

// ─── Incident Tag Relations ─────────────────────────────────────
export const incidentTagsRelations = relations(incidentTags, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentTags.incidentId],
    references: [incidents.id],
  }),
  tag: one(tags, {
    fields: [incidentTags.tagId],
    references: [tags.id],
  }),
}));

// ─── Related Incident Relations ─────────────────────────────────
export const relatedIncidentsRelations = relations(relatedIncidents, ({ one }) => ({
  incident: one(incidents, {
    fields: [relatedIncidents.incidentId],
    references: [incidents.id],
  }),
  relatedIncident: one(incidents, {
    fields: [relatedIncidents.relatedIncidentId],
    references: [incidents.id],
  }),
}));
