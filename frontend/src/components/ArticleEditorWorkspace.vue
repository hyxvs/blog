<template>
  <div
    class="article-editor-workspace"
    :class="{
      'is-focus-mode': focusMode,
      'is-minimal-mode': minimalMode,
      'dark': isDark,
    }"
  >
    <div class="workspace-shell">
      <header class="workspace-header">
        <div class="header-left">
          <div class="header-logo">
            <img src="/images/logo.png" alt="Logo" />
          </div>
          <div class="header-content">
            <p class="workspace-eyebrow">Article Studio</p>
            <h1>{{ pageTitle }}</h1>
            <p class="workspace-subtitle">
              支持 Markdown、代码高亮、KaTeX、Mermaid、导入导出、草稿、定时发布与多种写作视图。
            </p>
          </div>
        </div>
        <div class="header-actions">
          <el-tag size="large" effect="plain" type="info">
            {{ currentModeLabel }}
          </el-tag>
          <el-tag
            v-if="form.status === 'draft'"
            size="large"
            effect="plain"
            type="warning"
          >
            草稿
          </el-tag>
          <el-tag
            v-else-if="form.status === 'scheduled'"
            size="large"
            effect="plain"
            type="success"
          >
            定时发布
          </el-tag>
          <el-tag
            v-else
            size="large"
            effect="plain"
            type="success"
          >
            已发布
          </el-tag>
        </div>
      </header>

      <el-alert
        v-if="recoverableDraft"
        class="draft-alert"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #title>
          检测到本地未同步缓存，更新时间 {{ recoverableDraft.updatedAtDisplay }}
        </template>
        <div class="draft-alert-actions">
          <el-button size="small" type="warning" plain @click="restoreLocalDraft">
            恢复缓存
          </el-button>
          <el-button size="small" text @click="discardLocalDraft">
            丢弃缓存
          </el-button>
        </div>
      </el-alert>

      <section class="workspace-body">
        <div class="workspace-main">
          <el-card class="panel hero-panel" shadow="never">
            <div class="title-row">
              <el-input
                v-model="form.title"
                class="title-input"
                maxlength="200"
                placeholder="输入文章标题"
              >
                <template #append>
                  <el-button :loading="suggestingTitles" @click="generateTitleSuggestions">
                    AI 标题
                  </el-button>
                </template>
              </el-input>
            </div>
            <div v-if="titleSuggestions.length > 0" class="title-suggestions">
              <el-tag
                v-for="suggestion in titleSuggestions"
                :key="suggestion"
                effect="plain"
                class="clickable-tag"
                @click="applyTitleSuggestion(suggestion)"
              >
                {{ suggestion }}
              </el-tag>
            </div>
            <div class="hero-meta">
              <span>字数 {{ contentStats.words }}</span>
              <span>字符 {{ contentStats.characters }}</span>
              <span>预计阅读 {{ contentStats.readingMinutes }} 分钟</span>
              <span v-if="lastLocalSavedAt">本地缓存 {{ lastLocalSavedAt }}</span>
              <span v-if="lastPersistedAt">最近同步 {{ lastPersistedAt }}</span>
              <span v-if="hasPendingChanges" class="dirty-state">未同步修改</span>
            </div>
          </el-card>

          <el-card class="panel editor-panel" shadow="never">
            <div class="toolbar-strip">
              <div class="toolbar-group">
                <span class="toolbar-label">编辑模式</span>
                <el-select v-model="editorMode" size="small" class="compact-select">
                  <el-option label="所见即所得" value="wysiwyg" />
                  <el-option label="即时渲染" value="ir" />
                  <el-option label="分屏预览" value="sv" />
                </el-select>
              </div>
              <div class="toolbar-group">
                <span class="toolbar-label">预览布局</span>
                <el-radio-group v-model="previewMode" size="small">
                  <el-radio-button
                    v-for="option in previewModeOptions"
                    :key="option.value"
                    :label="option.value"
                  >
                    {{ option.label }}
                  </el-radio-button>
                </el-radio-group>
              </div>
              <div class="toolbar-group action-group">
                <el-button size="small" plain @click="insertCodeBlockTemplate">
                  代码块
                </el-button>
                <el-button size="small" plain @click="insertMathTemplate">
                  公式
                </el-button>
                <el-button size="small" plain @click="insertMermaidTemplate">
                  Mermaid
                </el-button>
              </div>
              <div class="toolbar-group action-group">
                <el-button size="small" plain @click="focusMode = !focusMode">
                  {{ focusMode ? '退出专注' : '专注模式' }}
                </el-button>
                <el-button size="small" plain @click="minimalMode = !minimalMode">
                  {{ minimalMode ? '退出简洁' : '简洁模式' }}
                </el-button>
                <el-button size="small" plain @click="replaceDialogVisible = true">
                  查找替换
                </el-button>
                <el-button size="small" plain @click="shortcutDialogVisible = true">
                  快捷键
                </el-button>
              </div>
            </div>

            <div class="quick-actions">
              <el-button size="small" @click="triggerImport">
                导入 Markdown/HTML
              </el-button>
              <el-button size="small" @click="exportMarkdown">
                导出 Markdown
              </el-button>
              <el-button size="small" @click="exportHtml">
                导出 HTML
              </el-button>
              <el-button size="small" @click="restoreEditorCache">
                恢复缓存
              </el-button>
              <el-button size="small" text @click="clearEditorCache">
                清空本地缓存
              </el-button>
            </div>

            <div class="editor-surface">
              <div v-if="editorBooting" class="editor-loading">
                <el-skeleton animated :rows="10" />
              </div>
              <div v-else-if="bootstrapError" class="editor-error">
                <el-result
                  icon="warning"
                  title="编辑器加载失败"
                  :sub-title="bootstrapError"
                >
                  <template #extra>
                    <el-button type="primary" @click="retryBootstrap">
                      重新加载
                    </el-button>
                  </template>
                </el-result>
              </div>
              <div
                ref="editorHost"
                v-show="!bootstrapError"
                class="editor-host"
              ></div>
            </div>
          </el-card>
        </div>

        <aside v-if="!focusMode" class="workspace-side">
          <el-card class="panel meta-panel" shadow="never">
            <template #header>
              <div class="side-header">
                <span>发布设置</span>
                <el-button
                  size="small"
                  text
                  @click="generateTagSuggestions"
                  :loading="suggestingTags"
                >
                  AI 标签
                </el-button>
              </div>
            </template>

            <div class="field-stack">
              <label class="field-label">分类</label>
              <el-select
                v-model="form.categoryId"
                clearable
                filterable
                placeholder="选择分类"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>

              <label class="field-label">标签</label>
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入或选择标签"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.name"
                />
              </el-select>
              <div v-if="recommendedTags.length > 0" class="tag-cloud">
                <el-tag
                  v-for="tag in recommendedTags"
                  :key="tag"
                  effect="plain"
                  class="clickable-tag"
                  @click="addTag(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>

              <label class="field-label">摘要</label>
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="4"
                maxlength="500"
                show-word-limit
                placeholder="输入文章摘要"
              />

              <label class="field-label">封面</label>
              <el-input v-model="form.coverImage" placeholder="支持上传封面，或直接粘贴封面 URL" />
              <div class="cover-actions">
                <el-button
                  size="small"
                  plain
                  :loading="coverUploading"
                  @click="triggerCoverUpload"
                >
                  上传封面
                </el-button>
                <el-button
                  size="small"
                  plain
                  :loading="suggestingCover"
                  @click="generateCoverRecommendations"
                >
                  AI 封面
                </el-button>
                <el-button
                  v-if="form.coverImage"
                  size="small"
                  plain
                  @click="clearCoverImage"
                >
                  移除封面
                </el-button>
              </div>
              <p class="cover-hint">支持 JPG、PNG、GIF、WEBP，大小不超过 8MB。</p>
              <div v-if="form.coverImage" class="cover-preview">
                <img :src="form.coverImage" alt="cover preview" />
                <div class="cover-preview-footer">
                  <span class="cover-preview-label">当前封面预览</span>
                  <span class="cover-preview-url">{{ form.coverImage }}</span>
                </div>
              </div>
              <div v-else class="cover-empty">
                上传一张封面图后，文章列表和详情页会优先展示它。
              </div>

              <label class="field-label">发布状态</label>
              <el-radio-group v-model="form.status" class="status-group">
                <el-radio-button value="draft">草稿</el-radio-button>
                <el-radio-button value="published">发布</el-radio-button>
                <el-radio-button value="scheduled">定时</el-radio-button>
              </el-radio-group>

              <div v-if="form.status === 'scheduled'">
                <label class="field-label">发布时间</label>
                <el-date-picker
                  v-model="form.scheduledPublishAt"
                  type="datetime"
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择发布时间"
                  class="full-width"
                />
              </div>
            </div>

            <div class="publish-actions">
              <el-button
                type="primary"
                size="large"
                :loading="submitting"
                @click="submitCurrentStatus"
              >
                {{ submitActionLabel }}
              </el-button>
              <el-button
                size="large"
                :loading="savingDraft"
                @click="saveDraft"
              >
                保存草稿
              </el-button>
              <el-button
                v-if="form.status !== 'published'"
                size="large"
                plain
                @click="publishNow"
              >
                立即发布
              </el-button>
            </div>
          </el-card>

          <el-card
            v-if="coverRecommendations.length > 0 && !minimalMode"
            class="panel recommendation-panel"
            shadow="never"
          >
            <template #header>
              <div class="side-header">
                <span>推荐封面</span>
                <el-button size="small" text @click="generateCoverRecommendations">
                  刷新
                </el-button>
              </div>
            </template>
            <div class="cover-grid">
              <button
                v-for="image in coverRecommendations"
                :key="image.id"
                type="button"
                class="cover-option"
                @click="selectCoverImage(image.urls.regular)"
              >
                <img :src="image.urls.small" :alt="image.alt_description || 'cover'" />
              </button>
            </div>
          </el-card>

        </aside>
      </section>
    </div>

    <button
      type="button"
      class="assistant-drawer-trigger"
      :class="{ 'is-active': aiDrawerVisible }"
      @click="aiDrawerVisible = true"
    >
      <span class="assistant-trigger-badge">
        <el-icon><ChatDotRound /></el-icon>
      </span>
      <span class="assistant-trigger-copy">
        <strong>写作助手</strong>
        <small>右侧展开</small>
      </span>
    </button>

    <el-drawer
      v-model="aiDrawerVisible"
      class="assistant-drawer"
      direction="rtl"
      size="min(460px, 92vw)"
      :with-header="false"
      append-to-body
    >
      <div class="assistant-drawer-shell">
        <div class="assistant-drawer-header">
          <div class="assistant-drawer-title">
            <span class="assistant-trigger-badge">
              <el-icon><ChatDotRound /></el-icon>
            </span>
            <div>
              <strong>AI 写作助手</strong>
              <p>生成后可直接插入编辑器或摘要</p>
            </div>
          </div>
          <el-button text @click="aiDrawerVisible = false">
            关闭
          </el-button>
        </div>

        <div class="assistant-drawer-content">
          <AIAssistant
            @use-result="useAiResult"
            @use-summary="useAiSummary"
            @get-content="provideEditorContent"
          />
        </div>
      </div>
    </el-drawer>

    <input
      ref="importInput"
      class="hidden-input"
      type="file"
      accept=".md,.markdown,.html,.htm,text/markdown,text/html"
      @change="handleImportFile"
    />
    <input
      ref="coverInput"
      class="hidden-input"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      @change="handleCoverUpload"
    />

    <el-dialog v-model="replaceDialogVisible" title="查找替换" width="520px">
      <div class="dialog-stack">
        <el-input v-model="replaceForm.find" placeholder="查找内容" />
        <el-input v-model="replaceForm.replace" placeholder="替换为" />
        <el-alert
          type="info"
          :closable="false"
          show-icon
          :title="`当前匹配 ${replaceMatchCount} 处`"
        />
      </div>
      <template #footer>
        <el-button @click="replaceDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="replaceAll">
          全部替换
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="shortcutDialogVisible" title="常用快捷键" width="560px">
      <div class="shortcut-list">
        <div v-for="item in shortcuts" :key="item.key" class="shortcut-item">
          <kbd>{{ item.key }}</kbd>
          <span>{{ item.description }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'
import { createArticle, getArticleById, updateArticle, uploadArticleCover, uploadArticleImage } from '@/api/article'
import { recommendCoverImage, recommendTags, suggestTitle, type UnsplashImage } from '@/api/ai'
import { useThemeStore } from '@/stores/theme'
import type { Article, ArticleStatus, Category, Tag } from '@/types'
import AIAssistant from '@/components/AIAssistant.vue'

type EditorMode = 'wysiwyg' | 'ir' | 'sv'
type PreviewMode = 'both' | 'editor'

interface DraftSnapshot {
  title: string
  categoryId?: number
  tags: string[]
  summary: string
  coverImage: string
  status: ArticleStatus
  scheduledPublishAt: string | null
  content: string
  updatedAt: string
  updatedAtDisplay: string
}

interface PersistPayload {
  title: string
  content: string
  categoryId?: number
  tags?: string[]
  coverImage?: string | null
  summary?: string
  status?: ArticleStatus
  scheduledPublishAt?: string | null
}

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  articleId?: number
}>(), {
  articleId: undefined,
})

const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const editorHost = ref<HTMLDivElement | null>(null)
const importInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const editor = shallowRef<Vditor | null>(null)

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const titleSuggestions = ref<string[]>([])
const recommendedTags = ref<string[]>([])
const coverRecommendations = ref<UnsplashImage[]>([])
const recoverableDraft = ref<DraftSnapshot | null>(null)

const editorBooting = ref(true)
const bootstrapError = ref('')
const submitting = ref(false)
const savingDraft = ref(false)
const coverUploading = ref(false)
const suggestingTitles = ref(false)
const suggestingTags = ref(false)
const suggestingCover = ref(false)
const replaceDialogVisible = ref(false)
const shortcutDialogVisible = ref(false)
const focusMode = ref(false)
const minimalMode = ref(false)
const aiDrawerVisible = ref(false)

const currentArticleId = ref<number | null>(props.articleId ?? null)
const editorMode = ref<EditorMode>('sv')
const previewMode = ref<PreviewMode>('both')
const lastLocalSavedAt = ref('')
const lastPersistedAt = ref('')
const lastPersistedSignature = ref('')

const contentStats = reactive({
  words: 0,
  characters: 0,
  readingMinutes: 1,
})

const replaceForm = reactive({
  find: '',
  replace: '',
})

const form = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  tags: [] as string[],
  summary: '',
  coverImage: '',
  status: 'draft' as ArticleStatus,
  scheduledPublishAt: null as Date | null,
  content: '',
})

lastPersistedSignature.value = serializeEditorState(form.content)

const previewModeOptions = [
  { label: '双栏', value: 'both' },
  { label: '编辑区', value: 'editor' },
]

const shortcuts = [
  { key: 'Ctrl/Cmd + Z', description: '撤销' },
  { key: 'Ctrl/Cmd + Shift + Z', description: '重做' },
  { key: 'Ctrl/Cmd + B', description: '加粗' },
  { key: 'Ctrl/Cmd + I', description: '斜体' },
  { key: 'Ctrl/Cmd + K', description: '插入链接' },
  { key: 'Ctrl/Cmd + Enter', description: '保存当前内容' },
  { key: 'Esc', description: '退出专注模式' },
]

const pageTitle = computed(() => {
  return props.mode === 'edit' ? '编辑文章' : '写文章'
})

const currentModeLabel = computed(() => {
  const map: Record<EditorMode, string> = {
    wysiwyg: '所见即所得',
    ir: '即时渲染',
    sv: '分屏预览',
  }
  return map[editorMode.value]
})

const submitActionLabel = computed(() => {
  if (form.status === 'draft') {
    return currentArticleId.value ? '更新草稿' : '保存草稿'
  }

  if (form.status === 'scheduled') {
    return currentArticleId.value ? '更新定时发布' : '定时发布'
  }

  return currentArticleId.value ? '更新并发布' : '发布文章'
})

const draftStorageKey = computed(() => {
  return currentArticleId.value
    ? `article-editor:draft:${currentArticleId.value}`
    : 'article-editor:draft:create'
})

const replaceMatchCount = computed(() => {
  const keyword = replaceForm.find
  if (!keyword) {
    return 0
  }

  const content = getEditorContent()
  return content.split(keyword).length - 1
})

const hasPendingChanges = computed(() => (
  serializeEditorState() !== lastPersistedSignature.value
))

let autosaveTimer: ReturnType<typeof setTimeout> | null = null

function safeDate(value?: Date | string | null) {
  if (!value) {
    return null
  }

  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatLocalTime(date: Date) {
  return date.toLocaleString('zh-CN', { hour12: false })
}

function buildEditorStateSnapshot(content = getEditorContent()) {
  return {
    title: form.title.trim(),
    categoryId: form.categoryId ?? null,
    tags: [...form.tags].map((tag) => tag.trim()).filter(Boolean).sort(),
    summary: form.summary.trim(),
    coverImage: form.coverImage.trim(),
    status: form.status,
    scheduledPublishAt: form.scheduledPublishAt ? form.scheduledPublishAt.toISOString() : null,
    content,
  }
}

function serializeEditorState(content = getEditorContent()) {
  return JSON.stringify(buildEditorStateSnapshot(content))
}

function syncPersistedSignature(content = getEditorContent()) {
  lastPersistedSignature.value = serializeEditorState(content)
}

function resolveBootstrapErrorMessage(error: unknown) {
  const responseError = error as {
    message?: string
    response?: {
      status?: number
      data?: {
        error?: string
      }
    }
  }

  const status = responseError?.response?.status
  const backendMessage = responseError?.response?.data?.error

  if (props.mode === 'edit') {
    if (status === 404) {
      return '未找到要编辑的文章，可能已被删除，或当前账号没有查看权限。'
    }

    if (status === 401 || status === 403) {
      return '当前登录状态无效，或你没有编辑这篇文章的权限。'
    }
  }

  return backendMessage || responseError?.message || '编辑器初始化失败，请稍后重试。'
}

function getEditorTheme() {
  return themeStore.isDarkMode
    ? {
        editor: 'dark' as const,
        content: 'dark',
        code: 'github-dark',
        preview: 'dark' as const,
      }
    : {
        editor: 'classic' as const,
        content: 'light',
        code: 'github',
        preview: 'light' as const,
      }
}

function buildDraftSnapshot(): DraftSnapshot {
  const now = new Date()
  return {
    title: form.title,
    categoryId: form.categoryId,
    tags: [...form.tags],
    summary: form.summary,
    coverImage: form.coverImage,
    status: form.status,
    scheduledPublishAt: form.scheduledPublishAt ? form.scheduledPublishAt.toISOString() : null,
    content: getEditorContent(),
    updatedAt: now.toISOString(),
    updatedAtDisplay: formatLocalTime(now),
  }
}

function saveLocalDraft() {
  const snapshot = buildDraftSnapshot()
  localStorage.setItem(draftStorageKey.value, JSON.stringify(snapshot))
  lastLocalSavedAt.value = snapshot.updatedAtDisplay
}

function queueLocalDraftSave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer)
  }

  autosaveTimer = setTimeout(() => {
    saveLocalDraft()
  }, 1200)
}

function readDraftSnapshot(key = draftStorageKey.value): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return null
    }

    const trimmed = raw.trim()
    if (!trimmed) {
      localStorage.removeItem(key)
      return null
    }

    const parsed = JSON.parse(trimmed) as DraftSnapshot
    const validStatuses: ArticleStatus[] = ['draft', 'published', 'scheduled']
    const status = validStatuses.includes(parsed.status) ? parsed.status : 'draft'
    
    return {
      ...parsed,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      status,
      updatedAtDisplay: parsed.updatedAtDisplay || formatLocalTime(new Date(parsed.updatedAt)),
    }
  } catch (error) {
    console.error('Failed to parse draft snapshot:', error)
    localStorage.removeItem(key)
    return null
  }
}

function removeDraftSnapshot(key = draftStorageKey.value) {
  localStorage.removeItem(key)
  recoverableDraft.value = null
}

function updateContentStats(markdown: string) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]+/g, ' ')

  const englishWords = plainText.match(/[A-Za-z0-9]+/g)?.length ?? 0
  const cjkChars = plainText.match(/[\u4e00-\u9fff]/g)?.length ?? 0

  contentStats.words = englishWords + cjkChars
  contentStats.characters = plainText.replace(/\s/g, '').length
  contentStats.readingMinutes = Math.max(1, Math.ceil(contentStats.words / 300))
}

function getEditorContent() {
  if (!editor.value || editorBooting.value) {
    return form.content
  }
  try {
    return editor.value.getValue() ?? form.content
  } catch {
    return form.content
  }
}

function syncContentFromEditor() {
  const markdown = getEditorContent()
  form.content = markdown
  updateContentStats(markdown)
}

function applySnapshot(snapshot: DraftSnapshot) {
  form.title = snapshot.title || ''
  form.categoryId = snapshot.categoryId
  form.tags = Array.isArray(snapshot.tags) ? [...snapshot.tags] : []
  form.summary = snapshot.summary || ''
  form.coverImage = snapshot.coverImage || ''
  const validStatuses: ArticleStatus[] = ['draft', 'published', 'scheduled']
  form.status = validStatuses.includes(snapshot.status) ? snapshot.status : 'draft'
  form.scheduledPublishAt = safeDate(snapshot.scheduledPublishAt)
  form.content = snapshot.content || ''
  updateContentStats(form.content)

  if (editor.value) {
    editor.value.setValue(form.content, true)
  }
}

function applyArticle(article: Article) {
  form.title = article.title || ''
  form.categoryId = article.categoryId
  form.tags = Array.isArray(article.tags) ? article.tags.map((tag) => tag.name) : []
  form.summary = article.summary || ''
  form.coverImage = article.coverImage || ''
  form.status = article.status || 'draft'
  form.scheduledPublishAt = safeDate(article.scheduledPublishAt)
  form.content = article.content || ''
  updateContentStats(form.content)
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function fileBaseName() {
  return (form.title || 'article')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'article'
}

function exportMarkdown() {
  downloadTextFile(`${fileBaseName()}.md`, getEditorContent(), 'text/markdown;charset=utf-8')
}

function exportHtml() {
  const html = editor.value?.getHTML() ?? ''
  downloadTextFile(`${fileBaseName()}.html`, html, 'text/html;charset=utf-8')
}

function insertSnippet(snippet: string) {
  editor.value?.insertValue(snippet)
  syncContentFromEditor()
}

function insertCodeBlockTemplate() {
  insertSnippet('\n```ts\nconsole.log("Hello, CSDN");\n```\n')
}

function insertMathTemplate() {
  insertSnippet('\n$$\nE = mc^2\n$$\n')
}

function insertMermaidTemplate() {
  insertSnippet('\n```mermaid\ngraph TD\n  A[开始] --> B[继续写作]\n  B --> C[发布文章]\n```\n')
}

function openEditorImportDialog() {
  importInput.value?.click()
}

function triggerImport() {
  openEditorImportDialog()
}

async function handleImportFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''

  if (!file) {
    return
  }

  const raw = await file.text()
  const importedContent = file.name.endsWith('.html') || file.name.endsWith('.htm')
    ? editor.value?.html2md(raw) ?? raw
    : raw

  form.content = importedContent
  updateContentStats(importedContent)

  if (!form.title) {
    form.title = file.name.replace(/\.(md|markdown|html|htm)$/i, '')
  }

  if (editor.value) {
    editor.value.setValue(importedContent, true)
  }

  ElMessage.success(`已导入 ${file.name}`)
}

function triggerCoverUpload() {
  coverInput.value?.click()
}

function validateCoverFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const isAllowed = allowedTypes.includes(file.type)
  const isLt8M = file.size / 1024 / 1024 < 8

  if (!isAllowed) {
    ElMessage.error('封面仅支持 JPG、PNG、GIF、WEBP 格式')
    return false
  }

  if (!isLt8M) {
    ElMessage.error('封面大小不能超过 8MB')
    return false
  }

  return true
}

async function handleCoverUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''

  if (!file) {
    return
  }

  if (!validateCoverFile(file)) {
    return
  }

  const formData = new FormData()
  formData.append('cover', file)

  try {
    coverUploading.value = true
    const response = await uploadArticleCover(formData)
    form.coverImage = response.coverImage
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('封面上传失败')
  } finally {
    coverUploading.value = false
  }
}

function clearCoverImage() {
  form.coverImage = ''
}

function restoreEditorCache() {
  const snapshot = readDraftSnapshot()
  if (!snapshot) {
    ElMessage.info('当前没有可恢复的本地缓存')
    return
  }

  applySnapshot(snapshot)
  ElMessage.success('已恢复本地缓存')
}

async function clearEditorCache() {
  try {
    await ElMessageBox.confirm('确定清空当前文章的本地缓存吗？', '提示', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
    })

    removeDraftSnapshot()
    editor.value?.clearCache()
    lastLocalSavedAt.value = ''
    ElMessage.success('本地缓存已清空')
  } catch {
    // User cancelled clearing the local cache.
  }
}

function provideEditorContent(callback: (content: string) => void) {
  callback(getEditorContent())
}

function useAiResult(result: string) {
  form.content = result
  updateContentStats(result)
  editor.value?.setValue(result, true)
  ElMessage.success('AI 内容已写入编辑器')
}

function useAiSummary(summary: string) {
  form.summary = summary
}

async function generateTitleSuggestions() {
  const content = getEditorContent()
  if (!content.trim() && !form.title.trim()) {
    ElMessage.warning('请先输入标题或正文内容')
    return
  }

  suggestingTitles.value = true
  try {
    const response = await suggestTitle({
      content,
      currentTitle: form.title,
    }) as { suggestions?: string[] }
    titleSuggestions.value = response.suggestions || []
  } catch (error) {
    ElMessage.error('标题建议生成失败')
  } finally {
    suggestingTitles.value = false
  }
}

function applyTitleSuggestion(title: string) {
  form.title = title
}

async function generateTagSuggestions() {
  const content = getEditorContent()
  if (!content.trim()) {
    ElMessage.warning('请先输入正文内容')
    return
  }

  suggestingTags.value = true
  try {
    const response = await recommendTags({ content }) as { tags?: string[] }
    recommendedTags.value = response.tags || []
  } catch (error) {
    ElMessage.error('标签推荐失败')
  } finally {
    suggestingTags.value = false
  }
}

function addTag(tag: string) {
  if (!form.tags.includes(tag)) {
    form.tags.push(tag)
  }
}

async function generateCoverRecommendations() {
  if (!form.title.trim() && !getEditorContent().trim()) {
    ElMessage.warning('请先输入标题或正文内容')
    return
  }

  suggestingCover.value = true
  try {
    const response = await recommendCoverImage({
      title: form.title,
      content: getEditorContent().slice(0, 800),
    })
    coverRecommendations.value = response.data.images || []
  } catch (error) {
    ElMessage.error('封面推荐失败')
  } finally {
    suggestingCover.value = false
  }
}

function selectCoverImage(url: string) {
  form.coverImage = url
}

function buildPayload(statusOverride?: ArticleStatus): PersistPayload {
  const status = statusOverride ?? form.status
  const normalizedCoverImage = form.coverImage.trim()

  return {
    title: form.title.trim(),
    content: getEditorContent(),
    categoryId: form.categoryId,
    tags: form.tags.filter(Boolean),
    coverImage: normalizedCoverImage || null,
    summary: form.summary.trim() || undefined,
    status,
    scheduledPublishAt: status === 'scheduled'
      ? form.scheduledPublishAt?.toISOString() ?? null
      : null,
  }
}

function canPersist(targetStatus: ArticleStatus) {
  const title = form.title.trim()
  const content = getEditorContent()
  const hasMaterial = title || content.trim() || form.summary.trim()

  if (targetStatus === 'draft') {
    if (!hasMaterial) {
      ElMessage.warning('至少输入一点内容再保存草稿')
      return false
    }
    return true
  }

  if (!title) {
    ElMessage.warning('请输入文章标题')
    return false
  }

  if (!content.trim()) {
    ElMessage.warning('请输入文章正文')
    return false
  }

  if (targetStatus === 'scheduled') {
    if (!form.scheduledPublishAt) {
      ElMessage.warning('请选择定时发布时间')
      return false
    }

    if (form.scheduledPublishAt.getTime() <= Date.now()) {
      ElMessage.warning('定时发布时间需要晚于当前时间')
      return false
    }
  }

  return true
}

async function persist(targetStatus: ArticleStatus, navigateToDetail: boolean) {
  if (!canPersist(targetStatus)) {
    return
  }

  const previousDraftKey = draftStorageKey.value
  const payload = buildPayload(targetStatus)
  const createModeDraft = !currentArticleId.value && targetStatus === 'draft'

  try {
    const savedArticle = currentArticleId.value
      ? await updateArticle(currentArticleId.value, payload)
      : await createArticle(payload)

    currentArticleId.value = savedArticle.id
    applyArticle(savedArticle)
    syncPersistedSignature(savedArticle.content || '')
    lastPersistedAt.value = formatLocalTime(new Date())
    removeDraftSnapshot(previousDraftKey)
    editor.value?.clearCache()
    lastLocalSavedAt.value = ''

    if (editor.value && savedArticle.content !== getEditorContent()) {
      editor.value.setValue(savedArticle.content || '', true)
    }

    if (createModeDraft) {
      ElMessage.success('草稿已保存')
      updateDraftsList(savedArticle)
      await router.replace(`/edit-article/${savedArticle.id}`)
      return
    }

    if (targetStatus === 'draft') {
      updateDraftsList(savedArticle)
    } else {
      removeFromDraftsList(savedArticle.id)
    }

    ElMessage.success(targetStatus === 'scheduled' ? '文章已设置为定时发布' : '文章保存成功')

    if (navigateToDetail) {
      await router.push(`/article/${savedArticle.id}`)
    }
  } catch (error) {
    ElMessage.error('文章保存失败')
  }
}

async function submitCurrentStatus() {
  submitting.value = true
  try {
    await persist(form.status, form.status !== 'draft')
  } finally {
    submitting.value = false
  }
}

async function saveDraft() {
  savingDraft.value = true
  try {
    await persist('draft', false)
  } finally {
    savingDraft.value = false
  }
}

function updateDraftsList(article: Article) {
  try {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]') as Array<{
      id: number
      title: string
      updatedAt: string
      wordCount: number
    }>
    
    const existingIndex = drafts.findIndex(d => d.id === article.id)
    
    const draftItem = {
      id: article.id,
      title: article.title || '未命名文章',
      updatedAt: new Date().toISOString(),
      wordCount: article.content ? article.content.length : 0,
    }
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = draftItem
    } else {
      drafts.unshift(draftItem)
    }
    
    localStorage.setItem('drafts', JSON.stringify(drafts))
  } catch (error) {
    console.error('Failed to update drafts list:', error)
  }
}

function removeFromDraftsList(articleId: number) {
  try {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]') as Array<{
      id: number
      title: string
      updatedAt: string
      wordCount: number
    }>
    
    const filtered = drafts.filter(d => d.id !== articleId)
    localStorage.setItem('drafts', JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove from drafts list:', error)
  }
}

async function publishNow() {
  await persist('published', true)
}

function replaceAll() {
  if (!replaceForm.find) {
    ElMessage.warning('请输入要查找的内容')
    return
  }

  const content = getEditorContent()
  const nextContent = content.split(replaceForm.find).join(replaceForm.replace)

  if (nextContent === content) {
    ElMessage.info('没有找到匹配内容')
    return
  }

  form.content = nextContent
  updateContentStats(nextContent)
  editor.value?.setValue(nextContent, true)
  replaceDialogVisible.value = false
  ElMessage.success('替换完成')
}

function applyEditorTheme() {
  if (!editor.value) {
    return
  }

  const theme = getEditorTheme()
  editor.value.setTheme(theme.editor, theme.content, theme.code, '/vditor/dist/css/content-theme')
}

function createToolbar() {
  return [
    'headings',
    'bold',
    'italic',
    'strike',
    '|',
    'quote',
    'list',
    'ordered-list',
    'check',
    '|',
    'line',
    'code',
    'inline-code',
    'table',
    'link',
    {
      name: 'custom-upload',
      tip: '上传图片',
      icon: '<span class="vditor-custom-icon">📷</span>',
      click: () => handleCustomImageUpload(),
    },
    '|',
    'undo',
    'redo',
    '|',
    {
      name: 'katex-block',
      tip: 'KaTeX 公式块',
      icon: '<span class="vditor-custom-icon">∑</span>',
      click: () => insertMathTemplate(),
    },
    {
      name: 'mermaid-block',
      tip: 'Mermaid 图表',
      icon: '<span class="vditor-custom-icon">M</span>',
      click: () => insertMermaidTemplate(),
    },
    '|',
    'edit-mode',
    'both',
    'preview',
    'fullscreen',
    'outline',
    'export',
    'help',
  ]
}

function handleCustomImageUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files
    if (!files || files.length === 0) return
    
    const token = localStorage.getItem('token')
    const results: string[] = []
    
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file[]', file)
      
      try {
        const response = await fetch('/api/articles/upload-image', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })
        
        const result = await response.json()
        const succMap = result.data?.succMap || result.succMap || {}
        const url = Object.values(succMap)[0]
        
        if (url) {
          results.push(url)
        }
      } catch (error) {
        console.error('上传图片失败:', error)
        ElMessage.error(`上传 ${file.name} 失败`)
      }
    }
    
    if (results.length > 0) {
      const markdownImages = results.map(url => {
        const encodedUrl = encodeURI(url)
        return `![图片](${encodedUrl})`
      }).join('\n')
      editor.value?.insertValue(markdownImages)
      syncContentFromEditor()
      ElMessage.success(`成功上传 ${results.length} 张图片`)
    }
  }
  
  input.click()
}

async function mountEditor(content: string) {
  if (!editorHost.value) {
    return
  }

  editorBooting.value = true
  bootstrapError.value = ''
  editor.value?.destroy()
  editor.value = null
  editorHost.value.innerHTML = ''

  const theme = getEditorTheme()
  const token = localStorage.getItem('token')

  try {
    await new Promise<void>((resolve, reject) => {
      const bootTimeout = window.setTimeout(() => {
        reject(new Error('Vditor bootstrap timeout'))
      }, 12000)

      editor.value = new Vditor(editorHost.value as HTMLDivElement, {
        cdn: '/vditor',
        mode: editorMode.value,
        value: content,
        lang: 'zh_CN',
        icon: 'material',
        theme: theme.editor,
        minHeight: 520,
        height: 680,
        placeholder: '从这里开始写作...',
        toolbar: createToolbar(),
        toolbarConfig: {
          pin: true,
        },
        cache: {
          enable: true,
          id: draftStorageKey.value,
          after(markdown: string) {
            form.content = markdown
            updateContentStats(markdown)
          },
        },
        outline: {
          enable: true,
          position: 'right',
        },
        resize: {
          enable: true,
          position: 'bottom',
        },
        counter: {
          enable: true,
          type: 'markdown',
        },
        preview: {
          mode: previewMode.value,
          maxWidth: 0,
          hljs: {
            enable: true,
            lineNumber: true,
            style: theme.code,
          },
          math: {
            engine: 'KaTeX',
          },
          markdown: {
            toc: true,
            footnotes: true,
            codeBlockPreview: true,
            mathBlockPreview: true,
            autoSpace: true,
            fixTermTypo: true,
          },
          theme: {
            current: theme.preview,
            path: '/vditor/dist/css/content-theme',
          },
        },
        upload: {
          url: '/api/articles/upload-image',
          fieldName: 'file[]',
          accept: 'image/*',
          multiple: true,
          max: 8 * 1024 * 1024,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          success: () => {
            syncContentFromEditor()
            ElMessage.success('图片上传成功')
          },
          error: () => {
            ElMessage.error('图片上传失败')
          },
        },
        keydown(event) {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            void submitCurrentStatus()
          }

          if (event.key === 'Escape' && focusMode.value) {
            focusMode.value = false
          }
        },
        input(markdown) {
          form.content = markdown
          updateContentStats(markdown)
          queueLocalDraftSave()
        },
        after() {
          window.clearTimeout(bootTimeout)
          editorBooting.value = false
          bootstrapError.value = ''
          editor.value?.setPreviewMode(previewMode.value)
          syncContentFromEditor()
          applyEditorTheme()
          resolve()
        },
      })
    })
  } catch (error) {
    editor.value = null
    editorBooting.value = false
    throw error
  }
}

async function loadBaseData() {
  const [categoryList, tagList] = await Promise.all([
    getCategories(),
    getTags(),
  ])

  categories.value = Array.isArray(categoryList) 
    ? categoryList.filter(cat => cat && cat.id != null && cat.name) 
    : []
  tags.value = Array.isArray(tagList) 
    ? tagList.filter(tag => tag && tag.id != null && tag.name) 
    : []
}

async function loadEditingArticle() {
  if (!currentArticleId.value) {
    return
  }

  const article = await getArticleById(currentArticleId.value)
  applyArticle(article)
  syncPersistedSignature(article.content || '')
}

function restoreLocalDraft() {
  if (!recoverableDraft.value) {
    return
  }

  applySnapshot(recoverableDraft.value)
  ElMessage.success('已恢复本地缓存')
}

function discardLocalDraft() {
  removeDraftSnapshot()
  ElMessage.success('本地缓存已丢弃')
}

async function bootstrapEditorWorkspace() {
  bootstrapError.value = ''
  editorBooting.value = true

  try {
    await loadBaseData()

    if (props.mode === 'edit') {
      await loadEditingArticle()
      recoverableDraft.value = readDraftSnapshot()
    } else {
      const createDraft = readDraftSnapshot()
      if (createDraft) {
        applySnapshot(createDraft)
        lastLocalSavedAt.value = createDraft.updatedAtDisplay
        ElMessage.success('已恢复上次未完成的草稿')
      }
    }

    await nextTick()
    await mountEditor(form.content)
  } catch (error) {
    console.error('Editor bootstrap failed:', error)
    bootstrapError.value = resolveBootstrapErrorMessage(error)
    editorBooting.value = false
    ElMessage.error(bootstrapError.value)
  }
}

function retryBootstrap() {
  void bootstrapEditorWorkspace()
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasPendingChanges.value || submitting.value || savingDraft.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  document.addEventListener('paste', handlePasteEvent)
  window.addEventListener('beforeunload', handleBeforeUnload)
  await bootstrapEditorWorkspace()
})

onBeforeUnmount(() => {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer)
  }
  editor.value?.destroy()
  document.removeEventListener('paste', handlePasteEvent)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (!hasPendingChanges.value || submitting.value || savingDraft.value) {
    return true
  }

  try {
    await ElMessageBox.confirm(
      '当前内容还有未同步到服务器的修改，离开页面前确认放弃这些修改吗？',
      '离开提醒',
      {
        confirmButtonText: '确认离开',
        cancelButtonText: '继续编辑',
        type: 'warning',
      }
    )

    return true
  } catch {
    return false
  }
})

watch(
  () => [
    form.title,
    form.categoryId,
    form.summary,
    form.coverImage,
    form.status,
    form.tags.join(','),
    form.scheduledPublishAt?.toISOString() ?? '',
  ],
  () => {
    queueLocalDraftSave()
  },
)

watch(previewMode, (mode) => {
  editor.value?.setPreviewMode(mode)
})

watch(editorMode, async () => {
  const currentContent = getEditorContent()
  await nextTick()
  try {
    await mountEditor(currentContent)
  } catch (error) {
    console.error('Editor mode switch failed:', error)
    bootstrapError.value = resolveBootstrapErrorMessage(error)
    editorBooting.value = false
    ElMessage.error(bootstrapError.value)
  }
})

watch(
  () => themeStore.isDarkMode,
  () => {
    applyEditorTheme()
  },
)

watch(
  () => form.status,
  (status) => {
    if (status !== 'scheduled') {
      form.scheduledPublishAt = null
    }
  },
)

async function handlePasteEvent(event: ClipboardEvent) {
  const target = event.target as HTMLElement
  const editorHostEl = editorHost.value
  
  if (!editorHostEl || !editorHostEl.contains(target)) {
    return
  }

  const items = event.clipboardData?.items
  if (!items) return

  let hasImages = false
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      hasImages = true
      break
    }
  }

  if (!hasImages) return

  event.preventDefault()

  const imageFiles: File[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        imageFiles.push(file)
      }
    }
  }

  const token = localStorage.getItem('token')
  const uploadedUrls: string[] = []

  for (const file of imageFiles) {
    const formData = new FormData()
    formData.append('file[]', file)

    try {
      const response = await fetch('/api/articles/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const result = await response.json()
      const succMap = result.data?.succMap || result.succMap || {}
      const url = Object.values(succMap)[0]

      if (url) {
        uploadedUrls.push(url)
      }
    } catch (error) {
      console.error('粘贴图片上传失败:', error)
    }
  }

  if (uploadedUrls.length > 0) {
    const markdownImages = uploadedUrls.map(url => `![图片](${encodeURI(url)})`).join('\n')
    editor.value?.insertValue(markdownImages)
    syncContentFromEditor()
    ElMessage.success(`成功粘贴 ${uploadedUrls.length} 张图片`)
  }
}
</script>

<style scoped>
.article-editor-workspace {
  min-height: 100vh;
  background: 
    radial-gradient(circle at top left, rgba(74, 134, 232, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(32, 178, 170, 0.1), transparent 35%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(245, 250, 245, 0.9) 100%),
    url('/images/3.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 28px;
  transition: background 0.4s ease;
}

.article-editor-workspace.dark {
  background: 
    radial-gradient(circle at top left, rgba(74, 134, 232, 0.05), transparent 30%),
    radial-gradient(circle at top right, rgba(32, 178, 170, 0.08), transparent 35%),
    linear-gradient(135deg, rgba(10, 14, 12, 0.95) 0%, rgba(15, 22, 19, 0.9) 50%, rgba(10, 14, 12, 0.95) 100%),
    url('/images/3.png');
}

.workspace-shell {
  max-width: 1680px;
  margin: 0 auto;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  margin-bottom: 18px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-logo {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 20px;
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: 0 4px 16px var(--shadow-light);
}

.header-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.header-content {
  min-width: 0;
}

.workspace-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-light);
}

.workspace-header h1 {
  margin: 0;
  font-size: clamp(30px, 3vw, 44px);
  color: var(--text-dark);
}

.workspace-subtitle {
  margin: 10px 0 0;
  max-width: 760px;
  line-height: 1.7;
  color: var(--text-main);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.draft-alert {
  margin-bottom: 18px;
}

.draft-alert-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.workspace-body {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(320px, 420px);
  gap: 22px;
}

.workspace-main,
.workspace-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel {
  border: 1px solid color-mix(in srgb, var(--border-light) 70%, #7ab8ff 30%) !important;
  background: color-mix(in srgb, var(--bg-card) 90%, #ffffff 10%) !important;
  box-shadow: 0 20px 60px rgba(21, 37, 62, 0.08) !important;
  backdrop-filter: blur(12px);
}

.hero-panel :deep(.el-card__body),
.editor-panel :deep(.el-card__body),
.meta-panel :deep(.el-card__body),
.recommendation-panel :deep(.el-card__body),
.assistant-panel :deep(.el-card__body) {
  padding: 20px;
}

.title-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.title-input {
  width: 100%;
}

.title-input :deep(.el-input__wrapper) {
  min-height: 60px;
  box-shadow: none !important;
  font-size: 24px;
}

.title-suggestions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.hero-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
  color: var(--text-muted);
  font-size: 13px;
}

.dirty-state {
  color: #c67b3b;
  font-weight: 600;
}

.toolbar-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-label,
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.compact-select {
  width: 160px;
}

.action-group {
  justify-content: flex-end;
}

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.editor-surface {
  position: relative;
  min-height: 720px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--border-light) 65%, #d8e6ff 35%);
  overflow: hidden;
  background: color-mix(in srgb, var(--bg-card) 92%, #ffffff 8%);
}

.editor-loading {
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 24px;
  background: color-mix(in srgb, var(--bg-card) 96%, #ffffff 4%);
}

.editor-error {
  display: grid;
  place-items: center;
  min-height: 720px;
  padding: 24px;
}

.editor-host {
  min-height: 720px;
}

.editor-host :deep(.vditor) {
  border: none;
}

.editor-host :deep(.vditor-toolbar) {
  border-bottom: 1px solid var(--border-light);
}

.editor-host :deep(.vditor-reset) {
  font-size: 15px;
}

.editor-host :deep(.vditor-custom-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2em;
  font-size: 16px;
  font-weight: 700;
}

.side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-hint {
  font-size: 12px;
  color: var(--text-light);
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.clickable-tag {
  cursor: pointer;
}

.cover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cover-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.cover-preview {
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.82);
}

.cover-preview img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
}

.cover-preview-footer {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.92);
}

.cover-preview-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.cover-preview-url {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.cover-empty {
  padding: 14px 16px;
  border: 1px dashed var(--border-light);
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.5);
}

.status-group {
  width: 100%;
}

.status-group :deep(.el-radio-button__inner) {
  width: 100%;
}

.full-width {
  width: 100%;
}

.publish-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
}

.publish-actions .el-button:first-child {
  grid-column: 1 / -1;
}

.cover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.cover-option {
  padding: 0;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
}

.cover-option img {
  width: 100%;
  height: 120px;
  display: block;
  object-fit: cover;
}

.assistant-drawer-trigger {
  position: fixed;
  right: 18px;
  top: 50%;
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px 12px 12px;
  border: 1px solid color-mix(in srgb, var(--border-light) 62%, #7ab8ff 38%);
  border-right: none;
  border-radius: 18px 0 0 18px;
  background: color-mix(in srgb, var(--bg-card) 88%, #ffffff 12%);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transform: translateY(-50%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.assistant-drawer-trigger:hover {
  transform: translateY(-50%) translateX(-4px);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.18);
}

.assistant-drawer-trigger.is-active {
  background: color-mix(in srgb, var(--mint-green) 18%, var(--bg-card) 82%);
}

.assistant-trigger-badge {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--mint-green), color-mix(in srgb, var(--mint-green) 60%, #5ca9ff 40%));
  color: white;
  flex: 0 0 38px;
  box-shadow: 0 10px 24px rgba(58, 164, 141, 0.28);
}

.assistant-trigger-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  color: var(--text-dark);
  text-align: left;
}

.assistant-trigger-copy strong {
  font-size: 14px;
  line-height: 1.2;
}

.assistant-trigger-copy small {
  font-size: 11px;
  color: var(--text-light);
}

:deep(.assistant-drawer .el-drawer) {
  background:
    radial-gradient(circle at top right, rgba(74, 134, 232, 0.08), transparent 28%),
    radial-gradient(circle at top left, rgba(32, 178, 170, 0.1), transparent 24%),
    var(--bg-main);
}

:deep(.assistant-drawer .el-drawer__body) {
  padding: 0;
}

.assistant-drawer-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.assistant-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-light);
  background: color-mix(in srgb, var(--bg-card) 86%, #ffffff 14%);
  backdrop-filter: blur(12px);
}

.assistant-drawer-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assistant-drawer-title strong {
  display: block;
  color: var(--text-dark);
  font-size: 18px;
  line-height: 1.2;
}

.assistant-drawer-title p {
  margin: 4px 0 0;
  color: var(--text-light);
  font-size: 12px;
}

.assistant-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}

.assistant-drawer-content :deep(.ai-card) {
  margin-bottom: 0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08) !important;
}

.dialog-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-list {
  display: grid;
  gap: 10px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 12px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--bg-main) 92%, #ffffff 8%);
}

.shortcut-item kbd {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  font-family: inherit;
}

.hidden-input {
  display: none;
}

.is-focus-mode .workspace-body {
  grid-template-columns: 1fr;
}

.is-focus-mode .workspace-main {
  max-width: 100%;
}

.is-minimal-mode .workspace-subtitle,
.is-minimal-mode .hero-meta {
  display: none;
}

@media (max-width: 1280px) {
  .workspace-body {
    grid-template-columns: 1fr;
  }

  .workspace-side {
    order: -1;
  }
}

@media (max-width: 768px) {
  .article-editor-workspace {
    padding: 16px;
  }

  .assistant-drawer-trigger {
    right: 12px;
    bottom: 18px;
    top: auto;
    transform: none;
    border-right: 1px solid color-mix(in srgb, var(--border-light) 62%, #7ab8ff 38%);
    border-radius: 18px;
  }

  .assistant-drawer-trigger:hover {
    transform: translateY(-2px);
  }

  .workspace-header {
    flex-direction: column;
  }

  .toolbar-strip,
  .title-row {
    flex-direction: column;
    align-items: stretch;
  }

  .compact-select {
    width: 100%;
  }

  .editor-surface,
  .editor-host {
    min-height: 560px;
  }

  .publish-actions {
    grid-template-columns: 1fr;
  }
}
</style>
