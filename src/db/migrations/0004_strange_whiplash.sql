ALTER TABLE "subscription" ALTER COLUMN "asaas_subscription_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "billing_type" text;