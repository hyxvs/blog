/**
 * ============================================
 * documentRoutes.js - 文档分片路由
 * ============================================
 * 
 * 【功能说明】
 * 定义文档分片相关的API路由，包括：
 * 1. 文章分割
 * 2. 文章搜索
 * 3. 相关文章推荐
 * 4. 文章摘要生成
 * 
 * 【路由说明】
 * - POST /api/documents/split/:articleId - 分割单篇文章
 * - POST /api/documents/split-batch - 批量分割文章
 * - GET /api/documents/search - 搜索文章
 * - GET /api/documents/recommend/:articleId/:limit? - 推荐相关文章
 * - POST /api/documents/summary/:articleId/:length? - 生成文章摘要
 * - GET /api/documents/stats/:articleId - 获取文章分片统计
 */

const express = require('express');
const documentController = require('../controllers/documentController');
const router = express.Router();

// 分割单篇文章
router.post('/split/:articleId', (req, res) => documentController.splitArticle(req, res));

// 批量分割文章
router.post('/split-batch', (req, res) => documentController.splitArticles(req, res));

// 搜索文章
router.get('/search', (req, res) => documentController.searchArticles(req, res));

// 推荐相关文章
router.get('/recommend/:articleId/:limit?', (req, res) => documentController.recommendArticles(req, res));

// 生成文章摘要
router.post('/summary/:articleId/:length?', (req, res) => documentController.generateSummary(req, res));

// 获取文章分片统计
router.get('/stats/:articleId', (req, res) => documentController.getArticleStats(req, res));

module.exports = router;
