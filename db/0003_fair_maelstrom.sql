CREATE TABLE "leetcode_problem" (
	"slug" text PRIMARY KEY NOT NULL,
	"frontend_id" integer,
	"title" text NOT NULL,
	"difficulty" text NOT NULL,
	"topic_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paid_only" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_pattern" (
	"problem_id" text NOT NULL,
	"pattern_entity_id" text NOT NULL,
	CONSTRAINT "problem_pattern_problem_id_pattern_entity_id_pk" PRIMARY KEY("problem_id","pattern_entity_id")
);
--> statement-breakpoint
CREATE TABLE "problem" (
	"id" text PRIMARY KEY NOT NULL,
	"leetcode_slug" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"difficulty" text NOT NULL,
	"important" boolean DEFAULT false NOT NULL,
	"my_rating" integer,
	"comment" text,
	"solved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_pattern" ADD CONSTRAINT "problem_pattern_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_pattern" ADD CONSTRAINT "problem_pattern_pattern_entity_id_entity_id_fk" FOREIGN KEY ("pattern_entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_leetcode_slug_leetcode_problem_slug_fk" FOREIGN KEY ("leetcode_slug") REFERENCES "public"."leetcode_problem"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leetcode_problem_title_idx" ON "leetcode_problem" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_leetcode_slug_idx" ON "problem" USING btree ("leetcode_slug");--> statement-breakpoint
CREATE INDEX "problem_important_idx" ON "problem" USING btree ("important");