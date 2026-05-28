<template>
  <article 
    class="article-card"
    :data-article-id="article.id"
    :class="[`delay-${(index % 3) + 1}`, { 'no-image': !article.coverImage }]"
    :style="cardStyle"
  >
    <!-- 文章头部 -->
    <div class="article-header">
      <div class="author-info">
        <img 
          :src="article.authorAvatar || '/src/assets/default-avatar.svg'" 
          class="author-avatar" 
          alt="avatar"
          loading="lazy"
        />
        <span class="author-name">{{ article.author_name || '片刻' }}</span>
        <span class="post-time">{{ formatDate(article.createdAt) }}</span>
      </div>
    </div>

    <!-- 文章标题 -->
    <h2 class="article-title" @click="goToArticle(article.id)">
      {{ article.title }}
    </h2>

    <!-- 文章摘要 -->
    <p class="article-summary">{{ truncateText(article.summary, 100) }}</p>

    <!-- 文章图片 -->
    <div v-if="article.coverImage" class="article-image" @click="goToArticle(article.id)">
      <div class="image-placeholder"></div>
      <img 
        :src="article.coverImage" 
        :alt="article.title" 
        loading="lazy"
        class="lazy-image"
        @load="handleImageLoad"
      />
    </div>

    <!-- 文章底部 -->
    <div class="article-footer">
      <div class="article-meta">
        <span class="views">
          <el-icon><View /></el-icon>
          {{ article.viewCount || 0 }}
        </span>
        <span class="comments">
          <el-icon><ChatDotRound /></el-icon>
          {{ article.commentCount || 0 }}
        </span>
        <span class="likes" @click="handleLike(article)">
          <el-icon :class="{ 'liked': article.isLiked }">
            <Star v-if="!article.isLiked" />
            <StarFilled v-else />
          </el-icon>
          {{ article.likeCount || 0 }}
        </span>
      </div>
      <button class="read-btn" @click="goToArticle(article.id)">
        阅览
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">  
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate, truncateText } from '@/utils/tools'
import { View, ChatDotRound, Star, StarFilled } from '@element-plus/icons-vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['like'])

const router = useRouter()

const cardStyle = computed(() => {
  return {
    animationDelay: `${props.index * 0.1}s`
  }
})

const goToArticle = (id) => {
  router.push(`/article/${id}`).then(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

const handleLike = (article) => {
  emit('like', article)
}

const handleImageLoad = (e) => {
  e.target.classList.add('loaded')
}
</script>

<style scoped>
.article-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 2px 12px var(--shadow-light);
  transition: all var(--transition-normal);
  animation: slideUp 0.5s ease forwards;
  opacity: 0;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--shadow-medium);
}

.article-header {
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 600;
  color: var(--text-dark);
}

.post-time {
  font-size: 13px;
  color: var(--text-light);
}

.article-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 12px;
  cursor: pointer;
  transition: color var(--transition-fast);
  line-height: 1.4;
}

.article-title:hover {
  color: var(--mint-green);
}

.article-summary {
  font-size: 15px;
  color: var(--text-main);
  line-height: 1.8;
  margin-bottom: 16px;
}

.article-image {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 16px;
  cursor: pointer;
  position: relative;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  z-index: 1;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal), opacity 0.5s ease;
  position: relative;
  z-index: 2;
  opacity: 0;
}

.lazy-image.loaded {
  opacity: 1;
}

.article-image:hover .lazy-image {
  transform: scale(1.05);
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.article-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text-light);
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.read-btn {
  padding: 8px 24px;
  background: var(--mint-green);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.read-btn:hover {
  background: var(--mint-green-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-medium);
}

/* 动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

/* 无图片的文章卡片 */
.article-card.no-image {
  padding-bottom: 20px;
}

.article-card.no-image .article-footer {
  margin-top: 16px;
}
</style>
