require('dotenv').config()

const app = require('./app')
const config = require('./config/database')
const { ensureRuntimeSchema } = require('./utils/ensureRuntimeSchema')

const PORT = config.port

// 添加未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  console.error('Stack trace:', err.stack)
  process.exit(1)
})

// 添加未处理的 Promise rejection 处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise)
  console.error('Reason:', reason)
})

async function startServer() {
  try {
    console.log('Starting server...')
    
    // 等待数据库连接
    console.log('Connecting to database...')
    
    // 确保运行时 schema 准备就绪
    try {
      await ensureRuntimeSchema()
      console.log('Runtime schema is ready')
    } catch (error) {
      console.error('Failed to prepare runtime schema:', error)
    }

    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Database: ${config.database ? 'Configured' : 'Not configured'}`)
    })

    // 监听服务器错误
    server.on('error', (err) => {
      console.error('Server error:', err)
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free the port and try again.`)
      }
      process.exit(1)
    })

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

  } catch (error) {
    console.error('Failed to start server:', error)
    console.error('Error stack:', error.stack)
    process.exit(1)
  }
}

startServer()
