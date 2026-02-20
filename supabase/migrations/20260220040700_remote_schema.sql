


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chefs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "connect_account_id" "text",
    "payout_enabled" boolean DEFAULT false NOT NULL,
    "address" "text",
    "lat" double precision,
    "lng" double precision,
    "cuisine_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "bio" "text",
    "photo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chefs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."chefs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "driver_id" "uuid",
    "status" "text" DEFAULT 'assigned'::"text" NOT NULL,
    "pickup_eta" timestamp with time zone,
    "dropoff_eta" timestamp with time zone,
    "proof_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "deliveries_status_check" CHECK (("status" = ANY (ARRAY['assigned'::"text", 'en_route_to_pickup'::"text", 'arrived_at_pickup'::"text", 'picked_up'::"text", 'en_route_to_dropoff'::"text", 'arrived_at_dropoff'::"text", 'delivered'::"text"])))
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "menu_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_cents" integer NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "photo_url" "text",
    "dietary_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "menu_items_price_cents_check" CHECK (("price_cents" > 0))
);


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chef_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."menus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "price_cents" integer NOT NULL,
    "special_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "order_items_price_cents_check" CHECK (("price_cents" > 0)),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "chef_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'placed'::"text" NOT NULL,
    "subtotal_cents" integer NOT NULL,
    "delivery_fee_cents" integer DEFAULT 0 NOT NULL,
    "platform_fee_cents" integer DEFAULT 0 NOT NULL,
    "total_cents" integer NOT NULL,
    "delivery_method" "text" NOT NULL,
    "scheduled_for" timestamp with time zone,
    "address" "text",
    "lat" double precision,
    "lng" double precision,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_delivery_fee_cents_check" CHECK (("delivery_fee_cents" >= 0)),
    CONSTRAINT "orders_delivery_method_check" CHECK (("delivery_method" = ANY (ARRAY['delivery'::"text", 'pickup'::"text"]))),
    CONSTRAINT "orders_platform_fee_cents_check" CHECK (("platform_fee_cents" >= 0)),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['placed'::"text", 'accepted'::"text", 'preparing'::"text", 'ready'::"text", 'picked_up'::"text", 'delivered'::"text", 'cancelled'::"text", 'refunded'::"text"]))),
    CONSTRAINT "orders_subtotal_cents_check" CHECK (("subtotal_cents" >= 0)),
    CONSTRAINT "orders_total_cents_check" CHECK (("total_cents" >= 0))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['customer'::"text", 'chef'::"text", 'driver'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chefs"
    ADD CONSTRAINT "chefs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "menus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chefs_profile_id" ON "public"."chefs" USING "btree" ("profile_id");



CREATE INDEX "idx_chefs_status" ON "public"."chefs" USING "btree" ("status");



CREATE INDEX "idx_deliveries_driver_id" ON "public"."deliveries" USING "btree" ("driver_id");



CREATE INDEX "idx_deliveries_order_id" ON "public"."deliveries" USING "btree" ("order_id");



CREATE INDEX "idx_menu_items_menu_id" ON "public"."menu_items" USING "btree" ("menu_id");



CREATE INDEX "idx_menus_chef_id" ON "public"."menus" USING "btree" ("chef_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_chef_id" ON "public"."orders" USING "btree" ("chef_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE OR REPLACE TRIGGER "trg_chefs_set_updated_at" BEFORE UPDATE ON "public"."chefs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_deliveries_set_updated_at" BEFORE UPDATE ON "public"."deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_menu_items_set_updated_at" BEFORE UPDATE ON "public"."menu_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_menus_set_updated_at" BEFORE UPDATE ON "public"."menus" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_orders_set_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."chefs"
    ADD CONSTRAINT "chefs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "menus_chef_id_fkey" FOREIGN KEY ("chef_id") REFERENCES "public"."chefs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_chef_id_fkey" FOREIGN KEY ("chef_id") REFERENCES "public"."chefs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view active menus" ON "public"."menus" FOR SELECT USING ((("is_active" = true) AND ("chef_id" IN ( SELECT "c"."id"
   FROM "public"."chefs" "c"
  WHERE ("c"."status" = 'approved'::"text")))));



CREATE POLICY "Anyone can view approved chefs" ON "public"."chefs" FOR SELECT USING (("status" = 'approved'::"text"));



CREATE POLICY "Anyone can view available menu items" ON "public"."menu_items" FOR SELECT USING ((("is_available" = true) AND ("menu_id" IN ( SELECT "m"."id"
   FROM ("public"."menus" "m"
     JOIN "public"."chefs" "c" ON (("c"."id" = "m"."chef_id")))
  WHERE (("m"."is_active" = true) AND ("c"."status" = 'approved'::"text"))))));



CREATE POLICY "Chefs can manage own menu items" ON "public"."menu_items" USING (("menu_id" IN ( SELECT "m"."id"
   FROM ("public"."menus" "m"
     JOIN "public"."chefs" "c" ON (("c"."id" = "m"."chef_id")))
  WHERE ("c"."profile_id" = "auth"."uid"())))) WITH CHECK (("menu_id" IN ( SELECT "m"."id"
   FROM ("public"."menus" "m"
     JOIN "public"."chefs" "c" ON (("c"."id" = "m"."chef_id")))
  WHERE ("c"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Chefs can manage own menus" ON "public"."menus" USING (("chef_id" IN ( SELECT "c"."id"
   FROM "public"."chefs" "c"
  WHERE ("c"."profile_id" = "auth"."uid"())))) WITH CHECK (("chef_id" IN ( SELECT "c"."id"
   FROM "public"."chefs" "c"
  WHERE ("c"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Chefs can read assigned orders" ON "public"."orders" FOR SELECT USING (("chef_id" IN ( SELECT "c"."id"
   FROM "public"."chefs" "c"
  WHERE ("c"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Chefs can read own data" ON "public"."chefs" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Chefs can update order status" ON "public"."orders" FOR UPDATE USING (("chef_id" IN ( SELECT "c"."id"
   FROM "public"."chefs" "c"
  WHERE ("c"."profile_id" = "auth"."uid"())))) WITH CHECK (("chef_id" IN ( SELECT "c"."id"
   FROM "public"."chefs" "c"
  WHERE ("c"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Chefs can update own data" ON "public"."chefs" FOR UPDATE USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Customers can read own orders" ON "public"."orders" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "Drivers can manage assigned deliveries" ON "public"."deliveries" USING (("driver_id" = "auth"."uid"())) WITH CHECK (("driver_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can read delivery status for their orders" ON "public"."deliveries" FOR SELECT USING (("order_id" IN ( SELECT "o"."id"
   FROM "public"."orders" "o"
  WHERE (("o"."customer_id" = "auth"."uid"()) OR ("o"."chef_id" IN ( SELECT "c"."id"
           FROM "public"."chefs" "c"
          WHERE ("c"."profile_id" = "auth"."uid"())))))));



CREATE POLICY "Users can read own order items" ON "public"."order_items" FOR SELECT USING (("order_id" IN ( SELECT "o"."id"
   FROM "public"."orders" "o"
  WHERE (("o"."customer_id" = "auth"."uid"()) OR ("o"."chef_id" IN ( SELECT "c"."id"
           FROM "public"."chefs" "c"
          WHERE ("c"."profile_id" = "auth"."uid"())))))));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."chefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."chefs" TO "anon";
GRANT ALL ON TABLE "public"."chefs" TO "authenticated";
GRANT ALL ON TABLE "public"."chefs" TO "service_role";



GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."menus" TO "anon";
GRANT ALL ON TABLE "public"."menus" TO "authenticated";
GRANT ALL ON TABLE "public"."menus" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


