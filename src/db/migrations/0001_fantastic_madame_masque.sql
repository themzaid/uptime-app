CREATE TABLE "user_settings" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"alert_cooldown" integer DEFAULT 15 NOT NULL,
	"email_alerts_enabled" boolean DEFAULT true NOT NULL,
	"slack_alerts_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "alert_sent" boolean DEFAULT false NOT NULL;