<template>
  <div class="register-container guofeng-auth-page" :class="{ dark: isDark }">
    <div class="auth-shell">
      <section class="auth-hero">
        <div class="hero-image-wrapper">
          <img src="/images/4.png" alt="装饰图" class="hero-image" />
          <div class="hero-overlay">
            <h2>开启逍遥之旅</h2>
            <p>创建您的专属空间，书写生活的篇章，<br>记录每一次成长，遇见未来更好的自己。</p>
            <div class="hero-features">
              <div class="feature-item">
                <span class="feature-icon">🌱</span>
                <div>
                  <strong>开始创作</strong>
                  <span>书写你的故事</span>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🏛️</span>
                <div>
                  <strong>建立档案</strong>
                  <span>打造个人品牌</span>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✨</span>
                <div>
                  <strong>探索未知</strong>
                  <span>开启新的旅程</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="auth-panel">
        <div class="panel-intro">
          <div class="panel-logo">
            <img src="/images/logo.png" alt="Logo" />
          </div>
          <span class="panel-kicker">创建新账户</span>
          <h2>注册账号</h2>
          <p>填写以下信息，开启您的逍遥之旅</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱"
              prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item prop="code">
            <div class="code-input-wrapper">
              <el-input
                v-model="form.code"
                placeholder="请输入验证码"
                prefix-icon="Key"
              />
              <el-button 
                type="text" 
                class="send-code-btn"
                :disabled="!canSendCode || loading"
                :loading="sendingCode"
                @click="sendCode"
              >
                {{ codeButtonText }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              :show-password="showPassword"
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              :show-password="showPassword"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
              {{ loading ? '正在注册...' : '建立名册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="auth-links">
          <router-link to="/">返回首页</router-link>
          <router-link to="/login">已有账号？去登录</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { validateEmail } from '@/utils/tools'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const formRef = ref<FormInstance>()
const loading = ref(false)
const sendingCode = ref(false)
const showPassword = ref(false)
const codeTimer = ref(0)

const form = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// 监听邮箱变化，清空验证码
watch(() => form.email, () => {
  form.code = ''
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度需在 3 到 20 个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (!validateEmail(value)) {
          callback(new Error('请输入正确的邮箱格式'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为 6 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const canSendCode = computed(() => {
  return validateEmail(form.email) && codeTimer.value === 0
})

const codeButtonText = computed(() => {
  if (codeTimer.value > 0) {
    return `${codeTimer.value}s 后重新发送`
  }
  return '发送验证码'
})

const sendCode = async () => {
  if (!validateEmail(form.email)) {
    ElMessage.error('请输入正确的邮箱格式')
    return
  }

  try {
    sendingCode.value = true
    await userStore.sendVerificationCodeAction({
      email: form.email,
      type: 'register'
    })
    ElMessage.success('验证码已发送，请注意查收')
    
    // 开始倒计时
    codeTimer.value = 60
    const timer = setInterval(() => {
      codeTimer.value--
      if (codeTimer.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}

const handleRegister = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true
    
    // 先验证验证码
    await userStore.verifyCodeAction({
      email: form.email,
      code: form.code,
      type: 'register'
    })
    
    // 验证码验证通过后再注册
    await userStore.registerAction({
      username: form.username,
      email: form.email,
      password: form.password,
      code: form.code
    })
    
    ElMessage.success('注册成功')
    setTimeout(() => {
      router.push('/')
    }, 800)
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error?.response?.data?.error || '注册失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(245, 248, 242, 0.92) 50%, rgba(238, 245, 240, 0.85) 100%),
    url('/images/2.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.register-container.dark {
  background: 
    linear-gradient(135deg, rgba(15, 20, 18, 0.92) 0%, rgba(20, 28, 25, 0.88) 50%, rgba(18, 26, 23, 0.9) 100%),
    url('/images/2.png');
}

.auth-shell {
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 430px);
  gap: 24px;
  align-items: stretch;
}

.auth-hero,
.auth-panel {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 1px solid var(--line-medium);
  box-shadow: var(--shadow-strong);
  backdrop-filter: blur(18px);
}

.auth-hero {
  padding: 0;
  background: transparent;
  color: rgba(255, 249, 239, 0.92);
  overflow: hidden;
  border-radius: var(--radius-xl);
}

.auth-badge,
.panel-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 247, 233, 0.24);
  background: rgba(255, 249, 239, 0.1);
  letter-spacing: 0.12em;
  font-size: 12px;
}

.hero-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.hero-image {
  width: 100%;
  height: 100%;
  min-height: 500px;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px;
  background: linear-gradient(transparent, rgba(15, 40, 35, 0.95));
}

.hero-overlay h2 {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}

.hero-overlay p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 24px;
}

.hero-features {
  display: flex;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.feature-icon {
  font-size: 20px;
}

.feature-item strong {
  display: block;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.feature-item span {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 4px;
}

.auth-panel {
  padding: 42px 36px;
  background: var(--paper-strong);
}

.panel-logo {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
}

.panel-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.panel-intro {
  margin-bottom: 28px;
}

.panel-intro h2 {
  margin-top: 18px;
  font-family: var(--font-display);
  font-size: 36px;
  color: var(--text-dark);
}

.panel-intro p {
  margin-top: 10px;
  color: var(--text-muted);
}

.auth-panel :deep(.el-form-item) {
  margin-bottom: 22px;
}

.auth-panel :deep(.el-input__wrapper) {
  min-height: 48px;
}

/* 验证码输入框容器 */
.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input-wrapper :deep(.el-input) {
  flex: 1;
}

.send-code-btn {
  padding: 0 20px;
  color: #257162;
  font-weight: 600;
}

.send-code-btn:disabled {
  color: var(--text-disabled);
}

.auth-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.auth-links a {
  color: var(--jade-700);
  font-size: 14px;
  padding: 8px 0;
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.auth-links a:hover {
  border-color: rgba(37, 113, 98, 0.28);
  color: var(--jade-800);
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-hero {
    padding: 32px 28px;
  }
}

@media (max-width: 768px) {
  .auth-panel {
    padding: 32px 22px;
  }

  .auth-hero h1 {
    font-size: 32px;
  }

  .auth-links {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>