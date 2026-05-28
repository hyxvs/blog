<template>
  <div class="about-page guofeng-about guofeng-site-page" :class="{ dark: isDark }">
    <div class="main-container">
      <aside class="left-sidebar">
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-icon">
              <img src="/images/logo.png" alt="Logo" class="logo-img" />
            </div>
            <div class="brand-copy">
              <span class="brand-name">自在逍遥</span>
              <span class="brand-subtitle">一个安静记录的个人博客</span>
            </div>
          </div>
        </div>

        <nav class="nav-menu">
          <router-link to="/" class="nav-item">
            <el-icon class="nav-item-icon"><House /></el-icon>
            <span>首页</span>
          </router-link>

          <template v-if="!userStore.isLoggedIn">
            <div class="nav-divider"></div>
            <router-link to="/login" class="nav-item">
              <el-icon class="nav-item-icon"><Key /></el-icon>
              <span>登录</span>
            </router-link>
            <router-link to="/register" class="nav-item">
              <el-icon class="nav-item-icon"><UserFilled /></el-icon>
              <span>注册</span>
            </router-link>
          </template>

          <template v-else>
            <div class="nav-divider"></div>
            <router-link to="/profile" class="nav-item">
              <el-icon class="nav-item-icon"><User /></el-icon>
              <span>个人资料</span>
            </router-link>
            <router-link to="/create-article" class="nav-item">
              <el-icon class="nav-item-icon"><EditPen /></el-icon>
              <span>创建文章</span>
            </router-link>
            <router-link to="/my-articles" class="nav-item">
              <el-icon class="nav-item-icon"><Document /></el-icon>
              <span>我的文章</span>
            </router-link>

            <template v-if="userStore.isAdmin">
              <div class="nav-divider"></div>
              <router-link to="/admin" class="nav-item">
                <el-icon class="nav-item-icon"><Monitor /></el-icon>
                <span>管理中心</span>
              </router-link>
            </template>
          </template>
        </nav>
      </aside>

      <main class="content-area">
        <div class="about-content">
          <div class="about-header">
            <div class="avatar-wrapper">
              <div class="avatar-circle">
                <img src="/images/header.jpg" alt="Avatar" class="avatar-img" />
              </div>
              <div class="avatar-decoration"></div>
            </div>
            <h1 class="about-title">轩行</h1>
            <p class="about-subtitle">山水之间，笔墨为伴</p>
          </div>

          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><User /></el-icon>
                <span>自我介绍</span>
              </div>
            </template>
            <div class="about-text">
              <p>目前是地理信息科学专业在读，热爱前端、全栈开发以及 GIS 方向的实践与探索。</p>
              <p><strong>技术栈：</strong>Vue 3、TypeScript、Node.js、PostgreSQL、PostGIS、WebGIS。</p>
              <p>平时喜欢写代码、做项目、记笔记，也喜欢把零散知识整理成能长期复用的内容。</p>
            </div>
          </el-card>

          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>个人成长时间线</span>
              </div>
            </template>
            <div class="timeline-list">
              <div v-for="item in growthTimeline" :key="`${item.period}-${item.title}`" class="timeline-item">
                <div class="timeline-marker">
                  <span class="timeline-dot"></span>
                </div>
                <div class="timeline-content">
                  <span class="timeline-period">{{ item.period }}</span>
                  <h3 class="timeline-title">{{ item.title }}</h3>
                  <p class="timeline-description">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><Monitor /></el-icon>
                <span>精选项目卡片</span>
              </div>
            </template>
            <div class="projects-grid">
              <article v-for="project in featuredProjects" :key="project.title" class="project-card">
                <div class="project-card-header">
                  <div>
                    <span class="project-status">{{ project.status }}</span>
                    <h3 class="project-title">{{ project.title }}</h3>
                  </div>
                  <p class="project-role">{{ project.role }}</p>
                </div>
                <p class="project-summary">{{ project.summary }}</p>
                <div class="project-stack-list">
                  <span v-for="stack in project.stacks" :key="stack" class="project-stack-chip">{{ stack }}</span>
                </div>
                <ul class="project-highlights">
                  <li v-for="highlight in project.highlights" :key="highlight" class="project-highlight-item">
                    {{ highlight }}
                  </li>
                </ul>
              </article>
            </div>
          </el-card>

          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><Search /></el-icon>
                <span>技术栈展示</span>
              </div>
            </template>
            <div class="skills-grid">
              <article v-for="group in skillGroups" :key="group.title" class="skill-group-card">
                <h3 class="skill-group-title">{{ group.title }}</h3>
                <p class="skill-group-summary">{{ group.summary }}</p>
                <div class="skill-chip-list">
                  <span v-for="item in group.items" :key="item" class="skill-chip">{{ item }}</span>
                </div>
              </article>
            </div>
          </el-card>

          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>博客初衷</span>
              </div>
            </template>
            <div class="about-text">
              <p>这个博客主要用来记录学习笔记、项目复盘、踩坑经验和一些值得沉淀下来的想法。</p>
              <p>希望把碎片化知识慢慢整理成系统内容，也希望能给后来者留下一点真实可用的参考。</p>
              <p>这里不追热点，也不追流量，只想认真写字，认真记录，保留一个安静、干净的角落。</p>
            </div>
          </el-card>

          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><Edit /></el-icon>
                <span>个人态度</span>
              </div>
            </template>
            <div class="about-text">
              <p>持续学习，低调深耕，尽量少一些浮躁，多一些扎实。</p>
              <p>专注技术，也热爱生活，慢一点并不代表落后，反而更容易走得更远。</p>
            </div>
          </el-card>

          <el-card class="about-card quote-card">
            <div class="quote-content">
              <el-icon class="quote-icon"><ChatDotRound /></el-icon>
              <p class="quote-text">我辞三界，别五行，自去逍遥。</p>
              <p class="quote-author">节选自《归去来兮》</p>
            </div>
          </el-card>

          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><ChatDotRound /></el-icon>
                <span>联系方式</span>
              </div>
            </template>
            <div class="contact-list">
              <a href="mailto:2933365269@qq.com" class="contact-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>2933365269@qq.com</span>
              </a>
              <a href="https://github.com/hyxvs" target="_blank" rel="noopener noreferrer" class="contact-item">
                <el-icon><Edit /></el-icon>
                <span>github.com/hyxvs</span>
              </a>
              <div class="contact-item">
                <el-icon><Plus /></el-icon>
                <span>QQ: 2933365269</span>
              </div>
            </div>
          </el-card>
        </div>
      </main>

      <aside class="right-sidebar">
        <div class="widget stats-widget">
          <h3 class="widget-title">
            <el-icon><Search /></el-icon>
            博客统计
          </h3>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-name">文章</span>
              <span class="stat-value">{{ loading ? '...' : stats.articleCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">分类</span>
              <span class="stat-value">{{ loading ? '...' : stats.categoryCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">评论</span>
              <span class="stat-value">{{ loading ? '...' : stats.commentCount }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { getPublicStats } from '@/api/article'
import {
  House,
  Key,
  UserFilled,
  User,
  EditPen,
  Document,
  Monitor,
  ChatDotRound,
  Edit,
  Plus,
  Search,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const stats = ref({
  articleCount: 0,
  categoryCount: 0,
  commentCount: 0,
})

const loading = ref(true)

type TimelineItem = {
  period: string
  title: string
  description: string
}

type FeaturedProject = {
  title: string
  status: string
  role: string
  summary: string
  stacks: string[]
  highlights: string[]
}

type SkillGroup = {
  title: string
  summary: string
  items: string[]
}

const growthTimeline: TimelineItem[] = [
  {
    period: '2025.07',
    title: '开始系统学习前端开发',
    description: '从页面结构、交互逻辑和组件拆分入手，逐步建立起对 Web 开发的整体理解。',
  },
  {
    period: '2025.09',
    title: '进入 Vue 3 与 TypeScript 阶段',
    description: '开始用 Vue 3、TypeScript、Pinia 和 Vue Router 搭完整页面，逐渐形成工程化开发习惯。',
  },
  {
    period: '2025.12',
    title: '向全栈开发和数据库延展',
    description: '把 Node.js、接口设计、权限管理和 PostgreSQL 串联起来，开始独立完成前后端联调。',
  },
  {
    period: '2026 至今',
    title: '聚焦 GIS / WebGIS 与项目沉淀',
    description: '把 WebGIS、PostGIS 和内容平台实践结合起来，持续通过项目复盘和博客写作沉淀方法论。',
  },
]

const featuredProjects: FeaturedProject[] = [
  {
    title: '博客平台',
    status: '持续迭代',
    role: '全栈实践项目',
    summary: '围绕文章创作、展示、用户管理和后台维护做的一体化博客平台，重点打磨内容体验和页面结构。',
    stacks: ['Vue 3', 'TypeScript', 'Node.js', 'PostgreSQL', 'Element Plus'],
    highlights: [
      '完成文章创建、编辑、展示、管理等核心流程。',
      '把前端页面、接口联调和权限访问串成完整闭环。',
      '持续优化首页、About 页面和整体信息架构。',
    ],
  },
  {
    title: 'WebGIS 地图展示练习',
    status: '方向积累',
    role: 'GIS / WebGIS 学习项目',
    summary: '围绕地图展示、空间数据理解和可视化交互做的练习型项目，用来衔接专业背景与 Web 能力。',
    stacks: ['WebGIS', 'PostGIS', 'PostgreSQL', '空间数据', '地图可视化'],
    highlights: [
      '把地图展示和前端交互结合起来理解空间信息表达。',
      '重点积累数据组织、查询思路和可视化呈现方式。',
      '为后续更完整的 GIS 项目打基础。',
    ],
  },
  {
    title: 'AI 辅助内容工作台',
    status: '功能探索',
    role: '内容效率增强模块',
    summary: '把 AI 能力和写作场景结合，用在摘要生成、内容辅助和文章编辑流程中，提高创作效率。',
    stacks: ['AI 辅助', '内容生成', '编辑流程', '交互设计'],
    highlights: [
      '把 AI 能力嵌入内容工作流，而不是独立悬空功能。',
      '兼顾辅助效率与实际可用性，避免只停留在展示层。',
      '持续探索技术能力和内容创作之间的结合点。',
    ],
  },
]

const skillGroups: SkillGroup[] = [
  {
    title: '前端工程',
    summary: '偏向组件化开发、页面结构设计和交互体验落地。',
    items: ['Vue 3', 'TypeScript', 'Vite', 'Pinia', 'Vue Router', 'Element Plus'],
  },
  {
    title: '后端与接口',
    summary: '能够完成接口设计、业务逻辑组织和基础权限流程搭建。',
    items: ['Node.js', 'Express', 'REST API', 'JWT', '文件上传', '权限控制'],
  },
  {
    title: '数据库与数据',
    summary: '关注数据结构设计、SQL 组织和空间数据相关能力。',
    items: ['PostgreSQL', 'SQL', 'PostGIS', 'Schema Design', '数据建模'],
  },
  {
    title: '工具与方向',
    summary: '持续把开发工具、内容沉淀和 GIS 方向结合起来。',
    items: ['Git', 'GitHub', 'AI 辅助开发', 'WebGIS', '项目复盘', '技术写作'],
  },
]

async function loadStats() {
  try {
    loading.value = true
    const data = await getPublicStats()
    stats.value = {
      articleCount: data.articleCount,
      categoryCount: data.categoryCount,
      commentCount: data.commentCount,
    }
  } catch (error) {
    console.error('Failed to load public stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStats()
})
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(247, 245, 240, 0.9) 0%, rgba(238, 245, 240, 0.85) 50%, rgba(242, 248, 244, 0.9) 100%),
    url('/images/3.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.about-page.dark {
  background:
    linear-gradient(180deg, rgba(15, 20, 18, 0.92) 0%, rgba(20, 28, 25, 0.88) 50%, rgba(18, 26, 23, 0.9) 100%),
    url('/images/3.png');
}

.main-container {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr) var(--right-sidebar-width);
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
}

.left-sidebar,
.right-sidebar {
  position: sticky;
  top: 24px;
  height: fit-content;
}

.left-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand-section,
.nav-menu,
.about-header,
.about-card,
.widget {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 12px var(--shadow-light);
}

.brand-section {
  padding: 24px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
}

.brand-subtitle {
  font-size: 12px;
  color: var(--text-light);
  letter-spacing: 1px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--text-main);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--mint-green);
  transform: translateX(4px);
}

.nav-divider {
  height: 1px;
  margin: 8px 0;
  background: var(--border-light);
  opacity: 0.5;
}

.content-area {
  min-width: 0;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.about-header {
  padding: 40px 24px;
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.avatar-circle {
  position: relative;
  z-index: 2;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--mint-green), var(--mountain-green));
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-decoration {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-gold);
}

.about-title {
  margin: 0 0 8px;
  font-size: 36px;
  font-weight: 700;
  color: var(--text-dark);
}

.about-subtitle {
  margin: 0;
  font-size: 16px;
  color: var(--text-light);
  letter-spacing: 4px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.card-header .el-icon {
  color: var(--mint-green);
}

.about-text {
  font-size: 15px;
  line-height: 2;
  color: var(--text-main);
}

.about-text p {
  margin: 0 0 16px;
  text-indent: 2em;
}

.about-text p:last-child {
  margin-bottom: 0;
}

.timeline-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: linear-gradient(180deg, rgba(63, 133, 118, 0.35) 0%, rgba(63, 133, 118, 0.12) 100%);
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 18px;
}

.timeline-marker {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--mint-green);
  box-shadow: 0 0 0 5px rgba(63, 133, 118, 0.12);
}

.timeline-content {
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(111, 168, 153, 0.08) 0%, rgba(255, 255, 255, 0.78) 100%);
  border: 1px solid rgba(111, 168, 153, 0.12);
}

.timeline-period {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(111, 168, 153, 0.12);
  color: rgba(63, 133, 118, 0.96);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.timeline-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-dark);
}

.timeline-description {
  margin: 10px 0 0;
  line-height: 1.85;
  color: var(--text-main);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 247, 243, 0.92) 100%);
  border: 1px solid rgba(111, 168, 153, 0.14);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.project-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(63, 133, 118, 0.12);
  color: rgba(63, 133, 118, 0.96);
  font-size: 12px;
  font-weight: 700;
}

.project-title {
  margin: 0;
  font-size: 20px;
  color: var(--text-dark);
}

.project-role {
  margin: 0;
  color: var(--text-light);
  font-size: 13px;
}

.project-summary {
  margin: 0;
  line-height: 1.8;
  color: var(--text-main);
}

.project-stack-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-stack-chip {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(111, 168, 153, 0.08);
  color: rgba(63, 133, 118, 0.96);
  font-size: 12px;
}

.project-highlights {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-highlight-item {
  position: relative;
  padding-left: 16px;
  line-height: 1.75;
  color: var(--text-main);
}

.project-highlight-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.75em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--mint-green);
  transform: translateY(-50%);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.skill-group-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(245, 249, 246, 0.92) 100%);
  border: 1px solid rgba(111, 168, 153, 0.12);
}

.skill-group-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-dark);
}

.skill-group-summary {
  margin: 10px 0 0;
  line-height: 1.75;
  color: var(--text-light);
}

.skill-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.skill-chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(111, 168, 153, 0.1);
  color: rgba(63, 133, 118, 0.96);
  font-size: 12px;
  font-weight: 600;
}

.quote-card {
  background: linear-gradient(135deg, var(--mint-green-light), var(--bg-card));
  border-left: 4px solid var(--mint-green);
}

.quote-content {
  padding: 24px;
  text-align: center;
}

.quote-icon {
  margin-bottom: 12px;
  font-size: 32px;
  color: var(--mint-green);
}

.quote-text {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-dark);
  font-style: italic;
}

.quote-author {
  margin: 0;
  font-size: 14px;
  color: var(--text-light);
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  color: var(--text-main);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.contact-item:hover {
  background: var(--bg-hover);
  color: var(--mint-green);
}

.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.widget {
  padding: 20px;
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-name {
  font-size: 14px;
  color: var(--text-light);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--mint-green);
}

/* 深色主题样式 - 荧光效果 */
.about-page.dark .about-title {
  color: #f5f5f5;
  text-shadow: 0 0 10px rgba(63, 182, 145, 0.6), 0 0 20px rgba(63, 182, 145, 0.4), 0 0 30px rgba(63, 182, 145, 0.2);
}

.about-page.dark .about-subtitle {
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 0 8px rgba(63, 182, 145, 0.4);
}

.about-page.dark .brand-name {
  color: #f5f5f5;
  text-shadow: 0 0 12px rgba(63, 182, 145, 0.5), 0 0 24px rgba(63, 182, 145, 0.3);
}

.about-page.dark .brand-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

.about-page.dark .card-header {
  color: #f5f5f5;
  text-shadow: 0 0 8px rgba(63, 182, 145, 0.4);
}

.about-page.dark .about-text {
  color: rgba(255, 255, 255, 0.9);
}

.about-page.dark .about-text strong {
  color: #f5f5f5;
  text-shadow: 0 0 6px rgba(63, 182, 145, 0.5);
}

.about-page.dark .timeline-title {
  color: #f5f5f5;
  text-shadow: 0 0 8px rgba(63, 182, 145, 0.4);
}

.about-page.dark .timeline-description {
  color: rgba(255, 255, 255, 0.85);
}

.about-page.dark .timeline-content {
  background: linear-gradient(135deg, rgba(63, 133, 118, 0.12) 0%, rgba(30, 45, 40, 0.85) 100%);
  border: 1px solid rgba(63, 182, 145, 0.25);
  box-shadow: 0 0 20px rgba(63, 182, 145, 0.1), inset 0 0 20px rgba(63, 182, 145, 0.05);
}

.about-page.dark .timeline-dot {
  background: var(--mint-green);
  box-shadow: 0 0 10px var(--mint-green), 0 0 20px rgba(63, 182, 145, 0.5), 0 0 30px rgba(63, 182, 145, 0.3);
}

.about-page.dark .project-card {
  background: linear-gradient(180deg, rgba(30, 45, 40, 0.95) 0%, rgba(25, 38, 35, 0.92) 100%);
  border: 1px solid rgba(63, 182, 145, 0.2);
  box-shadow: 0 4px 20px rgba(63, 182, 145, 0.08), inset 0 0 30px rgba(63, 182, 145, 0.03);
  transition: all 0.3s ease;
}

.about-page.dark .project-card:hover {
  border-color: rgba(63, 182, 145, 0.5);
  box-shadow: 0 4px 30px rgba(63, 182, 145, 0.15), 0 0 40px rgba(63, 182, 145, 0.1);
  transform: translateY(-2px);
}

.about-page.dark .project-title {
  color: #f5f5f5;
  text-shadow: 0 0 8px rgba(63, 182, 145, 0.4);
}

.about-page.dark .project-role {
  color: rgba(255, 255, 255, 0.7);
}

.about-page.dark .project-summary {
  color: rgba(255, 255, 255, 0.85);
}

.about-page.dark .project-highlight-item {
  color: rgba(255, 255, 255, 0.85);
}

.about-page.dark .project-highlight-item::before {
  background: var(--mint-green);
  box-shadow: 0 0 8px var(--mint-green), 0 0 16px rgba(63, 182, 145, 0.5);
}

.about-page.dark .skill-group-card {
  background: linear-gradient(135deg, rgba(30, 45, 40, 0.94) 0%, rgba(25, 40, 35, 0.92) 100%);
  border: 1px solid rgba(63, 182, 145, 0.2);
  box-shadow: 0 0 15px rgba(63, 182, 145, 0.08);
}

.about-page.dark .skill-group-title {
  color: #f5f5f5;
  text-shadow: 0 0 8px rgba(63, 182, 145, 0.4);
}

.about-page.dark .skill-group-summary {
  color: rgba(255, 255, 255, 0.7);
}

.about-page.dark .skill-chip {
  background: rgba(63, 182, 145, 0.15);
  color: rgba(63, 182, 145, 0.96);
  box-shadow: 0 0 10px rgba(63, 182, 145, 0.2);
}

.about-page.dark .project-stack-chip {
  background: rgba(63, 182, 145, 0.15);
  color: rgba(63, 182, 145, 0.96);
  box-shadow: 0 0 10px rgba(63, 182, 145, 0.2);
}

.about-page.dark .quote-card {
  background: linear-gradient(135deg, rgba(63, 133, 118, 0.18), rgba(30, 45, 40, 0.85));
  border-left: 4px solid var(--mint-green);
  box-shadow: 0 0 25px rgba(63, 182, 145, 0.12), inset 0 0 30px rgba(63, 182, 145, 0.05);
}

.about-page.dark .quote-text {
  color: #f5f5f5;
  text-shadow: 0 0 12px rgba(63, 182, 145, 0.5), 0 0 24px rgba(63, 182, 145, 0.3);
}

.about-page.dark .quote-author {
  color: rgba(255, 255, 255, 0.7);
}

.about-page.dark .quote-icon {
  color: var(--mint-green);
  filter: drop-shadow(0 0 10px var(--mint-green)) drop-shadow(0 0 20px rgba(63, 182, 145, 0.5));
}

.about-page.dark .contact-item {
  color: rgba(255, 255, 255, 0.85);
}

.about-page.dark .contact-item:hover {
  background: rgba(63, 182, 145, 0.12);
  color: var(--mint-green);
  box-shadow: 0 0 20px rgba(63, 182, 145, 0.2);
}

.about-page.dark .widget-title {
  color: rgba(255, 255, 255, 0.7);
}

.about-page.dark .stat-name {
  color: rgba(255, 255, 255, 0.7);
}

.about-page.dark .stat-value {
  color: var(--mint-green);
  text-shadow: 0 0 10px var(--mint-green), 0 0 20px rgba(63, 182, 145, 0.5);
}

.about-page.dark .nav-item {
  color: rgba(255, 255, 255, 0.85);
}

.about-page.dark .nav-item:hover {
  background: rgba(63, 182, 145, 0.15);
  color: var(--mint-green);
  box-shadow: 0 0 20px rgba(63, 182, 145, 0.2);
  text-shadow: 0 0 8px rgba(63, 182, 145, 0.5);
}

.about-page.dark .brand-section,
.about-page.dark .nav-menu,
.about-page.dark .about-header,
.about-page.dark .about-card,
.about-page.dark .widget {
  background: rgba(20, 30, 28, 0.85);
  border: 1px solid rgba(63, 182, 145, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 30px rgba(63, 182, 145, 0.03);
}

.about-page.dark .logo-icon {
  box-shadow: 0 0 15px rgba(63, 182, 145, 0.3), 0 0 30px rgba(63, 182, 145, 0.1);
}

.about-page.dark .avatar-circle {
  box-shadow: 0 0 20px rgba(63, 182, 145, 0.3), 0 0 40px rgba(63, 182, 145, 0.15);
}

@media (max-width: 1200px) {
  .main-container {
    grid-template-columns: 260px minmax(0, 1fr);
  }

  .projects-grid,
  .skills-grid {
    grid-template-columns: 1fr;
  }

  .right-sidebar {
    grid-column: 1 / -1;
    position: static;
  }
}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .left-sidebar,
  .right-sidebar {
    position: static;
  }

  .about-header {
    padding: 28px 18px;
  }

  .timeline-item {
    gap: 14px;
  }

  .timeline-content,
  .project-card,
  .skill-group-card {
    padding: 16px;
  }

  .about-title {
    font-size: 30px;
  }

  .about-subtitle {
    letter-spacing: 2px;
  }
}
</style>
