<!--
  ============================================
  Admin.vue - 管理中心页面
  ============================================
  
  【知识点】管理中心页面：
  系统的后台管理界面，只有管理员可以访问
  提供分类管理和标签管理功能
  使用标签页切换不同管理模块
  
  【知识点】权限控制：
  此页面需要管理员权限（路由配置中 meta: { requiresAuth: true, requiresAdmin: true }）
  普通用户无法访问，会被重定向到首页
-->

<template>
  <!--
    【知识点】页面容器：
    class="admin" 用于页面级样式
    注意：Header 组件已在 App.vue 中全局引入，此处不需要重复引入
  -->
  <div class="admin guofeng-admin-page">
    <!--
      ============================================
      侧边栏导航
      ============================================
    -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <el-icon><Settings /></el-icon>
          </div>
          <span class="logo-text">管理中心</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <div 
          v-for="item in menuItems" 
          :key="item.name"
          class="nav-item"
          :class="{ active: activeTab === item.name }"
          @click="activeTab = item.name"
        >
          <el-icon>{{ item.icon }}</el-icon>
          <span>{{ item.label }}</span>
        </div>
      </nav>
    </aside>
    
    <!--
      ============================================
      主内容区域
      ============================================
    -->
    <main class="admin-content">
      <!-- 页面标题栏 -->
      <header class="page-header">
        <h1>{{ currentMenuLabel }}</h1>
        <div class="header-actions">
          <span class="user-count" v-if="activeTab === 'users'">共 {{ users.length }} 位用户</span>
          <span class="user-count" v-else-if="activeTab === 'categories'">共 {{ categories.length }} 个分类</span>
          <span class="user-count" v-else-if="activeTab === 'tags'">共 {{ tags.length }} 个标签</span>
        </div>
      </header>
      
      <!--
        ============================================
        用户管理模块
        ============================================
      -->
      <div v-if="activeTab === 'users'" class="user-management">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户列表</span>
            </div>
          </template>
          
          <el-table :data="users" style="width: 100%" v-loading="loadingUsers">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="用户名" min-width="150">
              <template #default="scope">
                <div class="user-info">
                  <el-avatar :size="32" :src="scope.row.avatar || ''" :icon="UserFilled" />
                  <span class="username">{{ scope.row.username }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="email" label="邮箱" min-width="200" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
                  {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="注册时间" width="180" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button 
                  size="small" 
                  :type="scope.row.role === 'admin' ? 'warning' : 'success'"
                  @click="toggleUserRole(scope.row)"
                  :disabled="scope.row.id === currentUserId"
                >
                  {{ scope.row.role === 'admin' ? '降为普通用户' : '设为管理员' }}
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteUser(scope.row.id)"
                  :disabled="scope.row.id === currentUserId"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
      
      <!--
        ============================================
        分类管理模块
        ============================================
      -->
      <div v-if="activeTab === 'categories'" class="category-management">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>分类列表</span>
              <el-button type="primary" @click="showAddCategoryDialog = true">添加分类</el-button>
            </div>
          </template>
          
          <el-table :data="categories" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="articleCount" label="文章数" width="100" />
            <el-table-column prop="createdAt" label="创建时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="editCategory(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteCategory(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
      
      <!--
        ============================================
        标签管理模块
        ============================================
      -->
      <div v-if="activeTab === 'tags'" class="tag-management">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>标签列表</span>
              <el-button type="primary" @click="showAddTagDialog = true">添加标签</el-button>
            </div>
          </template>
          
          <el-table :data="tags" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="articleCount" label="文章数" width="100" />
            <el-table-column prop="createdAt" label="创建时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="editTag(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteTag(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </main>
    
    <!--
      ============================================
      添加/编辑分类对话框
      ============================================
      
      【知识点】el-dialog 对话框组件：
      v-model="showAddCategoryDialog" - 控制显示/隐藏
      :title - 动态标题，根据编辑状态变化
      width="500px" - 对话框宽度
    -->
    <el-dialog
      v-model="showAddCategoryDialog"
      :title="editingCategory ? '编辑分类' : '添加分类'"
      width="500px"
    >
      <!--
        【知识点】表单组件：
        :model="categoryForm" - 绑定表单数据
        label-width="80px" - 标签宽度
      -->
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类描述">
          <!--
            【知识点】多行文本输入：
            type="textarea" - 文本域类型
            :rows="3" - 显示3行高度
          -->
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            placeholder="请输入分类描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <!--
        【知识点】对话框底部插槽：
        #footer 插槽定义对话框底部按钮
      -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddCategoryDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCategory">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!--
      ============================================
      添加/编辑标签对话框
      ============================================
    -->
    <el-dialog
      v-model="showAddTagDialog"
      :title="editingTag ? '编辑标签' : '添加标签'"
      width="500px"
    >
      <el-form :model="tagForm" label-width="80px">
        <el-form-item label="标签名称">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddTagDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTag">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 【知识点】组合式 API 导入：
 * ref - 创建响应式引用
 * onMounted - 组件挂载后的生命周期钩子
 */
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Users, FolderOpen, Tag, Settings } from '@element-plus/icons-vue'
import { getCategories, createCategory, updateCategory, deleteCategory as deleteCategoryApi } from '@/api/category'
import { getTags, createTag, updateTag, deleteTag as deleteTagApi } from '@/api/tag'
import { getAllUsers, deleteUser as deleteUserApi, updateUserRole } from '@/api/user'
import { useUserStore } from '@/stores/user'

/**
 * 【知识点】侧边栏菜单项：
 * 定义管理中心的导航菜单
 */
const menuItems = ref([
  { name: 'users', label: '用户管理', icon: Users },
  { name: 'categories', label: '分类管理', icon: FolderOpen },
  { name: 'tags', label: '标签管理', icon: Tag }
])

/**
 * 【知识点】当前激活的标签页：
 * 默认显示用户管理（'users'）
 * 切换标签页时自动更新
 */
const activeTab = ref('users')

/**
 * 【知识点】计算属性：获取当前菜单标签
 * 根据 activeTab 返回对应的菜单标签
 */
const currentMenuLabel = computed(() => {
  const item = menuItems.value.find(item => item.name === activeTab.value)
  return item ? item.label : ''
})

/**
 * 【知识点】用户状态管理：
 * 获取当前登录用户信息
 * 用于判断不能删除自己
 */
const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.id)

/**
 * 【知识点】用户管理数据：
 * users - 用户列表
 * loadingUsers - 加载状态
 */
const users = ref([])
const loadingUsers = ref(false)

/**
 * 【知识点】数据列表：
 * categories - 分类列表
 * tags - 标签列表
 */
const categories = ref([])
const tags = ref([])

/**
 * 【知识点】对话框显示状态：
 * 控制添加/编辑对话框的显示与隐藏
 */
const showAddCategoryDialog = ref(false)
const showAddTagDialog = ref(false)

/**
 * 【知识点】编辑状态：
 * editingCategory - 当前编辑的分类对象，null 表示新增
 * editingTag - 当前编辑的标签对象，null 表示新增
 */
const editingCategory = ref(null)
const editingTag = ref(null)

/**
 * 【知识点】表单数据：
 * 用于存储表单输入的数据
 * 提交时发送给后端 API
 */
const categoryForm = ref({
  name: '',
  description: ''
})

const tagForm = ref({
  name: ''
})

/**
 * 【知识点】加载分类列表：
 * 调用 API 获取所有分类
 * 在页面加载和保存操作后调用
 */
const loadCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = response.categories
  } catch (error) {
    ElMessage.error('加载分类失败')
    console.error('加载分类失败:', error)
  }
}

/**
 * 【知识点】加载标签列表：
 * 调用 API 获取所有标签
 */
const loadTags = async () => {
  try {
    const response = await getTags()
    tags.value = response.tags
  } catch (error) {
    ElMessage.error('加载标签失败')
    console.error('加载标签失败:', error)
  }
}

/**
 * 【知识点】打开添加分类对话框：
 * 重置编辑状态和表单数据
 * 设置为新增模式
 */
const addCategory = () => {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: ''
  }
  showAddCategoryDialog.value = true
}

/**
 * 【知识点】打开编辑分类对话框：
 * 设置当前编辑的分类对象
 * 将分类数据填充到表单
 * 设置为编辑模式
 */
const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description
  }
  showAddCategoryDialog.value = true
}

/**
 * 【知识点】保存分类：
 * 根据 editingCategory 判断是新增还是编辑
 * 表单验证后调用对应 API
 * 成功后刷新列表并关闭对话框
 */
const saveCategory = async () => {
  // 表单验证
  if (!categoryForm.value.name) {
    ElMessage.error('分类名称不能为空')
    return
  }
  
  try {
    if (editingCategory.value) {
      // 编辑模式：调用更新 API
      await updateCategory(editingCategory.value.id, categoryForm.value)
      ElMessage.success('分类更新成功')
    } else {
      // 新增模式：调用创建 API
      await createCategory(categoryForm.value)
      ElMessage.success('分类添加成功')
    }
    // 关闭对话框
    showAddCategoryDialog.value = false
    // 刷新列表
    loadCategories()
  } catch (error) {
    // 显示后端返回的错误信息
    if (error.response && error.response.data.error) {
      ElMessage.error(error.response.data.error)
    } else {
      ElMessage.error('操作失败')
    }
    console.error('保存分类失败:', error)
  }
}

/**
 * 【知识点】删除分类：
 * 使用 ElMessageBox.confirm 进行二次确认
 * 确认后调用删除 API
 * 成功后刷新列表
 */
const deleteCategory = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteCategoryApi(id)
    ElMessage.success('分类删除成功')
    loadCategories()
  } catch (error) {
    // 用户取消时不显示错误
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

/**
 * 【知识点】标签管理方法：
 * 与分类管理方法逻辑类似
 * 包括添加、编辑、保存、删除
 */
const addTag = () => {
  editingTag.value = null
  tagForm.value = {
    name: ''
  }
  showAddTagDialog.value = true
}

const editTag = (tag) => {
  console.log('编辑标签:', tag)
  editingTag.value = tag
  tagForm.value = {
    name: tag.name
  }
  showAddTagDialog.value = true
}

const saveTag = async () => {
  if (!tagForm.value.name) {
    ElMessage.error('标签名称不能为空')
    return
  }
  
  try {
    if (editingTag.value) {
      console.log('更新标签:', editingTag.value.id, tagForm.value)
      await updateTag(editingTag.value.id, tagForm.value)
      ElMessage.success('标签更新成功')
    } else {
      await createTag(tagForm.value)
      ElMessage.success('标签添加成功')
    }
    showAddTagDialog.value = false
    loadTags()
  } catch (error) {
    if (error.response && error.response.data.error) {
      ElMessage.error(error.response.data.error)
    } else {
      ElMessage.error('操作失败')
    }
    console.error('保存标签失败:', error)
  }
}

const deleteTag = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个标签吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteTagApi(id)
    ElMessage.success('标签删除成功')
    loadTags()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

/**
 * 【知识点】加载用户列表：
 * 从后端获取所有用户信息
 * 显示加载状态，错误时提示
 */
const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await getAllUsers()
    users.value = response.data
  } catch (error) {
    ElMessage.error('加载用户列表失败')
    console.error('加载用户失败:', error)
  } finally {
    loadingUsers.value = false
  }
}

/**
 * 【知识点】切换用户角色：
 * 在用户和管理员之间切换角色
 * 不能修改自己的角色
 */
const toggleUserRole = async (user) => {
  try {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const actionText = newRole === 'admin' ? '设为管理员' : '降为普通用户'
    
    await ElMessageBox.confirm(
      `确定要将 "${user.username}" ${actionText}吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await updateUserRole(user.id, newRole)
    ElMessage.success(`已成功${actionText}`)
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
      console.error('切换用户角色失败:', error)
    }
  }
}

/**
 * 【知识点】删除用户：
 * 二次确认后删除指定用户
 * 不能删除自己
 */
const deleteUser = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个用户吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteUserApi(id)
    ElMessage.success('用户删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除用户失败:', error)
    }
  }
}

/**
 * 【知识点】生命周期钩子：
 * 组件挂载后加载分类、标签和用户数据
 */
onMounted(() => {
  loadCategories()
  loadTags()
  loadUsers()
})
</script>

<style scoped>
/**
 * 【知识点】scoped 样式特性：
 * 1. 样式只作用于当前组件，不会影响其他组件
 * 2. Vue 会自动添加 data-v-xxxxx 属性选择器来隔离样式
 * 3. 父组件的样式不会渗透到子组件（但子组件的根元素会受父影响）
 */

/**
 * 【知识点】页面容器样式 - admin 类：
 * 使用 Flex 布局实现侧边栏 + 主内容的左右布局
 */
.admin {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(247, 252, 248, 0.78) 50%, rgba(245, 250, 245, 0.82) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
}

/**
 * 【知识点】侧边栏样式：
 * 固定宽度，左侧定位，包含导航菜单
 */
.admin-sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--paper-panel);
  border-right: 1px solid var(--line-medium);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: calc(100vh - 60px);
}

/**
 * 【知识点】侧边栏头部：
 * 显示 Logo 和标题
 */
.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--line-soft);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-logo .logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--jade-700), var(--jade-500));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 10px 24px rgba(29, 91, 82, 0.2);
}

.sidebar-logo .logo-text {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-dark);
  letter-spacing: 0.06em;
}

/**
 * 【知识点】侧边栏导航：
 * 垂直排列的导航菜单
 */
.sidebar-nav {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-nav .nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 14px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sidebar-nav .nav-item:hover {
  background: rgba(37, 113, 98, 0.08);
  color: var(--jade-700);
}

.sidebar-nav .nav-item.active {
  background: linear-gradient(135deg, rgba(37, 113, 98, 0.14), rgba(201, 171, 103, 0.12));
  color: var(--jade-800);
  font-weight: 500;
}

/**
 * 【知识点】主内容区域：
 * 占据剩余空间，可滚动
 */
.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/**
 * 【知识点】页面标题栏：
 * 显示当前模块标题和操作按钮
 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--paper-panel);
  border: 1px solid var(--line-medium);
  border-radius: var(--radius-lg);
}

.page-header h1 {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--text-dark);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-count {
  font-size: 14px;
  color: var(--text-muted);
}

/**
 * 【知识点】响应式布局：
 * 在小屏幕下隐藏侧边栏
 */
@media (max-width: 992px) {
  .admin-sidebar {
    display: none;
  }
  
  .admin-content {
    padding: 16px;
  }
}

/**
 * 【知识点】卡片头部布局 - card-header 类：
 * 
 * display: flex - 启用 Flexbox 弹性布局
 *   - 传统布局需要使用 float、position 等复杂方式
 *   - Flexbox 是现代 CSS 布局方案，简单强大
 * 
 * justify-content: space-between - 主轴两端对齐
 *   - space-between 是 justify-content 的值
 *   - 第一个元素靠左，最后一个元素靠右
 *   - 中间元素均匀分布
 * 
 * align-items: center - 交叉轴垂直居中
 *   - 确保标题和按钮在高度上居中对齐
 *   - align-items 控制交叉轴（垂直）方向的对齐
 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/**
 * 【知识点】对话框底部按钮区域 - dialog-footer 类：
 * 
 * display: flex - 弹性布局
 * 
 * justify-content: flex-end - 尾端对齐
 *   - 与 space-between 不同，flex-end 让所有元素靠右
 *   - 常用于对话框、操作按钮等场景
 * 
 * gap: 10px - 元素间距
 *   - Flexbox 布局中控制子元素之间的间距
 *   - 是 margin 的现代替代方案，更简洁
 *   - 兼容性问题：IE11 不支持，可使用 justify-content + margin 替代
 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/**
 * 【知识点】管理模块容器 - category-management / tag-management 类：
 * 
 * margin-top: 20px - 顶部外边距
 *   - 与上方的标签页标题保持间距
 *   - 使页面布局更加舒展，不拥挤
 * 
 * 群组选择器：
 * 同时给多个类设置相同样式，提高代码复用性
 */
.category-management,
.tag-management,
.user-management {
  margin-top: 20px;
}

/**
 * 【知识点】用户管理样式：
 * 
 * user-info - 用户信息展示
 *   - 使用 flex 布局，头像和用户名水平排列
 *   - gap 设置间距
 * 
 * total-count - 用户总数统计
 *   - 灰色小字，显示在卡片头部
 */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info .username {
  font-weight: 500;
}

.total-count {
  font-size: 14px;
  color: #909399;
}
</style>
