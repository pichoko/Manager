import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

// ---------------------------------------------------------------------------
// Settings — تمام لیست‌های مرجع (وضعیت، مرحله، مهندس، چکر، مهر، شهر، نوع سازه...)
// ---------------------------------------------------------------------------
export const settings = sqliteTable(
  'settings',
  {
    id: text('id').primaryKey(),
    category: text('category').notNull(), // status | stage | engineer | checker | stamper | city | structureType | frameType | paymentMethod
    name: text('name').notNull(),
    color: text('color'),
    icon: text('icon'),
    displayOrder: integer('display_order').notNull().default(0),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    categoryNameUnique: uniqueIndex('settings_category_name_unique').on(table.category, table.name)
  })
)

// ---------------------------------------------------------------------------
// Projects — موجودیت اصلی سیستم
// ---------------------------------------------------------------------------
export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    projectNumber: text('project_number').notNull(),
    projectName: text('project_name'),
    ownerName: text('owner_name').notNull(),
    phoneNumber: text('phone_number'),
    city: text('city'),
    address: text('address'),
    renovationCode: text('renovation_code'), // کد نوسازی
    projectCode: text('project_code'), // کد پروژه (متفاوت از project_number)
    referrerName: text('referrer_name'), // ارجاع‌دهنده
    engineerId: text('engineer_id').references(() => settings.id),
    checkerId: text('checker_id').references(() => settings.id),
    statusId: text('status_id')
      .notNull()
      .references(() => settings.id),
    stageId: text('stage_id')
      .notNull()
      .references(() => settings.id),
    structureTypeId: text('structure_type_id').references(() => settings.id),
    frameTypeId: text('frame_type_id').references(() => settings.id),
    initialArea: real('initial_area'),
    floorCount: integer('floor_count'), // تعداد سقف/طبقات - برای موتور تعرفه لازم است
    quotaDeductorName: text('quota_deductor_name'), // نام مهندس کسر سهمیه‌کننده
    quotaDeductionDate: text('quota_deduction_date'), // تاریخ کسر سهمیه
    checkerName: text('checker_name'), // نام چکر (متن آزاد، دیگه از تنظیمات نمیاد)
    description: text('description'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    deletedAt: text('deleted_at')
  },
  (table) => ({
    projectNumberUnique: uniqueIndex('projects_project_number_unique').on(table.projectNumber),
    ownerNameIdx: index('projects_owner_name_idx').on(table.ownerName),
    statusIdx: index('projects_status_idx').on(table.statusId),
    createdAtIdx: index('projects_created_at_idx').on(table.createdAt)
  })
)

// ---------------------------------------------------------------------------
// Financial Events — پرداخت، برآورد قیمتی، تخفیف (پول از مشتری)
// eventType: estimate | discount | payment | refund
// ---------------------------------------------------------------------------
export const financialEvents = sqliteTable(
  'financial_events',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    eventType: text('event_type').notNull(), // estimate | discount | payment | refund
    amount: integer('amount').notNull(), // تومان - همیشه Integer
    discountPercent: real('discount_percent'), // فقط برای تخفیف درصدی
    baseAmount: integer('base_amount'), // فقط برای تخفیف درصدی - Snapshot مبلغی که درصد رویش حساب شد
    eventDate: text('event_date').notNull(),
    paymentMethodId: text('payment_method_id').references(() => settings.id),
    referenceNumber: text('reference_number'),
    description: text('description'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    projectIdx: index('financial_events_project_idx').on(table.projectId),
    eventDateIdx: index('financial_events_date_idx').on(table.eventDate)
  })
)

// ---------------------------------------------------------------------------
// Professional Fees — دستمزد چکر و مهر (پول از دفتر به بیرون، جدا از مشتری)
// ---------------------------------------------------------------------------
export const professionalFees = sqliteTable(
  'professional_fees',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    feeType: text('fee_type').notNull(), // checker | stamper (مهر)
    personName: text('person_name').notNull(), // متن آزاد، مثل checkerName روی خود پروژه
    amountDue: integer('amount_due').notNull().default(0),
    amountPaid: integer('amount_paid').notNull().default(0),
    settled: integer('settled', { mode: 'boolean' }).notNull().default(false),
    settledAt: text('settled_at'),
    description: text('description'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    projectIdx: index('professional_fees_project_idx').on(table.projectId)
  })
)

// ---------------------------------------------------------------------------
// Project Events (Revisions) — تغییر متراژ، وضعیت، مهندس و ...
// ---------------------------------------------------------------------------
export const projectEvents = sqliteTable(
  'project_events',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    eventType: text('event_type').notNull(),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    reason: text('reason'),
    eventDate: text('event_date').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    projectIdx: index('project_events_project_idx').on(table.projectId)
  })
)

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    content: text('content').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    deletedAt: text('deleted_at')
  },
  (table) => ({
    projectIdx: index('notes_project_idx').on(table.projectId)
  })
)

// ---------------------------------------------------------------------------
// Checklist Items
// ---------------------------------------------------------------------------
export const checklistItems = sqliteTable(
  'checklist_items',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    title: text('title').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    completedAt: text('completed_at'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    projectIdx: index('checklist_items_project_idx').on(table.projectId)
  })
)

// ---------------------------------------------------------------------------
// Timeline — رویدادهای خودکار قابل نمایش به کاربر
// ---------------------------------------------------------------------------
export const timeline = sqliteTable(
  'timeline',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    eventDate: text('event_date').notNull(),
    metadata: text('metadata'), // JSON
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    projectIdx: index('timeline_project_idx').on(table.projectId),
    eventDateIdx: index('timeline_event_date_idx').on(table.eventDate)
  })
)

// ---------------------------------------------------------------------------
// Attachments — ضمیمه فایل/عکس به پروژه (فقط مسیر فایل لوکال)
// ---------------------------------------------------------------------------
export const attachments = sqliteTable(
  'attachments',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    filePath: text('file_path').notNull(),
    fileName: text('file_name').notNull(),
    fileType: text('file_type'),
    fileSize: integer('file_size'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    projectIdx: index('attachments_project_idx').on(table.projectId)
  })
)

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------
export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').references(() => projects.id),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: text('due_date').notNull(),
    dueTime: text('due_time'),
    priority: text('priority').notNull().default('medium'), // low | medium | high
    status: text('status').notNull().default('pending'), // pending | done | cancelled
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    dueDateIdx: index('reminders_due_date_idx').on(table.dueDate)
  })
)

// ---------------------------------------------------------------------------
// Office Expenses — هزینه‌های کلی دفتر (مثل اجاره)، کاملاً مستقل از Projects
// ---------------------------------------------------------------------------
export const officeExpenses = sqliteTable('office_expenses', {
  id: text('id').primaryKey(),
  category: text('category').notNull(), // rent | utilities | ...
  amount: integer('amount').notNull(),
  expenseDate: text('expense_date').notNull(),
  description: text('description'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: text('deleted_at')
})

// ---------------------------------------------------------------------------
// Tariff Engine — نسخه‌های سالانه‌ی تعرفه و قوانین محاسبه (بر اساس تعداد سقف و متراژ)
// ---------------------------------------------------------------------------
export const tariffVersions = sqliteTable('tariff_versions', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(), // سال شمسی، مثلاً 1405
  title: text('title').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

export const tariffRules = sqliteTable(
  'tariff_rules',
  {
    id: text('id').primaryKey(),
    tariffVersionId: text('tariff_version_id')
      .notNull()
      .references(() => tariffVersions.id),
    discipline: text('discipline').notNull(), // civil | architecture | mechanical | electrical | coordination
    minFloors: integer('min_floors').notNull(),
    maxFloors: integer('max_floors'), // خالی = بدون سقف بالا
    minArea: real('min_area').notNull(),
    maxArea: real('max_area'), // خالی = بدون سقف بالا
    unitRate: integer('unit_rate').notNull(), // تومان به ازای هر متر مربع
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => ({
    versionIdx: index('tariff_rules_version_idx').on(table.tariffVersionId),
    disciplineIdx: index('tariff_rules_discipline_idx').on(table.discipline)
  })
)
