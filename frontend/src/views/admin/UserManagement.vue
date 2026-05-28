<!--
  ============================================
  UserManagement.vue - 用户管理页面
  ============================================
  
  【知识点】用户管理页面：
  管理员查看和管理所有用户
  支持查看用户信息、修改用户角色、删除用户
  提供搜索和分页功能
  
  【知识点】权限控制：
  此页面需要管理员权限才能访问
  路由配置中 meta: { requiresAdmin: true }
-->

<template>
  <div class="user-management guofeng-admin-page" :class="{ dark: isDark }">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>用户管理</h2>
        <el-button type="primary" @click="router.back()">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
      </div>

      <!-- 搜索栏 -->
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="用户名">
            <el-input v-model="searchForm.username" placeholder="输入用户名" clearable />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="searchForm.email" placeholder="输入邮箱" clearable />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="searchForm.role" placeholder="选择角色" clearable>
              <el-option label="全部" value="" />
              <el-option label="管理员" value="admin" />
              <el-option label="普通用户" value="user" />
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

      <!-- 用户列表 -->
      <el-card class="user-list-card">
        <el-table :data="users" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="用户" width="200">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :src="row.avatar" :size="40">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="user-info">
                  <div class="username">{{ row.username }}</div>
                  <div class="email">{{ row.email }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="bio" label="简介" show-overflow-tooltip />
          <el-table-column label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
                {{ row.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="文章数" width="100">
            <template #default="{ row }">
              {{ row.articleCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="注册时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" text @click="handleEditRole(row)">
                <el-icon><Edit /></el-icon>
                修改角色
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

    <!-- 修改角色对话框 -->
    <el-dialog v-model="roleDialogVisible" title="修改用户角色" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="roleForm.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="roleForm.role">
            <el-radio value="user">普通用户</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUsers, updateUserRole, deleteUser } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Search, User, Edit, Delete } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const loading = ref(false)
const saving = ref(false)
const users = ref([])

const searchForm = reactive({
  username: '',
  email: '',
  role: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const roleDialogVisible = ref(false)
const roleForm = reactive({
  id: null,
  username: '',
  role: 'user'
})

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await getUsers({
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    })
    users.value = response.users
    pagination.total = response.pagination.total
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.email = ''
  searchForm.role = ''
  pagination.page = 1
  loadUsers()
}

const handleEditRole = (user) => {
  roleForm.id = user.id
  roleForm.username = user.username
  roleForm.role = user.role
  roleDialogVisible.value = true
}

const handleSaveRole = async () => {
  saving.value = true
  try {
    await updateUserRole(roleForm.id, { role: roleForm.role })
    ElMessage.success('修改角色成功')
    roleDialogVisible.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error('修改角色失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteUser(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadUsers()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadUsers()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(245, 250, 245, 0.88) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.user-management.dark {
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
.user-list-card {
  margin-bottom: 20px;
  background-color: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 2px 12px var(--shadow-light) !important;
  transition: all var(--transition-normal) !important;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.username {
  font-weight: bold;
  color: var(--text-dark);
  margin-bottom: 4px;
  transition: color var(--transition-normal);
}

.email {
  font-size: 12px;
  color: var(--text-muted);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 按钮样式 */
.user-management .el-button--primary {
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.user-management .el-button--primary:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
}

.user-management .el-button--danger {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

/* 输入框样式 */
.user-management .el-input__wrapper {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.user-management .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

.user-management .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

/* 选择器样式 */
.user-management .el-select .el-input__wrapper {
  border-radius: var(--radius-md) !important;
}

/* 标签样式 */
.user-management .el-tag {
  border-radius: var(--radius-sm) !important;
}

/* 表格样式 */
.user-management .el-table {
  --el-table-border-color: var(--border-light) !important;
  --el-table-header-bg-color: var(--bg-hover) !important;
  --el-table-row-hover-bg-color: var(--bg-hover) !important;
  transition: all var(--transition-normal);
}

/* 分页组件样式 */
.user-management .el-pagination {
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
