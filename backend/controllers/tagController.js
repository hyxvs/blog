/**
 * controllers/tagController.js - 标签控制器
 *
 * 【核心知识点】
 *
 * 1. 标签与分类的区别
 *
 *    【分类】
 *    - 层级结构
 *    - 一篇文章属于一个分类
 *    - 用于宏观组织
 *
 *    【标签】
 *    - 扁平结构
 *    - 一篇文章可以有多个标签
 *    - 用于微观描述
 *
 * 2. 多对多关系的统计
 *
 *    【关联表查询】
 *    - 通过 article_tags 关联表统计
 *    - 使用子查询获取每个标签的文章数量
 *
 * 3. 简单 CRUD 模式
 *
 *    与分类控制器类似，实现标准的增删改查操作
 *    - 列表查询（带统计）
 *    - 单条查询
 *    - 创建（处理唯一性约束）
 *    - 更新（动态构建语句）
 *    - 删除
 */

// 导入数据库连接池
const pool = require('../config/pool');

/**
 * 获取标签列表
 *
 * 【功能】获取所有标签及其文章数量
 * 【请求】GET /api/tags
 */
const getTags = async (req, res) => {
  try {
    /**
     * 查询标签及文章数量
     *
     * 【知识点】
     * - 通过 article_tags 关联表统计
     * - 按名称字母顺序排序
     */
    const result = await pool.query(
      `SELECT 
        t.id, t.name, t.created_at,
        COUNT(at.tag_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      GROUP BY t.id, t.name, t.created_at
      ORDER BY t.name ASC`
    );

    // 格式化响应数据
    res.json({
      tags: result.rows.map(tag => ({
        id: tag.id,
        name: tag.name,
        articleCount: parseInt(tag.article_count),
        createdAt: tag.created_at,
      })),
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取单个标签
 *
 * 【功能】获取指定标签的详细信息
 * 【请求】GET /api/tags/:id
 */
const getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询标签详情
    const result = await pool.query(
      `SELECT 
        t.id, t.name, t.created_at,
        (SELECT COUNT(*) FROM article_tags WHERE tag_id = t.id) as article_count
      FROM tags t
      WHERE t.id = $1`,
      [id]
    );

    // 标签不存在
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const tag = result.rows[0];

    // 返回标签信息
    res.json({
      id: tag.id,
      name: tag.name,
      articleCount: parseInt(tag.article_count),
      createdAt: tag.created_at,
    });
  } catch (error) {
    console.error('Get tag by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 创建标签
 *
 * 【功能】创建新标签
 * 【请求】POST /api/tags
 * 【权限】仅管理员
 */
const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    // 参数验证
    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // 插入标签数据
    const result = await pool.query(
      'INSERT INTO tags (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );

    const tag = result.rows[0];

    // 返回创建的标签
    res.status(201).json({
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
    });
  } catch (error) {
    console.error('Create tag error:', error);

    // 处理唯一性约束错误
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Tag name already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 更新标签
 *
 * 【功能】修改标签名称
 * 【请求】PUT /api/tags/:id
 * 【权限】仅管理员
 */
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // 参数验证
    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // 执行更新
    const result = await pool.query(
      'UPDATE tags SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
      [name, id]
    );

    // 标签不存在
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const tag = result.rows[0];

    // 返回更新后的标签
    res.json({
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
    });
  } catch (error) {
    console.error('Update tag error:', error);

    // 处理唯一性约束错误
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Tag name already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 删除标签
 *
 * 【功能】删除指定标签
 * 【请求】DELETE /api/tags/:id
 * 【权限】仅管理员
 */
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    /**
     * 删除标签
     *
     * 【知识点】
     * - 关联表中的记录会通过外键 CASCADE 自动删除
     * - 不需要手动删除 article_tags 中的记录
     */
    const result = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);

    // 标签不存在
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // 返回成功消息
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 导出控制器函数
module.exports = {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
};
