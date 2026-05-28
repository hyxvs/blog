import { defineStore } from 'pinia'
import type { User, SignStatus, UserStats, Notification } from '@/types'
import { 
  login, register, loginWithCode, sendVerificationCode, verifyCode,
  getProfile, updateProfile, changePassword,
  signIn, getSignStatus, getNotifications, markNotificationAsRead,
  getUserStats, getFollowingList, getFollowersList,
  getActivities, uploadAvatar, getRecommendedUsers, getRecentArticles,
  followUser, unfollowUser
} from '@/api/user'

interface UserStoreState {
  user: User | null
  token: string | null
  signStatus: SignStatus
  notifications: {
    list: Notification[]
    unreadCount: number
  }
  userStats: UserStats
  social: {
    following: User[]
    followers: User[]
    recommended: User[]
  }
  activities: unknown[]
  recentArticles: unknown[]
}

export const useUserStore = defineStore('user', {
  state: (): UserStoreState => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    signStatus: {
      todaySigned: false,
      consecutiveDays: 0,
      totalSigns: 0
    },
    notifications: {
      list: [],
      unreadCount: 0
    },
    userStats: {
      articleCount: 0,
      viewCount: 0,
      likeCount: 0,
      followerCount: 0,
      followingCount: 0
    },
    social: {
      following: [],
      followers: [],
      recommended: []
    },
    activities: [],
    recentArticles: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    userId: (state) => state.user?.id
  },

  actions: {
    setUser(user: User, token: string) {
      this.user = user
      this.token = token
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
    },

    logout() {
      this.user = null
      this.token = null
      this.notifications = {
        list: [],
        unreadCount: 0,
      }
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },

    async loginAction(credentials: { username?: string; email?: string; password: string }) {
      const response = await login(credentials)
      this.setUser(response.user, response.token)
      return response
    },

    async registerAction(userData: { username: string; email: string; password: string; code?: string }) {
      const response = await register(userData)
      this.setUser(response.user, response.token)
      return response
    },

    async loginWithCodeAction(data: { email: string; code: string }) {
      const response = await loginWithCode(data)
      this.setUser(response.user, response.token)
      return response
    },

    async sendVerificationCodeAction(data: { email: string; type: string }) {
      const response = await sendVerificationCode(data)
      return response
    },

    async verifyCodeAction(data: { email: string; code: string; type: string }) {
      const response = await verifyCode(data)
      return response
    },

    async fetchProfile() {
      const response = await getProfile()
      this.user = response
      localStorage.setItem('user', JSON.stringify(response))
      return response
    },

    async updateProfileAction(data: Partial<User>) {
      const response = await updateProfile(data)
      this.user = response
      localStorage.setItem('user', JSON.stringify(response))
      return response
    },

    async changePasswordAction(data: { oldPassword: string; newPassword: string }) {
      const response = await changePassword(data)
      return response
    },

    async getNotificationsAction() {
      const response = await getNotifications()
      this.notifications = {
        list: response.list,
        unreadCount: response.unreadCount
      }
      return response
    },

    async markNotificationAsReadAction(id: number) {
      await markNotificationAsRead(id)
      const notification = this.notifications.list.find((n: Notification) => n.id === id)
      if (notification) {
        notification.read = true
        this.notifications.unreadCount = Math.max(0, this.notifications.unreadCount - 1)
      }
    },

    async markAllNotificationsAsReadAction() {
      const unreadNotifications = this.notifications.list.filter((item: Notification) => !item.read)

      await Promise.all(unreadNotifications.map((item) => markNotificationAsRead(item.id)))

      this.notifications.list = this.notifications.list.map((item: Notification) => ({
        ...item,
        read: true,
      }))
      this.notifications.unreadCount = 0
    },

    async getUserStatsAction() {
      const response = await getUserStats()
      this.userStats = 'data' in response ? response.data : response
      return response
    },

    async followUserAction(userId: number) {
      const response = await followUser(userId)
      this.social.recommended = this.social.recommended.filter(user => user.id !== userId)
      return response
    },

    async unfollowUserAction(userId: number) {
      const response = await unfollowUser(userId)
      return response
    },

    async getFollowingListAction() {
      const response = await getFollowingList()
      this.social.following = response
      return response
    },

    async getFollowersListAction() {
      const response = await getFollowersList()
      this.social.followers = response
      return response
    },

    async getActivitiesAction() {
      const response = await getActivities()
      this.activities = Array.isArray(response) ? response : response.data
      return response
    },

    async uploadAvatarAction(formData: FormData) {
      const response = await uploadAvatar(formData)
      if (this.user) {
        this.user.avatar = response.avatar
        localStorage.setItem('user', JSON.stringify(this.user))
      }
      return response
    },

    async getRecommendedUsersAction() {
      const response = await getRecommendedUsers()
      this.social.recommended = Array.isArray(response) ? response : response.data
      return this.social.recommended
    },

    async getRecentArticlesAction() {
      const response = await getRecentArticles()
      this.recentArticles = Array.isArray(response) ? response : response.data
      return this.recentArticles
    },

    async signInAction() {
      const response = await signIn()
      await this.getSignStatusAction()
      return response
    },

    async getSignStatusAction() {
      const response = await getSignStatus()
      if (response.success) {
        this.signStatus = response.data
      }
      return response
    }
  }
})
