<!--
  ============================================
  LoadingSpinner.vue - 加载动画组件
  ============================================
  
  【知识点】加载动画组件：
  提供多种加载动画效果，用于页面加载和数据请求
  支持不同尺寸和类型的动画
-->

<template>
  <div class="loading-spinner" :class="[`size-${size}`, `type-${type}`]">
    <!-- 类型1: 旋转圆圈 -->
    <div v-if="type === 'spinner'" class="spinner">
      <div class="circle"></div>
    </div>
    
    <!-- 类型2: 跳动圆点 -->
    <div v-else-if="type === 'dots'" class="dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
    
    <!-- 类型3: 脉冲效果 -->
    <div v-else-if="type === 'pulse'" class="pulse">
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
    </div>
    
    <!-- 类型4: 骨架屏 -->
    <div v-else-if="type === 'skeleton'" class="skeleton">
      <div class="skeleton-line" v-for="i in lines" :key="i" :style="{ width: getRandomWidth() }"></div>
    </div>
    
    <!-- 类型5: 进度条 -->
    <div v-else-if="type === 'progress'" class="progress-container">
      <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>
    
    <!-- 加载文字 -->
    <div v-if="text" class="loading-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 【知识点】组件 props：
 * 定义组件接收的属性
 * - size: 尺寸 (small, medium, large)
 * - type: 动画类型 (spinner, dots, pulse, skeleton, progress)
 * - text: 加载提示文字
 * - lines: 骨架屏行数
 * - progress: 进度条进度 (0-100)
 */
const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['spinner', 'dots', 'pulse', 'skeleton', 'progress'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  lines: {
    type: Number,
    default: 3
  },
  progress: {
    type: Number,
    default: 0
  }
})

/**
 * 【知识点】随机宽度：
 * 为骨架屏生成随机宽度，模拟真实内容
 */
const getRandomWidth = () => {
  const widths = ['100%', '85%', '90%', '70%', '95%', '60%']
  return widths[Math.floor(Math.random() * widths.length)]
}
</script>

<style scoped>
/* ============================================
   基础样式
   ============================================ */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-text {
  color: var(--text-light);
  font-size: 14px;
  animation: fadeInOut 1.5s ease-in-out infinite;
}

/* ============================================
   尺寸样式
   ============================================ */
.size-small .spinner .circle,
.size-small .dots .dot,
.size-small .pulse .pulse-ring {
  width: 20px;
  height: 20px;
}

.size-small .dots .dot {
  width: 6px;
  height: 6px;
}

.size-medium .spinner .circle,
.size-medium .pulse .pulse-ring {
  width: 40px;
  height: 40px;
}

.size-medium .dots .dot {
  width: 10px;
  height: 10px;
}

.size-large .spinner .circle,
.size-large .pulse .pulse-ring {
  width: 60px;
  height: 60px;
}

.size-large .dots .dot {
  width: 14px;
  height: 14px;
}

/* ============================================
   旋转圆圈动画
   ============================================ */
.spinner .circle {
  border: 3px solid var(--border-light);
  border-top-color: var(--mint-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   跳动圆点动画
   ============================================ */
.dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dots .dot {
  background-color: var(--mint-green);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.dots .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dots .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ============================================
   脉冲动画
   ============================================ */
.pulse {
  position: relative;
}

.pulse .pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid var(--mint-green);
  border-radius: 50%;
  opacity: 0;
  animation: pulse 2s ease-out infinite;
}

.pulse .pulse-ring:nth-child(2) {
  animation-delay: 0.5s;
}

.pulse .pulse-ring:nth-child(3) {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* ============================================
   骨架屏动画
   ============================================ */
.skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ============================================
   进度条动画
   ============================================ */
.progress-container {
  width: 200px;
  height: 4px;
  background-color: var(--bg-hover);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--mint-green), var(--mint-green-light));
  border-radius: var(--radius-sm);
  transition: width var(--transition-normal);
  animation: progressShine 2s ease-in-out infinite;
}

@keyframes progressShine {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2);
  }
}

/* ============================================
   文字淡入淡出动画
   ============================================ */
@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* ============================================
   全屏加载样式
   ============================================ */
.type-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(240, 247, 244, 0.8);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

html.dark .type-fullscreen,
[data-theme="dark"] .type-fullscreen {
  background-color: rgba(26, 26, 46, 0.8);
}

/* ============================================
   页面加载样式
   ============================================ */
.type-page {
  min-height: 400px;
  padding: 40px;
}
</style>
