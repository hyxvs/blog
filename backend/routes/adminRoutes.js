const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (req.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ error: '需要管理员权限' });
  }
};

router.use(authenticateToken);

router.get('/stats', requireAdmin, adminController.getAdminStats);
router.get('/activities', requireAdmin, adminController.getRecentActivities);
router.get('/users', requireAdmin, adminController.getUsers);
router.put('/users/:userId/role', requireAdmin, adminController.updateUserRole);
router.delete('/users/:userId', requireAdmin, adminController.deleteUser);
router.get('/articles', requireAdmin, adminController.getAdminArticles);
router.put('/articles/:articleId/status', requireAdmin, adminController.toggleArticleStatus);
router.delete('/articles/:articleId', requireAdmin, adminController.deleteArticle);
router.get('/tags', requireAdmin, adminController.getTags);
router.post('/tags', requireAdmin, adminController.createTag);
router.put('/tags/:tagId', requireAdmin, adminController.updateTag);
router.delete('/tags/:tagId', requireAdmin, adminController.deleteTag);
router.get('/categories', requireAdmin, adminController.getCategories);
router.post('/categories', requireAdmin, adminController.createCategory);
router.put('/categories/:categoryId', requireAdmin, adminController.updateCategory);
router.delete('/categories/:categoryId', requireAdmin, adminController.deleteCategory);

// 签到记录管理
router.get('/checkins', requireAdmin, adminController.getCheckinRecords);

module.exports = router;
