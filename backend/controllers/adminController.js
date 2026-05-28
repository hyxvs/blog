const pool = require('../config/pool');

const getAdminStats = async (req, res) => {
  try {
    const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const articleCountResult = await pool.query('SELECT COUNT(*) as count FROM articles');
    const tagCountResult = await pool.query('SELECT COUNT(*) as count FROM tags');
    const commentCountResult = await pool.query('SELECT COUNT(*) as count FROM comments');

    res.json({
      userCount: userCountResult.rows[0].count,
      articleCount: articleCountResult.rows[0].count,
      tagCount: tagCountResult.rows[0].count,
      commentCount: commentCountResult.rows[0].count
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const activitiesResult = await pool.query(`
      SELECT * FROM activities 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    res.json({ activities: activitiesResult.rows });
  } catch (error) {
    console.error('获取最近活动失败:', error);
    res.status(500).json({ error: '获取最近活动失败' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, username, email, role } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.*, COUNT(a.id) as article_count 
      FROM users u 
      LEFT JOIN articles a ON u.id = a.author_id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (username) {
      query += ` AND u.username LIKE $${paramIndex}`;
      params.push(`%${username}%`);
      paramIndex++;
    }

    if (email) {
      query += ` AND u.email LIKE $${paramIndex}`;
      params.push(`%${email}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const usersResult = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (username) {
      countQuery += ` AND u.username LIKE $${countParamIndex}`;
      countParams.push(`%${username}%`);
      countParamIndex++;
    }

    if (email) {
      countQuery += ` AND u.email LIKE $${countParamIndex}`;
      countParams.push(`%${email}%`);
      countParamIndex++;
    }

    if (role) {
      countQuery += ` AND u.role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: usersResult.rows.map(user => ({
        ...user,
        articleCount: user.article_count
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].total
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);

    res.json({ message: '角色更新成功' });
  } catch (error) {
    console.error('更新用户角色失败:', error);
    res.status(500).json({ error: '更新用户角色失败' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
};

const getAdminArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, title, author, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, u.username as author_name, u.avatar as author_avatar, c.name as category_name 
      FROM articles a 
      LEFT JOIN users u ON a.author_id = u.id 
      LEFT JOIN categories c ON a.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (title) {
      query += ` AND a.title LIKE $${paramIndex}`;
      params.push(`%${title}%`);
      paramIndex++;
    }

    if (author) {
      query += ` AND u.username LIKE $${paramIndex}`;
      params.push(`%${author}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const articlesResult = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM articles a 
      LEFT JOIN users u ON a.author_id = u.id 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (title) {
      countQuery += ` AND a.title LIKE $${countParamIndex}`;
      countParams.push(`%${title}%`);
      countParamIndex++;
    }

    if (author) {
      countQuery += ` AND u.username LIKE $${countParamIndex}`;
      countParams.push(`%${author}%`);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND a.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      articles: articlesResult.rows.map(article => ({
        ...article,
        authorName: article.author_name,
        authorAvatar: article.author_avatar,
        categoryName: article.category_name,
        viewCount: article.view_count
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].total
      }
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ error: '获取文章列表失败' });
  }
};

const toggleArticleStatus = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { status } = req.body;

    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    await pool.query('UPDATE articles SET status = $1 WHERE id = $2', [status, articleId]);

    res.json({ message: '状态更新成功' });
  } catch (error) {
    console.error('更新文章状态失败:', error);
    res.status(500).json({ error: '更新文章状态失败' });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { articleId } = req.params;

    await pool.query('DELETE FROM articles WHERE id = $1', [articleId]);

    res.json({ message: '文章删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ error: '删除文章失败' });
  }
};

const getTags = async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, COUNT(at.article_id) as article_count 
      FROM tags t 
      LEFT JOIN article_tags at ON t.id = at.tag_id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (name) {
      query += ` AND t.name LIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }

    query += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const tagsResult = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM tags t 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (name) {
      countQuery += ` AND t.name LIKE $${countParamIndex}`;
      countParams.push(`%${name}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      tags: tagsResult.rows.map(tag => ({
        ...tag,
        articleCount: tag.article_count
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].total
      }
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({ error: '获取标签列表失败' });
  }
};

const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: '标签名不能为空' });
    }

    const result = await pool.query('INSERT INTO tags (name) VALUES ($1)', [name]);

    res.json({ message: '标签创建成功', id: result.insertId });
  } catch (error) {
    console.error('创建标签失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: '标签名已存在' });
    } else {
      res.status(500).json({ error: '创建标签失败' });
    }
  }
};

const updateTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: '标签名不能为空' });
    }

    await pool.query('UPDATE tags SET name = $1 WHERE id = $2', [name, tagId]);

    res.json({ message: '标签更新成功' });
  } catch (error) {
    console.error('更新标签失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: '标签名已存在' });
    } else {
      res.status(500).json({ error: '更新标签失败' });
    }
  }
};

const deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;

    await pool.query('DELETE FROM tags WHERE id = $1', [tagId]);

    res.json({ message: '标签删除成功' });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({ error: '删除标签失败' });
  }
};

const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, COUNT(a.id) as article_count 
      FROM categories c 
      LEFT JOIN articles a ON c.id = a.category_id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (name) {
      query += ` AND c.name LIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const categoriesResult = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM categories c 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (name) {
      countQuery += ` AND c.name LIKE $${countParamIndex}`;
      countParams.push(`%${name}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      categories: categoriesResult.rows.map(category => ({
        ...category,
        articleCount: category.article_count
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].total
      }
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ error: '获取分类列表失败' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '分类名不能为空' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2)',
      [name, description || null]
    );

    res.json({ message: '分类创建成功', id: result.insertId });
  } catch (error) {
    console.error('创建分类失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: '分类名已存在' });
    } else {
      res.status(500).json({ error: '创建分类失败' });
    }
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '分类名不能为空' });
    }

    await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
      [name, description || null, categoryId]
    );

    res.json({ message: '分类更新成功' });
  } catch (error) {
    console.error('更新分类失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: '分类名已存在' });
    } else {
      res.status(500).json({ error: '更新分类失败' });
    }
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);

    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ error: '删除分类失败' });
  }
};

const getCheckinRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, username, date } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.id, c.user_id, u.username, u.avatar, c.checkin_date, c.created_at 
      FROM checkins c 
      JOIN users u ON c.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (username) {
      query += ` AND u.username LIKE $${paramIndex}`;
      params.push(`%${username}%`);
      paramIndex++;
    }

    if (date) {
      query += ` AND c.checkin_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const checkinsResult = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM checkins c 
      JOIN users u ON c.user_id = u.id 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (username) {
      countQuery += ` AND u.username LIKE $${countParamIndex}`;
      countParams.push(`%${username}%`);
      countParamIndex++;
    }

    if (date) {
      countQuery += ` AND c.checkin_date = $${countParamIndex}`;
      countParams.push(date);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      checkins: checkinsResult.rows.map(checkin => ({
        id: checkin.id,
        userId: checkin.user_id,
        username: checkin.username,
        avatar: checkin.avatar,
        checkinDate: checkin.checkin_date,
        createdAt: checkin.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].total
      }
    });
  } catch (error) {
    console.error('获取签到记录失败:', error);
    res.status(500).json({ error: '获取签到记录失败' });
  }
};

module.exports = {
  getAdminStats,
  getRecentActivities,
  getUsers,
  updateUserRole,
  deleteUser,
  getAdminArticles,
  toggleArticleStatus,
  deleteArticle,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCheckinRecords
};
