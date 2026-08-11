CREATE TYPE "public"."item_status" AS ENUM('AGUARDANDO_RETIRADA', 'ENTREGUE');--> statement-breakpoint
CREATE TYPE "public"."location_kind" AS ENUM('ESTANTE', 'CAIXA', 'PRATELEIRA', 'PALLET', 'ARMARIO', 'OUTRO');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('ENTRADA', 'ENTREGA', 'REPOSICIONAMENTO');--> statement-breakpoint
CREATE TYPE "public"."position_status" AS ENUM('LIVRE', 'OCUPADA');--> statement-breakpoint
CREATE TYPE "public"."size" AS ENUM('P', 'M', 'G');--> statement-breakpoint
CREATE TABLE "item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"tracking_code" text NOT NULL,
	"size_code" "size",
	"status" "item_status" DEFAULT 'AGUARDANDO_RETIRADA' NOT NULL,
	"position_id" uuid,
	"customer_note" text,
	"photo_url" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"delivered_to" text,
	CONSTRAINT "uq_item_owner_tracking" UNIQUE("owner_id","tracking_code")
);
--> statement-breakpoint
CREATE TABLE "movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"type" "movement_type" NOT NULL,
	"from_position_id" uuid,
	"to_position_id" uuid,
	"actor_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"label" text NOT NULL,
	"slot_number" integer NOT NULL,
	"status" "position_status" DEFAULT 'LIVRE' NOT NULL,
	CONSTRAINT "uq_position_slot" UNIQUE("location_id","slot_number")
);
--> statement-breakpoint
CREATE TABLE "storage_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"kind" "location_kind" DEFAULT 'ESTANTE' NOT NULL,
	"hint" text,
	"capacity" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_location_owner_name" UNIQUE("owner_id","name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"verification_code" text,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_position_id_position_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."position"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_from_position_id_position_id_fk" FOREIGN KEY ("from_position_id") REFERENCES "public"."position"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_to_position_id_position_id_fk" FOREIGN KEY ("to_position_id") REFERENCES "public"."position"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position" ADD CONSTRAINT "position_location_id_storage_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."storage_location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_location" ADD CONSTRAINT "storage_location_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;