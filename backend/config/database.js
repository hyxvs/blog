/**
 * config/database.js - 应用配置文件
 * 
 * 【核心知识点】
 * 
 * 1. 配置管理的重要性
 *    - 将配置与代码分离是软件工程的最佳实践
 *    - 好处：
 *      * 安全性：敏感信息不暴露在代码仓库
 *      * 灵活性：不同环境使用不同配置
 *      * 可维护性：修改配置无需修改代码
 *    - 符合 12-Factor App 方法论中的 "配置存储在环境中"
 * 
 * 2. 环境变量 (Environment Variables)
 *    - process.env 是 Node.js 提供的全局对象
 *    - 包含运行时的环境变量
 *    - 使用 process.env.VAR_NAME 访问
 *    - 通过 || 提供默认值，确保变量未定义时程序仍能运行
 * 
 * 3. 数据库连接配置详解
 *    
 *    host: 数据库服务器地址
 *    - localhost: 本地开发
 *    - 生产环境通常是远程服务器地址或域名
 *    
 *    port: 数据库服务端口
 *    - PostgreSQL 默认端口是 5432
 *    - MySQL 默认是 3306，MongoDB 是 27017
 *    
 *    database: 数据库名称
 *    - 一个数据库服务器可以有多个数据库
 *    - 按应用或功能分离数据
 *    
 *    user/password: 认证信息
 *    - 数据库用户权限管理
 *    - 生产环境应使用最小权限原则
 * 
 * 4. 连接池配置 (Connection Pool)
 *    
 *    max: 最大连接数
 *    - 限制同时打开的数据库连接数量
 *    - 防止资源耗尽
 *    - 根据服务器能力和并发量调整
 *    
 *    idleTimeoutMillis: 空闲连接超时时间
 *    - 连接空闲超过此时间会被关闭
 *    - 单位：毫秒，30000 = 30秒
 *    - 节省数据库资源
 *    
 *    connectionTimeoutMillis: 连接超时时间
 *    - 获取连接的最大等待时间
 *    - 超过此时间未获得连接会报错
 *    - 单位：毫秒，2000 = 2秒
 * 
 * 5. JWT (JSON Web Token) 配置
 *    
 *    secret: 签名密钥
 *    - 用于验证 Token 的真实性
 *    - 必须保密，泄露后任何人可伪造 Token
 *    - 生产环境应使用长随机字符串
 *    
 *    expiresIn: 过期时间
 *    - 控制 Token 有效期
 *    - 格式：数字(秒) 或 字符串如 '7d'、'24h'
 *    - 平衡安全性和用户体验
 * 
 * 6. CORS (跨域) 配置
 *    
 *    origin: 允许的源
 *    - 可以是字符串、数组或正则表达式
 *    - '*' 表示允许所有（不推荐用于生产）
 *    - 生产环境应明确指定允许的域名
 *    
 *    credentials: 是否允许携带凭证
 *    - true 允许携带 Cookie、HTTP 认证头
 *    - 需要前后端同时配置
 */

/**
 * 导出配置对象
 * 
 * 【知识点】
 * - module.exports 导出的是一个对象
 * - 其他文件通过解构赋值获取需要的配置部分
 * - 例如：const { port, database } = require('./config/database')
 */
module.exports = {
  /**
   * 服务器端口配置
   * 
   * 【知识点】
   * - process.env.PORT 从环境变量读取
   * - || 3001 提供默认值
   * - 常见端口：80(HTTP)、443(HTTPS)、3000/8080(开发)
   */
  port: process.env.PORT || 3001,

  /**
   * 数据库连接池配置
   * 
   * 【知识点】
   * - 连接池复用数据库连接，避免频繁创建/销毁的开销
   * - pg 模块的 Pool 类使用这些配置
   */
  database: {
    // 数据库服务器主机地址
    host: process.env.DB_HOST || 'localhost',
    
    // 数据库服务端口，PostgreSQL 默认 5432
    port: process.env.DB_PORT || 5432,
    
    // 数据库名称
    database: process.env.DB_NAME || 'blog_system',
    
    // 数据库用户名
    user: process.env.DB_USER || 'postgres',
    
    // 数据库密码 - 敏感信息应从环境变量读取
    password: process.env.DB_PASSWORD || '123456',
    
    // 连接池最大连接数
    // 根据数据库服务器能力和应用并发量调整
    max: 20,
    
    // 连接空闲超时时间（毫秒）
    // 30秒后未使用的连接会被释放
    idleTimeoutMillis: 30000,
    
    // 连接获取超时时间（毫秒）
    // 2秒内未获取到连接会报错
    connectionTimeoutMillis: 2000,
  },

  /**
   * JWT 认证配置
   * 
   * 【知识点】
   * - JWT 是无状态的认证机制
   * - 服务器不保存会话信息，只验证 Token 签名
   * - 适合分布式系统和微服务架构
   */
  jwt: {
    // JWT 签名密钥 - 必须保密！
    // 生产环境应使用强随机字符串，长度至少 256 位
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    
    // Token 过期时间
    // '7d' = 7天，支持格式：秒数、'2 days'、'10h'、'7d'
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  /**
   * CORS 跨域配置
   * 
   * 【知识点】
   * - 浏览器同源策略限制跨域请求
   * - CORS 通过 HTTP 头告知浏览器允许跨域
   * - 开发环境通常前端和后端运行在不同端口，需要配置 CORS
   */
  cors: {
    // 允许所有来源
    origin: function(origin, callback) {
      // 允许所有来源（包括 null 用于某些请求）
      callback(null, true);
    },
    
    // 允许携带凭证（Cookie、Authorization 头等）
    credentials: true,
    
    // 允许的 HTTP 方法
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // 允许的请求头
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};
