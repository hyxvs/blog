import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

function createVditorAssetPlugin(): Plugin {
  const sourceDir = path.resolve(__dirname, 'node_modules/vditor/dist')
  const targetDir = path.resolve(__dirname, 'dist/vditor/dist')

  return {
    name: 'vditor-assets',
    configureServer(server) {
      server.middlewares.use('/vditor/dist', (req, res, next) => {
        const requestPath = decodeURIComponent((req.url || '').split('?')[0])
        const relativePath = requestPath.replace(/^\/+/, '')
        const filePath = path.join(sourceDir, relativePath)

        if (!filePath.startsWith(sourceDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          next()
          return
        }

        res.setHeader('Content-Type', getMimeType(filePath))
        fs.createReadStream(filePath).pipe(res)
      })
    },
    closeBundle() {
      fs.mkdirSync(path.dirname(targetDir), { recursive: true })
      fs.cpSync(sourceDir, targetDir, { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [vue(), createVditorAssetPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    assetsDir: 'assets',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
    sourcemap: false,
  },
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
})
