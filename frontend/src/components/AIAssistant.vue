<template>
  <div class="ai-assistant">
    <el-card shadow="hover" class="ai-card">
      <template #header>
        <div class="card-header">
          <el-icon class="icon"><ChatDotRound /></el-icon>
          <span>AI小助手</span>
          <div class="model-selector">
            <span class="model-label">模型:</span>
            <el-radio-group v-model="selectedModel" class="model-radio">
              <el-radio value="ollama" label="ollama">Ollama</el-radio>
              <el-radio value="deepseek-v4-flash" label="deepseek-v4-flash">DeepSeek Flash</el-radio>
              <el-radio value="deepseek-v4-pro" label="deepseek-v4-pro">DeepSeek Pro</el-radio>
            </el-radio-group>
          </div>
        </div>
      </template>
      
      <div class="ai-functions">
        <el-collapse v-model="activeNames">
          <el-collapse-item title="文章生成" name="1">
            <el-form :model="articleForm" label-width="80px">
              <el-form-item label="主题">
                <el-input v-model="articleForm.topic" placeholder="请输入文章主题" />
              </el-form-item>
              <el-form-item label="关键词">
                <el-input v-model="articleForm.keywords" placeholder="请输入关键词，用逗号分隔" />
              </el-form-item>
              <el-form-item label="长度">
                <el-input-number v-model="articleForm.length" :min="200" :max="2000" :step="100" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleGenerateArticle" :loading="articleLoading">
                  生成文章
                </el-button>
              </el-form-item>
            </el-form>
          </el-collapse-item>
          
          <el-collapse-item title="内容优化" name="2">
            <el-form :model="optimizeForm" label-width="80px">
              <el-form-item label="优化类型">
                <el-select v-model="optimizeForm.type">
                  <el-option label="综合优化" value="general" />
                  <el-option label="SEO优化" value="seo" />
                  <el-option label="可读性优化" value="readability" />
                  <el-option label="语法修正" value="grammar" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleOptimizeContent" :loading="optimizeLoading">
                  优化内容
                </el-button>
              </el-form-item>
            </el-form>
          </el-collapse-item>
          
          <el-collapse-item title="生成摘要" name="3">
            <el-form :model="summaryForm" label-width="80px">
              <el-form-item label="摘要长度">
                <el-input-number v-model="summaryForm.length" :min="50" :max="300" :step="50" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleGenerateSummary" :loading="summaryLoading">
                  生成摘要
                </el-button>
              </el-form-item>
            </el-form>
          </el-collapse-item>
          
          <!-- 续写功能 -->
          <el-collapse-item title="续写内容" name="4">
            <el-form :model="continueForm" label-width="80px">
              <el-form-item label="续写长度">
                <el-input-number v-model="continueForm.length" :min="100" :max="1000" :step="100" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleContinueContent" :loading="continueLoading">
                  续写内容
                </el-button>
              </el-form-item>
            </el-form>
          </el-collapse-item>
          
          <!-- 翻译功能 -->
          <el-collapse-item title="翻译文章" name="5">
            <el-form :model="translateForm" label-width="80px">
              <el-form-item label="目标语言">
                <el-select v-model="translateForm.targetLanguage">
                  <el-option label="英语" value="英语" />
                  <el-option label="日语" value="日语" />
                  <el-option label="韩语" value="韩语" />
                  <el-option label="法语" value="法语" />
                  <el-option label="德语" value="德语" />
                  <el-option label="中文" value="中文" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleTranslateContent" :loading="translateLoading">
                  翻译文章
                </el-button>
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>
      </div>
      
      <div v-if="result" class="ai-result">
        <el-divider content-position="left">生成结果</el-divider>
        <el-card shadow="always" class="result-card">
          <pre>{{ result }}</pre>
          <div class="result-actions">
            <el-button size="small" @click="copyResult">复制</el-button>
            <el-button size="small" type="primary" @click="useResult">使用</el-button>
            <el-button size="small" type="success" @click="useSummary">填充摘要</el-button>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import { ChatDotRound } from '@element-plus/icons-vue';
import * as aiApi from '../api/ai';
import { ElMessage } from 'element-plus';

const emit = defineEmits(['use-result', 'get-content', 'use-summary']);

const activeNames = ref(['1']);
const articleLoading = ref(false);
const optimizeLoading = ref(false);
const summaryLoading = ref(false);
const result = ref('');
const selectedModel = ref('ollama');

const articleForm = ref({
  topic: '',
  keywords: '',
  length: 500
});

const optimizeForm = ref({
  type: 'general'
});

const summaryForm = ref({
  length: 150
});

const continueForm = ref({
  length: 300
});

const translateForm = ref({
  targetLanguage: '英语'
});

const continueLoading = ref(false);
const translateLoading = ref(false);

const handleGenerateArticle = async () => {
  if (!articleForm.value.topic) {
    ElMessage.warning('请输入文章主题');
    return;
  }
  
  articleLoading.value = true;
  result.value = '';
  
  try {
    await aiApi.fetchStreamArticle(
      {
        topic: articleForm.value.topic,
        keywords: articleForm.value.keywords,
        length: articleForm.value.length,
        model: selectedModel.value
      },
      (chunk) => {
        result.value += chunk;
      },
      () => {
        ElMessage.success('文章生成成功');
        articleLoading.value = false;
      },
      (error) => {
        let errorMessage = '文章生成失败，请稍后重试';
        if (error.message.includes('timeout')) {
          errorMessage = '请求超时，请尝试缩短文章长度或检查网络连接';
        } else if (error.message.includes('Network Error')) {
          errorMessage = '网络错误，请检查网络连接';
        } else {
          errorMessage = error.message;
        }
        ElMessage.error(errorMessage);
        articleLoading.value = false;
      }
    );
  } catch (error) {
    ElMessage.error('文章生成失败，请稍后重试');
    articleLoading.value = false;
  }
};

const handleOptimizeContent = async () => {
  emit('get-content', async (content) => {
    if (!content) {
      ElMessage.warning('请先输入文章内容');
      return;
    }
    
    optimizeLoading.value = true;
    result.value = '';
    
    try {
      await aiApi.fetchStreamOptimize(
        {
          content,
          type: optimizeForm.value.type,
          model: selectedModel.value
        },
        (chunk) => {
          result.value += chunk;
        },
        () => {
          ElMessage.success('内容优化成功');
          optimizeLoading.value = false;
        },
        (error) => {
          let errorMessage = '内容优化失败，请稍后重试';
          if (error.message.includes('timeout')) {
            errorMessage = '请求超时，请尝试缩短内容长度或检查网络连接';
          } else if (error.message.includes('Network Error')) {
            errorMessage = '网络错误，请检查网络连接';
          } else {
            errorMessage = error.message;
          }
          ElMessage.error(errorMessage);
          optimizeLoading.value = false;
        }
      );
    } catch (error) {
      ElMessage.error('内容优化失败，请稍后重试');
      optimizeLoading.value = false;
    }
  });
};

const handleGenerateSummary = async () => {
  emit('get-content', async (content) => {
    if (!content) {
      ElMessage.warning('请先输入文章内容');
      return;
    }
    
    summaryLoading.value = true;
    result.value = '';
    
    try {
      await aiApi.fetchStreamSummary(
        {
          content,
          length: summaryForm.value.length,
          model: selectedModel.value
        },
        (chunk) => {
          result.value += chunk;
        },
        () => {
          ElMessage.success('摘要生成成功');
          summaryLoading.value = false;
        },
        (error) => {
          let errorMessage = '摘要生成失败，请稍后重试';
          if (error.message.includes('timeout')) {
            errorMessage = '请求超时，请尝试缩短内容长度或检查网络连接';
          } else if (error.message.includes('Network Error')) {
            errorMessage = '网络错误，请检查网络连接';
          } else {
            errorMessage = error.message;
          }
          ElMessage.error(errorMessage);
          summaryLoading.value = false;
        }
      );
    } catch (error) {
      ElMessage.error('摘要生成失败，请稍后重试');
      summaryLoading.value = false;
    }
  });
};

const handleContinueContent = async () => {
  emit('get-content', async (content) => {
    if (!content) {
      ElMessage.warning('请先输入文章内容');
      return;
    }
    
    continueLoading.value = true;
    result.value = '';
    
    try {
      await aiApi.fetchStreamContinue(
        {
          content,
          length: continueForm.value.length,
          model: selectedModel.value
        },
        (chunk) => {
          result.value += chunk;
        },
        () => {
          ElMessage.success('续写成功');
          continueLoading.value = false;
        },
        (error) => {
          let errorMessage = '续写失败，请稍后重试';
          if (error.message.includes('timeout')) {
            errorMessage = '请求超时，请尝试缩短续写长度或检查网络连接';
          } else if (error.message.includes('Network Error')) {
            errorMessage = '网络错误，请检查网络连接';
          } else {
            errorMessage = error.message;
          }
          ElMessage.error(errorMessage);
          continueLoading.value = false;
        }
      );
    } catch (error) {
      ElMessage.error('续写失败，请稍后重试');
      continueLoading.value = false;
    }
  });
};

const handleTranslateContent = async () => {
  emit('get-content', async (content) => {
    if (!content) {
      ElMessage.warning('请先输入文章内容');
      return;
    }
    
    translateLoading.value = true;
    result.value = '';
    
    try {
      await aiApi.fetchStreamTranslate(
        {
          content,
          targetLanguage: translateForm.value.targetLanguage,
          model: selectedModel.value
        },
        (chunk) => {
          result.value += chunk;
        },
        () => {
          ElMessage.success('翻译成功');
          translateLoading.value = false;
        },
        (error) => {
          let errorMessage = '翻译失败，请稍后重试';
          if (error.message.includes('timeout')) {
            errorMessage = '请求超时，请尝试缩短内容长度或检查网络连接';
          } else if (error.message.includes('Network Error')) {
            errorMessage = '网络错误，请检查网络连接';
          } else {
            errorMessage = error.message;
          }
          ElMessage.error(errorMessage);
          translateLoading.value = false;
        }
      );
    } catch (error) {
      ElMessage.error('翻译失败，请稍后重试');
      translateLoading.value = false;
    }
  });
};

const copyResult = () => {
  navigator.clipboard.writeText(result.value)
    .then(() => {
      ElMessage.success('复制成功');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
};

const useResult = () => {
  emit('use-result', result.value);
};

const useSummary = () => {
  emit('use-summary', result.value);
  ElMessage.success('摘要已填充到输入框');
};
</script>

<style scoped>
.ai-assistant {
  width: 100%;
}

/* 卡片样式 - 统一使用Home.vue的样式 */
.ai-card {
  margin-bottom: 20px;
  background-color: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 2px 12px var(--shadow-light) !important;
  transition: all var(--transition-normal) !important;
  padding: 24px !important;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: bold;
  color: var(--text-dark);
  transition: color var(--transition-normal);
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: normal;
}

.model-radio {
  display: flex;
  gap: 16px;
}

.icon {
  color: var(--mint-green);
  font-size: 18px;
  transition: color var(--transition-fast);
}

.ai-functions {
  margin-bottom: 20px;
}

.ai-result {
  margin-top: 20px;
}

.result-card {
  margin-top: 10px;
  background-color: var(--bg-card) !important;
  border-radius: var(--radius-md) !important;
  box-shadow: 0 2px 8px var(--shadow-light) !important;
  transition: all var(--transition-normal) !important;
  padding: 16px !important;
}

.result-card pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 16px;
  background: var(--bg-main);
  border-radius: var(--radius-md);
  max-height: 300px;
  overflow-y: auto;
  color: var(--text-main);
  border: 1px solid var(--border-light);
  transition: all var(--transition-normal);
}

.result-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 按钮样式 - 统一使用主题色 */
.ai-assistant .el-button {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.ai-assistant .el-button--primary {
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  color: white !important;
}

.ai-assistant .el-button--primary:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
}

/* 输入框样式 */
.ai-assistant .el-input__wrapper {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.ai-assistant .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

.ai-assistant .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--mint-green) inset !important;
}

/* 选择器样式 */
.ai-assistant .el-select .el-input__wrapper {
  border-radius: var(--radius-md) !important;
}

/* 数字输入框样式 */
.ai-assistant .el-input-number {
  border-radius: var(--radius-md) !important;
}

/* 折叠面板样式 */
.ai-assistant .el-collapse {
  border: none !important;
  background: transparent !important;
}

.ai-assistant .el-collapse-item__header {
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.ai-assistant .el-collapse-item__header:hover {
  color: var(--mint-green) !important;
}
</style>
