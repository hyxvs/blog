# 博客系统

一个基于 Vue3 + Node.js + PostgreSQL 的全栈博客系统，支持用户注册登录、文章发布管理、评论互动等功能。

## 技术栈

### 前端
- Vue 3 (Composition API)
- Pinia (状态管理)
- Vue Router 4 (路由管理)
- Element Plus (UI组件库)
- Axios (HTTP客户端)

### 后端
- Node.js
- Express (Web框架)
- pg (PostgreSQL客户端)
- JWT (身份认证)
- bcrypt (密码加密)

### 数据库
- PostgreSQL 12+

## 系统设计

### 数据库表结构

#### 1. users (用户表)
```sql
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE NOT NULL (用户名)
- email: VARCHAR(100) UNIQUE NOT NULL (邮箱)
- password: VARCHAR(255) NOT NULL (加密密码)
- avatar: VARCHAR(255) (头像URL)
- role: VARCHAR(20) DEFAULT 'user' (角色: user/admin)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

索引:
- idx_users_username
- idx_users_email
```

#### 2. categories (分类表)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) UNIQUE NOT NULL (分类名称)
- description: TEXT (分类描述)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

索引:
- idx_categories_name
```

#### 3. tags (标签表)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) UNIQUE NOT NULL (标签名称)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

索引:
- idx_tags_name
```

#### 4. articles (文章表)
```sql
- id: SERIAL PRIMARY KEY
- title: VARCHAR(200) NOT NULL (文章标题)
- content: TEXT NOT NULL (文章内容)
- summary: VARCHAR(500) (文章摘要)
- cover_image: VARCHAR(255) (封面图URL)
- author_id: INTEGER REFERENCES users(id) (作者ID)
- category_id: INTEGER REFERENCES categories(id) (分类ID)
- status: VARCHAR(20) DEFAULT 'published' (状态: published/draft)
- view_count: INTEGER DEFAULT 0 (阅读量)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

索引:
- idx_articles_author
- idx_articles_category
- idx_articles_status
- idx_articles_created (DESC)
- idx_articles_title (全文搜索)
- idx_articles_content (全文搜索)
```

#### 5. article_tags (文章标签关联表)
```sql
- article_id: INTEGER REFERENCES articles(id) ON DELETE CASCADE
- tag_id: INTEGER REFERENCES tags(id) ON DELETE CASCADE
- PRIMARY KEY (article_id, tag_id)

索引:
- idx_article_tags_article
- idx_article_tags_tag
```

#### 6. comments (评论表)
```sql
- id: SERIAL PRIMARY KEY
- content: TEXT NOT NULL (评论内容)
- article_id: INTEGER REFERENCES articles(id) ON DELETE CASCADE (文章ID)
- user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE (用户ID)
- parent_id: INTEGER REFERENCES comments(id) ON DELETE CASCADE (父评论ID)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

索引:
- idx_comments_article
- idx_comments_user
- idx_comments_parent
- idx_comments_created (DESC)
```

### API接口设计

#### 用户模块
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取个人信息
- `PUT /api/users/profile` - 更新个人信息
- `PUT /api/users/password` - 修改密码

#### 文章模块
- `GET /api/articles` - 获取文章列表（支持分页、搜索、分类、标签筛选）
- `GET /api/articles/:id` - 获取文章详情
- `POST /api/articles` - 创建文章（需要登录）
- `PUT /api/articles/:id` - 更新文章（需要登录，只能操作自己的文章）
- `DELETE /api/articles/:id` - 删除文章（需要登录，只能操作自己的文章）

#### 评论模块
- `GET /api/comments/article/:articleId` - 获取文章评论列表（支持分页）
- `POST /api/comments` - 发表评论（需要登录）
- `DELETE /api/comments/:id` - 删除评论（需要登录，只能删除自己的评论）

#### 分类模块
- `GET /api/categories` - 获取分类列表
- `GET /api/categories/:id` - 获取分类详情
- `POST /api/categories` - 创建分类（管理员）
- `PUT /api/categories/:id` - 更新分类（管理员）
- `DELETE /api/categories/:id` - 删除分类（管理员）

#### 标签模块
- `GET /api/tags` - 获取标签列表
- `GET /api/tags/:id` - 获取标签详情
- `POST /api/tags` - 创建标签（管理员）
- `PUT /api/tags/:id` - 更新标签（管理员）
- `DELETE /api/tags/:id` - 删除标签（管理员）

### 前端页面结构

```
/
├── Login.vue          # 登录页面
├── Register.vue       # 注册页面
├── Home.vue           # 首页（文章列表）
├── ArticleDetail.vue  # 文章详情页
├── CreateArticle.vue  # 创建文章页
├── EditArticle.vue    # 编辑文章页
├── MyArticles.vue     # 我的文章页
└── Profile.vue        # 个人中心页
```

### 权限控制

- **普通用户**: 只能操作自己的文章和评论
- **管理员**: 可以管理所有内容，包括创建/编辑/删除分类和标签

## 项目启动步骤

### 1. 环境准备

确保已安装以下软件：
- Node.js (v16+)
- PostgreSQL (v12+)
- npm 或 yarn

### 2. 数据库配置

#### 2.1 创建数据库
```bash
# 使用psql连接到PostgreSQL
psql -U postgres

# 执行数据库初始化脚本
\i backend/database/init.sql
```

或者直接运行：
```bash
psql -U postgres -f backend/database/init.sql
```

#### 2.2 修改数据库密码（如需要）
如果PostgreSQL密码不是123456，请修改 `backend/.env` 文件中的 `DB_PASSWORD`。

### 3. 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或启动生产服务器
npm start
```

后端服务将在 `http://localhost:3000` 启动。

### 4. 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或构建生产版本
npm run build
```

前端服务将在 `http://localhost:5173` 启动。

### 5. 访问应用

打开浏览器访问 `http://localhost:5173` 即可使用博客系统。

## 默认账号

系统初始化时会创建一个管理员账号：
- 用户名: `admin`
- 密码: 需要重新设置（初始化脚本中的密码是示例）

建议首次登录后立即修改密码。

## 常见问题解决方案

### 1. 数据库连接失败

**问题**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**解决方案**:
- 确保PostgreSQL服务已启动
- 检查 `backend/.env` 中的数据库配置是否正确
- 确认PostgreSQL的端口号（默认5432）

### 2. JWT token过期

**问题**: 登录后一段时间后提示token过期

**解决方案**:
- 修改 `backend/.env` 中的 `JWT_EXPIRES_IN` 值（默认7天）
- 或重新登录获取新的token

### 3. CORS跨域问题

**问题**: 前端请求后端API时出现CORS错误

**解决方案**:
- 确认 `backend/.env` 中的 `CORS_ORIGIN` 设置正确
- 检查前端开发服务器的端口（默认5173）

### 4. 文章内容不显示

**问题**: 文章详情页内容为空或显示异常

**解决方案**:
- 确保文章内容使用正确的HTML格式
- 检查是否有XSS过滤导致内容被截断

### 5. 评论无法发表

**问题**: 点击发表评论没有反应

**解决方案**:
- 确保已登录
- 检查评论内容是否为空
- 查看浏览器控制台是否有错误信息

### 6. 图片无法显示

**问题**: 文章封面图或头像不显示

**解决方案**:
- 确保图片URL正确且可访问
- 检查是否使用了相对路径（建议使用绝对路径）
- 确认图片格式支持（jpg, png, gif等）

### 7. 分页不工作

**问题**: 文章列表分页功能异常

**解决方案**:
- 检查后端API返回的pagination数据格式
- 确认前端分页组件的配置正确
- 查看浏览器控制台的网络请求

### 8. 搜索功能无效

**问题**: 搜索文章时没有结果或结果不正确

**解决方案**:
- 确保数据库已创建全文搜索索引
- 检查搜索关键词是否正确传递
- 尝试使用更简单的关键词进行搜索

### 9. 权限问题

**问题**: 无法编辑或删除文章/评论

**解决方案**:
- 确认登录状态
- 检查当前用户是否是文章/评论的作者
- 管理员可以操作所有内容

### 10. 性能优化建议

**问题**: 页面加载速度慢

**解决方案**:
- 为数据库表添加适当的索引（已包含在init.sql中）
- 使用分页加载文章列表
- 对图片进行压缩和懒加载
- 启用浏览器缓存
- 考虑使用CDN加速静态资源

## 项目结构

```
blog-platform/
├── backend/
│   ├── config/
│   │   ├── database.js      # 数据库配置
│   │   └── pool.js          # 数据库连接池
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── articleController.js
│   │   ├── commentController.js
│   │   ├── categoryController.js
│   │   └── tagController.js
│   ├── middleware/
│   │   └── auth.js         # 认证中间件
│   ├── models/             # 数据模型（如需要）
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── articleRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── tagRoutes.js
│   ├── utils/
│   │   └── auth.js         # 认证工具函数
│   ├── database/
│   │   └── init.sql        # 数据库初始化脚本
│   ├── app.js              # Express应用配置
│   ├── server.js           # 服务器入口
│   ├── package.json
│   └── .env                # 环境变量
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── user.js
│   │   │   ├── article.js
│   │   │   ├── comment.js
│   │   │   ├── category.js
│   │   │   └── tag.js
│   │   ├── assets/         # 静态资源
│   │   ├── components/
│   │   │   └── Header.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── stores/
│   │   │   └── user.js
│   │   ├── utils/
│   │   │   └── request.js
│   │   ├── views/
│   │   │   ├── Login.vue
│   │   │   ├── Register.vue
│   │   │   ├── Home.vue
│   │   │   ├── ArticleDetail.vue
│   │   │   ├── CreateArticle.vue
│   │   │   ├── EditArticle.vue
│   │   │   ├── MyArticles.vue
│   │   │   └── Profile.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 开发建议

1. **代码规范**: 遵循ESLint和Prettier配置
2. **Git提交**: 使用有意义的commit message
3. **测试**: 编写单元测试和集成测试
4. **文档**: 及时更新API文档和注释
5. **性能**: 定期检查和优化数据库查询
6. **安全**: 定期更新依赖包，修复安全漏洞

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue。