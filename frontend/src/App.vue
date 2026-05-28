<!--
  ============================================
  App.vue - Vue 应用根组件
  ============================================
  博客系统应用根组件，采用三栏式响应式布局
-->
<template>
  <div id="app">
    <Layout v-if="!route.meta.noLayout" />
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Layout from '@/components/Layout.vue'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const themeStore = useThemeStore()
onMounted(() => {
  themeStore.initTheme()
})
</script>

<style>
/* 全局样式已在 main.js 中导入 */
</style>
