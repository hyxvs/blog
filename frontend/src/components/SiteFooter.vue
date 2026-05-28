<template>
  <footer class="site-footer" :class="{ dark: isDark }">
    <div class="footer-shell">
      <div class="footer-top">
        <section class="footer-brand">
          <p class="footer-kicker">Personal Blog Footer</p>
          <h2>自顾逍遥</h2>
          <p class="footer-description">
            记录技术、生活与创作灵感，把零散表达整理成一座长期更新的个人内容站点。
          </p>

          <div class="runtime-chip">
            <el-icon><Clock /></el-icon>
            <span>本站已运行 {{ runtimeText }}</span>
          </div>

          <div class="footer-tech">
            <span>Vue 3</span>
            <span>Vite</span>
            <span>个人创作</span>
          </div>
        </section>

        <div class="footer-links-grid">
          <section class="footer-column">
            <h3>快速链接</h3>
            <router-link
              v-for="item in quickLinks"
              :key="item.path"
              :to="item.path"
              class="footer-link"
            >
              <el-icon><ArrowRight /></el-icon>
              <span>{{ item.label }}</span>
            </router-link>
          </section>

          <section class="footer-column">
            <h3>社交与订阅</h3>
            <a
              v-for="item in socialLinks"
              :key="item.href"
              :href="item.href"
              :target="item.external ? '_blank' : undefined"
              :rel="item.external ? 'noopener noreferrer' : undefined"
              class="footer-link"
            >
              <el-icon><ArrowRight /></el-icon>
              <span>{{ item.label }}</span>
            </a>
          </section>

          <section class="footer-column">
            <h3>联系与说明</h3>
            <div class="footer-note">
              <strong>联系邮箱</strong>
              <a href="mailto:2933365269@qq.com">2933365269@qq.com</a>
            </div>
            <div class="footer-note">
              <strong>版权声明</strong>
              <span>© {{ currentYear }} 轩行，保留所有权利。</span>
            </div>
            <div class="footer-note">
              <strong>转载说明</strong>
              <span>欢迎交流引用，转载请注明文章来源。</span>
            </div>
          </section>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="footer-copy">
          © {{ currentYear }} 自顾逍遥 · 轩行的个人博客
        </p>

        <div class="footer-bottom-actions">
          <a href="mailto:2933365269@qq.com?subject=友链合作">友链 / 合作</a>
          <a href="https://github.com/hyxvs" target="_blank" rel="noopener noreferrer">GitHub</a>
          <button type="button" class="back-top-inline" @click="scrollToTop">
            <el-icon><Top /></el-icon>
            <span>返回顶部</span>
          </button>
        </div>
      </div>
    </div>

    <button
      v-show="showFloatingTop"
      type="button"
      class="floating-top-button"
      @click="scrollToTop"
    >
      <el-icon><Top /></el-icon>
    </button>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowRight, Clock, Top } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const userStore = useUserStore()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDarkMode)
const currentYear = new Date().getFullYear()
const siteStartDate = new Date('2026-03-06T00:00:00')
const showFloatingTop = ref(false)
const runtimeText = ref('')

let runtimeInterval: ReturnType<typeof setInterval> | null = null

function updateRuntime() {
  const now = new Date()
  const diff = Math.max(0, now.getTime() - siteStartDate.getTime())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  runtimeText.value = `${days} 天 ${hours} 小时 ${minutes} 分 ${seconds} 秒`
}

const quickLinks = computed(() => {
  if (userStore.isLoggedIn) {
    return [
      { label: '首页', path: '/' },
      { label: '关于', path: '/about' },
      { label: '我的文章', path: '/my-articles' },
      { label: '个人中心', path: '/profile' },
    ]
  }

  return [
    { label: '首页', path: '/' },
    { label: '关于', path: '/about' },
    { label: '登录', path: '/login' },
    { label: '注册', path: '/register' },
  ]
})

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/hyxvs',
    external: true,
  },
  {
    label: '邮件订阅更新',
    href: 'mailto:2933365269@qq.com?subject=订阅博客更新',
    external: false,
  },
  {
    label: '写信反馈',
    href: 'mailto:2933365269@qq.com?subject=博客反馈',
    external: false,
  },
]



function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

function handleScroll() {
  showFloatingTop.value = window.scrollY > 360
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
  updateRuntime()
  runtimeInterval = setInterval(updateRuntime, 1000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (runtimeInterval) {
    clearInterval(runtimeInterval)
    runtimeInterval = null
  }
})
</script>

<style scoped>
.site-footer {
  position: relative;
  margin-top: 28px;
  padding: 0 24px 28px;
  background: 
    linear-gradient(180deg, transparent 0%, rgba(247, 242, 230, 0.7) 30%, rgba(242, 248, 244, 0.8) 100%),
    url('/images/background2.png');
  background-size: cover;
  background-position: bottom center;
}

.footer-shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px 30px 22px;
  border-radius: 34px;
  background:
    linear-gradient(180deg, rgba(255, 251, 244, 0.95), rgba(247, 240, 228, 0.88));
  border: 1px solid rgba(98, 113, 103, 0.12);
  box-shadow: var(--shadow-soft);
  transition: background 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.site-footer.dark .footer-shell {
  background:
    linear-gradient(180deg, rgba(28, 35, 31, 0.95), rgba(22, 28, 24, 0.92));
  border-color: rgba(214, 201, 171, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
}

.footer-top {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
  gap: 30px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(98, 113, 103, 0.12);
}

.footer-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-light);
}

.footer-brand h2 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.8rem);
}

.footer-description {
  margin: 14px 0 0;
  max-width: 440px;
  color: var(--text-main);
}

.runtime-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 10px 14px;
  border-radius: 999px;
  color: var(--jade-800);
  background: rgba(63, 133, 118, 0.1);
  border: 1px solid rgba(63, 133, 118, 0.12);
}

.footer-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.footer-tech span {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(98, 113, 103, 0.1);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.site-footer.dark .footer-tech span {
  background: rgba(35, 43, 38, 0.7);
  border-color: rgba(214, 201, 171, 0.1);
}

.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.footer-column h3 {
  margin: 0 0 14px;
  font-size: 1.1rem;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.footer-link:hover {
  color: var(--jade-700);
  transform: translateX(2px);
}

.footer-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-main);
}

.footer-note strong {
  color: var(--text-dark);
}

.footer-note a {
  word-break: break-all;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-top: 18px;
}

.footer-copy {
  margin: 0;
  color: var(--text-muted);
}

.footer-bottom-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.footer-bottom-actions a,
.back-top-inline {
  color: var(--text-main);
}

.back-top-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.floating-top-button {
  position: fixed;
  right: 26px;
  bottom: 28px;
  z-index: 30;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, var(--jade-700), var(--jade-500));
  box-shadow: 0 16px 32px rgba(37, 113, 98, 0.28);
}

.site-footer.dark .footer-kicker,
.site-footer.dark .footer-brand h2,
.site-footer.dark .footer-description,
.site-footer.dark .runtime-chip,
.site-footer.dark .footer-column h3,
.site-footer.dark .footer-link,
.site-footer.dark .footer-note,
.site-footer.dark .footer-note strong,
.site-footer.dark .footer-copy,
.site-footer.dark .footer-bottom-actions a,
.site-footer.dark .back-top-inline {
  color: rgba(255, 255, 255, 0.9);
  transition: color 0.3s ease;
}

.site-footer.dark .footer-kicker {
  color: rgba(255, 255, 255, 0.6);
}

.site-footer.dark .footer-description,
.site-footer.dark .footer-link,
.site-footer.dark .footer-note,
.site-footer.dark .footer-bottom-actions a,
.site-footer.dark .back-top-inline {
  color: rgba(255, 255, 255, 0.75);
}

.site-footer.dark .footer-copy {
  color: rgba(255, 255, 255, 0.6);
}

.site-footer.dark .footer-link:hover,
.site-footer.dark .footer-bottom-actions a:hover,
.site-footer.dark .back-top-inline:hover {
  color: var(--jade-400);
}

@media (max-width: 1100px) {
  .footer-top {
    grid-template-columns: 1fr;
  }

  .footer-links-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .site-footer {
    padding: 0 14px 22px;
  }

  .footer-shell {
    padding: 22px 18px 18px;
    border-radius: 26px;
  }

  .footer-links-grid {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }

  .floating-top-button {
    right: 18px;
    bottom: 18px;
  }
}
</style>
