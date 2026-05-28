/**
 * ============================================
 * aiRoutes.js - AI 功能路由配置
 * ============================================
 * 
 * 【核心知识点】
 * 
 * 1. Express 路由模块化
 *    - 使用 express.Router() 创建路由实例
 *    - 路由模块化便于代码组织和维护
 *    - 每个路由文件负责一个功能领域
 * 
 * 2. RESTful API 设计原则
 *    - 使用 HTTP 方法表示操作类型：
 *      - POST: 创建/处理数据
 *      - GET: 获取数据
 *    - 路径设计清晰，语义化
 *    - 使用参数传递必要信息
 * 
 * 3. 路由参数
 *    - 路径参数：/path/:param
 *    - 查询参数：/path?key=value
 *    - 请求体：POST 请求的数据
 * 
 * 4. 中间件和控制器分离
 *    - 路由负责请求分发
 *    - 控制器负责业务逻辑
 *    - 职责清晰，代码可维护性高
 */

// ============================================
// 1. 导入依赖
// ============================================

/**
 * 【知识点】Express 框架导入
 * express 是 Node.js 最流行的 Web 应用框架
 * 提供简洁的 API 来处理 HTTP 请求和路由
 */
const express = require('express');

/**
 * 【知识点】创建路由实例
 * express.Router() 创建一个路由处理器
 * 可以像 app 对象一样使用，但只处理特定前缀的路由
 */
const router = express.Router();

/**
 * 【知识点】控制器导入
 * 导入 AI 相关的控制器，处理具体的业务逻辑
 * 路由负责分发请求，控制器负责处理请求
 */
const aiController = require('../controllers/aiController');

/**
 * 【知识点】认证中间件导入
 * 用于保护需要用户登录的路由
 */
const { authenticateToken } = require('../middleware/auth');

// ============================================
// 2. 原有 AI 功能路由
// ============================================

/**
 * 【知识点】路由定义
 * router.METHOD(path, handler)
 * - METHOD: HTTP 方法（get, post, put, delete 等）
 * - path: 路由路径
 * - handler: 处理函数（通常是控制器方法）
 */

/**
 * 生成文章
 * POST /api/ai/generate-article
 * 请求体：{ title, tags, length }
 * 响应：生成的文章内容
 */
router.post('/generate-article', aiController.generateArticle);

/**
 * 生成摘要
 * POST /api/ai/generate-summary
 * 请求体：{ content, length }
 * 响应：生成的摘要内容
 */
router.post('/generate-summary', aiController.generateSummary);

/**
 * 生成回复
 * POST /api/ai/generate-reply
 * 请求体：{ context, query }
 * 响应：生成的回复内容
 */
router.post('/generate-reply', aiController.generateReply);

/**
 * 优化内容
 * POST /api/ai/optimize-content
 * 请求体：{ content, type }
 * 响应：优化后的内容
 */
router.post('/optimize-content', aiController.optimizeContent);

// ==================== 流式 API 路由 ====================

/**
 * 流式生成文章
 * POST /api/ai/generate-article/stream
 * 请求体：{ topic, keywords, length, model }
 * 响应：SSE流式数据
 */
router.post('/generate-article/stream', aiController.streamGenerateArticle);

/**
 * 流式生成摘要
 * POST /api/ai/generate-summary/stream
 * 请求体：{ content, length, model }
 * 响应：SSE流式数据
 */
router.post('/generate-summary/stream', aiController.streamGenerateSummary);

/**
 * 流式生成回复
 * POST /api/ai/generate-reply/stream
 * 请求体：{ message, context, model }
 * 响应：SSE流式数据
 */
router.post('/generate-reply/stream', aiController.streamGenerateReply);

/**
 * 流式优化内容
 * POST /api/ai/optimize-content/stream
 * 请求体：{ content, type, model }
 * 响应：SSE流式数据
 */
router.post('/optimize-content/stream', aiController.streamOptimizeContent);

/**
 * 流式续写内容
 * POST /api/ai/continue-writing/stream
 * 请求体：{ content, length, model }
 * 响应：SSE流式数据
 */
router.post('/continue-writing/stream', aiController.streamContinueWriting);

// ============================================
// 3. 新增 AI 功能路由
// ============================================

/**
 * 【知识点】路由分组
 * 按功能模块分组路由，提高代码可读性
 * 便于后续维护和扩展
 */

// ==================== 文章详情页功能 ====================

/**
 * 生成评论回复
 * POST /api/ai/comment-reply
 * 请求体：{ comment, context }
 * 响应：生成的回复内容
 */
router.post('/comment-reply', aiController.generateCommentReply);

/**
 * 推荐相关文章
 * GET /api/ai/recommend-articles/:articleId
 * 路径参数：articleId - 文章ID
 * 响应：推荐的相关文章列表
 */
router.get('/recommend-articles/:articleId', aiController.recommendRelatedArticles);

/**
 * 生成评论建议
 * GET /api/ai/comment-suggestions/:articleId
 * 路径参数：articleId - 文章ID
 * 响应：评论建议列表
 */
router.get('/comment-suggestions/:articleId', aiController.generateCommentSuggestion);

// ==================== 评论系统功能 ====================

/**
 * 分析情感
 * POST /api/ai/analyze-sentiment
 * 请求体：{ text }
 * 响应：情感分析结果
 */
router.post('/analyze-sentiment', aiController.analyzeSentiment);

// ==================== 文章编辑/创建功能 ====================

/**
 * 推荐标签
 * POST /api/ai/recommend-tags
 * 请求体：{ content, title }
 * 响应：推荐的标签列表
 */
router.post('/recommend-tags', aiController.recommendTags);

/**
 * 建议标题
 * POST /api/ai/suggest-title
 * 请求体：{ content, keywords }
 * 响应：推荐的标题列表
 */
router.post('/suggest-title', aiController.suggestTitle);



// ==================== 首页功能 ====================

/**
 * 智能搜索
 * POST /api/ai/smart-search
 * 请求体：{ query }
 * 响应：搜索结果
 */
router.post('/smart-search', aiController.smartSearch);

/**
 * 分析热门话题
 * GET /api/ai/trending-topics
 * 响应：热门话题列表
 */
router.get('/trending-topics', aiController.analyzeTrendingTopics);

// ==================== 用户个人中心功能 ====================

/**
 * 分析写作风格
 * GET /api/ai/writing-style/:userId
 * 路径参数：userId - 用户ID
 * 响应：写作风格分析结果
 */
router.get('/writing-style/:userId', aiController.analyzeWritingStyle);

/**
 * 获取阅读推荐
 * GET /api/ai/reading-recommendations/:userId
 * 路径参数：userId - 用户ID
 * 响应：阅读推荐列表
 */
router.get('/reading-recommendations/:userId', aiController.getReadingRecommendations);

// ==================== 全局功能 ====================

/**
 * 聊天功能
 * POST /api/ai/chat
 * 请求体：{ message, history }
 * 响应：聊天回复
 */
router.post('/chat', authenticateToken, aiController.chat);

// ==================== 新增流式和增强功能路由 ====================

/**
 * 流式聊天功能
 * POST /api/ai/chat/stream
 * 请求体：{ message, history, sessionId, contextType }
 * 响应：SSE流式数据
 */
router.post('/chat/stream', aiController.streamChat);

/**
 * 获取所有上下文类型
 * GET /api/ai/contexts
 * 响应：上下文类型列表
 */
router.get('/contexts', aiController.getContexts);


/**
 * 文件内容分析
 * POST /api/ai/analyze-file
 * 请求体：{ fileContent, fileName }
 * 响应：分析结果
 */
router.post('/analyze-file', aiController.analyzeFile);

// ==================== 快捷操作路由 ====================

/**
 * 生成大纲
 * POST /api/ai/generate-outline
 * 请求体：{ topic, keywords }
 * 响应：大纲内容
 */
router.post('/generate-outline', aiController.generateOutline);

/**
 * 续写内容
 * POST /api/ai/continue-writing
 * 请求体：{ content, maxLength }
 * 响应：续写内容
 */
router.post('/continue-writing', aiController.continueWriting);

/**
 * 润色内容
 * POST /api/ai/polish-content
 * 请求体：{ content, style }
 * 响应：润色后的内容
 */
router.post('/polish-content', aiController.polishContent);

/**
 * SEO优化建议
 * POST /api/ai/seo-optimization
 * 请求体：{ content, title }
 * 响应：SEO建议
 */
router.post('/seo-optimization', aiController.seoOptimization);

/**
 * 上传文件并分析
 * POST /api/ai/upload-analyze
 * 请求体：multipart/form-data
 * 响应：分析结果
 */
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/upload-analyze', upload.single('file'), aiController.uploadAndAnalyze);

/**
 * 基于图片描述生成内容
 * POST /api/ai/generate-from-image
 * 请求体：{ imageDescription, instruction }
 * 响应：生成的内容
 */
router.post('/generate-from-image', aiController.generateFromImage);

/**
 * 搜索Unsplash图片
 * POST /api/ai/search-unsplash
 * 请求体：{ query, perPage }
 * 响应：图片列表
 */
router.post('/search-unsplash', aiController.searchUnsplashImages);

/**
 * AI推荐封面图片
 * POST /api/ai/recommend-cover
 * 请求体：{ title, content, query }
 * 响应：推荐的封面图片列表
 */
router.post('/recommend-cover', aiController.recommendCoverImage);



// ============================================// 4. 导出路由// ============================================

/**
 * 【知识点】模块导出
 * 使用 CommonJS 模块系统导出路由实例
 * 在 app.js 中通过 require 导入并挂载
 */
module.exports = router;
