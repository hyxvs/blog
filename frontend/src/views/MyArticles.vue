<template>
  <div class="my-articles-page" :class="{ dark: isDark }">
    <div class="page-shell">
      <div class="page-header">
        <div class="header-left">
          <div class="header-logo">
            <img src="/images/logo.png" alt="Logo" />
          </div>
          <div class="header-content">
            <p class="page-eyebrow">My Workspace</p>
            <h1>我的文章</h1>
            <p class="page-subtitle">统一查看草稿、已发布文章和定时发布内容。</p>
          </div>
        </div>
        <el-button type="primary" size="large" @click="router.push('/create-article')">
          写文章
        </el-button>
      </div>

      <el-card class="page-panel" shadow="never">
        <template #header>
          <div class="toolbar">
            <el-radio-group v-model="statusFilter" size="small" @change="reloadArticles">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="draft">草稿</el-radio-button>
              <el-radio-button value="scheduled">定时</el-radio-button>
              <el-radio-button value="published">已发布</el-radio-button>
            </el-radio-group>
            <el-input
              v-model="keyword"
              class="search-input"
              clearable
              placeholder="搜索标题或摘要"
              @keyup.enter="reloadArticles"
              @clear="reloadArticles"
            >
              <template #append>
                <el-button @click="reloadArticles">搜索</el-button>
              </template>
            </el-input>
          </div>
        </template>

        <div v-loading="loading">
          <el-empty
            v-if="!loading && articles.length === 0"
            description="还没有符合条件的文章"
          >
            <el-button type="primary" @click="router.push('/create-article')">
              去写第一篇文章
            </el-button>
          </el-empty>

          <div v-else class="article-list">
            <article v-for="article in articles" :key="article.id" class="article-item">
              <div class="article-main">
                <div class="article-heading">
                  <h2 class="article-title" @click="viewArticle(article.id)">
                    {{ article.title || '未命名草稿' }}
                  </h2>
                  <div class="status-tags">
                    <el-tag v-if="article.status === 'draft'" type="warning" effect="plain">
                      草稿
                    </el-tag>
                    <el-tag v-else-if="article.status === 'scheduled'" type="info" effect="plain">
                      定时发布
                    </el-tag>
                    <el-tag v-else type="success" effect="plain">
                      已发布
                    </el-tag>
                    <el-tag v-if="article.categoryName" effect="plain">
                      {{ article.categoryName }}
                    </el-tag>
                  </div>
                </div>

                <p class="article-summary">
                  {{ article.summary || '暂无摘要，继续完善这篇文章吧。' }}
                </p>

                <div class="article-meta">
                  <span>浏览 {{ article.viewCount || 0 }}</span>
                  <span>创建于 {{ formatDate(article.createdAt) }}</span>
                  <span v-if="article.scheduledPublishAt">
                    发布于 {{ formatDate(article.scheduledPublishAt) }}
                  </span>
                </div>

                <div v-if="article.tags?.length" class="tag-row">
                  <el-tag
                    v-for="tag in article.tags"
                    :key="tag.id"
                    size="small"
                    effect="plain"
                  >
                    {{ tag.name }}
                  </el-tag>
                </div>
              </div>

              <div class="article-actions">
                <el-button size="small" plain @click="viewArticle(article.id)">
                  查看
                </el-button>
                <el-button size="small" plain @click="editArticle(article.id)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" plain @click="removeArticle(article.id)">
                  删除
                </el-button>
              </div>
            </article>
          </div>
        </div>

        <div v-if="pagination.total > pagination.limit" class="pagination-wrap">
          <el-pagination
            :current-page="pagination.page"
            :page-size="pagination.limit"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteArticle as deleteArticleApi, getArticles } from '@/api/article'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import type { Article, ArticleStatus } from '@/types'
import { formatDate } from '@/utils/tools'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const articles = ref<Article[]>([])
const loading = ref(false)
const keyword = ref('')
const statusFilter = ref<ArticleStatus | 'all'>('all')

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
})

async function loadArticles() {
  if (!userStore.userId) {
    return
  }

  loading.value = true
  try {
    const response = await getArticles({
      page: pagination.value.page,
      limit: pagination.value.limit,
      authorId: userStore.userId,
      status: statusFilter.value,
      keyword: keyword.value.trim() || undefined,
    })

    articles.value = response.articles
    pagination.value.total = response.pagination.total
  } catch (error) {
    ElMessage.error('文章列表加载失败')
  } finally {
    loading.value = false
  }
}

function reloadArticles() {
  pagination.value.page = 1
  void loadArticles()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  void loadArticles()
}

function handleSizeChange(size: number) {
  pagination.value.limit = size
  pagination.value.page = 1
  void loadArticles()
}

function viewArticle(id: number) {
  router.push(`/article/${id}`)
}

function editArticle(id: number) {
  router.push(`/edit-article/${id}`)
}

async function removeArticle(id: number) {
  try {
    await ElMessageBox.confirm('确定删除这篇文章吗？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })

    await deleteArticleApi(id)
    ElMessage.success('文章已删除')
    await loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  void loadArticles()
})
</script>

<style scoped>
.my-articles-page {
  min-height: 100vh;
  background: 
    linear-gradient(180deg, rgba(255, 251, 244, 0.9) 0%, rgba(245, 250, 245, 0.85) 50%, rgba(250, 252, 248, 0.9) 100%),
    url('/images/2.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 28px;
  transition: background 0.4s ease;
}

.my-articles-page.dark {
  background: 
    linear-gradient(180deg, rgba(10, 14, 12, 0.95) 0%, rgba(15, 22, 19, 0.9) 50%, rgba(10, 14, 12, 0.95) 100%),
    url('/images/2.png');
}

.page-shell {
  max-width: 1240px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: left;
  gap: 20px;
  margin-bottom: 18px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-logo {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 20px;
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: 0 4px 16px var(--shadow-light);
}

.header-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.header-content {
  min-width: 0;
  text-align: left;
}

.page-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-light);
}

.page-header h1 {
  margin: 0;
  color: var(--text-dark);
}

.page-subtitle {
  margin: 10px 0 0;
  color: var(--text-main);
}

.page-panel {
  border: 1px solid var(--border-light) !important;
  background: var(--bg-card) !important;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08) !important;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input {
  width: min(360px, 100%);
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--border-light);
  background: color-mix(in srgb, var(--bg-main) 86%, #ffffff 14%);
}

.article-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.article-title {
  margin: 0;
  color: var(--text-dark);
  cursor: pointer;
}

.article-title:hover {
  color: var(--mint-green);
}

.status-tags,
.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.article-summary {
  margin: 12px 0;
  color: var(--text-main);
  line-height: 1.7;
}

.article-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-muted);
  font-size: 13px;
}

.article-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  justify-content: center;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 22px;
}

@media (max-width: 768px) {
  .my-articles-page {
    padding: 16px;
  }

  .page-header,
  .toolbar,
  .article-item,
  .article-heading {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .article-actions {
    flex-direction: row;
    justify-content: flex-start;
  }

  .search-input {
    width: 100%;
  }
}
</style>
