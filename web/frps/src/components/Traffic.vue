<template>
  <n-spin :show="loading" class="traffic-chart-container">
    <div v-if="!loading && chartData.length > 0" class="chart-wrapper">
      <div class="y-axis">
        <div>{{ formatFileSize(maxVal) }}</div>
        <div>{{ formatFileSize(maxVal / 2) }}</div>
        <div>0</div>
      </div>

      <div class="bars-area">
        <div class="grid-line top"></div>
        <div class="grid-line middle"></div>
        <div class="grid-line bottom"></div>

        <div v-for="(item, index) in chartData" :key="index" class="day-column">
          <div class="bars-group">
            <n-tooltip placement="top">
              <template #trigger>
                <div class="bar bar-in" :style="{ height: Math.max(item.inPercent, 1) + '%' }"></div>
              </template>
              入站：{{ formatFileSize(item.in) }}
            </n-tooltip>
            <n-tooltip placement="top">
              <template #trigger>
                <div class="bar bar-out" :style="{ height: Math.max(item.outPercent, 1) + '%' }"></div>
              </template>
              出站：{{ formatFileSize(item.out) }}
            </n-tooltip>
          </div>
          <div class="date-label">{{ item.date }}</div>
        </div>
      </div>
    </div>

    <div v-if="!loading && chartData.length > 0" class="legend">
      <div class="legend-item"><span class="dot in"></span>入站流量</div>
      <div class="legend-item"><span class="dot out"></span>出站流量</div>
    </div>

    <n-empty v-else-if="!loading" description="暂无流量数据" />
  </n-spin>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NEmpty, NSpin, NTooltip } from 'naive-ui'
import { formatFileSize } from '../utils/format'
import { getProxyTraffic } from '../api/proxy'
import { createMessageHelpers } from '../naive'

const props = defineProps<{
  proxyName: string
}>()
const message = createMessageHelpers()

const loading = ref(false)
const chartData = ref<
  Array<{
    date: string
    in: number
    out: number
    inPercent: number
    outPercent: number
  }>
>([])
const maxVal = ref(0)

const processData = (trafficIn: number[], trafficOut: number[]) => {
  const inArr = [...(trafficIn || [])].reverse()
  const outArr = [...(trafficOut || [])].reverse()

  while (inArr.length < 7) inArr.unshift(0)
  while (outArr.length < 7) outArr.unshift(0)

  const finalIn = inArr.slice(-7)
  const finalOut = outArr.slice(-7)

  const dates: string[] = []
  const d = new Date()
  d.setDate(d.getDate() - 6)

  for (let i = 0; i < 7; i++) {
    dates.push(`${d.getMonth() + 1}-${d.getDate()}`)
    d.setDate(d.getDate() + 1)
  }

  const maxIn = Math.max(...finalIn)
  const maxOut = Math.max(...finalOut)
  maxVal.value = Math.max(maxIn, maxOut, 100)

  chartData.value = dates.map((date, i) => ({
    date,
    in: finalIn[i],
    out: finalOut[i],
    inPercent: (finalIn[i] / maxVal.value) * 100,
    outPercent: (finalOut[i] / maxVal.value) * 100,
  }))
}

const fetchData = () => {
  loading.value = true
  getProxyTraffic(props.proxyName)
    .then((json) => {
      processData(json.trafficIn, json.trafficOut)
    })
    .catch((err) => {
      message.warning('获取流量信息失败：' + err)
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.traffic-chart-container {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: right;
  font-size: 12px;
  color: #909399;
  /* 移除多余的 height 估算，依赖父级 flex 布局和 padding 保持与柱子底部对齐 */
  padding-bottom: 24px;
}

/* 移除了无意义的 y-label 样式定义，直接内联或不声明，因仅用于文本颜色继承 */

.bars-area {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  padding-bottom: 24px;
  /* 柱子下方的日期预留空间 */
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e4e7ed;
  z-index: 0;
}

html.dark .grid-line {
  background-color: #3a3d5c;
}

.grid-line.top {
  top: 0;
}

.grid-line.middle {
  top: calc(50% - 12px);
  /* 修正：扣除底部 padding 的一半，使网格线真正居中于柱子区域 */
}

.grid-line.bottom {
  bottom: 24px;
}

.day-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  /* 移除 height: 100% 和 justify-content，交给父级统一处理 */
}

.bars-group {
  /* 占满从顶向下到 padding-bottom 的空间 */
  height: 100%;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 60%;
}

.bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 1px;
}

.bar-in {
  background-color: #5470c6;
}

.bar-out {
  background-color: #91cc75;
}

.bar:hover {
  opacity: 0.8;
}

.date-label {
  position: absolute;
  font-size: 12px;
  color: #909399;
  width: 100%;
  text-align: center;
  pointer-events: none; /* 🖱️ 让鼠标事件穿透文本，双重保险 */
}
.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

html.dark .legend-item {
  color: #e5e7eb;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.in {
  background-color: #5470c6;
}

.dot.out {
  background-color: #91cc75;
}
</style>