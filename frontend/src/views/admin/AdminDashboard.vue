<!--
  ============================================
  AdminDashboard.vue - 管理中心首页
  ============================================
  
  【知识点】管理中心首页：
  管理员登录后的控制台页面
  展示系统概览、统计数据、快捷操作
  提供导航到各个管理功能模块
  
  【知识点】权限控制：
  此页面需要管理员权限才能访问
  路由配置中 meta: { requiresAdmin: true }
-->

<template>
  <div class="admin-dashboard guofeng-admin-page" :class="{ dark: isDark }">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <el-button type="primary" plain @click="goBack" style="margin-right: 16px;">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h2>管理中心</h2>
        </div>
        <el-tag type="danger" size="large">管理员</el-tag>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon user-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.userCount }}</div>
                <div class="stat-label">用户总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon article-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.articleCount }}</div>
                <div class="stat-label">文章总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon tag-icon">
                <el-icon><PriceTag /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.tagCount }}</div>
                <div class="stat-label">标签总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon comment-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.commentCount }}</div>
                <div class="stat-label">评论总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 快捷操作 -->
      <el-card class="quick-actions">
        <template #header>
          <div class="card-header">
            <el-icon><Operation /></el-icon>
            <span>快捷操作</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-button type="primary" class="action-btn" @click="router.push('/admin/users')">
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="success" class="action-btn" @click="router.push('/admin/articles')">
              <el-icon><Document /></el-icon>
              文章管理
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="warning" class="action-btn" @click="router.push('/admin/tags')">
              <el-icon><PriceTag /></el-icon>
              标签管理
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="info" class="action-btn" @click="router.push('/admin/categories')">
              <el-icon><Folder /></el-icon>
              分类管理
            </el-button>
          </el-col>
          <el-col :span="6" style="margin-top: 15px;">
            <el-button type="primary" class="action-btn" @click="router.push('/admin/checkins')">
              <el-icon><Timer /></el-icon>
              签到记录
            </el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 最近活动 -->
      <el-card class="recent-activities">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>最近活动</span>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :timestamp="formatDate(activity.created_at)"
            placement="top"
            :type="getActivityType(activity.activity_type)"
          >
            <div class="activity-content">
              <span class="activity-type" :class="`type-${activity.activity_type}`">{{ getActivityTypeName(activity.activity_type) }}</span>
              <span class="activity-desc">{{ activity.content }}</span>
              <span class="activity-user" v-if="activity.user_id">
                <el-tag size="small" effect="plain">用户 ID: {{ activity.user_id }}</el-tag>
              </span>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminStats, getRecentActivities } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { useThemeStore } from '@/stores/theme'
import { User, Document, PriceTag, ChatDotRound, Operation, Clock, Folder, Timer, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const goBack = () => {
  router.back()
}

const stats = ref({
  userCount: 0,
  articleCount: 0,
  tagCount: 0,
  commentCount: 0
})

const recentActivities = ref([])

const loadStats = async () => {
  try {
    const response = await getAdminStats()
    stats.value = response
  } catch (error) {
    ElMessage.error('加载统计数据失败')
  }
}

const loadRecentActivities = async () => {
  try {
    const response = await getRecentActivities()
    recentActivities.value = response.activities || []
  } catch (error) {
    ElMessage.error('加载最近活动失败')
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const getActivityType = (type) => {
  const typeMap = {
    checkin: 'success',
    article: 'primary',
    comment: 'info',
    like: 'warning'
  }
  return typeMap[type] || 'info'
}

const getActivityTypeName = (type) => {
  const typeMap = {
    checkin: '签到',
    article: '文章',
    comment: '评论',
    like: '点赞'
  }
  return typeMap[type] || type
}

onMounted(() => {
  loadStats()
  loadRecentActivities()
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(245, 250, 245, 0.88) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.admin-dashboard.dark {
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

.header-left {
  display: flex;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  color: var(--text-dark);
  font-size: 24px;
  transition: color var(--transition-normal);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all var(--transition-normal);
  background-color: rgba(255, 255, 255, 0.95) !important;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--shadow-medium);
}

.admin-dashboard.dark .stat-card {
  background-color: rgba(30, 40, 36, 0.85) !important;
  border: 1px solid rgba(63, 133, 118, 0.2);
}

.admin-dashboard.dark .stat-value {
  color: #f0ebe0;
}

.admin-dashboard.dark .stat-label {
  color: #b8b090;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.article-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.tag-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.comment-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-dark);
  margin-bottom: 4px;
  transition: color var(--transition-normal);
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
}

.quick-actions,
.recent-activities {
  margin-bottom: 20px;
  background-color: rgba(255, 255, 255, 0.95) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 2px 12px var(--shadow-light) !important;
  transition: all var(--transition-normal) !important;
}

.admin-dashboard.dark .quick-actions,
.admin-dashboard.dark .recent-activities {
  background-color: rgba(30, 40, 36, 0.85) !important;
  border: 1px solid rgba(63, 133, 118, 0.2);
}

.admin-dashboard.dark .card-header {
  color: #f0ebe0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: var(--text-dark);
  transition: color var(--transition-normal);
}

.action-btn {
  width: 100%;
  height: 50px;
  font-size: 14px;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

@media (max-width: 768px) {
  .action-btn {
    height: 45px;
    font-size: 13px;
  }
}

.activity-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.activity-type {
  font-weight: bold;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.type-checkin {
  color: #67c23a;
  background: #f0f9eb;
}

.type-article {
  color: #409eff;
  background: #ecf5ff;
}

.type-comment {
  color: #909399;
  background: #f4f4f5;
}

.type-like {
  color: #e6a23c;
  background: #fdf6ec;
}

.activity-desc {
  color: var(--text-main);
  transition: color var(--transition-normal);
  flex: 1;
}

.activity-user {
  margin-left: auto;
}
</style>
