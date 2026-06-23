<template>
  <n-breadcrumb separator=">">
    <template v-if="fromClient">
      <n-breadcrumb-item>
        <router-link to="/clients" style="text-decoration: none;">客户端列表</router-link>
      </n-breadcrumb-item>
      <n-breadcrumb-item>
        <router-link :to="`/clients/${fromClient}`" style="text-decoration: none;">
          {{ fromClient }}
        </router-link>
      </n-breadcrumb-item>
    </template>
    <template v-else>
      <n-breadcrumb-item>
        <router-link to="/proxies" style="text-decoration: none;">代理列表</router-link>
      </n-breadcrumb-item>
      <n-breadcrumb-item v-if="proxy?.clientID">
        <router-link :to="clientLink" style="text-decoration: none;">
          {{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}
        </router-link>
      </n-breadcrumb-item>
    </template>
    <n-breadcrumb-item>{{ proxyName }}</n-breadcrumb-item>
  </n-breadcrumb>

  <n-spin :show="loading">
    <n-empty v-if="!proxy" description="该代理不存在，或已被移除。">
      <template #extra>
        <n-button type="primary" size="small" @click="router.push('/proxies')">
          返回代理列表
        </n-button>
      </template>
    </n-empty>

    <div v-else style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
      <n-card :bordered="false">
        <n-space :size="16" align="center" style="margin-bottom: 20px;">
          <n-avatar
            round
            :size="56"
            :style="{
              backgroundColor: proxyIconConfig.color,
              color: '#fff',
              fontSize: '26px',
              fontWeight: '700',
              flexShrink: 0,
            }"
          >
            {{ proxyIconConfig.text }}
          </n-avatar>
          
          <n-space vertical :size="6">
            <n-space align="center" :size="8">
              <n-text strong style="font-size: 20px; line-height: 1;">{{ proxy.name }}</n-text>
              <n-tag :bordered="false" size="small" type="info" round uppercase>
                {{ proxy.type }}
              </n-tag>
              <n-tag
                :bordered="false"
                size="small"
                :type="proxy.status === 'online' ? 'success' : 'default'"
                round
              >
                {{ proxy.status }}
              </n-tag>
            </n-space>
            
            <n-space align="center" :size="12">
              <n-button v-if="proxy.clientID" text @click="router.push(clientLink)">
                <template #icon>
                  <n-icon><DeviceDesktop /></n-icon>
                </template>
                {{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}
              </n-button>
              <n-text v-if="proxy.lastStartTime" depth="3">
                最近启动 {{ proxy.lastStartTime }}
              </n-text>
              <n-text v-if="proxy.lastCloseTime" depth="3">
                最近关闭 {{ proxy.lastCloseTime }}
              </n-text>
            </n-space>
          </n-space>
        </n-space>

        <n-grid responsive="screen" cols="1 s:3" :x-gap="12" :y-gap="12">
          <n-grid-item v-if="proxy.port">
            <n-card size="small">
              <n-statistic label="端口" :value="proxy.port" />
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card size="small">
              <n-statistic label="连接数" :value="proxy.conns" />
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card size="small">
              <n-statistic label="流量">
                <template #default>
                  <n-space align="center" :size="4">
                    <n-text strong>↓ {{ formatFileSize(proxy.trafficIn) }}</n-text>
                    <n-text depth="3">/</n-text>
                    <n-text strong>↑ {{ formatFileSize(proxy.trafficOut) }}</n-text>
                  </n-space>
                </template>
              </n-statistic>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-card>

      <n-card :bordered="false">
        <template #header>
          <n-space>
            <n-icon :size="18"><Settings /></n-icon>
            <n-text strong>配置信息</n-text>
          </n-space>
        </template>

        <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="12">
          <n-grid-item v-if="proxy.encryption !== undefined">
            <n-card size="small">
              <n-space align="center" :size="12">
                <n-tag :bordered="false" type="success" round>加密</n-tag>
                <n-text>{{ proxy.encryption ? '已启用' : '未启用' }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>

          <n-grid-item v-if="proxy.compression !== undefined">
            <n-card size="small">
              <n-space align="center" :size="12">
                <n-tag :bordered="false" type="info" round>压缩</n-tag>
                <n-text>{{ proxy.compression ? '已启用' : '未启用' }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>

          <n-grid-item v-if="proxy.customDomains">
            <n-card size="small">
              <n-space vertical :size="4">
                <n-text depth="3">自定义域名</n-text>
                <n-text strong>{{ proxy.customDomains }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>

          <n-grid-item v-if="proxy.subdomain">
            <n-card size="small">
              <n-space vertical :size="4">
                <n-text depth="3">子域名</n-text>
                <n-text strong>{{ proxy.subdomain }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>

          <n-grid-item v-if="proxy.locations">
            <n-card size="small">
              <n-space vertical :size="4">
                <n-text depth="3">路由路径</n-text>
                <n-text strong>{{ proxy.locations }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>

          <n-grid-item v-if="proxy.hostHeaderRewrite">
            <n-card size="small">
              <n-space vertical :size="4">
                <n-text depth="3">Host 重写</n-text>
                <n-text strong>{{ proxy.hostHeaderRewrite }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>

          <n-grid-item v-if="proxy.multiplexer">
            <n-card size="small">
              <n-space vertical :size="4">
                <n-text depth="3">复用器</n-text>
                <n-text strong>{{ proxy.multiplexer }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>

          <n-grid-item v-if="proxy.routeByHTTPUser">
            <n-card size="small">
              <n-space vertical :size="4">
                <n-text depth="3">按 HTTP 用户路由</n-text>
                <n-text strong>{{ proxy.routeByHTTPUser }}</n-text>
              </n-space>
            </n-card>
          </n-grid-item>
        </n-grid>

        <div v-if="proxy.annotations && proxy.annotations.size > 0" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;">
          <n-tag v-for="[key, value] in proxy.annotations" :key="key" :bordered="false" size="small">
            {{ key }}: {{ value }}
          </n-tag>
        </div>
      </n-card>

      <n-card :bordered="false" title="流量统计">
        <n-spin :show="trafficLoading">
          <n-empty v-if="!trafficLoading && chartData.length === 0" description="暂无流量数据" />

          <div v-else>
            <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
              <n-space :size="12">
                <n-text depth="3">近 7 天流量</n-text>
                <n-text depth="3">峰值 {{ hasTraffic ? formatFileSize(maxTrafficValue) : '0 B' }}</n-text>
              </n-space>
              <n-space :size="12">
                <n-space :size="6" align="center">
                  <span class="traffic-legend-dot color-in" />
                  <n-text depth="3">入站流量</n-text>
                </n-space>
                <n-space :size="6" align="center">
                  <span class="traffic-legend-dot color-out" />
                  <n-text depth="3">出站流量</n-text>
                </n-space>
              </n-space>
            </n-space>

            <v-chart class="traffic-chart" :option="trafficChartOption" autoresize />
          </div>
        </n-spin>
      </n-card>
    </div>
  </n-spin>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NAvatar,
  NButton,
  NCard,
  NEmpty,
  NGrid,
  NGridItem,
  NIcon,
  NSpace,
  NSpin,
  NStatistic,
  NTag,
  NText,
} from 'naive-ui'
import { DeviceDesktop, Settings } from '@vicons/tabler'
import { getProxyByName, getProxyTraffic } from '../api/proxy'
import { getServerInfo } from '../api/server'
import {
  BaseProxy,
  TCPProxy,
  UDPProxy,
  HTTPProxy,
  HTTPSProxy,
  TCPMuxProxy,
  STCPProxy,
  SUDPProxy,
} from '../utils/proxy'
import { formatFileSize } from '../utils/format'
import { createMessageHelpers } from '../naive'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const route = useRoute()
const router = useRouter()
const message = createMessageHelpers()
const proxyName = computed(() => route.params.name as string)
const fromClient = computed(() => {
  if (route.query.from === 'client' && route.query.client) {
    return route.query.client as string
  }
  return null
})
const proxy = ref<BaseProxy | null>(null)
const loading = ref(true)
const trafficLoading = ref(false)
const chartData = ref<Array<{ date: string; in: number; out: number }>>([])
const maxTrafficValue = ref(0)
const hasTraffic = computed(() => chartData.value.some((item) => item.in > 0 || item.out > 0))

let serverInfo: any = null

const clientLink = computed(() => {
  if (!proxy.value) return ''
  const key = proxy.value.user ? `${proxy.value.user}.${proxy.value.clientID}` : proxy.value.clientID
  return `/clients/${key}`
})

const proxyIconConfig = computed(() => {
  const type = proxy.value?.type?.toLowerCase() || 'tcp'
  const firstChar = type.charAt(0).toUpperCase()

  const colors: Record<string, string> = {
    tcp: '#18a058',
    udp: '#2080f0',
    http: '#18a058',
    https: '#f0a020',
    stcp: '#d03050',
    sudp: '#f0a020',
    tcpmux: '#2080f0',
    xtcp: '#18a058',
  }

  return {
    text: firstChar,
    color: colors[type] || '#18a058',
  }
})

const trafficChartOption = computed<EChartsOption>(() => {
  const yMax = maxTrafficValue.value > 0 ? maxTrafficValue.value : 102400

  return {
    color: ['#18a058', '#2080f0'],
    animationDuration: 220,
    grid: {
      left: 16,
      right: 16,
      top: 16,
      bottom: 44,
      containLabel: true,
    },
    legend: { show: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params]
        const label = items[0]?.axisValue ?? ''
        const lines = items.map((item) => {
          const value = Number(item.data ?? 0)
          const color = item.color as string
          return `<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <span style="width:10px;height:10px;border-radius:999px;background:${color};display:inline-block;"></span>
            <span>${item.seriesName}：${formatFileSize(value)}</span>
          </div>`
        })

        return `<div style="min-width:160px;">
          <div>${label}</div>
          ${lines.join('')}
        </div>`
      },
    },
    xAxis: {
      type: 'category',
      data: chartData.value.map((item) => item.date),
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#8c8c8c', interval: 0 },
    },
    yAxis: {
      type: 'value',
      max: yMax,
      splitNumber: 4,
      axisLabel: {
        color: '#8c8c8c',
        formatter: (value: number) => formatFileSize(value),
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        name: '入站流量',
        type: 'bar',
        data: chartData.value.map((item) => item.in),
        barWidth: 14,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '出站流量',
        type: 'bar',
        data: chartData.value.map((item) => item.out),
        barWidth: 14,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
    // 移除了内部冗余的无数据 graphic，外部已有 n-empty 包装
    graphic: [],
  }
})

const normalizeTrafficSeries = (series: number[]) => {
  const normalized = [...(series || [])].reverse()
  while (normalized.length < 7) normalized.unshift(0)
  return normalized.slice(-7)
}

const fetchTraffic = () => {
  if (!proxyName.value) return
  trafficLoading.value = true
  getProxyTraffic(proxyName.value)
    .then((json) => {
      const finalIn = normalizeTrafficSeries(json.trafficIn)
      const finalOut = normalizeTrafficSeries(json.trafficOut)
      const dates: string[] = []
      const d = new Date()
      d.setDate(d.getDate() - 6)

      for (let i = 0; i < 7; i++) {
        dates.push(`${d.getMonth() + 1}-${d.getDate()}`)
        d.setDate(d.getDate() + 1)
      }

      maxTrafficValue.value = Math.max(...finalIn, ...finalOut, 102400)
      chartData.value = dates.map((date, i) => ({
        date,
        in: finalIn[i],
        out: finalOut[i],
      }))
    })
    .catch((err) => {
      message.warning('获取流量信息失败：' + err)
    })
    .finally(() => {
      trafficLoading.value = false
    })
}

const fetchServerInfo = async () => {
  if (serverInfo) return serverInfo
  serverInfo = await getServerInfo()
  return serverInfo
}

const fetchProxy = async () => {
  const name = proxyName.value
  if (!name) {
    loading.value = false
    return
  }
  try {
    const data = await getProxyByName(name)
    const info = await fetchServerInfo()
    const type = data.conf?.type || ''

    if (type === 'tcp') proxy.value = new TCPProxy(data)
    else if (type === 'udp') proxy.value = new UDPProxy(data)
    else if (type === 'http' && info?.vhostHTTPPort) proxy.value = new HTTPProxy(data, info.vhostHTTPPort, info.subdomainHost)
    else if (type === 'https' && info?.vhostHTTPSPort) proxy.value = new HTTPSProxy(data, info.vhostHTTPSPort, info.subdomainHost)
    else if (type === 'tcpmux' && info?.tcpmuxHTTPConnectPort) proxy.value = new TCPMuxProxy(data, info.tcpmuxHTTPConnectPort, info.subdomainHost)
    else if (type === 'stcp') proxy.value = new STCPProxy(data)
    else if (type === 'sudp') proxy.value = new SUDPProxy(data)
    else {
      proxy.value = new BaseProxy(data)
      proxy.value.type = type
    }
  } catch (error: any) {
    message.error('获取代理详情失败：' + error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProxy()
  fetchTraffic()
})
</script>

<style scoped>
.traffic-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}

.traffic-legend-dot.color-in {
  background-color: #18a058;
}

.traffic-legend-dot.color-out {
  background-color: #2080f0;
}

.traffic-chart {
  width: 100%;
  height: 320px;
  min-height: 320px;
}
</style>