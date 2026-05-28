/**
 * controllers/categoryController.js - 分类控制器
 *
 * 【核心知识点】
 *
 * 1. 简单 CRUD 操作
 *
 *    【Create】INSERT INTO ... RETURNING
 *    【Read】SELECT ... FROM ... WHERE
 *    【Update】UPDATE ... SET ... WHERE ... RETURNING
 *    【Delete】DELETE FROM ... WHERE ... RETURNING
 *
 * 2. 子查询统计
 *
 *    【使用场景】
 *    - 获取分类时同时获取文章数量
 *    - 避免额外的查询
 *
 *    【语法】
 *    (SELECT COUNT(*) FROM articles WHERE category_id = c.id) as article_count
 *
 * 3. 唯一性约束处理
 *
 *    【PostgreSQL 错误码】
 *    - 23505: unique_violation
 *    - 创建分类时名称重复会触发此错误
 *
 *    【处理策略】
 *    - 捕获错误码
 *    - 返回 409 Conflict
 *    - 提供友好的错误信息
 *
 * 4. 动态更新
 *
 *    【部分更新】
 *    - 只更新提供的字段
 *    - 未提供的字段保持不变
 *    - 使用动态 SQL 构建
 */

// 导入数据库连接池
const pool = require('../config/pool');

/**
 * 获取分类列表
 *
 * 【功能】获取所有分类及其文章数量
 * 【请求】GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    /**
     * 查询分类及文章数量
     *
     * 【知识点】
     * - 使用子查询统计每个分类的文章数
     * - 按名称字母顺序排序
     */
    const result = await pool.query(
      `SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.name ASC`
    );

    // 格式化响应数据
    res.json({
      categories: result.rows.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        articleCount: parseInt(cat.article_count),
        createdAt: cat.created_at,
      })),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取单个分类
 *
 * 【功能】获取指定分类的详细信息
 * 【请求】GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询分类详情
    const result = await pool.query(
      `SELECT 
        c.id, c.name, c.description, c.created_at,
        (SELECT COUNT(*) FROM articles WHERE category_id = c.id) as article_count
      FROM categories c
      WHERE c.id = $1`,
      [id]
    );

    // 分类不存在
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = result.rows[0];

    // 返回分类信息
    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      articleCount: parseInt(category.article_count),
      createdAt: category.created_at,
    });
  } catch (error) {
    console.error('Get category by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 创建分类
 *
 * 【功能】创建新分类
 * 【请求】POST /api/categories
 * 【权限】仅管理员
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // 参数验证
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // 插入分类数据
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at',
      [name, description || null]
    );

    const category = result.rows[0];

    // 返回创建的分类
    res.status(201).json({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at,
    });
  } catch (error) {
    console.error('Create category error:', error);

    /**
     * 处理唯一性约束错误
     *
     * 【知识点】
     * - PostgreSQL 错误码 23505 表示唯一性冲突
     * - 返回 409 Conflict 状态码
     */
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 更新分类
 *
 * 【功能】修改分类信息
 * 【请求】PUT /api/categories/:id
 * 【权限】仅管理员
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    /**
     * 动态构建更新语句
     *
     * 【知识点】
     * - 只更新提供的字段
     * - 使用计数器生成参数占位符
     */
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    // 没有要更新的字段
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // 添加分类 ID
    values.push(id);

    // 执行更新
    const result = await pool.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, description, created_at`,
      values
    );

    // 分类不存在
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = result.rows[0];

    // 返回更新后的分类
    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at,
    });
  } catch (error) {
    console.error('Update category error:', error);

    // 处理唯一性约束错误
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 删除分类
 *
 * 【功能】删除指定分类
 * 【请求】DELETE /api/categories/:id
 * 【权限】仅管理员
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    /**
     * 删除分类
     *
     * 【知识点】
     * - RETURNING 返回被删除的数据
     * - 外键 ON DELETE SET NULL 会自动处理关联文章
     */
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    // 分类不存在
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // 返回成功消息
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 导出控制器函数
module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
