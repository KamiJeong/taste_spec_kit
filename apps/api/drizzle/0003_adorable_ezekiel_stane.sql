CREATE TABLE "audit_logs" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"email" text,
	"ip" text NOT NULL,
	"user_agent" text NOT NULL,
	"result" text NOT NULL,
	"reason_code" text,
	"occurred_at" text NOT NULL
);
