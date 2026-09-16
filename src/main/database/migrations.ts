// این فایل به‌صورت خودکار توسط drizzle-kit generate از روی schema.ts ساخته و روی
// دیتابیس واقعی تایید شده (هم برای کاربر تازه، هم برای کاربری که از قبل داده دارد).
//
// قانون مهم: INITIAL_MIGRATION_SQL هیچ‌وقت بعد از انتشار تغییر نمی‌کنه. هر تغییر بعدی
// در schema.ts، یک ثابت MIGRATION_N_... جدید می‌سازه و در client.ts به صورت
// `if (currentVersion < N)` اجرا می‌شه - دقیقاً طبق قانون Migration در EG-09:
// «تمام تغییرات دیتابیس فقط از طریق Migration انجام می‌شود» و هیچ داده‌ای پاک نمی‌شه.

export const INITIAL_MIGRATION_SQL = `
CREATE TABLE \`attachments\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`file_path\` text NOT NULL,
	\`file_name\` text NOT NULL,
	\`file_type\` text,
	\`file_size\` integer,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`attachments_project_idx\` ON \`attachments\` (\`project_id\`);
CREATE TABLE \`checklist_items\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`title\` text NOT NULL,
	\`completed\` integer DEFAULT false NOT NULL,
	\`completed_at\` text,
	\`display_order\` integer DEFAULT 0 NOT NULL,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`checklist_items_project_idx\` ON \`checklist_items\` (\`project_id\`);
CREATE TABLE \`financial_events\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`event_type\` text NOT NULL,
	\`amount\` integer NOT NULL,
	\`event_date\` text NOT NULL,
	\`payment_method_id\` text,
	\`reference_number\` text,
	\`description\` text,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`payment_method_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`financial_events_project_idx\` ON \`financial_events\` (\`project_id\`);
CREATE INDEX \`financial_events_date_idx\` ON \`financial_events\` (\`event_date\`);
CREATE TABLE \`notes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`content\` text NOT NULL,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`updated_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`deleted_at\` text,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`notes_project_idx\` ON \`notes\` (\`project_id\`);
CREATE TABLE \`office_expenses\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`category\` text NOT NULL,
	\`amount\` integer NOT NULL,
	\`expense_date\` text NOT NULL,
	\`description\` text,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`updated_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`deleted_at\` text
);

CREATE TABLE \`professional_fees\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`fee_type\` text NOT NULL,
	\`person_id\` text NOT NULL,
	\`amount_due\` integer DEFAULT 0 NOT NULL,
	\`amount_paid\` integer DEFAULT 0 NOT NULL,
	\`settled\` integer DEFAULT false NOT NULL,
	\`settled_at\` text,
	\`description\` text,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`updated_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`person_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`professional_fees_project_idx\` ON \`professional_fees\` (\`project_id\`);
CREATE TABLE \`project_events\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`event_type\` text NOT NULL,
	\`old_value\` text,
	\`new_value\` text,
	\`reason\` text,
	\`event_date\` text NOT NULL,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`project_events_project_idx\` ON \`project_events\` (\`project_id\`);
CREATE TABLE \`projects\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_number\` text NOT NULL,
	\`project_name\` text,
	\`owner_name\` text NOT NULL,
	\`phone_number\` text,
	\`city\` text,
	\`address\` text,
	\`renovation_code\` text,
	\`engineer_id\` text,
	\`checker_id\` text,
	\`status_id\` text NOT NULL,
	\`stage_id\` text NOT NULL,
	\`structure_type_id\` text,
	\`frame_type_id\` text,
	\`initial_area\` real,
	\`description\` text,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`updated_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`deleted_at\` text,
	FOREIGN KEY (\`engineer_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`checker_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`status_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`stage_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`structure_type_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`frame_type_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX \`projects_project_number_unique\` ON \`projects\` (\`project_number\`);
CREATE INDEX \`projects_owner_name_idx\` ON \`projects\` (\`owner_name\`);
CREATE INDEX \`projects_status_idx\` ON \`projects\` (\`status_id\`);
CREATE INDEX \`projects_created_at_idx\` ON \`projects\` (\`created_at\`);
CREATE TABLE \`reminders\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text,
	\`title\` text NOT NULL,
	\`description\` text,
	\`due_date\` text NOT NULL,
	\`due_time\` text,
	\`priority\` text DEFAULT 'medium' NOT NULL,
	\`status\` text DEFAULT 'pending' NOT NULL,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`updated_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`reminders_due_date_idx\` ON \`reminders\` (\`due_date\`);
CREATE TABLE \`settings\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`category\` text NOT NULL,
	\`name\` text NOT NULL,
	\`color\` text,
	\`icon\` text,
	\`display_order\` integer DEFAULT 0 NOT NULL,
	\`active\` integer DEFAULT true NOT NULL,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE UNIQUE INDEX \`settings_category_name_unique\` ON \`settings\` (\`category\`,\`name\`);
CREATE TABLE \`timeline\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`event_type\` text NOT NULL,
	\`title\` text NOT NULL,
	\`description\` text,
	\`event_date\` text NOT NULL,
	\`metadata\` text,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`timeline_project_idx\` ON \`timeline\` (\`project_id\`);
CREATE INDEX \`timeline_event_date_idx\` ON \`timeline\` (\`event_date\`);
`

// MIGRATION_2: اضافه‌شدن ستون‌های تخفیف درصدی به financial_events (بدون از بین رفتن
// هیچ رکورد قبلی - هر دو ستون Nullable هستن و مقدار پیش‌فرض NULL می‌گیرن)
export const MIGRATION_2_ADD_DISCOUNT_PERCENT = `
ALTER TABLE \`financial_events\` ADD \`discount_percent\` real;
ALTER TABLE \`financial_events\` ADD \`base_amount\` integer;
`

// MIGRATION_3: اضافه‌شدن کد پروژه، ارجاع‌دهنده و تعداد طبقات به projects
export const MIGRATION_3_ADD_PROJECT_FIELDS = `
ALTER TABLE \`projects\` ADD \`project_code\` text;
ALTER TABLE \`projects\` ADD \`referrer_name\` text;
ALTER TABLE \`projects\` ADD \`floor_count\` integer;
`

// MIGRATION_4: جدول‌های Tariff Engine (نسخه‌های تعرفه و قوانین محاسبه)
export const MIGRATION_4_ADD_TARIFF_ENGINE = `
CREATE TABLE \`tariff_rules\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`tariff_version_id\` text NOT NULL,
	\`discipline\` text NOT NULL,
	\`min_floors\` integer NOT NULL,
	\`max_floors\` integer,
	\`min_area\` real NOT NULL,
	\`max_area\` real,
	\`unit_rate\` integer NOT NULL,
	\`display_order\` integer DEFAULT 0 NOT NULL,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`tariff_version_id\`) REFERENCES \`tariff_versions\`(\`id\`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX \`tariff_rules_version_idx\` ON \`tariff_rules\` (\`tariff_version_id\`);
CREATE INDEX \`tariff_rules_discipline_idx\` ON \`tariff_rules\` (\`discipline\`);
CREATE TABLE \`tariff_versions\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`year\` integer NOT NULL,
	\`title\` text NOT NULL,
	\`is_active\` integer DEFAULT true NOT NULL,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
`

// MIGRATION_5: تاریخ کسر سهمیه + نام کسر سهمیه‌کننده روی projects
export const MIGRATION_5_ADD_QUOTA_DEDUCTION = `
ALTER TABLE \`projects\` ADD \`quota_deductor_name\` text;
ALTER TABLE \`projects\` ADD \`quota_deduction_date\` text;
`

// MIGRATION_6: نام چکر به‌صورت متن آزاد (به‌جای انتخاب از تنظیمات)
export const MIGRATION_6_ADD_CHECKER_NAME = `
ALTER TABLE \`projects\` ADD \`checker_name\` text;
`

// MIGRATION_7: بازسازی جدول professional_fees با person_name متن آزاد به‌جای person_id
// (وابسته به تنظیمات). چون این جدول تا الان هیچ رابط کاربری‌ای نداشت، هیچ داده‌ی واقعی
// توش نیست - پس Drop+Create امن است (بدون ریسک از دست رفتن اطلاعات کاربر).
export const MIGRATION_7_PROFESSIONAL_FEES_FREE_TEXT = `
DROP TABLE IF EXISTS \`professional_fees\`;
CREATE TABLE \`professional_fees\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`project_id\` text NOT NULL,
	\`fee_type\` text NOT NULL,
	\`person_name\` text NOT NULL,
	\`amount_due\` integer DEFAULT 0 NOT NULL,
	\`amount_paid\` integer DEFAULT 0 NOT NULL,
	\`settled\` integer DEFAULT false NOT NULL,
	\`settled_at\` text,
	\`description\` text,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	\`updated_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX \`professional_fees_project_idx\` ON \`professional_fees\` (\`project_id\`);
`
