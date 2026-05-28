/**
 * ============================================
 * documentController.js - 文档分片控制器
 * ============================================
 * 
 * 【功能说明】
 * 处理文档分片相关的API请求，包括：
 * 1. 文章分割
 * 2. 文章搜索
 * 3. 相关文章推荐
 * 4. 文章摘要生成
 * 
 * 【技术栈】
 * - Express.js 路由处理
 * - BlogDocumentService 文档服务
 * - PostgreSQL 数据库
 */

const BlogDocumentService = require('../utils/blogDocumentService');
const pool = require('../config/pool');

class DocumentController {
  constructor() {
    this.documentService = new BlogDocumentService();
  }

  /**
   * 分割文章内容
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async splitArticle(req, res) {
    try {
      const { articleId } = req.params;

      // 从数据库获取文章
      const { rows: articles } = await pool.query(
        'SELECT * FROM articles WHERE id = $1',
        [articleId]
      );

      if (articles.length === 0) {
        return res.status(404).json({ error: '文章不存在' });
      }

      const article = articles[0];

      // 分割文章
      const chunks = await this.documentService.splitArticle(article);

      // 保存分片到数据库
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const keywords = this.documentService.extractKeywords(chunk.pageContent);

        await pool.query(
          'INSERT INTO article_chunks (article_id, content, chunk_index, keywords) VALUES ($1, $2, $3, $4)',
          [articleId, chunk.pageContent, i, keywords.join(', ')]
        );
      }

      res.json({
        success: true,
        message: '文章分割成功',
        data: {
          articleId,
          chunkCount: chunks.length
        }
      });
    } catch (error) {
      console.error('分割文章失败:', error);
      res.status(500).json({ error: '分割文章失败' });
    }
  }

  /**
   * 批量分割文章
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async splitArticles(req, res) {
    try {
      // 从数据库获取所有文章
      const { rows: articles } = await pool.query(
        'SELECT * FROM articles WHERE status = $1',
        ['published']
      );

      let processedCount = 0;
      let totalChunks = 0;

      for (const article of articles) {
        // 检查是否已存在分片
        const { rows: existingChunks } = await pool.query(
          'SELECT COUNT(*) FROM article_chunks WHERE article_id = $1',
          [article.id]
        );

        if (existingChunks[0].count === 0) {
          const chunks = await this.documentService.splitArticle(article);
          
          // 保存分片到数据库
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const keywords = this.documentService.extractKeywords(chunk.pageContent);

            await pool.query(
              'INSERT INTO article_chunks (article_id, content, chunk_index, keywords) VALUES ($1, $2, $3, $4)',
              [article.id, chunk.pageContent, i, keywords.join(', ')]
            );
          }

          processedCount++;
          totalChunks += chunks.length;
        }
      }

      res.json({
        success: true,
        message: '批量分割完成',
        data: {
          processedCount,
          totalChunks
        }
      });
    } catch (error) {
      console.error('批量分割文章失败:', error);
      res.status(500).json({ error: '批量分割文章失败' });
    }
  }

  /**
   * 搜索文章
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async searchArticles(req, res) {
    try {
      const { keyword, category, tag, page = 1, limit = 10 } = req.query;

      let query = 'SELECT DISTINCT a.* FROM articles a LEFT JOIN article_chunks ac ON a.id = ac.article_id WHERE a.status = $1';
      let params = ['published'];
      let paramIndex = 2;

      if (keyword) {
        query += ` AND (a.title ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex} OR ac.keywords ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }

      if (category) {
        query += ` AND a.category_id = (SELECT id FROM categories WHERE name = $${paramIndex})`;
        params.push(category);
        paramIndex++;
      }

      if (tag) {
        query += ` AND a.id IN (SELECT article_id FROM article_tags WHERE tag_id = (SELECT id FROM tags WHERE name = $${paramIndex}))`;
        params.push(tag);
        paramIndex++;
      }

      query += ' ORDER BY a.created_at DESC';

      const { rows: articles } = await pool.query(query, params);

      // 加载文章的分类和标签
      const articlesWithDetails = await Promise.all(articles.map(async (article) => {
        // 获取分类
        const { rows: categories } = await pool.query(
          'SELECT name FROM categories WHERE id = $1',
          [article.category_id]
        );

        // 获取标签
        const { rows: tags } = await pool.query(
          'SELECT t.name FROM tags t JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = $1',
          [article.id]
        );

        return {
          ...article,
          category: categories.length > 0 ? categories[0].name : null,
          tags: tags.map(tag => tag.name)
        };
      }));

      res.json({
        success: true,
        data: {
          articles: articlesWithDetails,
          total: articlesWithDetails.length,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('搜索文章失败:', error);
      res.status(500).json({ error: '搜索文章失败' });
    }
  }

  /**
   * 推荐相关文章
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async recommendArticles(req, res) {
    try {
      const { articleId, limit = 3 } = req.params;

      // 从数据库获取当前文章
      const { rows: currentArticles } = await pool.query(
        'SELECT * FROM articles WHERE id = $1',
        [articleId]
      );

      if (currentArticles.length === 0) {
        return res.status(404).json({ error: '文章不存在' });
      }

      const currentArticle = currentArticles[0];

      // 从数据库获取所有文章
      const { rows: allArticles } = await pool.query(
        'SELECT * FROM articles WHERE status = $1 AND id != $2',
        ['published', articleId]
      );

      // 分割所有文章
      await this.documentService.splitArticles(allArticles);
      await this.documentService.splitArticle(currentArticle);

      // 推荐相关文章
      const recommendations = await this.documentService.recommendRelatedArticles(currentArticle, parseInt(limit));

      res.json({
        success: true,
        data: {
          recommendations
        }
      });
    } catch (error) {
      console.error('推荐文章失败:', error);
      res.status(500).json({ error: '推荐文章失败' });
    }
  }

  /**
   * 生成文章摘要
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async generateSummary(req, res) {
    try {
      const { articleId, length = 200 } = req.params;

      // 从数据库获取文章
      const { rows: articles } = await pool.query(
        'SELECT * FROM articles WHERE id = $1',
        [articleId]
      );

      if (articles.length === 0) {
        return res.status(404).json({ error: '文章不存在' });
      }

      const article = articles[0];

      // 分割文章
      await this.documentService.splitArticle(article);

      // 生成摘要
      let summary = await this.documentService.generateSummary(article, parseInt(length));

      // 截断摘要，确保不超过数据库字段长度限制
      if (summary.length > 500) {
        summary = summary.substring(0, 497) + '...';
      }

      // 更新文章摘要
      await pool.query(
        'UPDATE articles SET summary = $1 WHERE id = $2',
        [summary, articleId]
      );

      res.json({
        success: true,
        data: {
          articleId,
          summary
        }
      });
    } catch (error) {
      console.error('生成摘要失败:', error);
      res.status(500).json({ error: '生成摘要失败' });
    }
  }

  /**
   * 获取文章分片统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getArticleStats(req, res) {
    try {
      const { articleId } = req.params;

      // 从数据库获取分片统计
      const { rows: stats } = await pool.query(
        'SELECT COUNT(*) as chunkCount, SUM(LENGTH(content)) as totalLength FROM article_chunks WHERE article_id = $1',
        [articleId]
      );

      if (stats.length === 0 || stats[0].chunkCount === 0) {
        return res.status(404).json({ error: '文章分片不存在' });
      }

      const { chunkCount, totalLength } = stats[0];

      res.json({
        success: true,
        data: {
          articleId,
          chunkCount,
          totalLength,
          avgLength: totalLength / chunkCount
        }
      });
    } catch (error) {
      console.error('获取文章统计失败:', error);
      res.status(500).json({ error: '获取文章统计失败' });
    }
  }

}

module.exports = new DocumentController();
