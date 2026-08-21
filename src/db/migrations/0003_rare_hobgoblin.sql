CREATE TYPE "public"."subscription_status" AS ENUM('PENDENTE', 'ATIVA', 'VENCIDA', 'CANCELADA');--> statement-breakpoint
CREATE TABLE "asaas_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"asaas_customer_id" text NOT NULL,
	"asaas_subscription_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'PENDENTE' NOT NULL,
	"value_cents" integer NOT NULL,
	"next_due_date" date,
	"invoice_url" text,
	"paid_through" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_owner_id_unique" UNIQUE("owner_id"),
	CONSTRAINT "subscription_asaas_subscription_id_unique" UNIQUE("asaas_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cpf_cnpj" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;