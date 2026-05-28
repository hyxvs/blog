/**
 * routes/commentRoutes.js - 评论路由模块
 *
 * 【核心知识点】
 *
 * 1. 嵌套资源路由设计
 *
 *    【问题】
 *    评论是文章的子资源，如何设计路由？
 *
 *    【方案对比】
 *    方案A: /api/comments?articleId=123
 *    - 优点：扁平结构，简单
 *    - 缺点：语义不够清晰
 *
 *    方案B: /api/articles/123/comments
 *    - 优点：体现资源层级关系
 *    - 缺点：需要嵌套路由
 *
 *    方案C: /api/comments/article/123 (本项目采用)
 *    - 优点：独立路由文件，同时体现关联
 *    - 缺点：路径稍长
 *
 * 2. 评论系统的特点
 *
 *    【层级结构】
 *    - 一级评论：直接对文章的评论
 *    - 二级评论：对一级评论的回复
 *    - 可以设计无限层级或限制层级
 *
 *    【数据关联】
 *    - 每条评论必须关联一篇文章
 *    - 回复评论需要关联父评论
 *    - 需要验证关联的资源是否存在
 *
 * 3. 权限控制
 *
 *    【发表评论】
 *    - 需要登录
 *    - 防止垃圾评论
 *
 *    【查看评论】
 *    - 公开访问
 *    - 任何人可查看文章评论
 *
 *    【删除评论】
 *    - 需要登录
 *    - 通常只有评论作者或管理员可删除
 */

// 导入 Express 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 导入评论控制器
const commentController = require('../controllers/commentController');

// 导入认证中间件
const { authenticateToken } = require('../middleware/auth');

/**
 * 发表评论路由
 *
 * 【路径】POST /api/comments
 * 【权限】需登录
 * 【功能】对文章发表评论或回复其他评论
 * 【请求体】{ articleId, content, parentId? }
 * 【说明】parentId 可选，用于回复其他评论
 */
router.post('/', authenticateToken, commentController.createComment);

/**
 * 获取文章评论列表路由
 *
 * 【路径】GET /api/comments/article/:articleId
 * 【权限】公开
 * 【功能】获取指定文章的所有评论
 * 【路径参数】articleId - 文章 ID
 * 【查询参数】page, limit 用于分页
 */
router.get('/article/:articleId', commentController.getComments);

/**
 * 删除评论路由
 *
 * 【路径】DELETE /api/comments/:id
 * 【权限】需登录
 * 【功能】删除指定评论
 * 【路径参数】id - 评论 ID
 * 【说明】通常需要验证用户是否为评论作者
 */
router.delete('/:id', authenticateToken, commentController.deleteComment);

// 导出路由模块
module.exports = router;
