const pool = require('./config/pool');

async function testArticlesQuery() {
  try {
    const PUBLIC_STATUS_CONDITION = `(a.status = 'published' OR (a.status = 'scheduled' AND a.scheduled_publish_at <= CURRENT_TIMESTAMP))`;
    
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM articles a
      WHERE ${PUBLIC_STATUS_CONDITION}
    `;

    const listQuery = `
      SELECT
        a.id,
        a.title,
        a.summary,
        a.cover_image,
        a.author_id,
        a.category_id,
        a.status,
        a.scheduled_publish_at,
        a.view_count,
        a.created_at,
        a.updated_at,
        u.username AS author_name,
        u.avatar AS author_avatar,
        c.name AS category_name
      FROM articles a
      LEFT JOIN users u ON u.id = a.author_id
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE ${PUBLIC_STATUS_CONDITION}
      ORDER BY COALESCE(a.scheduled_publish_at, a.created_at) DESC
      LIMIT $1 OFFSET $2
    `;

    console.log('Testing count query...');
    const countResult = await pool.query(countQuery, []);
    console.log('Count result:', countResult.rows[0]);

    console.log('Testing list query...');
    const articlesResult = await pool.query(listQuery, [10, 0]);
    console.log('Articles found:', articlesResult.rows.length);

    const articleIds = articlesResult.rows.map((article) => article.id);
    console.log('Article IDs:', articleIds);

    if (articleIds.length > 0) {
      console.log('Testing tags query...');
      const tagsResult = await pool.query(
        `SELECT at.article_id, t.id, t.name
         FROM article_tags at
         JOIN tags t ON t.id = at.tag_id
         WHERE at.article_id = ANY($1)`,
        [articleIds],
      );
      console.log('Tags found:', tagsResult.rows.length);
    }

    console.log('All queries executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testArticlesQuery();