<template>
  <div class="checkin-management guofeng-admin-page" :class="{ dark: isDark }">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <el-button type="primary" plain @click="goBack" style="margin-right: 16px;">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h2>签到记录管理</h2>
        </div>
        <div class="header-actions">
          <el-date-picker
            v-model="searchForm.date"
            type="date"
            placeholder="选择签到日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="margin-right: 10px"
          />
          <el-input
            v-model="searchForm.username"
            placeholder="用户名"
            style="width: 200px; margin-right: 10px"
            clearable
          />
          <el-button type="primary" @click="loadCheckins">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>

      <!-- 签到记录表格 -->
      <el-card class="content-card">
        <template #header>
          <div class="card-header">
            <span>签到记录列表</span>
            <span class="total-count">共 {{ pagination.total }} 条记录</span>
          </div>
        </template>
        
        <el-table
          :data="checkins"
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="用户信息" min-width="200">
            <template #default="{ row }">
              <div class="user-info">
                <img :src="row.avatar || '/src/assets/default-avatar.png'" alt="用户头像" class="user-avatar">
                <div class="user-details">
                  <div class="username">{{ row.username }}</div>
                  <div class="user-id">ID: {{ row.userId }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="checkinDate" label="签到日期" width="150">
            <template #default="{ row }">
              {{ new Date(row.checkinDate).toLocaleDateString() }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="签到时间" width="200">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            :current-page="pagination.page"
            :page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCheckinRecords } from '@/api/admin'
import { Search, ArrowLeft } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const goBack = () => {
  router.back()
}

// 响应式数据
const checkins = ref([])
const loading = ref(false)
const searchForm = ref({
  username: '',
  date: ''
})
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 加载签到记录
const loadCheckins = async () => {
  loading.value = true
  try {
    const response = await getCheckinRecords({
      page: pagination.value.page,
      limit: pagination.value.limit,
      username: searchForm.value.username,
      date: searchForm.value.date
    })
    checkins.value = response.checkins
    pagination.value.total = parseInt(response.pagination.total) || 0
  } catch (error) {
    ElMessage.error('获取签到记录失败')
    console.error('获取签到记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.value.limit = size
  loadCheckins()
}

const handleCurrentChange = (current) => {
  pagination.value.page = current
  loadCheckins()
}

// 初始化加载
onMounted(() => {
  loadCheckins()
})
</script>

<style scoped>
.checkin-management {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(245, 250, 245, 0.88) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 20px 0;
  transition: background 0.4s ease;
}

.checkin-management.dark {
  background: 
    linear-gradient(135deg, rgba(10, 14, 12, 0.95) 0%, rgba(15, 22, 19, 0.9) 50%, rgba(10, 14, 12, 0.95) 100%),
    url('/images/4.png');
}

.container {
  max-width: 1200px;
  margin: 0 auto;
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
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

.content-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.total-count {
  font-size: 14px;
  color: #606266;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.username {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.user-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
