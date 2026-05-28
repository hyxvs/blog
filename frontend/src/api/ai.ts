import request from '@/utils/request'

export function generateArticle(data: unknown): Promise<unknown> {
  return request.post('/ai/generate-article', data)
}

export function generateSummary(data: unknown): Promise<unknown> {
  return request.post('/ai/generate-summary', data)
}

export function generateReply(data: unknown): Promise<unknown> {
  return request.post('/ai/generate-reply', data)
}

export function optimizeContent(data: unknown): Promise<unknown> {
  return request.post('/ai/optimize-content', data)
}

export function generateCommentReply(data: unknown): Promise<unknown> {
  return request.post('/ai/comment-reply', data)
}

export function getRelatedArticles(articleId: number): Promise<unknown> {
  return request.get(`/ai/recommend-articles/${articleId}`)
}

export function generateCommentSuggestion(articleId: number): Promise<unknown> {
  return request.get(`/ai/comment-suggestions/${articleId}`)
}

export function analyzeSentiment(data: unknown): Promise<unknown> {
  return request.post('/ai/analyze-sentiment', data)
}

export function moderateContent(data: unknown): Promise<unknown> {
  return request.post('/ai/moderate-content', data)
}

export function recommendTags(data: unknown): Promise<unknown> {
  return request.post('/ai/recommend-tags', data)
}

export function suggestTitle(data: unknown): Promise<unknown> {
  return request.post('/ai/suggest-title', data)
}

export function smartSearch(data: unknown): Promise<unknown> {
  return request.post('/ai/smart-search', data)
}

export function getTrendingTopics(): Promise<unknown> {
  return request.get('/ai/trending-topics')
}

export function analyzeWritingStyle(userId: number): Promise<unknown> {
  return request.get(`/ai/writing-style/${userId}`)
}

export function getReadingRecommendations(userId: number): Promise<unknown> {
  return request.get(`/ai/reading-recommendations/${userId}`)
}

export function chat(data: unknown): Promise<unknown> {
  return request.post('/ai/chat', data)
}

export interface ChatContext {
  type: string
  name: string
  systemPrompt: string
}

export interface StreamChatParams {
  message: string
  history: Array<{ role: string; content: string }>
  sessionId?: string
  contextType?: string
  model?: string
}

export function streamChat(params: StreamChatParams): EventSource {
  const queryParams = new URLSearchParams({
    message: params.message,
    history: JSON.stringify(params.history),
    sessionId: params.sessionId || 'default',
    contextType: params.contextType || 'general'
  })

  const eventSource = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/ai/chat/stream?${queryParams}`)
  return eventSource
}

export function chatStream(params: StreamChatParams): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const url = `${import.meta.env.VITE_API_BASE_URL}/ai/chat/stream`

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        })

        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        const read = async () => {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }
          const chunk = decoder.decode(value, { stream: true })
          controller.enqueue(value)
          read()
        }

        read()
      } catch (error) {
        console.error('Stream error:', error)
        controller.close()
      }
    }
  })

  return Promise.resolve(stream.getReader())
}

export async function fetchStreamChat(
  params: StreamChatParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    const handleEventBlock = (eventBlock: string) => {
      const payload = eventBlock
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
        .trim()

      if (!payload) {
        return
      }

      try {
        const data = JSON.parse(payload)

        if (typeof data.content === 'string' && data.content.length > 0) {
          onChunk(data.content)
        }

        if (data.done) {
          onDone?.()
        }

        if (data.error) {
          onError?.(new Error(data.error))
        }
      } catch (error) {
        console.error('Parse error:', error)
      }
    }

    while (true) {
      const { done, value } = await reader.read()

      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      buffer = buffer.replace(/\r\n/g, '\n')

      let boundaryIndex = buffer.indexOf('\n\n')
      while (boundaryIndex !== -1) {
        const eventBlock = buffer.slice(0, boundaryIndex)
        buffer = buffer.slice(boundaryIndex + 2)
        handleEventBlock(eventBlock)
        boundaryIndex = buffer.indexOf('\n\n')
      }

      if (done) {
        break
      }
    }

    if (buffer.trim()) {
      handleEventBlock(buffer)
    }
  } catch (error) {
    onError?.(error as Error)
  }
}

// ==================== 流式 AI 功能 API ====================

export interface StreamArticleParams {
  topic: string
  keywords?: string
  length?: number
  model?: string
}

export async function fetchStreamArticle(
  params: StreamArticleParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch('/api/ai/generate-article/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        topic: params.topic,
        keywords: params.keywords,
        length: params.length || 500,
        model: params.model || 'ollama'
      })
    })

    await processStreamResponse(response, onChunk, onDone, onError)
  } catch (error) {
    onError?.(error as Error)
  }
}

export interface StreamSummaryParams {
  content: string
  length?: number
  model?: string
}

export async function fetchStreamSummary(
  params: StreamSummaryParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch('/api/ai/generate-summary/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        content: params.content,
        length: params.length || 150,
        model: params.model || 'ollama'
      })
    })

    await processStreamResponse(response, onChunk, onDone, onError)
  } catch (error) {
    onError?.(error as Error)
  }
}

export interface StreamReplyParams {
  message: string
  context?: string
  model?: string
}

export async function fetchStreamReply(
  params: StreamReplyParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch('/api/ai/generate-reply/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        message: params.message,
        context: params.context,
        model: params.model || 'ollama'
      })
    })

    await processStreamResponse(response, onChunk, onDone, onError)
  } catch (error) {
    onError?.(error as Error)
  }
}

export interface StreamOptimizeParams {
  content: string
  type?: string
  model?: string
}

export async function fetchStreamOptimize(
  params: StreamOptimizeParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch('/api/ai/optimize-content/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        content: params.content,
        type: params.type || 'general',
        model: params.model || 'ollama'
      })
    })

    await processStreamResponse(response, onChunk, onDone, onError)
  } catch (error) {
    onError?.(error as Error)
  }
}

export interface StreamContinueParams {
  content: string
  length?: number
  model?: string
}

export async function fetchStreamContinue(
  params: StreamContinueParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch('/api/ai/continue-writing/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        content: params.content,
        length: params.length || 300,
        model: params.model || 'ollama'
      })
    })

    await processStreamResponse(response, onChunk, onDone, onError)
  } catch (error) {
    onError?.(error as Error)
  }
}

async function processStreamResponse(
  response: Response,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  const handleEventBlock = (eventBlock: string) => {
    const payload = eventBlock
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
      .trim()

    if (!payload) {
      return
    }

    try {
      const data = JSON.parse(payload)

      if (typeof data.content === 'string' && data.content.length > 0) {
        onChunk(data.content)
      }

      if (data.done) {
        onDone?.()
      }

      if (data.error) {
        onError?.(new Error(data.error))
      }
    } catch (error) {
      console.error('Parse error:', error)
    }
  }

  while (true) {
    const { done, value } = await reader.read()

    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    buffer = buffer.replace(/\r\n/g, '\n')

    let boundaryIndex = buffer.indexOf('\n\n')
    while (boundaryIndex !== -1) {
      const eventBlock = buffer.slice(0, boundaryIndex)
      buffer = buffer.slice(boundaryIndex + 2)
      handleEventBlock(eventBlock)
      boundaryIndex = buffer.indexOf('\n\n')
    }

    if (done) {
      break
    }
  }

  if (buffer.trim()) {
    handleEventBlock(buffer)
  }
}

export function getContexts(): Promise<{ data: { contexts: ChatContext[] } }> {
  return request.get('/ai/contexts')
}

export function analyzeFile(data: { fileContent: string; fileName: string }): Promise<unknown> {
  return request.post('/ai/analyze-file', data)
}

export function generateOutline(data: { topic: string; keywords?: string }): Promise<unknown> {
  return request.post('/ai/generate-outline', data)
}

export function continueWriting(data: { content: string; maxLength?: number }): Promise<unknown> {
  return request.post('/ai/continue-writing', data)
}

export function polishContent(data: { content: string; style?: string }): Promise<unknown> {
  return request.post('/ai/polish-content', data)
}

export function seoOptimization(data: { content: string; title?: string }): Promise<unknown> {
  return request.post('/ai/seo-optimization', data)
}

export function uploadAndAnalyze(file: File): Promise<unknown> {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/ai/upload-analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function generateFromImage(data: { imageDescription: string; instruction?: string }): Promise<unknown> {
  return request.post('/ai/generate-from-image', data)
}

export function searchUnsplash(data: { query: string; perPage?: number }): Promise<unknown> {
  return request.post('/ai/search-unsplash', data)
}

export interface UnsplashImage {
  id: string
  urls: {
    thumb: string
    small: string
    regular: string
    full: string
  }
  alt_description: string
  user: { name: string; links?: { html: string } }
  width?: number
  height?: number
  color?: string
  likes?: number
}

export interface CoverRecommendResponse {
  images: UnsplashImage[]
  searchQuery?: string
  totalResults?: number
  message?: string
}

export function recommendCoverImage(data: { title?: string; content?: string; query?: string }): Promise<{ data: CoverRecommendResponse }> {
  return request.post('/ai/recommend-cover', data)
}
