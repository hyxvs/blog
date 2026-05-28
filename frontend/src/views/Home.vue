<template>
  <div class="home-page" :class="{ dark: isDark }">
    <main class="home-shell">
      <section id="hero" class="hero-section">
        <div class="hero-background">
          <div class="hero-image hero-image-1"></div>
          <div class="hero-image hero-image-2"></div>
          <div class="hero-image hero-image-3"></div>
          <div class="hero-image hero-image-4"></div>
          <div class="hero-overlay"></div>
          <div class="hero-gradient-top"></div>
          <div class="hero-gradient-bottom"></div>
        </div>

        <div class="hero-content">
          <div class="theme-switcher">
            <button
              v-for="theme in themes"
              :key="theme.id"
              type="button"
              class="theme-btn"
              :class="{ active: currentTheme === theme.id }"
              :style="{ '--theme-color': theme.color }"
              @click="switchTheme(theme.id)"
              :title="theme.name"
            >
              <span>{{ theme.name }}</span>
            </button>
          </div>

          <div class="hero-title">
            <h1>山川湖海</h1>
          </div>

          <div class="hero-uptime">
            <div class="uptime-item">
              <strong>{{ currentTime.year }}</strong>
              <span>年</span>
            </div>
            <div class="uptime-item">
              <strong>{{ String(currentTime.month).padStart(2, '0') }}</strong>
              <span>月</span>
            </div>
            <div class="uptime-item">
              <strong>{{ String(currentTime.day).padStart(2, '0') }}</strong>
              <span>日</span>
            </div>
            <div class="uptime-item">
              <strong>{{ String(currentTime.hours).padStart(2, '0') }}</strong>
              <span>时</span>
            </div>
            <div class="uptime-item">
              <strong>{{ String(currentTime.minutes).padStart(2, '0') }}</strong>
              <span>分</span>
            </div>
            <div class="uptime-item">
              <strong>{{ String(currentTime.seconds).padStart(2, '0') }}</strong>
              <span>秒</span>
            </div>
          </div>

          <div class="hero-actions">
            <el-button type="primary" size="large" class="hero-button" @click="scrollToSection('showcase')">
              查看全部文章
            </el-button>
          </div>
        </div>
      </section>

      <section id="gallery" class="gallery-section">
        <div class="section-header">
          <p class="section-tag">GALLERY</p>
          <h2>首页视觉画廊</h2>
        </div>

        <div class="gallery-grid">
          <div class="gallery-item gallery-item-large" @mouseenter="hoveredItem = 1" @mouseleave="hoveredItem = null">
            <div class="gallery-image-wrapper">
              <img :src="galleryImages[0]" alt="山水风景" class="gallery-image" />
              <div class="gallery-overlay" :class="{ active: hoveredItem === 1 }">
                <span class="gallery-caption">水墨江南</span>
              </div>
            </div>
          </div>

          <div class="gallery-item" @mouseenter="hoveredItem = 2" @mouseleave="hoveredItem = null">
            <div class="gallery-image-wrapper">
              <img :src="galleryImages[1]" alt="古镇风光" class="gallery-image" />
              <div class="gallery-overlay" :class="{ active: hoveredItem === 2 }">
                <span class="gallery-caption">烟雨古镇</span>
              </div>
            </div>
          </div>

          <div class="gallery-item" @mouseenter="hoveredItem = 3" @mouseleave="hoveredItem = null">
            <div class="gallery-image-wrapper">
              <img :src="galleryImages[2]" alt="山水人家" class="gallery-image" />
              <div class="gallery-overlay" :class="{ active: hoveredItem === 3 }">
                <span class="gallery-caption">山水如画</span>
              </div>
            </div>
          </div>

          <div class="gallery-item gallery-item-wide" @mouseenter="hoveredItem = 4" @mouseleave="hoveredItem = null">
            <div class="gallery-image-wrapper">
              <img :src="galleryImages[3]" alt="意境山水" class="gallery-image" />
              <div class="gallery-overlay" :class="{ active: hoveredItem === 4 }">
                <span class="gallery-caption">意境悠远</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="showcase" class="showcase-section">
        <div class="section-header showcase-header">
          <div>
            <p class="section-tag">ARTICLE SHOWCASE</p>
            <h2>按用户分类展示文章</h2>
          </div>
          <div class="showcase-summary">
            <strong>{{ groupedArticles.length }}</strong>
            <span>位作者 / {{ articles.length }} 篇文章</span>
          </div>
        </div>

        <div class="showcase-controls">
          <div class="showcase-filter-grid">
            <div class="showcase-filter-card">
              <span class="filter-label">关键词</span>
              <div v-if="keywordFilter" class="keyword-filter-pill">
                <strong>{{ keywordFilter }}</strong>
                <button type="button" @click="clearKeywordFilter">清除</button>
              </div>
              <p v-else class="filter-hint">可以通过顶部搜索框快速筛选文章</p>
            </div>

            <div class="showcase-filter-card">
              <span class="filter-label">分类筛选</span>
              <el-select
                v-model="selectedCategory"
                class="showcase-select"
                placeholder="全部分类"
              >
                <el-option label="全部分类" value="all" />
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </div>

            <div class="showcase-filter-card">
              <span class="filter-label">作者筛选</span>
              <el-select
                v-model="selectedAuthorKey"
                class="showcase-select"
                placeholder="全部作者"
              >
                <el-option label="全部作者" value="all" />
                <el-option
                  v-for="author in authorOptions"
                  :key="author.key"
                  :label="`${author.name} (${author.articleCount})`"
                  :value="author.key"
                />
              </el-select>
            </div>

            <div class="showcase-filter-card">
              <span class="filter-label">排序方式</span>
              <el-select
                v-model="selectedSort"
                class="showcase-select"
                placeholder="最新发布"
              >
                <el-option label="最新发布" value="latest" />
                <el-option label="最早发布" value="oldest" />
                <el-option label="点赞最高" value="mostLiked" />
              </el-select>
            </div>
          </div>

          <div class="showcase-control-footer">
            <div class="showcase-filter-state">
              <span>筛选结果：{{ groupedArticles.length }} 位作者 / {{ filteredArticles.length }} 篇文章</span>
              <span v-if="hasActiveFilters">已启用 {{ activeFilterCount }} 项条件</span>
            </div>
            <el-button plain :disabled="!hasActiveFilters" @click="resetShowcaseFilters">
              重置筛选
            </el-button>
          </div>
        </div>

        <div v-if="articlesLoading" class="article-grid">
          <article
            v-for="index in 6"
            :key="`article-skeleton-${index}`"
            class="article-card article-card-skeleton"
          >
            <div class="skeleton-box skeleton-cover"></div>
            <div class="article-body">
              <div class="skeleton-box skeleton-meta"></div>
              <div class="skeleton-box skeleton-title"></div>
              <div class="skeleton-box skeleton-line"></div>
              <div class="skeleton-box skeleton-line short"></div>
            </div>
          </article>
        </div>

        <div v-else-if="groupedArticles.length > 0">
          <div class="author-list-toolbar">
            <div class="author-list-summary">
              <span>作者列表</span>
              <strong>
                {{ isAuthorListExpanded ? '已展开全部作者' : `当前展示前 ${visibleGroupedArticles.length} 位作者` }}
              </strong>
            </div>
            <button
              v-if="hasMoreAuthors"
              type="button"
              class="author-list-toggle-btn"
              @click="toggleAuthorList"
            >
              {{ isAuthorListExpanded ? '收起作者列表' : `展开其余 ${groupedArticles.length - visibleGroupedArticles.length} 位作者` }}
            </button>
          </div>

          <div class="author-group-list">
          <section
            v-for="group in visibleGroupedArticles"
            :key="group.key"
            class="author-group"
          >
            <div class="author-group-header">
              <div class="author-profile">
                <img
                  :src="group.authorAvatar || defaultAvatarUrl"
                  :alt="group.authorName"
                  class="author-avatar"
                />
                <div class="author-profile-content">
                  <h3>{{ group.authorName }}</h3>
                  <p>{{ group.articleCount }} 篇文章</p>
                </div>
              </div>

              <div class="author-group-actions">
                <div class="author-group-meta">
                  <em class="scroll-hint">
                    {{ isGroupExpanded(group.key) ? '左右滑动查看文章' : '点击展开查看文章' }}
                  </em>
                </div>
                <button
                  type="button"
                  class="group-toggle-btn"
                  @click="toggleGroup(group.key)"
                >
                  {{ isGroupExpanded(group.key) ? '收起文章' : '展开文章' }}
                </button>
              </div>
            </div>

            <transition name="group-collapse">
              <div v-if="isGroupExpanded(group.key)" class="article-grid author-article-grid">
                <article
                  v-for="article in group.articles"
                  :key="article.id"
                  class="article-card"
                  @click="goToArticle(article.id)"
                >
                  <div class="article-cover-wrapper" :class="{ empty: !article.coverImage }">
                    <img
                      v-if="article.coverImage"
                      :src="article.coverImage"
                      :alt="article.title"
                      class="article-cover"
                    />
                    <div v-else class="article-cover-fallback">
                      <span>ARTICLE</span>
                    </div>
                  </div>

                  <div class="article-body">
                    <div class="article-meta-row">
                      <span>{{ article.categoryName || '未分类' }}</span>
                      <span>{{ formatDate(article.createdAt, 'YYYY-MM-DD') }}</span>
                    </div>

                    <h3>{{ article.title }}</h3>
                    <p>
                      {{ truncateText(article.summary || '暂无摘要，点击进入查看文章全文。', 56) }}
                    </p>

                    <div class="article-card-footer">
                      <div class="article-stats">
                        <span>{{ article.authorName || '匿名作者' }}</span>
                        <span>{{ article.viewCount || 0 }} 阅读</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </transition>
          </section>
          </div>
        </div>

        <div v-else class="article-empty-state">
          <h3>{{ articleLoadFailed ? '文章加载失败' : '暂时还没有公开文章' }}</h3>
          <p>
            {{ articleLoadFailed ? '请稍后刷新页面重试。' : '文章发布后，这里会自动展示全部公开文章。' }}
          </p>
          <el-button v-if="articleLoadFailed" class="retry-button" @click="loadHomeArticles">
            重新加载
          </el-button>
        </div>
      </section>

      <footer id="footer" class="footer-section">
        <div class="footer-content">
          <p>首页展示区已切换为全部公开文章列表。</p>
          <p class="footer-copy">Blog Platform Home</p>
        </div>
      </footer>
    </main>

    <nav class="page-nav">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="nav-dot"
        :class="{ active: activeSection === section.id }"
        :title="section.name"
        @click="scrollToSection(section.id)"
      >
        <span class="nav-label">{{ section.name }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticles } from '@/api/article'
import { getCategories } from '@/api/category'
import { useThemeStore } from '@/stores/theme'
import type { Article, Category } from '@/types'
import { formatDate, truncateText } from '@/utils/tools'
import defaultAvatarUrl from '@/assets/default-avatar.svg'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDarkMode)

const currentTime = ref({
  year: 0,
  month: 0,
  day: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
})

const galleryImages = [
  '/images/background1.png',
  '/images/2.png',
  '/images/3.png',
  '/images/4.png',
]

const sections = [
  { id: 'hero', name: '首页' },
  { id: 'gallery', name: '画廊' },
  { id: 'showcase', name: '文章' },
  { id: 'footer', name: '页脚' },
]

const themes = [
  { id: 'original', name: '原色', color: '#6FA899', filter: 'none' },
  { id: 'warm', name: '暖色', color: '#E8A87C', filter: 'sepia(20%) saturate(120%) hue-rotate(-10deg)' },
  { id: 'cool', name: '冷色', color: '#85DCB8', filter: 'sepia(10%) saturate(80%) hue-rotate(180deg)' },
  { id: 'vintage', name: '复古', color: '#C38D9E', filter: 'sepia(40%) contrast(90%) brightness(95%)' },
  { id: 'dramatic', name: '戏剧', color: '#2D3436', filter: 'contrast(110%) saturate(80%) brightness(90%)' },
]

const currentTheme = ref('original')
const activeSection = ref('hero')
const hoveredItem = ref<number | null>(null)
const articles = ref<Article[]>([])
const categories = ref<Category[]>([])
const articlesLoading = ref(false)
const articleLoadFailed = ref(false)
const expandedGroupKey = ref<string | null>(null)
const isAuthorListExpanded = ref(false)
const selectedCategory = ref<number | 'all'>('all')
const selectedAuthorKey = ref('all')
const selectedSort = ref<'latest' | 'oldest' | 'mostLiked'>('latest')
const keywordFilter = ref('')

const INITIAL_VISIBLE_AUTHORS = 4

type ArticleGroup = {
  key: string
  authorId: number | null
  authorName: string
  authorAvatar?: string
  articleCount: number
  latestCreatedAt: string
  articles: Article[]
}

type AuthorOption = {
  key: string
  name: string
  articleCount: number
  latestCreatedAt: string
}

let timerInterval: number | null = null

function resolveAuthorName(article: Article) {
  return article.authorName || '匿名作者'
}

function resolveAuthorKey(article: Article) {
  const authorId = article.authorId ?? null
  return authorId !== null ? `author-${authorId}` : `author-name-${resolveAuthorName(article)}`
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase()
}

function matchesKeyword(article: Article, keyword: string) {
  if (!keyword) {
    return true
  }

  const fields = [
    article.title,
    article.summary,
    article.authorName,
    article.categoryName,
    ...(Array.isArray(article.tags) ? article.tags.map((tag) => tag.name) : []),
  ]

  return fields.some((value) => (value || '').toLowerCase().includes(keyword))
}

function sortArticles(list: Article[]) {
  const nextList = [...list]

  nextList.sort((left, right) => {
    if (selectedSort.value === 'oldest') {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    }

    if (selectedSort.value === 'mostLiked') {
      const likeDiff = (right.likeCount || 0) - (left.likeCount || 0)
      if (likeDiff !== 0) {
        return likeDiff
      }
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })

  return nextList
}

const authorOptions = computed<AuthorOption[]>(() => {
  const authors = new Map<string, AuthorOption>()

  for (const article of articles.value) {
    const key = resolveAuthorKey(article)
    const existing = authors.get(key)

    if (existing) {
      existing.articleCount += 1
      if (new Date(article.createdAt).getTime() > new Date(existing.latestCreatedAt).getTime()) {
        existing.latestCreatedAt = article.createdAt
      }
      continue
    }

    authors.set(key, {
      key,
      name: resolveAuthorName(article),
      articleCount: 1,
      latestCreatedAt: article.createdAt,
    })
  }

  return Array.from(authors.values()).sort((left, right) => (
    new Date(right.latestCreatedAt).getTime() - new Date(left.latestCreatedAt).getTime()
  ))
})

const filteredArticles = computed<Article[]>(() => {
  const keyword = normalizeKeyword(keywordFilter.value)

  return sortArticles(articles.value.filter((article) => {
    const categoryMatched = selectedCategory.value === 'all'
      || article.categoryId === selectedCategory.value

    const authorMatched = selectedAuthorKey.value === 'all'
      || resolveAuthorKey(article) === selectedAuthorKey.value

    return categoryMatched && authorMatched && matchesKeyword(article, keyword)
  }))
})

const activeFilterCount = computed(() => {
  let count = 0

  if (selectedCategory.value !== 'all') {
    count += 1
  }

  if (selectedAuthorKey.value !== 'all') {
    count += 1
  }

  if (selectedSort.value !== 'latest') {
    count += 1
  }

  if (keywordFilter.value) {
    count += 1
  }

  return count
})

const hasActiveFilters = computed(() => activeFilterCount.value > 0)

const groupedArticles = computed<ArticleGroup[]>(() => {
  const groups = new Map<string, ArticleGroup>()

  for (const article of filteredArticles.value) {
    const authorId = article.authorId ?? null
    const authorName = resolveAuthorName(article)
    const key = resolveAuthorKey(article)

    const existingGroup = groups.get(key)
    if (existingGroup) {
      existingGroup.articles.push(article)
      existingGroup.articleCount += 1

      if (new Date(article.createdAt).getTime() > new Date(existingGroup.latestCreatedAt).getTime()) {
        existingGroup.latestCreatedAt = article.createdAt
      }
      continue
    }

    groups.set(key, {
      key,
      authorId,
      authorName,
      authorAvatar: article.authorAvatar,
      articleCount: 1,
      latestCreatedAt: article.createdAt,
      articles: [article],
    })
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      articles: [...group.articles].sort((left, right) => (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )),
    }))
    .sort((left, right) => (
      new Date(right.latestCreatedAt).getTime() - new Date(left.latestCreatedAt).getTime()
    ))
})

const hasMoreAuthors = computed(() => groupedArticles.value.length > INITIAL_VISIBLE_AUTHORS)

const visibleGroupedArticles = computed(() => {
  if (isAuthorListExpanded.value || !hasMoreAuthors.value) {
    return groupedArticles.value
  }

  return groupedArticles.value.slice(0, INITIAL_VISIBLE_AUTHORS)
})

function isGroupExpanded(groupKey: string) {
  return expandedGroupKey.value === groupKey
}

function toggleGroup(groupKey: string) {
  expandedGroupKey.value = expandedGroupKey.value === groupKey ? null : groupKey
}

function toggleAuthorList() {
  isAuthorListExpanded.value = !isAuthorListExpanded.value
}

watch(visibleGroupedArticles, (groups) => {
  if (groups.length === 0) {
    expandedGroupKey.value = null
    return
  }

  const hasExpandedGroup = groups.some((group) => group.key === expandedGroupKey.value)
  if (!hasExpandedGroup) {
    expandedGroupKey.value = groups[0].key
  }
}, { immediate: true })

function switchTheme(themeId: string) {
  currentTheme.value = themeId
  const theme = themes.find((item) => item.id === themeId)
  if (theme) {
    document.documentElement.style.setProperty('--image-filter', theme.filter)
    document.documentElement.style.setProperty('--theme-primary', theme.color)
  }
}

function updateTimer() {
  const now = new Date()

  currentTime.value = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
  }
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleScroll() {
  const scrollPosition = window.scrollY + window.innerHeight * 0.45

  for (const section of sections) {
    const element = document.getElementById(section.id)
    if (!element) {
      continue
    }

    const { offsetTop, offsetHeight } = element
    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
      activeSection.value = section.id
      break
    }
  }
}

async function loadHomeArticles() {
  articlesLoading.value = true
  articleLoadFailed.value = false

  try {
    const response = await getArticles({ all: true })
    articles.value = response.articles
  } catch (error) {
    articleLoadFailed.value = true
    articles.value = []
  } finally {
    articlesLoading.value = false
  }
}

async function loadCategoriesList() {
  try {
    categories.value = await getCategories()
  } catch (error) {
    categories.value = []
  }
}

function clearKeywordFilter() {
  const nextQuery = { ...route.query }
  delete nextQuery.keyword
  keywordFilter.value = ''
  void router.replace({
    path: '/',
    query: nextQuery,
  })
}

function resetShowcaseFilters() {
  selectedCategory.value = 'all'
  selectedAuthorKey.value = 'all'
  selectedSort.value = 'latest'
  clearKeywordFilter()
}

function goToArticle(id: number) {
  void router.push(`/article/${id}`)
}

onMounted(() => {
  updateTimer()
  switchTheme(currentTheme.value)
  void Promise.allSettled([
    loadHomeArticles(),
    loadCategoriesList(),
  ])

  window.addEventListener('scroll', handleScroll, { passive: true })
  timerInterval = window.setInterval(updateTimer, 1000)
})

watch(() => route.query.keyword, (value) => {
  keywordFilter.value = typeof value === 'string' ? value.trim() : ''
}, { immediate: true })

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  overflow-x: hidden;
  background: linear-gradient(180deg, #f7f2e6 0%, #f3ede1 50%, #efe6d4 100%);
  color: rgba(35, 38, 33, 0.92);
  transition: background 0.4s ease, color 0.3s ease;
}

.home-page.dark {
  background: linear-gradient(180deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
  color: rgba(255, 255, 255, 0.92);
}

.home-shell {
  position: relative;
}

.hero-section {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
}

.hero-image {
  position: absolute;
  inset: -3%;
  background-size: cover;
  background-position: center;
  opacity: 0;
  animation: imageFade 20s infinite ease-in-out;
  filter: var(--image-filter, none);
  transition: filter 0.5s ease;
}

.hero-image-1 {
  background-image: url('/images/background1.png');
  animation-delay: 0s;
}

.hero-image-2 {
  background-image: url('/images/2.png');
  animation-delay: 5s;
}

.hero-image-3 {
  background-image: url('/images/3.png');
  animation-delay: 10s;
}

.hero-image-4 {
  background-image: url('/images/4.png');
  animation-delay: 15s;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.5) 100%);
}

.hero-gradient-top {
  position: absolute;
  inset: 0 0 auto;
  height: 28%;
  background: linear-gradient(180deg, rgba(245, 240, 230, 0.68) 0%, transparent 100%);
}

.hero-gradient-bottom {
  position: absolute;
  inset: auto 0 0;
  height: 42%;
  background: linear-gradient(0deg, rgba(245, 240, 230, 0.88) 0%, transparent 100%);
}

.home-page.dark .hero-gradient-top {
  background: linear-gradient(180deg, rgba(13, 17, 23, 0.85) 0%, transparent 100%);
}

.home-page.dark .hero-gradient-bottom {
  background: linear-gradient(0deg, rgba(13, 17, 23, 0.92) 0%, transparent 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 48px 24px;
  text-align: center;
}

.theme-switcher {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.theme-btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease;
}

.theme-btn:hover,
.theme-btn.active {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--theme-color) 72%, rgba(255, 255, 255, 0.18));
}

.hero-title h1 {
  margin: 0;
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", "FangSong", "STFangsong", serif;
  font-size: clamp(4rem, 10vw, 7rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  color: #fff;
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.35), 0 0 60px rgba(63, 182, 145, 0.2);
}

.hero-subtitle {
  margin: 16px 0 0;
  font-size: clamp(1.05rem, 2.4vw, 1.6rem);
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.9);
}

.hero-uptime {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}

.uptime-item {
  min-width: 90px;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(14px);
}

.uptime-item strong {
  display: block;
  font-family: "Noto Serif SC", "STKaiti", "KaiTi", serif;
  font-size: 2rem;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.uptime-item span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.76);
  letter-spacing: 0.14em;
}

.hero-button {
  padding: 14px 34px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  backdrop-filter: blur(18px);
}

.section-header {
  max-width: 1240px;
  margin: 0 auto 28px;
}

.section-tag {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.22em;
  color: rgba(63, 133, 118, 0.92);
}

.section-header h2 {
  margin: 0;
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", serif;
  font-size: clamp(2.2rem, 4.5vw, 3.2rem);
  color: rgba(35, 38, 33, 0.95);
  letter-spacing: 0.08em;
}

.section-header p:last-child {
  margin: 12px 0 0;
  line-height: 1.8;
  color: rgba(35, 38, 33, 0.72);
}

.home-page.dark .section-header h2 {
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 0 20px rgba(63, 182, 145, 0.3);
}

.home-page.dark .section-header p:last-child {
  color: rgba(255, 255, 255, 0.72);
}

.gallery-section,
.showcase-section {
  padding: 92px 24px;
}

.gallery-section {
  background: linear-gradient(180deg, rgba(245, 240, 230, 0.84) 0%, rgba(232, 240, 232, 0.6) 100%);
}

.home-page.dark .gallery-section {
  background: linear-gradient(180deg, rgba(13, 17, 23, 0.92) 0%, rgba(20, 27, 31, 0.82) 100%);
}

.gallery-grid {
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.gallery-item {
  overflow: hidden;
  border-radius: 26px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.2);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.gallery-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.28);
}

.gallery-item-large {
  grid-row: span 2;
}

.gallery-item-wide {
  grid-column: span 2;
}

.gallery-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.gallery-image-wrapper::before {
  content: '';
  display: block;
  padding-top: 100%;
}

.gallery-item-large .gallery-image-wrapper::before {
  padding-top: 150%;
}

.gallery-item-wide .gallery-image-wrapper::before {
  padding-top: 56.25%;
}

.gallery-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: var(--image-filter, none);
  transition: transform 0.5s ease, filter 0.5s ease;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.08);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 24px;
  opacity: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.68) 100%);
  transition: opacity 0.3s ease;
}

.gallery-overlay.active {
  opacity: 1;
}

.gallery-caption {
  color: #fff;
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", serif;
  font-size: 1.3rem;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 20px rgba(63, 182, 145, 0.3);
}

.showcase-section {
  background: linear-gradient(135deg, rgba(111, 168, 153, 0.08) 0%, rgba(255, 255, 255, 0.55) 100%);
}

.home-page.dark .showcase-section {
  background: linear-gradient(135deg, rgba(19, 31, 37, 0.96) 0%, rgba(13, 17, 23, 0.92) 100%);
}

.showcase-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.showcase-summary {
  flex-shrink: 0;
  min-width: 180px;
  padding: 20px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(111, 168, 153, 0.18);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.home-page.dark .showcase-summary {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.showcase-summary strong {
  display: block;
  font-size: 2.5rem;
  color: rgba(63, 133, 118, 0.96);
}

.showcase-summary span {
  display: block;
  margin-top: 6px;
  color: rgba(35, 38, 33, 0.72);
}

.home-page.dark .showcase-summary span {
  color: rgba(255, 255, 255, 0.72);
}

.showcase-controls {
  max-width: 1240px;
  margin: 0 auto 20px;
  padding: 18px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(111, 168, 153, 0.16);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.home-page.dark .showcase-controls {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 36px rgba(2, 6, 23, 0.18);
}

.showcase-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.showcase-filter-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 108px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(245, 249, 247, 0.9);
  border: 1px solid rgba(111, 168, 153, 0.12);
}

.home-page.dark .showcase-filter-card {
  background: rgba(15, 23, 32, 0.58);
  border-color: rgba(255, 255, 255, 0.06);
}

.filter-label {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(63, 133, 118, 0.92);
}

.showcase-select {
  width: 100%;
}

.keyword-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(111, 168, 153, 0.12);
  color: rgba(35, 38, 33, 0.88);
}

.home-page.dark .keyword-filter-pill {
  background: rgba(111, 168, 153, 0.16);
  color: rgba(255, 255, 255, 0.88);
}

.keyword-filter-pill strong {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.keyword-filter-pill button {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.filter-hint {
  margin: 0;
  line-height: 1.7;
  color: rgba(35, 38, 33, 0.62);
}

.home-page.dark .filter-hint {
  color: rgba(255, 255, 255, 0.64);
}

.showcase-control-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(111, 168, 153, 0.12);
}

.home-page.dark .showcase-control-footer {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.showcase-filter-state {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  font-size: 13px;
  color: rgba(35, 38, 33, 0.7);
}

.home-page.dark .showcase-filter-state {
  color: rgba(255, 255, 255, 0.72);
}

.author-list-toolbar {
  max-width: 1240px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(111, 168, 153, 0.12);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.home-page.dark .author-list-toolbar {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 26px rgba(2, 6, 23, 0.18);
}

.author-list-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-list-summary span {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(63, 133, 118, 0.9);
}

.author-list-summary strong {
  font-size: 14px;
  color: rgba(35, 38, 33, 0.88);
}

.home-page.dark .author-list-summary strong {
  color: rgba(255, 255, 255, 0.88);
}

.author-list-toggle-btn {
  flex-shrink: 0;
  padding: 10px 16px;
  border: 1px solid rgba(111, 168, 153, 0.22);
  border-radius: 999px;
  background: rgba(111, 168, 153, 0.1);
  color: rgba(63, 133, 118, 0.98);
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}

.author-list-toggle-btn:hover {
  transform: translateY(-1px);
  background: rgba(111, 168, 153, 0.16);
  border-color: rgba(111, 168, 153, 0.32);
}

.home-page.dark .author-list-toggle-btn {
  background: rgba(111, 168, 153, 0.14);
  border-color: rgba(111, 168, 153, 0.28);
  color: rgba(190, 241, 227, 0.96);
}

.author-group-list {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.author-group {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(111, 168, 153, 0.12);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07);
}

.home-page.dark .author-group {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.22);
}

.author-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.author-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(111, 168, 153, 0.18);
  background: rgba(255, 255, 255, 0.9);
}

.author-profile-content h3 {
  margin: 0;
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", serif;
  font-size: 1.2rem;
  color: rgba(35, 38, 33, 0.96);
}

.home-page.dark .author-profile-content h3 {
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 0 10px rgba(63, 182, 145, 0.25);
}

.author-profile-content p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(35, 38, 33, 0.62);
}

.home-page.dark .author-profile-content p {
  color: rgba(255, 255, 255, 0.62);
}

.author-group-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-group-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  color: rgba(35, 38, 33, 0.62);
  font-size: 12px;
}

.home-page.dark .author-group-meta {
  color: rgba(255, 255, 255, 0.62);
}

.article-grid {
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.author-article-grid {
  max-width: none;
  margin: 0;
  display: flex;
  gap: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 6px;
  scroll-snap-type: x proximity;
}

.author-article-grid::-webkit-scrollbar {
  height: 8px;
}

.author-article-grid::-webkit-scrollbar-thumb {
  background: rgba(111, 168, 153, 0.35);
  border-radius: 999px;
}

.author-article-grid::-webkit-scrollbar-track {
  background: transparent;
}

.article-card {
  overflow: hidden;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(111, 168, 153, 0.14);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
}

.author-article-grid .article-card {
  flex: 0 0 240px;
  min-width: 240px;
  scroll-snap-align: start;
}

.home-page.dark .article-card {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 48px rgba(2, 6, 23, 0.28);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

.article-cover-wrapper {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, rgba(111, 168, 153, 0.18) 0%, rgba(232, 240, 232, 0.7) 100%);
}

.article-cover-wrapper.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.article-cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  color: rgba(63, 133, 118, 0.82);
}

.article-body {
  padding: 14px;
}

.article-meta-row,
.article-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: rgba(35, 38, 33, 0.62);
}

.home-page.dark .article-meta-row,
.home-page.dark .article-stats {
  color: rgba(255, 255, 255, 0.62);
}

.article-meta-row span,
.article-stats span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-body h3 {
  margin: 10px 0 8px;
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", serif;
  font-size: 1.05rem;
  line-height: 1.45;
  color: rgba(35, 38, 33, 0.96);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.home-page.dark .article-body h3 {
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 0 10px rgba(63, 182, 145, 0.2);
}

.article-body p {
  margin: 0;
  min-height: auto;
  line-height: 1.65;
  font-size: 13px;
  color: rgba(35, 38, 33, 0.74);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.home-page.dark .article-body p {
  color: rgba(255, 255, 255, 0.74);
}

.article-card-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(111, 168, 153, 0.14);
}

.home-page.dark .article-card-footer {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.scroll-hint {
  font-style: normal;
  color: rgba(35, 38, 33, 0.55);
}

.home-page.dark .scroll-hint {
  color: rgba(255, 255, 255, 0.55);
}

.group-toggle-btn {
  flex-shrink: 0;
  min-width: 92px;
  padding: 9px 14px;
  border: 1px solid rgba(111, 168, 153, 0.22);
  border-radius: 999px;
  background: rgba(111, 168, 153, 0.1);
  color: rgba(63, 133, 118, 0.98);
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}

.group-toggle-btn:hover {
  transform: translateY(-1px);
  background: rgba(111, 168, 153, 0.16);
  border-color: rgba(111, 168, 153, 0.32);
}

.home-page.dark .group-toggle-btn {
  background: rgba(111, 168, 153, 0.14);
  border-color: rgba(111, 168, 153, 0.28);
  color: rgba(190, 241, 227, 0.96);
}

.article-empty-state {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 32px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  text-align: center;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.home-page.dark .article-empty-state {
  background: rgba(255, 255, 255, 0.05);
}

.article-empty-state h3 {
  margin: 0;
  font-size: 1.6rem;
}

.article-empty-state p {
  margin: 12px 0 0;
  line-height: 1.8;
}

.retry-button {
  margin-top: 18px;
}

.article-card-skeleton {
  cursor: default;
}

.article-card-skeleton:hover {
  transform: none;
}

.skeleton-box {
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(224, 231, 255, 0.5) 0%, rgba(255, 255, 255, 0.85) 50%, rgba(224, 231, 255, 0.5) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

.home-page.dark .skeleton-box {
  background: linear-gradient(90deg, rgba(51, 65, 85, 0.62) 0%, rgba(71, 85, 105, 0.82) 50%, rgba(51, 65, 85, 0.62) 100%);
  background-size: 200% 100%;
}

.skeleton-cover {
  height: 220px;
  border-radius: 0;
}

.skeleton-meta {
  height: 14px;
  width: 42%;
}

.skeleton-title {
  height: 28px;
  margin-top: 16px;
  width: 76%;
}

.skeleton-line {
  height: 14px;
  margin-top: 14px;
}

.skeleton-line.short {
  width: 68%;
}

.footer-section {
  padding: 36px 24px 54px;
  background: rgba(247, 242, 230, 0.94);
}

.home-page.dark .footer-section {
  background: rgba(18, 28, 27, 0.92);
}

.footer-content {
  max-width: 1240px;
  margin: 0 auto;
  text-align: center;
}

.footer-content p {
  margin: 0;
  line-height: 1.8;
}

.footer-copy {
  margin-top: 8px !important;
  color: rgba(35, 38, 33, 0.62);
}

.home-page.dark .footer-copy {
  color: rgba(255, 255, 255, 0.62);
}

.page-nav {
  position: fixed;
  top: 50%;
  right: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: translateY(-50%);
  z-index: 10;
}

.nav-dot {
  position: relative;
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 999px;
  background: rgba(63, 133, 118, 0.25);
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease;
}

.nav-dot.active,
.nav-dot:hover {
  transform: scale(1.25);
  background: rgba(63, 133, 118, 0.88);
}

.nav-label {
  position: absolute;
  top: 50%;
  right: calc(100% + 14px);
  transform: translateY(-50%);
  opacity: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: rgba(35, 38, 33, 0.9);
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.home-page.dark .nav-label {
  background: rgba(18, 28, 27, 0.86);
  color: rgba(255, 255, 255, 0.9);
}

.nav-dot:hover .nav-label,
.nav-dot.active .nav-label {
  opacity: 1;
}

@keyframes imageFade {
  0%, 15% {
    opacity: 0;
    transform: scale(1);
  }

  20%, 35% {
    opacity: 1;
    transform: scale(1.02);
  }

  40%, 55% {
    opacity: 0;
    transform: scale(1.05);
  }

  100% {
    opacity: 0;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.group-collapse-enter-active,
.group-collapse-leave-active {
  transition: all 0.25s ease;
}

.group-collapse-enter-from,
.group-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 1100px) {
  .gallery-grid,
  .article-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .showcase-header {
    flex-direction: column;
    align-items: stretch;
  }

  .showcase-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .showcase-control-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .author-group-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .author-list-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .author-group-actions {
    width: 100%;
    justify-content: space-between;
  }

  .author-group-meta {
    align-items: flex-start;
  }

  .showcase-summary {
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .hero-content {
    padding: 40px 16px;
  }

  .gallery-section,
  .showcase-section,
  .footer-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .showcase-controls {
    padding: 16px;
  }

  .showcase-filter-grid {
    grid-template-columns: 1fr;
  }

  .gallery-item-large,
  .gallery-item-wide {
    grid-column: span 1;
    grid-row: span 1;
  }

  .gallery-image-wrapper::before {
    padding-top: 72%;
  }

  .page-nav {
    display: none;
  }

  .author-group {
    padding: 20px;
  }

  .author-profile {
    align-items: flex-start;
  }

  .author-list-toolbar {
    padding: 12px 14px;
  }

  .author-list-toggle-btn {
    width: 100%;
  }

  .author-group-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .author-avatar {
    width: 44px;
    height: 44px;
  }

  .article-body {
    padding: 12px;
  }

  .author-article-grid .article-card {
    flex-basis: 210px;
    min-width: 210px;
  }
}
</style>
