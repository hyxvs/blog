/**
 * routes/tagRoutes.js - 标签路由模块
 *
 * 【核心知识点】
 *
 * 1. 标签 vs 分类的区别
 *
 *    【分类 (Category)】
 *    - 层级结构，有父子关系
 *    - 一篇文章属于一个分类
 *    - 用于内容的宏观组织
 *    - 由管理员管理
 *
 *    【标签 (Tag)】
 *    - 扁平结构，无层级
 *    - 一篇文章可以有多个标签
 *    - 用于内容的微观描述
 *    - 可由用户创建（本项目由管理员管理）
 *
 * 2. 多对多关系
 *
 *    【关系设计】
 *    - 文章表 (articles)
 *    - 标签表 (tags)
 *    - 关联表 (article_tags)
 *
 *    【关联表结构】
 *    - article_id: 外键关联文章
 *    - tag_id: 外键关联标签
 *    - 复合主键 (article_id, tag_id)
 *
 *    【查询方式】
 *    - 获取文章的所有标签：JOIN article_tags 和 tags
 *    - 获取标签的所有文章：JOIN article_tags 和 articles
 *
 * 3. 标签管理策略
 *
 *    【本项目策略】
 *    - 标签由管理员统一管理
 *    - 防止标签泛滥和混乱
 *    - 保持标签体系的规范性
 *
 *    【其他策略】
 *    - 自由标签：用户可创建任意标签
 *    - 推荐标签：提供常用标签供选择
 *    - 标签审核：新标签需要审核
 *
 * 4. 权限设计与分类路由相同
 *
 *    - 读取：公开
 *    - 写入：仅管理员
 */

// 导入 Express 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 导入标签控制器
const tagController = require('../controllers/tagController');

// 导入认证和授权中间件
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * 获取标签列表路由
 *
 * 【路径】GET /api/tags
 * 【权限】公开
 * 【功能】获取所有文章标签
 * 【响应】包含标签名称、文章数量等
 */
router.get('/', tagController.getTags);

/**
 * 获取单个标签路由
 *
 * 【路径】GET /api/tags/:id
 * 【权限】公开
 * 【功能】获取指定标签的详细信息
 * 【路径参数】id - 标签 ID
 */
router.get('/:id', tagController.getTagById);

/**
 * 创建标签路由
 *
 * 【路径】POST /api/tags
 * 【权限】仅管理员
 * 【功能】创建新标签
 * 【请求体】{ name }
 * 【注意】标签名通常唯一，重复会返回 409 错误
 */
router.post('/', authenticateToken, authorizeRole('admin'), tagController.createTag);

/**
 * 更新标签路由
 *
 * 【路径】PUT /api/tags/:id
 * 【权限】仅管理员
 * 【功能】修改标签名称
 * 【路径参数】id - 标签 ID
 * 【请求体】{ name }
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), tagController.updateTag);

/**
 * 删除标签路由
 *
 * 【路径】DELETE /api/tags/:id
 * 【权限】仅管理员
 * 【功能】删除指定标签
 * 【路径参数】id - 标签 ID
 * 【注意】删除标签会自动解除与文章的关联
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), tagController.deleteTag);

// 导出路由模块
module.exports = router;
