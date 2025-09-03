-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "blood_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"as_of" timestamp NOT NULL,
	"source" text NOT NULL,
	"total_testosterone" real,
	"total_testosterone_unit" text DEFAULT 'ng/dL',
	"free_testosterone" real,
	"free_testosterone_unit" text DEFAULT 'pg/mL',
	"shbg" real,
	"shbg_unit" text DEFAULT 'nmol/L',
	"estradiol" real,
	"estradiol_unit" text DEFAULT 'pg/mL',
	"estrogens_total" real,
	"estrogens_total_unit" text DEFAULT 'pg/mL',
	"dhea_sulfate" real,
	"dhea_sulfate_unit" text DEFAULT 'ug/dL',
	"cortisol_am" real,
	"cortisol_am_unit" text DEFAULT 'ug/dL',
	"psa" real,
	"psa_unit" text DEFAULT 'ng/mL',
	"testosterone_estrogen_ratio" real,
	"tsh" real,
	"tsh_unit" text DEFAULT 'uIU/mL',
	"free_t3" real,
	"free_t3_unit" text DEFAULT 'pg/mL',
	"free_t4" real,
	"free_t4_unit" text DEFAULT 'ng/dL',
	"tpo_ab" real,
	"tpo_ab_unit" text DEFAULT 'IU/mL',
	"vitamin_d_25oh" real,
	"vitamin_d_25oh_unit" text DEFAULT 'ng/mL',
	"crp_hs" real,
	"crp_hs_unit" text DEFAULT 'mg/L',
	"insulin" real,
	"insulin_unit" text DEFAULT 'uIU/mL',
	"hba1c" real,
	"hba1c_unit" text DEFAULT '%',
	"cholesterol_total" real,
	"cholesterol_total_unit" text DEFAULT 'mg/dL',
	"triglycerides" real,
	"triglycerides_unit" text DEFAULT 'mg/dL',
	"hdl" real,
	"hdl_unit" text DEFAULT 'mg/dL',
	"ldl_calc" real,
	"ldl_calc_unit" text DEFAULT 'mg/dL',
	"ldl_calc_flag" text,
	"vldl_calc" real,
	"vldl_calc_unit" text DEFAULT 'mg/dL',
	"apob" real,
	"apob_unit" text DEFAULT 'mg/dL',
	"apob_flag" text,
	"ldl_apob_ratio" real,
	"tg_hdl_ratio" real,
	"albumin" real,
	"albumin_unit" text DEFAULT 'g/dL',
	"ferritin" real,
	"ferritin_unit" text DEFAULT 'ng/mL',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"weight" integer DEFAULT 0,
	"reps" integer DEFAULT 0,
	"notes" text DEFAULT '',
	"category" text NOT NULL,
	"duration" text DEFAULT '',
	"distance" text DEFAULT '',
	"pace" text DEFAULT '',
	"calories" integer DEFAULT 0,
	"rpe" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "photo_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"photo_url" text NOT NULL,
	"body_part" text,
	"weight" real,
	"taken_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"author" text NOT NULL,
	"category" text DEFAULT 'motivational',
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "thoughts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"mood" text DEFAULT 'neutral',
	"tags" text[] DEFAULT '{"RAY"}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"time" text,
	"weight" real NOT NULL,
	"body_fat" real,
	"fat_free_mass" real,
	"muscle_mass" real,
	"bmi" real,
	"subcutaneous_fat" real,
	"skeletal_muscle" real,
	"body_water" real,
	"visceral_fat" integer,
	"bone_mass" real,
	"protein" real,
	"bmr" integer,
	"metabolic_age" integer,
	"optimal_weight" real,
	"target_to_optimal_weight" real,
	"target_to_optimal_fat_mass" real,
	"target_to_optimal_muscle_mass" real,
	"body_type" text,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise" text NOT NULL,
	"weight" text DEFAULT '',
	"reps" text DEFAULT '',
	"time" text DEFAULT '',
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"order" integer DEFAULT 0
);

*/