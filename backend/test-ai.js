const AIService = require('./utils/aiService');

async function testAI() {
  console.log('开始测试AI服务...');
  
  try {
    const aiService = new AIService();
    
    console.log('测试1: 生成文章');
    const article = await aiService.generateArticle('Vue3入门', 'Vue3, 前端, 框架', 200);
    console.log('生成成功:', article);
    
    console.log('\n测试2: 生成摘要');
    const summary = await aiService.generateSummary('Vue3是一个现代化的前端框架，它提供了响应式数据绑定、组件化开发等特性。Vue3相比Vue2有很多改进，包括Composition API、更好的TypeScript支持等。', 100);
    console.log('生成成功:', summary);
    
    console.log('\n测试3: 优化内容');
    const optimized = await aiService.optimizeContent('Vue3是一个框架，它很好用。', 'general');
    console.log('优化成功:', optimized);
    
    console.log('\n所有测试通过！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAI();
