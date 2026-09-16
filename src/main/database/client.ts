import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { randomUUID } from 'crypto'
import * as schema from './schema'
import {
  INITIAL_MIGRATION_SQL,
  MIGRATION_2_ADD_DISCOUNT_PERCENT,
  MIGRATION_3_ADD_PROJECT_FIELDS,
  MIGRATION_4_ADD_TARIFF_ENGINE,
  MIGRATION_5_ADD_QUOTA_DEDUCTION,
  MIGRATION_6_ADD_CHECKER_NAME,
  MIGRATION_7_PROFESSIONAL_FEES_FREE_TEXT
} from './migrations'

let sqlite: Database.Database | null = null
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

/**
 * شماره‌ی نسخه‌ی فعلی ساختار دیتابیس ثبت‌شده داخل خود فایل دیتابیس است (PRAGMA
 * user_version). هر بار schema.ts تغییر می‌کنه، یک بلوک `if (currentVersion < N)`
 * جدید به getDatabase اضافه می‌شه. هر کاربر فقط migration های اجرا‌نشده رو می‌گیره -
 * هیچ‌وقت داده‌ای پاک نمی‌شه.
 */

function tableExists(db: Database.Database, name: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name)
  return Boolean(row)
}

function columnExists(db: Database.Database, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  return rows.some((r) => r.name === column)
}

export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (dbInstance) return dbInstance

  const dbPath = join(app.getPath('userData'), 'project-manager.db')
  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  const currentVersion = sqlite.pragma('user_version', { simple: true }) as number

  if (currentVersion < 1) {
    if (!tableExists(sqlite, 'projects')) {
      sqlite.exec(INITIAL_MIGRATION_SQL)
      seedDefaultSettings(sqlite)
    }
    sqlite.pragma('user_version = 1')
  }

  if (currentVersion < 2) {
    if (!columnExists(sqlite, 'financial_events', 'discount_percent')) {
      sqlite.exec(MIGRATION_2_ADD_DISCOUNT_PERCENT)
    }
    sqlite.pragma('user_version = 2')
  }

  if (currentVersion < 3) {
    if (!columnExists(sqlite, 'projects', 'project_code')) {
      sqlite.exec(MIGRATION_3_ADD_PROJECT_FIELDS)
    }
    sqlite.pragma('user_version = 3')
    seedFrameTypeSettings(sqlite)
  }

  if (currentVersion < 4) {
    if (!tableExists(sqlite, 'tariff_versions')) {
      sqlite.exec(MIGRATION_4_ADD_TARIFF_ENGINE)
    }
    sqlite.pragma('user_version = 4')
    seedTariff1405Civil(sqlite)
  }

  if (currentVersion < 5) {
    if (!columnExists(sqlite, 'projects', 'quota_deductor_name')) {
      sqlite.exec(MIGRATION_5_ADD_QUOTA_DEDUCTION)
    }
    sqlite.pragma('user_version = 5')
    reseedStatusAndStage(sqlite)
  }

  if (currentVersion < 6) {
    if (!columnExists(sqlite, 'projects', 'checker_name')) {
      sqlite.exec(MIGRATION_6_ADD_CHECKER_NAME)
    }
    sqlite.pragma('user_version = 6')
  }

  if (currentVersion < 7) {
    if (!columnExists(sqlite, 'professional_fees', 'person_name')) {
      sqlite.exec(MIGRATION_7_PROFESSIONAL_FEES_FREE_TEXT)
    }
    sqlite.pragma('user_version = 7')
  }

  // Migration های بعدی همین‌جا اضافه می‌شن:
  // if (currentVersion < 8) { sqlite.exec(MIGRATION_8_...); sqlite.pragma('user_version = 8') }

  dbInstance = drizzle(sqlite, { schema })
  return dbInstance
}

export function getDatabasePath(): string {
  return join(app.getPath('userData'), 'project-manager.db')
}

/**
 * برای بازیابی از بک‌آپ لازمه: قبل از جایگزینی فایل دیتابیس، باید Connection فعلی
 * کاملاً بسته بشه (به‌خصوص روی ویندوز که فایل باز قابل بازنویسی نیست).
 */
export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close()
    sqlite = null
  }
  dbInstance = null
}

function seedDefaultSettings(db: Database.Database): void {
  const insert = db.prepare(
    'INSERT INTO settings (id, category, name, display_order, active) VALUES (?, ?, ?, ?, 1)'
  )

  const defaults: Array<[string, string, number]> = [
    ['paymentMethod', 'نقدی', 1],
    ['paymentMethod', 'کارت به کارت', 2],
    ['paymentMethod', 'حواله بانکی', 3],
    ['paymentMethod', 'چک', 4]
  ]

  const insertMany = db.transaction((rows: typeof defaults) => {
    for (const [category, name, displayOrder] of rows) {
      insert.run(randomUUID(), category, name, displayOrder)
    }
  })

  insertMany(defaults)

  // وضعیت و مرحله از همون اول با لیست نهایی Seed می‌شن (به‌جای یک لیست موقت که بعداً
  // با MIGRATION_5 جایگزین بشه) - برای کاربرانی که کاملاً از صفر شروع می‌کنن.
  reseedStatusAndStage(db)
}

function seedFrameTypeSettings(db: Database.Database): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO settings (id, category, name, display_order, active) VALUES (?, ?, ?, ?, 1)'
  )
  const defaults: Array<[string, string, number]> = [
    ['frameType', 'بتنی', 1],
    ['frameType', 'فلزی', 2],
    ['frameType', 'بنایی', 3]
  ]
  const insertMany = db.transaction((rows: typeof defaults) => {
    for (const [category, name, displayOrder] of rows) {
      insert.run(randomUUID(), category, name, displayOrder)
    }
  })
  insertMany(defaults)
}

function seedTariff1405Civil(db: Database.Database): void {
  const alreadySeeded = db.prepare('SELECT id FROM tariff_versions WHERE year = 1405').get()
  if (alreadySeeded) return

  const versionId = randomUUID()
  db.prepare('INSERT INTO tariff_versions (id, year, title, is_active) VALUES (?, ?, ?, 1)').run(
    versionId,
    1405,
    'تعرفه سال ۱۴۰۵'
  )

  const insertRule = db.prepare(
    `INSERT INTO tariff_rules
       (id, tariff_version_id, discipline, min_floors, max_floors, min_area, max_area, unit_rate, display_order)
     VALUES (?, ?, 'civil', ?, ?, ?, ?, ?, ?)`
  )

  const rules: Array<[number, number | null, number, number | null, number, number]> = [
    [1, 2, 0, 600, 105500, 1],
    [3, 5, 0, 2000, 129400, 2],
    [6, 7, 0, 5000, 140600, 3],
    [8, 10, 0, 5000, 160100, 4],
    [11, 12, 5000, null, 188200, 5],
    [13, 15, 5000, null, 222500, 6],
    [16, null, 5000, null, 222500, 7]
  ]

  const insertMany = db.transaction((rows: typeof rules) => {
    for (const [minFloors, maxFloors, minArea, maxArea, unitRate, order] of rows) {
      insertRule.run(randomUUID(), versionId, minFloors, maxFloors, minArea, maxArea, unitRate, order)
    }
  })

  insertMany(rules)
}

/**
 * لیست وضعیت و مرحله طبق درخواست کاربر جایگزین شد. لیست قدیمی (که موقع توسعه‌ی اولیه
 * Seed شده بود) به‌جای حذف فیزیکی فقط غیرفعال می‌شه - طبق اصل ششم Blueprint (حذف دائمی
 * اطلاعات ممنوع است) و قوانین Settings (بخش ۲۰): پروژه‌های قدیمی که به این مقادیر وصل
 * بودن هنوز قابل مشاهده‌ان، فقط در پروژه‌های جدید پیشنهاد نمی‌شن.
 */
function reseedStatusAndStage(db: Database.Database): void {
  const newStatuses = ['ارجاع پروژه', 'شروع پروژه', 'اتمام پروژه', 'منتظر تسویه‌حساب', 'آرشیو']
  const newStages = ['طراحی و نقشه‌کشی', 'انتظار برای تایید', 'مهر برجسته شده']

  const deactivateOld = db.prepare(
    'UPDATE settings SET active = 0 WHERE category = ? AND name NOT IN (' +
      newStatuses.map(() => '?').join(',') +
      ')'
  )
  const deactivateOldStage = db.prepare(
    'UPDATE settings SET active = 0 WHERE category = ? AND name NOT IN (' +
      newStages.map(() => '?').join(',') +
      ')'
  )

  const insert = db.prepare(
    'INSERT OR IGNORE INTO settings (id, category, name, display_order, active) VALUES (?, ?, ?, ?, 1)'
  )

  const run = db.transaction(() => {
    deactivateOld.run('status', ...newStatuses)
    deactivateOldStage.run('stage', ...newStages)
    newStatuses.forEach((name, i) => insert.run(randomUUID(), 'status', name, i + 1))
    newStages.forEach((name, i) => insert.run(randomUUID(), 'stage', name, i + 1))
  })

  run()
}

export function getFirstActiveSetting(
  category: string
): { id: string; name: string } | undefined {
  if (!sqlite) throw new Error('Database not initialized yet')
  return sqlite
    .prepare(
      'SELECT id, name FROM settings WHERE category = ? AND active = 1 ORDER BY display_order ASC LIMIT 1'
    )
    .get(category) as { id: string; name: string } | undefined
}
