<template>
  <div class="ai-chat-assistant">
    <el-button
      class="chat-toggle-btn"
      type="primary"
      circle
      size="large"
      @click="toggleChat"
    >
      <el-icon v-if="!isOpen"><ChatDotRound /></el-icon>
      <el-icon v-else><Close /></el-icon>
    </el-button>

    <el-card v-if="isOpen" class="chat-window" shadow="always" :style="{ width: chatWindowWidth + 'px', height: chatWindowHeight + 'px' }">
      <div class="resize-handle resize-handle-n" @mousedown.prevent="(e) => startResize(e, 'n')"></div>
      <div class="resize-handle resize-handle-s" @mousedown.prevent="(e) => startResize(e, 's')"></div>
      <div class="resize-handle resize-handle-e" @mousedown.prevent="(e) => startResize(e, 'e')"></div>
      <div class="resize-handle resize-handle-w" @mousedown.prevent="(e) => startResize(e, 'w')"></div>
      <div class="resize-handle resize-handle-ne" @mousedown.prevent="(e) => startResize(e, 'ne')"></div>
      <div class="resize-handle resize-handle-nw" @mousedown.prevent="(e) => startResize(e, 'nw')"></div>
      <div class="resize-handle resize-handle-se" @mousedown.prevent="(e) => startResize(e, 'se')"></div>
      <div class="resize-handle resize-handle-sw" @mousedown.prevent="(e) => startResize(e, 'sw')"></div>
      <template #header>
        <div class="chat-header">
          <div class="header-title">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI助手</span>
          </div>
          <div class="header-actions">
            <el-dropdown @command="switchContext" trigger="click">
              <span class="context-selector">
                {{ currentContextInfo && currentContextInfo.name || '💬 闲聊' }}
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="ctx in contexts"
                    :key="ctx.type"
                    :command="ctx.type"
                    :selected="currentContext === ctx.type"
                  >
                    {{ ctx.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div class="model-switch">
              <el-radio-group v-model="selectedModel" class="model-radio-group">
                <el-radio value="ollama" size="small">Ollama</el-radio>
                <el-radio value="deepseek-v4-flash" size="small">Flash</el-radio>
                <el-radio value="deepseek-v4-pro" size="small">Pro</el-radio>
              </el-radio-group>
            </div>
            <el-button type="link" @click="createNewChat" title="新建对话">
              <el-icon><Plus /></el-icon>
            </el-button>
            <el-button type="link" @click="clearChat" title="清空对话">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <div class="quick-actions" v-if="messages.length <= 1">
        <el-tag
          v-for="action in quickActions"
          :key="action.type"
          class="quick-action-tag"
          @click="handleQuickAction(action)"
        >
          {{ action.icon }} {{ action.label }}
        </el-tag>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          v-show="!(msg.role === 'assistant' && msg.streaming && !msg.content.trim() && isWaitingForFirstChunk)"
          :class="['message', msg.role]"
        >
          <el-avatar
            :size="32"
            :icon="msg.role === 'user' ? UserFilled : ChatDotRound"
            :class="msg.role"
          />
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div class="message-footer">
              <div class="message-time">
                {{ formatTime(msg.time) }}
                <span v-if="msg.streaming" class="streaming-indicator">
                  <span class="dot"></span> AI正在输入...
                </span>
              </div>
              <div class="message-actions">
                <el-button
                  v-if="msg.role === 'assistant' && !msg.streaming"
                  type="link"
                  size="small"
                  @click="copyMessage(msg.content)"
                  title="复制文本"
                >
                  复制
                </el-button>
                <el-button
                  v-if="msg.role === 'assistant' && !msg.streaming"
                  type="link"
                  size="small"
                  @click="retryMessage(index)"
                  title="重新生成"
                >
                  重试
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading && isWaitingForFirstChunk" class="message assistant">
          <el-avatar :size="32" :icon="ChatDotRound" class="assistant" />
          <div class="message-content">
            <div class="thinking-indicator">
              <div class="thinking-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="thinking-text">{{ thinkingState }}</span>
            </div>
          </div>
        </div>


      </div>

      <div class="input-area">
        <div class="file-preview" v-if="uploadedFile">
          <el-tag closable @close="removeFile">
            {{ uploadedFile.name }}
          </el-tag>
        </div>

        <div class="input-row">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="2"
            :placeholder="inputPlaceholder"
            @keydown.enter.exact.prevent="sendMessage()"
            @input="adjustTextareaHeight"
            ref="textareaRef"
          />
        </div>

        <div class="input-actions">
          <div class="left-actions">
            <el-tooltip content="上传文件分析" placement="top">
              <el-button text @click="triggerFileInput" :disabled="loading">
                <el-icon><Upload /></el-icon>
              </el-button>
            </el-tooltip>
            <input
              type="file"
              ref="fileInputRef"
              @change="handleFileChange"
              accept=".txt,.md,.json,.js,.ts,.py,.html,.css,.xml"
              style="display: none"
            />
          </div>
          <span class="hint">Ctrl + Enter 发送</span>
          <el-button
            type="primary"
            :loading="loading"
            @click="sendMessage()"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch, reactive } from 'vue';
import { ChatDotRound, Close, Delete, UserFilled, Plus, Upload, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { fetchStreamChat, getContexts } from '@/api/ai';
import type { ChatContext } from '@/api/ai';
import { useThemeStore } from '@/stores/theme';
import Vditor from 'vditor';

interface ChatMessage {
  role: string
  content: string
  time: string
  streaming?: boolean
}

type CodeThemeMode = 'dark' | 'light'

const isOpen = ref(false);
const inputMessage = ref('');
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const streamingContent = ref('');
const isWaitingForFirstChunk = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadedFile = ref<File | null>(null);
const themeStore = useThemeStore();
const codeTheme = ref<CodeThemeMode>(
  localStorage.getItem('ai_chat_code_theme') === 'light'
    ? 'light'
    : localStorage.getItem('ai_chat_code_theme') === 'dark'
      ? 'dark'
      : themeStore.isDarkMode
        ? 'dark'
        : 'light'
);

const contexts = ref<ChatContext[]>([]);
const currentContext = ref('general');
const selectedModel = ref('ollama');
let codeHighlightTimer: number | null = null;

const currentContextInfo = computed(() => {
  return contexts.value.find(c => c.type === currentContext.value);
});

const inputPlaceholder = computed(() => {
  if (uploadedFile.value) {
    return `已选择文件: ${uploadedFile.value.name}\n输入你的问题...`;
  }
  return '输入你的问题...\n或使用快捷操作';
});

const thinkingStates = [
  '🤔 正在理解您的问题...',
  '📚 正在检索知识库...',
  '🧠 正在分析内容...',
  '✍️ 正在组织回复...',
  '✨ 正在润色答案...'
];

const thinkingState = ref(thinkingStates[0]);
let thinkingInterval: ReturnType<typeof setInterval> | null = null;

const quickActions = [
  { type: 'outline', label: '帮我写大纲', icon: '📋' },
  { type: 'continue', label: '续写段落', icon: '✍️' },
  { type: 'polish', label: '润色文章', icon: '✨' },
  { type: 'seo', label: 'SEO优化', icon: '🔍' }
];

const sessionId = ref(localStorage.getItem('aiSessionId') || generateSessionId());

const chatWindowWidth = ref(800);
const chatWindowHeight = ref(600);
const isResizing = ref(false);
const resizeDirection = ref('');
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const resizeStartWidth = ref(0);
const resizeStartHeight = ref(0);

function startResize(event: MouseEvent, direction: string) {
  isResizing.value = true;
  resizeDirection.value = direction;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  resizeStartWidth.value = chatWindowWidth.value;
  resizeStartHeight.value = chatWindowHeight.value;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = direction.includes('e') || direction.includes('w') ? 'ew-resize' : 'ns-resize';
  document.body.style.userSelect = 'none';
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return;

  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;
  const direction = resizeDirection.value;

  if (direction.includes('e')) {
    chatWindowWidth.value = Math.max(400, Math.min(1200, resizeStartWidth.value + deltaX));
  }
  if (direction.includes('w')) {
    const newWidth = Math.max(400, Math.min(1200, resizeStartWidth.value - deltaX));
    if (newWidth !== chatWindowWidth.value) {
      chatWindowWidth.value = newWidth;
    }
  }
  if (direction.includes('s')) {
    chatWindowHeight.value = Math.max(400, Math.min(800, resizeStartHeight.value + deltaY));
  }
  if (direction.includes('n')) {
    const newHeight = Math.max(400, Math.min(800, resizeStartHeight.value - deltaY));
    if (newHeight !== chatWindowHeight.value) {
      chatWindowHeight.value = newHeight;
    }
  }
}

function stopResize() {
  isResizing.value = false;
  resizeDirection.value = '';
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

function splitIntoDisplayUnits(content: string): string[] {
  if (!content) {
    return [];
  }

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(content), item => item.segment);
  }

  return Array.from(content);
}

function normalizeStoredMessages(rawMessages: unknown): ChatMessage[] {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .filter((item): item is Partial<ChatMessage> & { role: string } => {
      return !!item && typeof item === 'object' && typeof item.role === 'string';
    })
    .map((item) => ({
      role: item.role,
      content: typeof item.content === 'string' ? item.content : '',
      time: typeof item.time === 'string' ? item.time : new Date().toISOString()
    }))
    .filter((item) => item.role === 'assistant' || item.content.trim().length > 0);
}

function generateSessionId() {
  const id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('aiSessionId', id);
  return id;
}

function normalizeCodeLanguage(rawLang: string) {
  const cleaned = rawLang.trim().toLowerCase().replace(/\s+/g, '');
  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    c: 'c',
    'c++': 'cpp',
    cpp: 'cpp',
    'c#': 'csharp',
    cs: 'csharp',
    md: 'markdown',
    yml: 'yaml',
    txt: 'plaintext',
    text: 'plaintext',
    plain: 'plaintext',
    vue3: 'vue',
  };

  return aliases[cleaned] || cleaned.replace(/[^a-z0-9_-]/g, '') || 'plaintext';
}

function getCodeLanguageLabel(rawLang: string) {
  const cleaned = rawLang.trim().toLowerCase().replace(/\s+/g, '');
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
    shell: 'Bash',
    zsh: 'Bash',
    python: 'Python',
    py: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    'c++': 'C++',
    csharp: 'C#',
    'c#': 'C#',
    go: 'Go',
    rust: 'Rust',
    sql: 'SQL',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    markdown: 'Markdown',
    md: 'Markdown',
    plaintext: 'Text',
    text: 'Text',
  };

  if (labels[cleaned]) {
    return labels[cleaned];
  }

  const normalized = normalizeCodeLanguage(cleaned);
  if (labels[normalized]) {
    return labels[normalized];
  }

  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Code';
}

function getCodeThemeIcon(theme: CodeThemeMode) {
  if (theme === 'dark') {
    return '<span class="code-theme-glyph" aria-hidden="true">☾</span>';
  }

  return '<span class="code-theme-glyph" aria-hidden="true">☀</span>';
}

function scheduleCodeHighlight() {
  if (codeHighlightTimer !== null) {
    window.clearTimeout(codeHighlightTimer);
  }

  codeHighlightTimer = window.setTimeout(() => {
    codeHighlightTimer = null;

    if (!messagesContainer.value) {
      return;
    }

    Vditor.highlightRender(
      {
        style: codeTheme.value === 'dark' ? 'github-dark' : 'github',
      },
      messagesContainer.value,
      '/vditor'
    );
  }, 80);
}

function renderCodeBlock(rawLang: string, code: string) {
  const normalizedLanguage = normalizeCodeLanguage(rawLang);
  const languageLabel = getCodeLanguageLabel(rawLang || normalizedLanguage);
  const trimmedCode = code.trimEnd();
  const codeId = `code-block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const nextTheme = codeTheme.value === 'dark' ? 'light' : 'dark';
  const toggleTitle = nextTheme === 'dark' ? '切换为夜间主题' : '切换为白天主题';

  return `
<div class="code-container code-theme-${codeTheme.value}">
  <div class="code-header">
    <div class="code-meta">
      <span class="code-lang-badge">${languageLabel}</span>
    </div>
    <div class="code-actions">
      <button class="code-theme-toggle-btn" onclick="toggleCodeTheme()" title="${toggleTitle}" aria-label="${toggleTitle}">
        ${getCodeThemeIcon(nextTheme)}
      </button>
      <button class="code-copy-btn" onclick="copyCodeBlock('${codeId}', this)" title="复制代码" aria-label="复制代码">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
        </svg>
        <span class="code-copy-text">复制代码</span>
      </button>
    </div>
  </div>
  <pre id="${codeId}" class="code-block" data-lang="${normalizedLanguage}"><code class="language-${normalizedLanguage}">${trimmedCode}</code></pre>
</div>
  `.trim();
}

function createNewChat() {
  sessionId.value = generateSessionId();
  messages.value = [{
    role: 'assistant',
    content: getWelcomeMessage(),
    time: new Date().toISOString()
  }];
  localStorage.removeItem('ai_chat_history');
  ElMessage.success('已创建新对话');
}

function getWelcomeMessage() {
  const contextInfo = currentContextInfo.value;
  if (contextInfo) {
    return `你好！我是你的AI助手，当前模式：${contextInfo.name}\n\n有什么我可以帮你的吗？`;
  }
  return '你好！我是你的AI助手，可以帮助你：\n\n• 解答博客相关问题\n• 提供写作建议\n• 回答技术问题\n• 协助内容创作\n\n有什么我可以帮你的吗？';
}

function copyCodeBlock(codeId: string, trigger?: HTMLElement | null) {
  const codeBlock = document.getElementById(codeId);
  if (codeBlock) {
    const code = codeBlock.textContent || '';
    navigator.clipboard.writeText(code).then(() => {
      const copyText = trigger?.querySelector('.code-copy-text');
      if (copyText) {
        copyText.textContent = '已复制';
      }
      trigger?.classList.add('is-copied');

      const resetTimer = (trigger as (HTMLElement & { __copyResetTimer?: number }) | null)?.__copyResetTimer;
      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }
      if (trigger) {
        (trigger as HTMLElement & { __copyResetTimer?: number }).__copyResetTimer = window.setTimeout(() => {
          const textNode = trigger.querySelector('.code-copy-text');
          if (textNode) {
            textNode.textContent = '复制代码';
          }
          trigger.classList.remove('is-copied');
        }, 1600);
      }
      ElMessage.success('代码已复制');
    }).catch(() => {
      ElMessage.error('复制失败');
    });
  }
}

// 将复制函数暴露到全局
;(window as any).copyCodeBlock = copyCodeBlock;

function toggleCodeTheme() {
  codeTheme.value = codeTheme.value === 'dark' ? 'light' : 'dark';
}

// 将主题切换函数暴露到全局
;(window as any).toggleCodeTheme = toggleCodeTheme;

async function loadContexts() {
  try {
    const response = await getContexts();
    if (response.data?.contexts) {
      contexts.value = response.data.contexts;
    }
  } catch (error) {
    contexts.value = [
      { type: 'article', name: '📝 文章相关', systemPrompt: '' },
      { type: 'writing', name: '✍️ 写作助手', systemPrompt: '' },
      { type: 'tech', name: '💻 技术问答', systemPrompt: '' },
      { type: 'general', name: '💬 闲聊', systemPrompt: '' }
    ];
  }
}

function switchContext(contextType: string) {
  currentContext.value = contextType;
  const ctx = contexts.value.find(c => c.type === contextType);
  ElMessage.success(`已切换到${ctx?.name || contextType}模式`);
}

onMounted(() => {
  loadContexts();

  const saved = localStorage.getItem('ai_chat_history');
  if (saved) {
    try {
      messages.value = normalizeStoredMessages(JSON.parse(saved));
    } catch (e) {
      console.error('加载聊天记录失败');
    }
  }

  if (messages.value.length === 0) {
    messages.value.push({
      role: 'assistant',
      content: getWelcomeMessage(),
      time: new Date().toISOString()
    });
  }
});

watch(currentContext, () => {
  if (messages.value.length === 1 && messages.value[0].role === 'assistant') {
    messages.value[0].content = getWelcomeMessage();
  }
});

watch(codeTheme, (theme) => {
  localStorage.setItem('ai_chat_code_theme', theme);
  if (isOpen.value) {
    nextTick(() => {
      scheduleCodeHighlight();
    });
  }
});

watch(
  () => themeStore.isDarkMode,
  () => {
    if (isOpen.value) {
      nextTick(() => {
        scheduleCodeHighlight();
      });
    }
  }
);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      scrollToBottom();
      scheduleCodeHighlight();
    });
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatMessage = (content: unknown) => {
  if (!content || typeof content !== 'string') return '';

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  let result = escapeHtml(content);

  // 移除思考内容标签（deepseek-r1 等模型的思考过程）
  result = result.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // 如果只剩下空白，重新显示原内容
  if (!result.trim()) {
    result = escapeHtml(content).replace(/<think>[\s\S]*?<\/think>/gi, '');
  }

  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 先处理三反引号代码块（优先）
  result = result.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (match, lang, code) => renderCodeBlock(lang, code));

  // 处理单反引号包裹的多行代码（非标准格式，但模型可能输出）
  result = result.replace(/`([^\n`]*)\n([\s\S]*?)`/g, (match, lang, code) => renderCodeBlock(lang, code));

  // 处理单行代码
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  result = result.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  result = result.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  result = result.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  result = result.replace(/^\- (.*$)/gm, '<li>$1</li>');
  result = result.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  result = result.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');

  result = result.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  result = result.replace(/\n/g, '<br>');

  return result;
};

const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
    ElMessage.success('复制成功');
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败，请手动复制');
  }
};

const retryMessage = async (index: number) => {
  if (index > 0 && messages.value[index - 1].role === 'user') {
    const userMessage = messages.value[index - 1].content;
    messages.value.splice(index, 1);
    await sendMessage(userMessage, true);
  }
};

const handleQuickAction = async (action: { type: string; label: string }) => {
  if (action.type === 'outline') {
    inputMessage.value = '请帮我生成一篇关于【主题】的文章大纲';
    ElMessage.info('请修改主题后发送，或直接发送以生成示例大纲');
  } else if (action.type === 'continue') {
    inputMessage.value = '请帮我续写以下内容：\n\n[请在此粘贴你要续写的内容]';
    ElMessage.info('请粘贴要续写的内容');
  } else if (action.type === 'polish') {
    inputMessage.value = '请帮我润色以下文章：\n\n[请在此粘贴文章内容]';
    ElMessage.info('请粘贴要润色的文章');
  } else if (action.type === 'seo') {
    inputMessage.value = '请分析以下文章的SEO优化建议：\n\n[文章标题]\n[文章内容]';
    ElMessage.info('请提供文章标题和内容');
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    uploadedFile.value = file;
    ElMessage.success(`已选择文件: ${file.name}`);
  }
};

const removeFile = () => {
  uploadedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const adjustTextareaHeight = () => {
  if (!textareaRef.value) return;
  
  // Element Plus 的 el-input 组件需要通过 $el 获取底层 DOM
  const textarea = textareaRef.value.$el?.querySelector('textarea');
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
};

const sendMessage = async (messageText?: string | Event, isRetry = false) => {
  const directMessage = typeof messageText === 'string' ? messageText.trim() : '';
  const message = directMessage || inputMessage.value.trim();
  if (!message || loading.value) return;

  if (uploadedFile.value) {
    const fileContent = await uploadedFile.value.text();
    const fullMessage = `${message}\n\n[附件内容]:\n${fileContent}`;
    messages.value.push({
      role: 'user',
      content: `${message}\n\n[附件: ${uploadedFile.value.name}]`,
      time: new Date().toISOString()
    });
    inputMessage.value = '';
    removeFile();
    await streamMessage(fullMessage);
  } else {
    messages.value.push({
      role: 'user',
      content: message,
      time: new Date().toISOString()
    });
    inputMessage.value = '';
    await streamMessage(message);
  }

  nextTick(() => {
    scrollToBottom();
  });
};

const streamMessage = async (message: string) => {
  loading.value = true;
  isWaitingForFirstChunk.value = true;
  thinkingState.value = thinkingStates[0];

  thinkingInterval = setInterval(() => {
    const index = Math.floor(Math.random() * thinkingStates.length);
    thinkingState.value = thinkingStates[index];
  }, 2000);

  try {
    const userHistory = messages.value
      .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.content.includes('[附件:')))
      .filter(m => typeof m.content === 'string')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const responseMessage = reactive<ChatMessage>({
      role: 'assistant' as const,
      content: '',
      time: new Date().toISOString(),
      streaming: true
    });
    const pendingCharacters: string[] = [];
    let streamDrainTimer: number | null = null;
    let streamCompleted = false;
    let streamFinalized = false;
    const streamState = { resolve: undefined as (() => void) | undefined };
    const streamCompletion = new Promise<void>((resolve) => {
      streamState.resolve = resolve;
    });

    const stopDrain = () => {
      if (streamDrainTimer !== null) {
        window.clearTimeout(streamDrainTimer);
        streamDrainTimer = null;
      }
    };

    const finalizeStream = () => {
      if (streamFinalized) {
        return;
      }

      streamFinalized = true;
      stopDrain();
      responseMessage.streaming = false;
      isWaitingForFirstChunk.value = false;
      localStorage.setItem('ai_chat_history', JSON.stringify(normalizeStoredMessages(messages.value)));
      nextTick(() => {
        scheduleCodeHighlight();
      });
      if (streamState.resolve) {
        streamState.resolve();
      }
    };

    const drainCharacters = () => {
      if (streamDrainTimer !== null || streamFinalized) {
        return;
      }

      const flushNextCharacter = () => {
        if (pendingCharacters.length === 0) {
          streamDrainTimer = null;

          if (streamCompleted) {
            finalizeStream();
          }
          return;
        }

        responseMessage.content += pendingCharacters.shift() || '';
        scrollToBottom();
        streamDrainTimer = window.setTimeout(flushNextCharacter, 0);
      };

      flushNextCharacter();
    };
    messages.value.push(responseMessage);

    await fetchStreamChat(
      {
        message,
        history: userHistory,
        sessionId: sessionId.value,
        contextType: currentContext.value,
        model: selectedModel.value
      },
      (chunk) => {
        isWaitingForFirstChunk.value = false;
        responseMessage.content += chunk;
        scrollToBottom();
      },
      () => {
        streamCompleted = true;

        if (pendingCharacters.length === 0 && streamDrainTimer === null) {
          finalizeStream();
        }
      },
      (error) => {
        console.error('Stream error:', error);
        stopDrain();
        pendingCharacters.length = 0;
        responseMessage.content += '\n\n[抱歉，发生了错误，请稍后重试]';
        responseMessage.streaming = false;
        isWaitingForFirstChunk.value = false;
        ElMessage.error('AI回复出错');
      }
    );

    if (!streamCompleted && !streamFinalized) {
      if (streamState.resolve) {
        streamState.resolve();
      }
    }

    await streamCompletion;
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error('发送消息失败');
  } finally {
    loading.value = false;
    isWaitingForFirstChunk.value = false;
    if (thinkingInterval) {
      clearInterval(thinkingInterval);
      thinkingInterval = null;
    }
    nextTick(() => {
      scrollToBottom();
    });
  }
};

const clearChat = () => {
  messages.value = [{
    role: 'assistant',
    content: getWelcomeMessage(),
    time: new Date().toISOString()
  }];
  localStorage.removeItem('ai_chat_history');
};
</script>

<style scoped>
.ai-chat-assistant {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.chat-toggle-btn {
  width: 56px;
  height: 56px;
  font-size: 24px;
  box-shadow: 0 4px 12px var(--shadow-medium);
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  transition: all var(--transition-fast) !important;
}

.chat-toggle-btn:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
  transform: scale(1.05) !important;
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 800px;
  height: 600px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 4px 20px var(--shadow-medium) !important;
  background-color: var(--bg-card) !important;
  transition: none !important;
}

.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-handle-n,
.resize-handle-s {
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: ns-resize;
}

.resize-handle-e,
.resize-handle-w {
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}

.resize-handle-n {
  top: 0;
  border-radius: 0 0 4px 4px;
}

.resize-handle-s {
  bottom: 0;
  border-radius: 4px 4px 0 0;
}

.resize-handle-e {
  right: 0;
  border-radius: 4px 0 0 4px;
}

.resize-handle-w {
  left: 0;
  border-radius: 0 4px 4px 0;
}

.resize-handle-ne,
.resize-handle-nw,
.resize-handle-se,
.resize-handle-sw {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.resize-handle-ne {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.resize-handle-nw {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.resize-handle-se {
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}

.resize-handle-sw {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}

.resize-handle:hover {
  background: var(--mint-green);
  opacity: 0.6;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-dark);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: var(--text-dark);
}

.header-title .el-icon {
  color: var(--mint-green);
}

.context-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-main);
  background: var(--bg-hover);
  transition: all var(--transition-fast);
}

.context-selector:hover {
  background: var(--bg-main);
  color: var(--mint-green);
}

.model-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
}

.model-radio-group {
  display: flex;
  gap: 4px;
}

.model-radio-group .el-radio {
  font-size: 11px;
  padding: 2px 4px;
}

.model-radio-group .el-radio__label {
  padding-left: 4px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-light);
}

.quick-action-tag {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-action-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px var(--shadow-light);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: var(--bg-main);
  min-height: 300px;
  max-height: 400px;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message.assistant {
  flex-direction: row;
}

.message.user {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  color: var(--text-main);
  transition: all var(--transition-normal);
}

.message.user .message-content {
  background: var(--mint-green);
  border-color: var(--mint-green);
  color: white;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin: 8px 0;
  color: var(--text-dark);
}

.message-text :deep(code) {
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: 13px;
  color: var(--mint-green-dark);
}

.message.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.message-text :deep(.code-container) {
  --code-border: rgba(148, 163, 184, 0.22);
  --code-surface:
    linear-gradient(180deg, rgba(148, 163, 184, 0.08) 0%, rgba(148, 163, 184, 0.03) 100%),
    #ffffff;
  --code-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  --code-shadow-hover: 0 14px 32px rgba(15, 23, 42, 0.12);
  --code-header-bg: rgba(148, 163, 184, 0.08);
  --code-header-border: rgba(148, 163, 184, 0.2);
  --code-badge-bg: rgba(15, 23, 42, 0.06);
  --code-badge-color: #334155;
  --code-action-color: #64748b;
  --code-action-bg-hover: rgba(255, 255, 255, 0.7);
  --code-action-border-hover: rgba(148, 163, 184, 0.24);
  --code-action-text-hover: #1e293b;
  --code-block-bg: transparent;
  --code-block-text: #334155;
  --code-scrollbar: rgba(148, 163, 184, 0.45);
  --code-scrollbar-hover: rgba(100, 116, 139, 0.65);
  margin: 14px 0 10px;
  border: 1px solid var(--code-border);
  border-radius: 16px;
  background: var(--code-surface);
  overflow: hidden;
  box-shadow: var(--code-shadow);
  max-width: 100%;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.message-text :deep(.code-container.code-theme-dark) {
  --code-border: rgba(71, 85, 105, 0.55);
  --code-surface:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.92) 100%),
    #0f172a;
  --code-shadow: 0 12px 28px rgba(2, 6, 23, 0.36);
  --code-shadow-hover: 0 16px 36px rgba(2, 6, 23, 0.46);
  --code-header-bg: rgba(30, 41, 59, 0.92);
  --code-header-border: rgba(71, 85, 105, 0.48);
  --code-badge-bg: rgba(148, 163, 184, 0.12);
  --code-badge-color: #dbe4f0;
  --code-action-color: #cbd5e1;
  --code-action-bg-hover: rgba(148, 163, 184, 0.12);
  --code-action-border-hover: rgba(148, 163, 184, 0.16);
  --code-action-text-hover: #f8fafc;
  --code-block-bg: rgba(15, 23, 42, 0.24);
  --code-block-text: #e2e8f0;
  --code-scrollbar: rgba(148, 163, 184, 0.35);
  --code-scrollbar-hover: rgba(203, 213, 225, 0.48);
}

.message-text :deep(.code-container.code-theme-light) {
  --code-block-bg: rgba(255, 255, 255, 0.26);
}

.message-text :deep(.code-container:hover) {
  box-shadow: var(--code-shadow-hover);
}

.message-text :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--code-header-border);
  background: var(--code-header-bg);
  line-height: 1;
}

.message-text :deep(.code-meta) {
  display: flex;
  align-items: center;
  min-width: 0;
}

.message-text :deep(.code-lang-badge) {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--code-badge-bg);
  color: var(--code-badge-color);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.message-text :deep(.code-actions) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.message-text :deep(.code-theme-toggle-btn),
.message-text :deep(.code-copy-btn) {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--code-action-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.message-text :deep(.code-theme-toggle-btn) {
  width: 32px;
  padding: 0;
  justify-content: center;
  color: #0f172a;
}

.message-text :deep(.code-theme-toggle-btn svg),
.message-text :deep(.code-copy-btn svg) {
  width: 14px;
  height: 14px;
}

.message-text :deep(.code-theme-glyph) {
  display: block;
  font-size: 16px;
  line-height: 1;
  font-weight: 700;
}

.message-text :deep(.code-copy-text) {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.message-text :deep(.code-theme-toggle-btn:hover),
.message-text :deep(.code-copy-btn:hover) {
  border-color: var(--code-action-border-hover);
  background: var(--code-action-bg-hover);
  color: var(--code-action-text-hover);
  transform: translateY(-1px);
}

.message-text :deep(.code-copy-btn.is-copied) {
  border-color: rgba(16, 185, 129, 0.24);
  background: rgba(16, 185, 129, 0.12);
  color: #0f9f6e;
}

.message-text :deep(.code-container.code-theme-dark .code-theme-toggle-btn) {
  color: #f8fafc;
}

.message-text :deep(.code-block) {
  margin: 0;
  padding: 16px 18px 18px;
  overflow: auto;
  max-height: min(56vh, 480px);
  background: var(--code-block-bg);
}

.message-text :deep(.code-block code) {
  display: block;
  min-width: max-content;
  background: transparent;
  padding: 0;
  color: var(--code-block-text);
  font-size: 13px;
  line-height: 1.7;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  white-space: pre;
}

.message-text :deep(.code-block code.hljs) {
  background: transparent;
  padding: 0;
}

.message-text :deep(.code-block::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

.message-text :deep(.code-block::-webkit-scrollbar-track) {
  background: transparent;
}

.message-text :deep(.code-block::-webkit-scrollbar-thumb) {
  background: var(--code-scrollbar);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
}

.message-text :deep(.code-block::-webkit-scrollbar-thumb:hover) {
  background: var(--code-scrollbar-hover);
  background-clip: padding-box;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message-text :deep(a) {
  color: var(--mint-green);
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.message.user .message-footer {
  flex-direction: row-reverse;
}

.message-time {
  font-size: 11px;
  color: var(--text-light);
}

.message.user .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-actions {
  display: flex;
  gap: 4px;
}

.message .el-button--text {
  font-size: 11px;
  padding: 0 4px;
  color: var(--text-light);
  transition: color var(--transition-fast);
}

.message.user .el-button--text {
  color: rgba(255, 255, 255, 0.7);
}

.message .el-button--text:hover {
  color: var(--mint-green);
}

.message.user .el-button--text:hover {
  color: white;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  background: var(--text-light);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.thinking-dots span:nth-child(1) { animation-delay: 0s; }
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.thinking-text {
  font-size: 12px;
  color: var(--text-light);
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--mint-green);
}

.streaming-indicator .dot {
  width: 6px;
  height: 6px;
  background: var(--mint-green);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.streaming-text {
  min-height: 20px;
}

.input-area {
  padding: 16px;
  border-top: 1px solid var(--border-light);
  background-color: var(--bg-card);
}

.file-preview {
  margin-bottom: 8px;
}

.input-row {
  margin-bottom: 8px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-actions {
  display: flex;
  gap: 4px;
}

.hint {
  font-size: 0;
  color: var(--text-light);
}

.hint::before {
  content: 'Enter \53D1\9001\FF0C Shift + Enter \6362\884C';
  font-size: 12px;
}

.input-actions .el-button--primary {
  background-color: var(--mint-green) !important;
  border-color: var(--mint-green) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.input-actions .el-button--primary:hover {
  background-color: var(--mint-green-dark) !important;
  border-color: var(--mint-green-dark) !important;
}

.input-area :deep(.el-textarea__inner) {
  border-radius: var(--radius-md) !important;
  resize: none;
}

@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 40px) !important;
    height: calc(100vh - 120px) !important;
    right: -70px;
  }
}
</style>
