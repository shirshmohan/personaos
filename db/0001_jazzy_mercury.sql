CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"format" text NOT NULL,
	"bytes" integer NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "entity" ADD COLUMN "body" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "entity" ADD COLUMN "cover_media_id" text;--> statement-breakpoint
ALTER TABLE "entity" ADD CONSTRAINT "entity_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;