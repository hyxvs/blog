/**
 * controllers/commentController.js - 评论控制器
 *
 * 【核心知识点】
 *
 * 1. 评论系统的数据模型
 *
 *    【层级结构】
 *    - 一级评论：直接关联文章（parent_id = NULL）
 *    - 二级评论：回复一级评论（parent_id = 一级评论ID）
 *    - 可以扩展为多层级（递归查询）
 *
 *    【数据关联】
 *    - 必须关联文章（article_id）
 *    - 可选关联父评论（parent_id）
 *    - 关联用户（user_id）
 *
 * 2. 递归查询与层级展示
 *
 *    【问题】
 *    - 如何高效查询嵌套评论？
 *    - 如何避免 N+1 查询问题？
 *
 *    【解决方案】
 *    - 先查询所有一级评论
 *    - 使用 IN 查询批量获取回复
 *    - 在内存中组装层级结构
 *
 *    【替代方案】
 *    - 使用 CTE（Common Table Expressions）递归查询
 *    - 使用嵌套集模型（Nested Set Model）
 *    - 使用路径枚举（Path Enumeration）
 *
 * 3. 数据验证
 *
 *    【外键约束检查】
 *    - 检查文章是否存在
 *    - 检查父评论是否存在
 *    - 检查父评论是否属于同一文章
 *
 *    【为什么需要检查？】
 *    - 提供友好的错误信息
 *    - 防止脏数据
 *    - 比依赖数据库外键错误更清晰
 *
 * 4. 分页与性能
 *
 *    【评论分页的特殊性】
 *    - 一级评论分页
 *    - 回复随父评论一起返回
 *    - 限制每页回复数量
 *
 *    【优化策略】
 *    - 使用子查询统计回复数量
 *    - 延迟加载大量回复
 */

// 导入数据库连接池
const pool = require('../config/pool');

/**
 * 发表评论
 *
 * 【功能】创建新评论或回复
 * 【请求】POST /api/comments
 * 【请求体】{ articleId, content, parentId? }
 */
const createComment = async (req, res) => {
  try {
    const { articleId, content, parentId, isAI } = req.body;

    // 参数验证
    if (!articleId || !content) {
      return res.status(400).json({ error: 'Article ID and content are required' });
    }

    // AI 回复使用固定的 AI 用户 ID (假设为 1，即管理员)
    const userId = isAI ? 1 : req.userId;

    /**
     * 检查文章是否存在
     *
     * 【知识点】
     * - 先验证关联资源存在性
     * - 避免外键约束错误
     */
    const articleResult = await pool.query(
      'SELECT id FROM articles WHERE id = $1',
      [articleId]
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    /**
     * 检查父评论（如果是回复）
     *
     * 【知识点】
     * - 验证父评论存在性
     * - 验证父评论属于同一文章
     * - 防止跨文章回复
     */
    if (parentId) {
      let currentParentId = parentId;
      let foundArticleId = null;
      
      // 递归追溯到顶级评论，获取其 article_id
      while (currentParentId) {
        const parentResult = await pool.query(
          'SELECT id, article_id, parent_id FROM comments WHERE id = $1',
          [currentParentId]
        );

        if (parentResult.rows.length === 0) {
          return res.status(404).json({ error: 'Parent comment not found' });
        }
        
        const parentComment = parentResult.rows[0];
        foundArticleId = parentComment.article_id;
        currentParentId = parentComment.parent_id;
      }
      
      // 验证顶级评论的 article_id 是否与当前评论的 articleId 匹配
      if (foundArticleId !== articleId) {
        return res.status(400).json({ error: 'Parent comment does not belong to this article' });
      }
    }

    /**
     * 插入评论
     *
     * 【知识点】
     * - parent_id 可为 NULL（一级评论）
     * - userId 由认证中间件提供，AI 回复使用固定 ID
     */
    const result = await pool.query(
      `INSERT INTO comments (content, article_id, user_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, article_id, user_id, parent_id, created_at, updated_at`,
      [content, articleId, userId, parentId || null]
    );

    const comment = result.rows[0];

    /**
     * 查询评论者信息
     *
     * 【知识点】
     * - 返回用户信息用于前端展示
     * - 避免前端再次查询
     * - AI 回复使用固定用户信息
     */
    let userResult;
    if (isAI) {
      userResult = {
        rows: [{
          username: 'AI 助手',
          avatar: null
        }]
      };
    } else {
      userResult = await pool.query(
        'SELECT username, avatar FROM users WHERE id = $1',
        [userId]
      );
    }

    // 返回创建的评论
    res.status(201).json({
      id: comment.id,
      content: comment.content,
      articleId: comment.article_id,
      userId: comment.user_id,
      parentId: comment.parent_id,
      username: userResult.rows[0].username,
      avatar: userResult.rows[0].avatar,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取文章评论列表
 *
 * 【功能】获取文章的所有评论（层级结构）
 * 【请求】GET /api/comments/article/:articleId
 */
const getComments = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    /**
     * 检查文章是否存在
     */
    const articleResult = await pool.query(
      'SELECT id FROM articles WHERE id = $1',
      [articleId]
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    /**
     * 统计一级评论数量
     *
     * 【知识点】
     * - parent_id IS NULL 表示一级评论
     * - 用于分页计算
     */
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments
      WHERE article_id = $1 AND parent_id IS NULL
    `;

    /**
     * 查询一级评论
     *
     * 【知识点】
     * - 使用子查询统计回复数量
     * - JOIN 获取用户信息
     * - 按时间倒序排列
     */
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.user_id, c.parent_id, c.created_at, c.updated_at,
        u.username, u.avatar,
        (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.article_id = $1 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    /**
     * 并行执行统计和查询
     */
    const [countResult, commentsResult] = await Promise.all([
      pool.query(countQuery, [articleId]),
      pool.query(commentsQuery, [articleId, limit, offset]),
    ]);

    const comments = commentsResult.rows;

    /**
     * 批量查询所有回复
     *
     * 【知识点】
     * - 使用 ANY 查询多个评论的回复
     * - 避免 N+1 查询问题
     * - 支持多级回复
     */
    const repliesMap = {};
    let fillReplies = null;
    
    if (comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      const queriedCommentIds = new Set(commentIds); // 用于跟踪已查询的评论 ID，避免重复查询
      
      // 递归查询所有回复
      let currentCommentIds = [...commentIds];
      let depth = 0;
      const maxDepth = 10; // 限制最大递归深度，避免无限循环
      
      while (currentCommentIds.length > 0 && depth < maxDepth) {
        const repliesResult = await pool.query(
          `SELECT 
            c.id, c.content, c.user_id, c.parent_id, c.created_at, c.updated_at,
            u.username, u.avatar
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.parent_id = ANY($1)
          ORDER BY c.created_at ASC`,
          [currentCommentIds]
        );
        
        if (repliesResult.rows.length === 0) {
          break;
        }
        
        // 准备下一轮查询的评论 ID
        const nextCommentIds = [];
        
        // 将回复按父评论 ID 分组
        repliesResult.rows.forEach(reply => {
          if (!repliesMap[reply.parent_id]) {
            repliesMap[reply.parent_id] = [];
          }
          repliesMap[reply.parent_id].push({
            id: reply.id,
            content: reply.content,
            userId: reply.user_id,
            parentId: reply.parent_id,
            username: reply.username,
            avatar: reply.avatar,
            createdAt: reply.created_at,
            updatedAt: reply.updated_at,
            replies: [] // 预留 replies 字段，后续填充
          });
          
          // 如果该回复的 ID 还没有被查询过，添加到下一轮查询列表
          if (!queriedCommentIds.has(reply.id)) {
            queriedCommentIds.add(reply.id);
            nextCommentIds.push(reply.id);
          }
        });
        
        currentCommentIds = nextCommentIds;
        depth++;
      }
      
      // 递归填充回复的回复
      fillReplies = (comment) => {
        if (repliesMap[comment.id]) {
          comment.replies = repliesMap[comment.id];
          comment.replies.forEach(reply => fillReplies(reply));
        }
      };
    }

    /**
     * 组装层级结构
     *
     * 【知识点】
     * - 将回复添加到对应的一级评论
     * - 字段名转换
     */
    const commentsWithReplies = comments.map(comment => {
      const commentWithReplies = {
        id: comment.id,
        content: comment.content,
        userId: comment.user_id,
        parentId: comment.parent_id,
        username: comment.username,
        avatar: comment.avatar,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        replyCount: parseInt(comment.reply_count),
        replies: []
      };
      
      // 填充回复的回复
      if (repliesMap[comment.id] && fillReplies) {
        commentWithReplies.replies = repliesMap[comment.id];
        commentWithReplies.replies.forEach(reply => fillReplies(reply));
      }
      
      return commentWithReplies;
    });

    // 返回评论列表和分页信息
    res.json({
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 删除评论
 *
 * 【功能】删除指定评论
 * 【请求】DELETE /api/comments/:id
 * 【权限】评论作者或管理员
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    /**
     * 查询评论信息
     *
     * 【知识点】
     * - 获取用户 ID 进行权限检查
     */
    const commentResult = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = commentResult.rows[0];

    /**
     * 权限检查
     *
     * 【知识点】
     * - 管理员或评论作者可删除
     * - 删除父评论通常也会删除子评论（通过外键 CASCADE）
     */
    if (req.userRole !== 'admin' && req.userId !== comment.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 删除评论
    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    // 返回成功消息
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 导出控制器函数
module.exports = {
  createComment,
  getComments,
  deleteComment,
};
