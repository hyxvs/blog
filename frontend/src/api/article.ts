import request from '@/utils/request'
import type { Article, ArticleListResponse, ArticleStatus } from '@/types'

interface GetArticlesParams {
  page?: number
  limit?: number
  all?: boolean
  category?: number
  tag?: number
  keyword?: string
  sort?: string
  authorId?: number
  status?: ArticleStatus | 'all'
}

type ArticlePayload = {
  title: string
  content: string
  categoryId?: number
  tags?: string[]
  coverImage?: string | null
  summary?: string
  status?: ArticleStatus
  scheduledPublishAt?: string | null
}

type ArticleListApiResponse = {
  articles?: Article[]
  pagination?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
  data?: Article[]
  total?: number
  page?: number
  limit?: number
}

function normalizeArticleListResponse(response: ArticleListApiResponse): ArticleListResponse {
  const articles = Array.isArray(response.articles)
    ? response.articles
    : Array.isArray(response.data)
      ? response.data
      : []

  const page = response.pagination?.page ?? response.page ?? 1
  const limit = response.pagination?.limit ?? response.limit ?? articles.length ?? 0
  const total = response.pagination?.total ?? response.total ?? articles.length

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: response.pagination?.totalPages,
    },
    data: articles,
    total,
    page,
    limit,
  }
}

export const getArticles = async (params?: GetArticlesParams): Promise<ArticleListResponse> => {
  const response = await request.get('/articles', { params }) as ArticleListApiResponse
  return normalizeArticleListResponse(response)
}

export const getArticleById = (id: number | string): Promise<Article> => {
  return request.get(`/articles/${id}`)
}

export const createArticle = (data: ArticlePayload): Promise<Article> => {
  return request.post('/articles', data)
}

export const updateArticle = (id: number | string, data: Partial<ArticlePayload>): Promise<Article> => {
  return request.put(`/articles/${id}`, data)
}

export const deleteArticle = (id: number): Promise<void> => {
  return request.delete(`/articles/${id}`)
}

export const likeArticle = (id: number): Promise<{ liked: boolean; message: string }> => {
  return request.post(`/articles/${id}/like`)
}

export const getArticleLikes = (id: number): Promise<{ likeCount: number; isLiked: boolean }> => {
  return request.get(`/articles/${id}/likes`)
}

export const getArticleTrend = (params?: { period?: 'day' | 'week' | 'month' | 'year'; limit?: number }): Promise<{ period: string; data: { dates: string[]; counts: number[] } }> => {
  return request.get('/articles/stats/trend', { params })
}

export const getPublicStats = (): Promise<{ articleCount: number; categoryCount: number; commentCount: number; tagCount: number }> => {
  return request.get('/articles/stats/public')
}

export const uploadArticleImage = (formData: FormData): Promise<{
  code: number
  msg: string
  data: {
    errFiles: string[]
    succMap: Record<string, string>
  }
}> => {
  return request.post('/articles/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const uploadArticleCover = (formData: FormData): Promise<{
  coverImage: string
  coverPath?: string
  filename: string
  originalName: string
}> => {
  return request.post('/articles/upload-cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const incrementViewCount = (id: number | string): Promise<{ viewCount: number }> => {
  return request.post(`/articles/${id}/views`)
}
