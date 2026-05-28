import request from '@/utils/request'

export const searchArticles = async (params: {
  keyword?: string
  category?: string
  tag?: string
  page?: number
  limit?: number
}): Promise<unknown> => {
  try {
    const response = await request.get('/documents/search', { params })
    return response
  } catch (error) {
    console.error('搜索文章失败:', error)
    throw error
  }
}

export const recommendArticles = async (articleId: number, limit = 3): Promise<unknown> => {
  try {
    const response = await request.get(`/documents/recommend/${articleId}/${limit}`)
    return response
  } catch (error) {
    console.error('推荐文章失败:', error)
    throw error
  }
}

export const generateSummary = async (articleId: number, length = 200): Promise<unknown> => {
  try {
    const response = await request.post(`/documents/summary/${articleId}/${length}`)
    return response
  } catch (error) {
    console.error('生成摘要失败:', error)
    throw error
  }
}

export const getArticleStats = async (articleId: number): Promise<unknown> => {
  try {
    const response = await request.get(`/documents/stats/${articleId}`)
    return response
  } catch (error) {
    console.error('获取文章统计失败:', error)
    throw error
  }
}

export const splitArticle = async (articleId: number): Promise<unknown> => {
  try {
    const response = await request.post(`/documents/split/${articleId}`)
    return response
  } catch (error) {
    console.error('分割文章失败:', error)
    throw error
  }
}

export const splitArticles = async (): Promise<unknown> => {
  try {
    const response = await request.post('/documents/split-batch')
    return response
  } catch (error) {
    console.error('批量分割文章失败:', error)
    throw error
  }
}
