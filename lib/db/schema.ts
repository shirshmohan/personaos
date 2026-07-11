import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

/* -------------------------------------------------------------------------- */
/* Auth.js tables (Drizzle adapter contract — shape is dictated by Auth.js)    */
/* -------------------------------------------------------------------------- */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/* -------------------------------------------------------------------------- */
/* Entities — the spine of Persona OS (Rule 6: Everything is an Entity)       */
/*                                                                            */
/* D12: ONE table, discriminated by `type`, with type-specific fields in a    */
/* JSONB `metadata` column. Stubbed here in M1 to prove migrations run        */
/* end-to-end; expanded (relationships, collections, media, tags) at M4.      */
/* -------------------------------------------------------------------------- */

export const ENTITY_TYPES = [
  "career",
  "writing",
  "travel",
  "train", // D11: the DSA / practice log
  "library",
  "gallery",
  "projects", // D41
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_STATUSES = ["draft", "published", "archived"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

/** Cloudinary references. We never store bytes, only the public_id. */
export const media = pgTable("media", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  publicId: text("public_id").notNull().unique(),
  url: text("url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  format: text("format").notNull(),
  bytes: integer("bytes").notNull(),
  /** Never optional in the UI. Accessibility is a floor, not a polish step. */
  alt: text("alt").notNull().default(""),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type Media = typeof media.$inferSelect;

export const entities = pgTable(
  "entity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text("type").$type<EntityType>().notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: text("status").$type<EntityStatus>().notNull().default("draft"),
    /** Structured blocks (D20), not markdown. See features/entities/blocks.ts */
    body: jsonb("body").$type<unknown[]>().notNull().default([]),
    coverMediaId: text("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    /** Type-specific fields live here until they earn a column. */
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    /** Drives the Timeline (M7). Derived, never stored as a separate table. */
    occurredAt: timestamp("occurred_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      /** Without this, "Recently edited" silently lies. */
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("entity_slug_idx").on(t.slug),
    index("entity_type_status_idx").on(t.type, t.status),
  ],
);

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

/* -------------------------------------------------------------------------- */
/* Relationships — Rule 8: relationships power the site.                      */
/*                                                                            */
/* Stored once, directionally (A -> B), but queried from both ends. The Atlas */
/* (M6) is a view over this table; it stores nothing of its own.              */
/* -------------------------------------------------------------------------- */

export const RELATIONSHIP_TYPES = [
  "related_to",
  "part_of",
  "inspired_by",
  "located_at",
  "references",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const relationships = pgTable(
  "relationship",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fromEntityId: text("from_entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    toEntityId: text("to_entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    type: text("type").$type<RelationshipType>().notNull().default("related_to"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // The same edge twice is meaningless.
    uniqueIndex("relationship_edge_idx").on(t.fromEntityId, t.toEntityId, t.type),
    // Both directions get an index; the Atlas walks the graph from either end.
    index("relationship_from_idx").on(t.fromEntityId),
    index("relationship_to_idx").on(t.toEntityId),
    // An entity related to itself is a bug, enforced by the database.
    check("relationship_no_self_link", sql`${t.fromEntityId} <> ${t.toEntityId}`),
  ],
);

export type Relationship = typeof relationships.$inferSelect;

/* -------------------------------------------------------------------------- */
/* Tags — cross-cutting labels. Search (M8) wants these.                       */
/* -------------------------------------------------------------------------- */

export const tags = pgTable("tag", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export type Tag = typeof tags.$inferSelect;

export const entityTags = pgTable(
  "entity_tag",
  {
    entityId: text("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.entityId, t.tagId] })],
);
