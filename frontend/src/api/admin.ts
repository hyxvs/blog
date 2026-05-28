import request from '@/utils/request'
import type { User, Article, Tag, Category } from '@/types'

export const getAdminStats = (): Promise<unknown> => {
  return request.get('/admin/stats')
}

export const getRecentActivities = (): Promise<unknown> => {
  return request.get('/admin/activities')
}

export const getUsers = (params?: { page?: number; limit?: number }): Promise<{ data: User[]; total: number }> => {
  return request.get('/admin/users', { params })
}

export const updateUserRole = (userId: number, data: { role: 'admin' | 'user' }): Promise<void> => {
  return request.put(`/admin/users/${userId}/role`, data)
}

export const deleteUser = (userId: number): Promise<void> => {
  return request.delete(`/admin/users/${userId}`)
}

export const getAdminArticles = (params?: { page?: number; limit?: number }): Promise<{ data: Article[]; total: number }> => {
  return request.get('/admin/articles', { params })
}

export const toggleArticleStatus = (articleId: number, data: { status: 'published' | 'draft' }): Promise<void> => {
  return request.put(`/admin/articles/${articleId}/status`, data)
}

export const deleteArticle = (articleId: number): Promise<void> => {
  return request.delete(`/admin/articles/${articleId}`)
}

export const getTags = (params?: { page?: number; limit?: number }): Promise<{ data: Tag[]; total: number }> => {
  return request.get('/admin/tags', { params })
}

export const createTag = (data: { name: string; description?: string }): Promise<Tag> => {
  return request.post('/admin/tags', data)
}

export const updateTag = (tagId: number, data: { name?: string; description?: string }): Promise<Tag> => {
  return request.put(`/admin/tags/${tagId}`, data)
}

export const deleteTag = (tagId: number): Promise<void> => {
  return request.delete(`/admin/tags/${tagId}`)
}

export const getCategories = (params?: { page?: number; limit?: number }): Promise<{ data: Category[]; total: number }> => {
  return request.get('/admin/categories', { params })
}

export const createCategory = (data: { name: string; description?: string }): Promise<Category> => {
  return request.post('/admin/categories', data)
}

export const updateCategory = (categoryId: number, data: { name?: string; description?: string }): Promise<Category> => {
  return request.put(`/admin/categories/${categoryId}`, data)
}

export const deleteCategory = (categoryId: number): Promise<void> => {
  return request.delete(`/admin/categories/${categoryId}`)
}

export const getCheckinRecords = (params?: { page?: number; limit?: number }): Promise<unknown> => {
  return request.get('/admin/checkins', { params })
}
