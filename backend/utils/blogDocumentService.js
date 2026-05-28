/**
 * ============================================
 * blogDocumentService.js - 博客平台文档服务
 * ============================================
 * 
 * 【功能说明】
 * 基于LangChain的Document分片查询功能，为博客平台提供：
 * 1. 文章内容的智能分割
 * 2. 相关文章推荐
 * 3. 文章搜索功能
 * 4. 内容摘要生成
 * 
 * 【设计说明】
 * 本服务继承自AIService，复用其AI能力和工具方法
 * 专注于文档分片和相关功能
 * 
 * 【应用场景】
 * - 长文章处理：将长文章分割成适合AI处理的块
 * - 相关推荐：基于内容相似度推荐相关文章
 * - 智能搜索：支持关键词和语义搜索
 * - 摘要生成：为文章自动生成摘要
 */

const { Document } = require('@langchain/core/documents');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const AIService = require('./aiService');

class BlogDocumentService extends AIService {
  constructor(ollamaURL = 'http://localhost:11434', sessionId = 'default', userId = null) {
    // 调用父类构造函数
    super(ollamaURL, sessionId, userId);
    
    // 覆盖父类的textSplitter配置，使用文档专用的分割参数
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 150,
      separators: ['\n\n', '\n', '。', '！', '？', '，', ' ', '']
    });

    this.articleChunks = new Map();
  }

  /**
   * 将文章转换为Document对象
   * @param {Object} article - 文章对象
   * @returns {Document} Document对象
   */
  articleToDocument(article) {
    return new Document({
      pageContent: article.content,
      metadata: {
        id: article.id,
        title: article.title,
        author: article.author,
        category: article.category,
        tags: article.tags || [],
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        viewCount: article.viewCount || 0,
        status: article.status || 'published'
      }
    });
  }

  /**
   * 分割文章内容
   * @param {Object} article - 文章对象
   * @returns {Promise<Array>} 分割后的文档块
   */
  async splitArticle(article) {
    try {
      const doc = this.articleToDocument(article);
      const chunks = await this.textSplitter.splitDocuments([doc]);

      this.articleChunks.set(article.id, chunks);

      console.log(`文章 ${article.id} 分割完成，共 ${chunks.length} 个块`);
      return chunks;
    } catch (error) {
      console.error('文章分割失败:', error);
      return [this.articleToDocument(article)];
    }
  }

  /**
   * 批量分割文章
   * @param {Array} articles - 文章数组
   * @returns {Promise<Array>} 所有分割后的文档块
   */
  async splitArticles(articles) {
    try {
      const allChunks = [];

      for (const article of articles) {
        const chunks = await this.splitArticle(article);
        allChunks.push(...chunks);
      }

      console.log(`批量分割完成，共处理 ${articles.length} 篇文章，生成 ${allChunks.length} 个块`);
      return allChunks;
    } catch (error) {
      console.error('批量分割失败:', error);
      return [];
    }
  }

  /**
   * 基于关键词搜索文章
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 匹配的文章列表
   */
  async searchByKeyword(keyword) {
    try {
      const allChunks = Array.from(this.articleChunks.values()).flat();
      const matchedChunks = allChunks.filter(chunk =>
        chunk.pageContent.toLowerCase().includes(keyword.toLowerCase()) ||
        chunk.metadata.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (chunk.metadata.tags && chunk.metadata.tags.some(tag => 
          tag.toLowerCase().includes(keyword.toLowerCase())
        ))
      );

      const uniqueArticles = new Map();
      matchedChunks.forEach(chunk => {
        const articleId = chunk.metadata.id;
        if (!uniqueArticles.has(articleId)) {
          uniqueArticles.set(articleId, {
            id: chunk.metadata.id,
            title: chunk.metadata.title,
            author: chunk.metadata.author,
            category: chunk.metadata.category,
            tags: chunk.metadata.tags,
            createdAt: chunk.metadata.createdAt,
            matchedContent: chunk.pageContent.substring(0, 200) + '...'
          });
        }
      });

      console.log(`关键词 "${keyword}" 搜索完成，找到 ${uniqueArticles.size} 篇文章`);
      return Array.from(uniqueArticles.values());
    } catch (error) {
      console.error('关键词搜索失败:', error);
      return [];
    }
  }

  /**
   * 基于分类筛选文章
   * @param {string} category - 分类名称
   * @returns {Promise<Array>} 匹配的文章列表
   */
  async filterByCategory(category) {
    try {
      const allChunks = Array.from(this.articleChunks.values()).flat();
      const matchedChunks = allChunks.filter(chunk =>
        chunk.metadata.category === category
      );

      const uniqueArticles = new Map();
      matchedChunks.forEach(chunk => {
        const articleId = chunk.metadata.id;
        if (!uniqueArticles.has(articleId)) {
          uniqueArticles.set(articleId, {
            id: chunk.metadata.id,
            title: chunk.metadata.title,
            author: chunk.metadata.author,
            category: chunk.metadata.category,
            tags: chunk.metadata.tags,
            createdAt: chunk.metadata.createdAt
          });
        }
      });

      console.log(`分类 "${category}" 筛选完成，找到 ${uniqueArticles.size} 篇文章`);
      return Array.from(uniqueArticles.values());
    } catch (error) {
      console.error('分类筛选失败:', error);
      return [];
    }
  }

  /**
   * 基于标签筛选文章
   * @param {string} tag - 标签名称
   * @returns {Promise<Array>} 匹配的文章列表
   */
  async filterByTag(tag) {
    try {
      const allChunks = Array.from(this.articleChunks.values()).flat();
      const matchedChunks = allChunks.filter(chunk =>
        chunk.metadata.tags && chunk.metadata.tags.includes(tag)
      );

      const uniqueArticles = new Map();
      matchedChunks.forEach(chunk => {
        const articleId = chunk.metadata.id;
        if (!uniqueArticles.has(articleId)) {
          uniqueArticles.set(articleId, {
            id: chunk.metadata.id,
            title: chunk.metadata.title,
            author: chunk.metadata.author,
            category: chunk.metadata.category,
            tags: chunk.metadata.tags,
            createdAt: chunk.metadata.createdAt
          });
        }
      });

      console.log(`标签 "${tag}" 筛选完成，找到 ${uniqueArticles.size} 篇文章`);
      return Array.from(uniqueArticles.values());
    } catch (error) {
      console.error('标签筛选失败:', error);
      return [];
    }
  }

  /**
   * 推荐相关文章（基于内容相似度）
   * @param {Object} currentArticle - 当前文章
   * @param {number} limit - 推荐数量
   * @returns {Promise<Array>} 推荐的文章列表
   */
  async recommendRelatedArticles(currentArticle, limit = 3) {
    try {
      const allChunks = Array.from(this.articleChunks.values()).flat();
      
      const currentKeywords = this.extractKeywords(currentArticle.content);

      const scoredArticles = new Map();

      allChunks.forEach(chunk => {
        if (chunk.metadata.id === currentArticle.id) return;

        const chunkKeywords = this.extractKeywords(chunk.pageContent);
        const similarity = this.calculateSimilarity(currentKeywords, chunkKeywords);

        if (!scoredArticles.has(chunk.metadata.id)) {
          scoredArticles.set(chunk.metadata.id, {
            id: chunk.metadata.id,
            title: chunk.metadata.title,
            author: chunk.metadata.author,
            category: chunk.metadata.category,
            tags: chunk.metadata.tags,
            score: similarity
          });
        } else {
          scoredArticles.get(chunk.metadata.id).score += similarity;
        }
      });

      const recommendations = Array.from(scoredArticles.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          id: item.id,
          title: item.title,
          author: item.author,
          category: item.category,
          tags: item.tags
        }));

      console.log(`为文章 ${currentArticle.id} 推荐 ${recommendations.length} 篇相关文章`);
      return recommendations;
    } catch (error) {
      console.error('推荐相关文章失败:', error);
      return [];
    }
  }

  /**
   * 获取文章统计信息
   * @param {number} articleId - 文章ID
   * @returns {Object} 统计信息
   */
  getArticleStats(articleId) {
    const chunks = this.articleChunks.get(articleId);
    if (!chunks) {
      return null;
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.pageContent.length, 0);
    const avgLength = totalLength / chunks.length;

    return {
      articleId,
      chunkCount: chunks.length,
      totalLength,
      avgLength: avgLength.toFixed(2),
      metadata: chunks[0].metadata
    };
  }

  /**
   * 清理缓存的文档块
   * @param {number} articleId - 文章ID（可选）
   */
  clearChunks(articleId = null) {
    if (articleId) {
      this.articleChunks.delete(articleId);
      console.log(`已清理文章 ${articleId} 的文档块`);
    } else {
      this.articleChunks.clear();
      console.log('已清理所有文档块');
    }
  }

  /**
   * 获取所有缓存的文档块统计
   * @returns {Object} 统计信息
   */
  getCacheStats() {
    const totalArticles = this.articleChunks.size;
    const totalChunks = Array.from(this.articleChunks.values())
      .reduce((sum, chunks) => sum + chunks.length, 0);

    return {
      totalArticles,
      totalChunks,
      avgChunksPerArticle: totalArticles > 0 ? (totalChunks / totalArticles).toFixed(2) : '0'
    };
  }
}

module.exports = BlogDocumentService;
