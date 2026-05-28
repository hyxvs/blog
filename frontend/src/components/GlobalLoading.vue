<!--
  ============================================
  GlobalLoading.vue - 全局加载组件
  ============================================
  
  【知识点】全局加载组件：
  显示在页面顶部的加载进度条和全屏加载遮罩
  用于路由切换和全局数据加载
-->

<template>
  <!-- 顶部进度条 -->
  <div v-show="loadingStore.isLoading" class="global-loading">
    <div class="progress-bar-container">
      <div 
        class="progress-bar" 
        :style="{ width: `${loadingStore.loadingProgress}%` }"
        :class="{ 'indeterminate': loadingStore.loadingProgress === 0 }"
      ></div>
    </div>
    
    <!-- 全屏加载遮罩（可选） -->
    <div v-if="fullscreen" class="loading-overlay" @click.prevent>
      <LoadingSpinner 
        :type="loadingStore.loadingType" 
        :text="loadingStore.loadingText"
        size="large"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 【知识点】组件 props：
 * fullscreen: 是否显示全屏遮罩
 */
defineProps({
  fullscreen: {
    type: Boolean,
    default: false
  }
})

/**
 * 【知识点】导入依赖：
 * 使用 loading store 管理全局加载状态
 */
import { useLoadingStore } from '@/stores/loading'
import LoadingSpinner from './LoadingSpinner.vue'

const loadingStore = useLoadingStore()
</script>

<style scoped>
/* ============================================
   全局加载容器
   ============================================ */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  pointer-events: none;
}

/* ============================================
   进度条容器
   ============================================ */
.progress-bar-container {
  width: 100%;
  height: 3px;
  background-color: transparent;
  overflow: hidden;
}

/* ============================================
   进度条
   ============================================ */
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--mint-green), var(--mint-green-light));
  transition: width var(--transition-normal);
  box-shadow: 0 0 10px var(--mint-green);
}

/* 不确定进度动画 */
.progress-bar.indeterminate {
  width: 30% !important;
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(300%);
  }
}

/* ============================================
   加载遮罩
   ============================================ */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(240, 247, 244, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 9999;
  animation: fadeIn var(--transition-normal);
}

html.dark .loading-overlay,
[data-theme="dark"] .loading-overlay {
  background-color: rgba(26, 26, 46, 0.8);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
