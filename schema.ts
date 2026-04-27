/**
 * DATA SAFETY WARNING — READ BEFORE MODIFYING
 *
 * This schema defines ALL tables for the Curtain Drop Dossier application.
 * The data is stored in a remote MySQL database (Alibaba Cloud) and
 * persists across restarts and rebuilds.
 *
 * CRITICAL: Once you have real investigation data loaded:
 *   - NEVER run scripts that drop tables (db/clean.mjs, db/reset.ts)
 *     These files have been DELETED from the project to prevent accidents.
 *   - NEVER run `db:push --force` — it accepts destructive changes silently
 *   - NEVER modify column types that would cause data loss
 *   - For schema changes, use `npm run db:push` (safe, non-destructive)
 *   - ALWAYS export your data before any schema change (Safety page)
 *
 * Correct usage:
 *   1. cd /mnt/agents/output/app
 *   2. npm run dev
 *   3. Open http://localhost:3000
 *   4. The app connects to the real database automatically
 */

import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  date,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ───────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Platforms ──────────────────────────────────────────────────
export const platforms = mysqlTable("platforms", {
  id: serial("id").primaryKey(),
  userId: int("userId", { unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  urlPattern: varchar("urlPattern", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = typeof platforms.$inferInsert;

// ─── Persons ────────────────────────────────────────────────────
export const persons = mysqlTable("persons", {
  id: serial("id").primaryKey(),
  userId: int("userId", { unsigned: true }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  firstSeenDate: date("firstSeenDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deletedAt"),
});

export type Person = typeof persons.$inferSelect;
export type InsertPerson = typeof persons.$inferInsert;

// ─── Aliases ────────────────────────────────────────────────────
export const aliases = mysqlTable("aliases", {
  id: serial("id").primaryKey(),
  userId: int("userId", { unsigned: true }).notNull(),
  personId: bigint("personId", { mode: "number", unsigned: true }),
  alias: varchar("alias", { length: 255 }).notNull(),
  platformId: bigint("platformId", { mode: "number", unsigned: true }),
  suspectedOperator: varchar("suspectedOperator", { length: 255 }),
  confidence: mysqlEnum("confidence", [
    "confirmed",
    "strong_evidence",
    "moderate_evidence",
    "unverified",
    "disputed",
  ])
    .default("unverified")
    .notNull(),
  evidenceDescription: text("evidenceDescription"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Alias = typeof aliases.$inferSelect;
export type InsertAlias = typeof aliases.$inferInsert;

// ─── Tags ───────────────────────────────────────────────────────
export const tags = mysqlTable("tags", {
  id: serial("id").primaryKey(),
  userId: int("userId", { unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

// ─── Incidents ──────────────────────────────────────────────────
export const incidents = mysqlTable("incidents", {
  id: serial("id").primaryKey(),
  userId: int("userId", { unsigned: true }).notNull(),

  // Core fields
  incidentDate: date("incidentDate").notNull(),
  incidentTime: varchar("incidentTime", { length: 20 }),
  title: varchar("title", { length: 500 }),
  description: text("description").notNull(),
  transcript: text("transcript"),

  // Relationships
  personId: bigint("personId", { mode: "number", unsigned: true }),
  aliasId: bigint("aliasId", { mode: "number", unsigned: true }),
  platformId: bigint("platformId", { mode: "number", unsigned: true }),

  // Classification
  eventType: mysqlEnum("eventType", [
    "harassment",
    "defamation",
    "doxxing",
    "threat",
    "narrative_seeding",
    "dogpiling",
    "coordinated_live",
    "evidence_leak",
    "false_allegation",
    "account_creation",
    "account_deletion",
  ])
    .default("harassment")
    .notNull(),

  severity: int("severity", { unsigned: true }).notNull().default(1),
  mentalHealthImpact: int("mentalHealthImpact", { unsigned: true })
    .notNull()
    .default(1),

  // Status & confidence
  status: mysqlEnum("status", [
    "unreviewed",
    "logged",
    "verified",
    "archived",
    "included_in_report",
  ])
    .default("unreviewed")
    .notNull(),

  confidenceLevel: mysqlEnum("confidenceLevel", [
    "confirmed",
    "strong_evidence",
    "moderate_evidence",
    "unverified",
    "disputed",
  ])
    .default("unverified")
    .notNull(),

  // Source tracking
  sourceType: mysqlEnum("sourceType", [
    "screenshot",
    "video_clip",
    "full_video",
    "audio_recording",
    "transcript",
    "chat_log",
    "court_document",
    "social_media_post",
    "eyewitness",
    "third_party",
  ]),
  capturedBy: varchar("capturedBy", { length: 255 }),
  captureDate: date("captureDate"),

  // Notes
  notes: text("notes"),
  context: text("context"),

  // Legacy compatibility
  attackerName: varchar("attackerName", { length: 255 }),
  platform: varchar("platform", { length: 100 }),
  lieTopic: varchar("lieTopic", { length: 500 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deletedAt"),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// ─── Evidence Files ─────────────────────────────────────────────
export const evidenceFiles = mysqlTable("evidence_files", {
  id: serial("id").primaryKey(),
  userId: int("userId", { unsigned: true }).notNull(),
  incidentId: bigint("incidentId", { mode: "number", unsigned: true }),
  personId: bigint("personId", { mode: "number", unsigned: true }),

  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl"),
  filePath: varchar("filePath", { length: 500 }),
  storageType: mysqlEnum("storageType", ["url", "upload"]).default("url").notNull(),
  evidenceType: mysqlEnum("evidenceType", [
    "screenshot",
    "video_clip",
    "full_video",
    "audio_recording",
    "transcript",
    "chat_log",
    "court_document",
    "social_media_post",
  ])
    .default("screenshot")
    .notNull(),

  sourceType: mysqlEnum("sourceType", [
    "screenshot",
    "video_clip",
    "full_video",
    "audio_recording",
    "transcript",
    "chat_log",
    "court_document",
    "social_media_post",
    "eyewitness",
    "third_party",
  ]),
  capturedBy: varchar("capturedBy", { length: 255 }),
  captureDate: date("captureDate"),
  originalPlatform: varchar("originalPlatform", { length: 100 }),

  description: text("description"),
  confidence: mysqlEnum("confidence", [
    "confirmed",
    "strong_evidence",
    "moderate_evidence",
    "unverified",
    "disputed",
  ])
    .default("unverified")
    .notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type EvidenceFile = typeof evidenceFiles.$inferSelect;
export type InsertEvidenceFile = typeof evidenceFiles.$inferInsert;

// ─── Incident Tags (Many-to-Many) ───────────────────────────────
export const incidentTags = mysqlTable("incident_tags", {
  id: serial("id").primaryKey(),
  incidentId: bigint("incidentId", { mode: "number", unsigned: true }).notNull(),
  tagId: bigint("tagId", { mode: "number", unsigned: true }).notNull(),
});

// ─── Related Incidents (Cross-linking) ──────────────────────────
export const relatedIncidents = mysqlTable("related_incidents", {
  id: serial("id").primaryKey(),
  incidentId: bigint("incidentId", { mode: "number", unsigned: true }).notNull(),
  relatedIncidentId: bigint("relatedIncidentId", { mode: "number", unsigned: true }).notNull(),
  relationshipType: varchar("relationshipType", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Intake Queue (Bulk Evidence Review) ────────────────────────
export const intakeQueue = mysqlTable("intake_queue", {
  id: serial("id").primaryKey(),
  userId: int("userId", { unsigned: true }).notNull(),

  // File info
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  storedFilename: varchar("storedFilename", { length: 255 }).notNull(),
  filePath: varchar("filePath", { length: 500 }).notNull(),
  fileSize: int("fileSize", { unsigned: true }).notNull(),
  fileHash: varchar("fileHash", { length: 64 }).notNull(), // SHA-256 for dedup
  mimeType: varchar("mimeType", { length: 100 }),

  // Source type
  sourceType: mysqlEnum("sourceType", ["upload", "paste"]).default("upload").notNull(),

  // Status: pending → reviewed → converted | discarded
  status: mysqlEnum("status", ["pending", "reviewed", "converted", "discarded"])
    .default("pending")
    .notNull(),

  // Extracted content
  extractedText: text("extractedText"), // PDF text extraction
  transcriptText: text("transcriptText"), // YouTube transcripts or pasted text

  // Suggestions (populated during review/extraction)
  suggestedTitle: varchar("suggestedTitle", { length: 500 }),
  suggestedDate: date("suggestedDate"),
  suggestedPlatform: varchar("suggestedPlatform", { length: 100 }),
  suggestedPersonIds: text("suggestedPersonIds"), // JSON array of person IDs
  suggestedTagIds: text("suggestedTagIds"), // JSON array of tag IDs

  // Evidence classification
  evidenceType: mysqlEnum("evidenceType", [
    "screenshot",
    "video_clip",
    "full_video",
    "audio_recording",
    "transcript",
    "chat_log",
    "court_document",
    "social_media_post",
  ]),
  confidence: mysqlEnum("confidence", [
    "confirmed",
    "strong_evidence",
    "moderate_evidence",
    "unverified",
    "disputed",
  ])
    .default("unverified"),

  // Linked records (set when converted)
  linkedEvidenceId: bigint("linkedEvidenceId", { mode: "number", unsigned: true }),
  linkedIncidentId: bigint("linkedIncidentId", { mode: "number", unsigned: true }),
  draftIncidentId: bigint("draftIncidentId", { mode: "number", unsigned: true }),

  // User notes
  notes: text("notes"),
  description: text("description"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntakeItem = typeof intakeQueue.$inferSelect;
export type InsertIntakeItem = typeof intakeQueue.$inferInsert;
