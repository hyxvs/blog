/**
 * middleware/auth.js - 认证与授权中间件
 *
 * 【核心知识点】
 *
 * 1. 认证 (Authentication) vs 授权 (Authorization)
 *
 *    【认证 - Authentication】
 *    - 验证"你是谁"
 *    - 确认用户身份的真实性
 *    - 常见方式：密码、Token、指纹、人脸识别
 *    - 英文记忆：Auth"entication" 中的 "ent" = identity（身份）
 *
 *    【授权 - Authorization】
 *    - 验证"你能做什么"
 *    - 确认用户是否有权限执行某操作
 *    - 常见方式：角色权限(RBAC)、资源权限
 *    - 英文记忆：Auth"orization" 中的 "or" = operation（操作）
 *
 * 2. JWT (JSON Web Token) 认证机制
 *
 *    【结构】
 *    JWT 由三部分组成，用点号分隔：
 *    header.payload.signature
 *
 *    - Header（头部）：包含算法类型和令牌类型
 *      { "alg": "HS256", "typ": "JWT" }
 *
 *    - Payload（载荷）：包含声明（claims）
 *      { "userId": 1, "role": "admin", "iat": 1234567890 }
 *
 *    - Signature（签名）：验证令牌真实性
 *      HMACSHA256(base64Url(header) + "." + base64Url(payload), secret)
 *
 *    【工作流程】
 *    1. 用户登录成功，服务器生成 JWT 返回给客户端
 *    2. 客户端存储 JWT（通常 localStorage 或 Cookie）
 *    3. 后续请求在 Authorization 头中携带 JWT
 *    4. 服务器验证 JWT 签名和有效期
 *    5. 验证通过，处理请求；验证失败，返回 401/403
 *
 *    【优点】
 *    - 无状态：服务器不需要存储会话信息
 *    - 跨域友好：天然支持分布式系统
 *    - 自包含：Token 中包含必要信息
 *
 *    【缺点】
 *    - 无法主动失效（除非维护黑名单）
 *    - Token 较大，增加传输开销
 *    - Payload 可解码，不能存放敏感信息
 *
 * 3. HTTP Authorization 头
 *
 *    【格式】
 *    Authorization: <type> <credentials>
 *
 *    【常见类型】
 *    - Basic: Base64(username:password)
 *    - Bearer: 用于 Token 认证，如 JWT
 *    - Digest: 挑战-响应机制，更安全
 *
 *    【Bearer Token 格式】
 *    Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *
 * 4. HTTP 状态码
 *
 *    401 Unauthorized（未认证）
 *    - 请求需要用户身份验证
 *    - 客户端应重新提供凭证
 *
 *    403 Forbidden（禁止访问）
 *    - 服务器理解请求，但拒绝执行
 *    - 通常因为权限不足
 *    - 即使提供正确凭证也无法访问
 *
 * 5. Express 中间件模式
 *
 *    【函数签名】
 *    (req, res, next) => { ... }
 *
 *    【参数说明】
 *    - req: Request 对象，包含请求信息
 *    - res: Response 对象，用于发送响应
 *    - next: 函数，调用后执行下一个中间件
 *
 *    【执行流程】
 *    - 中间件按代码顺序执行
 *    - 必须调用 next() 才会进入下一个中间件
 *    - 如果发送响应，通常不调用 next()
 *
 * 6. 闭包 (Closure) 在授权中的应用
 *
 *    - authorizeRole 返回一个中间件函数
 *    - 返回的函数可以访问外部函数的 roles 参数
 *    - 实现参数化的中间件
 */

// 导入 JWT 工具函数
// verifyToken 用于验证 JWT 的有效性
const { verifyToken } = require('../utils/auth');

/**
 * Token 认证中间件
 *
 * 【功能】
 * - 从请求头中提取 JWT Token
 * - 验证 Token 的有效性和过期时间
 * - 将解码后的用户信息挂载到 req 对象
 *
 * 【使用位置】
 * - 需要登录才能访问的接口
 * - 如：个人资料、发布文章、发表评论等
 */
const authenticateToken = (req, res, next) => {
  /**
   * 获取 Authorization 头
   *
   * 【知识点】
   * - req.headers 包含所有请求头（小写）
   * - Authorization 头通常格式："Bearer <token>"
   */
  const authHeader = req.headers['authorization'];

  /**
   * 提取 Token
   *
   * 【知识点】
   * - authHeader && ... 是短路求值，避免 null 报错
   * - split(' ') 将字符串按空格分割成数组
   * - [1] 获取数组第二个元素（Token 部分）
   *
   * 【示例】
   * "Bearer eyJhbGci..." → ["Bearer", "eyJhbGci..."] → "eyJhbGci..."
   */
  const token = authHeader && authHeader.split(' ')[1];

  /**
   * 检查 Token 是否存在
   *
   * 【知识点】
   * - 如果没有 Token，说明请求未携带凭证
   * - 返回 401 状态码，提示需要认证
   * - return 阻止后续代码执行
   */
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  /**
   * 验证 Token
   *
   * 【知识点】
   * - verifyToken 内部使用 jwt.verify() 验证签名和过期时间
   * - 验证成功返回解码后的 payload
   * - 验证失败（过期、签名错误）返回 null
   */
  const decoded = verifyToken(token);

  /**
   * 检查验证结果
   *
   * 【知识点】
   * - 403 表示服务器拒绝访问，即使提供了凭证
   * - 可能是因为 Token 过期或被篡改
   */
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  /**
   * 将用户信息挂载到请求对象
   *
   * 【知识点】
   * - Express 允许动态扩展 req 对象
     * - 后续中间件和路由处理器可以通过 req.userId 获取用户 ID
   * - 这是传递认证信息的常用方式
   */
  req.userId = decoded.userId;
  req.userRole = decoded.role;

  /**
   * 调用 next() 进入下一个中间件
   *
   * 【知识点】
   * - 必须调用 next()，否则请求会挂起
   * - 如果认证通过，继续执行后续处理
   */
  next();
};

const attachUserIfPresent = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const decoded = verifyToken(token);
  if (decoded) {
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  }

  next();
};

/**
 * 角色授权中间件（工厂函数）
 *
 * 【功能】
 * - 根据用户角色判断是否允许访问
 * - 使用闭包实现参数化中间件
 *
 * 【使用方式】
 * router.post('/', authenticateToken, authorizeRole('admin'), createCategory);
 *
 * 【知识点】
 * - ...roles 是剩余参数语法，接收任意数量的参数
 * - 返回一个 Express 中间件函数
 * - 形成闭包，内部函数可以访问外部函数的 roles
 */
const authorizeRole = (...roles) => {
  /**
   * 返回的中间件函数
   *
   * 【知识点】
   * - 这是一个标准的 Express 中间件
   * - req.userRole 由 authenticateToken 中间件设置
   * - 必须先使用 authenticateToken，否则 req.userRole 为 undefined
   */
  return (req, res, next) => {
    /**
     * 检查用户角色是否在允许列表中
     *
     * 【知识点】
     * - Array.includes() 检查数组是否包含某元素
     * - 如果不包含，说明权限不足
     */
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // 权限检查通过，继续执行
    next();
  };
};

/**
 * 资源所有者或管理员授权中间件
 *
 * 【功能】
 * - 允许资源所有者或管理员访问资源
 * - 常用于编辑/删除自己的内容
 *
 * 【使用场景】
 * - 用户只能编辑自己的文章
 * - 但管理员可以编辑任何人的文章
 *
 * 【注意】
 * - 这个函数返回中间件，需要进一步封装才能在路由中使用
 * - 实际使用中通常结合数据库查询获取 resourceUserId
 */
const authorizeOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    /**
     * 权限检查逻辑
     *
     * 【知识点】
     * - 管理员角色拥有所有权限
     * - 普通用户只能操作自己的资源
     * - 通过比较 req.userId（当前用户）和 resourceUserId（资源所有者）判断
     */
    if (req.userRole === 'admin' || req.userId === resourceUserId) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  };
};

/**
 * 导出中间件函数
 *
 * 【知识点】
 * - 使用对象简写语法导出多个函数
 * - 其他文件通过解构赋值导入需要的中间件
 */
module.exports = {
  authenticateToken,
  attachUserIfPresent,
  authorizeRole,
  authorizeOwnerOrAdmin,
};
