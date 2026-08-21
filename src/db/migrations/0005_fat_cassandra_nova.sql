ALTER TABLE "subscription" ALTER COLUMN "asaas_customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "checkout_id" text;