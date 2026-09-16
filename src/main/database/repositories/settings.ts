import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { getDatabase } from '../client'
import { settings } from '../schema'

export function listSettingsByCategory(category: string) {
  const db = getDatabase()
  return db
    .select()
    .from(settings)
    .where(and(eq(settings.category, category), eq(settings.active, true)))
    .all()
}

export function createSetting(category: string, name: string): string {
  const db = getDatabase()
  const id = randomUUID()
  db.insert(settings)
    .values({
      id,
      category,
      name,
      displayOrder: 0,
      active: true,
      createdAt: new Date().toISOString()
    })
    .run()
  return id
}
