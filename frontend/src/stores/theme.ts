import { defineStore } from 'pinia'

type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    themeMode: (localStorage.getItem('themeMode') as ThemeMode) || 'light',
    followSystem: localStorage.getItem('followSystem') === 'true' || false
  }),

  getters: {
    isDarkMode: (state) => {
      if (state.followSystem) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      return state.themeMode === 'dark'
    },

    themeIcon: (state) => {
      if (state.followSystem) return 'System'
      return state.themeMode === 'dark' ? 'Moon' : 'Sunny'
    },

    themeName: (state) => {
      if (state.followSystem) return '跟随系统'
      return state.themeMode === 'dark' ? '深色模式' : '浅色模式'
    }
  },

  actions: {
    initTheme() {
      this.applyTheme()
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (this.followSystem) {
            this.applyTheme()
          }
        })
      }
    },

    applyTheme() {
      const isDark = this.isDarkMode
      const html = document.documentElement
      
      if (isDark) {
        html.classList.add('dark')
        html.setAttribute('data-theme', 'dark')
      } else {
        html.classList.remove('dark')
        html.setAttribute('data-theme', 'light')
      }
    },

    toggleTheme() {
      if (this.followSystem) {
        this.followSystem = false
        this.themeMode = 'light'
      } else {
        this.themeMode = this.themeMode === 'light' ? 'dark' : 'light'
      }
      
      localStorage.setItem('themeMode', this.themeMode)
      localStorage.setItem('followSystem', String(this.followSystem))
      this.applyTheme()
    },

    setTheme(mode: ThemeMode) {
      this.themeMode = mode
      this.followSystem = false
      localStorage.setItem('themeMode', mode)
      localStorage.setItem('followSystem', 'false')
      this.applyTheme()
    },

    toggleFollowSystem() {
      this.followSystem = !this.followSystem
      localStorage.setItem('followSystem', String(this.followSystem))
      this.applyTheme()
    }
  }
})
