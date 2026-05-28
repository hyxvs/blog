const AIService = require('../utils/aiService');
const pool = require('../config/pool');

// 创建一个函数来获取或创建AI服务实例
function getAIService(modelType = 'ollama') {
  return new AIService(process.env.OLLAMA_URL || 'http://localhost:11434', 'default', null, modelType);
}

function normalizeMessageInput(message) {
  return typeof message === 'string' ? message.trim() : '';
}

// 简单的关键词提取函数（作为AI调用的后备方案）
function extractSimpleKeywords(text) {
  if (!text) return 'technology blog';

  // 移除常见停用词
  const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '这个', '那个', '什么', '如何', '怎么', '为什么', '可以', '应该', '需要', '能够', '正在', '已经', '将会', '可能', '但是', '而且', '或者', '如果', '因为', '所以', '虽然', '然后', '还是', '只是', '只有', '就是', '这样', '那样', '如何', '怎么'];

  // 中英文分词
  const chineseWords = text.match(/[\u4e00-\u9fa5]+/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];

  // 合并并过滤
  const allWords = [...chineseWords, ...englishWords.map(w => w.toLowerCase())];

  // 过滤停用词和短词
  const filteredWords = allWords.filter(word =>
    word.length > 1 && !stopWords.includes(word)
  );

  // 提取前3个最有意义的词
  const keywords = filteredWords.slice(0, 3);

  // 如果有英文词，返回英文组合；否则返回中文或默认
  const englishKeywords = englishWords.slice(0, 2).map(w => w.toLowerCase());

  if (englishKeywords.length > 0) {
    return englishKeywords.join(' ');
  }

  return keywords.join(' ') || 'technology blog';
}

function normalizeChatHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      role: typeof item.role === 'string' ? item.role : 'user',
      content: typeof item.content === 'string' ? item.content : ''
    }))
    .filter(item => item.content);
}

function splitStreamContent(content) {
  if (typeof content !== 'string' || !content) {
    return [];
  }

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(content), item => item.segment);
  }

  return Array.from(content);
}

function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  // 尝试多种刷新方式
  if (typeof res.flush === 'function') {
    res.flush();
  } else if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  } else if (res.socket && typeof res.socket.flush === 'function') {
    res.socket.flush();
  }
}

async function generateArticle(req, res) {
  try {
    const { topic, keywords, length = 500, model = 'ollama' } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: '主题不能为空' });
    }
    
    const aiService = getAIService(model);
    const article = await aiService.generateArticle(topic, keywords, length);
    
    res.json({
      success: true,
      data: {
        article,
        topic,
        keywords,
        length: article.length,
        model: aiService.currentModelType
      }
    });
  } catch (error) {
    console.error('生成文章失败:', error);
    res.status(500).json({ error: error.message || '生成文章失败，请稍后重试' });
  }
}

async function streamGenerateArticle(req, res) {
  try {
    const { topic, keywords, length = 500, model = 'ollama' } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: '主题不能为空' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const aiService = getAIService(model);
    const stream = aiService.streamGenerateArticle(topic, keywords, length);
    
    for await (const chunk of stream) {
      writeSse(res, { content: chunk, model: aiService.currentModelType });
    }
    
    writeSse(res, { done: true, model: aiService.currentModelType });
    res.end();
  } catch (error) {
    console.error('流式生成文章失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || '生成文章失败，请稍后重试' });
    }
  }
}

async function generateSummary(req, res) {
  try {
    const { content, length = 150, model = 'ollama' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '文章内容不能为空' });
    }
    
    const aiService = getAIService(model);
    const summary = await aiService.generateSummary(content, length);
    
    res.json({
      success: true,
      data: {
        summary,
        length: summary.length,
        model: aiService.currentModelType
      }
    });
  } catch (error) {
    console.error('生成摘要失败:', error);
    res.status(500).json({ error: error.message || '生成摘要失败，请稍后重试' });
  }
}

async function generateReply(req, res) {
  try {
    const { message, context = '', model = 'ollama' } = req.body;
    const normalizedMessage = normalizeMessageInput(message);
    
    if (!normalizedMessage) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }
    
    const aiService = getAIService(model);
    const reply = await aiService.generateReply(normalizedMessage, context);
    
    res.json({
      success: true,
      data: {
        reply,
        model: aiService.currentModelType
      }
    });
  } catch (error) {
    console.error('生成回复失败:', error);
    res.status(500).json({ error: error.message || '生成回复失败，请稍后重试' });
  }
}

async function optimizeContent(req, res) {
  try {
    const { content, type = 'general', model = 'ollama' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '文章内容不能为空' });
    }
    
    const aiService = getAIService(model);
    const optimizedContent = await aiService.optimizeContent(content, type);
    
    res.json({
      success: true,
      data: {
        optimizedContent,
        type,
        model: aiService.currentModelType
      }
    });
  } catch (error) {
    console.error('优化内容失败:', error);
    res.status(500).json({ error: error.message || '优化内容失败，请稍后重试' });
  }
}

async function streamGenerateSummary(req, res) {
  try {
    const { content, length = 150, model = 'ollama' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '文章内容不能为空' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const aiService = getAIService(model);
    const stream = aiService.streamGenerateSummary(content, length);
    
    for await (const chunk of stream) {
      writeSse(res, { content: chunk, model: aiService.currentModelType });
    }
    
    writeSse(res, { done: true, model: aiService.currentModelType });
    res.end();
  } catch (error) {
    console.error('流式生成摘要失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || '生成摘要失败，请稍后重试' });
    }
  }
}

async function streamGenerateReply(req, res) {
  try {
    const { message, context = '', model = 'ollama' } = req.body;
    const normalizedMessage = normalizeMessageInput(message);
    
    if (!normalizedMessage) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const aiService = getAIService(model);
    const stream = aiService.streamGenerateReply(normalizedMessage, context);
    
    for await (const chunk of stream) {
      writeSse(res, { content: chunk, model: aiService.currentModelType });
    }
    
    writeSse(res, { done: true, model: aiService.currentModelType });
    res.end();
  } catch (error) {
    console.error('流式生成回复失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || '生成回复失败，请稍后重试' });
    }
  }
}

async function streamOptimizeContent(req, res) {
  try {
    const { content, type = 'general', model = 'ollama' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '文章内容不能为空' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const aiService = getAIService(model);
    const stream = aiService.streamOptimizeContent(content, type);
    
    for await (const chunk of stream) {
      writeSse(res, { content: chunk, model: aiService.currentModelType });
    }
    
    writeSse(res, { done: true, model: aiService.currentModelType });
    res.end();
  } catch (error) {
    console.error('流式优化内容失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || '优化内容失败，请稍后重试' });
    }
  }
}

// ==================== 新增AI功能控制器 ====================

async function generateCommentReply(req, res) {
  try {
    const { articleId, commentContent, model = 'ollama' } = req.body;
    
    if (!articleId || !commentContent) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    // 获取文章信息
    const articleResult = await pool.query(
      'SELECT title, content FROM articles WHERE id = $1',
      [articleId]
    );
    
    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    const aiService = getAIService(model);
    const article = articleResult.rows[0];
    const reply = await aiService.generateCommentReply(
      article.title,
      article.content,
      commentContent
    );
    
    res.json({
      success: true,
      data: { reply, model: aiService.currentModelType }
    });
  } catch (error) {
    console.error('生成评论回复失败:', error);
    res.status(500).json({ error: error.message || '生成评论回复失败' });
  }
}

async function recommendRelatedArticles(req, res) {
  try {
    const { articleId } = req.params;
    
    // 获取当前文章
    const currentArticleResult = await pool.query(
      'SELECT id, title, content FROM articles WHERE id = $1',
      [articleId]
    );
    
    if (currentArticleResult.rows.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    // 获取其他文章
    const allArticlesResult = await pool.query(
      'SELECT id, title, content FROM articles WHERE id != $1 AND status = \'published\' LIMIT 20',
      [articleId]
    );
    
    const aiService = getAIService();
    const currentArticle = currentArticleResult.rows[0];
    const allArticles = allArticlesResult.rows;
    
    const recommendedIds = await aiService.recommendRelatedArticles(currentArticle, allArticles);
    
    // 获取推荐文章的详细信息
    const recommendedArticles = [];
    for (const id of recommendedIds.slice(0, 3)) {
      const article = allArticles.find(a => a.id === id || a.id === parseInt(id));
      if (article) {
        recommendedArticles.push({
          id: article.id,
          title: article.title
        });
      }
    }
    
    res.json({
      success: true,
      data: { recommendations: recommendedArticles }
    });
  } catch (error) {
    console.error('推荐相关文章失败:', error);
    res.status(500).json({ error: '推荐相关文章失败' });
  }
}

async function generateCommentSuggestion(req, res) {
  try {
    const { articleId } = req.params;
    
    const articleResult = await pool.query(
      'SELECT title, content FROM articles WHERE id = $1',
      [articleId]
    );
    
    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    const aiService = getAIService();
    const article = articleResult.rows[0];
    const suggestions = await aiService.generateCommentSuggestion(
      article.title,
      article.content
    );
    
    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('生成评论建议失败:', error);
    res.status(500).json({ error: '生成评论建议失败' });
  }
}

async function analyzeSentiment(req, res) {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '文本内容不能为空' });
    }
    
    // 尝试调用AI服务，如果失败则返回默认结果
    try {
      const sentiment = await aiService.analyzeSentiment(text);
      res.json({
        success: true,
        data: sentiment
      });
    } catch (aiError) {
      console.error('AI服务调用失败，使用备用情感分析结果:', aiError);
      // AI服务不可用时，返回默认中性情感
      res.json({
        success: true,
        data: {
          sentiment: 'neutral',
          score: 0.5,
          keywords: []
        }
      });
    }
  } catch (error) {
    console.error('情感分析失败:', error);
    res.status(500).json({ error: '情感分析失败' });
  }
}

async function recommendTags(req, res) {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '文章内容不能为空' });
    }
    
    // 获取现有标签
    const tagsResult = await pool.query('SELECT name FROM tags');
    const existingTags = tagsResult.rows.map(t => t.name);
    
    const recommendedTags = await aiService.recommendTags(content, existingTags);
    
    res.json({
      success: true,
      data: { tags: recommendedTags }
    });
  } catch (error) {
    console.error('推荐标签失败:', error);
    res.status(500).json({ error: '推荐标签失败' });
  }
}

async function suggestTitle(req, res) {
  try {
    const { content, currentTitle } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '文章内容不能为空' });
    }
    
    const suggestions = await aiService.suggestTitle(content, currentTitle);
    
    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('标题建议失败:', error);
    res.status(500).json({ error: '标题建议失败' });
  }
}



async function analyzeWritingStyle(req, res) {
  try {
    const { userId } = req.params;

    // 获取用户的文章
    const articlesResult = await pool.query(
      'SELECT title, content, summary FROM articles WHERE author_id = $1 LIMIT 10',
      [userId]
    );

    if (articlesResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          style: '暂无足够文章进行分析',
          strengths: [],
          improvements: [],
          commonTopics: [],
          readability: 'N/A'
        }
      });
    }

    // 尝试调用AI服务，如果失败则返回基于统计的分析
    try {
      const analysis = await aiService.analyzeWritingStyle(articlesResult.rows);
      res.json({
        success: true,
        data: analysis
      });
    } catch (aiError) {
      console.error('AI服务调用失败，使用备用分析:', aiError);
      // 返回基于文章统计的备用分析
      const articles = articlesResult.rows;
      const avgLength = articles.reduce((sum, a) => sum + (a.content?.length || 0), 0) / articles.length;

      res.json({
        success: true,
        data: {
          style: avgLength > 1000 ? '详细深入型' : '简洁明了型',
          strengths: ['内容原创', '结构清晰'],
          improvements: ['可增加更多实例', '可优化段落衔接'],
          commonTopics: [...new Set(articles.map(a => a.title?.split(' ')[0]).filter(Boolean))].slice(0, 3),
          readability: '7'
        }
      });
    }
  } catch (error) {
    console.error('写作风格分析失败:', error);
    res.status(500).json({ error: '写作风格分析失败' });
  }
}

async function getReadingRecommendations(req, res) {
  try {
    const { userId } = req.params;
    
    // 获取用户自己写的文章作为兴趣参考
    const userArticlesResult = await pool.query(
      'SELECT id, title FROM articles WHERE author_id = $1 LIMIT 5',
      [userId]
    );
    
    // 获取所有文章
    const allArticlesResult = await pool.query(
      'SELECT id, title FROM articles WHERE status = \'published\' AND author_id != $1',
      [userId]
    );
    
    const userHistory = userArticlesResult.rows;
    const allArticles = allArticlesResult.rows;
    
    // 如果没有用户文章，返回热门文章
    if (userHistory.length === 0) {
      const hotArticles = await pool.query(
        'SELECT id, title FROM articles WHERE status = \'published\' ORDER BY view_count DESC LIMIT 5'
      );
      return res.json({
        success: true,
        data: { recommendations: hotArticles.rows }
      });
    }
    
    // 尝试调用AI服务，如果失败则返回随机推荐
    try {
      const recommendedIds = await aiService.getReadingRecommendations(
        userHistory,
        allArticles
      );

      // 获取推荐文章详情
      const recommendations = [];
      for (const id of recommendedIds.slice(0, 5)) {
        const article = allArticles.find(a => a.id === id || a.id === parseInt(id));
        if (article) {
          recommendations.push(article);
        }
      }

      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (aiError) {
      console.error('AI服务调用失败，使用备用推荐:', aiError);
      // 随机返回5篇文章
      const shuffled = allArticles.sort(() => 0.5 - Math.random());
      res.json({
        success: true,
        data: { recommendations: shuffled.slice(0, 5) }
      });
    }
  } catch (error) {
    console.error('获取阅读推荐失败:', error);
    res.status(500).json({ error: '获取阅读推荐失败' });
  }
}

async function analyzeTrendingTopics(req, res) {
  try {
    // 获取最近的文章
    const articlesResult = await pool.query(
      `SELECT a.id, a.title, a.content,
        (SELECT json_agg(json_build_object('name', t.name))
         FROM article_tags at
         JOIN tags t ON at.tag_id = t.id
         WHERE at.article_id = a.id) as tags
       FROM articles a
       WHERE a.status = 'published'
       AND a.created_at > NOW() - INTERVAL '30 days'
       ORDER BY a.view_count DESC
       LIMIT 20`
    );

    const articles = articlesResult.rows;

    // 如果没有文章，返回空数据
    if (articles.length === 0) {
      return res.json({
        success: true,
        data: { topics: [] }
      });
    }

    // 尝试调用AI服务，如果失败则返回基于标签的统计
    try {
      const analysis = await aiService.analyzeTrendingTopics(articles);
      res.json({
        success: true,
        data: analysis
      });
    } catch (aiError) {
      console.error('AI服务调用失败，使用备用话题分析:', aiError);
      // 从文章标签中统计热门话题
      const tagCount = {};
      articles.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => {
            if (tag && tag.name) {
              tagCount[tag.name] = (tagCount[tag.name] || 0) + 1;
            }
          });
        }
      });

      // 转换为话题列表并排序
      const topics = Object.entries(tagCount)
        .map(([name, count]) => ({
          name,
          popularity: Math.min(count * 2, 10)
        }))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10);

      res.json({
        success: true,
        data: { topics }
      });
    }
  } catch (error) {
    console.error('热门话题分析失败:', error);
    res.status(500).json({ error: '热门话题分析失败' });
  }
}

async function smartSearch(req, res) {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    // 获取所有文章
    const articlesResult = await pool.query(
      `SELECT id, title, content, summary FROM articles WHERE status = 'published'`
    );

    const articles = articlesResult.rows;

    // 尝试调用AI服务，如果失败则使用简单的关键词匹配
    try {
      const recommendedIds = await aiService.smartSearch(query, articles);

      // 获取搜索结果
      const results = [];
      for (const id of recommendedIds.slice(0, 10)) {
        const article = articles.find(a => a.id === id || a.id === parseInt(id));
        if (article) {
          results.push({
            id: article.id,
            title: article.title,
            summary: article.summary || article.content.substring(0, 150) + '...'
          });
        }
      }

      res.json({
        success: true,
        data: { results }
      });
    } catch (aiError) {
      console.error('AI服务调用失败，使用备用搜索:', aiError);
      // 使用简单的关键词匹配
      const queryLower = query.toLowerCase();
      const results = articles
        .filter(article =>
          article.title.toLowerCase().includes(queryLower) ||
          article.content.toLowerCase().includes(queryLower)
        )
        .slice(0, 10)
        .map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || article.content.substring(0, 150) + '...'
        }));

      res.json({
        success: true,
        data: { results }
      });
    }
  } catch (error) {
    console.error('智能搜索失败:', error);
    res.status(500).json({ error: '智能搜索失败' });
  }
}

async function chat(req, res) {
  try {
    const { message, history = [], sessionId = 'default' } = req.body;
    const userId = req.userId || null;
    const normalizedMessage = normalizeMessageInput(message);
    const normalizedHistory = normalizeChatHistory(history);

    if (!normalizedMessage) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 为每个会话创建独立的AI服务实例
    const aiService = new AIService(process.env.OLLAMA_URL || 'http://localhost:11434', sessionId, userId);

    // 尝试调用AI服务，如果失败则返回备用回复
    try {
      const reply = await aiService.chat(normalizedMessage, normalizedHistory);

      res.json({
        success: true,
        data: { reply }
      });
    } catch (aiError) {
      console.error('AI服务调用失败，使用备用回复:', aiError);
      // 返回一个通用的备用回复
      const fallbackReplies = [
        '抱歉，我暂时无法连接到AI服务。请稍后再试。',
        '我正在学习中，暂时无法回答这个问题。',
        '这个问题很有意思，但我现在无法提供详细的回答。',
        '抱歉，AI服务暂时不可用。您可以尝试其他功能。'
      ];
      const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

      res.json({
        success: true,
        data: { reply: randomReply }
      });
    }
  } catch (error) {
    console.error('AI聊天失败:', error);
    res.status(500).json({ error: 'AI聊天失败' });
  }
}

// ==================== 新增LangChain核心功能控制器 ====================

// 流式聊天功能
async function streamChat(req, res) {
  try {
    const { message, history = [], sessionId = 'default', contextType = 'general', model = 'ollama' } = req.body;
    const normalizedMessage = normalizeMessageInput(message);
    const normalizedHistory = normalizeChatHistory(history);

    if (!normalizedMessage) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 设置响应头支持SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 为每个会话创建独立的AI服务实例
    const aiService = new AIService(process.env.OLLAMA_URL || 'http://localhost:11434', sessionId, req.userId, model);

    // 使用流式输出
    const stream = aiService.streamChat(normalizedMessage, normalizedHistory, contextType);

    // 逐块发送数据
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk, model: aiService.currentModelType })}\n\n`);
    }

    // 发送完成信号
    res.write(`data: ${JSON.stringify({ done: true, model: aiService.currentModelType })}\n\n`);
    res.end();

  } catch (error) {
    console.error('流式聊天失败:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

// 获取所有上下文类型
async function getContexts(req, res) {
  try {
    const aiService = new AIService();
    const contexts = aiService.getAllContexts();
    res.json({
      success: true,
      data: { contexts }
    });
  } catch (error) {
    console.error('获取上下文类型失败:', error);
    res.status(500).json({ error: '获取上下文类型失败' });
  }
}

// 文件内容分析
async function analyzeFile(req, res) {
  try {
    const { fileContent, fileName } = req.body;

    if (!fileContent) {
      return res.status(400).json({ error: '文件内容不能为空' });
    }

    const aiService = new AIService();
    const analysis = await aiService.analyzeFileContent(fileContent, fileName);

    res.json({
      success: true,
      data: { analysis }
    });
  } catch (error) {
    console.error('文件分析失败:', error);
    res.status(500).json({ error: '文件分析失败' });
  }
}

// 快捷操作：生成大纲
async function generateOutline(req, res) {
  try {
    const { topic, keywords } = req.body;

    if (!topic) {
      return res.status(400).json({ error: '主题不能为空' });
    }

    const aiService = new AIService();
    const outline = await aiService.generateOutline(topic, keywords);

    res.json({
      success: true,
      data: { outline }
    });
  } catch (error) {
    console.error('生成大纲失败:', error);
    res.status(500).json({ error: '生成大纲失败' });
  }
}

// 快捷操作：续写内容
async function continueWriting(req, res) {
  try {
    const { content, maxLength = 500 } = req.body;

    if (!content) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    const aiService = new AIService();
    const continued = await aiService.continueWriting(content, maxLength);

    res.json({
      success: true,
      data: { continued }
    });
  } catch (error) {
    console.error('续写失败:', error);
    res.status(500).json({ error: '续写失败' });
  }
}

// 快捷操作：润色内容
async function polishContent(req, res) {
  try {
    const { content, style = 'natural' } = req.body;

    if (!content) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    const aiService = new AIService();
    const polished = await aiService.polishContent(content, style);

    res.json({
      success: true,
      data: { polished }
    });
  } catch (error) {
    console.error('润色失败:', error);
    res.status(500).json({ error: '润色失败' });
  }
}



// 流式续写内容
async function streamContinueWriting(req, res) {
  try {
    const { content, length = 300, model = 'ollama' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '内容不能为空' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const aiService = getAIService(model);
    const stream = aiService.streamContinueWriting(content, length);
    
    for await (const chunk of stream) {
      writeSse(res, { content: chunk, model: aiService.currentModelType });
    }
    
    writeSse(res, { done: true, model: aiService.currentModelType });
    res.end();
  } catch (error) {
    console.error('流式续写失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || '续写失败，请稍后重试' });
    }
  }
}

// 快捷操作：SEO优化建议
async function seoOptimization(req, res) {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    const aiService = new AIService();
    const suggestions = await aiService.seoOptimization(content, title);

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('SEO优化失败:', error);
    res.status(500).json({ error: 'SEO优化失败' });
  }
}

// 上传文件并分析
async function uploadAndAnalyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const aiService = new AIService();
    const analysis = await aiService.analyzeUploadedFile(req.file);

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analysis
      }
    });
  } catch (error) {
    console.error('文件上传分析失败:', error);
    res.status(500).json({ error: '文件上传分析失败' });
  }
}

// 多模态内容生成（基于图片描述）
async function generateFromImage(req, res) {
  try {
    const { imageDescription, instruction } = req.body;

    if (!imageDescription) {
      return res.status(400).json({ error: '图片描述不能为空' });
    }

    const aiService = new AIService();
    const result = await aiService.generateFromImage(imageDescription, instruction);

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    console.error('图片内容生成失败:', error);
    res.status(500).json({ error: '图片内容生成失败' });
  }
}

// 搜索Unsplash图片
async function searchUnsplashImages(req, res) {
  try {
    const { query, perPage = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey || accessKey === 'your_unsplash_access_key_here') {
      // 如果没有配置UNSPLASH_ACCESS_KEY，返回默认图片
      return res.json({
        success: true,
        data: {
          images: [
            {
              id: 'default1',
              urls: {
                thumb: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400',
                small: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800',
                regular: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1080',
                full: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920'
              },
              alt_description: 'Default cover image',
              user: { name: 'Unsplash' }
            }
          ],
          message: '请在 .env 中配置 UNSPLASH_ACCESS_KEY 以获取更多高质量图片'
        }
      });
    }

    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    const images = data.results.map(photo => ({
      id: photo.id,
      urls: photo.urls,
      alt_description: photo.alt_description || query,
      user: {
        name: photo.user.name,
        links: photo.user.links
      },
      width: photo.width,
      height: photo.height,
      color: photo.color
    }));

    res.json({
      success: true,
      data: { images }
    });
  } catch (error) {
    console.error('搜索Unsplash图片失败:', error);
    res.status(500).json({ error: '搜索图片失败，请稍后重试' });
  }
}

// AI推荐封面图片（结合标题和内容分析）
async function recommendCoverImage(req, res) {
  try {
    const { title, content, query } = req.body;

    if (!title && !content && !query) {
      return res.status(400).json({ error: '标题、内容或查询关键词不能同时为空' });
    }

    // 使用AI分析最适合的图片类型
    const aiService = new AIService();

    let searchQuery = query;

    // 如果没有提供明确的查询，使用AI生成搜索关键词
    if (!searchQuery && (title || content)) {
      const combinedText = [title, content].filter(Boolean).join(' ');

      // 添加超时处理：10秒内生成关键词
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 10000);
      });

      const aiPromise = aiService.generateCoverSearchQuery(combinedText);

      try {
        searchQuery = await Promise.race([aiPromise, timeoutPromise]);
      } catch (aiError) {
        console.error('AI生成搜索关键词失败或超时:', aiError);
        return res.status(408).json({
          error: 'AI生成关键词超时，请稍后重试或直接输入封面图URL'
        });
      }
    }

    // 如果还是没有关键词，使用默认
    if (!searchQuery) {
      searchQuery = 'technology blog';
    }

    // 调用Unsplash API搜索图片
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey || accessKey === 'your_unsplash_access_key_here') {
      // 返回示例图片
      return res.json({
        success: true,
        data: {
          images: [
            {
              id: 'sample1',
              urls: {
                thumb: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400',
                small: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
                regular: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1080',
                full: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920'
              },
              alt_description: 'Blog cover image',
              user: { name: 'Unsplash' }
            },
            {
              id: 'sample2',
              urls: {
                thumb: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
                small: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
                regular: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080',
                full: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920'
              },
              alt_description: 'Technology and writing',
              user: { name: 'Unsplash' }
            }
          ],
          searchQuery,
          message: '请在 .env 中配置 UNSPLASH_ACCESS_KEY 以获取AI推荐的封面图片'
        }
      });
    }

    // 搜索相关图片
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    const images = data.results.map(photo => ({
      id: photo.id,
      urls: photo.urls,
      alt_description: photo.alt_description || searchQuery,
      user: {
        name: photo.user.name,
        links: photo.user.links
      },
      width: photo.width,
      height: photo.height,
      color: photo.color,
      likes: photo.likes
    }));

    res.json({
      success: true,
      data: {
        images,
        searchQuery,
        totalResults: data.total
      }
    });
  } catch (error) {
    console.error('推荐封面图片失败:', error);
    res.status(500).json({ error: '推荐封面图片失败，请稍后重试' });
  }
}

module.exports = {
  generateArticle,
  generateSummary,
  generateReply,
  optimizeContent,
  streamGenerateArticle,
  streamGenerateSummary,
  streamGenerateReply,
  streamOptimizeContent,
  generateCommentReply,
  recommendRelatedArticles,
  generateCommentSuggestion,
  analyzeSentiment,
  recommendTags,
  suggestTitle,
  analyzeWritingStyle,
  getReadingRecommendations,
  analyzeTrendingTopics,
  smartSearch,
  chat,
  streamChat: streamChatEnhanced,
  getContexts,
  analyzeFile,
  generateOutline,
  continueWriting,
  polishContent,
  seoOptimization,
  uploadAndAnalyze,
  generateFromImage,
  searchUnsplashImages,
  recommendCoverImage,
  streamContinueWriting
};

async function streamChatEnhanced(req, res) {
  try {
    const { message, history = [], sessionId = 'default', contextType = 'general', model = 'ollama' } = req.body;
    const normalizedMessage = normalizeMessageInput(message);
    const normalizedHistory = normalizeChatHistory(history);

    if (!normalizedMessage) {
      return res.status(400).json({ error: '娑堟伅鍐呭涓嶈兘涓虹┖' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    if (res.socket && typeof res.socket.setNoDelay === 'function') {
      res.socket.setNoDelay(true);
    }

    const aiService = new AIService(
      process.env.OLLAMA_URL || 'http://localhost:11434',
      sessionId,
      req.userId,
      model
    );

    let clientClosed = false;

    res.on('close', () => {
      clientClosed = true;
    });

    const stream = aiService.streamChat(normalizedMessage, normalizedHistory, contextType);

    for await (const chunk of stream) {
      if (clientClosed || res.writableEnded) {
        break;
      }

      writeSse(res, { content: chunk });
    }

    if (!clientClosed && !res.writableEnded) {
      writeSse(res, { done: true });
      res.end();
    }
  } catch (error) {
    console.error('娴佸紡鑱婂ぉ澶辫触:', error);

    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || '娴佸紡鑱婂ぉ澶辫触' });
    }

    if (!res.writableEnded) {
      writeSse(res, { error: error.message || '娴佸紡鑱婂ぉ澶辫触' });
      res.end();
    }
  }
}
