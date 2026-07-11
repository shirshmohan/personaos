CREATE TABLE "entity_tag" (
	"entity_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "entity_tag_entity_id_tag_id_pk" PRIMARY KEY("entity_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "relationship" (
	"id" text PRIMARY KEY NOT NULL,
	"from_entity_id" text NOT NULL,
	"to_entity_id" text NOT NULL,
	"type" text DEFAULT 'related_to' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_no_self_link" CHECK ("relationship"."from_entity_id" <> "relationship"."to_entity_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "entity_tag" ADD CONSTRAINT "entity_tag_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tag" ADD CONSTRAINT "entity_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_from_entity_id_entity_id_fk" FOREIGN KEY ("from_entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_to_entity_id_entity_id_fk" FOREIGN KEY ("to_entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "relationship_edge_idx" ON "relationship" USING btree ("from_entity_id","to_entity_id","type");--> statement-breakpoint
CREATE INDEX "relationship_from_idx" ON "relationship" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "relationship_to_idx" ON "relationship" USING btree ("to_entity_id");