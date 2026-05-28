<!--
  ============================================
  CategoryManagement.vue - 分类管理页面
  ============================================
  
  【知识点】分类管理页面：
  管理员查看和管理所有分类
  支持创建、编辑、删除分类
  提供搜索和分页功能
  
  【知识点】权限控制：
  此页面需要管理员权限才能访问
  路由配置中 meta: { requiresAdmin: true }
-->

<template>
  <div class="category-management guofeng-admin-page" :class="{ dark: isDark }">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>分类管理</h2>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建分类
          </el-button>
          <el-button @click="router.back()">
            <el-icon><Back /></el-icon>
            返回
          </el-button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="分类名">
            <el-input v-model="searchForm.name" placeholder="输入分类名" clearable />
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

      <!-- 分类列表 -->
      <el-card class="category-list-card">
        <el-table :data="categories" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="分类名" width="200">
            <template #default="{ row }">
              <div class="category-name">
                <el-icon><Folder /></el-icon>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.description || '暂无描述' }}
            </template>
          </el-table-column>
          <el-table-column label="文章数" width="120">
            <template #default="{ row }">
              {{ row.articleCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" text @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
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

    <!-- 创建/编辑分类对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="500px"
    >
      <el-form :model="categoryForm" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="分类名" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="categoryForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Back, Search, Edit, Delete, Folder } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const loading = ref(false)
const saving = ref(false)
const categories = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const searchForm = reactive({
  name: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const categoryForm = reactive({
  id: null,
  name: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入分类名', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑分类' : '新建分类')

const loadCategories = async () => {
  loading.value = true
  try {
    const response = await getCategories({
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    })
    categories.value = response.categories
    pagination.total = response.pagination.total
  } catch (error) {
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadCategories()
}

const handleReset = () => {
  searchForm.name = ''
  pagination.page = 1
  loadCategories()
}

const handleCreate = () => {
  isEdit.value = false
  categoryForm.id = null
  categoryForm.name = ''
  categoryForm.description = ''
  dialogVisible.value = true
}

const handleEdit = (category) => {
  isEdit.value = true
  categoryForm.id = category.id
  categoryForm.name = category.name
  categoryForm.description = category.description || ''
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await updateCategory(categoryForm.id, categoryForm)
          ElMessage.success('更新成功')
        } else {
          await createCategory(categoryForm)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadCategories()
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
      } finally {
        saving.value = false
      }
    }
  })
}

const handleDelete = async (category) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类 "${category.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCategory(category.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadCategories()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadCategories()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-management {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(245, 250, 245, 0.88) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.category-management.dark {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: var(--text-dark);
  transition: color var(--transition-normal);
}

.search-card,
.category-list-card {
  margin-bottom: 20px;
  background-color: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 2px 12px var(--shadow-light) !important;
  transition: all var(--transition-normal) !important;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 按钮样式 */
.category-management .el-button--primary {
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.category-management .el-button--primary:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
}

.category-management .el-button--danger {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

/* 输入框样式 */
.category-management .el-input__wrapper {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.category-management .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

.category-management .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

/* 表格样式 */
.category-management .el-table {
  --el-table-border-color: var(--border-light) !important;
  --el-table-header-bg-color: var(--bg-hover) !important;
  --el-table-row-hover-bg-color: var(--bg-hover) !important;
  transition: all var(--transition-normal);
}

/* 分页组件样式 */
.category-management .el-pagination {
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
