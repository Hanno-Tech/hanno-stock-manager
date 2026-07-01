ALTER TABLE "item" DROP CONSTRAINT "item_tracking_code_unique";--> statement-breakpoint
ALTER TABLE "shelf" DROP CONSTRAINT "shelf_code_unique";--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "shelf" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelf" ADD CONSTRAINT "shelf_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "uq_item_owner_tracking" UNIQUE("owner_id","tracking_code");--> statement-breakpoint
ALTER TABLE "shelf" ADD CONSTRAINT "uq_shelf_owner_code" UNIQUE("owner_id","code");