<template>
  <div class="edit-article-page">
    <ArticleEditorWorkspace
      v-if="articleId !== null"
      mode="edit"
      :article-id="articleId"
    />

    <div v-else class="empty-container">
      <el-alert type="warning" title="文章 ID 无效" show-icon />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ArticleEditorWorkspace from '@/components/ArticleEditorWorkspace.vue'

const route = useRoute()

const articleId = computed(() => {
  const value = Number(route.params.id)
  return Number.isFinite(value) ? value : null
})
</script>

<style scoped>
.edit-article-page {
  min-height: calc(100vh - 60px);
  padding: 20px;
}

.empty-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 0;
}
</style>
