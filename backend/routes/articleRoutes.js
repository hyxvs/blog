const express = require('express')

const articleController = require('../controllers/articleController')
const upload = require('../config/multer')
const { authenticateToken, attachUserIfPresent } = require('../middleware/auth')

const router = express.Router()

router.get('/stats/public', articleController.getPublicStats)
router.get('/stats/trend', articleController.getArticleTrend)
router.post('/upload-image', authenticateToken, upload.array('file[]'), articleController.uploadEditorImages)
router.post('/upload-cover', authenticateToken, upload.single('cover'), articleController.uploadArticleCover)

router.get('/', attachUserIfPresent, articleController.getArticles)
router.post('/', authenticateToken, articleController.createArticle)

router.get('/:id/likes', attachUserIfPresent, articleController.getArticleLikes)
router.post('/:id/like', authenticateToken, articleController.likeArticle)

router.get('/:id', attachUserIfPresent, articleController.getArticleById)
router.put('/:id', authenticateToken, articleController.updateArticle)
router.delete('/:id', authenticateToken, articleController.deleteArticle)

module.exports = router
