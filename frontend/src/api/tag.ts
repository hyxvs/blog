import request from '@/utils/request'
import type { Tag } from '@/types'

type TagListResponse = Tag[] | {
  tags?: Tag[]
  data?: Tag[]
}

export const getTags = (): Promise<Tag[]> => {
  return request.get('/tags').then((response: TagListResponse) => {
    if (Array.isArray(response)) {
      return response
    }

    if (Array.isArray(response.tags)) {
      return response.tags
    }

    if (Array.isArray(response.data)) {
      return response.data
    }

    return []
  })
}

export const getTagById = (id: number): Promise<Tag> => {
  return request.get(`/tags/${id}`)
}

export const createTag = (data: { name: string; description?: string }): Promise<Tag> => {
  return request.post('/tags', data)
}

export const updateTag = (id: number, data: { name?: string; description?: string }): Promise<Tag> => {
  return request.put(`/tags/${id}`, data)
}

export const deleteTag = (id: number): Promise<void> => {
  return request.delete(`/tags/${id}`)
}
