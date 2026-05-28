import request from '@/utils/request'
import type { User, LoginResponse, SignStatus, UserStats, Notification } from '@/types'

export const register = (data: { username: string; email: string; password: string; code?: string }): Promise<LoginResponse> => {
  return request.post('/users/register', data)
}

export const login = (data: { username?: string; email?: string; password: string }): Promise<LoginResponse> => {
  return request.post('/users/login', data)
}

export const loginWithCode = (data: { email: string; code: string }): Promise<LoginResponse> => {
  return request.post('/users/login/code', data)
}

export const sendVerificationCode = (data: { email: string; type: string }): Promise<{ success: boolean; message: string }> => {
  return request.post('/verification/send', data)
}

export const verifyCode = (data: { email: string; code: string; type: string }): Promise<{ success: boolean; message: string }> => {
  return request.post('/verification/verify', data)
}

export const getProfile = (): Promise<User> => {
  return request.get('/users/profile')
}

export const updateProfile = (data: Partial<User>): Promise<User> => {
  return request.put('/users/profile', data)
}

export const changePassword = (data: { oldPassword: string; newPassword: string }): Promise<void> => {
  return request.put('/users/password', data)
}

export const getAllUsers = (): Promise<User[]> => {
  return request.get('/users')
}

export const deleteUser = (id: number): Promise<void> => {
  return request.delete(`/users/${id}`)
}

export const updateUserRole = (id: number, role: 'admin' | 'user'): Promise<void> => {
  return request.put(`/users/${id}/role`, { role })
}

export const signIn = (): Promise<void> => {
  return request.post('/users/sign')
}

export const getSignStatus = (): Promise<{ success: boolean; data: SignStatus }> => {
  return request.get('/users/sign/status')
}

export const getNotifications = (): Promise<{ list: Notification[]; unreadCount: number }> => {
  return request.get('/users/notifications')
}

export const markNotificationAsRead = (id: number): Promise<void> => {
  return request.post(`/users/notifications/${id}/read`)
}

export const getUserStats = (): Promise<UserStats | { data: UserStats }> => {
  return request.get('/users/stats')
}

export const followUser = (userId: number): Promise<void> => {
  return request.post(`/users/follow/${userId}`)
}

export const unfollowUser = (userId: number): Promise<void> => {
  return request.delete(`/users/follow/${userId}`)
}

export const getFollowingList = (): Promise<User[]> => {
  return request.get('/users/following')
}

export const getFollowersList = (): Promise<User[]> => {
  return request.get('/users/followers')
}

export const getActivities = (): Promise<unknown[] | { data: unknown[] }> => {
  return request.get('/users/activities')
}

export const uploadAvatar = (formData: FormData): Promise<{ avatar: string }> => {
  return request.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const getRecommendedUsers = (): Promise<User[] | { data: User[] }> => {
  return request.get('/users/recommendations')
}

export const getRecentArticles = (): Promise<unknown[] | { data: unknown[] }> => {
  return request.get('/users/articles')
}
