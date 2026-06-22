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

      <div v-else>
        <n-card :bordered="false">
          <div class="proxy-header">
            <div class="proxy-main">
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
              <div class="proxy-meta">
                <div class="proxy-title-row">
                  <n-text strong style="font-size: 20px;">{{ proxy.name }}</n-text>
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
                </div>
                <div class="proxy-subtitle-row">
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
                </div>
              </div>
            </div>
          </div>

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

          <div v-if="proxy.annotations && proxy.annotations.size > 0" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;">
            <n-tag v-for="[key, value] in proxy.annotations" :key="key" :bordered="false" size="small">
              {{ key }}: {{ value }}
            </n-tag>
          </div>
        </n-card>

        <n-card :bordered="false" title="流量统计">
          <n-spin :show="trafficLoading">
            <n-empty v-if="!trafficLoading && chartData.length === 0" description="暂无流量数据" />

            <div v-else>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
                  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                  <n-text depth="3">近 7 天流量</n-text>
                  <n-text depth="3">
                    峰值 {{ chartData.some(d => d.in > 0 || d.out > 0) ? formatFileSize(maxTrafficValue) : '0 B' }}
                  </n-text>
                </div>
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                  <span style="display:inline-flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;border-radius:999px;display:inline-block;background-color:#18a058;" />
                    <n-text depth="3">入站流量</n-text>
                  </span>
                  <span style="display:inline-flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;border-radius:999px;display:inline-block;background-color:#2080f0;" />
                    <n-text depth="3">出站流量</n-text>
                  </span>
                </div>
              </div>

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
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
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
import { getProxyByName } from '../api/proxy'
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
import { getProxyTraffic } from '../api/proxy'
import { formatFileSize } from '../utils/format'
import { createMessageHelpers } from '../naive'

use([BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

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
const chartData = ref<
  Array<{
    date: string
    in: number
    out: number
  }>
>([])
const maxTrafficValue = ref(0)

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
  const hasTraffic = chartData.value.some((item) => item.in > 0 || item.out > 0)
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
    legend: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
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
      axisLabel: {
        color: '#8c8c8c',
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      max: yMax,
      splitNumber: 4,
      axisLabel: {
        color: '#8c8c8c',
        formatter: (value: number) => formatFileSize(value),
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
        },
      },
    },
    series: [
      {
        name: '入站流量',
        type: 'bar',
        data: chartData.value.map((item) => item.in),
        barWidth: 14,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '出站流量',
        type: 'bar',
        data: chartData.value.map((item) => item.out),
        barWidth: 14,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
    graphic: hasTraffic
      ? []
      : [
          {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无流量数据',
              fill: '#8c8c8c',
              fontSize: 14,
            },
          },
        ],
  }
})

const processTrafficData = (trafficIn: number[], trafficOut: number[]) => {
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
  const realMax = Math.max(maxIn, maxOut)

  maxTrafficValue.value = realMax > 0 ? realMax : 102400

  chartData.value = dates.map((date, i) => {
    return {
      date,
      in: finalIn[i],
      out: finalOut[i],
    }
  })
}

const fetchTraffic = () => {
  if (!proxyName.value) return
  trafficLoading.value = true
  getProxyTraffic(proxyName.value)
    .then((json) => {
      processTrafficData(json.trafficIn, json.trafficOut)
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
