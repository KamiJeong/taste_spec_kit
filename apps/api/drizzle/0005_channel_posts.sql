CREATE TABLE "channel_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"deleted_at" text,
	CONSTRAINT "channel_posts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE,
	CONSTRAINT "chk_channel_posts_title_non_empty" CHECK (char_length(trim(title)) > 0),
	CONSTRAINT "chk_channel_posts_content_non_empty" CHECK (char_length(trim(content)) > 0)
);
--> statement-breakpoint
CREATE INDEX "idx_channel_posts_channel_created_id" ON "channel_posts" ("channel_id","created_at","id");
--> statement-breakpoint
CREATE INDEX "idx_channel_posts_author_created" ON "channel_posts" ("author_user_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_channel_posts_channel_deleted" ON "channel_posts" ("channel_id","deleted_at");
