/**
 * utils/auth.js - 认证工具函数
 *
 * 【核心知识点】
 *
 * 1. bcrypt 密码哈希库
 *
 *    【为什么需要哈希？】
 *    - 明文存储密码是严重安全风险
 *    - 数据库泄露会导致所有用户密码暴露
 *    - 哈希是单向函数，无法从哈希值反推原始密码
 *
 *    【bcrypt 特点】
 *    - 基于 Blowfish 加密算法
 *    - 自动加盐（salt），每个密码的盐值不同
 *    - 可配置工作因子（cost factor），控制哈希强度
 *    - 抗彩虹表攻击和暴力破解
 *
 *    【工作因子】
 *    - bcrypt.genSalt(10) 中的 10 是工作因子
 *    - 表示进行 2^10 = 1024 轮哈希计算
 *    - 数值越大越安全，但计算时间越长
 *    - 推荐值：10-12（根据硬件性能调整）
 *
 *    【哈希格式】
 *    $2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqhmM6JGKpS4G3R1G2JH8YpfB0Bqy
 *    - $2b$: bcrypt 版本标识
 *    - $10$: 工作因子
 *    - 接下来 22 字符：盐值（16字节 base64 编码）
 *    - 最后 31 字符：哈希值（24字节 base64 编码）
 *
 * 2. JWT (JSON Web Token) 详解
 *
 *    【jwt.sign() - 生成 Token】
 *    - 参数1：payload（载荷），要编码的数据
 *    - 参数2：secret（密钥），用于签名
 *    - 参数3：options（选项），如过期时间
 *
 *    【jwt.verify() - 验证 Token】
 *    - 验证签名是否正确
 *    - 检查 Token 是否过期
 *    - 返回解码后的 payload
 *    - 验证失败抛出错误
 *
 *    【HS256 算法】
 *    - HMAC + SHA-256
 *    - 对称加密，签名和验证使用相同密钥
 *    - 适合单体应用
 *    - RS256（非对称）适合微服务架构
 *
 * 3. 异步编程模式
 *
 *    【async/await】
 *    - async 函数返回 Promise
 *    - await 暂停执行，等待 Promise 完成
 *    - 代码看起来像同步，但非阻塞
 *
 *    【为什么 bcrypt 需要异步？】
 *    - 哈希计算是 CPU 密集型操作
 *    - 同步方法会阻塞事件循环
 *    - 异步方法允许处理其他请求
 *
 * 4. 错误处理策略
 *
 *    【try-catch 模式】
 *    - 捕获同步和异步错误
 *    - 防止程序崩溃
 *    - 优雅地处理异常情况
 *
 *    【verifyToken 的错误处理】
 *    - 使用 try-catch 包裹 jwt.verify()
 *    - 验证失败返回 null 而不是抛出错误
 *    - 调用者可以通过返回值判断是否成功
 */

// 导入 bcrypt 库用于密码哈希
// bcrypt 是业界标准的密码哈希库
const bcrypt = require('bcrypt');

// 导入 jsonwebtoken 库用于 JWT 操作
// JWT 是无状态认证的行业标准
const jwt = require('jsonwebtoken');

// 导入配置，获取 JWT 密钥和过期时间
const config = require('../config/database');

/**
 * 密码哈希函数
 *
 * 【功能】
 * - 将明文密码转换为安全的哈希值
 * - 自动加盐，防止彩虹表攻击
 *
 * 【参数】
 * - password: 明文密码
 *
 * 【返回】
 * - 哈希后的密码字符串
 *
 * 【使用场景】
 * - 用户注册时存储密码
 * - 用户修改密码时更新密码
 */
const hashPassword = async (password) => {
  /**
   * 生成盐值
   *
   * 【知识点】
   * - genSalt(rounds) 生成随机盐值
   * - rounds 是工作因子，默认 10
   * - 盐值是随机数据，确保相同密码产生不同哈希
   */
  const salt = await bcrypt.genSalt(10);

  /**
   * 执行哈希
   *
   * 【知识点】
   * - hash(password, salt) 使用盐值哈希密码
   * - 返回的字符串包含版本、工作因子、盐值和哈希值
   * - 可以直接存储到数据库
   */
  return bcrypt.hash(password, salt);
};

/**
 * 密码比较函数
 *
 * 【功能】
 * - 比较明文密码和哈希密码是否匹配
 * - 使用 bcrypt 内部提取盐值并重新哈希比较
 *
 * 【参数】
 * - password: 用户输入的明文密码
 * - hashedPassword: 数据库存储的哈希密码
 *
 * 【返回】
 * - true: 密码匹配
 * - false: 密码不匹配
 *
 * 【使用场景】
 * - 用户登录时验证密码
 */
const comparePassword = async (password, hashedPassword) => {
  /**
   * bcrypt.compare 内部逻辑
   *
   * 【知识点】
   * - 从 hashedPassword 中提取盐值
   * - 使用提取的盐值哈希输入的 password
   * - 比较两个哈希值是否相同
   * - 时间恒定比较，防止时序攻击
   */
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 生成 JWT Token
 *
 * 【功能】
 * - 根据用户 ID 和角色生成 JWT
 * - 用于用户认证后的身份标识
 *
 * 【参数】
 * - userId: 用户唯一标识
 * - role: 用户角色（user/admin）
 *
 * 【返回】
 * - JWT 字符串
 *
 * 【使用场景】
 * - 用户登录成功后生成 Token
 * - Token 返回给客户端存储
 */
const generateToken = (userId, role) => {
  /**
   * jwt.sign 参数详解
   *
   * 【参数1】payload
   * - 要编码到 Token 中的数据
   * - 不要存放敏感信息（如密码）
   * - 可以存放用户 ID、角色、权限等
   *
   * 【参数2】secret
   * - 签名密钥，用于验证 Token 真实性
   * - 必须保密，泄露后任何人可伪造 Token
   * - 生产环境应使用长随机字符串
   *
   * 【参数3】options
   * - expiresIn: Token 过期时间
   * - 支持格式：数字（秒）、字符串（如 '7d'）
   */
  return jwt.sign(
    { userId, role },  // Payload
    config.jwt.secret, // 密钥
    { expiresIn: config.jwt.expiresIn } // 过期时间
  );
};

/**
 * 验证 JWT Token
 *
 * 【功能】
 * - 验证 Token 的签名和过期时间
 * - 返回解码后的 payload
 *
 * 【参数】
 * - token: JWT 字符串
 *
 * 【返回】
 * - 成功：解码后的 payload 对象
 * - 失败：null
 *
 * 【使用场景】
 * - 中间件中验证请求携带的 Token
 * - 确认用户身份和权限
 */
const verifyToken = (token) => {
  try {
    /**
     * jwt.verify 详解
     *
     * 【参数1】token
     * - 要验证的 JWT 字符串
     *
     * 【参数2】secret
     * - 用于验证签名的密钥
     * - 必须与生成 Token 时使用的密钥相同
     *
     * 【返回】
     * - 验证成功：解码后的 payload
     * - 验证失败：抛出错误
     */
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    /**
     * 错误处理
     *
     * 【可能的错误】
     * - TokenExpiredError: Token 已过期
     * - JsonWebTokenError: Token 格式错误或签名无效
     *
     * 【策略】
     * - 捕获错误，返回 null
     * - 调用者判断返回值处理
     * - 避免抛出异常中断程序
     */
    return null;
  }
};

/**
 * 导出工具函数
 *
 * 【知识点】
 * - 集中管理认证相关功能
 * - 其他模块按需导入使用
 * - 便于统一修改实现方式
 */
module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
