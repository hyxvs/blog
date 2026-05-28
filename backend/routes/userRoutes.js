/**
 * routes/userRoutes.js - 用户路由模块
 *
 * 【核心知识点】
 *
 * 1. Express Router（路由模块）
 *
 *    【概念】
 *    - Router 是 Express 提供的迷你应用实例
 *    - 可以像主应用(app)一样定义路由和中间件
 *    - 用于将路由逻辑拆分到不同文件
 *
 *    【优点】
 *    - 模块化：每个资源一个路由文件
 *    - 可维护：路由逻辑清晰分离
 *    - 可复用：Router 可以挂载到不同路径
 *
 *    【创建方式】
 *    const router = express.Router();
 *
 * 2. RESTful API 设计原则
 *
 *    【资源导向】
 *    - 使用名词表示资源，而非动词
 *    - 正确：/users, /articles
 *    - 错误：/getUsers, /createArticle
 *
 *    【HTTP 方法表示操作】
 *    - GET：读取资源
 *    - POST：创建资源
 *    - PUT：更新资源（完整替换）
 *    - PATCH：部分更新
 *    - DELETE：删除资源
 *
 *    【状态码】
 *    - 200 OK：成功
 *    - 201 Created：创建成功
 *    - 400 Bad Request：请求参数错误
 *    - 401 Unauthorized：未认证
 *    - 403 Forbidden：无权限
 *    - 404 Not Found：资源不存在
 *    - 500 Internal Server Error：服务器错误
 *
 * 3. 认证中间件的应用
 *
 *    【使用方式】
 *    router.get('/profile', authenticateToken, userController.getProfile);
 *
 *    【执行顺序】
 *    1. 请求到达 /profile
 *    2. authenticateToken 中间件执行
 *    3. 认证通过，调用 next()
 *    4. userController.getProfile 执行
 *    5. 认证失败，直接返回错误响应
 *
 *    【为什么需要认证】
 *    - 保护用户隐私数据
 *    - 防止未授权访问
 *    - 追踪操作者身份
 *
 * 4. 路由路径设计
 *
 *    【用户相关路径】
 *    POST   /register     - 注册（公开）
 *    POST   /login        - 登录（公开）
 *    GET    /profile      - 获取个人资料（需登录）
 *    PUT    /profile      - 更新个人资料（需登录）
 *    PUT    /password     - 修改密码（需登录）
 *
 *    【注意】
 *    - 路径相对于路由挂载点
 *    - app.js 中挂载为 /api/users
 *    - 所以完整路径是 /api/users/register
 */

// 导入 Express 框架
const express = require('express');

/**
 * 创建路由实例
 *
 * 【知识点】
 * - express.Router() 创建新的路由对象
 * - 可以像 app 一样使用 .get(), .post() 等方法
 * - 最终通过 module.exports 导出
 */
const router = express.Router();

// 导入用户控制器
// 控制器包含处理请求的具体逻辑
const userController = require('../controllers/userController');

// 导入认证中间件
// authenticateToken 用于验证用户是否已登录
// authorizeRole 用于验证用户角色权限
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// 导入文件上传配置
const upload = require('../config/multer');

/**
 * 用户注册路由
 *
 * 【路径】POST /api/users/register
 * 【权限】公开，无需登录
 * 【功能】创建新用户账号
 * 【请求体】{ username, email, password }
 */
router.post('/register', userController.register);

/**
 * 用户登录路由（密码方式）
 *
 * 【路径】POST /api/users/login
 * 【权限】公开，无需登录
 * 【功能】验证用户身份，返回 JWT Token
 * 【请求体】{ username, password }
 * 【响应】{ user, token }
 */
router.post('/login', userController.login);

/**
 * 用户登录路由（验证码方式）
 *
 * 【路径】POST /api/users/login/code
 * 【权限】公开，无需登录
 * 【功能】使用邮箱验证码登录，返回 JWT Token
 * 【请求体】{ email, code }
 * 【响应】{ user, token }
 */
router.post('/login/code', userController.loginWithCode);

/**
 * 获取个人资料路由
 *
 * 【路径】GET /api/users/profile
 * 【权限】需登录（authenticateToken）
 * 【功能】获取当前登录用户的详细信息
 * 【认证】从 Token 中解析用户 ID
 */
router.get('/profile', authenticateToken, userController.getProfile);

/**
 * 更新个人资料路由
 *
 * 【路径】PUT /api/users/profile
 * 【权限】需登录
 * 【功能】修改用户名、邮箱、头像等信息
 * 【请求体】{ username?, email?, avatar? }
 */
router.put('/profile', authenticateToken, userController.updateProfile);

/**
 * 修改密码路由
 *
 * 【路径】PUT /api/users/password
 * 【权限】需登录
 * 【功能】修改用户密码
 * 【请求体】{ currentPassword, newPassword }
 * 【安全】需要验证当前密码
 */
router.put('/password', authenticateToken, userController.changePassword);

/**
 * 获取所有用户列表（管理员功能）
 *
 * 【路径】GET /api/users
 * 【权限】需登录且需管理员权限
 * 【功能】获取系统中所有用户的信息
 */
router.get('/', authenticateToken, authorizeRole('admin'), userController.getAllUsers);

/**
 * 删除用户（管理员功能）
 *
 * 【路径】DELETE /api/users/:id
 * 【权限】需登录且需管理员权限
 * 【功能】删除指定用户
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), userController.deleteUser);

/**
 * 更新用户角色（管理员功能）
 *
 * 【路径】PUT /api/users/:id/role
 * 【权限】需登录且需管理员权限
 * 【功能】修改用户的角色（user/admin）
 * 【请求体】{ role }
 */
router.put('/:id/role', authenticateToken, authorizeRole('admin'), userController.updateUserRole);

/**
 * 用户签到
 *
 * 【路径】POST /api/users/checkin
 * 【权限】需登录
 * 【功能】用户每日签到
 */
router.post('/checkin', authenticateToken, userController.checkin);

/**
 * 获取签到历史
 *
 * 【路径】GET /api/users/checkin/history
 * 【权限】需登录
 * 【功能】获取用户的签到历史记录
 */
router.get('/checkin/history', authenticateToken, userController.getCheckinHistory);

/**
 * 获取用户统计
 *
 * 【路径】GET /api/users/stats
 * 【权限】需登录
 * 【功能】获取用户的统计数据（文章数、阅读量、点赞数等）
 */
router.get('/stats', authenticateToken, userController.getUserStats);

/**
 * 获取用户活动
 *
 * 【路径】GET /api/users/activities
 * 【权限】需登录
 * 【功能】获取用户的活动记录
 */
router.get('/activities', authenticateToken, userController.getActivities);

/**
 * 上传头像
 *
 * 【路径】POST /api/users/avatar
 * 【权限】需登录
 * 【功能】上传用户头像
 * 【请求体】multipart/form-data, 包含 avatar 文件
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), userController.uploadAvatar);

/**
 * 获取推荐用户
 *
 * 【路径】GET /api/users/recommendations
 * 【权限】需登录
 * 【功能】获取推荐关注的用户列表
 */
router.get('/recommendations', authenticateToken, userController.getRecommendedUsers);

/**
 * 获取最近发布的文章
 *
 * 【路径】GET /api/users/articles
 * 【权限】需登录
 * 【功能】获取用户最近发布的文章列表
 */
router.get('/articles', authenticateToken, userController.getRecentArticles);

/**
 * 关注用户
 *
 * 【路径】POST /api/users/follow/:userId
 * 【权限】需登录
 * 【功能】关注指定用户
 */
router.post('/follow/:userId', authenticateToken, userController.followUser);

/**
 * 取消关注用户
 *
 * 【路径】DELETE /api/users/follow/:userId
 * 【权限】需登录
 * 【功能】取消关注指定用户
 */
router.delete('/follow/:userId', authenticateToken, userController.unfollowUser);

/**
 * 用户签到
 *
 * 【路径】POST /api/users/sign
 * 【权限】需登录
 * 【功能】用户每日签到
 */
router.post('/sign', authenticateToken, userController.signIn);

/**
 * 获取用户签到状态
 *
 * 【路径】GET /api/users/sign/status
 * 【权限】需登录
 * 【功能】获取用户签到状态、连续签到天数和总签到次数
 */
router.get('/sign/status', authenticateToken, userController.getSignStatus);

/**
 * 获取用户通知
 *
 * 【路径】GET /api/users/notifications
 * 【权限】需登录
 * 【功能】获取用户的通知列表
 */
router.get('/notifications', authenticateToken, userController.getNotifications);

/**
 * 标记通知为已读
 *
 * 【路径】POST /api/users/notifications/:id/read
 * 【权限】需登录
 * 【功能】将指定通知标记为已读
 */
router.post('/notifications/:id/read', authenticateToken, userController.markNotificationAsRead);

/**
 * 获取关注列表
 *
 * 【路径】GET /api/users/following
 * 【权限】需登录
 * 【功能】获取用户关注的用户列表
 */
router.get('/following', authenticateToken, userController.getFollowingList);

/**
 * 获取粉丝列表
 *
 * 【路径】GET /api/users/followers
 * 【权限】需登录
 * 【功能】获取关注当前用户的用户列表
 */
router.get('/followers', authenticateToken, userController.getFollowersList);

/**
 * 导出路由模块
 *
 * 【知识点】
 * - 导出 router 供 app.js 使用
 * - app.js 中通过 app.use('/api/users', userRoutes) 挂载
 * - 实现路由模块化，提高代码可维护性
 */
module.exports = router;
