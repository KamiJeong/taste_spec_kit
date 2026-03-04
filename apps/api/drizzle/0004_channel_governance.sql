CREATE TYPE "channel_role" AS ENUM('owner', 'manager', 'member');
--> statement-breakpoint
CREATE TYPE "channel_join_request_status" AS ENUM('pending', 'approved', 'rejected');
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_members" (
	"channel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "channel_role" NOT NULL,
	"joined_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "pk_channel_members" PRIMARY KEY("channel_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "channel_join_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"requester_user_id" text NOT NULL,
	"status" "channel_join_request_status" NOT NULL,
	"reviewed_by_user_id" text,
	"reviewed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "chk_channel_join_requests_review_state" CHECK (
		(
			status = 'pending'
			AND reviewed_by_user_id IS NULL
			AND reviewed_at IS NULL
		)
		OR (
			status IN ('approved', 'rejected')
			AND reviewed_by_user_id IS NOT NULL
			AND reviewed_at IS NOT NULL
		)
	)
);
--> statement-breakpoint
CREATE TABLE "user_channel_orders" (
	"user_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"sort_index" integer NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "pk_user_channel_orders" PRIMARY KEY("user_id","channel_id"),
	CONSTRAINT "chk_user_channel_orders_sort_non_negative" CHECK (sort_index >= 0)
);
--> statement-breakpoint
CREATE INDEX "idx_channels_owner_user_id" ON "channels" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX "idx_channel_members_user_id" ON "channel_members" ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_channel_members_channel_role" ON "channel_members" ("channel_id","role");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_channel_single_owner" ON "channel_members" ("channel_id") WHERE "role" = 'owner';
--> statement-breakpoint
CREATE INDEX "idx_channel_join_requests_channel_status_created" ON "channel_join_requests" ("channel_id","status","created_at");
--> statement-breakpoint
CREATE INDEX "idx_channel_join_requests_requester_created" ON "channel_join_requests" ("requester_user_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_channel_join_requests_pending" ON "channel_join_requests" ("channel_id","requester_user_id") WHERE "status" = 'pending';
--> statement-breakpoint
CREATE INDEX "idx_user_channel_orders_user_sort" ON "user_channel_orders" ("user_id","sort_index");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_channel_orders_user_sort" ON "user_channel_orders" ("user_id","sort_index");
