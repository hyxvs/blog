<!--
  ============================================
  ArticleManagement.vue - 文章管理页面
  ============================================
  
  【知识点】文章管理页面：
  管理员查看和管理所有文章
  支持查看文章详情、修改文章状态、删除文章
  提供搜索和分页功能
  
  【知识点】权限控制：
  此页面需要管理员权限才能访问
  路由配置中 meta: { requiresAdmin: true }
-->

<template>
  <div class="article-management guofeng-admin-page" :class="{ dark: isDark }">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>文章管理</h2>
        <el-button type="primary" @click="router.back()">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
      </div>

      <!-- 搜索栏 -->
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="标题">
            <el-input v-model="searchForm.title" placeholder="输入文章标题" clearable @input="handleInput" />
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="searchForm.author" placeholder="输入作者名" clearable @input="handleInput" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="选择状态" clearable @change="handleInput">
              <el-option label="全部" value="" />
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 文章列表 -->
      <el-card class="article-list-card">
        <el-table :data="articles" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="作者" width="150">
            <template #default="{ row }">
              <div class="author-cell">
                <el-avatar :src="row.authorAvatar" :size="24">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span>{{ row.authorName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.categoryName" size="small" effect="plain">
                {{ row.categoryName }}
              </el-tag>
              <span v-else class="text-muted">未分类</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'warning'" size="small">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="浏览量" width="100">
            <template #default="{ row }">
              <div class="view-count">
                <el-icon><View /></el-icon>
                {{ row.viewCount || 0 }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" text @click="handleView(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button type="warning" size="small" text @click="handleToggleStatus(row)">
                <el-icon><Refresh /></el-icon>
                {{ row.status === 'published' ? '下架' : '发布' }}
              </el-button>
              <el-button type="danger" size="small" text @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="pagination.page"
            :page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminArticles, toggleArticleStatus, deleteArticle } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Search, User, View, Refresh, Delete } from '@element-plus/icons-vue'
import { debounce } from '@/utils/tools'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const loading = ref(false)
const articles = ref([])

const searchForm = reactive({
  title: '',
  author: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const loadArticles = async () => {
  loading.value = true
  try {
    const response = await getAdminArticles({
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    })
    articles.value = response.articles
    pagination.total = response.pagination.total
  } catch (error) {
    ElMessage.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 防抖搜索处理函数
 * 300ms 防抖，避免频繁搜索
 */
const debouncedSearch = debounce(() => {
  pagination.page = 1
  loadArticles()
}, 300)

const handleSearch = () => {
  debouncedSearch()
}

/**
 * 监听搜索输入，使用防抖
 */
const handleInput = () => {
  debouncedSearch()
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.author = ''
  searchForm.status = ''
  pagination.page = 1
  loadArticles()
}

const handleView = (article) => {
  router.push(`/article/${article.id}`)
}

const handleToggleStatus = async (article) => {
  const action = article.status === 'published' ? '下架' : '发布'
  try {
    await ElMessageBox.confirm(`确定要${action}文章 "${article.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await toggleArticleStatus(article.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

const handleDelete = async (article) => {
  try {
    await ElMessageBox.confirm(`确定要删除文章 "${article.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteArticle(article.id)
    ElMessage.success('删除成功')
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadArticles()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadArticles()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.article-management {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(245, 250, 245, 0.88) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.article-management.dark {
  background: 
    linear-gradient(135deg, rgba(10, 14, 12, 0.95) 0%, rgba(15, 22, 19, 0.9) 50%, rgba(10, 14, 12, 0.95) 100%),
    url('/images/4.png');
}

.container {
  max-width: 1400px;
  margin: 20px auto;
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: var(--text-dark);
  font-size: 24px;
  transition: color var(--transition-normal);
}

.search-card,
.article-list-card {
  margin-bottom: 20px;
  background-color: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 2px 12px var(--shadow-light) !important;
  transition: all var(--transition-normal) !important;
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.text-muted {
  color: var(--text-muted);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 按钮样式 */
.article-management .el-button--primary {
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.article-management .el-button--primary:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
}

.article-management .el-button--danger {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.article-management .el-button--warning {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

/* 输入框样式 */
.article-management .el-input__wrapper {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.article-management .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

.article-management .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

/* 选择器样式 */
.article-management .el-select .el-input__wrapper {
  border-radius: var(--radius-md) !important;
}

/* 标签样式 */
.article-management .el-tag {
  border-radius: var(--radius-sm) !important;
}

/* 表格样式 */
.article-management .el-table {
  --el-table-border-color: var(--border-light) !important;
  --el-table-header-bg-color: var(--bg-hover) !important;
  --el-table-row-hover-bg-color: var(--bg-hover) !important;
  transition: all var(--transition-normal);
}

/* 分页组件样式 */
.article-management .el-pagination {
  --el-pagination-button-color: var(--text-dark) !important;
  --el-pagination-button-hover-color: var(--mint-green) !important;
  --el-pagination-button-active-color: var(--mint-green) !important;
  --el-pagination-button-bg-color: var(--bg-card) !important;
  --el-pagination-button-border-color: var(--border-light) !important;
  --el-pagination-button-hover-bg-color: var(--bg-hover) !important;
  --el-pagination-button-active-bg-color: var(--mint-green-light) !important;
  transition: all var(--transition-normal);
}
</style>
