const pool = require('../config/pool')

async function ensureRuntimeSchema() {
  await pool.query(`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_articles_scheduled_publish_at
    ON articles(scheduled_publish_at DESC)
  `)

  await pool.query(`
    UPDATE articles
    SET cover_image = regexp_replace(
      cover_image,
      '^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?/uploads/',
      '/uploads/'
    )
    WHERE cover_image ~ '^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?/uploads/'
  `)

  await pool.query(`
    UPDATE articles
    SET content = regexp_replace(
      content,
      'https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?(/uploads/[^)"''\\s]+)',
      '\\3',
      'g'
    )
    WHERE content ~ 'https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?/uploads/'
  `)
}

module.exports = {
  ensureRuntimeSchema,
}
