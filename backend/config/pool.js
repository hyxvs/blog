/**
 * config/pool.js - PostgreSQL 数据库连接池配置
 * 
 * 【核心知识点】
 * 
 * 1. 数据库连接池 (Connection Pool) 概念
 * 
 *    【问题背景】
 *    - 每次数据库操作都创建新连接开销很大
 *    - 连接建立需要 TCP 三次握手 + 数据库认证
 *    - 高并发时频繁创建/销毁连接会耗尽资源
 * 
 *    【解决方案】
 *    - 连接池维护一组已建立的数据库连接
 *    - 需要时从池中获取，用完归还而不是关闭
 *    - 连接复用大大减少开销
 * 
 *    【工作原理】
 *    - 初始化时创建一定数量的连接
 *    - 请求连接时：
 *      * 池中有空闲连接 → 直接返回
 *      * 池中没有但未满 → 创建新连接
 *      * 池已满 → 等待或报错
 *    - 使用完毕后连接归还到池中
 * 
 * 2. pg 模块 (node-postgres)
 * 
 *    - Node.js 最流行的 PostgreSQL 客户端
 *    - 提供 Client（单连接）和 Pool（连接池）两种模式
 *    - 纯 JavaScript 实现，无需编译原生模块
 *    - 支持参数化查询，防止 SQL 注入
 * 
 * 3. Pool 类详解
 * 
 *    【创建】
 *    - new Pool(config) 创建连接池实例
 *    - config 对象包含连接信息和池配置
 *    - 配置项见 database.js 中的 database 对象
 * 
 *    【方法】
 *    - pool.query(sql, params): 执行查询并自动管理连接
 *    - pool.connect(): 获取客户端连接（用于事务）
 *    - pool.end(): 关闭所有连接，清理资源
 * 
 * 4. 事件监听
 * 
 *    【connect 事件】
 *    - 当新连接建立时触发
 *    - 用于日志记录、连接计数等
 * 
 *    【error 事件】
 *    - 当连接发生错误时触发
 *    - 通常是网络问题或数据库服务器故障
 *    - 需要优雅处理，避免进程崩溃
 * 
 * 5. 进程退出处理
 * 
 *    - process.exit(-1) 表示异常退出
 *    - 负数或非零值表示错误状态
 *    - 容器编排系统(Kubernetes)会根据退出码决定是否重启
 * 
 * 6. 单例模式
 * 
 *    - 整个应用共享同一个 pool 实例
 *    - 避免创建多个连接池导致连接数超标
 *    - Node.js 模块系统天然支持单例（模块缓存）
 */

/**
 * 导入 pg 模块的 Pool 类
 * 
 * 【知识点】
 * - pg 是 PostgreSQL 的 Node.js 驱动
 * - Pool 是连接池实现，比 Client 更适合生产环境
 * - 解构赋值 { Pool } 从模块中提取 Pool 类
 */
const { Pool } = require('pg');

/**
 * 导入数据库配置
 * 
 * 【知识点】
 * - 从 database.js 导入配置对象
 * - config.database 包含连接参数（host, port, user 等）
 * - 实现配置与连接逻辑分离
 */
const config = require('./database');

/**
 * 创建连接池实例
 * 
 * 【知识点】
 * - new Pool(config) 创建连接池
 * - config.database 包含：
 *   * host, port, database, user, password（连接信息）
 *   * max, idleTimeoutMillis, connectionTimeoutMillis（池配置）
 * - 连接池会自动管理连接的创建、复用和销毁
 */
const pool = new Pool(config.database);

/**
 * 监听连接建立事件
 * 
 * 【知识点】
 * - 'connect' 事件在新连接建立到 PostgreSQL 时触发
 * - 用于确认数据库连接成功、记录日志等
 * - 不是每次查询都触发，是物理连接建立时触发
 */
pool.on('connect', () => {
  // 输出连接成功信息，便于调试和监控
  console.log('Connected to PostgreSQL database');
});

/**
 * 监听连接错误事件
 * 
 * 【知识点】
 * - 'error' 事件在连接发生异常时触发
 * - 常见原因：
 *   * 数据库服务器宕机
 *   * 网络中断
 *   * 连接被数据库服务器强制关闭
 * - 必须处理，否则未捕获的异常会导致进程崩溃
 * 
 * 【错误处理策略】
 * - 记录错误日志
 * - 退出进程，让进程管理器（如 PM2、Docker）重启应用
 * - 也可以选择尝试重连，但需谨慎设计
 */
pool.on('error', (err) => {
  // 输出错误详情到标准错误流
  console.error('Unexpected error on idle client', err);
  
  /**
   * 退出进程
   * 
   * 【知识点】
   * - process.exit(-1) 以错误状态码退出
   * - -1 表示异常退出（实际转换为 255）
   * - 生产环境中，进程管理器会检测退出并重启应用
   * - 这是"快速失败"(Fail Fast)原则的体现
   */
  process.exit(-1);
});

/**
 * 导出连接池实例
 * 
 * 【知识点】
 * - 导出 pool 供其他模块使用
 * - 使用方式：
 *   * 简单查询：pool.query(sql, params)
 *   * 事务操作：const client = await pool.connect()
 * - 单例模式确保整个应用使用同一个连接池
 */
module.exports = pool;
