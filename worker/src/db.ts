// ------------------------------------------------------------------ //
// D1 persistence helpers for StudyAgent sessions                      //
// ------------------------------------------------------------------ //

/**
 * Upsert (insert) a session snapshot into D1.
 * Called after every assistant reply so session history is durable.
 */
export async function saveSession(
  db: D1Database,
  userId: string,
  topic: string,
  messageCount: number
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sessions (user_id, topic, created_at, message_count)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, created_at) DO UPDATE
         SET topic = excluded.topic,
             message_count = excluded.message_count`
    )
    .bind(userId, topic, Math.floor(Date.now() / 1000), messageCount)
    .run();
}

/**
 * Return the last 5 distinct topics the user has studied, most recent first.
 */
export async function getRecentTopics(
  db: D1Database,
  userId: string
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT topic
       FROM sessions
       WHERE user_id = ?
         AND topic != ''
       GROUP BY topic
       ORDER BY MAX(created_at) DESC
       LIMIT 5`
    )
    .bind(userId)
    .all<{ topic: string }>();

  return (result.results ?? []).map((r) => r.topic);
}
