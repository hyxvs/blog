<!--
  ============================================
  Header.vue - 页面顶部导航组件
  ============================================
  
  【知识点】Header 组件：
  网站的顶部导航栏组件，通常包含：
  1. Logo/品牌标识
  2. 主导航菜单
  3. 用户操作区（登录/注册或用户下拉菜单）
  
  【知识点】组件化开发：
  将页面拆分为独立的、可复用的组件
  Header 组件在多个页面共享，保持导航一致性
-->

<!-- ============================================
     模板部分 (Template)
     ============================================ -->
<template>
  <!--
    【知识点】header 容器：
    使用 div 作为根容器，class="header" 用于样式定位
    包含 Logo、导航链接、用户操作区域
  -->
  <div class="header">
    <!--
      【知识点】container 容器：
      限制内容最大宽度并居中显示
      常见的布局模式：max-width + margin: 0 auto
    -->
    <div class="container">
      <!--
        ============================================
        Logo 区域
        ============================================
      -->
      <div class="logo">
        <!--
          【知识点】<router-link>：
          Vue Router 提供的组件，用于页面导航
          与 <a> 标签的区别：
          1. 不会刷新整个页面（SPA 特性）
          2. 自动处理激活状态的 CSS 类
          3. 支持编程式导航的便利性
          
          to="/" 表示链接到首页路由
        -->
        <router-link to="/">自顾逍遥</router-link>
      </div>
      
      <!--
        ============================================
        导航区域
        ============================================
      -->
      <div class="nav">
        <!-- 首页链接，所有用户可见 -->
        <router-link to="/">首页</router-link>
        <router-link v-if="showAboutLink" to="/about">关于</router-link>
        
        <!-- 搜索框 -->
        <div class="search-box">
          <div class="search-input-container">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索文章..."
              :prefix-icon="Search"
              @keyup.enter="handleSearch"
              @input="handleInput"
              class="search-input"
            />
            <el-button @click="handleSearch" :icon="Search" class="search-btn" />
          </div>
        </div>
        
        <!--
          【知识点】条件渲染 v-if：
          根据条件决定是否渲染元素
          v-if="userStore.isLoggedIn" 表示只有登录用户才显示
          
          【知识点】Pinia Store 访问：
          userStore.isLoggedIn 是从用户 store 获取的登录状态
          响应式数据，状态变化时视图自动更新
        -->
        <!-- 主题切换按钮 -->
        <el-tooltip :content="themeTooltipText" placement="bottom">
          <el-button
            circle
            :icon="themeStore.isDarkMode ? Moon : Sunny"
            class="theme-toggle-btn"
            @click="handleThemeToggle"
          />
        </el-tooltip>

        <el-badge v-if="userStore.isLoggedIn" :is-dot="hasUnreadNotifications" class="header-notification-badge">
          <el-button
            circle
            :icon="Bell"
            class="theme-toggle-btn"
            @click="openNotificationsCenter"
          />
        </el-badge>

        <template v-if="userStore.isLoggedIn">
          <!--
            登录用户可见的导航链接：
            - 写文章：跳转到文章创建页
            - 我的文章：查看自己发布的文章
          -->
          <router-link to="/create-article">写文章</router-link>
          <router-link to="/my-articles">我的文章</router-link>
          
          <!--
            【知识点】v-if 条件渲染：
            只有管理员才显示"管理中心"链接
            userStore.isAdmin 是计算属性，判断用户角色
          -->
          <router-link v-if="userStore.isAdmin" to="/admin">管理中心</router-link>
          
          <!--
            ============================================
            用户下拉菜单（Element Plus 组件）
            ============================================
          -->
          <!--
            【知识点】<el-dropdown>：
            Element Plus 的下拉菜单组件
            点击触发下拉，显示更多操作选项
            
            @command="handleCommand"：
            监听下拉菜单项点击事件
            点击菜单项时会触发 handleCommand 方法，传入 command 值
          -->
          <el-dropdown @command="handleCommand">
            <!--
              【知识点】下拉触发区域：
              点击这个区域会展开下拉菜单
              class="user-info" 包含头像和用户名
            -->
            <span class="user-info">
              <!--
                【知识点】<el-avatar>：
                Element Plus 的头像组件
                :size="32" - 头像大小 32px（: 表示绑定数值）
                :src="..." - 头像图片地址
                
                【知识点】短路求值：
                userStore.user && userStore.user.avatar
                如果 user 为 null，不会访问 avatar 属性，避免报错
                
                【知识点】默认头像：
                组件标签内 {{ }} 的内容是默认显示
                当 src 图片加载失败时显示
                这里显示用户名的首字母大写
              -->
              <el-avatar :size="32" :src="userStore.user && userStore.user.avatar">
                <!--
                  显示用户名首字母大写作为默认头像
                  charAt(0) 获取第一个字符
                  toUpperCase() 转为大写
                -->
                {{ userStore.user && userStore.user.username && userStore.user.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <!-- 显示用户名 -->
              <span>{{ userStore.user && userStore.user.username }}</span>
            </span>
            
            <!--
              【知识点】插槽 #dropdown：
              Vue 的具名插槽语法，定义下拉菜单内容
              Element Plus 组件使用插槽自定义内容
            -->
            <template #dropdown>
              <!--
                【知识点】<el-dropdown-menu>：
                下拉菜单容器，包含多个菜单项
              -->
              <el-dropdown-menu>
                <!--
                  【知识点】<el-dropdown-item>：
                  下拉菜单项
                  command="profile"：点击时传递的命令值
                  用于 handleCommand 方法识别点击了哪个菜单项
                -->
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="notifications">消息通知</el-dropdown-item>
                
                <!-- 管理员额外显示管理中心入口 -->
                <el-dropdown-item v-if="userStore.isAdmin" command="admin">管理中心</el-dropdown-item>
                
                <!-- 退出登录 -->
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        
        <!--
          【知识点】v-else：
          与 v-if 配合使用，当条件为 false 时渲染
          未登录用户显示登录和注册链接
        -->
        <template v-else>
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
        </template>
      </div>
    </div>
  </div>
</template>

<!-- ============================================
     脚本部分 (Script)
     ============================================ -->
<script setup lang="ts">
/**
 * 【知识点】<script setup>：
 * Vue 3 的组合式 API 语法糖
 * 无需 return 暴露变量，顶层定义的变量自动暴露给模板
 * 更简洁的代码组织方式
 */

// ============================================
// 1. 导入依赖
// ============================================

/**
 * 【知识点】Vue 组合式 API：
 * ref 用于创建响应式数据
 */
import { computed, onMounted, ref, watch } from 'vue'
import { debounce } from '@/utils/tools'

/**
 * 【知识点】useUserStore：
 * 从 Pinia store 导入用户状态管理
 * 用于获取登录状态、用户信息、执行登出操作
 */
import { useUserStore } from '@/stores/user'

/**
 * 【知识点】useThemeStore：
 * 从 Pinia store 导入主题状态管理
 * 用于切换和管理浅色/深色模式
 */
import { useThemeStore } from '@/stores/theme'

/**
 * 【知识点】useRouter：
 * Vue Router 提供的组合式函数
 * 用于编程式导航（代码中控制页面跳转）
 * 与 <router-link> 的区别：useRouter 用于 JS 代码中跳转
 */
import { useRoute, useRouter } from 'vue-router'

/**
 * 【知识点】Element Plus 图标：
 * 导入主题切换和搜索所需的图标组件
 */
import { Bell, Moon, Search, Sunny } from '@element-plus/icons-vue'

// ============================================
// 2. 初始化
// ============================================

/**
 * 【知识点】创建 store 实例：
 * 在组件中使用 useUserStore() 获取 store 实例
 * 可以访问 state、getters、actions
 */
const userStore = useUserStore()
const { showAboutLink = false } = defineProps<{
  showAboutLink?: boolean
}>()

/**
 * 【知识点】创建 theme store 实例：
 * 在组件中使用 useThemeStore() 获取主题 store 实例
 * 用于切换和管理浅色/深色模式
 */
const themeStore = useThemeStore()

/**
 * 【知识点】创建 router 实例：
 * 获取路由实例，用于编程式导航
 * 常用方法：
 * - router.push('/path') - 跳转到指定路径
 * - router.replace('/path') - 替换当前历史记录
 * - router.go(-1) - 返回上一页
 */
const router = useRouter()
const route = useRoute()
const hasUnreadNotifications = computed(() => userStore.notifications.unreadCount > 0)

// 搜索关键词
const searchKeyword = ref('')
const themeTooltipText = computed(() => (
  themeStore.isDarkMode ? '深色模式，点击切换为浅色模式' : '浅色模式，点击切换为深色模式'
))

/**
 * 防抖搜索处理函数
 * 300ms 防抖，避免频繁搜索
 */
const debouncedSearch = debounce(() => {
  const keyword = searchKeyword.value.trim()
  const nextQuery = { ...route.query }

  if (keyword) {
    void router.push({
      path: '/',
      query: {
        ...nextQuery,
        keyword,
      }
    })
    return
  }

  delete nextQuery.keyword
  void router.push({
    path: '/',
    query: nextQuery,
  })
}, 300)

/**
 * 处理搜索
 */
const handleSearch = () => {
  debouncedSearch()
}

/**
 * 监听搜索框输入，使用防抖
 */
const handleInput = () => {
  debouncedSearch()
}

const openNotificationsCenter = () => {
  void router.push({
    path: '/profile',
    query: {
      ...route.query,
      openNotifications: '1',
    },
  })
}

async function syncNotifications() {
  if (!userStore.isLoggedIn) {
    return
  }

  try {
    await userStore.getNotificationsAction()
  } catch (error) {
    // Keep header usable even if notification sync fails.
  }
}

// ============================================
// 3. 方法定义
// ============================================

/**
 * 【知识点】下拉菜单命令处理：
 * 处理用户点击下拉菜单项的操作
 * 
 * 参数：
 * - command：菜单项的 command 值（'profile', 'admin', 'logout'）
 * 
 * 【知识点】router.push：
 * 编程式导航，跳转到指定路由
 * 与点击 <router-link> 效果相同
 * 
 * 【知识点】userStore.logout()：
 * 调用 store 的 action 执行登出
 * 会清除 state 和 localStorage 中的用户数据
 */
const handleCommand = (command) => {
  // 根据 command 值执行不同操作
  if (command === 'profile') {
    // 跳转到个人中心页面
    router.push('/profile')
  } else if (command === 'notifications') {
    openNotificationsCenter()
  } else if (command === 'admin') {
    // 跳转到管理中心页面（管理员）
    router.push('/admin')
  } else if (command === 'logout') {
    // 执行登出操作
    userStore.logout()
    // 跳转到首页
    router.push('/')
  }
}

/**
 * 处理主题切换
 * 直接在浅色 / 深色之间切换，点击即可生效
 */
const handleThemeToggle = () => {
  themeStore.setTheme(themeStore.isDarkMode ? 'light' : 'dark')
}

watch(() => route.query.keyword, (value) => {
  searchKeyword.value = typeof value === 'string' ? value : ''
}, { immediate: true })

watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (!isLoggedIn) {
    return
  }

  void syncNotifications()
}, { immediate: true })

onMounted(() => {
  void syncNotifications()
})
</script>

<!-- ============================================
     样式部分 (Style)
     ============================================ -->
<style scoped>
/**
 * 【知识点】scoped 属性：
 * 表示样式只作用于当前组件
 * 不会影响其他组件的相同类名
 * Vue 会自动添加 data-v-xxxxx 属性来隔离样式
 */

/**
 * 【知识点】Header 容器样式：
 * 固定在页面顶部，始终可见
 * 使用 CSS 变量支持主题切换
 */
.header {
  /* 使用全局 CSS 变量 */
  background: var(--bg-card);
  
  /**
   * 【知识点】box-shadow：
   * 添加阴影效果，增加层次感
   * 使用全局 CSS 变量
   */
  box-shadow: 0 2px 8px var(--shadow-light);
  
  /**
   * 【知识点】position: sticky：
   * 粘性定位，元素在滚动时会"粘"在指定位置
   * 这里是粘在顶部（top: 0）
   * 比 fixed 更灵活，在到达阈值前正常滚动
   */
  position: sticky;
  top: 0;
  
  /**
   * 【知识点】z-index：
   * 控制元素的堆叠顺序，值越大越在上层
   * 确保 Header 始终显示在内容之上
   */
  z-index: 100;
  
  /**
   * 【知识点】transition：
   * 过渡动画效果，与全局样式保持一致
   */
  transition: background-color var(--transition-normal), color var(--transition-normal),
    border-color var(--transition-normal), box-shadow var(--transition-normal);
}

/**
 * 【知识点】内容容器：
 * 限制最大宽度，居中显示
 */
.container {
  /* 最大宽度 1200px，在大屏幕上不会过宽 */
  max-width: 1200px;
  
  /**
   * 【知识点】margin: 0 auto：
   * 上下外边距 0，左右自动（相等）
   * 实现水平居中效果
   */
  margin: 0 auto;
  
  /* 左右内边距，防止内容贴边 */
  padding: 0 20px;
  
  /**
   * 【知识点】Flexbox 布局：
   * display: flex 启用弹性布局
   * 轻松实现水平排列和垂直居中
   */
  display: flex;
  
  /**
   * 【知识点】justify-content: space-between：
   * 主轴（水平方向）上两端对齐
   * Logo 在左，导航在右
   */
  justify-content: space-between;
  
  /**
   * 【知识点】align-items: center：
   * 交叉轴（垂直方向）上居中对齐
   * 所有子元素垂直居中
   */
  align-items: center;
  /**
   * 【知识点】gap：align-items: center;
   * CSS Grid/Flexbox 属性
   * 设置子元素之间的间距
   * 这里设置导航项之间间隔 20px
   */
  
  /* 固定高度 */
  height: 60px;
}

/**
 * 【知识点】Logo 样式：
 */
.logo a {
  /* 古风字体 - 使用衬线体和书法风格字体 */
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", "FangSong", "STFangsong", serif;
  /* 大字体，突出品牌 */
  font-size: 26px;

  /* 粗体 */
  font-weight: bold;

  /* 使用全局主色调 */
  color: var(--mint-green);

  /* 去除下划线 */
  text-decoration: none;

  /* 过渡动画效果 */
  transition: color var(--transition-fast), text-shadow var(--transition-fast);
}

.logo a:hover {
  color: var(--mint-green-dark);
  /* 悬停时添加古风发光效果 */
  text-shadow: 0 0 10px rgba(63, 182, 145, 0.5), 0 2px 4px rgba(0, 0, 0, 0.1);
}

/**
 * 【知识点】导航区域样式：
 */
.nav {
  /* 弹性布局 */
  display: flex;
  
  /* 垂直居中 */
  align-items: center;
  
  /**
   * 【知识点】gap：
   * CSS Grid/Flexbox 属性
   * 设置子元素之间的间距
   * 这里设置导航项之间间隔 20px
   */
  gap: 20px;
}

/**
 * 搜索框样式
 */
.search-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  background-color: var(--bg-card);
  padding: 12px;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px var(--shadow-light);
  transition: all var(--transition-normal);
}

.search-header {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 8px;
}

.user-info-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  background-color: var(--bg-hover);
  transition: all var(--transition-fast);
}

.user-info-mini:hover {
  background-color: var(--mint-green-light);
}

.user-name-mini {
  font-size: 12px;
  color: var(--text-main);
  transition: color var(--transition-fast);
}

.user-info-mini:hover .user-name-mini {
  color: var(--mint-green);
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-box:hover {
  box-shadow: 0 4px 12px var(--shadow-medium);
}

.search-btn {
  background-color: var(--bg-main) !important;
  border-color: var(--border-light) !important;
  color: var(--text-main) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.search-btn:hover {
  background-color: var(--mint-green-light) !important;
  border-color: var(--mint-green) !important;
  color: var(--mint-green) !important;
}

/**
 * 【知识点】主题切换按钮样式：
 * 使用 CSS 变量支持主题切换
 */
.theme-toggle-btn {
  background-color: var(--bg-main) !important;
  border-color: var(--border-light) !important;
  color: var(--text-main) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.theme-toggle-btn:hover {
  background-color: var(--mint-green-light) !important;
  border-color: var(--mint-green) !important;
  color: var(--mint-green) !important;
}

.header-notification-badge {
  display: inline-flex;
}

/**
 * 【知识点】导航链接样式：
 * 使用 CSS 变量支持主题切换
 */
.nav a {
  /* 使用全局 CSS 变量 */
  color: var(--text-main);
  
  /* 去除下划线 */
  text-decoration: none;
  
  /* 14px 字体大小 */
  font-size: 14px;
  
  /**
   * 【知识点】transition：
   * 过渡动画效果
   * 与全局样式保持一致
   */
  transition: color var(--transition-fast);
  
  /* 增加内边距，提升点击区域 */
  padding: 6px 12px;
  border-radius: var(--radius-md);
}

/**
 * 【知识点】链接悬停效果：
 * :hover 伪类，鼠标悬停时的样式
 */
.nav a:hover {
  /* 悬停时使用主色调 */
  color: var(--mint-green);
  background-color: var(--mint-green-light);
}

/**
 * 【知识点】用户信息区域样式：
 */
.user-info {
  /* 弹性布局，头像和用户名水平排列 */
  display: flex;
  
  /* 垂直居中 */
  align-items: center;
  
  /* 头像和用户名之间间隔 8px */
  gap: 8px;
  
  /**
   * 【知识点】cursor: pointer：
   * 鼠标悬停时显示手型光标
   * 提示用户该区域可点击
   */
  cursor: pointer;
  
  /* 增加内边距，提升点击区域 */
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.user-info:hover {
  background-color: var(--mint-green-light);
}

/**
 * 【知识点】用户名文字样式：
 * 使用 CSS 变量支持主题切换
 */
.user-info span {
  font-size: 14px;
  color: var(--text-main);
  transition: color var(--transition-fast);
}

.user-info:hover span {
  color: var(--mint-green);
}
</style>
