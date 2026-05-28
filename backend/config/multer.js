const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname)
    const userId = req.userId || 'guest'
    const uniqueSuffix = `${userId}_${Date.now()}_${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
    return
  }

  cb(new Error('Only JPG, PNG, GIF, and WEBP images are allowed'), false)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})

module.exports = upload
