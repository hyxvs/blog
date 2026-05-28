<template>
  <div class="login-container guofeng-auth-page" :class="{ dark: isDark }">
    <div class="auth-shell">
      <section class="auth-hero">
        <div class="hero-image-wrapper">
          <img src="/images/3.png" alt="装饰图" class="hero-image" />
          <div class="hero-overlay">
            <h2>遇见更好的自己</h2>
            <p>在这里，记录生活的点滴，管理个人的成长，<br>构建属于你的知识空间，开启一段自我探索的旅程。</p>
            <div class="hero-features">
              <div class="feature-item">
                <span class="feature-icon">📝</span>
                <div>
                  <strong>记录生活</strong>
                  <span>珍藏每一个瞬间</span>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📚</span>
                <div>
                  <strong>知识管理</strong>
                  <span>构建你的知识体系</span>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎯</span>
                <div>
                  <strong>个人成长</strong>
                  <span>遇见更好的自己</span>
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
          <span class="panel-kicker">欢迎回来</span>
          <h2>登录账号</h2>
          <p>欢迎回来，继续您的探索之旅</p>
        </div>

        <!-- 登录方式切换 -->
        <div class="login-tabs">
          <button 
            :class="['tab-btn', { active: loginType === 'password' }]"
            @click="loginType = 'password'"
          >
            密码登录
          </button>
          <button 
            :class="['tab-btn', { active: loginType === 'code' }]"
            @click="loginType = 'code'"
          >
            验证码登录
          </button>
        </div>

        <!-- 密码登录表单 -->
        <el-form v-if="loginType === 'password'" ref="formRef" :model="passwordForm" :rules="passwordRules" @submit.prevent="handlePasswordLogin">
          <el-form-item prop="username">
            <el-input
              v-model="passwordForm.username"
              placeholder="请输入账号或邮箱"
              prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="passwordForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              :show-password="showPassword"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
              {{ loading ? '正在登录...' : '进入书案' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 验证码登录表单 -->
        <el-form v-else ref="codeFormRef" :model="codeForm" :rules="codeRules" @submit.prevent="handleCodeLogin">
          <el-form-item prop="email">
            <el-input
              v-model="codeForm.email"
              placeholder="请输入邮箱"
              prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item prop="code">
            <div class="code-input-wrapper">
              <el-input
                v-model="codeForm.code"
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

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
              {{ loading ? '正在登录...' : '进入书案' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="auth-links">
          <router-link to="/">返回首页</router-link>
          <router-link to="/register">还没有账号？立即注册</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { validateEmail } from '@/utils/tools'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const router = useRouter()
const userStore = useUserStore()

const loginType = ref<'password' | 'code'>('password')
const formRef = ref<FormInstance>()
const codeFormRef = ref<FormInstance>()
const loading = ref(false)
const sendingCode = ref(false)
const showPassword = ref(false)
const codeTimer = ref(0)

const passwordForm = reactive({
  username: '',
  password: ''
})

const codeForm = reactive({
  email: '',
  code: ''
})

const passwordRules = {
  username: [{ required: true, message: '请输入账号或邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ]
}

const codeRules = {
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
  ]
}

const canSendCode = computed(() => {
  return validateEmail(codeForm.email) && codeTimer.value === 0
})

const codeButtonText = computed(() => {
  if (codeTimer.value > 0) {
    return `${codeTimer.value}s 后重新发送`
  }
  return '发送验证码'
})

const sendCode = async () => {
  if (!validateEmail(codeForm.email)) {
    ElMessage.error('请输入正确的邮箱格式')
    return
  }

  try {
    sendingCode.value = true
    await userStore.sendVerificationCodeAction({
      email: codeForm.email,
      type: 'login'
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

const handlePasswordLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.loginAction({
      username: passwordForm.username,
      password: passwordForm.password
    })
    ElMessage.success('登录成功')
    setTimeout(() => {
      router.push('/')
    }, 800)
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error?.response?.data?.error || '登录失败')
    }
  } finally {
    loading.value = false
  }
}

const handleCodeLogin = async () => {
  if (!codeFormRef.value) return

  try {
    await codeFormRef.value.validate()
    loading.value = true
    await userStore.loginWithCodeAction({
      email: codeForm.email,
      code: codeForm.code
    })
    ElMessage.success('登录成功')
    setTimeout(() => {
      router.push('/')
    }, 800)
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error?.response?.data?.error || '登录失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(247, 245, 240, 0.9) 50%, rgba(230, 240, 235, 0.85) 100%),
    url('/images/background1.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.login-container.dark {
  background: 
    linear-gradient(135deg, rgba(15, 20, 18, 0.92) 0%, rgba(20, 28, 25, 0.88) 50%, rgba(18, 26, 23, 0.9) 100%),
    url('/images/background1.png');
}

.auth-shell {
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(360px, 420px);
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
  border: 1px solid rgba(255, 247, 233, 0.2);
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

/* 深色主题下的英雄区域文字颜色 */
.login-container.dark .hero-overlay h2 {
  color: #f5f5f5;
}

.login-container.dark .hero-overlay p {
  color: rgba(255, 255, 255, 0.9);
}

.login-container.dark .feature-item strong {
  color: #f5f5f5;
}

.login-container.dark .feature-item span {
  color: rgba(255, 255, 255, 0.8);
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
  margin-bottom: 24px;
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

/* 登录方式切换 */
.login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 4px;
  background: var(--paper-soft);
  border-radius: var(--radius-lg);
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-dark);
}

.tab-btn.active {
  background: var(--paper-strong);
  color: var(--jade-700);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
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