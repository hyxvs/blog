import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const loadingCount = ref(0)
  const loadingText = ref('加载中...')
  const loadingType = ref<'spinner' | 'progress'>('spinner')
  const loadingProgress = ref(0)
  
  const isLoading = computed(() => loadingCount.value > 0)
  
  const startLoading = (options: { text?: string; type?: 'spinner' | 'progress' } = {}) => {
    loadingCount.value++
    if (options.text) {
      loadingText.value = options.text
    }
    if (options.type) {
      loadingType.value = options.type
    }
    loadingProgress.value = 0
  }
  
  const endLoading = () => {
    if (loadingCount.value > 0) {
      loadingCount.value--
    }
    if (loadingCount.value === 0) {
      loadingProgress.value = 0
    }
  }
  
  const setProgress = (progress: number) => {
    loadingProgress.value = Math.min(Math.max(progress, 0), 100)
  }
  
  const setText = (text: string) => {
    loadingText.value = text
  }
  
  const forceStop = () => {
    loadingCount.value = 0
    loadingProgress.value = 0
  }
  
  return {
    loadingCount,
    loadingText,
    loadingType,
    loadingProgress,
    isLoading,
    startLoading,
    endLoading,
    setProgress,
    setText,
    forceStop
  }
})
