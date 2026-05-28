<!--
  ============================================
  TagManagement.vue - 标签管理页面
  ============================================
  
  【知识点】标签管理页面：
  管理员查看和管理所有标签
  支持创建、编辑、删除标签
  提供搜索和分页功能
  
  【知识点】权限控制：
  此页面需要管理员权限才能访问
  路由配置中 meta: { requiresAdmin: true }
-->

<template>
  <div class="tag-management guofeng-admin-page" :class="{ dark: isDark }">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>标签管理</h2>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建标签
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
          <el-form-item label="标签名">
            <el-input v-model="searchForm.name" placeholder="输入标签名" clearable />
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

      <!-- 标签列表 -->
      <el-card class="tag-list-card">
        <el-table :data="tags" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="标签名" width="200">
            <template #default="{ row }">
              <el-tag size="large">{{ row.name }}</el-tag>
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

    <!-- 创建/编辑标签对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="400px"
    >
      <el-form :model="tagForm" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标签名" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名" />
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
import { getTags, createTag, updateTag, deleteTag } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Back, Search, Edit, Delete } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const loading = ref(false)
const saving = ref(false)
const tags = ref([])
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

const tagForm = reactive({
  id: null,
  name: ''
})

const rules = {
  name: [
    { required: true, message: '请输入标签名', trigger: 'blur' },
    { min: 1, max: 50, message: '标签名长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑标签' : '新建标签')

const loadTags = async () => {
  loading.value = true
  try {
    const response = await getTags({
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    })
    tags.value = response.tags
    pagination.total = response.pagination.total
  } catch (error) {
    ElMessage.error('加载标签列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadTags()
}

const handleReset = () => {
  searchForm.name = ''
  pagination.page = 1
  loadTags()
}

const handleCreate = () => {
  isEdit.value = false
  tagForm.id = null
  tagForm.name = ''
  dialogVisible.value = true
}

const handleEdit = (tag) => {
  isEdit.value = true
  tagForm.id = tag.id
  tagForm.name = tag.name
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await updateTag(tagForm.id, { name: tagForm.name })
          ElMessage.success('更新成功')
        } else {
          await createTag({ name: tagForm.name })
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadTags()
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
      } finally {
        saving.value = false
      }
    }
  })
}

const handleDelete = async (tag) => {
  try {
    await ElMessageBox.confirm(`确定要删除标签 "${tag.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteTag(tag.id)
    ElMessage.success('删除成功')
    loadTags()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadTags()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadTags()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.tag-management {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(245, 250, 245, 0.88) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.tag-management.dark {
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

.search-card,
.tag-list-card {
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
.tag-management .el-button--primary {
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.tag-management .el-button--primary:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
}

.tag-management .el-button--danger {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

/* 输入框样式 */
.tag-management .el-input__wrapper {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.tag-management .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

.tag-management .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

/* 标签样式 */
.tag-management .el-tag {
  border-radius: var(--radius-sm) !important;
}

/* 表格样式 */
.tag-management .el-table {
  --el-table-border-color: var(--border-light) !important;
  --el-table-header-bg-color: var(--bg-hover) !important;
  --el-table-row-hover-bg-color: var(--bg-hover) !important;
  transition: all var(--transition-normal);
}

/* 分页组件样式 */
.tag-management .el-pagination {
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
