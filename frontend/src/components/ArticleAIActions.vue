<template>
  <div class="article-ai-actions">
    <!-- AI摘要卡片 -->
    <el-card v-if="aiSummary" class="ai-summary-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>AI文章摘要</span>
        </div>
      </template>
      <p class="summary-text">{{ aiSummary }}</p>
    </el-card>

    <!-- 相关文章推荐 -->
    <el-card v-if="relatedArticles.length > 0" class="related-articles-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Link /></el-icon>
          <span>相关文章推荐</span>
        </div>
      </template>
      <div class="related-list">
        <div
          v-for="article in relatedArticles"
          :key="article.id"
          class="related-item"
          @click="goToArticle(article.id)"
        >
          <el-icon><Document /></el-icon>
          <span class="related-title">{{ article.title }}</span>
        </div>
      </div>
    </el-card>

    <!-- 评论AI助手 -->
    <el-card v-if="userStore.isLoggedIn" class="comment-ai-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI评论助手</span>
        </div>
      </template>
      
      <!-- 评论建议 -->
      <div v-if="commentSuggestions.length > 0" class="suggestions-section">
        <p class="section-title">评论灵感：</p>
        <div class="suggestion-chips">
          <el-tag
            v-for="(suggestion, index) in commentSuggestions"
            :key="index"
            class="suggestion-tag"
            effect="plain"
            @click="useSuggestion(suggestion)"
          >
            {{ suggestion }}
          </el-tag>
        </div>
      </div>

      <!-- AI回复生成 -->
      <div v-if="selectedComment" class="reply-section">
        <el-divider />
        <p class="section-title">为这条评论生成回复：</p>
        <p class="selected-comment">{{ selectedComment.content }}</p>
        <el-button
          type="primary"
          size="small"
          :loading="generatingReply"
          @click="generateAIReply"
        >
          生成AI回复
        </el-button>
        <div v-if="aiReply" class="ai-reply">
          <p>{{ aiReply }}</p>
          <el-button size="small" @click="useAIReply">使用此回复</el-button>
        </div>
      </div>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { Document, Link, ChatDotRound } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  generateSummary,
  recommendRelatedArticles,
  generateCommentSuggestion,
  generateCommentReply
} from '@/api/ai';

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  comments: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['use-suggestion', 'use-reply']);

const router = useRouter();
const userStore = useUserStore();

const aiSummary = ref('');
const relatedArticles = ref([]);
const commentSuggestions = ref([]);
const selectedComment = ref(null);
const aiReply = ref('');
const generatingReply = ref(false);

onMounted(async () => {
  await loadAISummary();
  await loadRelatedArticles();
  await loadCommentSuggestions();
});

const loadAISummary = async () => {
  try {
    const response = await generateSummary({
      content: props.article.content,
      length: 150
    });
    aiSummary.value = response.data.summary;
  } catch (error) {
    console.error('生成AI摘要失败:', error);
  }
};

const loadRelatedArticles = async () => {
  try {
    const response = await recommendRelatedArticles(props.article.id);
    relatedArticles.value = response.data.recommendations || [];
  } catch (error) {
    console.error('加载相关文章失败:', error);
  }
};

const loadCommentSuggestions = async () => {
  try {
    const response = await generateCommentSuggestion(props.article.id);
    commentSuggestions.value = response.data.suggestions || [];
  } catch (error) {
    console.error('加载评论建议失败:', error);
  }
};

const goToArticle = (id) => {
  router.push(`/article/${id}`);
};

const useSuggestion = (suggestion) => {
  emit('use-suggestion', suggestion);
};

const selectCommentForReply = (comment) => {
  selectedComment.value = comment;
  aiReply.value = '';
};

const generateAIReply = async () => {
  if (!selectedComment.value) return;
  
  generatingReply.value = true;
  try {
    const response = await generateCommentReply({
      articleId: props.article.id,
      commentContent: selectedComment.value.content
    });
    aiReply.value = response.data.reply;
  } catch (error) {
    ElMessage.error('生成回复失败');
  } finally {
    generatingReply.value = false;
  }
};

const useAIReply = () => {
  emit('use-reply', aiReply.value);
  aiReply.value = '';
  selectedComment.value = null;
};

// 暴露方法给父组件
defineExpose({
  selectCommentForReply
});
</script>

<style scoped>
.article-ai-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.ai-summary-card .summary-text {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.related-item:hover {
  background: #f0f0f0;
}

.related-title {
  color: #409EFF;
  font-size: 14px;
}

.suggestions-section {
  margin-bottom: 15px;
}

.section-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-tag {
  cursor: pointer;
}

.selected-comment {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
}

.ai-reply {
  margin-top: 15px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.ai-reply p {
  margin: 0 0 10px 0;
  color: #333;
}
</style>
