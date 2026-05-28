const pool = require('../config/pool')
const BlogDocumentService = require('../utils/blogDocumentService')

const documentService = new BlogDocumentService()

const PUBLIC_STATUS_CONDITION = `(a.status = 'published' OR (a.status = 'scheduled' AND a.scheduled_publish_at <= CURRENT_TIMESTAMP))`
const UPLOADS_PREFIX = '/uploads/'

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function uniqStrings(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))]
}

function buildUploadPath(filename) {
  return `${UPLOADS_PREFIX}${filename}`
}

function resolveAssetUrl(req, value) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith(UPLOADS_PREFIX)) {
    return `${req.protocol}://${req.get('host')}${trimmed}`
  }

  return trimmed
}

function normalizeStoredAssetPath(value, req) {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith(UPLOADS_PREFIX)) {
    return trimmed
  }

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`
  }

  try {
    const parsed = new URL(trimmed)
    const normalizedPath = parsed.pathname.startsWith(UPLOADS_PREFIX)
      ? parsed.pathname
      : parsed.pathname.startsWith('uploads/')
        ? `/${parsed.pathname}`
        : null

    if (!normalizedPath) {
      return trimmed
    }

    const requestHost = req.get('host')
    const isSameHost = parsed.host === requestHost
    const isLocalDevHost = ['localhost', '127.0.0.1'].includes(parsed.hostname)

    if (isSameHost || isLocalDevHost) {
      return normalizedPath
    }
  } catch (error) {
    return trimmed
  }

  return trimmed
}

function canManageArticle(req, authorId) {
  return req.userRole === 'admin' || Number(req.userId) === Number(authorId)
}

function isArticlePubliclyVisible(article) {
  if (article.status === 'published') {
    return true
  }

  if (article.status !== 'scheduled' || !article.scheduled_publish_at) {
    return false
  }

  return new Date(article.scheduled_publish_at).getTime() <= Date.now()
}

function normalizeStatusInput(status, scheduledPublishAt) {
  const nextStatus = status || 'published'

  if (!['published', 'draft', 'scheduled'].includes(nextStatus)) {
    return { error: 'Invalid article status' }
  }

  if (nextStatus !== 'scheduled') {
    return {
      status: nextStatus,
      scheduledPublishAt: null,
    }
  }

  if (!scheduledPublishAt) {
    return { error: 'Scheduled publish time is required' }
  }

  const publishDate = new Date(scheduledPublishAt)
  if (Number.isNaN(publishDate.getTime())) {
    return { error: 'Scheduled publish time is invalid' }
  }

  if (publishDate.getTime() <= Date.now()) {
    return {
      status: 'published',
      scheduledPublishAt: null,
    }
  }

  return {
    status: 'scheduled',
    scheduledPublishAt: publishDate,
  }
}

function normalizeTextInput(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function resolveTagNames(client, tags, tagIds) {
  if (Array.isArray(tags) && tags.length > 0) {
    return uniqStrings(tags)
  }

  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    return []
  }

  const normalizedIds = tagIds
    .map((tagId) => Number(tagId))
    .filter((tagId) => Number.isInteger(tagId))

  if (normalizedIds.length === 0) {
    return []
  }

  const result = await client.query(
    'SELECT name FROM tags WHERE id = ANY($1)',
    [normalizedIds],
  )

  return uniqStrings(result.rows.map((row) => row.name))
}

async function syncArticleTags(client, articleId, tagNames) {
  await client.query('DELETE FROM article_tags WHERE article_id = $1', [articleId])

  const normalizedNames = uniqStrings(tagNames)
  if (normalizedNames.length === 0) {
    return []
  }

  const insertPlaceholders = normalizedNames
    .map((_, index) => `($${index + 1})`)
    .join(', ')

  await client.query(
    `INSERT INTO tags (name) VALUES ${insertPlaceholders} ON CONFLICT (name) DO NOTHING`,
    normalizedNames,
  )

  const tagRows = await client.query(
    'SELECT id, name FROM tags WHERE name = ANY($1)',
    [normalizedNames],
  )

  if (tagRows.rows.length > 0) {
    const relationPlaceholders = tagRows.rows
      .map((_, index) => `($1, $${index + 2})`)
      .join(', ')

    await client.query(
      `INSERT INTO article_tags (article_id, tag_id) VALUES ${relationPlaceholders}`,
      [articleId, ...tagRows.rows.map((row) => row.id)],
    )
  }

  return tagRows.rows
}

async function getArticleTags(articleId) {
  const result = await pool.query(
    `SELECT t.id, t.name
     FROM tags t
     JOIN article_tags at ON at.tag_id = t.id
     WHERE at.article_id = $1
     ORDER BY t.name ASC`,
    [articleId],
  )

  return result.rows
}

async function syncArticleChunks(article) {
  try {
    await pool.query('DELETE FROM article_chunks WHERE article_id = $1', [article.id])

    let chunks
    try {
      chunks = await documentService.splitArticle(article)
    } catch (splitError) {
      console.error('Article split failed:', splitError)
      chunks = [{ pageContent: article.content || '', metadata: { id: article.id } }]
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      chunks = [{ pageContent: article.content || '', metadata: { id: article.id } }]
    }

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index]
      if (!chunk || !chunk.pageContent) {
        continue
      }

      let keywords
      try {
        keywords = documentService.extractKeywords(chunk.pageContent)
      } catch (keywordError) {
        console.error('Keyword extraction failed:', keywordError)
        keywords = []
      }

      await pool.query(
        'INSERT INTO article_chunks (article_id, content, chunk_index, keywords) VALUES ($1, $2, $3, $4)',
        [article.id, chunk.pageContent.substring(0, 50000), index, keywords.join(', ').substring(0, 10000)],
      )
    }
  } catch (error) {
    console.error('Article chunk sync failed:', error)
  }
}

async function createArticle(req, res) {
  const client = await pool.connect()

  try {
    const {
      title,
      content,
      summary,
      coverImage,
      categoryId,
      tags,
      tagIds,
      status,
      scheduledPublishAt,
    } = req.body

    const normalizedStatus = normalizeStatusInput(status, scheduledPublishAt)
    if (normalizedStatus.error) {
      return res.status(400).json({ error: normalizedStatus.error })
    }

    const normalizedTitle = normalizeTextInput(title)
    const normalizedContent = typeof content === 'string' ? content : ''
    const normalizedSummary = typeof summary === 'string' ? summary.substring(0, 500) : null
    const normalizedCoverImage = normalizeStoredAssetPath(coverImage, req)

    if (
      normalizedStatus.status !== 'draft' &&
      (!normalizedTitle || !normalizedContent.trim())
    ) {
      return res.status(400).json({ error: 'Title and content are required' })
    }

    await client.query('BEGIN')

    const articleResult = await client.query(
      `INSERT INTO articles (
         title,
         content,
         summary,
         cover_image,
         author_id,
         category_id,
         status,
         scheduled_publish_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, content, summary, cover_image, author_id, category_id, status, scheduled_publish_at, view_count, created_at, updated_at`,
      [
        normalizedTitle,
        normalizedContent,
        normalizedSummary,
        normalizedCoverImage,
        req.userId,
        categoryId || null,
        normalizedStatus.status,
        normalizedStatus.scheduledPublishAt,
      ],
    )

    const article = articleResult.rows[0]
    const tagNames = await resolveTagNames(client, tags, tagIds)
    const articleTags = await syncArticleTags(client, article.id, tagNames)

    await client.query('COMMIT')

    await syncArticleChunks({
      id: article.id,
      title: article.title,
      content: article.content,
      author_id: article.author_id,
      category_id: article.category_id,
      status: article.status,
    })

    res.status(201).json({
      id: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      coverImage: resolveAssetUrl(req, article.cover_image),
      authorId: article.author_id,
      categoryId: article.category_id,
      status: article.status,
      scheduledPublishAt: article.scheduled_publish_at,
      viewCount: article.view_count,
      tags: articleTags,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create article error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
}

async function getArticles(req, res) {
  try {
    const shouldReturnAll = req.query.all === 'true' || req.query.all === '1'
    const page = shouldReturnAll ? 1 : Math.max(toInt(req.query.page, 1), 1)
    const limit = shouldReturnAll ? null : Math.min(Math.max(toInt(req.query.limit, 10), 1), 100)
    const offset = (page - 1) * limit
    const { category, tag, keyword, authorId, status } = req.query

    const conditions = []
    const params = []

    const authorIdNumber = authorId ? Number(authorId) : null
    const canViewAllStatuses = Boolean(
      authorIdNumber &&
      req.userId &&
      (req.userRole === 'admin' || Number(req.userId) === authorIdNumber),
    )

    if (canViewAllStatuses) {
      if (status && status !== 'all') {
        params.push(status)
        conditions.push(`a.status = $${params.length}`)
      }
    } else {
      conditions.push(PUBLIC_STATUS_CONDITION)
    }

    if (category) {
      params.push(category)
      conditions.push(`a.category_id = $${params.length}`)
    }

    if (tag) {
      params.push(tag)
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM article_tags at
          JOIN tags t ON t.id = at.tag_id
          WHERE at.article_id = a.id AND t.name = $${params.length}
        )
      `)
    }

    if (keyword) {
      params.push(`%${keyword}%`)
      conditions.push(`(a.title ILIKE $${params.length} OR a.content ILIKE $${params.length})`)
    }

    if (authorIdNumber) {
      params.push(authorIdNumber)
      conditions.push(`a.author_id = $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1 = 1'

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM articles a
      WHERE ${whereClause}
    `

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
      WHERE ${whereClause}
      ORDER BY COALESCE(a.scheduled_publish_at, a.created_at) DESC
      ${shouldReturnAll ? '' : `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`}
    `

    const listParams = shouldReturnAll ? params : [...params, limit, offset]

    const [countResult, articlesResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(listQuery, listParams),
    ])

    const articles = articlesResult.rows
    const articleIds = articles.map((article) => article.id)
    const tagsMap = {}

    if (articleIds.length > 0) {
      const tagsResult = await pool.query(
        `SELECT at.article_id, t.id, t.name
         FROM article_tags at
         JOIN tags t ON t.id = at.tag_id
         WHERE at.article_id = ANY($1)`,
        [articleIds],
      )

      tagsResult.rows.forEach((row) => {
        if (!tagsMap[row.article_id]) {
          tagsMap[row.article_id] = []
        }

        tagsMap[row.article_id].push({
          id: row.id,
          name: row.name,
        })
      })
    }

    const total = Number(countResult.rows[0].total)
    const responseLimit = shouldReturnAll ? articles.length : limit

    res.json({
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        coverImage: resolveAssetUrl(req, article.cover_image),
        authorId: article.author_id,
        categoryId: article.category_id,
        status: article.status,
        scheduledPublishAt: article.scheduled_publish_at,
        viewCount: article.view_count,
        authorName: article.author_name,
        authorAvatar: article.author_avatar,
        categoryName: article.category_name,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        tags: tagsMap[article.id] || [],
      })),
      pagination: {
        page,
        limit: responseLimit,
        total,
        totalPages: shouldReturnAll ? (total > 0 ? 1 : 0) : Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get articles error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getArticleById(req, res) {
  try {
    const { id } = req.params

    const articleResult = await pool.query(
      `SELECT
         a.id,
         a.title,
         a.content,
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
       WHERE a.id = $1`,
      [id],
    )

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' })
    }

    const article = articleResult.rows[0]
    const canManage = canManageArticle(req, article.author_id)

    if (!canManage && !isArticlePubliclyVisible(article)) {
      return res.status(404).json({ error: 'Article not found' })
    }

    let viewCount = article.view_count
    await pool.query(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
      [id],
    )
    viewCount += 1

    const tags = await getArticleTags(id)

    res.json({
      id: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      coverImage: resolveAssetUrl(req, article.cover_image),
      authorId: article.author_id,
      categoryId: article.category_id,
      status: article.status,
      scheduledPublishAt: article.scheduled_publish_at,
      viewCount,
      authorName: article.author_name,
      authorAvatar: article.author_avatar,
      categoryName: article.category_name,
      tags,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
    })
  } catch (error) {
    console.error('Get article by id error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function updateArticle(req, res) {
  const client = await pool.connect()

  try {
    const { id } = req.params
    const articleResult = await client.query(
      'SELECT id, author_id, title, content, status, scheduled_publish_at FROM articles WHERE id = $1',
      [id],
    )

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' })
    }

    const existingArticle = articleResult.rows[0]
    if (!canManageArticle(req, existingArticle.author_id)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const {
      title,
      content,
      summary,
      coverImage,
      categoryId,
      tags,
      tagIds,
      status,
      scheduledPublishAt,
    } = req.body

    const currentTitle = normalizeTextInput(existingArticle.title)
    const currentContent = typeof existingArticle.content === 'string' ? existingArticle.content : ''
    const nextTitle = title !== undefined ? normalizeTextInput(title) : currentTitle
    const nextContent = content !== undefined ? (typeof content === 'string' ? content : '') : currentContent
    const nextStatusSource = status !== undefined ? status : existingArticle.status
    const nextScheduledSource = scheduledPublishAt !== undefined
      ? scheduledPublishAt
      : existingArticle.scheduled_publish_at

    const normalizedStatus = normalizeStatusInput(nextStatusSource, nextScheduledSource)
    if (normalizedStatus.error) {
      return res.status(400).json({ error: normalizedStatus.error })
    }

    if (
      normalizedStatus.status !== 'draft' &&
      (!nextTitle || !nextContent.trim())
    ) {
      return res.status(400).json({ error: 'Title and content are required' })
    }

    const updates = []
    const values = []

    if (title !== undefined) {
      values.push(nextTitle)
      updates.push(`title = $${values.length}`)
    }

    if (content !== undefined) {
      values.push(nextContent)
      updates.push(`content = $${values.length}`)
    }

    if (summary !== undefined) {
      const normalizedSummary = typeof summary === 'string' ? summary.substring(0, 500) : null
      values.push(normalizedSummary)
      updates.push(`summary = $${values.length}`)
    }

    if (coverImage !== undefined) {
      values.push(normalizeStoredAssetPath(coverImage, req))
      updates.push(`cover_image = $${values.length}`)
    }

    if (categoryId !== undefined) {
      values.push(categoryId || null)
      updates.push(`category_id = $${values.length}`)
    }

    if (status !== undefined || scheduledPublishAt !== undefined) {
      values.push(normalizedStatus.status)
      updates.push(`status = $${values.length}`)

      values.push(normalizedStatus.scheduledPublishAt)
      updates.push(`scheduled_publish_at = $${values.length}`)
    }

    await client.query('BEGIN')

    if (updates.length > 0) {
      values.push(id)
      await client.query(
        `UPDATE articles SET ${updates.join(', ')} WHERE id = $${values.length}`,
        values,
      )
    }

    if (tags !== undefined || tagIds !== undefined) {
      const tagNames = await resolveTagNames(client, tags, tagIds)
      await syncArticleTags(client, id, tagNames)
    }

    await client.query('COMMIT')

    const updatedArticleResult = await pool.query(
      `SELECT
         id,
         title,
         content,
         summary,
         cover_image,
         author_id,
         category_id,
         status,
         scheduled_publish_at,
         view_count,
         created_at,
         updated_at
       FROM articles
       WHERE id = $1`,
      [id],
    )

    const updatedArticle = updatedArticleResult.rows[0]
    const articleTags = await getArticleTags(id)

    await syncArticleChunks({
      id: updatedArticle.id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      author_id: updatedArticle.author_id,
      category_id: updatedArticle.category_id,
      status: updatedArticle.status,
    })

    res.json({
      id: updatedArticle.id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      summary: updatedArticle.summary,
      coverImage: resolveAssetUrl(req, updatedArticle.cover_image),
      authorId: updatedArticle.author_id,
      categoryId: updatedArticle.category_id,
      status: updatedArticle.status,
      scheduledPublishAt: updatedArticle.scheduled_publish_at,
      viewCount: updatedArticle.view_count,
      tags: articleTags,
      createdAt: updatedArticle.created_at,
      updatedAt: updatedArticle.updated_at,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Update article error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
}

async function deleteArticle(req, res) {
  try {
    const { id } = req.params
    const articleResult = await pool.query(
      'SELECT author_id FROM articles WHERE id = $1',
      [id],
    )

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' })
    }

    if (!canManageArticle(req, articleResult.rows[0].author_id)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await pool.query('DELETE FROM articles WHERE id = $1', [id])

    res.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Delete article error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function likeArticle(req, res) {
  try {
    const { id } = req.params
    const articleResult = await pool.query(
      'SELECT id FROM articles WHERE id = $1',
      [id],
    )

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' })
    }

    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND article_id = $2',
      [req.userId, id],
    )

    if (existingLike.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND article_id = $2',
        [req.userId, id],
      )

      return res.json({
        liked: false,
        message: 'Unliked successfully',
      })
    }

    await pool.query(
      'INSERT INTO likes (user_id, article_id) VALUES ($1, $2)',
      [req.userId, id],
    )

    res.json({
      liked: true,
      message: 'Liked successfully',
    })
  } catch (error) {
    console.error('Like article error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getArticleLikes(req, res) {
  try {
    const { id } = req.params
    const articleResult = await pool.query(
      'SELECT id FROM articles WHERE id = $1',
      [id],
    )

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' })
    }

    const likesResult = await pool.query(
      'SELECT COUNT(*) AS count FROM likes WHERE article_id = $1',
      [id],
    )

    let isLiked = false
    if (req.userId) {
      const userLikeResult = await pool.query(
        'SELECT id FROM likes WHERE user_id = $1 AND article_id = $2',
        [req.userId, id],
      )
      isLiked = userLikeResult.rows.length > 0
    }

    res.json({
      likeCount: Number(likesResult.rows[0].count),
      isLiked,
    })
  } catch (error) {
    console.error('Get article likes error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getArticleTrend(req, res) {
  try {
    const period = req.query.period || 'month'
    const limit = Math.min(Math.max(toInt(req.query.limit, 12), 1), 60)

    let dateFormat = 'YYYY-MM'
    let groupBy = `date_trunc('month', COALESCE(scheduled_publish_at, created_at))`

    if (period === 'day') {
      dateFormat = 'YYYY-MM-DD'
      groupBy = `date_trunc('day', COALESCE(scheduled_publish_at, created_at))`
    } else if (period === 'week') {
      dateFormat = 'YYYY-IW'
      groupBy = `date_trunc('week', COALESCE(scheduled_publish_at, created_at))`
    } else if (period === 'year') {
      dateFormat = 'YYYY'
      groupBy = `date_trunc('year', COALESCE(scheduled_publish_at, created_at))`
    }

    const result = await pool.query(
      `
        SELECT
          to_char(${groupBy}, '${dateFormat}') AS date,
          COUNT(*) AS count
        FROM articles
        WHERE status = 'published'
           OR (status = 'scheduled' AND scheduled_publish_at <= CURRENT_TIMESTAMP)
        GROUP BY ${groupBy}
        ORDER BY ${groupBy} DESC
        LIMIT $1
      `,
      [limit],
    )

    const data = result.rows.reverse()

    res.json({
      period,
      data: {
        dates: data.map((item) => item.date),
        counts: data.map((item) => Number(item.count)),
      },
    })
  } catch (error) {
    console.error('Get article trend error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function uploadEditorImages(req, res) {
  try {
    const files = Array.isArray(req.files) ? req.files : []

    if (files.length === 0) {
      return res.status(400).json({
        code: 1,
        msg: 'No image uploaded',
        data: {
          errFiles: [],
          succMap: {},
        },
      })
    }

    const succMap = {}
    files.forEach((file) => {
      succMap[file.originalname] = buildUploadPath(file.filename)
    })

    res.json({
      code: 0,
      msg: 'Upload success',
      data: {
        errFiles: [],
        succMap,
      },
    })
  } catch (error) {
    console.error('Upload editor image error:', error)
    res.status(500).json({
      code: 1,
      msg: 'Upload failed',
      data: {
        errFiles: [],
        succMap: {},
      },
    })
  }
}

async function uploadArticleCover(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No cover image uploaded',
      })
    }

    res.json({
      coverImage: resolveAssetUrl(req, buildUploadPath(req.file.filename)),
      coverPath: buildUploadPath(req.file.filename),
      filename: req.file.filename,
      originalName: req.file.originalname,
    })
  } catch (error) {
    console.error('Upload article cover error:', error)
    res.status(500).json({
      error: 'Upload failed',
    })
  }
}

async function getPublicStats(req, res) {
  try {
    const articleCountResult = await pool.query(`SELECT COUNT(*) as count FROM articles WHERE status = 'published' OR (status = 'scheduled' AND scheduled_publish_at <= CURRENT_TIMESTAMP)`)
    const categoryCountResult = await pool.query('SELECT COUNT(*) as count FROM categories')
    const commentCountResult = await pool.query('SELECT COUNT(*) as count FROM comments')
    const tagCountResult = await pool.query('SELECT COUNT(*) as count FROM tags')

    res.json({
      articleCount: Number(articleCountResult.rows[0].count),
      categoryCount: Number(categoryCountResult.rows[0].count),
      commentCount: Number(commentCountResult.rows[0].count),
      tagCount: Number(tagCountResult.rows[0].count),
    })
  } catch (error) {
    console.error('获取公开统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
}

module.exports = {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  likeArticle,
  getArticleLikes,
  getArticleTrend,
  uploadEditorImages,
  uploadArticleCover,
  getPublicStats,
}
