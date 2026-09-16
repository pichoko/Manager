import { desc, eq } from 'drizzle-orm'
import { getDatabase } from '../client'
import { timeline } from '../schema'

export function listTimelineByProject(projectId: string) {
  const db = getDatabase()
  return db
    .select()
    .from(timeline)
    .where(eq(timeline.projectId, projectId))
    .orderBy(desc(timeline.eventDate), desc(timeline.createdAt))
    .all()
}
