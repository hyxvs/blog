/**
 * controllers/userController.js - 用户控制器
 *
 * 【核心知识点】
 *
 * 1. MVC 架构模式
 *
 *    【概念】
 *    - Model（模型）：数据层，与数据库交互
 *    - View（视图）：展示层，本项目中是前端 Vue 应用
 *    - Controller（控制器）：业务逻辑层，处理请求和响应
 *
 *    【控制器职责】
 *    - 接收请求参数
 *    - 调用模型进行数据操作
 *    - 处理业务逻辑
 *    - 返回响应结果
 *    - 错误处理
 *
 * 2. 异步函数与错误处理
 *
 *    【async/await】
 *    - 处理异步操作（数据库查询）
 *    - 代码可读性接近同步代码
 *    - 需要 try-catch 捕获错误
 *
 *    【错误处理模式】
 *    try {
 *      // 业务逻辑
 *    } catch (error) {
 *      // 记录错误日志
 *      // 返回错误响应
 *    }
 *
 * 3. PostgreSQL 参数化查询
 *
 *    【语法】
 *    - 使用 $1, $2, $3... 作为参数占位符
 *    - 参数数组作为第二个参数传入
 *    - 示例：pool.query('SELECT * FROM users WHERE id = $1', [userId])
 *
 *    【优点】
 *    - 防止 SQL 注入攻击
 *    - 自动处理数据类型转换
 *    - 提高查询性能（预编译）
 *
 * 4. HTTP 状态码使用
 *
 *    200 OK - 请求成功
 *    201 Created - 资源创建成功
 *    400 Bad Request - 请求参数错误
 *    401 Unauthorized - 未认证
 *    403 Forbidden - 无权限
 *    404 Not Found - 资源不存在
 *    409 Conflict - 资源冲突（如重复）
 *    500 Internal Server Error - 服务器内部错误
 *
 * 5. 密码安全
 *
 *    【绝不存储明文密码】
 *    - 使用 bcrypt 哈希存储
 *    - 哈希是单向的，无法反推
 *    - 即使数据库泄露，密码也相对安全
 *
 *    【登录验证】
 *    - 比较哈希值而非明文
 *    - bcrypt.compare() 自动提取盐值比较
 *
 * 6. JWT 认证流程
 *
 *    【注册】
 *    1. 验证输入数据
 *    2. 检查用户名/邮箱是否已存在
 *    3. 哈希密码
 *    4. 插入用户数据
 *    5. 生成 JWT
 *    6. 返回用户信息和 Token
 *
 *    【登录】
 *    1. 验证输入数据
 *    2. 查询用户信息
 *    3. 比较密码
 *    4. 生成 JWT
 *    5. 返回用户信息和 Token
 */

// 导入数据库连接池
const pool = require('../config/pool');

// 导入认证工具函数
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

// 导入邮件发送工具
const { sendVerificationCode } = require('../utils/email');

/**
 * 用户注册
 *
 * 【功能】创建新用户账号
 * 【请求】POST /api/users/register
 * 【请求体】{ username, email, password }
 */
const register = async (req, res) => {
  try {
    // 从请求体中解构获取注册信息
    const { username, email, password } = req.body;

    /**
     * 参数验证
     *
     * 【知识点】
     * - 服务器端必须验证输入，不能依赖前端
     * - 防止恶意请求和脏数据
     * - 400 状态码表示客户端请求错误
     */
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    /**
     * 检查用户名或邮箱是否已存在
     *
     * 【知识点】
     * - 使用 OR 条件查询
     * - $1, $2 是参数占位符，防止 SQL 注入
     * - 提前返回避免重复注册
     */
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      // 409 Conflict 表示资源冲突
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    /**
     * 密码哈希
     *
     * 【知识点】
     * - 绝不存储明文密码
     * - bcrypt 自动加盐和哈希
     * - 异步操作，使用 await
     */
    const hashedPassword = await hashPassword(password);

    /**
     * 插入用户数据
     *
     * 【知识点】
     * - RETURNING 子句返回插入的数据
     * - 避免再次查询获取新用户数据
     * - 只返回必要字段，不包含密码
     */
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    /**
     * 生成 JWT
     *
     * 【知识点】
     * - 用户注册后自动登录
     * - Token 包含用户 ID 和角色
     * - 用于后续请求的认证
     */
    const token = generateToken(user.id, user.role);

    /**
     * 返回响应
     *
     * 【知识点】
     * - 201 Created 表示资源创建成功
     * - 返回用户信息和 Token
     * - 前端存储 Token 用于后续请求
     */
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    // 记录错误日志，便于排查问题
    console.error('Register error:', error);
    // 返回通用错误信息，不暴露内部细节
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 用户登录（密码方式）
 *
 * 【功能】验证用户身份并返回 Token
 * 【请求】POST /api/users/login
 * 【请求体】{ username, password }
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    /**
     * 查询用户信息
     *
     * 【知识点】
     * - 需要获取密码用于验证
     * - 同时获取其他用户信息
     * - 使用 LIMIT 1 优化查询
     */
    const result = await pool.query(
      'SELECT id, username, email, password, role, created_at FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    // 用户不存在
    if (result.rows.length === 0) {
      // 使用通用错误信息，防止用户名枚举攻击
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    /**
     * 密码验证
     *
     * 【知识点】
     * - 比较输入密码和存储的哈希值
     * - bcrypt.compare 内部提取盐值重新哈希比较
     * - 时间恒定比较，防止时序攻击
     */
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // 生成 JWT
    const token = generateToken(user.id, user.role);

    // 返回用户信息和 Token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: new Date().toISOString(),
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 用户登录（验证码方式）
 *
 * 【功能】使用邮箱验证码登录
 * 【请求】POST /api/users/login/code
 * 【请求体】{ email, code }
 */
const loginWithCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // 参数验证
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // 查询验证码
    const codeResult = await pool.query(
      'SELECT * FROM verification_codes WHERE email = $1 AND type = $2 AND code = $3 AND used = false AND expires_at > CURRENT_TIMESTAMP',
      [email, 'login', code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: '验证码无效或已过期' });
    }

    // 查询用户
    const userResult = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = userResult.rows[0];

    // 标记验证码为已使用
    await pool.query(
      'UPDATE verification_codes SET used = true WHERE id = $1',
      [codeResult.rows[0].id]
    );

    // 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // 生成 JWT
    const token = generateToken(user.id, user.role);

    // 返回用户信息和 Token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: new Date().toISOString(),
      },
      token,
    });
  } catch (error) {
    console.error('Login with code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取个人资料
 *
 * 【功能】获取当前登录用户的详细信息
 * 【请求】GET /api/users/profile
 * 【认证】需要 Token
 */
const getProfile = async (req, res) => {
  try {
    /**
     * 查询用户信息
     *
     * 【知识点】
     * - req.userId 由认证中间件设置
     * - 从 Token 中解析得到
     * - 不返回密码字段
     */
    const result = await pool.query(
      'SELECT id, username, email, avatar, bio, role, created_at, last_login FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // 返回用户信息
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 更新个人资料
 *
 * 【功能】修改用户信息（用户名、邮箱、头像）
 * 【请求】PUT /api/users/profile
 * 【认证】需要 Token
 */
const updateProfile = async (req, res) => {
  try {
    const { username, email, bio } = req.body;

    /**
     * 动态构建更新语句
     *
     * 【知识点】
     * - 只更新提供的字段
     * - 使用数组存储更新字段和值
     * - 动态构建 SQL 语句
     */
    const updates = [];
    const values = [];
    let paramCount = 1;

    // 如果提供了用户名，加入更新列表
    if (username) {
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    // 如果提供了邮箱，加入更新列表
    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    // 如果提供了个人签名，加入更新列表
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }





    // 如果没有要更新的字段
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // 添加用户 ID 作为 WHERE 条件
    values.push(req.userId);

    /**
     * 执行更新
     *
     * 【知识点】
     * - 使用 join 连接多个更新字段
     * - RETURNING 返回更新后的数据
     */
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, avatar, bio, role, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // 返回更新后的用户信息
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 修改密码
 *
 * 【功能】修改用户密码
 * 【请求】PUT /api/users/password
 * 【认证】需要 Token
 * 【请求体】{ oldPassword, newPassword }
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 参数验证
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    // 查询当前密码哈希
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 验证旧密码
    const isValidPassword = await comparePassword(oldPassword, result.rows[0].password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    // 哈希新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.userId]
    );

    // 返回成功消息
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取所有用户列表（管理员功能）
 *
 * 【功能】获取系统中所有用户的信息
 * 【请求】GET /api/users
 * 【认证】需要 Token 且需要管理员权限
 * 【响应】用户列表，不包含密码字段
 */
const getAllUsers = async (req, res) => {
  try {
    // 查询所有用户，排除密码字段
    const result = await pool.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    // 格式化用户数据
    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 删除用户（管理员功能）
 *
 * 【功能】删除指定用户
 * 【请求】DELETE /api/users/:id
 * 【认证】需要 Token 且需要管理员权限
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 不能删除自己
    if (parseInt(id) === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // 删除用户
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 更新用户角色（管理员功能）
 *
 * 【功能】修改用户的角色（user/admin）
 * 【请求】PUT /api/users/:id/role
 * 【认证】需要 Token 且需要管理员权限
 * 【请求体】{ role }
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // 验证角色值
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role value' });
    }

    // 检查用户是否存在
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 更新用户角色
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 用户签到
 *
 * 【功能】用户每日签到
 * 【请求】POST /api/users/checkin
 * 【认证】需要 Token
 */
const checkin = async (req, res) => {
  try {
    // 获取当前日期（yyyy-mm-dd）
    const today = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已经签到
    const existingCheckin = await pool.query(
      'SELECT id FROM checkins WHERE user_id = $1 AND checkin_date = $2',
      [req.userId, today]
    );
    
    if (existingCheckin.rows.length > 0) {
      return res.json({
        success: true,
        message: '今天已经签到过了',
        todayChecked: true
      });
    }
    
    // 插入签到记录
    await pool.query(
      'INSERT INTO checkins (user_id, checkin_date) VALUES ($1, $2)',
      [req.userId, today]
    );
    
    // 计算连续签到天数
    let consecutiveDays = 1;
    let checkDate = new Date();
    
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const prevCheckin = await pool.query(
        'SELECT id FROM checkins WHERE user_id = $1 AND checkin_date = $2',
        [req.userId, checkDateStr]
      );
      
      if (prevCheckin.rows.length === 0) {
        break;
      }
      
      consecutiveDays++;
    }
    
    // 计算总签到次数
    const totalCheckinsResult = await pool.query(
      'SELECT COUNT(*) as count FROM checkins WHERE user_id = $1',
      [req.userId]
    );
    
    const totalCheckins = parseInt(totalCheckinsResult.rows[0].count);
    
    // 记录活动
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, content) VALUES ($1, $2, $3)',
      [req.userId, 'checkin', `于 ${new Date().toLocaleString()} 完成每日签到`]
    );
    
    res.json({
      success: true,
      message: '签到成功',
      todayChecked: true,
      consecutiveDays: consecutiveDays,
      totalCheckins: totalCheckins
    });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取签到历史
 *
 * 【功能】获取用户的签到历史记录
 * 【请求】GET /api/users/checkin/history
 * 【认证】需要 Token
 */
const getCheckinHistory = async (req, res) => {
  try {
    // 查询用户的签到历史
    const result = await pool.query(
      'SELECT id, user_id, checkin_date, created_at FROM checkins WHERE user_id = $1 ORDER BY checkin_date DESC LIMIT 30',
      [req.userId]
    );

    const checkins = result.rows.map(checkin => ({
      id: checkin.id,
      userId: checkin.user_id,
      checkinDate: checkin.checkin_date,
      createdAt: checkin.created_at
    }));

    res.json({
      success: true,
      data: checkins
    });
  } catch (error) {
    console.error('Get checkin history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取用户统计
 *
 * 【功能】获取用户的统计数据（文章数、阅读量、点赞数等）
 * 【请求】GET /api/users/stats
 * 【认证】需要 Token
 */
const getUserStats = async (req, res) => {
  try {
    // 查询用户的文章数
    const articlesResult = await pool.query(
      'SELECT COUNT(*) as count FROM articles WHERE author_id = $1',
      [req.userId]
    );

    // 查询用户的总阅读量
    const viewsResult = await pool.query(
      'SELECT COALESCE(SUM(view_count), 0) as total_views FROM articles WHERE author_id = $1',
      [req.userId]
    );

    // 查询用户的点赞数
    const likesResult = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE user_id = $1',
      [req.userId]
    );

    // 查询用户的粉丝数
    const followersResult = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [req.userId]
    );

    // 查询用户的关注数
    const followingResult = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        articleCount: parseInt(articlesResult.rows[0]?.count || 0),
        viewCount: parseInt(viewsResult.rows[0]?.total_views || 0),
        likeCount: parseInt(likesResult.rows[0]?.count || 0),
        followerCount: parseInt(followersResult.rows[0]?.count || 0),
        followingCount: parseInt(followingResult.rows[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取用户活动
 *
 * 【功能】获取用户的活动记录
 * 【请求】GET /api/users/activities
 * 【认证】需要 Token
 */
const getActivities = async (req, res) => {
  try {
    // 查询用户的活动记录
    const result = await pool.query(
      `SELECT id, user_id, activity_type, content, created_at 
       FROM activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [req.userId]
    );

    const activities = result.rows.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      type: activity.activity_type,
      content: activity.content,
      time: activity.created_at
    }));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取推荐用户
 *
 * 【功能】获取推荐关注的用户列表
 * 【请求】GET /api/users/recommendations
 * 【认证】需要 Token
 */
const getRecommendedUsers = async (req, res) => {
  try {
    // 查询推荐用户（排除自己，随机选择一些用户）
    const result = await pool.query(
      `SELECT id, username, email, avatar, bio, created_at 
       FROM users 
       WHERE id != $1 
       ORDER BY RANDOM() 
       LIMIT 5`,
      [req.userId]
    );

    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio || '这个人很懒，什么都没写',
      createdAt: user.created_at
    }));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get recommended users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取最近发布的文章
 *
 * 【功能】获取用户最近发布的文章列表
 * 【请求】GET /api/users/articles
 * 【认证】需要 Token
 */
const getRecentArticles = async (req, res) => {
  try {
    // 查询用户最近发布的文章
    const result = await pool.query(
      `SELECT id, title, content, created_at as "createdAt", status 
       FROM articles 
       WHERE author_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get recent articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 用户签到
 *
 * 【功能】用户每日签到
 * 【请求】POST /api/users/sign
 * 【认证】需要 Token
 */
const signIn = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已经签到
    const existingSign = await pool.query(
      'SELECT * FROM sign_records WHERE user_id = $1 AND sign_date = $2',
      [userId, today]
    );

    if (existingSign.rows.length > 0) {
      return res.json({
        success: true,
        signed: true,
        message: '今日已签到'
      });
    }

    // 执行签到
    await pool.query(
      'INSERT INTO sign_records (user_id, sign_date) VALUES ($1, $2)',
      [userId, today]
    );

    // 记录活动
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, content) VALUES ($1, $2, $3)',
      [userId, 'checkin', `于 ${new Date().toLocaleString()} 完成每日签到`]
    );

    res.json({
      success: true,
      signed: true,
      message: '签到成功'
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取用户签到信息
 *
 * 【功能】获取用户签到状态、连续签到天数和总签到次数
 * 【请求】GET /api/users/sign/status
 * 【认证】需要 Token
 */
const getSignStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已经签到
    const todaySign = await pool.query(
      'SELECT * FROM sign_records WHERE user_id = $1 AND sign_date = $2',
      [userId, today]
    );

    // 计算连续签到天数
    let consecutiveDays = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const signRecord = await pool.query(
        'SELECT * FROM sign_records WHERE user_id = $1 AND sign_date = $2',
        [userId, dateStr]
      );
      
      if (signRecord.rows.length > 0) {
        consecutiveDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 计算总签到次数
    const totalSigns = await pool.query(
      'SELECT COUNT(*) FROM sign_records WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        todaySigned: todaySign.rows.length > 0,
        consecutiveDays: consecutiveDays,
        totalSigns: parseInt(totalSigns.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get sign status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 上传头像
 *
 * 【功能】上传用户头像
 * 【请求】POST /api/users/avatar
 * 【认证】需要 Token
 * 【请求体】multipart/form-data, 包含 avatar 文件
 */
const uploadAvatar = async (req, res) => {
  try {
    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }
    
    // 构建头像 URL
    // 注意：实际生产环境中，应该使用配置的域名或 CDN 地址
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    // 更新用户头像
    await pool.query(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatarUrl, req.userId]
    );
    
    res.json({
      success: true,
      message: '头像上传成功',
      avatar: avatarUrl
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 关注用户
 *
 * 【功能】关注指定用户
 * 【请求】POST /api/users/follow/:userId
 * 【认证】需要 Token
 */
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    // 不能关注自己
    if (parseInt(userId) === followerId) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    // 检查用户是否存在
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 检查是否已经关注
    const followResult = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (followResult.rows.length > 0) {
      return res.status(400).json({ error: '已经关注该用户' });
    }

    // 创建关注关系
    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, userId]
    );

    // 创建关注通知
    const followerInfo = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [followerId]
    );
    const followerUsername = followerInfo.rows[0].username;

    await pool.query(
      'INSERT INTO notifications (user_id, sender_id, type, content) VALUES ($1, $2, $3, $4)',
      [userId, followerId, 'follow', `${followerUsername} 关注了你`]
    );

    res.json({
      success: true,
      message: '关注成功'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 取消关注用户
 *
 * 【功能】取消关注指定用户
 * 【请求】POST /api/users/unfollow/:userId
 * 【认证】需要 Token
 */
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    // 检查是否已经关注
    const followResult = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (followResult.rows.length === 0) {
      return res.status(400).json({ error: '未关注该用户' });
    }

    // 删除关注关系
    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    res.json({
      success: true,
      message: '取消关注成功'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取用户通知
 *
 * 【功能】获取当前用户的通知列表
 * 【请求】GET /api/users/notifications
 * 【认证】需要 Token
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    // 查询用户的通知，包括发送者信息
    const result = await pool.query(
      `SELECT n.id, n.type, n.content, n.read, n.created_at,
              u.id as sender_id, u.username as sender_username, u.avatar as sender_avatar
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    // 计算未读通知数量
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );

    res.json({
      list: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 标记通知为已读
 *
 * 【功能】将指定通知标记为已读
 * 【请求】POST /api/users/notifications/:id/read
 * 【认证】需要 Token
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 检查通知是否存在且属于当前用户
    const notificationResult = await pool.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ error: '通知不存在' });
    }

    // 标记为已读
    await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1',
      [id]
    );

    res.json({ success: true, message: '通知已标记为已读' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取关注列表
 *
 * 【功能】获取用户关注的用户列表
 * 【请求】GET /api/users/following
 * 【认证】需要 Token
 */
const getFollowingList = async (req, res) => {
  try {
    const userId = req.userId;

    // 查询用户关注的列表
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar, u.bio
       FROM users u
       JOIN follows f ON u.id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get following list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取粉丝列表
 *
 * 【功能】获取关注当前用户的用户列表
 * 【请求】GET /api/users/followers
 * 【认证】需要 Token
 */
const getFollowersList = async (req, res) => {
  try {
    const userId = req.userId;

    // 查询用户的粉丝列表
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar, u.bio
       FROM users u
       JOIN follows f ON u.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get followers list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 导出控制器函数
module.exports = {
  register,
  login,
  loginWithCode,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser,
  updateUserRole,
  checkin,
  getCheckinHistory,
  getUserStats,
  getActivities,
  getRecommendedUsers,
  uploadAvatar,
  getRecentArticles,
  followUser,
  unfollowUser,
  signIn,
  getSignStatus,
  getNotifications,
  markNotificationAsRead,
  getFollowingList,
  getFollowersList
};
