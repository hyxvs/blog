export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  avatar?: string
  nickname?: string
  createdAt?: string
  bio?: string
  lastLogin?: string
}

export type ArticleStatus = 'published' | 'draft' | 'scheduled'

export interface Article {
  id: number
  title: string
  content: string
  summary?: string
  coverImage?: string
  author?: User
  authorId?: number
  authorName?: string
  authorAvatar?: string
  category?: Category
  categoryId?: number
  categoryName?: string
  tags: Tag[]
  likeCount?: number
  viewCount?: number
  commentCount?: number
  createdAt: string
  updatedAt?: string
  scheduledPublishAt?: string | null
  status?: ArticleStatus
}

export interface Category {
  id: number
  name: string
  description?: string
  articleCount?: number
  sortOrder?: number
}

export interface Tag {
  id: number
  name: string
  description?: string
  articleCount?: number
}

export interface Comment {
  id: number
  content: string
  articleId: number
  userId: number
  parentId?: number
  user: User
  createdAt: string
  replies?: Comment[]
}

export interface Notification {
  id: number
  userId?: number
  type?: string
  content: string
  read: boolean
  createdAt: string
}

export interface SignStatus {
  todaySigned: boolean
  consecutiveDays: number
  totalSigns: number
}

export interface UserStats {
  articleCount: number
  viewCount: number
  likeCount: number
  followerCount: number
  followingCount: number
  commentCount: number
}

export interface LoginResponse {
  user: User
  token: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ArticleListResponse extends PaginatedResponse<Article> {
  articles: Article[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}
