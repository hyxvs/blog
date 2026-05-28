# 博客系统设计文档

## 1. 系统概述

### 1.1 项目背景
本博客系统是一个基于现代Web技术栈的全栈应用，旨在提供一个简洁、高效、易用的博客发布和管理平台。系统支持用户注册登录、文章发布管理、评论互动等功能，适用于个人博客或小型团队博客。

### 1.2 技术选型

#### 前端技术栈
- **Vue 3**: 采用Composition API，提供更好的代码组织和复用性
- **Pinia**: Vue官方推荐的状态管理库，替代Vuex
- **Vue Router 4**: 官方路由管理器，支持路由守卫和懒加载
- **Element Plus**: 基于Vue 3的UI组件库，提供丰富的组件和良好的用户体验
- **Axios**: HTTP客户端，支持请求拦截和响应拦截

#### 后端技术栈
- **Node.js**: JavaScript运行时，提供高性能的服务器端执行环境
- **Express**: 轻量级Web框架，提供简洁的API和中间件支持
- **pg**: PostgreSQL官方Node.js客户端，提供高效的数据库操作
- **JWT**: JSON Web Token，用于无状态的身份认证
- **bcrypt**: 密码加密库，提供安全的密码哈希存储

#### 数据库
- **PostgreSQL**: 开源对象关系数据库系统，提供强大的查询能力和数据完整性保障

### 1.3 系统特点
- 响应式设计，支持PC和移动端
- RESTful API设计，接口规范统一
- JWT身份认证，安全可靠
- 数据库索引优化，查询性能优秀
- 代码结构清晰，易于维护和扩展

## 2. 数据库设计

### 2.1 ER图

```
users (用户表)
    |
    | 1:N
    |
articles (文章表)
    |
    | 1:N
    |
comments (评论表)

articles (文章表)
    |
    | N:1
    |
categories (分类表)

articles (文章表)
    |
    | N:M
    |
tags (标签表)
```

### 2.2 表结构详细说明

#### 2.2.1 users (用户表)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 用户ID，自增主键 |
| username | VARCHAR(50) | UNIQUE NOT NULL | 用户名，唯一且不能为空 |
| email | VARCHAR(100) | UNIQUE NOT NULL | 邮箱，唯一且不能为空 |
| password | VARCHAR(255) | NOT NULL | 密码，使用bcrypt加密存储 |
| avatar | VARCHAR(255) | NULL | 头像URL |
| role | VARCHAR(20) | DEFAULT 'user' | 用户角色：user/admin |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- `idx_users_username`: 优化用户名查询
- `idx_users_email`: 优化邮箱查询

**触发器**:
- `update_users_updated_at`: 自动更新updated_at字段

#### 2.2.2 categories (分类表)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 分类ID，自增主键 |
| name | VARCHAR(50) | UNIQUE NOT NULL | 分类名称，唯一且不能为空 |
| description | TEXT | NULL | 分类描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引设计**:
- `idx_categories_name`: 优化分类名称查询

#### 2.2.3 tags (标签表)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 标签ID，自增主键 |
| name | VARCHAR(50) | UNIQUE NOT NULL | 标签名称，唯一且不能为空 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引设计**:
- `idx_tags_name`: 优化标签名称查询

#### 2.2.4 articles (文章表)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 文章ID，自增主键 |
| title | VARCHAR(200) | NOT NULL | 文章标题 |
| content | TEXT | NOT NULL | 文章内容，支持HTML |
| summary | VARCHAR(500) | NULL | 文章摘要 |
| cover_image | VARCHAR(255) | NULL | 封面图URL |
| author_id | INTEGER | REFERENCES users(id) | 作者ID，外键关联用户表 |
| category_id | INTEGER | REFERENCES categories(id) | 分类ID，外键关联分类表 |
| status | VARCHAR(20) | DEFAULT 'published' | 文章状态：published/draft |
| view_count | INTEGER | DEFAULT 0 | 阅读量 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- `idx_articles_author`: 优化按作者查询
- `idx_articles_category`: 优化按分类查询
- `idx_articles_status`: 优化按状态查询
- `idx_articles_created`: 优化按创建时间排序（降序）
- `idx_articles_title`: 全文搜索索引，优化标题搜索
- `idx_articles_content`: 全文搜索索引，优化内容搜索

**触发器**:
- `update_articles_updated_at`: 自动更新updated_at字段

#### 2.2.5 article_tags (文章标签关联表)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| article_id | INTEGER | REFERENCES articles(id) ON DELETE CASCADE | 文章ID，外键关联文章表 |
| tag_id | INTEGER | REFERENCES tags(id) ON DELETE CASCADE | 标签ID，外键关联标签表 |

**主键**: (article_id, tag_id) 联合主键

**索引设计**:
- `idx_article_tags_article`: 优化按文章查询标签
- `idx_article_tags_tag`: 优化按标签查询文章

#### 2.2.6 comments (评论表)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 评论ID，自增主键 |
| content | TEXT | NOT NULL | 评论内容 |
| article_id | INTEGER | REFERENCES articles(id) ON DELETE CASCADE | 文章ID，外键关联文章表 |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | 用户ID，外键关联用户表 |
| parent_id | INTEGER | REFERENCES comments(id) ON DELETE CASCADE | 父评论ID，支持回复功能 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- `idx_comments_article`: 优化按文章查询评论
- `idx_comments_user`: 优化按用户查询评论
- `idx_comments_parent`: 优化查询子评论
- `idx_comments_created`: 优化按创建时间排序（降序）

**触发器**:
- `update_comments_updated_at`: 自动更新updated_at字段

### 2.3 数据库优化策略

#### 2.3.1 索引优化
- 为所有外键字段创建索引，加速关联查询
- 为常用查询字段创建索引，如username、email、title等
- 使用全文搜索索引优化文章搜索功能
- 为时间字段创建降序索引，优化排序查询

#### 2.3.2 查询优化
- 使用连接池管理数据库连接，避免频繁创建和销毁连接
- 使用分页查询，避免一次性加载大量数据
- 使用EXPLAIN分析慢查询，优化SQL语句
- 合理使用JOIN，避免N+1查询问题

#### 2.3.3 数据完整性
- 使用外键约束保证数据一致性
- 使用UNIQUE约束保证关键字段的唯一性
- 使用NOT NULL约束保证必填字段的数据完整性
- 使用CASCADE删除策略自动清理关联数据

## 3. 后端API设计

### 3.1 API规范

#### 3.1.1 请求格式
- 使用RESTful风格
- 请求头：`Content-Type: application/json`
- 认证：使用JWT Token，放在请求头的Authorization字段
  ```
  Authorization: Bearer <token>
  ```

#### 3.1.2 响应格式
成功响应：
```json
{
  "data": {},
  "message": "success"
}
```

错误响应：
```json
{
  "error": "错误信息"
}
```

#### 3.1.3 HTTP状态码
- 200: 请求成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 409: 资源冲突（如用户名已存在）
- 500: 服务器内部错误

### 3.2 用户模块API

#### 3.2.1 用户注册
- **接口**: `POST /api/users/register`
- **认证**: 不需要
- **请求体**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "string"
  }
  ```

#### 3.2.2 用户登录
- **接口**: `POST /api/users/login`
- **认证**: 不需要
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "role": "user",
      "avatar": "string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "string"
  }
  ```

#### 3.2.3 获取个人信息
- **接口**: `GET /api/users/profile`
- **认证**: 需要
- **响应**:
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "string",
    "avatar": "string",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
  ```

#### 3.2.4 更新个人信息
- **接口**: `PUT /api/users/profile`
- **认证**: 需要
- **请求体**:
  ```json
  {
    "username": "string",
    "email": "string",
    "avatar": "string"
  }
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "string",
    "avatar": "string",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
  ```

#### 3.2.5 修改密码
- **接口**: `PUT /api/users/password`
- **认证**: 需要
- **请求体**:
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```
- **响应**:
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

### 3.3 文章模块API

#### 3.3.1 获取文章列表
- **接口**: `GET /api/articles`
- **认证**: 不需要
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `category`: 分类ID
  - `tag`: 标签名称
  - `keyword`: 搜索关键词
  - `authorId`: 作者ID
- **响应**:
  ```json
  {
    "articles": [
      {
        "id": 1,
        "title": "string",
        "summary": "string",
        "coverImage": "string",
        "authorId": 1,
        "categoryId": 1,
        "status": "published",
        "viewCount": 100,
        "authorName": "string",
        "authorAvatar": "string",
        "categoryName": "string",
        "tags": [
          {
            "id": 1,
            "name": "string"
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
  ```

#### 3.3.2 获取文章详情
- **接口**: `GET /api/articles/:id`
- **认证**: 不需要
- **响应**:
  ```json
  {
    "id": 1,
    "title": "string",
    "content": "string",
    "summary": "string",
    "coverImage": "string",
    "authorId": 1,
    "categoryId": 1,
    "status": "published",
    "viewCount": 101,
    "authorName": "string",
    "authorAvatar": "string",
    "categoryName": "string",
    "tags": [
      {
        "id": 1,
        "name": "string"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

#### 3.3.3 创建文章
- **接口**: `POST /api/articles`
- **认证**: 需要
- **请求体**:
  ```json
  {
    "title": "string",
    "content": "string",
    "summary": "string",
    "coverImage": "string",
    "categoryId": 1,
    "tags": ["tag1", "tag2"]
  }
  ```
- **响应**: 同获取文章详情

#### 3.3.4 更新文章
- **接口**: `PUT /api/articles/:id`
- **认证**: 需要（只能更新自己的文章）
- **请求体**: 同创建文章
- **响应**: 同获取文章详情

#### 3.3.5 删除文章
- **接口**: `DELETE /api/articles/:id`
- **认证**: 需要（只能删除自己的文章）
- **响应**:
  ```json
  {
    "message": "Article deleted successfully"
  }
  ```

### 3.4 评论模块API

#### 3.4.1 获取文章评论列表
- **接口**: `GET /api/comments/article/:articleId`
- **认证**: 不需要
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **响应**:
  ```json
  {
    "comments": [
      {
        "id": 1,
        "content": "string",
        "userId": 1,
        "parentId": null,
        "username": "string",
        "avatar": "string",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "replyCount": 2,
        "replies": [
          {
            "id": 2,
            "content": "string",
            "userId": 2,
            "parentId": 1,
            "username": "string",
            "avatar": "string",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
  ```

#### 3.4.2 发表评论
- **接口**: `POST /api/comments`
- **认证**: 需要
- **请求体**:
  ```json
  {
    "articleId": 1,
    "content": "string",
    "parentId": null
  }
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "content": "string",
    "articleId": 1,
    "userId": 1,
    "parentId": null,
    "username": "string",
    "avatar": "string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

#### 3.4.3 删除评论
- **接口**: `DELETE /api/comments/:id`
- **认证**: 需要（只能删除自己的评论）
- **响应**:
  ```json
  {
    "message": "Comment deleted successfully"
  }
  ```

### 3.5 分类模块API

#### 3.5.1 获取分类列表
- **接口**: `GET /api/categories`
- **认证**: 不需要
- **响应**:
  ```json
  {
    "categories": [
      {
        "id": 1,
        "name": "string",
        "description": "string",
        "articleCount": 10,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### 3.5.2 获取分类详情
- **接口**: `GET /api/categories/:id`
- **认证**: 不需要
- **响应**: 同获取分类列表中的单个分类

#### 3.5.3 创建分类
- **接口**: `POST /api/categories`
- **认证**: 需要（仅管理员）
- **请求体**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **响应**: 同获取分类列表中的单个分类

#### 3.5.4 更新分类
- **接口**: `PUT /api/categories/:id`
- **认证**: 需要（仅管理员）
- **请求体**: 同创建分类
- **响应**: 同获取分类列表中的单个分类

#### 3.5.5 删除分类
- **接口**: `DELETE /api/categories/:id`
- **认证**: 需要（仅管理员）
- **响应**:
  ```json
  {
    "message": "Category deleted successfully"
  }
  ```

### 3.6 标签模块API

#### 3.6.1 获取标签列表
- **接口**: `GET /api/tags`
- **认证**: 不需要
- **响应**:
  ```json
  {
    "tags": [
      {
        "id": 1,
        "name": "string",
        "articleCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### 3.6.2 获取标签详情
- **接口**: `GET /api/tags/:id`
- **认证**: 不需要
- **响应**: 同获取标签列表中的单个标签

#### 3.6.3 创建标签
- **接口**: `POST /api/tags`
- **认证**: 需要（仅管理员）
- **请求体**:
  ```json
  {
    "name": "string"
  }
  ```
- **响应**: 同获取标签列表中的单个标签

#### 3.6.4 更新标签
- **接口**: `PUT /api/tags/:id`
- **认证**: 需要（仅管理员）
- **请求体**: 同创建标签
- **响应**: 同获取标签列表中的单个标签

#### 3.6.5 删除标签
- **接口**: `DELETE /api/tags/:id`
- **认证**: 需要（仅管理员）
- **响应**:
  ```json
  {
    "message": "Tag deleted successfully"
  }
  ```

## 4. 前端设计

### 4.1 页面结构

#### 4.1.1 首页 (Home.vue)
- **功能**: 展示文章列表
- **组件**:
  - 搜索框
  - 分类筛选
  - 标签筛选
  - 文章卡片列表
  - 分页组件
- **路由**: `/`

#### 4.1.2 文章详情页 (ArticleDetail.vue)
- **功能**: 展示文章详情和评论
- **组件**:
  - 文章标题、作者、时间、阅读量
  - 文章内容
  - 分类和标签
  - 评论列表（支持回复）
  - 评论表单
  - 编辑/删除按钮（仅作者和管理员可见）
- **路由**: `/article/:id`

#### 4.1.3 创建文章页 (CreateArticle.vue)
- **功能**: 创建新文章
- **组件**:
  - 标题输入框
  - 分类选择器
  - 标签选择器（支持创建新标签）
  - 摘要输入框
  - 封面图URL输入框
  - 内容编辑器（支持HTML）
  - 提交/取消按钮
- **路由**: `/create-article`
- **权限**: 需要登录

#### 4.1.4 编辑文章页 (EditArticle.vue)
- **功能**: 编辑已有文章
- **组件**: 同创建文章页
- **路由**: `/edit-article/:id`
- **权限**: 需要登录，且为文章作者或管理员

#### 4.1.5 我的文章页 (MyArticles.vue)
- **功能**: 展示当前用户的文章列表
- **组件**:
  - 文章表格（标题、阅读量、创建时间）
  - 查看、编辑、删除操作按钮
  - 分页组件
- **路由**: `/my-articles`
- **权限**: 需要登录

#### 4.1.6 登录页 (Login.vue)
- **功能**: 用户登录
- **组件**:
  - 用户名输入框
  - 密码输入框
  - 登录按钮
  - 注册链接
- **路由**: `/login`

#### 4.1.7 注册页 (Register.vue)
- **功能**: 用户注册
- **组件**:
  - 用户名输入框
  - 邮箱输入框
  - 密码输入框
  - 确认密码输入框
  - 注册按钮
  - 登录链接
- **路由**: `/register`

#### 4.1.8 个人中心页 (Profile.vue)
- **功能**: 管理个人信息
- **组件**:
  - 基本信息表单（用户名、邮箱、头像）
  - 修改密码表单（旧密码、新密码、确认密码）
  - Tab切换
- **路由**: `/profile`
- **权限**: 需要登录

### 4.2 状态管理

#### 4.2.1 User Store (stores/user.js)
- **状态**:
  - `user`: 当前用户信息
  - `token`: JWT Token
- **Getters**:
  - `isLoggedIn`: 是否已登录
  - `isAdmin`: 是否为管理员
  - `userId`: 当前用户ID
- **Actions**:
  - `loginAction`: 登录
  - `registerAction`: 注册
  - `logout`: 退出登录
  - `fetchProfile`: 获取个人信息
  - `updateProfileAction`: 更新个人信息
  - `changePasswordAction`: 修改密码

### 4.3 路由设计

#### 4.3.1 路由配置
```javascript
{
  path: '/',
  name: 'Home',
  component: Home
}
{
  path: '/login',
  name: 'Login',
  component: Login
}
{
  path: '/register',
  name: 'Register',
  component: Register
}
{
  path: '/article/:id',
  name: 'ArticleDetail',
  component: ArticleDetail
}
{
  path: '/profile',
  name: 'Profile',
  component: Profile,
  meta: { requiresAuth: true }
}
{
  path: '/create-article',
  name: 'CreateArticle',
  component: CreateArticle,
  meta: { requiresAuth: true }
}
{
  path: '/edit-article/:id',
  name: 'EditArticle',
  component: EditArticle,
  meta: { requiresAuth: true }
}
{
  path: '/my-articles',
  name: 'MyArticles',
  component: MyArticles,
  meta: { requiresAuth: true }
}
```

#### 4.3.2 路由守卫
- 全局前置守卫：检查`requiresAuth`元信息，未登录用户重定向到登录页

### 4.4 组件设计

#### 4.4.1 Header组件
- **功能**: 显示导航栏和用户信息
- **内容**:
  - Logo（博客系统）
  - 导航链接（首页、写文章、我的文章）
  - 用户信息（头像、用户名、下拉菜单）
  - 登录/注册按钮（未登录时显示）

### 4.5 响应式设计

#### 4.5.1 断点设置
- 移动端: < 768px
- 平板端: 768px - 1024px
- 桌面端: > 1024px

#### 4.5.2 响应式策略
- 使用CSS Grid和Flexbox布局
- 使用媒体查询调整布局
- 移动端隐藏侧边栏，改为顶部筛选
- 调整字体大小和间距

## 5. 安全设计

### 5.1 认证与授权
- 使用JWT进行无状态认证
- Token有效期7天，可配置
- 密码使用bcrypt加密，盐值10轮
- 基于角色的访问控制（RBAC）

### 5.2 数据验证
- 前端表单验证
- 后端参数验证
- SQL注入防护（使用参数化查询）
- XSS防护（内容转义）

### 5.3 CORS配置
- 配置允许的源（开发环境：localhost:5173）
- 支持凭证传递

### 5.4 错误处理
- 统一的错误响应格式
- 不暴露敏感信息
- 记录错误日志

## 6. 性能优化

### 6.1 数据库优化
- 合理创建索引
- 使用连接池
- 分页查询
- 避免N+1查询

### 6.2 前端优化
- 路由懒加载
- 组件按需加载
- 图片懒加载
- 浏览器缓存

### 6.3 API优化
- 响应数据精简
- 批量查询
- 缓存热点数据

## 7. 扩展性设计

### 7.1 功能扩展点
- 富文本编辑器集成
- 图片上传功能
- 文章点赞功能
- 用户关注功能
- 邮件通知功能
- 数据统计功能

### 7.2 技术扩展
- 支持Redis缓存
- 支持Elasticsearch搜索
- 支持消息队列
- 支持微服务架构

## 8. 部署建议

### 8.1 开发环境
- 使用nodemon热重载
- 使用Vite开发服务器
- 使用PostgreSQL本地实例

### 8.2 生产环境
- 使用PM2管理Node进程
- 使用Nginx反向代理
- 使用PostgreSQL云服务
- 配置HTTPS
- 配置CDN加速静态资源
- 配置日志收集和监控