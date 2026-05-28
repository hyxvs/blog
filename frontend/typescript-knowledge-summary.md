# TypeScript 知识点详解

基于博客平台项目代码，系统讲解 TypeScript 核心知识点。

---

## 目录

1. [基础类型](#1-基础类型)
2. [接口](#2-接口)
3. [联合类型与字面量类型](#3-联合类型与字面量类型)
4. [泛型](#4-泛型)
5. [类型别名](#5-类型别名)
6. [类型导入](#6-类型导入)
7. [可选属性](#7-可选属性)
8. [工具类型](#8-工具类型)
9. [函数类型](#9-函数类型)
10. [类型断言](#10-类型断言)
11. [unknown 类型](#11-unknown-类型)
12. [模块系统](#12-模块系统)
13. [TypeScript 配置](#13-typescript-配置)

---

## 1. 基础类型

TypeScript 提供了 JavaScript 的所有基本类型，并添加了额外的类型。

### 1.1 常用基础类型

```typescript
// 字符串
const username: string = '张三'

// 数字
const id: number = 1

// 布尔值
const isAdmin: boolean = true

// 数组
const numbers: number[] = [1, 2, 3]

// 元组 - 固定长度和类型的数组
const user: [number, string] = [1, '张三']

// 空值
function logMessage(): void {
  console.log('Hello')
}

// 任意类型（尽量避免使用）
let anyValue: any = 'hello'
anyValue = 123
```

### 1.2 项目中的应用

```typescript
// src/types/index.ts
export interface User {
  id: number          // 数字类型
  username: string    // 字符串类型
  email: string       // 字符串类型
  role: 'admin' | 'user'
  avatar?: string     // 可选字符串
  createdAt?: string  // 可选字符串
}
```

---

## 2. 接口

接口是 TypeScript 中定义对象结构的核心方式。

### 2.1 接口定义

```typescript
interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  avatar?: string      // 可选属性
  nickname?: string
  createdAt?: string   // 可选属性
}
```

### 2.2 接口继承

```typescript
interface BaseEntity {
  id: number
  createdAt: string
  updatedAt?: string
}

interface Article extends BaseEntity {
  title: string
  content: string
  author: User
}
```

### 2.3 项目中的实际应用

```typescript
// src/types/index.ts
export interface Article {
  id: number
  title: string
  content: string
  summary?: string           // 可选属性
  coverImage?: string        // 可选属性
  author: User               // 嵌套接口类型
  category?: Category        // 可选嵌套类型
  tags: Tag[]                // 接口数组
  likeCount: number
  viewCount: number
  commentCount: number
  createdAt: string
  updatedAt?: string
  status?: 'published' | 'draft'
}
```

---

## 3. 联合类型与字面量类型

### 3.1 联合类型

联合类型表示一个值可以是几种类型之一，使用 `|` 分隔。

```typescript
type Role = 'admin' | 'user'

interface User {
  role: Role
}

// 函数参数联合类型
function login(credentials: { username?: string; email?: string; password: string }) {
  // username 和 email 都是可选的，但至少提供一个
}
```

### 3.2 字面量类型

字面量类型允许你指定一个值必须是特定的字符串、数字或布尔值。

```typescript
// 字符串字面量
type Status = 'published' | 'draft'

// 数字字面量
type HttpStatus = 200 | 400 | 401 | 403 | 500

// 布尔字面量
type Flag = true | false
```

### 3.3 项目中的应用

```typescript
// src/stores/theme.ts
type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    themeMode: (localStorage.getItem('themeMode') as ThemeMode) || 'light',
  })
})
```

---

## 4. 泛型

泛型允许你编写可重用的组件，同时保持类型安全。

### 4.1 泛型接口

```typescript
// src/types/index.ts
export interface PaginatedResponse<T> {
  data: T[]      // T 是类型参数
  total: number
  page: number
  limit: number
}
```

### 4.2 泛型函数

```typescript
// 通用的包装函数
function wrap<T>(value: T): { data: T } {
  return { data: value }
}

// 使用
const wrappedUser = wrap<User>(user)
const wrappedArticles = wrap<Article[]>(articles)
```

### 4.3 项目中的应用

```typescript
// src/api/article.ts
export const getArticles = (params?: GetArticlesParams): Promise<PaginatedResponse<Article>> => {
  return request.get('/articles', { params })
}
```

这里 `PaginatedResponse<Article>` 表示返回的数据结构是分页响应，其中 `data` 字段是 `Article` 类型的数组。

---

## 5. 类型别名

类型别名允许你为类型创建新名称。

### 5.1 基本用法

```typescript
type Role = 'admin' | 'user'
type ThemeMode = 'light' | 'dark'
type StringOrNumber = string | number
```

### 5.2 与接口的区别

| 特性 | 接口 | 类型别名 |
|------|------|----------|
| 继承 | 支持 extends | 不支持，但可以交叉类型 |
| 声明合并 | 支持 | 不支持 |
| 联合类型 | 不支持 | 支持 |
| 元组 | 不支持 | 支持 |

### 5.3 项目中的应用

```typescript
// src/stores/theme.ts
type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    themeMode: (localStorage.getItem('themeMode') as ThemeMode) || 'light',
    followSystem: localStorage.getItem('followSystem') === 'true' || false
  })
})
```

---

## 6. 类型导入

TypeScript 提供了专门的类型导入语法，有助于优化打包。

### 6.1 语法

```typescript
// 仅导入类型
import type { User, Article } from '@/types'

// 同时导入值和类型
import { defineStore } from 'pinia'
import type { User } from '@/types'
```

### 6.2 项目中的应用

```typescript
// src/api/user.ts
import request from '@/utils/request'
import type { User, LoginResponse, SignStatus, UserStats, Notification } from '@/types'

export const register = (data: { username: string; email: string; password: string }): Promise<LoginResponse> => {
  return request.post('/users/register', data)
}
```

---

## 7. 可选属性

在接口中，使用 `?` 标记属性为可选。

### 7.1 语法

```typescript
interface User {
  id: number
  username: string
  email: string
  avatar?: string    // 可选属性
  nickname?: string  // 可选属性
}
```

### 7.2 项目中的应用

```typescript
// src/types/index.ts
export interface Category {
  id: number
  name: string
  description?: string    // 可选描述
  articleCount?: number   // 可选文章数量
  sortOrder?: number      // 可选排序
}
```

---

## 8. 工具类型

TypeScript 提供了内置的工具类型来帮助处理类型转换。

### 8.1 Partial

将所有属性变为可选。

```typescript
interface User {
  id: number
  username: string
  email: string
}

// 所有属性变为可选
type PartialUser = Partial<User>
// { id?: number; username?: string; email?: string }
```

### 8.2 项目中的应用

```typescript
// src/api/user.ts
export const updateProfile = (data: Partial<User>): Promise<User> => {
  return request.put('/users/profile', data)
}

// src/stores/user.ts
async updateProfileAction(data: Partial<User>) {
  const response = await updateProfile(data)
  this.user = response
}
```

### 8.3 其他常用工具类型

```typescript
// Required<T> - 将所有属性变为必需
type RequiredUser = Required<Partial<User>>

// Readonly<T> - 将所有属性变为只读
type ReadonlyUser = Readonly<User>

// Pick<T, K> - 选取特定属性
type UserBasic = Pick<User, 'id' | 'username'>

// Omit<T, K> - 排除特定属性
type UserWithoutId = Omit<User, 'id'>
```

---

## 9. 函数类型

TypeScript 提供了强大的函数类型定义。

### 9.1 函数返回类型

```typescript
// 明确返回类型
function add(a: number, b: number): number {
  return a + b
}

// 异步函数返回 Promise
async function fetchUser(): Promise<User> {
  const response = await request.get('/users/profile')
  return response
}
```

### 9.2 箭头函数类型

```typescript
const multiply = (a: number, b: number): number => a * b

const getUser = async (): Promise<User> => {
  return await request.get('/users/profile')
}
```

### 9.3 项目中的应用

```typescript
// src/api/article.ts
export const createArticle = (data: {
  title: string
  content: string
  categoryId?: number
  tagIds?: number[]
  coverImage?: string
  summary?: string
}): Promise<Article> => {
  return request.post('/articles', data)
}
```

---

## 10. 类型断言

类型断言允许你告诉 TypeScript 编译器某个值的类型。

### 10.1 语法

```typescript
// 方式一：尖括号语法
const value: any = 'hello'
const length: number = (<string>value).length

// 方式二：as 语法（推荐）
const length: number = (value as string).length
```

### 10.2 项目中的应用

```typescript
// src/utils/request.ts
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  startTime?: number
  noLoading?: boolean
  loadingText?: string
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 类型断言：将 config 断言为 CustomRequestConfig
    (config as CustomRequestConfig).startTime = Date.now()
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    const customConfig = config as CustomRequestConfig
    if (!customConfig.noLoading) {
      const loadingStore = useLoadingStore()
      loadingStore.startLoading({
        text: customConfig.loadingText || '加载中...'
      })
    }
    
    return config
  }
)
```

---

## 11. unknown 类型

`unknown` 是类型安全的 `any`，需要类型检查或断言后才能使用。

### 11.1 用法

```typescript
let value: unknown

value = 'hello'
value = 123
value = { name: '张三' }

// 使用前需要类型检查
if (typeof value === 'string') {
  console.log(value.toUpperCase())
}

if (typeof value === 'number') {
  console.log(value + 1)
}
```

### 11.2 项目中的应用

```typescript
// src/stores/user.ts
interface UserStoreState {
  activities: unknown[]        // 未知类型数组
  recentArticles: unknown[]    // 未知类型数组
}

async getActivitiesAction() {
  const response = await getActivities()
  // 需要类型检查
  this.activities = Array.isArray(response) ? response : response.data
  return response
}
```

---

## 12. 模块系统

TypeScript 使用 ES 模块系统。

### 12.1 导出

```typescript
// 命名导出
export interface User {
  id: number
  username: string
}

export const getUser = () => { /* ... */ }

// 默认导出
export default function login() { /* ... */ }
```

### 12.2 导入

```typescript
// 导入命名导出
import { User, getUser } from './types'

// 导入默认导出
import login from './auth'

// 重命名导入
import { getUser as fetchUser } from './api'

// 导入所有导出
import * as api from './api'

// 路径别名导入（需要配置 tsconfig.json）
import { User } from '@/types'
```

### 12.3 项目中的应用

```typescript
// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')  // 懒加载
  }
]
```

---

## 13. TypeScript 配置

`tsconfig.json` 是 TypeScript 项目的核心配置文件。

### 13.1 关键配置项

```json
{
  "compilerOptions": {
    "target": "ESNext",                    // 目标 ECMAScript 版本
    "module": "ESNext",                    // 模块系统
    "moduleResolution": "bundler",         // 模块解析策略
    "strict": true,                        // 启用严格模式
    "jsx": "preserve",                     // JSX 处理方式
    "resolveJsonModule": true,             // 允许导入 JSON
    "isolatedModules": true,               // 确保每个文件都是独立模块
    "esModuleInterop": true,               // 兼容 CommonJS 模块
    "lib": ["ESNext", "DOM", "DOM.Iterable"],  // 包含的标准库
    "skipLibCheck": true,                  // 跳过库类型检查
    "noEmit": true,                        // 不生成编译输出（由构建工具处理）
    "baseUrl": ".",                        // 基础路径
    "paths": {                             // 路径别名
      "@/*": ["./src/*"]
    },
    "types": ["node", "vite/client"]       // 包含的类型声明
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],  // 包含的文件
  "references": [{ "path": "./tsconfig.node.json" }]  // 引用其他配置
}
```

### 13.2 路径别名配置

通过 `paths` 配置，可以使用简洁的路径别名：

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

使用示例：

```typescript
// 配置前
import { User } from '../../types'

// 配置后
import { User } from '@/types'
```

---

## 总结

本项目涵盖了 TypeScript 的核心知识点：

| 知识点 | 应用场景 |
|--------|----------|
| 接口 | 定义数据结构（User, Article, Category） |
| 联合类型 | 限制取值范围（role: 'admin' \| 'user'） |
| 泛型 | 分页响应（PaginatedResponse<T>） |
| 类型别名 | 简化复杂类型（ThemeMode） |
| 工具类型 | Partial 更新操作 |
| 类型断言 | 扩展第三方库类型（CustomRequestConfig） |
| unknown | 处理不确定类型的数据 |
| 模块系统 | 组织代码结构 |

掌握这些知识点，可以编写出类型安全、可维护的高质量代码。


TypeScript 的知识体系非常庞大且精密，为了让你能更系统、全方位地掌握，这里将其核心知识点重新梳理为 **10大核心板块**。这份全景图涵盖了从底层逻辑到高阶实战的完整路径：

### 🧱 核心一：基础认知与工程化环境
*   **TS 与 JS 的关系**：理解 TypeScript 是 JavaScript 的超集，核心在于添加了静态类型系统，最终需编译为 JS 运行。
*   **环境搭建与配置**：全局安装 `typescript`，核心在于掌握 `tsconfig.json` 配置文件（包括编译目标 `target`、模块规范 `module`、严格模式 `strict` 等）。
*   **类型推断与注解**：理解 TS 自动推导变量类型的能力，并掌握何时需要显式使用 `: type` 进行类型注解。

### 🧩 核心二：基础类型系统
*   **原始类型**：`string`、`number`、`boolean`、`null`、`undefined`。
*   **特殊类型**：
    *   `any`（任意类型，绕过检查）、`unknown`（类型安全的 `any`）、`void`（无返回值）、`never`（永不存在的值，如死循环或抛错）。
    *   `object` 与 `Function` 类型。
*   **复合类型**：数组（`Array<T>` 或 `T[]`）、元组 `Tuple`（固定长度和类型的数组）、枚举 `Enum`（数字枚举、字符串枚举、异构枚举）。

### 🛠️ 核心三：类型操作与类型别名
*   **类型别名 (Type Alias)**：使用 `type` 关键字为类型起别名，常用于定义联合类型、交叉类型等。
*   **联合类型与交叉类型**：`A | B`（满足其一即可）与 `A & B`（同时满足所有成员）。
*   **类型断言**：使用 `as` 或 `<>` 语法，手动指定一个值的类型（告诉编译器“相信我，我知道我在做什么”）。
*   **字面量类型**：精确约束值为某个具体的字符串或数字（如 `type Direction = 'up' | 'down'`）。

### 📐 核心四：接口（Interface）与对象类型
*   **接口基础**：定义对象的形状，支持可选属性 `?`、只读属性 `readonly`。
*   **索引签名**：处理动态属性（如 `[key: string]: any`）。
*   **接口扩展与合并**：接口可以通过 `extends` 继承其他接口或类；同名接口在 TS 中会自动合并（声明合并）。
*   **Interface vs Type**：掌握两者的区别与最佳实践（如接口适合定义对象结构并支持扩展，类型别名适合联合类型和复杂映射）。

### ⚙️ 核心五：函数类型系统
*   **函数定义**：为参数和返回值添加类型约束，支持箭头函数与函数表达式的类型定义。
*   **参数处理**：可选参数 `?`、默认参数、剩余参数 `...args` 的类型写法。
*   **函数重载**：在 TS 中为同一个函数提供多个函数类型定义，以处理不同参数组合的调用场景。
*   **this 指向**：在函数中显式声明 `this` 的类型，解决 JS 中 `this` 隐式绑定的痛点。

### 🏗️ 核心六：类（Class）与面向对象
*   **类成员修饰符**：`public`（公开）、`private`（私有）、`protected`（受保护）。
*   **类的高级特性**：参数属性（在构造函数中直接声明成员）、存取器 `get/set`、静态成员 `static`、抽象类 `abstract`。
*   **类的继承与实现**：使用 `extends` 继承父类，使用 `implements` 显式实现一个或多个接口的约束。

### 🔄 核心七：泛型（Generics）
*   **泛型基础**：在定义函数、接口或类时不预先指定具体类型，而在使用时再指定（如 `<T>`），极大提高代码复用性。
*   **泛型约束**：使用 `extends` 限制泛型的范围（如 `<T extends { length: number }>`），确保泛型具备某些属性。
*   **泛型接口与泛型类**：将泛型应用在接口和类的定义中。
*   **泛型工具类型**：TS 内置的常用泛型，如 `Partial<T>`（属性全可选）、`Required<T>`（属性全必填）、`Pick<T, K>`（挑选属性）、`Omit<T, K>`（剔除属性）、`Record<K, T>`（键值对映射）、`ReturnType<T>`（获取返回值类型）等。

### 🛡️ 核心八：类型缩小与类型守卫
*   **类型缩小**：在代码运行过程中，将宽泛的类型收窄为更具体的类型。
*   **常见类型守卫**：使用 `typeof`、`instanceof`、`in` 操作符进行判断。
*   **真值与等值缩小**：通过 `if (data)` 或 `a === b` 等逻辑判断自动缩小类型范围。
*   **自定义类型守卫**：编写返回类型谓词（如 `arg is string`）的函数，实现复杂的类型判断逻辑。

### 🧠 核心九：高级类型与类型编程
*   **索引查询与访问**：使用 `keyof T` 获取对象的所有键，使用 `T[K]` 访问对象特定键的值类型。
*   **映射类型**：基于旧类型通过遍历键来创建新类型（如 `{ [P in keyof T]: ... }`）。
*   **条件类型**：类似三元运算符的类型判断（`T extends U ? X : Y`），是类型编程的基础。
*   **类型推断 infer**：在条件类型中配合 `infer` 关键字，提取出泛型中的特定部分（如提取函数参数或返回值类型）。

### 🚀 核心十：模块化与工程化实战
*   **模块系统**：支持 ES Module (`import/export`) 和 CommonJS 规范。
*   **命名空间 (Namespace)**：TS 特有的内部模块组织方式（现代开发中更推荐使用 ES 模块）。
*   **声明文件 (.d.ts)**：为原生 JS 库或第三方库编写类型描述文件，使其支持 TS 的类型检查与智能提示。
*   **装饰器 (Decorators)**：一种特殊的类声明，用于在不修改源码的情况下扩展类、方法或属性的行为（常用于框架开发，如 NestJS、Angular）。

这 10 大核心板块基本覆盖了 TypeScript 从入门到精通的全部知识脉络。建议在学习时，按照这个顺序逐步攻克，并结合实际项目代码进行练习。
