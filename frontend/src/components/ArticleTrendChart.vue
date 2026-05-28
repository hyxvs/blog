<template>
  <div class="article-trend-chart">
    <div class="chart-header">
      <h3>文章发布趋势</h3>
      <div class="chart-controls">
        <el-radio-group v-model="period" size="small" @change="loadTrendData">
          <el-radio-button value="day" label="日">日</el-radio-button>
          <el-radio-button value="week" label="周">周</el-radio-button>
          <el-radio-button value="month" label="月">月</el-radio-button>
          <el-radio-button value="year" label="年">年</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { getArticleTrend } from '@/api/article'

const chartRef = ref(null)
const chart = ref(null)
const period = ref('month')

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chart.value = echarts.init(chartRef.value)
    loadTrendData()
  }
}

// 加载趋势数据
const loadTrendData = async () => {
  try {
    const response = await getArticleTrend({ period: period.value, limit: 12 })
    updateChart(response.data)
  } catch (error) {
    console.error('加载趋势数据失败:', error)
  }
}

// 更新图表
const updateChart = (data) => {
  if (!chart.value) return

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '文章数量',
        type: 'bar',
        data: data.counts,
        itemStyle: {
          color: '#409EFF'
        },
        emphasis: {
          itemStyle: {
            color: '#66B1FF'
          }
        }
      }
    ]
  }

  chart.value.setOption(option)
}

// 响应式调整图表大小
const handleResize = () => {
  chart.value?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart.value?.dispose()
})

// 监听周期变化
watch(period, () => {
  loadTrendData()
})
</script>

<style scoped>
.article-trend-chart {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.chart-container {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>