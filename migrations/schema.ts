import { pgTable, varchar, timestamp, text, real, integer, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const bloodEntries = pgTable("blood_entries", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	asOf: timestamp("as_of", { mode: 'string' }).notNull(),
	source: text().notNull(),
	totalTestosterone: real("total_testosterone"),
	totalTestosteroneUnit: text("total_testosterone_unit").default('ng/dL'),
	freeTestosterone: real("free_testosterone"),
	freeTestosteroneUnit: text("free_testosterone_unit").default('pg/mL'),
	shbg: real(),
	shbgUnit: text("shbg_unit").default('nmol/L'),
	estradiol: real(),
	estradiolUnit: text("estradiol_unit").default('pg/mL'),
	estrogensTotal: real("estrogens_total"),
	estrogensTotalUnit: text("estrogens_total_unit").default('pg/mL'),
	dheaSulfate: real("dhea_sulfate"),
	dheaSulfateUnit: text("dhea_sulfate_unit").default('ug/dL'),
	cortisolAm: real("cortisol_am"),
	cortisolAmUnit: text("cortisol_am_unit").default('ug/dL'),
	psa: real(),
	psaUnit: text("psa_unit").default('ng/mL'),
	testosteroneEstrogenRatio: real("testosterone_estrogen_ratio"),
	tsh: real(),
	tshUnit: text("tsh_unit").default('uIU/mL'),
	freeT3: real("free_t3"),
	freeT3Unit: text("free_t3_unit").default('pg/mL'),
	freeT4: real("free_t4"),
	freeT4Unit: text("free_t4_unit").default('ng/dL'),
	tpoAb: real("tpo_ab"),
	tpoAbUnit: text("tpo_ab_unit").default('IU/mL'),
	vitaminD25Oh: real("vitamin_d_25oh"),
	vitaminD25OhUnit: text("vitamin_d_25oh_unit").default('ng/mL'),
	crpHs: real("crp_hs"),
	crpHsUnit: text("crp_hs_unit").default('mg/L'),
	insulin: real(),
	insulinUnit: text("insulin_unit").default('uIU/mL'),
	hba1C: real(),
	hba1CUnit: text("hba1c_unit").default('%'),
	cholesterolTotal: real("cholesterol_total"),
	cholesterolTotalUnit: text("cholesterol_total_unit").default('mg/dL'),
	triglycerides: real(),
	triglyceridesUnit: text("triglycerides_unit").default('mg/dL'),
	hdl: real(),
	hdlUnit: text("hdl_unit").default('mg/dL'),
	ldlCalc: real("ldl_calc"),
	ldlCalcUnit: text("ldl_calc_unit").default('mg/dL'),
	ldlCalcFlag: text("ldl_calc_flag"),
	vldlCalc: real("vldl_calc"),
	vldlCalcUnit: text("vldl_calc_unit").default('mg/dL'),
	apob: real(),
	apobUnit: text("apob_unit").default('mg/dL'),
	apobFlag: text("apob_flag"),
	ldlApobRatio: real("ldl_apob_ratio"),
	tgHdlRatio: real("tg_hdl_ratio"),
	albumin: real(),
	albuminUnit: text("albumin_unit").default('g/dL'),
	ferritin: real(),
	ferritinUnit: text("ferritin_unit").default('ng/mL'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const exercises = pgTable("exercises", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	weight: integer().default(0),
	reps: integer().default(0),
	notes: text().default('),
	category: text().notNull(),
	duration: text().default('),
	distance: text().default('),
	pace: text().default('),
	calories: integer().default(0),
	rpe: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const photoProgress = pgTable("photo_progress", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: text().notNull(),
	description: text().default('),
	photoUrl: text("photo_url").notNull(),
	bodyPart: text("body_part"),
	weight: real(),
	takenAt: timestamp("taken_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const quotes = pgTable("quotes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	text: text().notNull(),
	author: text().notNull(),
	category: text().default('motivational'),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const thoughts = pgTable("thoughts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	content: text().notNull(),
	mood: text().default('neutral'),
	tags: text().array().default(["RAY"]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const weightEntries = pgTable("weight_entries", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	time: text(),
	weight: real().notNull(),
	bodyFat: real("body_fat"),
	fatFreeMass: real("fat_free_mass"),
	muscleMass: real("muscle_mass"),
	bmi: real(),
	subcutaneousFat: real("subcutaneous_fat"),
	skeletalMuscle: real("skeletal_muscle"),
	bodyWater: real("body_water"),
	visceralFat: integer("visceral_fat"),
	boneMass: real("bone_mass"),
	protein: real(),
	bmr: integer(),
	metabolicAge: integer("metabolic_age"),
	optimalWeight: real("optimal_weight"),
	targetToOptimalWeight: real("target_to_optimal_weight"),
	targetToOptimalFatMass: real("target_to_optimal_fat_mass"),
	targetToOptimalMuscleMass: real("target_to_optimal_muscle_mass"),
	bodyType: text("body_type"),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const workoutLogs = pgTable("workout_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	category: text().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }).defaultNow(),
});

export const personalRecords = pgTable("personal_records", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	exercise: text().notNull(),
	weight: text().default('),
	reps: text().default('),
	time: text().default('),
	category: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	order: integer().default(0),
});
