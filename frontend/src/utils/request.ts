import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useLoadingStore } from '@/stores/loading'
// extends是什么意思
// 它用于创建一个新的接口，该接口继承了InternalAxiosRequestConfig的所有属性和方法，同时添加了一些自定义的属性和方法
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  startTime?: number
  noLoading?: boolean
  loadingText?: string
}

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    (config as CustomRequestConfig).startTime = Date.now()
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    const customConfig = config as CustomRequestConfig
    if (!customConfig.noLoading) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.startLoading({
          text: customConfig.loadingText || '加载中...'
        })
      } catch (e) {
        console.warn('Failed to start loading:', e)
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as CustomRequestConfig
    
    if (config.startTime) {
      const endTime = Date.now()
      const duration = endTime - config.startTime
      console.log(`API请求耗时: ${duration}ms - ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    if (!config.noLoading) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.endLoading()
      } catch (e) {
        console.warn('Failed to end loading:', e)
      }
    }
    
    return response.data
  },
  (error) => {
    // 确保在错误时也结束加载状态
    const config = error.config as CustomRequestConfig
    if (!config?.noLoading) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.endLoading()
      } catch (e) {
        console.warn('Failed to end loading:', e)
      }
    }
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 403:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data.error || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default request
