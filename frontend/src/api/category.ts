import request from '@/utils/request'
import type { Category } from '@/types'

type CategoryListResponse = Category[] | {
  categories?: Category[]
  data?: Category[]
}

export const getCategories = (): Promise<Category[]> => {
  return request.get('/categories').then((response: CategoryListResponse) => {
    if (Array.isArray(response)) {
      return response
    }

    if (Array.isArray(response.categories)) {
      return response.categories
    }

    if (Array.isArray(response.data)) {
      return response.data
    }

    return []
  })
}

export const getCategoryById = (id: number): Promise<Category> => {
  return request.get(`/categories/${id}`)
}

export const createCategory = (data: { name: string; description?: string }): Promise<Category> => {
  return request.post('/categories', data)
}

export const updateCategory = (id: number, data: { name?: string; description?: string }): Promise<Category> => {
  return request.put(`/categories/${id}`, data)
}

export const deleteCategory = (id: number): Promise<void> => {
  return request.delete(`/categories/${id}`)
}
