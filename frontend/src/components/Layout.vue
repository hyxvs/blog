<!--
  ============================================
  Layout.vue - 统一布局容器组件
  ============================================
  
  【知识点】布局组件：
  提供统一的页面布局结构，包含：
  1. Header 导航组件
  2. 主内容区域
  3. 全局过渡动画
-->

<template>
  <div class="layout">
    <Header :show-about-link="true" />
    
    <main class="layout-content">
      <router-view v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <SiteFooter v-if="showFooter" />
    
    <AIChatAssistant />
    <GlobalLoading />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Header from './Header.vue'
import SiteFooter from './SiteFooter.vue'
import AIChatAssistant from './AIChatAssistant.vue'
import GlobalLoading from './GlobalLoading.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showFooter = computed(() => {
  const path = route.path
  return !(
    path.startsWith('/admin') ||
    path.startsWith('/article/') ||
    path === '/create-article' ||
    path.startsWith('/edit-article') ||
    path === '/my-articles' ||
    path === '/about' ||
    path === '/profile' ||
    path === '/login' ||
    path === '/register'
  )
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-content {
  flex: 1;
  position: relative;
}

.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
