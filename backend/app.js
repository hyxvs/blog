/**
 * app.js - Express 应用配置与路由挂载中心
 * 
 * 【核心知识点】
 * 
 * 1. Express 框架基础
 *    - Express 是 Node.js 最流行的 Web 应用框架
 *    - 提供了简洁的 API 来处理 HTTP 请求、路由、中间件等
 *    - 设计理念：极简、灵活、高度可扩展
 * 
 * 2. 中间件 (Middleware) 概念
 *    - 中间件是 Express 的核心概念
 *    - 本质：函数，可以访问请求对象(req)、响应对象(res)和 next 函数
 *    - 执行顺序：按照代码中定义的顺序依次执行
 *    - 类型：
 *      * 应用级中间件：app.use()、app.METHOD()
 *      * 路由级中间件：router.use()、router.METHOD()
 *      * 错误处理中间件：4个参数 (err, req, res, next)
 *      * 内置中间件：express.json()、express.static() 等
 *      * 第三方中间件：cors、body-parser 等
 * 
 * 3. CORS (跨域资源共享)
 *    - 同源策略：浏览器安全机制，限制不同源之间的资源访问
 *    - 同源定义：协议、域名、端口完全相同
 *    - CORS 机制：服务器通过 HTTP 头告知浏览器允许跨域访问
 *    - cors 中间件自动处理预检请求(OPTIONS)和响应头设置
 *    - 配置项：
 *      * origin: 允许的源，可以是字符串、数组或函数
 *      * credentials: 是否允许携带 Cookie
 *      * methods: 允许的 HTTP 方法
 * 
 * 4. 请求体解析中间件
 *    - express.json(): 解析 Content-Type: application/json 的请求体
 *    - express.urlencoded(): 解析 Content-Type: application/x-www-form-urlencoded
 *    - extended: true 使用 qs 库解析，支持嵌套对象；false 使用 querystring 库
 * 
 * 5. 路由 (Routing)
 *    - 路由定义了应用的端点(URI)以及响应客户端请求的方式
 *    - RESTful API 设计原则：
 *      * 使用 HTTP 方法表示操作：GET(读)、POST(创)、PUT(改)、DELETE(删)
 *      * 使用名词表示资源：/users、/articles
 *      * 使用复数形式
 *    - 路由模块化：将相关路由分组到单独文件，提高可维护性
 * 
 * 6. 错误处理
 *    - Express 错误处理中间件必须有 4 个参数
 *    - 放在所有其他中间件和路由之后
 *    - 捕获同步和异步错误（需使用 next(err) 传递异步错误）
 */

// 导入 Express 框架
// express 是一个函数，调用后创建应用实例
const express = require('express');

// 导入 CORS 中间件
// CORS = Cross-Origin Resource Sharing（跨域资源共享）
const cors = require('cors');

// 导入数据库配置
// 用于获取 CORS 配置等设置
const config = require('./config/database');

/**
 * 导入路由模块
 * 
 * 【知识点】
 * - 路由模块化是大型应用的必要实践
 * - 每个路由文件负责一个资源领域的 CRUD 操作
 * - 遵循单一职责原则 (Single Responsibility Principle)
 */
// 用户相关路由（注册、登录、个人资料）
const userRoutes = require('./routes/userRoutes');

// 文章相关路由（发布、查询、编辑、删除）
const articleRoutes = require('./routes/articleRoutes');

// 评论相关路由（发表评论、获取评论列表）
const commentRoutes = require('./routes/commentRoutes');

// 分类相关路由（文章分类管理）
const categoryRoutes = require('./routes/categoryRoutes');

// 标签相关路由（文章标签管理）
const tagRoutes = require('./routes/tagRoutes');

// AI助手相关路由（文章生成、摘要、优化等）
const aiRoutes = require('./routes/aiRoutes');

// 文档分片相关路由（文章分割、搜索、推荐等）
const documentRoutes = require('./routes/documentRoutes');

// 管理员相关路由（用户管理、文章管理、标签管理等）
const adminRoutes = require('./routes/adminRoutes');

// 验证码相关路由（发送、验证验证码）
const verificationRoutes = require('./routes/verificationRoutes');

/**
 * 创建 Express 应用实例
 * 
 * 【知识点】
 * - express() 返回一个函数对象，具有路由、中间件等方法
 * - 这个 app 对象就是整个 Web 应用的核心
 */
const app = express();

/**
 * 应用级中间件配置
 * 
 * 【执行顺序】中间件按照代码顺序执行，位置很重要！
 */

/**
 * CORS 中间件
 * 
 * 【知识点】
 * - 必须在路由之前配置，否则跨域请求会失败
 * - config.cors 包含允许的源、是否携带凭证等配置
 * - 浏览器会自动发送预检请求(OPTIONS)检查是否允许跨域
 */
app.use(cors(config.cors));

/**
 * JSON 请求体解析中间件
 * 
 * 【知识点】
 * - 解析请求体中的 JSON 数据，转换为 JavaScript 对象
 * - 挂载到 req.body 属性上
 * - 只解析 Content-Type: application/json 的请求
 * - 有大小限制（默认 100kb），可通过 limit 选项调整
 */
app.use(express.json({ 
  limit: '50mb',
  type: ['application/json', 'application/*+json']
}));

/**
 * URL 编码请求体解析中间件
 * 
 * 【知识点】
 * - 解析表单提交的数据（如 <form> 标签提交的）
 * - extended: true 允许解析嵌套对象（使用 qs 库）
 * - 现代 API 主要使用 JSON，但保留表单解析兼容性
 */
app.use(express.urlencoded({ extended: true }));

/**
 * 静态文件服务
 * 
 * 【知识点】
 * - express.static() 提供静态文件服务
 * - 用于访问上传的头像文件
 * - 将 uploads 目录映射到 /uploads 路径
 */
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * 路由挂载
 * 
 * 【知识点】
 * - app.use(path, router) 将路由挂载到指定路径前缀
 * - 所有匹配该前缀的请求都会交给对应路由处理
 * - 例如：app.use('/api/users', userRoutes)
 *   POST /api/users/register 会由 userRoutes 处理
 * 
 * 【RESTful API 设计】
 * - /api 前缀标识这是 API 接口
 * - 使用复数名词表示资源集合
 */

// 用户路由：/api/users/*
app.use('/api/users', userRoutes);

// 文章路由：/api/articles/*
app.use('/api/articles', articleRoutes);

// 评论路由：/api/comments/*
app.use('/api/comments', commentRoutes);

// 分类路由：/api/categories/*
app.use('/api/categories', categoryRoutes);

// 标签路由：/api/tags/*
app.use('/api/tags', tagRoutes);

// AI助手路由：/api/ai/*
app.use('/api/ai', aiRoutes);

// 文档分片路由：/api/documents/*
app.use('/api/documents', documentRoutes);

// 管理员路由：/api/admin/*
app.use('/api/admin', adminRoutes);

// 验证码路由：/api/verification/*
app.use('/api/verification', verificationRoutes);

/**
 * 健康检查端点
 * 
 * 【知识点】
 * - 用于监控服务是否正常运行
 * - 负载均衡器、容器编排工具(Kubernetes)会定期访问
 * - 返回简单响应，不执行复杂逻辑
 */
app.get('/api/health', (req, res) => {
  // res.json() 自动设置 Content-Type: application/json
  // 并将 JavaScript 对象序列化为 JSON 字符串
  res.json({ status: 'ok', message: 'Blog API is running' });
});

/**
 * 全局错误处理中间件
 * 
 * 【知识点】
 * - 必须有 4 个参数：(err, req, res, next)
 * - 放在所有路由之后，捕获前面所有中间件的错误
 * - 如果前面没有错误，不会执行到这里
 * - err.stack 包含错误的堆栈跟踪，便于调试
 * - 生产环境不应暴露详细错误信息给客户端（安全风险）
 */
app.use((err, req, res, next) => {
  // 在服务器控制台输出错误详情，便于开发者排查问题
  console.error('Error occurred:', err);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.originalUrl);
  console.error('Request method:', req.method);
  
  // 向客户端返回通用错误信息
  // 500 是 HTTP 状态码，表示服务器内部错误
  res.status(500).json({ 
    error: 'Something went wrong!',
    // 在开发环境中，可以返回详细错误信息
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

/**
 * 导出应用实例
 * 
 * 【知识点】
 * - module.exports 是 CommonJS 的模块导出语法
 * - 其他文件通过 require('./app') 获取这个 app 对象
 * - 导出 app 而不是直接启动，便于测试和复用
 */
module.exports = app;
