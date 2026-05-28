import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/global.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.config.errorHandler = (err, instance, info) => {
  console.error('Global error handler:', err)
  console.error('Component instance:', instance)
  console.error('Error info:', info)
  
  if (typeof err === 'string') {
    alert(`应用发生错误: ${err}`)
  } else {
    alert('应用发生未知错误，请刷新页面重试')
  }
}

app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Global warn handler:', msg)
  console.warn('Trace:', trace)
}

app.mount('#app')