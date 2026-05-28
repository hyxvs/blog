<!--
  ============================================
  ArticleDetail.vue - 文章详情页面
  ============================================
  
  【知识点】文章详情页面：
  展示单篇文章的完整内容
  包含文章信息（标题、作者、发布时间等）
  支持评论功能（查看、发表、删除评论）
  作者和管理员可以编辑或删除文章
  
  【知识点】动态路由：
  页面路径为 /article/:id，id 是文章的唯一标识
  通过 route.params.id 获取文章 ID
-->

<template>
  <!--
    【知识点】页面容器：
    class="article-detail" 用于页面级样式
  -->
  <div class="article-detail guofeng-reading-page guofeng-site-page" :class="{ dark: isDark }">
    <div class="reading-progress-bar">
      <div class="reading-progress-fill" :style="{ width: `${readingProgress}%` }"></div>
    </div>
    
    <!--
      ============================================
      返回按钮
      ============================================
    -->
    <div class="back-button-container">
      <el-button 
        type="text" 
        @click="goBack" 
        class="back-button"
        icon="ArrowLeft"
      >
        返回
      </el-button>
    </div>
    
    <!--
      ============================================
      主内容区域
      ============================================
      
      【知识点】v-if="article" 条件渲染：
      只有当文章数据加载完成后才显示内容
      避免在数据未加载时显示空白或报错
    -->
    <!-- 骨架屏 -->
    <div class="container" v-if="loading">
      <div class="main-content">
        <el-card class="skeleton-card">
          <div class="skeleton-title"></div>
          <div class="skeleton-meta">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-meta-info">
              <div class="skeleton-line" style="width: 100px; height: 16px;"></div>
              <div class="skeleton-line" style="width: 150px; height: 14px; margin-top: 4px;"></div>
            </div>
          </div>
          <div class="skeleton-tags">
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
          </div>
          <div class="skeleton-content">
            <div class="skeleton-line" style="width: 100%; height: 16px;"></div>
            <div class="skeleton-line" style="width: 95%; height: 16px; margin-top: 12px;"></div>
            <div class="skeleton-line" style="width: 98%; height: 16px; margin-top: 12px;"></div>
            <div class="skeleton-line" style="width: 92%; height: 16px; margin-top: 12px;"></div>
            <div class="skeleton-line" style="width: 97%; height: 16px; margin-top: 12px;"></div>
          </div>
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-line" style="width: 100%; height: 16px;"></div>
            <div class="skeleton-line" style="width: 93%; height: 16px; margin-top: 12px;"></div>
            <div class="skeleton-line" style="width: 96%; height: 16px; margin-top: 12px;"></div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 实际内容 -->
    <div class="container" v-else-if="article">
      <div class="main-content">
        <!--
          ============================================
          文章卡片
          ============================================
        -->
        <el-card>
          <!--
            【知识点】文章标题：
            使用 h1 标签，页面主要标题
            从 article 对象中获取标题数据
          -->
          <h1 class="article-title">{{ article.title }}</h1>
          
          <!--
            ============================================
            文章元信息（作者、时间等）
            ============================================
          -->
          <div class="article-meta">
            <!--
              【知识点】作者头像：
              el-avatar 组件显示用户头像
              :size="32" - 头像大小 32px
              :src="article.authorAvatar" - 头像图片地址
              
              【知识点】默认头像：
              组件标签内 {{ }} 的内容是默认显示
              当 src 图片加载失败时显示用户名首字母
            -->
            <el-avatar :size="32" :src="article.authorAvatar">
              {{ article.authorName && article.authorName.charAt(0).toUpperCase() }}
            </el-avatar>
            <!-- 作者信息 -->
            <div class="meta-info">
              <div class="author-name">{{ article.authorName }}</div>
              <div class="meta-time">
                <span>{{ formatDate(article.createdAt) }}</span>
                <span>{{ article.viewCount }} 阅读</span>
                <span class="like-count">
                  <el-button 
                    type="text" 
                    @click="handleLike" 
                    :icon="isLiked ? StarFilled : Star"
                    :class="{ 'liked': isLiked }"
                  >
                    {{ article.likeCount }} 点赞
                  </el-button>
                </span>
              </div>
            </div>
          </div>
          
          <!--
            ============================================
            文章标签
            ============================================
          -->
          <div class="article-tags">
            <!--
              【知识点】分类标签：
              type="success" - 绿色标签，表示分类
            -->
            <el-tag v-if="article.categoryName" type="success">{{ article.categoryName }}</el-tag>
            <!--
              【知识点】文章标签：
              type="info" - 灰色标签
              遍历 article.tags 数组显示所有标签
            -->
            <el-tag v-for="tag in article.tags" :key="tag.id" type="info">{{ tag.name }}</el-tag>
          </div>
          
          <!--
            ============================================
            文章内容
            ============================================
            
            【知识点】v-html 指令：
            将 HTML 字符串渲染为实际的 HTML 元素
            用于显示富文本编辑器生成的 HTML 内容
            
            【知识点】XSS 安全：
            v-html 可能存在 XSS 风险
            后端应该对内容进行过滤和转义
            前端也可以考虑使用 DOMPurify 等库进行净化
          -->
          <div ref="articleContentRef" class="article-content vditor-reset"></div>
          
          <!--
            ============================================
            文章摘要
            ============================================
          -->
          <div class="article-summary-section">
            <div class="summary-header">
              <el-icon><Document /></el-icon>
              <span>文章摘要</span>
              <el-button 
                type="primary" 
                size="small" 
                @click="generateArticleSummary" 
                :loading="generatingSummary"
                style="margin-left: auto;"
              >
                <el-icon><MagicStick /></el-icon>
                AI生成摘要
              </el-button>
            </div>
            <div v-if="articleSummary" class="summary-content">
              {{ articleSummary }}
            </div>
            <el-empty v-else description="暂无摘要，点击上方按钮生成" :image-size="60" />
          </div>
          
          <!--
            ============================================
            文章操作按钮
            ============================================
            
            【知识点】权限控制：
            v-if="userStore.userId === article.authorId || userStore.isAdmin"
            只有文章作者或管理员才能看到编辑和删除按钮
          -->
          <div class="reader-quick-actions">
            <el-button plain @click="copyArticleLink">复制链接</el-button>
            <el-button plain @click="tocDrawerVisible = true">
              展开目录
              <span v-if="tocItems.length" class="quick-action-count">{{ tocItems.length }}</span>
            </el-button>
            <el-button plain :disabled="!previousArticle" @click="previousArticle && goToArticle(previousArticle.id)">
              上一篇
            </el-button>
            <el-button plain :disabled="!nextArticle" @click="nextArticle && goToArticle(nextArticle.id)">
              下一篇
            </el-button>
          </div>

          <div class="article-actions" v-if="userStore.userId === article.authorId || userStore.isAdmin">
            <el-button type="primary" @click="editArticle">编辑文章</el-button>
            <el-button type="danger" @click="deleteArticle">删除文章</el-button>
          </div>
        </el-card>

        <!--
          ============================================
          相关文章推荐
          ============================================
        -->
        <el-card class="related-articles-card">
          <template #header>
            <div class="card-header">
              <el-icon><MagicStick /></el-icon>
              <span>相关文章推荐</span>
            </div>
          </template>
          <div v-if="relatedArticles.length > 0" class="related-articles-list">
            <div
              v-for="article in relatedArticles"
              :key="article.id"
              class="related-article-item"
              @click="goToArticle(article.id)"
            >
              <el-icon><Document /></el-icon>
              <span class="article-title">{{ article.title }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无相关文章" />
        </el-card>

        <!--
          ============================================
          评论区域
          ============================================
        -->
        <el-card class="comments-card">
          <!-- 评论区域头部：显示评论数量 -->
          <template #header>
            <span>评论 ({{ comments.length }})</span>
          </template>
          
          <!--
            ============================================
            评论表单
            ============================================
            
            【知识点】条件渲染：
            v-if="userStore.isLoggedIn" - 只有登录用户才能发表评论
            v-else - 未登录用户显示登录提示
          -->
          <div class="comment-form" v-if="userStore.isLoggedIn">
            <!--
              【知识点】文本域输入：
              type="textarea" - 多行文本输入
              :rows="3" - 显示3行高度
              placeholder - 占位提示文字
            -->
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="发表评论..."
            />
            <!-- AI 功能按钮 -->
            <div class="ai-actions">
              <el-button size="small" @click="loadCommentSuggestions" :loading="loadingSuggestions">
                <el-icon><ChatDotRound /></el-icon>
                评论建议
              </el-button>
            </div>
            <!-- 评论建议 -->
            <div v-if="commentSuggestions.length > 0" class="comment-suggestions">
              <el-divider content-position="left">评论建议</el-divider>
              <div class="suggestions-list">
                <el-button
                  v-for="(suggestion, index) in commentSuggestions"
                  :key="index"
                  size="small"
                  @click="useCommentSuggestion(suggestion)"
                  plain
                >
                  {{ typeof suggestion === 'object' ? suggestion.comment : suggestion }}
                </el-button>
              </div>
            </div>
            <!-- 提交按钮区域 -->
            <div class="form-actions">
              <el-button type="primary" @click="submitComment" :loading="submitting">
                发表评论
              </el-button>
            </div>
          </div>
          <!-- 未登录提示 -->
          <div v-else class="login-tip">
            <router-link to="/login">登录</router-link> 后发表评论
          </div>

          <!--
            ============================================
            评论列表
            ============================================
          -->
          <div class="comments-list">
            <!-- 遍历评论列表 -->
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <!-- 评论头部：头像、用户名、时间、删除按钮 -->
              <div class="comment-header">
                <el-avatar :size="32" :src="comment.avatar">
                  {{ comment.username && comment.username.charAt(0).toUpperCase() }}
                </el-avatar>
                <div class="comment-info">
                  <div class="comment-author">{{ comment.username }}</div>
                  <div class="comment-time">{{ formatDate(comment.createdAt) }}</div>
                </div>
                <!--
                  【知识点】删除评论权限：
                  评论作者或管理员可以删除评论
                  type="danger" - 红色按钮
                  text - 纯文字按钮样式
                -->
                <div class="comment-actions">
                  <el-button
                    v-if="userStore.userId === comment.userId || userStore.isAdmin"
                    type="danger"
                    size="small"
                    text
                    @click="deleteComment(comment.id)"
                  >
                    删除
                  </el-button>
                  <el-button
                    v-if="userStore.isLoggedIn"
                    size="small"
                    text
                    @click="toggleReplyInput('comment', comment.id)"
                  >
                    <el-icon><ChatLineRound /></el-icon>
                    回复
                  </el-button>
                  <el-button
                    v-if="userStore.isLoggedIn"
                    size="small"
                    text
                    @click="generateReply(comment)"
                    :loading="comment.generatingReply"
                    :disabled="comment.generatingReply"
                  >
                    <el-icon v-if="!comment.generatingReply"><ChatLineRound /></el-icon>
                    <el-icon v-else><Loading /></el-icon>
                    {{ comment.generatingReply ? '生成中...' : 'AI 回复' }}
                  </el-button>
                </div>
              </div>
              <!-- 评论内容 -->
              <div class="comment-content">{{ comment.content }}</div>
              
              <!-- 情感分析结果 -->
              <div v-if="comment.sentiment" class="comment-sentiment">
                <el-tag :type="getSentimentType(comment.sentiment)">
                  {{ getSentimentText(comment.sentiment) }} ({{ Math.round(comment.sentimentScore * 100) }}%)
                </el-tag>
                <span v-if="comment.sentimentKeywords && comment.sentimentKeywords.length > 0" class="sentiment-keywords">
                  关键词：{{ comment.sentimentKeywords.join(', ') }}
                </span>
              </div>
              
              <!-- 回复输入框 -->
              <div v-if="replyInputs[`comment_${comment.id}`]" class="reply-input-container">
                <el-input
                  v-model="replyContent[`comment_${comment.id}`]"
                  type="textarea"
                  :rows="2"
                  placeholder="输入回复..."
                />
                <div class="reply-actions">
                  <el-button @click="toggleReplyInput('comment', comment.id)">取消</el-button>
                  <el-button type="primary" @click="submitReply('comment', comment.id)" :loading="replying">
                    回复
                  </el-button>
                </div>
              </div>
              
              <!--
                ============================================
                回复列表（嵌套评论）
                ============================================
                
                【知识点】嵌套渲染：
                评论可以有回复，形成层级结构
                v-if="comment.replies && comment.replies.length > 0" - 有回复时才显示
              -->
              <div v-if="comment.replies && comment.replies.length > 0" class="replies">
                <div v-for="reply in comment.replies" :key="reply.id" :class="['reply-item', { 'ai-reply': reply.isAI }]">
                  <div class="reply-header">
                    <el-avatar :size="24" :src="reply.avatar">
                      {{ reply.username && reply.username.charAt(0).toUpperCase() }}
                    </el-avatar>
                    <div class="reply-info">
                      <div class="reply-author">
                        {{ reply.username }}
                        <el-tag v-if="reply.isAI" size="small" type="primary" effect="dark" style="margin-left: 5px;">AI</el-tag>
                      </div>
                      <div class="reply-time">{{ formatDate(reply.createdAt) }}</div>
                    </div>
                    <el-button
                      v-if="userStore.userId === reply.userId || userStore.isAdmin"
                      type="danger"
                      size="small"
                      text
                      @click="deleteComment(reply.id)"
                    >
                      删除
                    </el-button>
                    <el-button
                      v-if="userStore.isLoggedIn"
                      size="small"
                      text
                      @click="toggleReplyInput('reply', reply.id, reply.username)"
                    >
                      <el-icon><ChatLineRound /></el-icon>
                      回复
                    </el-button>
                    <el-button
                      v-if="userStore.isLoggedIn"
                      size="small"
                      text
                      @click="generateReply(reply)"
                      :loading="reply.generatingReply"
                      :disabled="reply.generatingReply"
                    >
                      <el-icon v-if="!reply.generatingReply"><ChatLineRound /></el-icon>
                      <el-icon v-else><Loading /></el-icon>
                      {{ reply.generatingReply ? '生成中...' : 'AI 回复' }}
                    </el-button>
                  </div>
                  <div class="reply-content">{{ reply.content }}</div>
                  
                  <!-- 回复输入框 -->
                  <div v-if="replyInputs[`reply_${reply.id}`]" class="reply-input-container">
                    <el-input
                      v-model="replyContent[`reply_${reply.id}`]"
                      type="textarea"
                      :rows="2"
                      placeholder="输入回复..."
                    />
                    <div class="reply-actions">
                      <el-button @click="toggleReplyInput('reply', reply.id)">取消</el-button>
                      <el-button type="primary" @click="submitReply('reply', reply.id)" :loading="replying">
                        回复
                      </el-button>
                    </div>
                  </div>
                  
                  <!-- 嵌套回复 -->
                  <div v-if="reply.replies && reply.replies.length > 0" class="nested-replies">
                    <div v-for="nestedReply in reply.replies" :key="nestedReply.id" :class="['reply-item', { 'ai-reply': nestedReply.isAI }]">
                      <div class="reply-header">
                        <el-avatar :size="24" :src="nestedReply.avatar">
                          {{ nestedReply.username && nestedReply.username.charAt(0).toUpperCase() }}
                        </el-avatar>
                        <div class="reply-info">
                          <div class="reply-author">
                            {{ nestedReply.username }}
                            <el-tag v-if="nestedReply.isAI" size="small" type="primary" effect="dark" style="margin-left: 5px;">AI</el-tag>
                          </div>
                          <div class="reply-time">{{ formatDate(nestedReply.createdAt) }}</div>
                        </div>
                        <el-button
                          v-if="userStore.userId === nestedReply.userId || userStore.isAdmin"
                          type="danger"
                          size="small"
                          text
                          @click="deleteComment(nestedReply.id)"
                        >
                          删除
                        </el-button>
                        <el-button
                          v-if="userStore.isLoggedIn"
                          size="small"
                          text
                          @click="toggleReplyInput('reply', nestedReply.id, nestedReply.username)"
                        >
                          <el-icon><ChatLineRound /></el-icon>
                          回复
                        </el-button>
                        <el-button
                          v-if="userStore.isLoggedIn"
                          size="small"
                          text
                          @click="generateReply(nestedReply)"
                          :loading="nestedReply.generatingReply"
                          :disabled="nestedReply.generatingReply"
                        >
                          <el-icon v-if="!nestedReply.generatingReply"><ChatLineRound /></el-icon>
                          <el-icon v-else><Loading /></el-icon>
                          {{ nestedReply.generatingReply ? '生成中...' : 'AI 回复' }}
                        </el-button>
                      </div>
                      <div class="reply-content">{{ nestedReply.content }}</div>
                      
                      <!-- 回复输入框 -->
                      <div v-if="replyInputs[`reply_${nestedReply.id}`]" class="reply-input-container">
                        <el-input
                          v-model="replyContent[`reply_${nestedReply.id}`]"
                          type="textarea"
                          :rows="2"
                          placeholder="输入回复..."
                        />
                        <div class="reply-actions">
                          <el-button @click="toggleReplyInput('reply', nestedReply.id)">取消</el-button>
                          <el-button type="primary" @click="submitReply('reply', nestedReply.id)" :loading="replying">
                            回复
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!--
            ============================================
            评论分页
            ============================================
          -->
          <el-pagination
            v-if="pagination.total > 0"
            :current-page="pagination.page"
            :page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </el-card>
      </div>
    </div>

    <div class="floating-reader-tools">
      <button
        v-if="hasResumePosition"
        type="button"
        class="reader-tool-button"
        @click="resumeReading"
      >
        继续上次阅读
        <strong>{{ savedReadingProgress }}%</strong>
      </button>
      <button
        type="button"
        class="reader-tool-button"
        :disabled="readingProgress < 8"
        @click="scrollToTop"
      >
        回到顶部
      </button>
    </div>

    <el-drawer
      v-model="tocDrawerVisible"
      direction="rtl"
      size="min(320px, 88vw)"
      title="文章目录"
    >
      <div v-if="tocItems.length" class="toc-drawer-list">
        <button
          v-for="item in tocItems"
          :key="item.id"
          type="button"
          class="toc-drawer-item"
          :class="`level-${item.level}`"
          @click="scrollToHeading(item.id)"
        >
          {{ item.text }}
        </button>
      </div>
      <el-empty v-else description="当前文章暂时没有可用目录" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 【知识点】组合式 API 导入：
 * ref - 创建响应式引用
 * onMounted - 组件挂载后的生命周期钩子
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 【知识点】路由相关：
 * useRoute - 获取当前路由信息，包括路由参数
 * useRouter - 获取路由实例，用于编程式导航
 */
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { getArticleById, getArticleLikes, getArticles, likeArticle } from '@/api/article'
import { getComments, createComment, deleteComment as deleteCommentApi } from '@/api/comment'
import { analyzeSentiment, generateCommentReply, generateCommentSuggestion, translateArticle as translateArticleApi } from '@/api/ai'
import { recommendArticles, generateSummary as generateSummaryApi } from '@/api/document'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Warning, ChatLineRound, MagicStick, Document, Message, Loading, Star, StarFilled } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/tools'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Vditor from 'vditor'
import type { Article } from '@/types'

type ArticleCodeTheme = 'dark' | 'light'

type TocItem = {
  id: string
  text: string
  level: number
}

/**
 * 【知识点】路由实例：
 * route - 当前路由对象，包含 params、query 等信息
 * router - 路由实例，用于页面跳转
 */
const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

/**
 * 【知识点】用户 Store：
 * 用于获取当前用户信息和权限状态
 */
const userStore = useUserStore()

/**
 * 【知识点】响应式数据：
 * article - 文章详情数据
 * comments - 评论列表
 * newComment - 新评论内容
 * submitting - 评论提交状态
 */
const article = ref<Article | null>(null)
const articleContentRef = ref<HTMLDivElement | null>(null)
const isLiked = ref(false)
const comments = ref([])
const newComment = ref('')
const submitting = ref(false)
const commentSuggestions = ref([])
const loadingSuggestions = ref(false)
const articleSeries = ref<Article[]>([])
const readingProgress = ref(0)
const savedReadingProgress = ref(0)
const savedScrollTop = ref(0)
const hasResumePosition = ref(false)
const tocDrawerVisible = ref(false)
const tocItems = ref<TocItem[]>([])

// 加载状态
const loading = ref(true)

// 相关文章功能
const relatedArticles = ref([])

// 摘要生成功能
const articleSummary = ref('')
const generatingSummary = ref(false)

// 回复功能
const replyInputs = ref({})
const replyContent = ref({})
const replying = ref(false)

/**
 * 【知识点】分页状态：
 * 用于评论分页
 */
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

const articleCodeTheme = ref<ArticleCodeTheme>(
  localStorage.getItem('article_detail_code_theme') === 'light'
    ? 'light'
    : localStorage.getItem('article_detail_code_theme') === 'dark'
      ? 'dark'
      : themeStore.isDarkMode
        ? 'dark'
        : 'light'
)

const previousArticle = computed(() => {
  if (!article.value) {
    return null
  }

  const currentIndex = articleSeries.value.findIndex((item) => item.id === article.value?.id)
  return currentIndex > 0 ? articleSeries.value[currentIndex - 1] : null
})

const nextArticle = computed(() => {
  if (!article.value) {
    return null
  }

  const currentIndex = articleSeries.value.findIndex((item) => item.id === article.value?.id)
  return currentIndex >= 0 && currentIndex < articleSeries.value.length - 1
    ? articleSeries.value[currentIndex + 1]
    : null
})

let scrollFrameId: number | null = null

function getArticleCodeThemeIcon(theme: ArticleCodeTheme) {
  if (theme === 'dark') {
    return '<span class="article-code-theme-glyph" aria-hidden="true">☾</span>'
  }

  return '<span class="article-code-theme-glyph" aria-hidden="true">☀</span>'
}

function getArticleCodeLanguage(rawLanguage: string) {
  const cleaned = rawLanguage.trim().toLowerCase().replace(/\s+/g, '')
  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    md: 'markdown',
    yml: 'yaml',
    text: 'plaintext',
    txt: 'plaintext',
    plain: 'plaintext',
    'c++': 'cpp',
    'c#': 'csharp',
    cs: 'csharp',
  }

  return aliases[cleaned] || cleaned.replace(/[^a-z0-9_-]/g, '') || 'plaintext'
}

function getArticleCodeLanguageLabel(rawLanguage: string) {
  const cleaned = rawLanguage.trim().toLowerCase().replace(/\s+/g, '')
  const labels: Record<string, string> = {
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    jsx: 'JSX',
    tsx: 'TSX',
    vue: 'Vue',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    less: 'Less',
    json: 'JSON',
    bash: 'Bash',
    sh: 'Bash',
    python: 'Python',
    py: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    go: 'Go',
    rust: 'Rust',
    sql: 'SQL',
    yaml: 'YAML',
    xml: 'XML',
    markdown: 'Markdown',
    plaintext: 'Text',
  }

  const normalized = getArticleCodeLanguage(cleaned)
  return labels[cleaned] || labels[normalized] || (normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Code')
}

function isArticleCodeDecoratable(codeElement: HTMLElement) {
  return ![
    'language-mermaid',
    'language-flowchart',
    'language-echarts',
    'language-mindmap',
    'language-plantuml',
    'language-markmap',
    'language-abc',
    'language-graphviz',
    'language-math',
    'language-smiles',
  ].some((className) => codeElement.classList.contains(className))
}

function applyArticleCodeTheme() {
  if (!articleContentRef.value) {
    return
  }

  articleContentRef.value.querySelectorAll<HTMLElement>('.article-code-container').forEach((container) => {
    container.classList.toggle('code-theme-dark', articleCodeTheme.value === 'dark')
    container.classList.toggle('code-theme-light', articleCodeTheme.value === 'light')

    const toggleButton = container.querySelector<HTMLElement>('.article-code-theme-toggle-btn')
    if (toggleButton) {
      const nextTheme = articleCodeTheme.value === 'dark' ? 'light' : 'dark'
      const toggleTitle = nextTheme === 'dark' ? '切换为夜间主题' : '切换为白天主题'
      toggleButton.innerHTML = getArticleCodeThemeIcon(nextTheme)
      toggleButton.setAttribute('title', toggleTitle)
      toggleButton.setAttribute('aria-label', toggleTitle)
    }
  })

  Vditor.highlightRender(
    {
      style: articleCodeTheme.value === 'dark' ? 'github-dark' : 'github',
    },
    articleContentRef.value,
    '/vditor'
  )
}

function decorateArticleCodeBlocks() {
  if (!articleContentRef.value) {
    return
  }

  articleContentRef.value.querySelectorAll<HTMLElement>('pre > code').forEach((codeElement) => {
    if (!isArticleCodeDecoratable(codeElement)) {
      return
    }

    const preElement = codeElement.parentElement as HTMLElement | null
    if (!preElement || preElement.parentElement?.classList.contains('article-code-container')) {
      return
    }

    const legacyCopy = preElement.previousElementSibling as HTMLElement | null
    if (legacyCopy?.classList.contains('vditor-copy')) {
      legacyCopy.remove()
    }

    const languageClass = Array.from(codeElement.classList).find((className) => className.startsWith('language-')) || ''
    const rawLanguage = languageClass.replace('language-', '')
    const languageLabel = getArticleCodeLanguageLabel(rawLanguage)
    const codeId = `article-code-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const nextTheme = articleCodeTheme.value === 'dark' ? 'light' : 'dark'
    const toggleTitle = nextTheme === 'dark' ? '切换为夜间主题' : '切换为白天主题'

    preElement.id = codeId

    const wrapper = document.createElement('div')
    wrapper.className = `article-code-container code-theme-${articleCodeTheme.value}`
    wrapper.innerHTML = `
      <div class="article-code-header">
        <div class="article-code-meta">
          <span class="article-code-lang-badge">${languageLabel}</span>
        </div>
        <div class="article-code-actions">
          <button class="article-code-theme-toggle-btn" onclick="toggleArticleCodeTheme()" title="${toggleTitle}" aria-label="${toggleTitle}">
            ${getArticleCodeThemeIcon(nextTheme)}
          </button>
          <button class="article-code-copy-btn" onclick="copyArticleCode('${codeId}', this)" title="复制代码" aria-label="复制代码">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
            <span class="article-code-copy-text">复制代码</span>
          </button>
        </div>
      </div>
    `

    preElement.insertAdjacentElement('beforebegin', wrapper)
    wrapper.appendChild(preElement)
  })
}

function toggleArticleCodeTheme() {
  articleCodeTheme.value = articleCodeTheme.value === 'dark' ? 'light' : 'dark'
}

function copyArticleCode(codeId: string, trigger?: HTMLElement | null) {
  const codeBlock = document.getElementById(codeId)
  if (!codeBlock) {
    return
  }

  const code = codeBlock.textContent || ''
  navigator.clipboard.writeText(code).then(() => {
    const copyText = trigger?.querySelector('.article-code-copy-text')
    if (copyText) {
      copyText.textContent = '已复制'
    }
    trigger?.classList.add('is-copied')

    const resetTimer = (trigger as (HTMLElement & { __copyResetTimer?: number }) | null)?.__copyResetTimer
    if (resetTimer) {
      window.clearTimeout(resetTimer)
    }

    if (trigger) {
      ;(trigger as HTMLElement & { __copyResetTimer?: number }).__copyResetTimer = window.setTimeout(() => {
        const textNode = trigger.querySelector('.article-code-copy-text')
        if (textNode) {
          textNode.textContent = '复制代码'
        }
        trigger.classList.remove('is-copied')
      }, 1600)
    }

    ElMessage.success('代码已复制')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

;(window as any).toggleArticleCodeTheme = toggleArticleCodeTheme
;(window as any).copyArticleCode = copyArticleCode

const renderArticleContent = async () => {
  if (!article.value || !articleContentRef.value) {
    return
  }

  const isDark = document.documentElement.classList.contains('dark')

  await Vditor.preview(articleContentRef.value, article.value.content || '', {
    cdn: '/vditor',
    mode: isDark ? 'dark' : 'light',
    hljs: {
      style: isDark ? 'github-dark' : 'github',
    },
    math: {
      engine: 'KaTeX',
    },
    markdown: {
      toc: true,
      codeBlockPreview: true,
      mathBlockPreview: true,
    },
    theme: {
      current: isDark ? 'dark' : 'light',
      path: '/vditor/dist/css/content-theme',
    },
  })

  decorateArticleCodeBlocks()
  applyArticleCodeTheme()
}

function getReadingProgressStorageKey(articleId: number | string) {
  return `article-reading-progress:${articleId}`
}

function collectTocItems() {
  if (!articleContentRef.value) {
    tocItems.value = []
    return
  }

  const slugCounts = new Map<string, number>()

  tocItems.value = Array.from(
    articleContentRef.value.querySelectorAll<HTMLElement>('h1, h2, h3, h4')
  ).map((heading, index) => {
    const text = (heading.textContent || '').trim() || `章节 ${index + 1}`
    const baseSlug = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || `section-${index + 1}`
    const count = (slugCounts.get(baseSlug) || 0) + 1
    slugCounts.set(baseSlug, count)

    const id = count === 1 ? `article-heading-${baseSlug}` : `article-heading-${baseSlug}-${count}`
    heading.id = id

    return {
      id,
      text,
      level: Number(heading.tagName.replace('H', '')),
    }
  })
}

function restoreSavedReadingProgress() {
  if (!article.value) {
    hasResumePosition.value = false
    savedScrollTop.value = 0
    savedReadingProgress.value = 0
    return
  }

  try {
    const raw = localStorage.getItem(getReadingProgressStorageKey(article.value.id))
    if (!raw) {
      hasResumePosition.value = false
      savedScrollTop.value = 0
      savedReadingProgress.value = 0
      return
    }

    const parsed = JSON.parse(raw) as { scrollTop?: number; progress?: number }
    savedScrollTop.value = Math.max(0, Number(parsed.scrollTop || 0))
    savedReadingProgress.value = Math.min(100, Math.max(0, Math.round(Number(parsed.progress || 0))))
    hasResumePosition.value = savedReadingProgress.value >= 6 && savedScrollTop.value > 0
  } catch (error) {
    hasResumePosition.value = false
    savedScrollTop.value = 0
    savedReadingProgress.value = 0
  }
}

function persistReadingProgress(save = true) {
  if (!article.value) {
    return
  }

  const scrollTop = Math.max(0, window.scrollY)
  const totalScrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const progress = totalScrollable > 0
    ? Math.min(100, Math.max(0, Math.round((scrollTop / totalScrollable) * 100)))
    : 0

  readingProgress.value = progress

  if (!save) {
    return
  }

  if (progress >= 98) {
    localStorage.removeItem(getReadingProgressStorageKey(article.value.id))
    hasResumePosition.value = false
    savedScrollTop.value = 0
    savedReadingProgress.value = 0
    return
  }

  const snapshot = {
    scrollTop,
    progress,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(getReadingProgressStorageKey(article.value.id), JSON.stringify(snapshot))
  savedScrollTop.value = scrollTop
  savedReadingProgress.value = progress
  hasResumePosition.value = progress >= 6 && scrollTop > 0
}

function handleReaderScroll() {
  if (scrollFrameId !== null) {
    return
  }

  scrollFrameId = window.requestAnimationFrame(() => {
    persistReadingProgress()
    scrollFrameId = null
  })
}

function resumeReading() {
  window.scrollTo({
    top: savedScrollTop.value,
    behavior: 'smooth',
  })
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

function scrollToHeading(id: string) {
  tocDrawerVisible.value = false
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

async function copyArticleLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    ElMessage.success('文章链接已复制')
  } catch (error) {
    ElMessage.error('复制链接失败')
  }
}

async function loadArticleSeries() {
  try {
    const response = await getArticles({ all: true })
    articleSeries.value = [...response.articles].sort((left, right) => (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ))
  } catch (error) {
    articleSeries.value = []
  }
}

// 使用tools.js中的formatDate函数

/**
 * 【知识点】加载文章详情：
 * 根据路由参数中的文章 ID 获取文章详情
 * 加载失败时跳转到首页
 */
const loadArticle = async () => {
  loading.value = true
  try {
    const response = await getArticleById(route.params.id)
    article.value = response
    articleSummary.value = response.summary || ''
    tocDrawerVisible.value = false
    // 获取点赞信息
    try {
      const likesResponse = await getArticleLikes(route.params.id)
      article.value.likeCount = likesResponse.likeCount
      isLiked.value = likesResponse.isLiked
    } catch (error) {
      console.error('获取点赞信息失败:', error)
      article.value.likeCount = 0
      isLiked.value = false
    }
    // 记录阅读历史
    recordReadingHistory(response)
  } catch (error) {
    ElMessage.error('加载文章失败')
    router.push('/')
  } finally {
    loading.value = false
  }
}

// 处理点赞
const handleLike = async () => {
  try {
    const response = await likeArticle(article.value.id)
    isLiked.value = response.liked
    // 更新点赞数
    try {
      const likesResponse = await getArticleLikes(article.value.id)
      article.value.likeCount = likesResponse.likeCount
    } catch (error) {
      console.error('获取点赞数失败:', error)
    }
    ElMessage.success(response.message)
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 记录阅读历史
const recordReadingHistory = (articleData) => {
  try {
    // 从localStorage获取现有阅读历史
    const existingHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]')
    
    // 检查是否已经存在相同的文章
    const existingIndex = existingHistory.findIndex(item => item.id === articleData.id)
    
    // 创建新的阅读历史记录
    const newHistoryItem = {
      id: articleData.id,
      title: articleData.title,
      author: articleData.authorName,
      readAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    
    // 如果已存在，移除旧记录
    if (existingIndex > -1) {
      existingHistory.splice(existingIndex, 1)
    }
    
    // 将新记录添加到开头
    existingHistory.unshift(newHistoryItem)
    
    // 限制阅读历史数量为20条
    if (existingHistory.length > 20) {
      existingHistory.splice(20)
    }
    
    // 保存回localStorage
    localStorage.setItem('readingHistory', JSON.stringify(existingHistory))
  } catch (error) {
    console.error('记录阅读历史失败:', error)
  }
}

/**
 * 【知识点】加载评论列表：
 * 获取当前文章的评论
 * 支持分页
 */
const loadComments = async () => {
  try {
    const response = await getComments(route.params.id, {
      page: pagination.value.page,
      limit: pagination.value.limit
    })
    comments.value = response.comments
    pagination.value.total = response.pagination.total
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

/**
 * 【知识点】提交评论：
 * 1. 验证评论内容不能为空
 * 2. 调用 API 提交评论
 * 3. 成功后清空输入框并刷新评论列表
 */
const submitComment = async () => {
  // 验证评论内容
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  submitting.value = true
  try {
    // 调用情感分析 API
    const sentimentResponse = await analyzeSentiment({
      text: newComment.value
    })
    const sentimentData = sentimentResponse.data
    
    // 提交评论
    await createComment({
      articleId: parseInt(route.params.id),
      content: newComment.value
    })
    
    ElMessage.success('评论发表成功')
    newComment.value = ''
    pagination.value.page = 1
    loadComments()
  } catch (error) {
    ElMessage.error('发表评论失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 【知识点】删除评论：
 * 使用 ElMessageBox.confirm 进行二次确认
 * 确认后调用 API 删除评论
 */
const deleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCommentApi(commentId)
    ElMessage.success('删除成功')
    loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

/**
 * 【知识点】编辑文章：
 * 跳转到文章编辑页面
 */
const editArticle = () => {
  router.push(`/edit-article/${route.params.id}`)
}

/**
 * 【知识点】删除文章：
 * 1. 二次确认
 * 2. 动态导入 API（按需加载）
 * 3. 删除成功后跳转到首页
 */
const deleteArticle = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    /**
     * 【知识点】动态导入：
     * await import('@/api/article') - 按需加载模块
     * 适用于不常用或较大的模块，减少初始加载时间
     */
    const { deleteArticle: deleteArticleApi } = await import('@/api/article')
    await deleteArticleApi(route.params.id)
    ElMessage.success('删除成功')
    router.push('/')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

/**
 * 【知识点】分页处理：
 * 页码改变时重新加载评论
 */
const handlePageChange = (page) => {
  pagination.value.page = page
  loadComments()
}

const handleSizeChange = (size) => {
  pagination.value.limit = size
  pagination.value.page = 1
  loadComments()
}

// 情感分析相关辅助函数
const getSentimentType = (sentiment) => {
  switch (sentiment) {
    case 'positive':
      return 'success'
    case 'negative':
      return 'danger'
    case 'neutral':
      return 'info'
    default:
      return 'info'
  }
}

const getSentimentText = (sentiment) => {
  switch (sentiment) {
    case 'positive':
      return '正面情感'
    case 'negative':
      return '负面情感'
    case 'neutral':
      return '中性情感'
    default:
      return '情感分析'
  }
}

// 加载评论建议
const loadCommentSuggestions = async () => {
  loadingSuggestions.value = true
  try {
    const response = await generateCommentSuggestion(route.params.id)
    commentSuggestions.value = response.data.suggestions
  } catch (error) {
    console.error('加载评论建议失败:', error)
  } finally {
    loadingSuggestions.value = false
  }
}

// 使用评论建议
const useCommentSuggestion = (suggestion) => {
  // 处理对象格式的建议（如 {comment: "..."}）
  if (typeof suggestion === 'object' && suggestion !== null) {
    newComment.value = suggestion.comment || JSON.stringify(suggestion)
  } else {
    newComment.value = suggestion
  }
}

// 生成评论回复
const generateReply = async (comment) => {
  try {
    // 添加加载状态
    comment.generatingReply = true
    
    // 1. 生成 AI 回复
    const response = await generateCommentReply({
      articleId: route.params.id,
      commentContent: comment.content
    })
    
    const aiReply = response.data.reply
    
    // 2. 保存 AI 回复到数据库
    const saveResponse = await createComment({
      articleId: parseInt(route.params.id),
      content: aiReply,
      parentId: comment.id,
      isAI: true
    })
    
    // 3. 确保评论有 replies 数组
    if (!comment.replies) {
      comment.replies = []
    }
    
    // 4. 创建 AI 回复对象
    // 后端直接返回数据，不是 response.data 格式
    const replyData = saveResponse.data || saveResponse
    const reply = {
      id: replyData.id, // 使用数据库返回的 ID
      commentId: comment.id,
      userId: 1, // 使用管理员用户 ID
      username: 'AI 助手',
      avatar: '',
      content: aiReply,
      createdAt: replyData.createdAt,
      isAI: true // 标记为 AI 回复
    }
    
    // 5. 将 AI 回复添加到评论的回复列表中
    comment.replies.push(reply)
    
    ElMessage.success('AI 回复已生成并保存')
  } catch (error) {
    console.error('生成回复失败:', error)
    ElMessage.error('生成回复失败')
  } finally {
    // 移除加载状态
    if (comment) {
      comment.generatingReply = false
    }
  }
}

// 加载相关文章
const loadRelatedArticles = async () => {
  try {
    const response = await recommendArticles(route.params.id)
    relatedArticles.value = response.recommendations || []
  } catch (error) {
    console.error('加载相关文章失败:', error)
  }
}

// 生成文章摘要
const generateArticleSummary = async () => {
  if (!article.value) return
  
  generatingSummary.value = true
  try {
    const response = await generateSummaryApi(route.params.id)
    articleSummary.value = response.data.summary || article.value.summary
    ElMessage.success('摘要生成成功')
  } catch (error) {
    ElMessage.error('摘要生成失败')
  } finally {
    generatingSummary.value = false
  }
}

// 切换回复输入框
const toggleReplyInput = (type, id, username = '') => {
  const key = `${type}_${id}`
  replyInputs.value[key] = !replyInputs.value[key]
  if (replyInputs.value[key]) {
    // 清空回复内容
    replyContent.value[key] = username ? `@${username} ` : ''
  }
}

// 提交回复
const submitReply = async (type, id) => {
  const key = `${type}_${id}`
  const content = replyContent.value[key]?.trim()
  
  if (!content) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  replying.value = true
  try {
    const parentId = id
    const response = await createComment({
      articleId: parseInt(route.params.id),
      content,
      parentId
    })
    
    // 重新加载评论
    await loadComments()
    
    // 关闭回复输入框
    replyInputs.value[key] = false
    replyContent.value[key] = ''
    
    ElMessage.success('回复成功')
  } catch (error) {
    ElMessage.error('回复失败')
  } finally {
    replying.value = false
  }
}

// 跳转到文章详情
const goToArticle = (id) => {
  router.push(`/article/${id}`)
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

async function bootstrapArticleDetail() {
  pagination.value.page = 1
  commentSuggestions.value = []
  newComment.value = ''
  readingProgress.value = 0
  hasResumePosition.value = false
  window.scrollTo({ top: 0, behavior: 'auto' })

  await Promise.allSettled([
    loadArticle(),
    loadComments(),
    loadRelatedArticles(),
    loadArticleSeries(),
  ])
}

/**
 * 【知识点】生命周期钩子：
 * 组件挂载后加载文章和评论数据
 */
onMounted(() => {
  void bootstrapArticleDetail()
  window.addEventListener('scroll', handleReaderScroll, { passive: true })
})

watch([article, loading], async ([nextArticle, nextLoading]) => {
  if (!nextArticle || nextLoading) {
    return
  }

  await nextTick()
  void renderArticleContent()
  collectTocItems()
  restoreSavedReadingProgress()
  persistReadingProgress(false)
})

watch(articleCodeTheme, (theme) => {
  localStorage.setItem('article_detail_code_theme', theme)
  nextTick(() => {
    applyArticleCodeTheme()
  })
})

watch(() => route.params.id, (nextId, previousId) => {
  if (!nextId || nextId === previousId) {
    return
  }

  void bootstrapArticleDetail()
})

onBeforeUnmount(() => {
  persistReadingProgress()
  window.removeEventListener('scroll', handleReaderScroll)
  if (scrollFrameId !== null) {
    window.cancelAnimationFrame(scrollFrameId)
    scrollFrameId = null
  }
})
</script>

<style scoped>
/**
 * 【知识点】scoped 样式特性：
 * 样式只作用于当前组件，使用 data-v-xxxxx 属性选择器隔离
 */

/**
 * 【知识点】页面容器 - article-detail 类：
 * 
 * min-height: 100vh - 最小高度为视口高度
 *   - 确保页面占满整个屏幕高度
 *   - 即使内容很少也不会出现空白
 * 
 * background: #f5f5f5 - 浅灰色背景
 *   - 与白色内容卡片形成视觉对比
 *   - 区分内容区和页面边缘
 */
.article-detail {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 252, 248, 0.85) 50%, rgba(250, 252, 248, 0.9) 100%),
    url('/images/background2.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background 0.4s ease;
}

.article-detail.dark {
  background: 
    linear-gradient(135deg, rgba(10, 14, 12, 0.95) 0%, rgba(15, 22, 19, 0.9) 50%, rgba(10, 14, 12, 0.95) 100%),
    url('/images/background2.png');
}

.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 1200;
  background: rgba(255, 255, 255, 0.2);
}

.reading-progress-fill {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #6fa899 0%, #d9bf7a 100%);
  box-shadow: 0 0 16px rgba(111, 168, 153, 0.45);
  transition: width 0.12s ease;
}

.back-button-container {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: var(--text-dark);
  transition: all var(--transition-normal);
}

.back-button:hover {
  background: var(--bg-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-button:active {
  transform: scale(0.98);
}

/**
 * 【知识点】内容容器 - container 类：
 * 
 * max-width: 1200px - 最大宽度限制
 *   - 1200px 提供更宽敞的编辑空间
 *   - 与CreateArticle保持一致
 * 
 * margin: 20px auto - 居中显示
 *   - 上下 20px，左右 auto 自动居中
 * 
 * padding: 0 20px - 左右内边距
 *   - 防止内容紧贴容器边缘
 */
.container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

/**
 * 【知识点】文章标题 - article-title 类：
 * 
 * font-size: 28px - 标题字体大小
 *   - 28px 是 h1 标题的常用大小
 *   - 比普通文字大很多，突出文章标题
 * 
 * margin: 0 0 20px 0 - 底部外边距
 *   - 上右下左：0, 0, 20px, 0
 *   - 与下方内容保持 20px 间距
 * 
 * color: var(--text-dark) - 文字颜色
 *   - 使用主题变量，支持深色模式
 *   - 长时间阅读更舒适
 */
.article-title {
  font-size: 28px;
  margin: 0 0 20px 0;
  color: var(--text-dark);
  transition: color var(--transition-normal);
}

/**
 * 【知识点】文章元信息区域 - article-meta 类：
 * 
 * display: flex - 弹性布局
 *   - 横向排列头像、作者名、时间等信息
 * 
 * align-items: center - 垂直居中
 *   - 确保所有元素在垂直方向上居中
 * 
 * gap: 12px - 元素间距
 *   - 元素之间的水平间距
 * 
 * margin-bottom: 20px - 底部外边距
 *   - 与下方内容区域分隔
 * 
 * padding-bottom: 20px - 底部内边距
 *   - 增加内容与底部边框的距离
 * 
 * border-bottom: 1px solid var(--border-light) - 底部边框
 *   - 使用主题变量，支持深色模式
 *   - 分隔元信息与正文内容
 */
.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}

/**
 * 【知识点】元信息详情区域 - meta-info 类：
 * 
 * flex: 1 - 弹性伸展
 *   - 占据剩余的所有空间
 *   - 推挤右侧元素到边缘
 */
.meta-info {
  flex: 1;
}

/**
 * 【知识点】作者名称 - author-name 类：
 * 
 * font-weight: bold - 字体加粗
 *   - 使作者名更加突出
 * 
 * color: var(--text-dark) - 深灰色文字
 *   - 使用主题变量，支持深色模式
 */
.author-name {
  font-weight: bold;
  color: var(--text-dark);
}

/**
 * 【知识点】时间信息 - meta-time 类：
 * 
 * display: flex - 弹性布局
 *   - 横向排列时间和阅读量
 * 
 * gap: 16px - 间距
 *   - 时间和阅读量之间的间距
 * 
 * font-size: 12px - 小字体
 *   - 次要信息使用较小字体
 * 
 * color: var(--text-muted) - 中灰色
 *   - 比正文颜色浅，视觉上更弱
 *   - 表达次要信息
 * 
 * margin-top: 4px - 顶部间距
 *   - 与上方作者名保持一点距离
 */
.meta-time {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/**
 * 【知识点】文章标签列表 - article-tags 类：
 * 
 * display: flex - 弹性布局
 *   - 横向排列多个标签
 * 
 * gap: 8px - 标签间距
 *   - 相邻标签之间的间距
 * 
 * margin-bottom: 20px - 底部间距
 *   - 与正文内容分隔
 * 
 * flex-wrap: wrap - 允许换行
 *   - 标签过多时自动换到下一行
 *   - 防止溢出容器
 */
.article-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

/**
 * 【知识点】文章正文内容 - article-content 类：
 * 
 * line-height: 1.8 - 行高
 *   - 1.8 表示行高是字体大小的 1.8 倍
 *   - 增加行间距，提高阅读舒适度
 *   - 适合长文本阅读
 * 
 * color: var(--text-dark) - 文字颜色
 *   - 使用主题变量，支持深色模式
 * 
 * margin-bottom: 20px - 底部间距
 *   - 与下方操作按钮分隔
 * 
 * 【注意】v-html 渲染的内容：
 *   - 由于使用 v-html 指令渲染 HTML
 *   - 默认不会应用 scoped 样式
 *   - 需要使用 :deep() 选择器穿透作用域
 */
.article-content {
  line-height: 1.8;
  color: var(--text-dark);
  margin-bottom: 20px;
}

.article-content :deep(.article-code-container) {
  --article-code-border: rgba(148, 163, 184, 0.22);
  --article-code-surface:
    linear-gradient(180deg, rgba(148, 163, 184, 0.08) 0%, rgba(148, 163, 184, 0.03) 100%),
    #ffffff;
  --article-code-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  --article-code-shadow-hover: 0 14px 32px rgba(15, 23, 42, 0.12);
  --article-code-header-bg: rgba(148, 163, 184, 0.08);
  --article-code-header-border: rgba(148, 163, 184, 0.2);
  --article-code-badge-bg: rgba(15, 23, 42, 0.06);
  --article-code-badge-color: #334155;
  --article-code-action-color: #64748b;
  --article-code-action-bg-hover: rgba(255, 255, 255, 0.72);
  --article-code-action-border-hover: rgba(148, 163, 184, 0.24);
  --article-code-action-text-hover: #1e293b;
  --article-code-block-bg: rgba(255, 255, 255, 0.24);
  --article-code-block-text: #334155;
  --article-code-scrollbar: rgba(148, 163, 184, 0.45);
  --article-code-scrollbar-hover: rgba(100, 116, 139, 0.65);
  margin: 18px 0;
  border: 1px solid var(--article-code-border);
  border-radius: 16px;
  background: var(--article-code-surface);
  overflow: hidden;
  box-shadow: var(--article-code-shadow);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.article-content :deep(.article-code-container.code-theme-dark) {
  --article-code-border: rgba(71, 85, 105, 0.55);
  --article-code-surface:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.92) 100%),
    #0f172a;
  --article-code-shadow: 0 12px 28px rgba(2, 6, 23, 0.36);
  --article-code-shadow-hover: 0 16px 36px rgba(2, 6, 23, 0.46);
  --article-code-header-bg: rgba(30, 41, 59, 0.92);
  --article-code-header-border: rgba(71, 85, 105, 0.48);
  --article-code-badge-bg: rgba(148, 163, 184, 0.12);
  --article-code-badge-color: #dbe4f0;
  --article-code-action-color: #cbd5e1;
  --article-code-action-bg-hover: rgba(148, 163, 184, 0.12);
  --article-code-action-border-hover: rgba(148, 163, 184, 0.16);
  --article-code-action-text-hover: #f8fafc;
  --article-code-block-bg: rgba(15, 23, 42, 0.24);
  --article-code-block-text: #e2e8f0;
  --article-code-scrollbar: rgba(148, 163, 184, 0.35);
  --article-code-scrollbar-hover: rgba(203, 213, 225, 0.48);
}

.article-content :deep(.article-code-container:hover) {
  box-shadow: var(--article-code-shadow-hover);
}

.article-content :deep(.article-code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--article-code-header-border);
  background: var(--article-code-header-bg);
  line-height: 1;
}

.article-content :deep(.article-code-meta) {
  display: flex;
  align-items: center;
  min-width: 0;
}

.article-content :deep(.article-code-lang-badge) {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--article-code-badge-bg);
  color: var(--article-code-badge-color);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.article-content :deep(.article-code-actions) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.article-content :deep(.article-code-theme-toggle-btn),
.article-content :deep(.article-code-copy-btn) {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--article-code-action-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.article-content :deep(.article-code-theme-toggle-btn) {
  width: 32px;
  padding: 0;
  justify-content: center;
  color: #0f172a;
}

.article-content :deep(.article-code-theme-toggle-btn svg),
.article-content :deep(.article-code-copy-btn svg) {
  width: 14px;
  height: 14px;
}

.article-content :deep(.article-code-theme-glyph) {
  display: block;
  font-size: 16px;
  line-height: 1;
  font-weight: 700;
}

.article-content :deep(.article-code-copy-text) {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.article-content :deep(.article-code-theme-toggle-btn:hover),
.article-content :deep(.article-code-copy-btn:hover) {
  border-color: var(--article-code-action-border-hover);
  background: var(--article-code-action-bg-hover);
  color: var(--article-code-action-text-hover);
  transform: translateY(-1px);
}

.article-content :deep(.article-code-copy-btn.is-copied) {
  border-color: rgba(16, 185, 129, 0.24);
  background: rgba(16, 185, 129, 0.12);
  color: #0f9f6e;
}

.article-content :deep(.article-code-container.code-theme-dark .article-code-theme-toggle-btn) {
  color: #f8fafc;
}

.article-content :deep(.article-code-container pre) {
  margin: 0 !important;
  padding: 16px 18px 18px !important;
  overflow: auto;
  max-height: min(56vh, 520px);
  background: var(--article-code-block-bg) !important;
  border-radius: 0 !important;
}

.article-content :deep(.article-code-container pre code) {
  display: block;
  min-width: max-content;
  background: transparent !important;
  color: var(--article-code-block-text);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre;
}

.article-content :deep(.article-code-container pre code.hljs) {
  background: transparent !important;
  padding: 0 !important;
}

.article-content :deep(.article-code-container pre::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

.article-content :deep(.article-code-container pre::-webkit-scrollbar-track) {
  background: transparent;
}

.article-content :deep(.article-code-container pre::-webkit-scrollbar-thumb) {
  background: var(--article-code-scrollbar);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
}

.article-content :deep(.article-code-container pre::-webkit-scrollbar-thumb:hover) {
  background: var(--article-code-scrollbar-hover);
  background-clip: padding-box;
}

.article-content :deep(.article-code-container .vditor-copy) {
  display: none !important;
}

/**
 * 【知识点】深度选择器 - :deep()：
 * 
 * 语法：父选择器 :deep(子选择器)
 * 
 * 作用：穿透 Vue 的 scoped 样式隔离
 *   - 正常情况下，scoped 样式只作用于当前组件
 *   - v-html 渲染的内容不属于当前组件
 *   - :deep() 可以让样式应用到 v-html 内容上
 * 
 * 应用场景：
 *   - 修改第三方组件的内部样式
 *   - 修改 v-html 渲染的 HTML 内容样式
 *   - 需要样式穿透的场景
 */
.article-content :deep(img) {
  max-width: 100%;  /* 图片最大宽度不超过容器 */
  height: auto;     /* 高度自动，保持比例 */
}

/**
 * 【知识点】文章操作按钮区域 - article-actions 类：
 * 
 * display: flex - 弹性布局
 *   - 横向排列多个按钮
 * 
 * gap: 12px - 按钮间距
 * 
 * padding-top: 20px - 顶部内边距
 *   - 与正文内容分隔
 * 
 * border-top: 1px solid var(--border-light) - 顶部边框
 *   - 使用主题变量，支持深色模式
 *   - 视觉上分隔操作区与内容区
 */
.article-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

/**
 * 【知识点】评论卡片 - comments-card 类：
 * 
 * margin-top: 20px - 顶部外边距
 *   - 与上方文章卡片保持间距
 */
.comments-card {
  margin-top: 20px;
}

/* 卡片样式 - 统一使用Home.vue的样式 */
.article-detail .el-card {
  background-color: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 2px 12px var(--shadow-light) !important;
  transition: all var(--transition-normal) !important;
  padding: 24px !important;
}

/* 按钮样式 - 统一使用主题色 */
.article-detail .el-button--primary {
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.article-detail .el-button--primary:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
}

.article-detail .el-button--danger {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

/* 输入框样式 */
.article-detail .el-input__wrapper {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.article-detail .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

.article-detail .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

/* 标签样式 */
.article-detail .el-tag {
  border-radius: var(--radius-sm) !important;
}

/* 骨架屏样式 */
.skeleton-card {
  padding: 24px !important;
}

.skeleton-title {
  width: 80%;
  height: 32px;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  animation: shimmer 1.5s infinite;
}

.skeleton-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-meta-info {
  flex: 1;
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.skeleton-tag {
  width: 80px;
  height: 24px;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  margin-bottom: 20px;
}

.skeleton-image {
  width: 100%;
  height: 300px;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/**
 * 【知识点】评论表单 - comment-form 类：
 * 
 * margin-bottom: 20px - 底部外边距
 *   - 与评论列表分隔
 */
.comment-form {
  margin-bottom: 20px;
}

/**
 * 【知识点】表单操作按钮区域 - form-actions 类：
 * 
 * margin-top: 12px - 顶部间距
 *   - 与输入框分隔
 * 
 * text-align: right - 文本右对齐
 *   - 按钮靠右显示
 */
.form-actions {
  margin-top: 12px;
  text-align: right;
}

.ai-actions {
  margin: 12px 0;
  display: flex;
  gap: 8px;
}

.comment-suggestions {
  margin: 16px 0;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.comment-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-actions .el-button {
  margin-left: 0;
}

/**
 * 【知识点】登录提示 - login-tip 类：
 * 
 * text-align: center - 居中对齐
 *   - 提示文字居中显示
 * 
 * padding: 20px - 内边距
 *   - 增加视觉空间
 * 
 * color: #999 - 中灰色
 *   - 表示提示性信息
 */
.login-tip {
  text-align: center;
  padding: 20px;
  color: #999;
}

/**
 * 【知识点】登录提示链接 - login-tip a 类：
 * 
 * color: #409eff - Element Plus 主色调
 *   - 蓝色，醒目且专业
 * 
 * text-decoration: none - 去除下划线
 *   - 链接默认有下划线，这里去掉
 */
.login-tip a {
  color: #409eff;
  text-decoration: none;
}

/**
 * 【知识点】评论列表容器 - comments-list 类：
 * 
 * display: flex - 弹性布局
 *   - 垂直排列评论
 * 
 * flex-direction: column - 列方向
 *   - 默认是 row（行），改为 column（列）
 * 
 * gap: 20px - 评论间距
 *   - 每条评论之间的垂直间距
 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/**
 * 【知识点】单条评论 - comment-item 类：
 * 
 * padding: 16px - 内边距
 *   - 评论内容与边框保持距离
 * 
 * background: #f9f9f9 - 浅灰背景
 *   - 比页面背景稍深，形成层次
 *   - 区分评论与正文
 * 
 * border-radius: 8px - 圆角
 *   - 使方角变圆润，更现代
 *   - 8px 是适中的圆角度数
 */
.comment-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

/**
 * 【知识点】评论头部 - comment-header 类：
 * 
 * display: flex - 弹性布局
 *   - 横向排列头像、信息、按钮
 * 
 * align-items: center - 垂直居中
 * 
 * gap: 12px - 元素间距
 * 
 * margin-bottom: 12px - 底部间距
 *   - 与评论内容分隔
 */
.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

/**
 * 【知识点】评论信息区域 - comment-info 类：
 * 
 * flex: 1 - 弹性伸展
 *   - 占据剩余空间
 *   - 推挤删除按钮到右侧
 */
.comment-info {
  flex: 1;
}

/**
 * 【知识点】评论作者 - comment-author 类：
 * 
 * font-weight: bold - 加粗
 *   - 突出评论者身份
 * 
 * color: #333 - 深灰色
 */
.comment-author {
  font-weight: bold;
  color: #333;
}

/**
 * 【知识点】评论时间 - comment-time 类：
 * 
 * font-size: 12px - 小字体
 *   - 次要信息
 * 
 * color: #999 - 中灰色
 * 
 * margin-top: 4px - 顶部间距
 */
.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/**
 * 【知识点】评论内容 - comment-content 类：
 * 
 * line-height: 1.6 - 行高
 *   - 适合段落文本阅读
 * 
 * color: #666 - 灰色
 *   - 稍浅于正文，突出层次
 */
.comment-content {
  line-height: 1.6;
  color: #666;
  margin-bottom: 8px;
}

.comment-sentiment {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.sentiment-keywords {
  font-size: 12px;
  color: #999;
}

/**
 * 【知识点】回复区域样式：
 * 左侧边框表示层级关系
 * margin-top - 与父评论间隔
 * padding-left - 缩进显示层级
 */
.replies {
  margin-top: 16px;
  padding-left: 20px;
  border-left: 2px solid #e0e0e0;
}

.reply-item {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 12px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-info {
  flex: 1;
}

.reply-author {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.reply-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.reply-content {
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

/* AI 回复样式 */
.ai-reply {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  position: relative;
}

.ai-reply::before {
  content: 'AI';
  position: absolute;
  top: -8px;
  right: 12px;
  background: #3b82f6;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.ai-reply .reply-author {
  color: #3b82f6;
}

.ai-reply .reply-content {
  color: #1e40af;
}

/* 回复输入框样式 */
.reply-input-container {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* 相关文章推荐样式 */
.related-articles-card,
.translation-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.related-articles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-article-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.related-article-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.related-article-item .article-title {
  color: #409EFF;
  font-size: 14px;
  flex: 1;
}

/* 文章摘要样式 */
.article-summary-section {
  margin: 20px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.summary-content {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  line-height: 1.8;
  color: #666;
}

/* 翻译功能样式 */
.reader-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 8px;
}

.quick-action-count {
  margin-left: 6px;
  font-size: 12px;
  color: rgba(63, 133, 118, 0.92);
}

.floating-reader-tools {
  position: fixed;
  right: 24px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1100;
}

.reader-tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 138px;
  padding: 12px 16px;
  border: 1px solid rgba(111, 168, 153, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.14);
  color: rgba(35, 38, 33, 0.9);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.reader-tool-button:hover:not(:disabled) {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.98);
}

.reader-tool-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.article-detail.dark .reader-tool-button {
  background: rgba(15, 23, 42, 0.88);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(148, 163, 184, 0.18);
}

.toc-drawer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toc-drawer-item {
  width: 100%;
  border: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(111, 168, 153, 0.08);
  color: rgba(35, 38, 33, 0.88);
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.toc-drawer-item:hover {
  background: rgba(111, 168, 153, 0.14);
  transform: translateX(-2px);
}

.toc-drawer-item.level-2 {
  padding-left: 20px;
}

.toc-drawer-item.level-3,
.toc-drawer-item.level-4 {
  padding-left: 28px;
}

.article-detail.dark .toc-drawer-item {
  background: rgba(148, 163, 184, 0.12);
  color: rgba(255, 255, 255, 0.88);
}

.translation-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.translated-content {
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  line-height: 1.8;
}

.translated-content :deep(img) {
  max-width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .floating-reader-tools {
    right: 16px;
    bottom: 20px;
  }

  .reader-tool-button {
    min-width: 122px;
    padding: 10px 14px;
  }
}
</style>
