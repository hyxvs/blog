/**
 * ============================================
 * aiService.js - AI 服务类
 * ============================================
 * 
 * 【文件概述】
 * 本文件实现了一个完整的 AI 服务类，支持多种模型：
 * 1. Ollama 本地大语言模型（如 Llama 3、Qwen 2.5、DeepSeek R1）
 * 2. DeepSeek Flash API（云端 API 调用）
 * 提供了丰富的 AI 功能，包括内容生成、内容优化、评论系统、个性化推荐等
 * 
 * 【核心知识点详解】
 * 
 * 1. LangChain 框架
 *    - 专为构建 LLM 应用程序的框架
 *    - 提供链式调用、提示模板、输出解析等核心功能
 *    - 简化与大语言模型的交互，提高代码可维护性
 *    - 支持多种模型集成，包括本地模型和云模型
 * 
 * 2. ChatOllama 集成
 *    - 与 Ollama 本地 LLM 服务器的连接
 *    - 支持本地运行大语言模型，保护数据隐私
 *    - 配置模型参数（温度、超时、生成长度等）
 *    - 支持多种本地模型，如 Llama 3、Qwen 2.5、DeepSeek R1 等
 * 
 * 3. DeepSeek API 集成
 *    - 与 DeepSeek Flash API 的连接
 *    - 支持云端模型调用，无需本地部署
 *    - 配置 API Key 和模型参数
 *    - 支持流式和非流式调用
 * 
 * 4. 提示工程（Prompt Engineering）
 *    - 设计有效的提示模板，引导模型生成高质量内容
 *    - 结构化输出格式，确保模型返回预期的数据结构
 *    - 上下文管理，提供足够的背景信息
 *    - 指令清晰明确，减少模型误解
 * 
 * 5. 链式调用（Chaining）
 *    - 提示模板 → 模型 → 输出解析器的流程
 *    - 数据流的顺序处理，确保数据正确传递
 *    - 模块化设计，便于扩展和维护
 *    - 错误处理机制，提高系统稳定性
 */

// ============================================
// 1. 导入依赖
// ============================================

/**
 * 【知识点】ChatOllama
 * LangChain 中用于与 Ollama 本地 LLM 交互的类
 * 支持多种参数配置，如模型选择、温度、生成长度等
 * 
 * 【技术细节】
 * - 底层使用 HTTP 请求与 Ollama 服务器通信
 * - 支持流式输出和批量处理
 * - 自动处理模型参数的验证和传递
 */
const { ChatOllama } = require('@langchain/ollama');

/**
 * 【知识点】PromptTemplate
 * LangChain 中的提示模板类
 * 用于创建结构化的提示，支持变量替换
 * 提高提示的可维护性和复用性
 * 
 * 【技术细节】
 * - 使用模板字符串语法，支持变量占位符
 * - 自动处理变量的注入和转义
 * - 支持复杂的提示结构和条件逻辑
 */
const { PromptTemplate } = require('@langchain/core/prompts');

/**
 * 【知识点】StringOutputParser
 * LangChain 中的输出解析器
 * 将模型输出转换为字符串格式
 * 处理模型响应的格式化
 * 
 * 【技术细节】
 * - 去除模型输出中的多余空白和换行
 * - 确保输出为纯字符串格式
 * - 为后续的 JSON 解析或直接使用做准备
 */
// StringOutputParser 用于将模型输出转换为字符串格式
// 作用：将模型生成的回复转换为字符串，方便后续处理
// 例如，将模型生成的 JSON 字符串转换为 JSON 对象
const { StringOutputParser } = require('@langchain/core/output_parsers');
// RecursiveCharacterTextSplitter 用于将文本分割为多个字符
// 作用：将长文本分割为多个字符，方便后续处理
// 例如，将一个长的评论文本分割为多个字符，每个字符作为独立的输入
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
// AgentExecutor 用于执行智能代理
// 作用：根据用户的问题和模型的上下文，调用智能代理的工具，生成回复
// 例如，根据用户的问题，调用智能代理的工具，生成回复
// 注意：这里使用的是 createToolCallingAgent 方法，而不是 createAgent 方法
// 因为 createToolCallingAgent 方法支持动态调用工具，而 createAgent 方法不支持
// 所以这里使用 createToolCallingAgent 方法
const { AgentExecutor, createToolCallingAgent } = require('@langchain/core/agents');
// DynamicTool 用于动态调用工具
// 作用：根据用户的问题，动态调用智能代理的工具，生成回复
// 例如，根据用户的问题，调用智能代理的工具，生成回复
const { DynamicTool } = require('@langchain/core/tools');
// ChatPromptTemplate 用于创建结构化的提示模板
// 作用：根据模板字符串语法，支持变量占位符
// 例如，根据模板的问题和模型的回复，生成结构化的提示
const { ChatPromptTemplate } = require('@langchain/core/prompts');
// 数据库连接
const pool = require('../config/pool');

// ============================================
// 2. DeepSeek API 客户端类
// ============================================

/**
 * DeepSeekAPIClient 类
 * 用于与 DeepSeek Flash API 进行交互
 * 支持非流式和流式调用
 */
class DeepSeekAPIClient {
  constructor(apiKey = process.env.DEEPSEEK_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.deepseek.com';
    
    // DeepSeek V4 模型配置
    // 上下文长度：1M tokens（输入+输出的总上下文窗口）
    // 输出长度：最大 384K tokens（单次生成的最大输出）
    this.modelConfig = {
      'deepseek-v4-flash': {
        contextLength: 1048576,    // 1M tokens
        maxOutputTokens: 393216,   // 384K tokens
        defaultOutputTokens: 2000
      },
      'deepseek-v4-pro': {
        contextLength: 1048576,    // 1M tokens
        maxOutputTokens: 393216,   // 384K tokens
        defaultOutputTokens: 2000
      }
    };
  }

  /**
   * 检查 API Key 是否配置
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * 非流式调用
   * @param {string} model - 模型名称
   * @param {string} prompt - 提示文本
   * @param {Object} options - 选项参数
   * @returns {Promise<string>} 模型响应
   */
  async call(model, prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('DeepSeek API Key 未配置');
    }

    const config = this.modelConfig[model] || this.modelConfig['deepseek-v4-flash'];
    const maxTokens = Math.min(
      options.maxTokens || config.defaultOutputTokens,
      config.maxOutputTokens
    );
    
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的AI助手，能够理解用户的需求并提供准确的回答。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens,
      stream: false
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody),
      timeout: options.timeout || 60000
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `DeepSeek API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 流式调用
   * @param {string} model - 模型名称
   * @param {string} prompt - 提示文本
   * @param {Object} options - 选项参数
   * @returns {AsyncGenerator<string>} 流式响应生成器
   */
  async *streamCall(model, prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('DeepSeek API Key 未配置');
    }

    const config = this.modelConfig[model] || this.modelConfig['deepseek-v4-flash'];
    const maxTokens = Math.min(
      options.maxTokens || config.defaultOutputTokens,
      config.maxOutputTokens
    );

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens,
      stream: true
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody),
      timeout: options.timeout || 60000
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `DeepSeek API 请求失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // 处理 SSE 格式
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices && data.choices[0]) {
              const content = data.choices[0].delta?.content;
              if (content) {
                yield content;
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }
}
// ChatPromptTemplate 用于创建结构化的提示模板
// 作用：根据模板字符串语法，支持变量占位符
// 例如，根据模板的问题和模型的回复，生成结构化的提示
// ============================================
// 2. AI 服务类定义
// ============================================

/**
 * AIService 类
 * 提供各种 AI 功能的服务类
 * 使用 LangChain 框架与 Ollama 模型交互
 * 
 * 【设计理念】
 * - 模块化设计：每个功能独立封装
 * - 错误处理：完善的异常捕获机制
 * - 性能优化：合理的参数设置和文本处理
 * - 可扩展性：易于添加新的 AI 功能
 */
class AIService {
  /**
   * 构造函数
   * @param {string} ollamaURL - Ollama 服务器地址
   * @param {string} sessionId - 会话ID
   * @param {number} userId - 用户ID
   * @param {string} modelType - 模型类型：'ollama' 或 'deepseek'
   * 
   * 【知识点】模型初始化
   * - baseUrl: Ollama 服务器地址，默认为 http://localhost:11434
   * - model: 使用的模型名称，支持 Ollama 本地模型和 DeepSeek API
   * - temperature: 生成文本的随机性（0-1），0.7 表示中等随机性
   * - numPredict: 最大生成 token 数，2000 个 token 约等于 1500 个中文字符
   * - timeout: 超时时间（毫秒），30000 表示 30 秒超时
   * 
   * 【技术细节】
   * - 创建 ChatOllama 实例或 DeepSeekAPIClient 实例
   * - 根据 modelType 选择使用哪种模型
   * - 支持运行时模型切换
   */
  constructor(ollamaURL = 'http://localhost:11434', sessionId = 'default', userId = null, modelType = 'ollama') {
    // 支持的模型类型
    this.supportedModels = {
      ollama: {
        name: 'Ollama 本地模型',
        description: '使用本地 Ollama 运行的模型（如 DeepSeek R1、Qwen 2.5）',
        available: true,
        modelId: null
      },
      'deepseek-v4-flash': {
        name: 'DeepSeek V4 Flash',
        description: 'DeepSeek V4 Flash - 高性能、低延迟的云端模型',
        available: false,
        modelId: 'deepseek-v4-flash'
      },
      'deepseek-v4-pro': {
        name: 'DeepSeek V4 Pro',
        description: 'DeepSeek V4 Pro - 更高质量的云端模型',
        available: false,
        modelId: 'deepseek-v4-pro'
      }
    };

    // 当前模型类型
    this.currentModelType = modelType;

    // 初始化 Ollama 模型
    const baseModelName = process.env.OLLAMA_MODEL || 'deepseek-r1:8b';
    const streamModelName = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b';
    this.ollamaModel = new ChatOllama({
      baseUrl: ollamaURL,
      model: baseModelName,
      temperature: 0.7,      // 中等随机性，平衡创造性和准确性
      numPredict: 2000,      // 最大生成 2000 个 token
      timeout: 60000,        // 60秒超时
      // 低延迟流式配置
      numCtx: 4096,          // 上下文窗口大小
      topK: 40,              // 较小的 topK，更快采样
      topP: 0.9,             // 较高的 topP，更快生成
      stop: ['</think>']     // 停止思考标记
    });

    this.ollamaStreamModel = new ChatOllama({
      baseUrl: ollamaURL,
      model: streamModelName,
      temperature: 0.7,
      numPredict: 2000,
      timeout: 60000,
      numCtx: 4096,
      topK: 40,
      topP: 0.9
    });

    // 初始化 DeepSeek API 客户端
    this.deepseekClient = new DeepSeekAPIClient();
    
    // 检查 DeepSeek API 是否配置（同时更新两个模型的可用性）
    const deepseekAvailable = this.deepseekClient.isConfigured();
    this.supportedModels['deepseek-v4-flash'].available = deepseekAvailable;
    this.supportedModels['deepseek-v4-pro'].available = deepseekAvailable;
    
    // 当前使用的 DeepSeek 模型 ID
    this.currentDeepseekModel = 'deepseek-v4-flash';

    // 初始化文本分割器
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,      // 每个块的大小
      chunkOverlap: 200,    // 块之间的重叠部分
      separators: ['\n\n', '\n', ' ', '']  // 分割符
    });
    
    // 会话ID，用于数据库存储
    this.sessionId = sessionId;
    // 用户ID，用于关联用户
    this.userId = userId;

    // 上下文类型和对应的system prompt
    this.contextPrompts = {
      article: {
        name: '📝 文章相关',
        systemPrompt: '你是一个专业的博客文章助手，专注于帮助用户解答关于文章写作、编辑、优化等方面的问题。你可以：\n1. 提供文章写作建议和技巧\n2. 帮助优化文章结构和表达\n3. 解答内容创作相关问题\n4. 提供SEO和可读性优化建议\n请用友好、专业的语气回答。'
      },
      writing: {
        name: '✍️ 写作助手',
        systemPrompt: '你是一个创意写作助手，专注于帮助用户进行各类写作任务。你可以：\n1. 帮助续写和扩展文章内容\n2. 提供写作灵感和创意建议\n3. 润色和修改文章语句\n4. 生成文章大纲和结构\n请用鼓励、支持的语气回答。'
      },
      tech: {
        name: '💻 技术问答',
        systemPrompt: '你是一个技术专家助手，专注于帮助用户解答编程、软件开发、技术概念等方面的问题。你可以：\n1. 解释技术原理和概念\n2. 提供代码示例和最佳实践\n3. 解答技术问题和建议\n4. 帮助调试和解决问题\n请用专业、清晰的语言回答。'
      },
      general: {
        name: '💬 闲聊',
        systemPrompt: '你是一个友好、智能的聊天助手，可以与用户进行自然的对话交流。你可以：\n1. 回答各种日常问题\n2. 进行友好的闲聊\n3. 提供生活建议和小贴士\n4. 与用户分享有趣的知识\n请用轻松、友好的语气回答。'
      }
    };

    // 当前上下文类型
    this.currentContext = 'general';
  }

  /**
   * 获取当前使用的模型实例
   * @returns {Object} 当前模型实例
   */
  getCurrentModel() {
    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      return this.deepseekClient;
    }
    return this.ollamaModel;
  }

  /**
   * 获取当前使用的流式模型实例
   * @returns {Object} 当前流式模型实例
   */
  getCurrentStreamModel() {
    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      return this.deepseekClient;
    }
    return this.ollamaStreamModel;
  }

  /**
   * 判断是否为 DeepSeek 模型
   * @param {string} modelType - 模型类型
   * @returns {boolean} 是否为 DeepSeek 模型
   */
  isDeepseekModel(modelType) {
    return modelType === 'deepseek-v4-flash' || modelType === 'deepseek-v4-pro';
  }

  /**
   * 获取当前 DeepSeek 模型 ID
   * @returns {string} 当前 DeepSeek 模型 ID
   */
  getCurrentDeepseekModelId() {
    const modelInfo = this.supportedModels[this.currentModelType];
    return modelInfo ? modelInfo.modelId : 'deepseek-v4-flash';
  }

  /**
   * 检查当前模型是否可用
   * @returns {boolean} 是否可用
   */
  isCurrentModelAvailable() {
    const modelInfo = this.supportedModels[this.currentModelType];
    return modelInfo ? modelInfo.available : false;
  }

  /**
   * 切换模型类型
   * @param {string} modelType - 模型类型：'ollama'、'deepseek-v4-flash' 或 'deepseek-v4-pro'
   * @returns {boolean} 是否切换成功
   */
  switchModel(modelType) {
    if (!this.supportedModels[modelType]) {
      return false;
    }
    
    if (!this.supportedModels[modelType].available) {
      return false;
    }
    
    this.currentModelType = modelType;
    
    // 如果是 DeepSeek 模型，更新当前 DeepSeek 模型 ID
    if (this.isDeepseekModel(modelType)) {
      this.currentDeepseekModel = modelType;
    }
    
    return true;
  }

  /**
   * 获取支持的模型列表
   * @returns {Array} 支持的模型列表
   */
  getSupportedModels() {
    return Object.entries(this.supportedModels).map(([key, value]) => ({
      type: key,
      ...value
    }));
  }

  /**
   * 设置当前上下文类型
   * @param {string} contextType - 上下文类型
   */
  setContext(contextType) {
    if (this.contextPrompts[contextType]) {
      this.currentContext = contextType;
      return true;
    }
    return false;
  }

  /**
   * 获取当前上下文信息
   * @returns {Object} 上下文信息
   */
  getCurrentContext() {
    return {
      type: this.currentContext,
      ...this.contextPrompts[this.currentContext]
    };
  }

  /**
   * 获取所有上下文类型
   * @returns {Array} 上下文类型列表
   */
  getAllContexts() {
    return Object.entries(this.contextPrompts).map(([key, value]) => ({
      type: key,
      ...value
    }));
  }

  /**
   * 流式聊天功能
   * @param {string} message - 用户消息
   * @param {Array} history - 对话历史
   * @param {string} contextType - 上下文类型
   * @returns {AsyncGenerator} 流式输出生成器
   */
  async *streamChat(message, history = [], contextType = 'general') {
    // 设置上下文
    this.setContext(contextType);
    const contextInfo = this.contextPrompts[contextType];

    // 格式化对话历史
    const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');

    // 构建带上下文的prompt
    const fullPrompt = 
      '【系统角色】' + contextInfo.systemPrompt + '\n\n' +
      '【对话历史】\n' + (historyText || '无') + '\n\n' +
      '【用户消息】\n' + message + '\n\n' +
      '请给出合适的回答。';

    // 强制使用 DeepSeek Flash 模型
    if (this.deepseekClient.isConfigured()) {
      const stream = this.deepseekClient.streamCall('deepseek-v4-flash', fullPrompt, {
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 60000
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
      return;
    }

    // 如果 DeepSeek 未配置，回退到 Ollama
    const model = this.getCurrentStreamModel();
    const escapedPrompt = fullPrompt.replace(/{/g, '{{').replace(/}/g, '}}');
    const prompt = PromptTemplate.fromTemplate(escapedPrompt);
    const chain = prompt.pipe(model);

    const stream = await chain.stream({});

    // 逐块返回，确保返回的是字符串
    for await (const chunk of stream) {
      // 处理不同类型的 chunk
      if (typeof chunk === 'string') {
        yield chunk;
      } else if (chunk && typeof chunk === 'object') {
        // LangChain 可能返回 {text: '...'} 或 {content: '...'}
        if (typeof chunk.text === 'string') {
          yield chunk.text;
        } else if (typeof chunk.content === 'string') {
          yield chunk.content;
        } else if (typeof chunk.toString === 'function') {
          yield chunk.toString();
        }
      }
    }
  }

  /**
   * 生成文章
   * @param {string} topic - 文章主题
   * @param {string} keywords - 关键词
   * @param {number} length - 文章长度
   * @returns {Promise<string>} 生成的文章内容
   * 
   * 【知识点】链式调用详解
   * 1. 创建提示模板：使用 PromptTemplate.fromTemplate 创建结构化提示
   * 2. 管道到模型：使用 pipe 方法将提示传递给模型
   * 3. 管道到输出解析器：将模型输出转换为字符串
   * 4. 调用链并传入参数：使用 invoke 方法执行链
   * 
   * 【技术细节】
   * - 提示模板包含角色设定、任务描述、输入参数和要求
   * - 使用 template 语法自动替换变量
   * - chain.invoke() 会返回模型生成的结果
   * - 支持异步操作，使用 async/await 处理
   */
  async generateArticle(topic, keywords, length) {
    // 获取当前模型
    const model = this.getCurrentModel();
    
    // 创建提示模板，包含指令和变量
    // 提示模板包含角色设定、任务描述、输入参数和要求
    // 任务描述：根据主题和关键词生成一篇高质量的文章
    // 要求：内容原创、结构清晰、语言流畅、有深度
    // 输入参数：主题、关键词、文章长度
    // 输出：文章内容
    // PromptTemplate.fromTemplate 创建结构化提示模板 
    // 作用：根据模板字符串创建一个可重复使用的提示模板
    const fullPrompt = 
      '你是一个专业的博客文章生成助手，能够根据主题和关键词生成高质量的文章。\n\n' +
      '请根据以下主题和关键词生成一篇约' + length + '字的博客文章：\n' +
      '主题：' + topic + '\n' +
      '关键词：' + (keywords || '无') + '\n' +
      '要求：内容原创、结构清晰、语言流畅、有深度。';

    // 判断是否为 DeepSeek API
    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      return await model.call(this.getCurrentDeepseekModelId(), fullPrompt, {
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 60000
      });
    }

    // 使用 Ollama
    const prompt = PromptTemplate.fromTemplate(fullPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // 调用链并传入参数
    // chain.invoke() 会返回模型生成的结果，转换为字符串格式
    const result = await chain.invoke({});

    return result;  // 返回生成的文章内容
  }

  /**
   * 流式生成文章
   * @param {string} topic - 文章主题
   * @param {string} keywords - 关键词
   * @param {number} length - 文章长度
   * @returns {AsyncGenerator<string>} 流式输出生成器
   */
  async *streamGenerateArticle(topic, keywords, length) {
    const model = this.getCurrentStreamModel();
    
    const fullPrompt = 
      '你是一个专业的博客文章生成助手，能够根据主题和关键词生成高质量的文章。\n\n' +
      '请根据以下主题和关键词生成一篇约' + length + '字的博客文章：\n' +
      '主题：' + topic + '\n' +
      '关键词：' + (keywords || '无') + '\n' +
      '要求：内容原创、结构清晰、语言流畅、有深度。';

    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      const stream = model.streamCall(this.getCurrentDeepseekModelId(), fullPrompt, {
        temperature: 0.7,
        maxTokens: 3000,
        timeout: 120000
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } else {
      const prompt = PromptTemplate.fromTemplate(fullPrompt);
      const chain = prompt.pipe(model);
      const stream = await chain.stream({});

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          yield chunk;
        } else if (chunk && typeof chunk === 'object') {
          if (typeof chunk.text === 'string') {
            yield chunk.text;
          } else if (typeof chunk.content === 'string') {
            yield chunk.content;
          } else if (typeof chunk.toString === 'function') {
            yield chunk.toString();
          }
        }
      }
    }
  }

  /**
   * 生成摘要
   * @param {string} content - 文章内容
   * @param {number} length - 摘要长度
   * @returns {Promise<string>} 生成的摘要
   * 
   * 【功能说明】
   * 从文章内容中提取核心信息，生成简洁的摘要
   * 保持原文的主要观点和关键信息
   * 
   * 【技术细节】
   * - 提示模板明确要求准确概括文章主要内容
   * - 限制摘要长度，确保简洁明了
   * - 使用相同的链式调用模式
   */
  async generateSummary(content, length) {
    const fullPrompt = 
      '你是一个专业的文章摘要助手，能够从文章中提取核心内容并生成简洁的摘要。\n\n' +
      '请为以下文章生成一篇约' + length + '字的摘要：\n' +
      content + '\n\n' +
      '要求：准确概括文章主要内容，语言简洁流畅。';

    // 优先使用 DeepSeek Flash 模型
    if (this.deepseekClient.isConfigured()) {
      return await this.deepseekClient.call('deepseek-v4-flash', fullPrompt, {
        temperature: 0.7,
        maxTokens: 500,
        timeout: 60000
      });
    }

    // 如果 DeepSeek 未配置，回退到 Ollama
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(fullPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({});

    return result;  // 返回生成的摘要
  }

  /**
   * 流式生成摘要
   * @param {string} content - 文章内容
   * @param {number} length - 摘要长度
   * @returns {AsyncGenerator<string>} 流式输出生成器
   */
  async *streamGenerateSummary(content, length) {
    const fullPrompt = 
      '你是一个专业的文章摘要助手，能够从文章中提取核心内容并生成简洁的摘要。\n\n' +
      '请为以下文章生成一篇约' + length + '字的摘要：\n' +
      content + '\n\n' +
      '要求：准确概括文章主要内容，语言简洁流畅。';

    // 优先使用 DeepSeek Flash 模型
    if (this.deepseekClient.isConfigured()) {
      const stream = this.deepseekClient.streamCall('deepseek-v4-flash', fullPrompt, {
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 60000
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
      return;
    }

    // 如果 DeepSeek 未配置，回退到 Ollama
    const model = this.getCurrentStreamModel();
    const prompt = PromptTemplate.fromTemplate(fullPrompt);
    const chain = prompt.pipe(model);
    const stream = await chain.stream({});

    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        yield chunk;
      } else if (chunk && typeof chunk === 'object') {
        if (typeof chunk.text === 'string') {
          yield chunk.text;
        } else if (typeof chunk.content === 'string') {
          yield chunk.content;
        } else if (typeof chunk.toString === 'function') {
          yield chunk.toString();
        }
      }
    }
  }

  /**
   * 生成回复
   * @param {string} message - 消息内容
   * @param {string} context - 上下文信息
   * @returns {Promise<string>} 生成的回复
   * 
   * 【功能说明】
   * 根据消息内容和上下文生成自然、友好的回复
   * 适用于评论回复、客服对话等场景
   * 
   * 【技术细节】
   * - 提供上下文信息，帮助模型理解对话背景
   * - 上下文为空时使用默认值'无'
   * - 要求回复自然、友好、符合语境
   */
  async generateReply(message, context) {
    // 获取当前模型
    const model = this.getCurrentModel();
    
    const fullPrompt = 
      '你是一个智能回复助手，能够根据消息内容和上下文生成友好、准确的回复。\n\n' +
      '请根据以下消息和上下文生成一个合适的回复：\n' +
      '消息：' + message + '\n' +
      '上下文：' + (context || '无') + '\n\n' +
      '要求：回复自然、友好、符合语境。';

    // 判断是否为 DeepSeek API
    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      return await model.call(this.getCurrentDeepseekModelId(), fullPrompt, {
        temperature: 0.7,
        maxTokens: 500,
        timeout: 60000
      });
    }

    // 使用 Ollama
    const prompt = PromptTemplate.fromTemplate(fullPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({});

    return result;  // 返回生成的回复
  }

  /**
   * 流式生成回复
   * @param {string} message - 消息内容
   * @param {string} context - 上下文信息
   * @returns {AsyncGenerator<string>} 流式输出生成器
   */
  async *streamGenerateReply(message, context) {
    const model = this.getCurrentStreamModel();
    
    const fullPrompt = 
      '你是一个智能回复助手，能够根据消息内容和上下文生成友好、准确的回复。\n\n' +
      '请根据以下消息和上下文生成一个合适的回复：\n' +
      '消息：' + message + '\n' +
      '上下文：' + (context || '无') + '\n\n' +
      '要求：回复自然、友好、符合语境。';

    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      const stream = model.streamCall(this.getCurrentDeepseekModelId(), fullPrompt, {
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 60000
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } else {
      const prompt = PromptTemplate.fromTemplate(fullPrompt);
      const chain = prompt.pipe(model);
      const stream = await chain.stream({});

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          yield chunk;
        } else if (chunk && typeof chunk === 'object') {
          if (typeof chunk.text === 'string') {
            yield chunk.text;
          } else if (typeof chunk.content === 'string') {
            yield chunk.content;
          } else if (typeof chunk.toString === 'function') {
            yield chunk.toString();
          }
        }
      }
    }
  }

  /**
   * 优化内容
   * @param {string} content - 内容
   * @param {string} type - 优化类型
   * @returns {Promise<string>} 优化后的内容
   * 
   * 【功能说明】
   * 根据不同类型对内容进行优化
   * 支持 SEO 优化、可读性优化、语法检查等
   * 
   * 【技术细节】
   * - 根据优化类型选择不同的提示文本
   * - 使用 switch 语句处理不同的优化类型
   * - 为每种类型提供专门的优化要求
   */
  async optimizeContent(content, type) {
    // 获取当前模型
    const model = this.getCurrentModel();
    
    let promptText = '';
    switch (type) {
      case 'seo':
        // SEO 优化：关键词密度、标题优化等
        promptText = '请优化以下文章的SEO，包括关键词密度、标题优化等，同时保持内容质量：';
        break;
      case 'readability':
        // 可读性优化：使内容更加通俗易懂
        promptText = '请优化以下文章的可读性，使其更加通俗易懂：';
        break;
      case 'grammar':
        // 语法检查：修正语法错误，优化表达
        promptText = '请检查并修正以下文章的语法错误，同时优化表达：';
        break;
      default:
        // 全面优化：内容结构、语言表达等
        promptText = '请全面优化以下文章，包括内容结构、语言表达等：';
    }

    const fullPrompt = 
      '你是一个专业的内容优化助手，能够提升文章的质量和可读性。\n\n' +
      promptText + '\n\n' +
      content;

    // 判断是否为 DeepSeek API
    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      return await model.call(this.getCurrentDeepseekModelId(), fullPrompt, {
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 60000
      });
    }

    // 使用 Ollama
    const prompt = PromptTemplate.fromTemplate(fullPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({});

    return result;  // 返回优化后的内容
  }

  /**
   * 流式优化内容
   * @param {string} content - 内容
   * @param {string} type - 优化类型
   * @returns {AsyncGenerator<string>} 流式输出生成器
   */
  async *streamOptimizeContent(content, type) {
    const model = this.getCurrentStreamModel();
    
    let promptText = '';
    switch (type) {
      case 'seo':
        promptText = '请优化以下文章的SEO，包括关键词密度、标题优化等，同时保持内容质量：';
        break;
      case 'readability':
        promptText = '请优化以下文章的可读性，使其更加通俗易懂：';
        break;
      case 'grammar':
        promptText = '请检查并修正以下文章的语法错误，同时优化表达：';
        break;
      default:
        promptText = '请全面优化以下文章，包括内容结构、语言表达等：';
    }

    const fullPrompt = 
      '你是一个专业的内容优化助手，能够提升文章的质量和可读性。\n\n' +
      promptText + '\n\n' +
      content;

    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      const stream = model.streamCall(this.getCurrentDeepseekModelId(), fullPrompt, {
        temperature: 0.7,
        maxTokens: 3000,
        timeout: 120000
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } else {
      const prompt = PromptTemplate.fromTemplate(fullPrompt);
      const chain = prompt.pipe(model);
      const stream = await chain.stream({});

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          yield chunk;
        } else if (chunk && typeof chunk === 'object') {
          if (typeof chunk.text === 'string') {
            yield chunk.text;
          } else if (typeof chunk.content === 'string') {
            yield chunk.content;
          } else if (typeof chunk.toString === 'function') {
            yield chunk.toString();
          }
        }
      }
    }
  }

  // ============================================
  // 3. 新增 AI 功能
  // ============================================

  /**
   * 生成评论回复
   * @param {string} articleTitle - 文章标题
   * @param {string} articleContent - 文章内容
   * @param {string} commentContent - 评论内容
   * @returns {Promise<string>} 生成的回复
   * 
   * 【功能说明】
   * 根据文章内容和评论内容生成友好、有见地的回复
   * 适用于博客评论系统的自动回复功能
   * 
   * 【技术细节】
   * - 截取文章内容的前 500 字符作为摘要
   * - 明确回复要求：真诚、友好、有价值、适当引用文章内容
   * - 限制回复长度在 100-200 字之间
   */
  // PromptTemplate.fromTemplate 创建结构化提示模板 作用：根据模板和参数生成提示文本
  // prompt.pipe(this.model) 将提示模板传递给模型
  // new StringOutputParser() 将模型输出转换为字符串格式
  async generateCommentReply(articleTitle, articleContent, commentContent) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个专业的博客评论回复助手。请根据文章内容和评论内容，生成一个友好、有见地的回复。\n\n' +
      '文章标题：{articleTitle}\n' +
      '文章内容摘要：{articleContent}\n' +
      '评论内容：{commentContent}\n\n' +
      '要求：\n' +
      '1. 回复要真诚、友好\n' +
      '2. 针对评论内容给出有价值的回应\n' +
      '3. 可以适当引用文章内容\n' +
      '4. 回复长度控制在100-200字'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({
      articleTitle,                                // 文章标题
      articleContent: articleContent.substring(0, 500),  // 截取内容摘要
      commentContent                               // 评论内容
    });

    return result;  // 返回生成的回复
  }

  /**
   * 推荐相关文章
   * @param {Object} currentArticle - 当前文章
   * @param {Array} allArticles - 所有文章
   * @returns {Promise<Array>} 推荐的文章ID列表
   * 
   * 【功能说明】
   * 根据当前文章内容，从文章列表中推荐最相关的文章
   * 适用于文章详情页的相关推荐功能
   * 
   * 【技术细节】
   * - 格式化文章列表为 ID:标题 的格式
   * - 截取当前文章内容的前 300 字符作为摘要
   * - 要求模型返回 JSON 数组格式的文章ID列表
   * - 添加 JSON 解析错误处理
   */
  // PromptTemplate.fromTemplate 创建结构化提示模板 作用：根据模板和参数生成提示文本
  // prompt.pipe(this.model) 将提示模板传递给模型
  // new StringOutputParser() 将模型输出转换为字符串格式
  async recommendRelatedArticles(currentArticle, allArticles) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个文章推荐助手。请根据当前文章内容，从文章列表中推荐最相关的3篇文章。\n\n' +
      '当前文章：\n标题：{currentTitle}\n内容摘要：{currentContent}\n\n' +
      '可选文章列表：\n{articlesList}\n\n' +
      '请返回推荐文章的ID列表，格式为JSON数组，例如：[1, 5, 8]。只返回JSON数组，不要有其他内容。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // 格式化文章列表为 ID:标题 的格式
    const articlesList = allArticles.map(a => `ID:${a.id} - ${a.title}`).join('\n');
    
    const result = await chain.invoke({
      currentTitle: currentArticle.title,                 // 当前文章标题
      currentContent: currentArticle.content.substring(0, 300),  // 当前文章摘要
      articlesList                                       // 文章列表
    });

    // 解析JSON输出，处理可能的解析错误
    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回空数组
      return [];
    }
  }

  /**
   * 生成评论建议
   * @param {string} articleTitle - 文章标题
   * @param {string} articleContent - 文章内容
   * @returns {Promise<Array>} 评论建议列表
   * 
   * 【功能说明】
   * 根据文章内容生成评论建议，帮助用户更好地表达观点
   * 适用于文章详情页的评论引导功能
   * 
   * 【技术细节】
   * - 截取文章内容的前 400 字符作为摘要
   * - 要求生成 3 条不同角度的评论建议
   * - 每条评论控制在 50 字以内
   * - 要求返回 JSON 数组格式
   * - 添加错误处理机制
   */
  async generateCommentSuggestion(articleTitle, articleContent) {
    const fullPrompt = 
      '你是一个专业的博客评论助手。请仔细阅读以下文章内容，并根据文章的具体内容生成有针对性的评论建议。\n\n' +
      '文章标题：' + articleTitle + '\n' +
      '文章内容摘要：' + articleContent.substring(0, 400) + '\n\n' +
      '请从以下角度生成3条具体的评论建议：\n' +
      '1. 对文章中的某个观点表示认同或补充\n' +
      '2. 提出相关问题或深入探讨\n' +
      '3. 分享个人经验或案例\n\n' +
      '要求：\n' +
      '1. 每条评论必须与文章内容紧密相关\n' +
      '2. 评论要具体、有针对性，避免泛泛而谈\n' +
      '3. 语言要自然、友好\n' +
      '4. 每条评论控制在50字以内\n' +
      '5. 返回JSON数组格式';

    // 强制使用 DeepSeek Flash 模型
    if (this.deepseekClient.isConfigured()) {
      const result = await this.deepseekClient.call('deepseek-v4-flash', fullPrompt, {
        temperature: 0.7,
        maxTokens: 500,
        timeout: 60000
      });
      
      try {
        return JSON.parse(result);
      } catch (e) {
        return ['这篇文章写得很好，学到了很多！', '观点很有见地，期待更多分享', '内容很实用，已收藏'];
      }
    }

    // 如果 DeepSeek 未配置，回退到 Ollama
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(fullPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({});

    try {
      return JSON.parse(result);
    } catch (e) {
      return ['这篇文章写得很好，学到了很多！', '观点很有见地，期待更多分享', '内容很实用，已收藏'];
    }
  }

  /**
   * 分析情感
   * @param {string} text - 文本内容
   * @returns {Promise<Object>} 情感分析结果
   * 
   * 【功能说明】
   * 分析文本的情感倾向，返回情感类型、得分和关键词
   * 适用于评论情感分析、内容审核等场景
   * 
   * 【技术细节】
   * - 要求返回 JSON 格式，包含情感类型、得分和关键词
   * - 情感类型：positive/negative/neutral
   * - 得分：0-1 之间的数值
   * - 关键词：情感相关的关键词数组
   * - 添加错误处理机制
   */
  async analyzeSentiment(text) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个情感分析助手。请分析以下文本的情感倾向。\n\n' +
      '文本内容：{text}\n\n' +
      '请返回JSON格式：{"sentiment": "positive/negative/neutral", "score": 0-1, "keywords": ["关键词1", "关键词2"]}\n' +
      '只返回JSON，不要有其他内容。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({ text });

    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回中性情感
      return { sentiment: 'neutral', score: 0.5, keywords: [] };
    }
  }

  /**
   * 内容审核
   * @param {string} text - 文本内容
   * @returns {Promise<Object>} 审核结果
   * 
   * 【功能说明】
   * 审核文本是否包含不当内容，返回审核结果
   * 适用于评论审核、内容发布前检查等场景
   * 
   * 【技术细节】
   * - 要求返回 JSON 格式，包含是否适当、原因和严重程度
   * - isAppropriate: true/false
   * - reason: 审核原因
   * - severity: low/medium/high
   * - 添加错误处理机制
   */
  /**
   * 推荐标签
   * @param {string} content - 文章内容
   * @param {Array} existingTags - 现有标签
   * @returns {Promise<Array>} 推荐的标签列表
   * 
   * 【功能说明】
   * 根据文章内容，从现有标签中推荐最合适的标签
   * 适用于文章创建和编辑时的标签选择
   * 
   * 【技术细节】
   * - 截取文章内容的前 500 字符作为分析依据
   * - 将现有标签格式化为逗号分隔的字符串
   * - 要求推荐 3-5 个最相关的标签
   * - 要求返回 JSON 数组格式
   * - 添加错误处理机制
   */
  async recommendTags(content, existingTags) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个标签推荐助手。请根据文章内容，从现有标签中推荐最合适的标签。\n\n' +
      '文章内容：{content}\n\n' +
      '现有标签：{existingTags}\n\n' +
      '请推荐3-5个最相关的标签，返回JSON数组格式，例如：["标签1", "标签2", "标签3"]。只返回JSON数组。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({
      content: content.substring(0, 500),  // 文章内容摘要
      existingTags: existingTags.join(', ')  // 现有标签列表
    });

    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回空数组
      return [];
    }
  }

  /**
   * 建议标题
   * @param {string} content - 文章内容
   * @param {string} currentTitle - 当前标题
   * @returns {Promise<Array>} 标题建议列表
   * 
   * 【功能说明】
   * 根据文章内容提供更好的标题建议
   * 适用于文章创建和编辑时的标题优化
   * 
   * 【技术细节】
   * - 截取文章内容的前 400 字符作为分析依据
   * - 考虑当前标题（如果有）
   * - 要求提供 3 个优化后的标题建议
   * - 标题要求：吸引眼球但不做标题党，准确反映内容，包含关键词
   * - 要求返回 JSON 数组格式
   * - 添加错误处理机制
   */
  async suggestTitle(content, currentTitle) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个标题优化助手。请根据文章内容，提供几个更好的标题建议。\n\n' +
      '当前标题：{currentTitle}\n' +
      '文章内容：{content}\n\n' +
      '请提供3个优化后的标题建议，要求：\n' +
      '1. 吸引眼球但不做标题党\n' +
      '2. 准确反映文章核心内容\n' +
      '3. 包含关键词\n' +
      '返回JSON数组格式。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({
      content: content.substring(0, 400),  // 文章内容摘要
      currentTitle: currentTitle || '无'    // 当前标题，默认为'无'
    });

    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回默认标题建议
      return ['优化后的标题建议1', '优化后的标题建议2', '优化后的标题建议3'];
    }
  }

  

  /**
   * 分析写作风格
   * @param {Array} articles - 文章列表
   * @returns {Promise<Object>} 写作风格分析结果
   * 
   * 【功能说明】
   * 分析用户的写作风格特点，提供改进建议
   * 适用于用户个人中心的写作分析功能
   * 
   * 【技术细节】
   * - 格式化文章列表为标题和摘要的形式
   * - 要求返回详细的写作风格分析
   * - 分析内容包括：风格描述、优点、改进建议、常见主题、易读性评分
   * - 要求返回 JSON 格式
   * - 添加错误处理机制
   */
  async analyzeWritingStyle(articles) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个写作风格分析助手。请分析以下文章集合的写作风格特点。\n\n' +
      '文章列表：\n{articles}\n\n' +
      '请分析并返回JSON格式：\n' +
      '{\n  "style": "风格描述",\n  "strengths": ["优点1", "优点2"],\n  "improvements": ["改进建议1", "改进建议2"],\n  "commonTopics": ["常见主题1", "常见主题2"],\n  "readability": "易读性评分(1-10)"\n}'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // 格式化文章列表为标题和摘要的形式
    const articlesText = articles.map(a => `标题：${a.title}\n摘要：${a.summary || a.content.substring(0, 100)}`).join('\n\n');
    
    const result = await chain.invoke({ articles: articlesText });

    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回默认分析结果
      return {
        style: '分析失败',
        strengths: [],
        improvements: [],
        commonTopics: [],
        readability: '5'
      };
    }
  }

  /**
   * 获取阅读推荐
   * @param {Array} userHistory - 用户阅读历史
   * @param {Array} allArticles - 所有文章
   * @returns {Promise<Array>} 推荐的文章ID列表
   * 
   * 【功能说明】
   * 根据用户的阅读历史，推荐相关的文章
   * 适用于个性化推荐功能
   * 
   * 【技术细节】
   * - 格式化用户阅读历史为逗号分隔的标题列表
   * - 格式化可选文章为 ID:标题 的形式
   * - 要求推荐 5 篇最相关的文章
   * - 要求返回 JSON 数组格式的文章ID列表
   * - 添加错误处理机制
   */
  async getReadingRecommendations(userHistory, allArticles) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个个性化推荐助手。请根据用户的阅读历史，推荐相关文章。\n\n' +
      '用户阅读历史：{userHistory}\n\n' +
      '可选文章：{allArticles}\n\n' +
      '请推荐5篇最相关的文章ID，返回JSON数组格式。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // 格式化用户阅读历史为逗号分隔的标题列表
    const historyText = userHistory.map(h => h.title).join(', ');
    // 格式化可选文章为 ID:标题 的形式
    const articlesText = allArticles.map(a => `ID:${a.id} - ${a.title}`).join('\n');
    
    const result = await chain.invoke({
      userHistory: historyText,  // 用户阅读历史
      allArticles: articlesText  // 可选文章列表
    });

    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回空数组
      return [];
    }
  }

  /**
   * 分析热门话题
   * @param {Array} articles - 文章列表
   * @returns {Promise<Object>} 热门话题分析结果
   * 
   * 【功能说明】
   * 分析文章列表，找出热门话题和趋势
   * 适用于首页热门话题展示功能
   * 
   * 【技术细节】
   * - 格式化文章列表为 ID:标题:标签 的形式
   * - 要求返回热门话题列表和趋势
   * - 每个话题包含名称、热度和相关文章ID
   * - 要求返回 JSON 格式
   * - 添加错误处理机制
   */
  async analyzeTrendingTopics(articles) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个话题分析助手。请分析以下文章，找出热门话题和趋势。\n\n' +
      '文章列表：\n{articles}\n\n' +
      '请返回JSON格式：\n' +
      '{{\n  "topics": [\n    {"name": "话题名称", "popularity": "热度(1-10)", "relatedArticles": [文章ID列表]}\n  ],\n  "trends": ["趋势1", "趋势2"]\n}}'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // 格式化文章列表为 ID:标题:标签 的形式
    const articlesText = articles.map(a => `ID:${a.id} 标题：${a.title} 标签：${(a.tags || []).map(t => t.name).join(',')}`).join('\n');
    
    const result = await chain.invoke({ articles: articlesText });

    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回空结果
      return { topics: [], trends: [] };
    }
  }

  /**
   * 智能搜索
   * @param {string} query - 搜索查询
   * @param {Array} articles - 文章列表
   * @returns {Promise<Array>} 搜索结果文章ID列表
   * 
   * 【功能说明】
   * 根据用户的搜索查询，从文章列表中找出最相关的结果
   * 适用于智能搜索功能
   * 
   * 【技术细节】
   * - 格式化文章列表为 ID:标题:摘要 的形式
   * - 要求返回最相关的文章ID列表（最多10个）
   * - 要求返回 JSON 数组格式
   * - 添加错误处理机制
   */
  async smartSearch(query, articles) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个智能搜索助手。请根据用户的搜索查询，从文章列表中找出最相关的结果。\n\n' +
      '搜索查询：{query}\n\n' +
      '文章列表：\n{articles}\n\n' +
      '请返回最相关的文章ID列表（最多10个），格式为JSON数组。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // 格式化文章列表为 ID:标题:摘要 的形式
    const articlesText = articles.map(a => `ID:${a.id} 标题：${a.title} 摘要：${a.summary || a.content.substring(0, 100)}`).join('\n');
    
    const result = await chain.invoke({
      query,          // 搜索查询
      articles: articlesText  // 文章列表
    });

    try {
      return JSON.parse(result);
    } catch (e) {
      // 解析失败时返回空数组
      return [];
    }
  }

  /**
   * 聊天功能
   * @param {string} message - 用户消息
   * @param {Array} history - 对话历史
   * @returns {Promise<string>} 聊天回复
   * 
   * 【功能说明】
   * 根据用户消息和对话历史生成聊天回复
   * 适用于 AI 助手聊天功能
   * 
   * 【技术细节】
   * - 格式化对话历史为 角色: 内容 的形式
   * - 提供上下文信息，保持对话连贯性
   * - 要求回复友好、专业、有帮助
   * - 对话历史为空时使用默认值'无'
   */
  async chat(message, history) {
    // 格式化对话历史为 角色: 内容 的形式
    const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');
    
    const fullPrompt = 
      '你是一个智能博客助手，可以帮助用户解答关于博客、写作、技术等方面的问题。\n\n' +
      '对话历史：' + (historyText || '无') + '\n\n' +
      '用户问题：' + message + '\n\n' +
      '请给出友好、专业、有帮助的回答。';

    // 强制使用 DeepSeek Flash 模型
    if (this.deepseekClient.isConfigured()) {
      return await this.deepseekClient.call('deepseek-v4-flash', fullPrompt, {
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 60000
      });
    }

    // 如果 DeepSeek 未配置，回退到 Ollama
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(fullPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({});

    return result;  // 返回聊天回复
  }

  /**
   * 文本分割功能
   * @param {string} text - 要分割的文本
   * @returns {Promise<Array>} 分割后的文本块
   * 
   * 【功能说明】
   * 将长文本分割成适合模型处理的块
   * 适用于处理长文章、文档等内容
   * 
   * 【技术细节】
   * - 使用 RecursiveCharacterTextSplitter 进行分割
   * - 支持自定义分割大小和重叠部分
   * - 按优先级使用不同的分割符
   */
  async splitText(text) {
    try {
      const chunks = await this.textSplitter.splitText(text);
      return chunks;
    } catch (error) {
      console.error('文本分割失败:', error);
      return [text]; // 失败时返回原文
    }
  }

  /**
   * 记忆管理功能
   * @param {string} humanMessage - 用户消息
   * @param {string} aiMessage - AI回复
   * @returns {Promise<void>}
   * 
   * 【功能说明】
   * 管理对话历史，支持多轮对话
   * 适用于聊天机器人、客服系统等场景
   * 
   * 【技术细节】
   * - 使用数据库存储对话历史
   * - 自动管理记忆的大小和内容
   * - 支持获取和清理记忆
   */


  /**
   * 获取对话历史
   * @returns {Promise<Array>} 对话历史
   */


  /**
   * 清理对话历史
   * @returns {Promise<void>}
   */


  /**
   * 文本分割功能
   * @param {string} text - 要分割的文本
   * @returns {Promise<Array>} 分割后的文本块数组
   * 
   * 【功能说明】
   * 将长文本分割成多个短文本块，便于后续处理
   * 适用于文本处理、摘要生成等场景
   * 
   * 【技术细节】
   * - 使用 RecursiveCharacterTextSplitter 进行文本分割
   * - 支持自定义分割大小和重叠部分
   * - 返回分割后的文本块数组
   */


  /**
   * 代理功能
   * @param {string} query - 用户查询
   * @param {Array} tools - 可用工具列表
   * @returns {Promise<string>} 代理执行结果
   * 
   * 【功能说明】
   * 让模型自主决策并使用工具完成复杂任务
   * 适用于需要多步骤处理的复杂问题
   * 
   * 【技术细节】
   * - 使用 ToolCallingAgent 进行工具调用
   * - 模型可以根据需要选择合适的工具
   * - 支持多轮工具调用和结果处理
   */

  /**
   * 提取关键词
   * @param {string} content - 文本内容
   * @returns {Array} 关键词列表
   * 
   * 【功能说明】
   * 从文本中提取关键词，用于文章分析、搜索和推荐
   * 
   * 【技术细节】
   * - 使用分词和停用词过滤
   * - 统计词频并返回高频词
   * - 适用于中文文本处理
   */
  extractKeywords(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    // 移除 Base64 编码的图片数据，避免处理大文本
    const cleanedContent = content
      .replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, '[图片]')
      .replace(/<img[^>]*>/gi, '[图片]')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ');

    // 如果清理后内容过长，只处理前 50000 字符
    const processingContent = cleanedContent.length > 50000
      ? cleanedContent.substring(0, 50000)
      : cleanedContent;

    const words = processingContent.split(/[\s,，。！？、；：""''（）()]+/);
    const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];

    const keywords = words
      .filter(word => word.length > 1 && word.length < 100 && !stopWords.includes(word))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * 计算相似度
   * @param {Array} keywords1 - 关键词列表1
   * @param {Array} keywords2 - 关键词列表2
   * @returns {number} 相似度分数 (0-1)
   * 
   * 【功能说明】
   * 计算两组关键词的Jaccard相似度
   * 
   * 【技术细节】
   * - 使用Jaccard相似度算法
   * - 交集大小除以并集大小
   * - 结果范围0-1，越接近1越相似
   */
  calculateSimilarity(keywords1, keywords2) {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = [...set1].filter(x => set2.has(x));
    const union = new Set([...set1, ...set2]);
    
    return intersection.length / union.size;
  }

  /**
   * 生成文章大纲
   * @param {string} topic - 文章主题
   * @param {string} keywords - 关键词
   * @returns {Promise<string>} 生成的大纲
   */
  async generateOutline(topic, keywords) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个专业的写作助手。请为以下主题生成一个详细的文章大纲。\n\n' +
      '主题：{topic}\n' +
      '关键词：{keywords}\n\n' +
      '请生成一个结构清晰、层次分明的文章大纲，包括：\n' +
      '1. 引言部分\n' +
      '2. 主要章节（3-5个）\n' +
      '3. 每个章节的子标题\n' +
      '4. 结论部分\n\n' +
      '使用Markdown格式返回大纲。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({
      topic,
      keywords: keywords || '无'
    });
    return result;
  }

  /**
   * 续写内容
   * @param {string} content - 当前内容
   * @param {number} maxLength - 最大长度
   * @returns {Promise<string>} 续写的内容
   */
  async continueWriting(content, maxLength = 500) {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个创意写作助手。请续写以下文章内容，保持相同的风格和语气。\n\n' +
      '当前内容：\n{content}\n\n' +
      '要求：\n' +
      '1. 续写内容要与原文逻辑连贯\n' +
      '2. 保持相同的写作风格\n' +
      '3. 续写内容长度约{maxLength}字\n' +
      '4. 不要重复已有的内容\n\n' +
      '请直接返回续写的内容：'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({
      content,
      maxLength
    });
    return result;
  }

  /**
   * 润色内容
   * @param {string} content - 内容
   * @param {string} style - 风格
   * @returns {Promise<string>} 润色后的内容
   */
  async polishContent(content, style = 'natural') {
    const model = this.getCurrentModel();
    const prompt = PromptTemplate.fromTemplate(
      '你是一个专业的文字编辑。请润色以下文章内容。\n\n' +
      '原文：\n{content}\n\n' +
      '润色风格：{style}\n\n' +
      '可选风格：\n' +
      '- natural: 自然流畅\n' +
      '- formal: 正式规范\n' +
      '- literary: 文学优美\n' +
      '- concise: 简洁明了\n\n' +
      '请保持原文的核心意思，只优化表达方式和句式结构。'
    );

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({
      content,
      style
    });
    return result;
  }

  /**
   * 流式续写内容
   * @param {string} content - 当前内容
   * @param {number} length - 续写长度
   * @returns {AsyncGenerator<string>} 流式输出生成器
   */
  async *streamContinueWriting(content, length) {
    const model = this.getCurrentStreamModel();
    
    const fullPrompt = 
      '你是一个创意写作助手。请续写以下文章内容，保持相同的风格和语气。\n\n' +
      '当前内容：\n' + content + '\n\n' +
      '要求：\n' +
      '1. 续写内容要与原文逻辑连贯\n' +
      '2. 保持相同的写作风格\n' +
      '3. 续写内容长度约' + length + '字\n' +
      '4. 不要重复已有的内容\n\n' +
      '请直接返回续写的内容：';

    if (this.isDeepseekModel(this.currentModelType) && this.isCurrentModelAvailable()) {
      const stream = model.streamCall(this.getCurrentDeepseekModelId(), fullPrompt, {
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 120000
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } else {
      const prompt = PromptTemplate.fromTemplate(fullPrompt);
      const chain = prompt.pipe(model);
      const stream = await chain.stream({});

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          yield chunk;
        } else if (chunk && typeof chunk === 'object') {
          if (typeof chunk.text === 'string') {
            yield chunk.text;
          } else if (typeof chunk.content === 'string') {
            yield chunk.content;
          } else if (typeof chunk.toString === 'function') {
            yield chunk.toString();
          }
        }
      }
    }
  }

  /**
   * 流式翻译内容
   * @param {string} content - 内容
   * @param {string} targetLanguage - 目标语言
   * @returns {AsyncGenerator<string>} 流式输出生成器
   */
  /**
   * SEO 优化建议
   * @param {string} content - 内容
   * @param {string} title - 标题
   * @returns {Promise<Object>} SEO 优化建议
   */
  async seoOptimization(content, title) {
    const prompt = PromptTemplate.fromTemplate(
      '你是一个SEO专家。请分析以下文章并提供SEO优化建议。\n\n' +
      '标题：{title}\n\n' +
      '内容：\n{content}\n\n' +
      '请返回JSON格式：\n' +
      '{\n' +
      '  "keywords": ["关键词1", "关键词2", "关键词3"],\n' +
      '  "metaDescription": "元描述建议",\n' +
      '  "suggestions": ["建议1", "建议2", "建议3"],\n' +
      '  "titleOptimization": "标题优化建议"\n' +
      '}\n\n' +
      '只返回JSON，不要有其他内容。'
    );

    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    const result = await chain.invoke({
      content,
      title: title || '无'
    });

    try {
      return JSON.parse(result);
    } catch (e) {
      return {
        keywords: [],
        metaDescription: '无法生成',
        suggestions: ['请稍后重试'],
        titleOptimization: '无法生成'
      };
    }
  }

  /**
   * 分析文件内容
   * @param {string} fileContent - 文件内容
   * @param {string} fileName - 文件名
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeFileContent(fileContent, fileName) {
    const prompt = PromptTemplate.fromTemplate(
      '你是一个文档分析助手。请分析以下文件内容并提供摘要和关键信息。\n\n' +
      '文件名：{fileName}\n\n' +
      '内容：\n{content}\n\n' +
      '请返回JSON格式：\n' +
      '{\n' +
      '  "summary": "文档摘要",\n' +
      '  "keyPoints": ["要点1", "要点2", "要点3"],\n' +
      '  "category": "文档类别",\n' +
      '  "suggestions": "相关建议"\n' +
      '}\n\n' +
      '只返回JSON，不要有其他内容。'
    );

    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    const result = await chain.invoke({
      content: fileContent.substring(0, 5000),
      fileName: fileName || '未知文件'
    });

    try {
      return JSON.parse(result);
    } catch (e) {
      return {
        summary: '分析失败',
        keyPoints: [],
        category: '未知',
        suggestions: '请稍后重试'
      };
    }
  }

  /**
   * 分析上传的文件
   * @param {Object} file - multer文件对象
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeUploadedFile(file) {
    const content = file.buffer.toString('utf-8');
    return this.analyzeFileContent(content, file.originalname);
  }

  async analyzeFileContentWithOptions(fileContent, fileName, options = {}) {
    const summaryStyle = ['structured', 'brief', 'deep'].includes(options.summaryStyle)
      ? options.summaryStyle
      : 'structured';
    const includeKeyPoints = options.includeKeyPoints !== false;
    const parsedMaxKeyPoints = Number(options.maxKeyPoints);
    const maxKeyPoints = Number.isFinite(parsedMaxKeyPoints)
      ? Math.min(12, Math.max(3, Math.trunc(parsedMaxKeyPoints)))
      : 5;

    const prompt = PromptTemplate.fromTemplate(
      'You are a document analyst. Review the file content and return a JSON object only.\n\n' +
      'File name: {fileName}\n' +
      'Summary style: {summaryStyle}\n' +
      'Include key points: {includeKeyPoints}\n' +
      'Maximum key points: {maxKeyPoints}\n\n' +
      'Content:\n{content}\n\n' +
      'Return JSON in this shape:\n' +
      '{\n' +
      '  "summary": "Short summary",\n' +
      '  "keyPoints": ["Point 1", "Point 2"],\n' +
      '  "category": "Document category",\n' +
      '  "suggestions": "Useful follow-up suggestions"\n' +
      '}\n\n' +
      'If key points are disabled, return an empty array for "keyPoints".'
    );

    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    const result = await chain.invoke({
      content: fileContent.substring(0, 20000),
      fileName: fileName || 'unknown-file.txt',
      summaryStyle,
      includeKeyPoints: includeKeyPoints ? 'yes' : 'no',
      maxKeyPoints
    });

    try {
      return JSON.parse(result);
    } catch (_error) {
      return {
        summary: 'Unable to analyze the document right now.',
        keyPoints: [],
        category: 'unknown',
        suggestions: 'Try again with a shorter file excerpt.'
      };
    }
  }

  /**
   * 基于图片描述生成内容
   * @param {string} imageDescription - 图片描述
   * @param {string} instruction - 指令
   * @returns {Promise<string>} 生成的内容
   */
  async generateFromImage(imageDescription, instruction) {
    const prompt = PromptTemplate.fromTemplate(
      '你是一个多模态内容生成助手。请根据以下图片描述和指令生成内容。\n\n' +
      '图片描述：\n{imageDescription}\n\n' +
      '指令：\n{instruction}\n\n' +
      '请生成符合指令要求的内容。'
    );

    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    const result = await chain.invoke({
      imageDescription,
      instruction: instruction || '描述这张图片'
    });
    return result;
  }

  /**
   * 生成封面图搜索关键词
   * @param {string} text - 文章标题和内容组合
   * @returns {Promise<string>} 搜索关键词
   *
   * 【功能说明】
   * 根据文章标题和内容，AI分析出最适合Unsplash图片搜索的关键词
   * 适用于封面图智能推荐功能
   *
   * 【技术细节】
   * - 使用AI分析文章主题和情感
   * - 生成适合图片搜索的英文关键词
   * - 关键词应该简洁、具体、具有视觉吸引力
   * - 返回单一关键词或简短的关键词组合
   */
  async generateCoverSearchQuery(text) {
    // 使用更简洁的提示词，减少处理时间
    const prompt = PromptTemplate.fromTemplate(
      '给出1-3个英文关键词用于图片搜索，主题：{text}\n\n关键词：'
    );

    // 创建临时模型实例，限制生成量
    const { ChatOllama } = require('@langchain/ollama');
    const fastModel = new ChatOllama({
      baseUrl: this.model.baseUrl,
      model: baseModelName,
      numPredict: 20,  // 只生成约20个token，大幅减少等待时间
      temperature: 0.3
    });

    const chain = prompt.pipe(fastModel).pipe(new StringOutputParser());
    const result = await chain.invoke({
      text: text.substring(0, 200)  // 只取前200字符
    });

    return result.trim().replace(/[.\n,，]/g, ' ').split(' ').filter(w => w.length > 1).slice(0, 3).join(' ');
  }

}

// ============================================
// 4. 导出模块
// ============================================

/**
 * 【知识点】CommonJS 模块导出
 * 使用 module.exports 导出 AIService 类
 * 其他文件通过 require 导入使用
 * 
 * 【技术细节】
 * - CommonJS 是 Node.js 的模块系统
 * - module.exports 用于导出模块的公共接口
 * - 其他文件使用 require('./aiService') 导入
 * - 导入后可以创建 AIService 实例并调用其方法
 */
module.exports = AIService;
