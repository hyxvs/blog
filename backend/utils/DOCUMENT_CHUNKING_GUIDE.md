# LangChain Document 分片查询知识点详解

## 目录
1. [Document 对象](#1-document-对象)
2. [文本分割器](#2-文本分割器)
3. [分片查询](#3-分片查询)
4. [实际应用场景](#4-实际应用场景)
5. [最佳实践](#5-最佳实践)

---

## 1. Document 对象

### 1.1 基本概念
Document 是 LangChain 中的核心数据结构，用于表示文本文档。

### 1.2 Document 结构
```javascript
const doc = new Document({
  pageContent: '文档的主要内容',
  metadata: {
    source: '文档来源',
    author: '作者',
    category: '分类',
    createdAt: '创建时间'
  }
})
```

### 1.3 核心属性
- **pageContent**: 文档的主要内容（必填）
- **metadata**: 文档的元数据（可选）

### 1.4 常用元数据字段
```javascript
{
  source: '文件路径或URL',
  title: '文档标题',
  author: '作者',
  category: '分类',
  tags: ['标签1', '标签2'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  language: 'zh-CN',
  wordCount: 1000
}
```

---

## 2. 文本分割器

### 2.1 RecursiveCharacterTextSplitter
最常用的文本分割器，递归地按优先级分割文本。

### 2.2 配置参数
```javascript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,           // 每个块的最大字符数
  chunkOverlap: 200,          // 块之间的重叠字符数
  separators: [               // 分割符优先级列表
    '\n\n',                   // 段落分隔符
    '\n',                     // 行分隔符
    '。',                     // 中文句号
    '！',                     // 中文感叹号
    '？',                     // 中文问号
    ' ',                      // 空格
    ''                        // 字符
  ],
  lengthFunction: (text) => text.length  // 计算长度的函数
})
```

### 2.3 参数详解

#### chunkSize（块大小）
- **作用**: 控制每个文本块的最大字符数
- **建议值**: 
  - 短文本: 500-800
  - 中等文本: 800-1200
  - 长文本: 1000-1500
- **影响因素**: 
  - 模型的上下文窗口大小
  - 处理速度
  - 语义完整性

#### chunkOverlap（重叠部分）
- **作用**: 相邻块之间共享的字符数
- **建议值**: chunkSize 的 10-20%
- **优点**:
  - 保持上下文连贯性
  - 避免信息在边界处丢失
  - 提高检索准确性

#### separators（分割符）
- **作用**: 按优先级分割文本的字符列表
- **优先级**: 从高到低依次尝试
- **常用分割符**:
  - 中文: `\n\n`, `\n`, `。`, `！`, `？`, `，`, ` `, ``
  - 英文: `\n\n`, `\n`, `.`, `!`, `?`, `,`, ` `, ``
  - 代码: `\n\n`, `\n`, `;`, `{`, `}`, ` `, ``

### 2.4 分割方法

#### splitText() - 分割纯文本
```javascript
const text = '这是一段很长的文本...'
const chunks = await textSplitter.splitText(text)
// 返回: ['chunk1', 'chunk2', 'chunk3']
```

#### splitDocuments() - 分割Document对象
```javascript
const docs = [doc1, doc2, doc3]
const chunks = await textSplitter.splitDocuments(docs)
// 返回: [chunk1, chunk2, chunk3, ...]
// 每个chunk都保留原始document的metadata
```

---

## 3. 分片查询

### 3.1 基于元数据的查询
```javascript
// 按分类过滤
const filteredChunks = chunks.filter(chunk => 
  chunk.metadata.category === '技术'
)

// 按作者过滤
const authorChunks = chunks.filter(chunk => 
  chunk.metadata.author === '张三'
)

// 按日期范围过滤
const dateChunks = chunks.filter(chunk => {
  const date = new Date(chunk.metadata.createdAt)
  return date >= startDate && date <= endDate
})
```

### 3.2 关键词搜索
```javascript
// 简单关键词搜索
const keywordChunks = chunks.filter(chunk =>
  chunk.pageContent.includes('人工智能')
)

// 大小写不敏感搜索
const caseInsensitiveChunks = chunks.filter(chunk =>
  chunk.pageContent.toLowerCase().includes('ai'.toLowerCase())
)

// 多关键词搜索（AND逻辑）
const multiKeywordChunks = chunks.filter(chunk =>
  chunk.pageContent.includes('机器学习') && 
  chunk.pageContent.includes('深度学习')
)
```

### 3.3 相似度搜索（需要向量数据库）
```javascript
// 使用向量数据库进行语义搜索
const query = '什么是机器学习？'
const results = await vectorStore.similaritySearch(query, k=3)
// 返回最相似的3个文档块
```

### 3.4 模糊匹配
```javascript
// 使用正则表达式进行模糊匹配
const regex = /机器.*学习/
const fuzzyChunks = chunks.filter(chunk =>
  regex.test(chunk.pageContent)
)
```

---

## 4. 实际应用场景

### 4.1 RAG（检索增强生成）
```javascript
async function ragQuery(question, vectorStore, llm) {
  // 1. 检索相关文档
  const relevantDocs = await vectorStore.similaritySearch(question, k=3)
  
  // 2. 构建提示
  const context = relevantDocs.map(doc => doc.pageContent).join('\n\n')
  const prompt = `基于以下内容回答问题：\n\n${context}\n\n问题：${question}`
  
  // 3. 生成回答
  const answer = await llm.invoke(prompt)
  return answer
}
```

### 4.2 文档摘要生成
```javascript
async function generateDocumentSummary(chunks, llm) {
  // 为每个块生成摘要
  const summaries = await Promise.all(
    chunks.map(async chunk => {
      const prompt = `为以下文本生成摘要：\n\n${chunk.pageContent}`
      return await llm.invoke(prompt)
    })
  )
  
  // 合并摘要
  return summaries.join('\n\n')
}
```

### 4.3 知识库构建
```javascript
async function buildKnowledgeBase(documents) {
  // 1. 分割文档
  const chunks = await textSplitter.splitDocuments(documents)
  
  // 2. 生成向量嵌入
  const embeddings = await embeddingModel.embedDocuments(
    chunks.map(chunk => chunk.pageContent)
  )
  
  // 3. 存储到向量数据库
  await vectorStore.addDocuments(chunks)
  
  return chunks.length
}
```

### 4.4 文档问答系统
```javascript
async function documentQA(question, vectorStore, llm) {
  // 1. 检索相关文档
  const docs = await vectorStore.similaritySearch(question, k=5)
  
  // 2. 构建上下文
  const context = docs.map((doc, i) => 
    `[文档${i+1}]\n${doc.pageContent}`
  ).join('\n\n')
  
  // 3. 生成回答
  const prompt = PromptTemplate.fromTemplate(`
    基于以下文档内容回答问题。如果文档中没有相关信息，请说明。
    
    文档内容：
    {context}
    
    问题：{question}
    
    回答：
  `)
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser())
  const answer = await chain.invoke({ context, question })
  
  return answer
}
```

---

## 5. 最佳实践

### 5.1 分割策略选择
```javascript
// 针对不同类型的内容使用不同的分割策略

// 技术文档 - 按段落分割
const techDocSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,
  chunkOverlap: 300,
  separators: ['\n\n', '\n', '。', '！', '？', ' ', '']
})

// 代码 - 按函数/类分割
const codeSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
  separators: ['\n\n', '\n', '{', '}', ';', ' ', '']
})

// 对话 - 按对话轮次分割
const dialogueSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 600,
  chunkOverlap: 150,
  separators: ['\n\n', '\n', '。', '！', '？', '，', ' ', '']
})
```

### 5.2 元数据管理
```javascript
// 丰富元数据，提高查询效率
const doc = new Document({
  pageContent: content,
  metadata: {
    // 基础信息
    id: generateId(),
    source: filePath,
    title: extractTitle(content),
    
    // 分类信息
    category: classifyContent(content),
    tags: extractTags(content),
    
    // 时间信息
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // 统计信息
    wordCount: countWords(content),
    charCount: content.length,
    
    // 语言信息
    language: detectLanguage(content),
    
    // 自定义字段
    customField: '自定义值'
  }
})
```

### 5.3 性能优化
```javascript
// 批量处理
async function batchProcessDocuments(documents, batchSize = 10) {
  const allChunks = []
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    const chunks = await textSplitter.splitDocuments(batch)
    allChunks.push(...chunks)
    
    // 避免内存溢出
    if (i % (batchSize * 10) === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return allChunks
}

// 缓存查询结果
const queryCache = new Map()

function cachedSearch(query) {
  if (queryCache.has(query)) {
    return queryCache.get(query)
  }
  
  const results = performSearch(query)
  queryCache.set(query, results)
  return results
}
```

### 5.4 错误处理
```javascript
async function safeSplitDocuments(documents) {
  try {
    const chunks = await textSplitter.splitDocuments(documents)
    
    // 验证分割结果
    if (chunks.length === 0) {
      console.warn('警告：分割结果为空')
      return documents
    }
    
    // 检查块大小
    const oversizedChunks = chunks.filter(
      chunk => chunk.pageContent.length > chunkSize * 1.5
    )
    
    if (oversizedChunks.length > 0) {
      console.warn(`警告：${oversizedChunks.length}个块超过预期大小`)
    }
    
    return chunks
    
  } catch (error) {
    console.error('文档分割失败:', error)
    // 返回原始文档作为后备方案
    return documents
  }
}
```

### 5.5 质量控制
```javascript
function validateChunks(chunks) {
  const issues = []
  
  chunks.forEach((chunk, index) => {
    // 检查空块
    if (!chunk.pageContent.trim()) {
      issues.push(`块${index + 1}为空`)
    }
    
    // 检查过小块
    if (chunk.pageContent.length < 50) {
      issues.push(`块${index + 1}过小: ${chunk.pageContent.length}字符`)
    }
    
    // 检查缺失元数据
    if (!chunk.metadata.source) {
      issues.push(`块${index + 1}缺少source元数据`)
    }
  })
  
  return issues
}
```

---

## 总结

LangChain 的 Document 分片查询功能为处理长文档提供了强大的工具：

1. **Document 对象**提供了灵活的文档表示方式
2. **文本分割器**支持多种分割策略，适应不同场景
3. **分片查询**提供了丰富的查询方式，包括元数据过滤、关键词搜索等
4. **实际应用**涵盖 RAG、文档摘要、知识库构建等多个场景
5. **最佳实践**帮助开发者构建高效、可靠的文档处理系统

通过合理使用这些功能，可以构建出强大的文档处理和问答系统。
