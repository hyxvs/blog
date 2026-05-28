/**
 * routes/categoryRoutes.js - 分类路由模块
 *
 * 【核心知识点】
 *
 * 1. 管理型资源的权限设计
 *
 *    【读取操作】
 *    - GET /api/categories      - 公开，任何人可查看分类列表
 *    - GET /api/categories/:id  - 公开，任何人可查看分类详情
 *
 *    【写入操作】
 *    - POST   /api/categories   - 仅管理员可创建
 *    - PUT    /api/categories/:id - 仅管理员可修改
 *    - DELETE /api/categories/:id - 仅管理员可删除
 *
 *    【为什么这样设计？】
 *    - 分类是系统级配置，普通用户不应修改
 *    - 防止用户创建不当分类
 *    - 保持内容组织结构的一致性
 *
 * 2. 角色权限控制 (RBAC)
 *
 *    【authenticateToken】
 *    - 验证用户是否已登录
 *    - 从 Token 中提取用户信息
 *
 *    【authorizeRole('admin')】
 *    - 验证用户角色是否为管理员
 *    - 只有管理员才能执行敏感操作
 *
 *    【中间件执行顺序】
 *    1. authenticateToken - 检查登录状态
 *    2. authorizeRole('admin') - 检查管理员权限
 *    3. controller - 执行业务逻辑
 *
 * 3. 分类的数据特性
 *
 *    【一对多关系】
 *    - 一个分类可以有多个文章
 *    - 一篇文章属于一个分类（或没有分类）
 *    - 通过 category_id 外键关联
 *
 *    【统计信息】
 *    - 通常需要显示每个分类下的文章数量
 *    - 在查询时通过子查询或 JOIN 获取
 */

// 导入 Express 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 导入分类控制器
const categoryController = require('../controllers/categoryController');

// 导入认证和授权中间件
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * 获取分类列表路由
 *
 * 【路径】GET /api/categories
 * 【权限】公开
 * 【功能】获取所有文章分类
 * 【响应】包含分类名称、描述、文章数量等
 */
router.get('/', categoryController.getCategories);

/**
 * 获取单个分类路由
 *
 * 【路径】GET /api/categories/:id
 * 【权限】公开
 * 【功能】获取指定分类的详细信息
 * 【路径参数】id - 分类 ID
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * 创建分类路由
 *
 * 【路径】POST /api/categories
 * 【权限】仅管理员
 * 【功能】创建新的文章分类
 * 【请求体】{ name, description? }
 * 【中间件】先验证登录，再验证管理员角色
 */
router.post('/', authenticateToken, authorizeRole('admin'), categoryController.createCategory);

/**
 * 更新分类路由
 *
 * 【路径】PUT /api/categories/:id
 * 【权限】仅管理员
 * 【功能】修改分类信息
 * 【路径参数】id - 分类 ID
 * 【请求体】{ name?, description? }
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), categoryController.updateCategory);

/**
 * 删除分类路由
 *
 * 【路径】DELETE /api/categories/:id
 * 【权限】仅管理员
 * 【功能】删除指定分类
 * 【路径参数】id - 分类 ID
 * 【注意】删除分类通常不影响已有文章（外键设为 NULL）
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), categoryController.deleteCategory);

// 导出路由模块
module.exports = router;
