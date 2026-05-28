import request from '@/utils/request'
import type { Comment, PaginatedResponse } from '@/types'

export const getComments = (articleId: number, params?: { page?: number; limit?: number; sort?: string }): Promise<PaginatedResponse<Comment>> => {
  return request.get(`/comments/article/${articleId}`, { params })
}

export const createComment = (data: { articleId: number; content: string; parentId?: number }): Promise<Comment> => {
  return request.post('/comments', data)
}

export const deleteComment = (id: number): Promise<void> => {
  return request.delete(`/comments/${id}`)
}
